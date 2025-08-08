import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export interface AuthPayload {
  userId: string;
  email: string;
  role?: string;
}

export function generateToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log('🔍 AuthMiddleware - Verificando autenticação...');
  console.log('🔐 JWT_SECRET definido:', !!JWT_SECRET);
  console.log('🔐 JWT_SECRET valor:', JWT_SECRET);
  console.log('📋 Headers completos:', req.headers);
  console.log('📋 Authorization header:', req.headers.authorization);
  
  // Usar apenas o header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Header Authorization não encontrado ou inválido');
    console.log('❌ AuthHeader:', authHeader);
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  console.log('🔑 Token extraído do header:', token ? 'Presente' : 'Ausente');
  console.log('🔑 Token completo:', token);
  
  try {
    console.log('🔐 Verificando token...');
    console.log('🔐 JWT_SECRET usado:', JWT_SECRET);
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    console.log('✅ Token válido para usuário:', payload.userId);
    console.log('✅ Payload completo:', payload);
    (req as any).user = payload;
    next();
  } catch (err) {
    console.log('❌ Token inválido:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
} 