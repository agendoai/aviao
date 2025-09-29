-- Verificar total de usuários
SELECT COUNT(*) as total_usuarios FROM "User";

-- Verificar usuários COM asaasCustomerId
SELECT COUNT(*) as usuarios_com_asaas FROM "User" 
WHERE "asaasCustomerId" IS NOT NULL AND "asaasCustomerId" != '';

-- Verificar usuários SEM asaasCustomerId
SELECT COUNT(*) as usuarios_sem_asaas FROM "User" 
WHERE "asaasCustomerId" IS NULL OR "asaasCustomerId" = '';

-- Listar todos os usuários COM asaasCustomerId
SELECT id, name, email, "asaasCustomerId", "createdAt" 
FROM "User" 
WHERE "asaasCustomerId" IS NOT NULL AND "asaasCustomerId" != ''
ORDER BY id;

-- Listar todos os usuários SEM asaasCustomerId
SELECT id, name, email, "asaasCustomerId", "createdAt" 
FROM "User" 
WHERE "asaasCustomerId" IS NULL OR "asaasCustomerId" = ''
ORDER BY id;

-- Verificar usuários criados na última semana
SELECT COUNT(*) as usuarios_ultima_semana FROM "User" 
WHERE "createdAt" > NOW() - INTERVAL '7 days';

-- Verificar usuários da última semana COM asaasCustomerId
SELECT COUNT(*) as usuarios_ultima_semana_com_asaas FROM "User" 
WHERE "createdAt" > NOW() - INTERVAL '7 days' 
AND "asaasCustomerId" IS NOT NULL AND "asaasCustomerId" != '';

-- Verificar usuários da última semana SEM asaasCustomerId
SELECT COUNT(*) as usuarios_ultima_semana_sem_asaas FROM "User" 
WHERE "createdAt" > NOW() - INTERVAL '7 days' 
AND ("asaasCustomerId" IS NULL OR "asaasCustomerId" = '');















