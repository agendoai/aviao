-- Adicionar campos para integração com Asaas
ALTER TABLE "User" ADD COLUMN "cpfCnpj" TEXT;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Criar tabela MembershipPayment
CREATE TABLE "MembershipPayment" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MembershipPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Adicionar índice para melhor performance
CREATE INDEX "MembershipPayment_userId_idx" ON "MembershipPayment"("userId");
CREATE INDEX "MembershipPayment_status_idx" ON "MembershipPayment"("status");

