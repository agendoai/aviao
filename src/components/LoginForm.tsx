
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plane, Mail, Lock, User, CreditCard, Phone, KeyRound, Eye, EyeClosed } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Funções de validação e máscaras
const formatCPF = (value: string): string => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');

  // Aplica a máscara
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

const formatPhone = (value: string): string => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');

  // Aplica a máscara
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

const validateCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
};

const validatePhone = (phone: string): boolean => {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');

  // Verifica se tem 10 ou 11 dígitos (com DDD)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) return false;

  // Verifica se o DDD é válido (11-99)
  const ddd = parseInt(cleanPhone.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  // Verifica se não são todos os mesmos números
  if (/^(\d)\1{9,10}$/.test(cleanPhone)) return false;

  // Verifica se não começa com 000, 111, 222, etc.
  if (/^(\d)\1{2}/.test(cleanPhone)) return false;

  // Verifica se não é uma sequência (1234567890, 9876543210, etc.)
  if (/^(0123456789|1234567890|9876543210|0987654321)$/.test(cleanPhone)) return false;

  // DDDs válidos no Brasil (excluindo alguns que não existem)
  const validDDDs = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
    71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99
  ];

  if (!validDDDs.includes(ddd)) return false;

  return true;
};

const LoginForm: React.FC = () => {
  const { signIn, signUp, loading, user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [signupErrors, setSignupErrors] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      return;
    }

    const { error } = await signIn(loginData.email, loginData.password);

    if (error) {
      toast.error(error.message || "Erro no login");
    } else {
      toast.success("Login realizado com sucesso!");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotPasswordEmail.trim()) {
      toast.error("Por favor, digite seu email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail.trim())) {
      toast.error("Por favor, digite um email válido.");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Email enviado! Verifique seu email para continuar os passos de recuperação.");
        setIsDialogOpen(false);
        setForgotPasswordEmail('');
      } else {
        toast.error(data.error || "Erro ao enviar email de recuperação. Tente novamente.");
      }
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      toast.error("Erro ao enviar email de recuperação. Tente novamente.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const validateSignupForm = (): boolean => {
    const errors = {
      name: '',
      email: '',
      cpfCnpj: '',
      phone: '',
      password: '',
      confirmPassword: ''
    };

    // Validação do nome
    if (!signupData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (signupData.name.trim().length < 3) {
      errors.name = 'Nome deve ter pelo menos 3 caracteres';
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(signupData.name.trim())) {
      errors.name = 'Nome deve conter apenas letras';
    }

    // Validação do email
    if (!signupData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
      errors.email = 'Email inválido';
    }

    // Validação do CPF
    if (!signupData.cpfCnpj.trim()) {
      errors.cpfCnpj = 'CPF é obrigatório';
    } else if (!validateCPF(signupData.cpfCnpj)) {
      errors.cpfCnpj = 'CPF inválido';
    }

    // Validação do telefone
    if (!signupData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(signupData.phone)) {
      const cleanPhone = signupData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        errors.phone = 'Telefone deve ter 10 ou 11 dígitos';
      } else if (cleanPhone.length === 10 || cleanPhone.length === 11) {
        const ddd = parseInt(cleanPhone.slice(0, 2));
        if (ddd < 11 || ddd > 99) {
          errors.phone = 'DDD inválido';
        } else {
          errors.phone = 'Telefone inválido (use um número real)';
        }
      }
    }

    // Validação da senha
    if (!signupData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (signupData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    // Validação da confirmação de senha
    if (!signupData.confirmPassword) {
      errors.confirmPassword = 'Confirme sua senha';
    } else if (signupData.password !== signupData.confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }

    setSignupErrors(errors);

    // Retorna true se não há erros
    return !Object.values(errors).some(error => error !== '');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSignupForm()) {
      toast.error("Por favor, corrija os erros no formulário.");
      return;
    }

    const { error, membership } = await signUp(signupData.name, signupData.email, signupData.cpfCnpj, signupData.phone, signupData.password);

    if (error) {
      toast.error(error.message || "Erro no cadastro");
    } else {
      toast.success("Cadastro realizado com sucesso!");

      // Mostrar informações da mensalidade criada
      if (membership) {
        const dueDate = new Date(membership.dueDate).toLocaleDateString('pt-BR');
        toast.success(`Sua primeira mensalidade foi criada! Valor: R$ ${membership.value.toFixed(2)} - Vencimento: ${dueDate}`);
      }
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setSignupData({ ...signupData, cpfCnpj: formatted });

    // Limpa erro quando usuário começa a digitar
    if (signupErrors.cpfCnpj) {
      setSignupErrors({ ...signupErrors, cpfCnpj: '' });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setSignupData({ ...signupData, phone: formatted });

    // Limpa erro quando usuário começa a digitar
    if (signupErrors.phone) {
      setSignupErrors({ ...signupErrors, phone: '' });
    }
  };

  const handleShowButton = () => {
    setShow(prev => !prev)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-full">
              <Plane className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Avião Reservas</CardTitle>
          <CardDescription className="text-gray-600">
            Faça login ou crie sua conta para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type={show ? "text" : "password"}
                      placeholder="Sua senha"
                      className="pl-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                    <Button type='button' onClick={handleShowButton} className="absolute right-0 top-0  text-gray-400 bg-transparent hover:bg-transparent">
                      {show ? <Eye />
                        : <EyeClosed />}
                    </Button>

                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-aviation-gradient hover:opacity-90 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Carregando...
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </Button>

                <div className="text-center">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="text-sm text-blue-600 hover:text-blue-800">
                        Esqueceu a senha?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <KeyRound className="h-5 w-5" />
                          Recuperar Senha
                        </DialogTitle>
                        <DialogDescription>
                          Digite seu email para receber instruções de recuperação de senha.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="forgot-email"
                              type="email"
                              placeholder="seu@email.com"
                              className="pl-10"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setIsDialogOpen(false);
                              setForgotPasswordEmail('');
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 bg-aviation-gradient hover:opacity-90 text-white"
                            disabled={forgotPasswordLoading}
                          >
                            {forgotPasswordLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Carregando...
                              </div>
                            ) : (
                              'Enviar'
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome completo"
                      className={`pl-10 ${signupErrors.name ? 'border-red-500' : ''}`}
                      value={signupData.name}
                      onChange={(e) => {
                        setSignupData({ ...signupData, name: e.target.value });
                        if (signupErrors.name) {
                          setSignupErrors({ ...signupErrors, name: '' });
                        }
                      }}
                      required
                    />
                  </div>
                  {signupErrors.name && (
                    <p className="text-sm text-red-500">{signupErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      className={`pl-10 ${signupErrors.email ? 'border-red-500' : ''}`}
                      value={signupData.email}
                      onChange={(e) => {
                        setSignupData({ ...signupData, email: e.target.value });
                        if (signupErrors.email) {
                          setSignupErrors({ ...signupErrors, email: '' });
                        }
                      }}
                      required
                    />
                  </div>
                  {signupErrors.email && (
                    <p className="text-sm text-red-500">{signupErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-cpf">CPF</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      className={`pl-10 ${signupErrors.cpfCnpj ? 'border-red-500' : ''}`}
                      value={signupData.cpfCnpj}
                      onChange={handleCPFChange}
                      maxLength={14}
                      required
                    />
                  </div>
                  {signupErrors.cpfCnpj && (
                    <p className="text-sm text-red-500">{signupErrors.cpfCnpj}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      className={`pl-10 ${signupErrors.phone ? 'border-red-500' : ''}`}
                      value={signupData.phone}
                      onChange={handlePhoneChange}
                      maxLength={15}
                      required
                    />
                  </div>
                  {signupErrors.phone && (
                    <p className="text-sm text-red-500">{signupErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className={`pl-10 ${signupErrors.password ? 'border-red-500' : ''}`}
                      value={signupData.password}
                      onChange={(e) => {
                        setSignupData({ ...signupData, password: e.target.value });
                        if (signupErrors.password) {
                          setSignupErrors({ ...signupErrors, password: '' });
                        }
                      }}
                      required
                    />
                  </div>
                  {signupErrors.password && (
                    <p className="text-sm text-red-500">{signupErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirme sua senha"
                      className={`pl-10 ${signupErrors.confirmPassword ? 'border-red-500' : ''}`}
                      value={signupData.confirmPassword}
                      onChange={(e) => {
                        setSignupData({ ...signupData, confirmPassword: e.target.value });
                        if (signupErrors.confirmPassword) {
                          setSignupErrors({ ...signupErrors, confirmPassword: '' });
                        }
                      }}
                      required
                    />
                  </div>
                  {signupErrors.confirmPassword && (
                    <p className="text-sm text-red-500">{signupErrors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-aviation-gradient hover:opacity-90 text-white"
                  disabled={loading}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
