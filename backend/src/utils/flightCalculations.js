// Funções para cálculos de voo
const BRAZILIAN_AIRPORTS = [
  { icao: 'SBAU', name: 'Araçatuba', city: 'Araçatuba', state: 'SP', latitude: -21.1411, longitude: -50.4247 },
  { icao: 'SBBS', name: 'Brasília - Presidente Juscelino Kubitschek', city: 'Brasília', state: 'DF', latitude: -15.8691, longitude: -47.9208 },
  { icao: 'SBKP', name: 'Campinas - Viracopos', city: 'Campinas', state: 'SP', latitude: -23.0074, longitude: -47.1345 },
  { icao: 'SBAR', name: 'Aracaju - Santa Maria', city: 'Aracaju', state: 'SE', latitude: -10.9841, longitude: -37.0703 },
  { icao: 'SBGR', name: 'São Paulo - Guarulhos', city: 'São Paulo', state: 'SP', latitude: -23.4356, longitude: -46.4731 },
  { icao: 'SBSP', name: 'São Paulo - Congonhas', city: 'São Paulo', state: 'SP', latitude: -23.6273, longitude: -46.6566 },
  { icao: 'SBFL', name: 'Florianópolis - Hercílio Luz', city: 'Florianópolis', state: 'SC', latitude: -27.6705, longitude: -48.5477 },
  { icao: 'SBPA', name: 'Porto Alegre - Salgado Filho', city: 'Porto Alegre', state: 'RS', latitude: -29.9939, longitude: -51.1754 },
  { icao: 'SBBH', name: 'Belo Horizonte - Pampulha', city: 'Belo Horizonte', state: 'MG', latitude: -19.8512, longitude: -43.9506 },
  { icao: 'SBRJ', name: 'Rio de Janeiro - Santos Dumont', city: 'Rio de Janeiro', state: 'RJ', latitude: -22.9104, longitude: -43.1631 }
];

// Função para calcular distância entre dois pontos em milhas náuticas
function calculateDistanceNM(originICAO, destinationICAO) {
  const origin = BRAZILIAN_AIRPORTS.find(airport => airport.icao === originICAO);
  const destination = BRAZILIAN_AIRPORTS.find(airport => airport.icao === destinationICAO);
  
  if (!origin || !destination) {
    console.warn(`Aeroporto não encontrado: ${originICAO} ou ${destinationICAO}`);
    return 100; // Distância padrão se não encontrar
  }
  
  const R = 3440.065; // Raio da Terra em milhas náuticas
  
  const lat1 = origin.latitude * Math.PI / 180;
  const lon1 = origin.longitude * Math.PI / 180;
  const lat2 = destination.latitude * Math.PI / 180;
  const lon2 = destination.longitude * Math.PI / 180;
  
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  
  const a = Math.sin(dlat/2) * Math.sin(dlat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dlon/2) * Math.sin(dlon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Função para obter velocidade da aeronave baseada no modelo
function getAircraftSpeed(aircraftModel) {
  const model = aircraftModel.toLowerCase();
  
  if (model.includes('cessna') || model.includes('172')) {
    return 97; // Cessna 172: ~97 KT (180 km/h)
  } else if (model.includes('piper') || model.includes('cherokee')) {
    return 103; // Piper Cherokee: ~103 KT (190 km/h)
  } else if (model.includes('beechcraft') || model.includes('bonanza') || model.includes('baron')) {
    return 190; // Beechcraft Baron E-55: ~190 KT (350 km/h)
  } else if (model.includes('cirrus')) {
    return 135; // Cirrus SR22: ~135 KT (250 km/h)
  } else {
    return 108; // Velocidade padrão para aeronaves pequenas (~200 km/h)
  }
}

module.exports = {
  calculateDistanceNM,
  getAircraftSpeed
};
