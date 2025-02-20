import api from '@/services/api';
import axios from 'axios';
import { Check } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProviderLogin = () => { 
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/login-prestador', {
                email,
                senha: password,
            });
            const { token } = response.data;
            localStorage.setItem('token', token);
            navigate('/home/prestador/minhas-tarefas');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || 'Email ou senha incorretos');
            } else {
                setError('Ocorreu um erro inesperado');
            }
            console.error('Erro no login:', error);
        } finally {
            setLoading(false);
        }
    };


    
    
    
    
        const benefits = [
            {
              title: 'Acesso Exclusivo',
              description: 'Tenha acesso a ferramentas e recursos disponíveis apenas para clientes.'
            },
            {
              title: 'Suporte Prioritário',
              description: 'Nossa equipe está sempre pronta para ajudar você com agilidade e eficiência.'
            },
            {
              title: 'Atualizações Constantes',
              description: 'Desfrute de novas funcionalidades e melhorias frequentes.'
            },
            {
              title: 'Segurança de Dados',
              description: 'Seus dados estão protegidos com as mais avançadas tecnologias de segurança.'
            }
          ];
        
          return (
            <div className="min-h-screen flex">
              {/* Login Section */}
              <div className="w-full md:w-1/2 bg-white p-4 md:p-8 flex items-center justify-center">
                <div className="w-full max-w-md">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Acesse sua conta</h2>
                    <p className="text-gray-600 mt-2">Faça login para gerenciar sua empresa e acessar recursos exclusivos.</p>
                  </div>
        
                  <form onSubmit={handleLogin} className="space-y-6">
                    {error && <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm">{error}</div>}
        
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite seu email"
                        required
                      />
                    </div>
        
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Senha
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite sua senha"
                        required
                      />
                    </div>
        
                    <div className="flex flex-col space-y-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {loading ? "Entrando..." : "Entrar"}
                      </button>
        
                      <button type="button" className="text-sm text-blue-600 hover:text-blue-800 text-center">
                        Esqueceu a senha?
                      </button>
                    </div>
                  </form>
                </div>
              </div>
        
              {/* Benefits Section - Hidden on mobile */}
              <div className="hidden md:flex w-1/2 bg-blue-600 p-8 items-center">
                <div className="max-w-lg mx-auto text-white">
                  <h2 className="text-3xl font-bold mb-8">Benefícios de ser nosso cliente</h2>
        
                  <div className="space-y-6">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{benefit.title}</h3>
                          <p className="text-blue-100 mt-1">{benefit.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
        
                  <p className="mt-12 text-blue-100">Junte-se a milhares de empresas que já confiam em nossa plataforma.</p>
                </div>
              </div>
            </div>
          )
        }
        
        export default ProviderLogin
        