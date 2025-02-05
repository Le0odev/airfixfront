"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, BarChart, Users, DollarSign, ArrowRight } from "lucide-react"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getPrestadorIdFromToken } from "../Empresa/utils"
import Header from "../Header"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Prestador {
  id: number
  nome: string
  // Adicione outros campos do prestador conforme necessário
}

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

const POLLING_INTERVAL = 10000 // 10 seconds

const PrestadorDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [prestador, setPrestador] = useState<Prestador | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
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
      const [dashboardResponse, prestadorResponse] = await Promise.all([
        api.get(`/ordens-servico/prestador/${prestadorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/prestadores/prestador/${prestadorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (dashboardResponse.data && Array.isArray(dashboardResponse.data.orders)) {
        setDashboardData((prevData) => {
          if (prevData) {
            // Check if there are any changes in the orders
            const hasChanges = JSON.stringify(prevData.orders) !== JSON.stringify(dashboardResponse.data.orders)
            if (hasChanges) {
              toast({
                title: "Atualização de Ordens de Serviço",
                description: "Suas ordens de serviço foram atualizadas.",
              })
            }
          }
          return dashboardResponse.data
        })
      } else {
        throw new Error("Formato de dados inválido para o dashboard")
      }

      if (prestadorResponse.data) {
        setPrestador(prestadorResponse.data)
      } else {
        throw new Error("Formato de dados inválido para o prestador")
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
  }, [navigate, toast])

  useEffect(() => {
    fetchData()

    // Set up polling
    const pollInterval = setInterval(fetchData, POLLING_INTERVAL)

    // Clean up interval on component unmount
    return () => clearInterval(pollInterval)
  }, [fetchData])

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
    return (
      <div className="flex flex-col space-y-4 p-8">
        <Skeleton className="h-12 w-[250px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!dashboardData || !prestador) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl font-semibold text-gray-800">Erro ao carregar dados</p>
      </div>
    )
  }

  return (
    <>
      <Header userType="prestador" userAvatar="/path-to-avatar.jpg" />
      <div className="md:p-6 p-6 space-y-6 md:ml-40">
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Olá, {prestador.nome}!</h1>
            <p className="text-gray-600 mt-2">Você tem {dashboardData.stats.activeOrders} ordens de serviço ativas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          </div>

          <Card className="mb-8">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Ordens de Serviço Recentes</CardTitle>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => navigate("/ordens-servico")}>
                  Ver todas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Estimada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.orders.map((ordem) => (
                    <TableRow key={ordem.id}>
                      <TableCell className="font-medium">{ordem.Cliente?.nome || "N/A"}</TableCell>
                      <TableCell>{ordem.descricao}</TableCell>
                      <TableCell>{getStatusBadge(ordem.status)}</TableCell>
                      <TableCell>{ordem.data_estimativa}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  )
}

export default PrestadorDashboard

