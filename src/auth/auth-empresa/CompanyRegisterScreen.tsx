import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Eye, EyeOff, Building, Mail, MapPin, Phone, Lock, FileText } from 'lucide-react';
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

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setErrorMessage('');
    } else {
      navigate(-1);
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return regex.test(email);
  };

  const validateFirstStep = () => {
    const { nome, email, cnpj, telefone, endereco } = formData;

    if (!nome || !email || !cnpj || !telefone || !endereco) {
      setErrorMessage("Todos os campos são obrigatórios!");
      return false;
    }

    if (!validateEmail(email)) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Lado Esquerdo - Formulário (70%) */}
        <div className="w-full md:w-7/10 p-4 md:p-8 lg:p-12 flex items-center justify-center order-2 md:order-1">
          <div className="w-full max-w-lg mx-4">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Cadastre sua empresa
              </h1>
              <p className="text-gray-600 text-lg">
                {step === 1
                  ? 'Complete o cadastro para começar a usar nossa plataforma'
                  : 'Crie uma senha segura para proteger sua conta'}
              </p>
            </div>

            <div className="shadow-lg rounded-2xl p-6 md:p-8 mb-6 border border-gray-100">
              <div className="flex justify-center mb-8">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`bg-blue-600 h-2.5 rounded-full transition-all duration-300 ${
                      step === 1 ? 'w-1/2' : 'w-full'
                    }`}
                  />
                </div>
              </div>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {step === 1 ? (
                  <>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Building className="w-5 h-5 mr-2 text-gray-500" />
                          Nome da Empresa
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.nome}
                            onChange={handleInputChange('nome')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 bg-gray-50 focus:bg-white"
                            placeholder="Digite o nome da empresa"
                          />
                          {formData.nome && (
                            <CheckCircle className="w-5 h-5 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Mail className="w-5 h-5 mr-2 text-gray-500" />
                          Email da Empresa
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange('email')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 bg-gray-50 focus:bg-white"
                            placeholder="Digite o email de contato"
                          />
                          {validateEmail(formData.email) && formData.email.length > 0 && (
                            <CheckCircle className="w-5 h-5 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                          )}
                        </div>
                        {!validateEmail(formData.email) && formData.email.length > 0 && (
                          <p className="text-red-500 text-sm mt-1">Email inválido</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-gray-500" />
                            CNPJ
                          </label>
                          <InputMask
                            mask="99.999.999/9999-99"
                            value={formData.cnpj}
                            onChange={handleInputChange('cnpj')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 bg-gray-50 focus:bg-white"
                            placeholder="00.000.000/0000-00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Phone className="w-5 h-5 mr-2 text-gray-500" />
                            Telefone
                          </label>
                          <InputMask
                            mask="(99) 99999-9999"
                            value={formData.telefone}
                            onChange={handleInputChange('telefone')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 bg-gray-50 focus:bg-white"
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                          Endereço da Empresa
                        </label>
                        <input
                          type="text"
                          value={formData.endereco}
                          onChange={handleInputChange('endereco')}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 bg-gray-50 focus:bg-white"
                          placeholder="Digite o endereço da empresa"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleContinueToSecondStep}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 text-base shadow-lg hover:shadow-xl active:scale-95"
                    >
                      Continuar
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Lock className="w-5 h-5 mr-2 text-gray-500" />
                          Senha
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={formData.senha}
                            onChange={handleInputChange('senha')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 bg-gray-50 focus:bg-white"
                            placeholder="Digite a sua senha"
                          />
                          <div
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Lock className="w-5 h-5 mr-2 text-gray-500" />
                          Confirmar Senha
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmarSenha}
                            onChange={handleInputChange('confirmarSenha')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 bg-gray-50 focus:bg-white"
                            placeholder="Confirme sua senha"
                          />
                          <div
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                          >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setStep(1)}
                        className="w-1/2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-4 rounded-xl transition-colors duration-200 text-base shadow-lg hover:shadow-xl"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors duration-200 text-base shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Registrando...' : 'Criar Conta'}
                      </button>
                    </div>
                  </>
                )}

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-red-600 text-sm text-center">{errorMessage}</p>
                  </div>
                )}
              </form>
            </div>

            <p className="text-center text-sm text-gray-600">
              Já tem uma conta?{' '}
              <a href="/login-company" className="text-blue-600 hover:text-blue-700 font-medium">
                Faça login
              </a>
            </p>
          </div>
        </div>

        {/* Lado Direito - Informações (30%) */}
        <div className="hidden md:flex w-full md:w-3/10 bg-gradient-to-br from-blue-600 to-blue-800 p-8 items-center justify-center text-white order-1 md:order-2">
          <div className="max-w-lg">
            <h1 className="text-4xl font-bold mb-6">
              Transforme sua gestão empresarial
            </h1>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-xl mb-2">Gestão Simplificada</h3>
                  <p className="text-blue-100">
                    Centralize todas as suas operações em uma única plataforma intuitiva e fácil de usar.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-xl mb-2">Análise em Tempo Real</h3>
                  <p className="text-blue-100">
                    Acompanhe o desempenho do seu negócio com dashboards e relatórios atualizados em tempo real.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-xl mb-2">Segurança Garantida</h3>
                  <p className="text-blue-100">
                    Seus dados estão protegidos com as mais avançadas tecnologias de segurança do mercado.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-xl mb-2">Suporte 24/7</h3>
                  <p className="text-blue-100">
                    Nossa equipe está sempre disponível para ajudar você com qualquer necessidade.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-blue-400">
              <p className="text-blue-100 text-sm">
                Mais de 1000+ empresas já confiam em nossa plataforma para gerenciar seus negócios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegisterScreen;