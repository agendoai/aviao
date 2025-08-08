
import React, { useState } from 'react';
import { searchAirport } from '@/utils/aisweb';
import { calculateDistance } from '@/utils/distance';

const DestinationStep: React.FC = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculateDistance = async () => {
    setLoading(true);
    setError(null);
    try {
      const originData = await searchAirport(origin);
      const destData = await searchAirport(destination);
      // Ajuste conforme resposta real da API do AISWEB
      const lat1 = parseFloat(originData.latitude || originData.lat);
      const lon1 = parseFloat(originData.longitude || originData.lon);
      const lat2 = parseFloat(destData.latitude || destData.lat);
      const lon2 = parseFloat(destData.longitude || destData.lon);
      if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        setError('Não foi possível obter as coordenadas dos aeroportos.');
        setDistance(null);
      } else {
        setDistance(calculateDistance(lat1, lon1, lat2, lon2));
      }
    } catch (err: any) {
      setError('Erro ao buscar aeroportos ou calcular distância.');
      setDistance(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="origin">Origem (ICAO/IATA):</label>
        <input
          id="origin"
          type="text"
          value={origin}
          onChange={e => setOrigin(e.target.value.toUpperCase())}
          className="border rounded px-2 py-1 ml-2"
        />
      </div>
      <div>
        <label htmlFor="destination">Destino (ICAO/IATA):</label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={e => setDestination(e.target.value.toUpperCase())}
          className="border rounded px-2 py-1 ml-2"
        />
      </div>
      <button
        onClick={handleCalculateDistance}
        disabled={loading || !origin || !destination}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Calculando...' : 'Calcular Distância'}
      </button>
      {distance !== null && !error && (
        <div className="mt-2 text-green-700 font-bold">
          Distância: {distance.toFixed(1)} NM
        </div>
      )}
      {error && <div className="mt-2 text-red-600">{error}</div>}
    </div>
  );
};

export default DestinationStep;
