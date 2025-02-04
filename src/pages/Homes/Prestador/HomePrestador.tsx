import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, BarChart, Users, DollarSign, Clock } from "lucide-react"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getPrestadorIdFromToken } from "../Empresa/utils"
import Header from "../Header"

interface OrdemServico {
  id: number
  descricao: string
  Cliente?: {
    id: number
    nome: string
  }
  status: "pendente" | "em_progresso" | "completada"
  data_estimativa: string
  custo_estimado: number
}

interface DashboardData {
  orders: OrdemServico[]
  stats: {
    totalOrders: number
    activeOrders: number
    completedOrders: number
    totalEarnings: string
  }
}

const PrestadorDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prestadorId = getPrestadorIdFromToken()
        if (!prestadorId) {
          toast({
            title: "Erro de autenticação",
            description: "Por favor, faça login novamente.",
            variant: "destructive",
          })
          navigate("/provider-login")
          return
        }

        const token = localStorage.getItem("token")
        const response = await api.get(`/ordens-servico/prestador/${prestadorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data && Array.isArray(response.data.orders)) {
          console.log(response.data)
          setDashboardData(response.data)
        } else {
          throw new Error("Formato de dados inválido")
        }

        setLoading(false)
      } catch (err) {
        console.error("Erro ao buscar dados:", err)
        toast({
          title: "Erro",
          description: "Falha ao carregar os dados. Por favor, tente novamente.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }
    fetchData()
  }, [navigate, toast])

  const getStatusBadge = (status: OrdemServico["status"]) => {
    const statusStyles: Record<OrdemServico["status"], string> = {
      pendente: "bg-yellow-100 text-yellow-800",
      em_progresso: "bg-blue-100 text-blue-800",
      completada: "bg-green-100 text-green-800",
    }

    const statusLabels: Record<OrdemServico["status"], string> = {
      pendente: "Pendente",
      em_progresso: "Em Andamento",
      completada: "Concluído",
    }
    return <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>
  }

  if (!dashboardData) {
    return <div className="flex items-center justify-center h-screen">Erro ao carregar dados</div>
  }

  return (
    <>
      <Header userType="prestador" userAvatar="/path-to-avatar.jpg" />
      <div className="md:p-10 p-6 space-y-6 md:ml-60">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Olá, Prestador!</h1>
            <p className="text-gray-600">Você tem {dashboardData.stats.activeOrders} ordens de serviço ativas.</p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.activeOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Concluídos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.completedOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {Number.parseFloat(dashboardData.stats.totalEarnings).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Ordens de Serviço Recentes</CardTitle>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/ordens-servico")}>
                Ver todas
              </Button>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.orders.map((ordem) => (
                <div key={ordem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{ordem.Cliente?.nome || "Cliente não especificado"}</p>
                      <p className="text-sm text-gray-600">{ordem.descricao}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(ordem.status)}
                    <p className="text-sm text-gray-600 mt-1">{ordem.data_estimativa}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
    </>
  )
}

export default PrestadorDashboard

