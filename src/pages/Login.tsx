import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:5000/api/cliente/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          senha: password,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Email ou senha incorretos');
      }
  
      const data = await response.json();
      const { token } = data;
  
      // Armazenar o token no localStorage ou sessionStorage
      localStorage.setItem('token', token);
  
      // Navegar para a página inicial após o login
      navigate('/home');
    } catch (error) {
      console.error(error);
      setError('Email ou senha incorretos');
    }
  };

  const handleGoogleLogin = () => {
    // Lógica de login com Google
    console.log('Login with Google');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo</h2>
          <p className="text-gray-600">Faça login para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && <p className="text-red-600 text-center">{error}</p>}
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

          <div className="text-right">
            <button type="button" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
              Esqueceu a senha?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2"
            disabled={loading}
          >
            {loading ? <span>Carregando...</span> : <span>Entrar</span>}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continue com</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              {/* SVG do Google */}
            </svg>
            <span>Google</span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-gray-600">Não tem uma conta?</span>
          <button 
            onClick={() => navigate('/user-register')}
            className="ml-1 text-blue-600 hover:text-blue-800 transition-colors font-semibold"
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
