export async function createPixChargeForBooking(customerId: string, value: number, description: string) {
  // Mock: retorna um objeto de pagamento simulado
  return { id: 'mock-payment-id', status: 'PENDING' };
}

export async function getPixQrCode(paymentId: string) {
  // Mock: retorna dados simulados de QR Code
  return { payload: 'mock-copia-e-cola', encodedImage: 'mock-base64-image' };
}

export async function getPaymentStatus(paymentId: string) {
  // Mock: retorna status simulado
  return { status: 'PENDING' };
} 