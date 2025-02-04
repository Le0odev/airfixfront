import api from '@/services/api';
import axios from 'axios';
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
            navigate('/home/prestador');
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


    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo</h2>
                    <p className="text-gray-600">Faça login para continuar</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-gray-700">Email</label>
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
                            <label htmlFor="password" className="block text-gray-700">Senha</label>
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
                    <div className="flex flex-col items-center space-y-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {loading ? 'Carregando...' : 'Entrar'}
                        </button>

                        <button 
                            type="button" 
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            Esqueceu a senha?
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProviderLogin;