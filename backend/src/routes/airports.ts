import { Router } from 'express';
import { prisma } from '../db';
import fetch from 'node-fetch';

const router = Router();

router.get('/', async (req, res) => {
  const airports = await prisma.airport.findMany();
  res.json(airports);
});

// Proxy para coordenadas AISWEB
router.get('/coords', async (req, res) => {
  try {
    const icao = String(req.query.icao || '').toUpperCase();
    if (!icao) {
      return res.status(400).json({ error: 'Parâmetro icao é obrigatório' });
    }

    const apiKey = process.env.AISWEB_API_KEY;
    const apiPass = process.env.AISWEB_API_PASS;

    if (!apiKey || !apiPass) {
      return res.status(500).json({ error: 'Credenciais AISWEB não configuradas' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('http://www.aisweb.aer.mil.br/api/airport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, api_pass: apiPass, search: icao }),
      signal: controller.signal as any
    } as any);

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Falha ao consultar AISWEB' });
    }

    const data = (await response.json()) as any;
    if (data?.airports && Array.isArray(data.airports) && data.airports.length > 0) {
      const airport = data.airports[0] as any;
      return res.json({
        lat: parseFloat(airport.latitude),
        lon: parseFloat(airport.longitude)
      });
    }

    return res.status(404).json({ error: 'Aeroporto não encontrado' });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout ao consultar AISWEB' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;


