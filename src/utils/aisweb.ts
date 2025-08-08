const AISWEB_API_KEY = "2084251695";
const AISWEB_API_PASS = "c406b683-631a-11f0-a1fe-0050569ac2e1";
const AISWEB_BASE_URL = "http://www.aisweb.aer.mil.br/api/";

// Exemplo de busca por ICAO/IATA (ajuste endpoint conforme documentação real)
export async function searchAirport(iataOrIcao: string) {
  // Exemplo de endpoint, ajuste conforme docs reais:
  const url = `${AISWEB_BASE_URL}localidade?apiKey=${AISWEB_API_KEY}&apiPass=${AISWEB_API_PASS}&localidade=${iataOrIcao}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar aeroporto no AISWEB");
  return res.json();
} 