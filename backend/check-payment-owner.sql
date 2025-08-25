-- Verificar a qual usuário pertence o paymentId pay_9eqfjugg5vj68orh

-- Verificar se existe na tabela de mensalidades
SELECT 
    'membership' as tipo,
    mp.id,
    mp.userId,
    u.name as nome_usuario,
    u.email as email_usuario,
    u.asaasSubscriptionId,
    mp.status,
    mp.paymentId,
    mp.subscriptionId,
    mp.dueDate,
    mp.value
FROM "MembershipPayment" mp
JOIN "User" u ON mp.userId = u.id
WHERE mp.paymentId = 'pay_9eqfjugg5vj68orh';

-- Verificar se existe na tabela de reservas
SELECT 
    'booking' as tipo,
    b.id,
    b.userId,
    u.name as nome_usuario,
    u.email as email_usuario,
    u.asaasCustomerId,
    b.status,
    b.paymentId,
    b.value,
    b.departure_date,
    b.return_date
FROM "Booking" b
JOIN "User" u ON b.userId = u.id
WHERE b.paymentId = 'pay_9eqfjugg5vj68orh';
