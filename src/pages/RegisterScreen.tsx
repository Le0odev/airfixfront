import { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AxiosError } from 'axios';
import InputMask from 'react-input-mask';
import api from '@/services/api';

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  cpf: string;
  confirmarSenha: string;
  endereco: string;
  empresaId: string;
}

const RegisterScreen = () => {
  const navigate = useNavigate();

  const getEmpresaIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("Token não encontrado");
      return null;
    }
  
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); 
      console.log("Token Decodificado:", decodedToken); // Exibindo o conteúdo do token
  
      return decodedToken?.id || null; // Agora pegamos o campo `id`
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      return null;
    }
  };
  
  
  // Teste com um token fictício (adapte para seu caso)
  localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImVtcHJlc2EiLCJpYXQiOjE3MzI2NjYyMDksImV4cCI6MTczMzI3MTAwOX0.IWOPpOAm_Nl065giTnFPk9hYFbQPRvoEgqm5OKADWr4'); // Substitua pelo seu token real
  
  const empresaId = getEmpresaIdFromToken();
  console.log(empresaId); // Deve imprimir o valor de empresaId ou null

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    cpf: '',
    confirmarSenha: '',
    endereco: '',
    empresaId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (field: keyof FormData) => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      senha: '',
      cpf: '',
      confirmarSenha: '',
      endereco: '',
      empresaId: ''
    });
    setStep(1);
    setErrorMessage('');
  };

  const validateForm = () => {
    const { nome, email, telefone, senha, confirmarSenha, cpf, endereco } = formData;

    // Verifica se todos os campos obrigatórios estão preenchidos
    if (!nome || !email || !telefone || !cpf || !endereco) {
      setErrorMessage('Todos os campos são obrigatórios');
      return false;
    }

    // Validação de email básico
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Email inválido');
      return false;
    }

    // Validação de telefone
    const telefoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!telefoneRegex.test(telefone)) {
      setErrorMessage('Telefone inválido. Use o formato (99) 99999-9999');
      return false;
    }

    // Validação de CPF
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(cpf)) {
      setErrorMessage('CPF inválido. Use o formato 000.000.000-00');
      return false;
    }

    // Validações da senha
    if (senha.length < 8) {
      setErrorMessage('A senha deve ter pelo menos 8 caracteres');
      return false;
    }

    if (senha !== confirmarSenha) {
      setErrorMessage('As senhas não coincidem');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleRegister = async () => {
    // Validando o formulário
    if (!validateForm()) return;

    const { nome, email, telefone, senha, cpf, endereco } = formData;

    // Obtendo o empresaId do token
    const empresaId = getEmpresaIdFromToken();
    if (!empresaId) {
      setErrorMessage('Empresa não identificada. Por favor, faça login novamente.');
      return;
    }

    setLoading(true);

    try {
      // Enviando a requisição para o backend com empresaId
      const response = await api.post('/register-cliente', {
        nome,
        email,
        telefone,
        senha,
        cpf,
        endereco,
        empresaId, // Incluindo empresaId automaticamente
      });

      // Se a criação do cliente for bem-sucedida
      if (response.status === 201) {
        resetForm(); // Resetando o formulário após o sucesso
        navigate('/login-client'); // Redirecionando para a tela de login
      }
    } catch (error) {
      // Tratando erros
      const axiosError = error as AxiosError<{ message: string }>;

      // Exibindo erro específico se a resposta for 400 (erro de validação)
      if (axiosError.response?.status === 400) {
        setErrorMessage(axiosError.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
      } else if (axiosError.response?.status === 500) {
        setErrorMessage('Erro interno no servidor. Tente novamente mais tarde.');
      } else {
        setErrorMessage('Ocorreu um erro ao registrar. Tente novamente mais tarde.');
      }

      // Log para o desenvolvedor, para depuração
      console.error('Error during registration: ', error);
    } finally {
      setLoading(false); // Finalizando o carregamento
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
          {step === 1 ? 'Informações Básicas' : 'Criar Senha'}
        </h2>
        <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
          {step === 1 ? 'Primeiro, nos conte um pouco sobre você' : 'Agora, vamos criar uma senha segura'}
        </p>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={handleInputChange('nome')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Digite seu melhor email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CPF</label>
                <InputMask
                  mask="999.999.999-99"
                  value={formData.cpf}
                  onChange={handleInputChange('cpf')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                <InputMask
                  mask="(99) 99999-9999"
                  value={formData.telefone}
                  onChange={handleInputChange('telefone')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={handleInputChange('endereco')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Digite seu endereço"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
              >
                Continuar
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.senha}
                    onChange={handleInputChange('senha')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                    placeholder="Crie uma senha forte"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar Senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmarSenha}
                    onChange={handleInputChange('confirmarSenha')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                    placeholder="Confirme sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
                >
                  Voltar
                </button>
                <button
                  onClick={handleRegister}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </div>
              
            </>
          )}

          {errorMessage && (
            <p className="text-center text-red-600 text-sm sm:text-base">{errorMessage}</p>
          )}
        </form>

        <p className="text-center text-gray-600 text-sm sm:text-base mt-6">
          Já possui uma conta?
          <button
            onClick={() => navigate('/login-client')}
            className="text-blue-600 font-semibold ml-1 hover:underline"
          >
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
