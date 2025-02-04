import api from '@/services/api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CompanyLoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [, setError] = useState<string | null>(null);
  const [, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Previne o reload da página
    
    // Validação básica
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/login', {
        email,
        senha: password,
      });

      const { token } = response.data;
      
      // Salva o token
      localStorage.setItem('token', token);
      
      // Limpa os campos
      setEmail('');
      setPassword('');
      
      // Redireciona para home
      navigate('/home/empresa');
      
    } catch (error: any) {
      // Tratamento de erro mais detalhado
      if (error.response) {
        // O servidor respondeu com um status de erro
        switch (error.response.status) {
          case 401:
            setError('Email ou senha incorretos');
            break;
          case 422:
            setError('Dados inválidos. Verifique os campos');
            break;
          case 429:
            setError('Muitas tentativas. Tente novamente mais tarde');
            break;
          default:
            setError('Erro ao realizar login. Tente novamente');
        }
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        setError('Erro de conexão. Verifique sua internet');
      } else {
        setError('Ocorreu um erro inesperado');
      }
      
      console.error('Erro no login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo à Empresa</h2>
          <p className="text-gray-600">Faça login para acessar o painel</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Seu email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Sua senha"
                required
              />
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button type="button" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
              Esqueceu a senha?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2"
          >
            <span>Entrar</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continue com</span>
            </div>
          </div>

          {/* Google Login Button - Removed for Company Login */}

        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <span className="text-gray-600">Não tem uma conta?</span>
          <button 
            onClick={() => navigate('/company-register')}
            className="ml-1 text-blue-600 hover:text-blue-800 transition-colors font-semibold"
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyLoginScreen;
