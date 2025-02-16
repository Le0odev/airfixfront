import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AxiosError } from 'axios';
import InputMask from 'react-input-mask';
import api from '@/services/api';

interface FormData {
  nome: string;
  email: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

const CompanyRegisterScreen = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    senha: '',
    confirmarSenha: ''
  });

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
      cnpj: '',
      endereco: '',
      telefone: '',
      senha: '',
      confirmarSenha: ''
    });
    setStep(1);
    setErrorMessage('');
  };

  const validateFirstStep = () => {
    const { nome, email, cnpj, telefone, endereco } = formData;

    if (!nome || !email || !cnpj || !telefone || !endereco) {
      setErrorMessage("Todos os campos são obrigatórios!");
      return false;
    }

    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Email inválido');
      return false;
    }

    const telefoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!telefoneRegex.test(telefone)) {
      setErrorMessage('Telefone inválido. Use o formato (99) 99999-9999');
      return false;
    }

    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
    if (!cnpjRegex.test(cnpj)) {
      setErrorMessage('CNPJ inválido. Use o formato 12.345.678/0001-90 ou 12345678000190');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const validateSecondStep = () => {
    const { senha, confirmarSenha } = formData;

    if (!senha || !confirmarSenha) {
      setErrorMessage("Todos os campos são obrigatórios!");
      return false;
    }

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

  const handleContinueToSecondStep = () => {
    if (validateFirstStep()) {
      setStep(2);
    }
  };

  const handleRegister = async () => {
    if (!validateSecondStep()) return;

    // Normalize data before sending
    const requestData = {
      nome: formData.nome.trim(),
      email: formData.email.toLowerCase(),
      cnpj: formData.cnpj.replace(/[.\-/]/g, ''),
      telefone: formData.telefone.replace(/[^\d]/g, ''),
      endereco: formData.endereco.trim(),
      senha: formData.senha,
    };

    setLoading(true);
    try {
      const response = await api.post('/register', requestData);

      if (response.status === 201) {
        resetForm();
        navigate('/login-company');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      
      if (axiosError.response?.status === 400) {
        setErrorMessage(
          axiosError.response?.data?.message || 
          'Erro ao criar conta. Verifique os dados informados.'
        );
      } else {
        setErrorMessage('Ocorreu um erro ao registrar. Tente novamente mais tarde.');
        console.error('Registro de empresa error:', error);
      }
    } finally {
      setLoading(false);
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
          {step === 1 ? 'Informações da Empresa' : 'Criar Senha'}
        </h2>
        <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
          {step === 1 
            ? 'Primeiro, nos conte um pouco sobre a sua empresa' 
            : 'Agora, vamos criar uma senha segura'}
        </p>
  
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={handleInputChange('nome')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Digite o nome da empresa"
                />
              </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email da Empresa
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Digite o email de contato"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CNPJ
                </label>
                <InputMask
                  mask="99.999.999/9999-99"
                  value={formData.cnpj}
                  onChange={handleInputChange('cnpj')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="00.000.000/0000-00"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço da Empresa</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={handleInputChange('endereco')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Digite o endereço da empresa"
                />
              </div>

              <button
                onClick={handleContinueToSecondStep}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
              >
                Continuar
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.senha}
                    onChange={handleInputChange('senha')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                    placeholder="Digite a sua senha"
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmarSenha}
                    onChange={handleInputChange('confirmarSenha')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                    placeholder="Confirme sua senha"
                  />
                  <div
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>
  
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
              >
                {loading ? 'Registrando...' : 'Criar Conta'}
              </button>
  
              {errorMessage && (
                <p className="text-red-600 text-center mt-3 text-sm">{errorMessage}</p>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CompanyRegisterScreen;