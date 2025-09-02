const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

interface AsaasPayment {
  id: string;
  status: string;
  pixQrCode?: string;
  pixQrCodeImage?: string;
  pixCopiaCola?: string;
}

interface AsaasPixResponse {
  payload: string;
  encodedImage: string;
}

export async function createPixChargeForBooking(customerId: string, value: number, description: string): Promise<AsaasPayment> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return { id: 'mock-payment-id', status: 'PENDING' };
  }

  // Verificar se o customerId é válido
  if (!customerId || customerId.trim() === '') {
    throw new Error('Customer ID é obrigatório para criar cobrança');
  }

  // Verificar se o cliente existe no Asaas
  const customerExists = await checkCustomerExists(customerId);
  if (!customerExists) {
    throw new Error(`Cliente ${customerId} não encontrado no Asaas`);
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: value,
        dueDate: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
        description: description,
        externalReference: `booking-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao criar cobrança Asaas:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const payment = await response.json();
    
    return {
      id: payment.id,
      status: payment.status,
    };
  } catch (error) {
    console.error('Erro ao criar cobrança PIX:', error);
    throw error;
  }
}

export async function getPixQrCode(paymentId: string): Promise<AsaasPixResponse> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return { 
      payload: 'mock-copia-e-cola-123456789', 
      encodedImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' 
    };
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: {
        'access_token': ASAAS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao gerar QR Code PIX:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const pixData = await response.json();
    
    return {
      payload: pixData.encodedImage,
      encodedImage: `data:image/png;base64,${pixData.encodedImage}`,
    };
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error);
    throw error;
  }
}

export async function getPaymentStatus(paymentId: string): Promise<{ status: string }> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return { status: 'PENDING' };
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'access_token': ASAAS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao consultar status do pagamento:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const payment = await response.json();
    
    return {
      status: payment.status,
    };
  } catch (error) {
    console.error('Erro ao consultar status do pagamento:', error);
    throw error;
  }
}

// Função para criar cliente no Asaas
export async function createAsaasCustomer(userData: {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
}): Promise<string> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return 'mock-customer-id';
  }

  try {
    // Preparar dados para o Asaas
    const asaasData: any = {
      name: userData.name,
      email: userData.email,
    };

    // Adicionar CPF/CNPJ se fornecido (remover formatação)
    if (userData.cpfCnpj) {
      asaasData.cpfCnpj = userData.cpfCnpj.replace(/\D/g, '');
    }

    // Adicionar telefone se fornecido (remover formatação)
    if (userData.phone) {
      asaasData.phone = userData.phone.replace(/\D/g, '');
    }



    const response = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify(asaasData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao criar cliente Asaas:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const customer = await response.json();
    return customer.id;
  } catch (error) {
    console.error('Erro ao criar cliente Asaas:', error);
    throw error;
  }
}

// Função para criar assinatura recorrente no Asaas
export async function createSubscription(customerId: string, value: number, description: string): Promise<{ id: string; status: string }> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return { id: 'mock-subscription-id', status: 'ACTIVE' };
  }

  // Verificar se o customerId é válido
  if (!customerId || customerId.trim() === '') {
    throw new Error('Customer ID é obrigatório para criar assinatura');
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: value,
        nextDueDate: new Date().toISOString().split('T')[0], // Data atual
        cycle: 'MONTHLY', // Mensal
        description: description,
        endDate: null, // Sem data de fim (recorrente)
        maxPayments: null, // Sem limite de pagamentos
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao criar assinatura Asaas:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const subscription = await response.json();
    
    return {
      id: subscription.id,
      status: subscription.status,
    };
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    throw error;
  }
}

// Função para atualizar assinatura no Asaas
export async function updateSubscription(subscriptionId: string, newValue: number): Promise<{ status: string }> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return { status: 'UPDATED' };
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify({
        value: newValue
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao atualizar assinatura Asaas:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const result = await response.json();
    // console.log(`✅ Assinatura ${subscriptionId} atualizada para R$ ${newValue}`);
    
    return {
      status: result.status,
    };
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    throw error;
  }
}

// Função para cancelar assinatura no Asaas
export async function cancelSubscription(subscriptionId: string): Promise<{ status: string }> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return { status: 'CANCELLED' };
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao cancelar assinatura Asaas:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const result = await response.json();
    
    return {
      status: result.status,
    };
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
}

// Função para consultar status da assinatura
export async function getSubscriptionStatus(subscriptionId: string): Promise<{ status: string }> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return { status: 'ACTIVE' };
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'access_token': ASAAS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao consultar assinatura Asaas:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const subscription = await response.json();
    
    return {
      status: subscription.status,
    };
  } catch (error) {
    console.error('Erro ao consultar assinatura:', error);
    throw error;
  }
} 

// Função para verificar se o cliente existe no Asaas
export async function checkCustomerExists(customerId: string): Promise<boolean> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return true; // Mock sempre retorna true
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'access_token': ASAAS_API_KEY,
      },
    });

    if (response.ok) {
      const customer = await response.json();
      // console.log('✅ Cliente encontrado no Asaas:', customer.name);
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ Cliente não encontrado no Asaas:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar cliente no Asaas:', error);
    return false;
  }
}

// Função para buscar próxima cobrança pendente da assinatura
export async function getNextPendingPayment(subscriptionId: string): Promise<any> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return { id: 'mock-payment-id', status: 'PENDING' };
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}/payments`, {
      headers: {
        'access_token': ASAAS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao buscar cobranças da assinatura:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const payments = await response.json();
    
    // Buscar a próxima cobrança pendente
    const pendingPayment = payments.data?.find((payment: any) => 
      payment.status === 'PENDING' || payment.status === 'OVERDUE'
    );

    return pendingPayment || null;
  } catch (error) {
    console.error('Erro ao buscar próxima cobrança pendente:', error);
    throw error;
  }
}

// Função para buscar todas as cobranças de uma assinatura
export async function getSubscriptionPayments(subscriptionId: string): Promise<any[]> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return [];
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}/payments`, {
      headers: {
        'access_token': ASAAS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao buscar cobranças da assinatura:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const payments = await response.json();
    return payments.data || [];
  } catch (error) {
    console.error('Erro ao buscar cobranças da assinatura:', error);
    throw error;
  }
}

// Função para sincronizar status de uma cobrança específica com o Asaas
export async function syncPaymentStatus(paymentId: string): Promise<any> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, usando mock');
    return { id: paymentId, status: 'PENDING' };
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      headers: {
        'access_token': ASAAS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao sincronizar status da cobrança:', errorData);
      throw new Error(`Erro Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const payment = await response.json();
    // console.log(`🔄 Status sincronizado para cobrança ${paymentId}: ${payment.status}`);
    
    return payment;
  } catch (error) {
    console.error('Erro ao sincronizar status da cobrança:', error);
    throw error;
  }
}

// Função para sincronizar todas as cobranças pendentes de um usuário
export async function syncUserPaymentsStatus(userId: number, subscriptionId: string): Promise<{ updated: number; errors: number }> {
  if (!ASAAS_API_KEY) {
    console.warn('ASAAS_API_KEY não configurada, pulando sincronização');
    return { updated: 0, errors: 0 };
  }

  try {
    // console.log(`🔄 Sincronizando cobranças do usuário ${userId} (assinatura ${subscriptionId})...`);
    
    // Buscar cobranças da assinatura no Asaas
    const asaasPayments = await getSubscriptionPayments(subscriptionId);
    
    // Buscar mensalidades do usuário no banco local
    const { prisma } = await import('../db');
    const localMemberships = await prisma.membershipPayment.findMany({
      where: { 
        userId,
        subscriptionId 
      }
    });

    let updated = 0;
    let errors = 0;

    // Comparar e atualizar status
    for (const asaasPayment of asaasPayments) {
      const localMembership = localMemberships.find(m => m.paymentId === asaasPayment.id);
      
      if (localMembership && localMembership.status !== mapAsaasStatusToLocal(asaasPayment.status)) {
        try {
          await prisma.membershipPayment.update({
            where: { id: localMembership.id },
            data: { status: mapAsaasStatusToLocal(asaasPayment.status) }
          });
          
          // console.log(`✅ Cobrança ${asaasPayment.id} atualizada: ${localMembership.status} → ${mapAsaasStatusToLocal(asaasPayment.status)}`);
          updated++;
        } catch (error) {
          console.error(`❌ Erro ao atualizar cobrança ${asaasPayment.id}:`, error);
          errors++;
        }
      }
    }

    // Atualizar status do usuário após sincronização (sempre verificar)
    const { updateUserStatus } = await import('./userStatus');
    const userStatusResult = await updateUserStatus(userId);
    // console.log(`✅ Status do usuário ${userId} atualizado após sincronização: ${userStatusResult.status}`);

    // console.log(`🎯 Sincronização concluída: ${updated} atualizações, ${errors} erros`);
    return { updated, errors };
    
  } catch (error) {
    console.error('Erro ao sincronizar cobranças do usuário:', error);
    throw error;
  }
}

// Função para mapear status do Asaas para status local
function mapAsaasStatusToLocal(asaasStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'PENDING': 'pendente',
    'CONFIRMED': 'confirmada',
    'RECEIVED': 'confirmada',
    'OVERDUE': 'atrasada',
    'CANCELLED': 'cancelada',
    'REFUNDED': 'cancelada',
    'RECEIVED_IN_CASH': 'paga'
  };
  
  return statusMap[asaasStatus] || 'pendente';
} 
