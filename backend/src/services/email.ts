import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Configuração do transporter de email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Gerar token de recuperação de senha
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Enviar email de recuperação de senha
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@reservaaviao.com',
      to: email,
      subject: 'Recuperação de Senha - Reserva Avião',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Recuperação de Senha</h2>
          
          <p>Olá, <strong>${userName}</strong>!</p>
          
          <p>Você solicitou a recuperação de sua senha. Clique no botão abaixo para redefinir sua senha:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          
          <p>Ou copie e cole o link abaixo em seu navegador:</p>
          <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
          
          <p><strong>Este link expira em 1 hora.</strong></p>
          
          <p>Se você não solicitou esta recuperação, ignore este email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px;">
            Atenciosamente,<br>
            Equipe Reserva Avião
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    return false;
  }
};

// Verificar se o email está configurado
export const isEmailConfigured = (): boolean => {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
};