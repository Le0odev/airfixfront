
import { ChangeEvent, useState } from 'react';
import { Eye, EyeOff, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { AxiosError } from 'axios';
import InputMask from 'react-input-mask';

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  cpf: string;
  confirmarSenha: string;
  empresaId: string;
  especialidade: string[];
  status: string;
  anos_experiencia: number;
  certificados: string;
}

const ServiceProviderRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const navigate = useNavigate();
  const [serviceCategories] = useState([
    'Instalação de Ar Condicionado',
    'Manutenção Preventiva',
    'Manutenção Corretiva',
    'Higienização',
    'Substituição de Peças',
    'Diagnóstico e Reparo',
    'Instalação Elétrica para AC',
    'Dimensionamento e Projeto'
  ]);

  const [equipmentTypes] = useState([
    'Split',
    'Multi Split',
    'Janela',
    'Piso Teto',
    'Cassete',
    'VRF/VRV'
  ]);

  const handleInputChange = (field: keyof FormData) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    cpf: '',
    confirmarSenha: '',
    empresaId: '',
    especialidade: [],
    status: '',
    anos_experiencia: 0,
    certificados: ''
  });
  
  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      senha: '',
      cpf: '',
      confirmarSenha: '',
      empresaId: '',
      especialidade: [],
      status: '',
      anos_experiencia: 0,
      certificados: ''
    });
    setStep(1);
    setErrorMessage('');
    setAvatarFile(null);
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const validateForm = () => {
    const { nome, email, telefone, senha, confirmarSenha, cpf, especialidade, status } = formData;

    // Verifica se todos os campos obrigatórios estão preenchidos
    if (!nome || !email || !telefone || !cpf || !senha || !confirmarSenha) {
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

    // Validação de especialidades
    if (especialidade.length === 0) {
      setErrorMessage('Selecione pelo menos uma especialidade');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const getEmpresaIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("Token não encontrado");
      return null;
    }
  
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); 
      console.log("Token Decodificado:", decodedToken);
  
      return decodedToken?.id || null;
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      return null;
    }
  };

  const handleRegister = async () => {
    // Validando o formulário
    if (!validateForm()) return;

    const { nome, email, telefone, senha, cpf, especialidade, status, anos_experiencia, certificados } = formData;

    // Obtendo o empresaId do token
    const empresaId = getEmpresaIdFromToken();
    if (!empresaId) {
      setErrorMessage('Empresa não identificada. Por favor, faça login novamente.');
      return;
    }

    setLoading(true);

    try {
      // Criando FormData para enviar dados e arquivo
      const formDataToSend = new FormData();
      formDataToSend.append('nome', nome);
      formDataToSend.append('email', email);
      formDataToSend.append('telefone', telefone);
      formDataToSend.append('senha', senha);
      formDataToSend.append('cpf', cpf);
      formDataToSend.append('empresaId', empresaId);
      formDataToSend.append('status', status || 'ativo');
      formDataToSend.append('anos_experiencia', anos_experiencia.toString());
      formDataToSend.append('certificados', certificados);

      // Adicionando especialidades
      especialidade.forEach(esp => {
        formDataToSend.append('especialidade', esp);
      });

      // Adicionando avatar se existir
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      // Enviando a requisição para o backend
      const response = await api.post('/register-prestador', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Se a criação do cliente for bem-sucedida
      if (response.status === 201) {
        resetForm(); // Resetando o formulário após o sucesso
        navigate('/login-prestador'); // Redirecionando para a tela de login
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
        {/* Progress indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
          {step === 1 ? 'Dados Pessoais' : 
           step === 2 ? 'Especialidades AC' : 
           'Criar Senha'}
        </h2>
        <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
          {step === 1 ? 'Informações básicas para seu cadastro' : 
           step === 2 ? 'Conte-nos sobre sua experiência com ar condicionado' : 
           'Configure seu acesso'}
        </p>
        
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <label className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                    />
                    {avatarFile ? (
                      <img 
                        src={URL.createObjectURL(avatarFile)} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400" />
                    )}
                  </label>
                  <span className="block text-xs text-gray-500 text-center mt-2">Foto de perfil</span>
                </div>
              </div>

              {/* Rest of the first step form fields remain the same */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={handleInputChange('nome')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Digite seu nome completo"
                />
              </div>

             
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
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

              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
              >
                Continuar
              </button>
            </>
          )}


        {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipos de Equipamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {equipmentTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded"
                        checked={formData.especialidade.includes(type)}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            especialidade: e.target.checked 
                              ? [...prev.especialidade, type]
                              : prev.especialidade.filter(item => item !== type)
                          }));
                        }}
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Anos de Experiência com AC
                </label>
                <select 
                  value={formData.anos_experiencia} 
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    anos_experiencia: Number(e.target.value)
                  }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                >
                  <option value="">Selecione</option>
                  <option value="1">1-2 anos</option>
                  <option value="3">3-5 anos</option>
                  <option value="5">5-10 anos</option>
                  <option value="10">Mais de 10 anos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select 
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                >
                  <option value="">Selecione o status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Certificações
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  value={formData.certificados}
                  onChange={handleInputChange('certificados')}
                  placeholder="Ex: PMOC, NR10, NR35..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === 3 && (
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
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">8+ caracteres</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">1 número</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">1 letra maiúscula</span>
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
                    placeholder="Digite a senha novamente"
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

              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  onClick={handleRegister}
                  disabled={loading}
                  className={`w-2/3 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-base 
                    ${loading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-600 text-sm">Já tem uma conta?</span>
          <button 
            onClick={() => navigate('/login-prestador')}
            className="ml-1 text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            Fazer login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderRegister;