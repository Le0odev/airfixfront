"use client"

import type React from "react"
import { useState } from "react"
import { Mail, Lock, CheckCircle } from "lucide-react"
import api from "@/services/api"

const CompanyLoginScreen: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Função para validar o email
  const validateEmail = (email: string) => {
    const regex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/
    return regex.test(email)
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Previne o reload da página

    // Validação básica
    if (!email || !password) {
      setError("Por favor, preencha todos os campos")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post("/login", {
        email,
        senha: password,
      })

      const { token } = response.data

      // Salva o token
      localStorage.setItem("token", token)

      // Limpa os campos
      setEmail("")
      setPassword("")

      // Redireciona para home
      window.location.href = "/home/empresa"
    } catch (error: any) {
      // Tratamento de erro mais detalhado
      if (error.response) {
        // O servidor respondeu com um status de erro
        switch (error.response.status) {
          case 401:
            setError("Email ou senha incorretos")
            break
          case 422:
            setError("Dados inválidos. Verifique os campos")
            break
          case 429:
            setError("Muitas tentativas. Tente novamente mais tarde")
            break
          default:
            setError("Erro ao realizar login. Tente novamente")
        }
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        setError("Erro de conexão. Verifique sua internet")
      } else {
        setError("Ocorreu um erro inesperado")
      }

      console.error("Erro no login:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col lg:flex-row">
      {/* Lado Esquerdo - Formulário de Login (70%) */}
      <div className="w-full lg:w-[70%] p-4 lg:p-12 flex items-center justify-center order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Acesse sua conta</h1>
            <p className="text-gray-600 text-lg">
              Faça login para gerenciar sua empresa e acessar recursos exclusivos.
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 md:p-8 mb-6">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-gray-500" />
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 bg-gray-50 focus:bg-white"
                      placeholder="Seu email"
                      required
                    />
                    {validateEmail(email) && email.length > 0 && (
                      <CheckCircle className="w-5 h-5 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                    )}
                  </div>
                  {!validateEmail(email) && email.length > 0 && (
                    <p className="text-red-500 text-sm mt-1">Email inválido</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-gray-500" />
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 bg-gray-50 focus:bg-white"
                    placeholder="Sua senha"
                    required
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                  Esqueceu a senha?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors duration-300 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Lado Direito - Informações (30%) */}
      <div className="hidden lg:flex w-full lg:w-[30%] bg-gradient-to-br from-blue-600 to-blue-800 p-8 items-center justify-center text-white order-1 lg:order-2">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-6">Benefícios de ser nosso cliente</h1>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-xl mb-2">Acesso Exclusivo</h3>
                <p className="text-blue-100">Tenha acesso a ferramentas e recursos disponíveis apenas para clientes.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-xl mb-2">Suporte Prioritário</h3>
                <p className="text-blue-100">
                  Nossa equipe está sempre pronta para ajudar você com agilidade e eficiência.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-xl mb-2">Atualizações Constantes</h3>
                <p className="text-blue-100">Desfrute de novas funcionalidades e melhorias frequentes.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-xl mb-2">Segurança de Dados</h3>
                <p className="text-blue-100">
                  Seus dados estão protegidos com as mais avançadas tecnologias de segurança.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-blue-400">
            <p className="text-blue-100 text-sm">Junte-se a milhares de empresas que já confiam em nossa plataforma.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyLoginScreen

