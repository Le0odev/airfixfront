"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  BarChart,
  DollarSign,
  ArrowRight,
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  CheckCircle2,
  Clock,
} from "lucide-react"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getPrestadorIdFromToken } from "../Empresa/utils"
import Header from "../Header"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

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
  data_criacao?: string
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

interface Notification {
  id: number
  message: string
  read: boolean
  timestamp: string
}

const POLLING_INTERVAL = 10000 // 10 seconds

const PrestadorDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [prestador, setPrestador] = useState<Prestador | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrdemServico | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [chartData, setChartData] = useState<any[]>([])

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
        const orders = dashboardResponse.data.orders
        const totalEarnings = orders.reduce((sum: number, order: { custo_estimado: string }) => {
          const cost = Number.parseFloat(order.custo_estimado) || 0
          return sum + cost
        }, 0)

        // Calculate correct stats
        const completedOrders = orders.filter((order: { status: string }) => order.status === "completada").length
        const activeOrders = orders.filter((order: { status: string }) => order.status !== "completada").length
        const totalOrders = orders.length

        setDashboardData((prevData) => {
          if (prevData) {
            const hasChanges = JSON.stringify(prevData.orders) !== JSON.stringify(orders)
            if (hasChanges) {
              // Adicionar notificação
              const newNotification = {
                id: Date.now(),
                message: "Suas ordens de serviço foram atualizadas.",
                read: false,
                timestamp: new Date().toISOString(),
              }
              setNotifications((prev) => [newNotification, ...prev])
              setUnreadCount((prev) => prev + 1)

              toast({
                title: "Atualização de Ordens de Serviço",
                description: "Suas ordens de serviço foram atualizadas.",
              })
            }
          }
          return {
            orders,
            stats: {
              totalOrders,
              activeOrders,
              completedOrders,
              totalEarnings: totalEarnings.toFixed(2),
            },
          }
        })

        // Preparar dados para o gráfico
        prepareChartData(orders)
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

  // Preparar dados para o gráfico
  const prepareChartData = (orders: OrdemServico[]) => {
    // Agrupar ordens por mês para mostrar tendências
    const monthlyData: Record<
      string,
      { month: string; completadas: number; pendentes: number; em_progresso: number; faturamento: number }
    > = {}

    orders.forEach((order) => {
      const date = new Date(order.data_criacao || order.data_estimativa)
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthYear,
          completadas: 0,
          pendentes: 0,
          em_progresso: 0,
          faturamento: 0,
        }
      }

      // Incrementar contadores baseado no status
      if (order.status === "completada") {
        monthlyData[monthYear].completadas += 1
        monthlyData[monthYear].faturamento += Number(order.custo_estimado)
      } else if (order.status === "pendente") {
        monthlyData[monthYear].pendentes += 1
      } else if (order.status === "em_progresso") {
        monthlyData[monthYear].em_progresso += 1
      }
    })

    // Converter para array e ordenar por data
    const chartData = Object.values(monthlyData).sort((a, b) => {
      const [aMonth, aYear] = a.month.split("/")
      const [bMonth, bYear] = b.month.split("/")
      return (
        new Date(Number(aYear), Number(aMonth) - 1).getTime() - new Date(Number(bYear), Number(bMonth) - 1).getTime()
      )
    })

    setChartData(chartData)
  }

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

  // Função para atualizar o status de uma ordem
  const updateOrderStatus = async (orderId: number, newStatus: OrdemServico["status"]) => {
    try {
      const token = localStorage.getItem("token")
      await api.put(
        `/ordens-servico/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Atualizar localmente
      setDashboardData((prev) => {
        if (!prev) return prev

        const updatedOrders = prev.orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        )

        // Recalcular estatísticas
        const completedOrders = updatedOrders.filter((order) => order.status === "completada").length
        const activeOrders = updatedOrders.filter((order) => order.status !== "completada").length
        const totalOrders = updatedOrders.length

        return {
          orders: updatedOrders,
          stats: {
            ...prev.stats,
            completedOrders,
            activeOrders,
            totalOrders,
          },
        }
      })

      toast({
        title: "Status atualizado",
        description: "O status da ordem de serviço foi atualizado com sucesso.",
      })
    } catch (err) {
      console.error("Erro ao atualizar status:", err)
      toast({
        title: "Erro",
        description: "Falha ao atualizar o status. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Marcar todas as notificações como lidas
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    setUnreadCount(0)
  }

  // Filtrar e ordenar ordens
  const filteredOrders = useMemo(() => {
    if (!dashboardData) return []

    let result = [...dashboardData.orders]

    // Aplicar filtro de pesquisa
    if (searchTerm) {
      result = result.filter(
        (order) =>
          order.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.Cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Aplicar filtro de status
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter)
    }

    // Aplicar ordenação
    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === "cliente") {
          const aValue = a.Cliente?.nome || ""
          const bValue = b.Cliente?.nome || ""
          return sortConfig.direction === "ascending" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        } else if (sortConfig.key === "data") {
          return sortConfig.direction === "ascending"
            ? new Date(a.data_estimativa).getTime() - new Date(b.data_estimativa).getTime()
            : new Date(b.data_estimativa).getTime() - new Date(a.data_estimativa).getTime()
        } else if (sortConfig.key === "custo") {
          return sortConfig.direction === "ascending"
            ? Number(a.custo_estimado) - Number(b.custo_estimado)
            : Number(b.custo_estimado) - Number(a.custo_estimado)
        }
        return 0
      })
    }

    return result
  }, [dashboardData, searchTerm, statusFilter, sortConfig])

  // Adicionar após a declaração de filteredOrders (antes do return do componente)

  // Filtrar serviços agendados para hoje
  const todayServices = useMemo(() => {
    if (!dashboardData) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return dashboardData.orders
      .filter((order) => {
        const orderDate = new Date(order.data_estimativa)
        return orderDate >= today && orderDate < tomorrow
      })
      .sort((a, b) => {
        return new Date(a.data_estimativa).getTime() - new Date(b.data_estimativa).getTime()
      })
  }, [dashboardData])

  // Função para alternar a ordenação
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
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
      <div id="minhas-tarefas" className="md:p-8 p-4 space-y-6 md:ml-60">
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Olá, {prestador.nome}!</h1>
              <p className="text-gray-600 mt-2">
                Você tem {dashboardData.stats.activeOrders} ordens de serviço ativas.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-medium">Notificações</h3>
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Marcar todas como lidas
                    </Button>
                  </div>
                  <ScrollArea className="h-80">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b ${notification.read ? "bg-white" : "bg-blue-50"}`}
                        >
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">Nenhuma notificação</div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Button onClick={() => navigate("/prestador/agenda")}>
                Minha Agenda
                <Calendar className="ml-2 h-4 w-4" />
              </Button>
            </div>
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
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats.activeOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Serviços Concluídos</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
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
                  R$ {(Number.parseFloat(dashboardData.stats.totalEarnings) || 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Serviços de Hoje */}
          <Card className="mb-8">
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>Serviços Hoje</CardTitle>
                <CardDescription>
                  {todayServices.length > 0
                    ? `Você tem ${todayServices.length} serviço(s) agendado(s) para hoje`
                    : "Não há serviços agendados para hoje"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/prestador/agenda")}>
                Ver agenda completa
                <Calendar className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {todayServices.length > 0 ? (
                <div className="space-y-4">
                  {todayServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{service.Cliente?.nome || "Cliente não especificado"}</span>
                          {getStatusBadge(service.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{service.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Horário:{" "}
                          {new Date(service.data_estimativa).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">R$ {service.custo_estimado}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {service.status === "pendente" && (
                              <DropdownMenuItem onClick={() => updateOrderStatus(service.id, "em_progresso")}>
                                Iniciar Serviço
                              </DropdownMenuItem>
                            )}
                            {service.status === "em_progresso" && (
                              <DropdownMenuItem onClick={() => updateOrderStatus(service.id, "completada")}>
                                Marcar como Concluído
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setSelectedOrder(service)}>Ver Detalhes</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Não há serviços agendados para hoje</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate("/prestador/agenda")}>
                    Verificar agenda da semana
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="orders" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="orders">Ordens de Serviço</TabsTrigger>
              <TabsTrigger value="analytics">Análise de Desempenho</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle>Ordens de Serviço</CardTitle>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar ordens..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-auto"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                          <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os status</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_progresso">Em Andamento</SelectItem>
                          <SelectItem value="completada">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => requestSort("cliente")}>
                          <div className="flex items-center">
                            Cliente
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort("custo")}>
                          <div className="flex items-center">
                            Custo estimado
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort("data")}>
                          <div className="flex items-center">
                            Data Estimada
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((ordem) => (
                          <TableRow key={ordem.id}>
                            <TableCell className="font-medium">{ordem.Cliente?.nome || "N/A"}</TableCell>
                            <TableCell>{ordem.descricao}</TableCell>
                            <TableCell>R$ {ordem.custo_estimado}</TableCell>
                            <TableCell>{getStatusBadge(ordem.status)}</TableCell>
                            <TableCell>
                              {new Intl.DateTimeFormat("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(ordem.data_estimativa))}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(ordem)}>
                                  <Search className="h-4 w-4" />
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {ordem.status === "pendente" && (
                                      <DropdownMenuItem onClick={() => updateOrderStatus(ordem.id, "em_progresso")}>
                                        Iniciar Serviço
                                      </DropdownMenuItem>
                                    )}
                                    {ordem.status === "em_progresso" && (
                                      <DropdownMenuItem onClick={() => updateOrderStatus(ordem.id, "completada")}>
                                        Marcar como Concluído
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => navigate(`/prestador/ordem/${ordem.id}`)}>
                                      Ver Detalhes
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            Nenhuma ordem de serviço encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>

                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {filteredOrders.length} de {dashboardData.orders.length} ordens
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate("/prestador/painel-os")}>
                    Ver todas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Desempenho</CardTitle>
                  <CardDescription>
                    Visualize o progresso dos seus serviços e faturamento ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="completadas"
                          stroke="#10b981"
                          name="Serviços Concluídos"
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="em_progresso"
                          stroke="#3b82f6"
                          name="Serviços em Andamento"
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="pendentes"
                          stroke="#f59e0b"
                          name="Serviços Pendentes"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="faturamento"
                          stroke="#8b5cf6"
                          name="Faturamento (R$)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Modal de detalhes da ordem */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes da Ordem de Serviço</DialogTitle>
              <DialogDescription>Informações detalhadas sobre a ordem #{selectedOrder.id}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-right font-medium">Cliente:</p>
                <p className="col-span-3">{selectedOrder.Cliente?.nome || "N/A"}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-right font-medium">Descrição:</p>
                <p className="col-span-3">{selectedOrder.descricao}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-right font-medium">Status:</p>
                <div className="col-span-3">{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-right font-medium">Custo:</p>
                <p className="col-span-3">R$ {selectedOrder.custo_estimado}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-right font-medium">Data Estimada:</p>
                <p className="col-span-3">
                  {new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(selectedOrder.data_estimativa))}
                </p>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Fechar
              </Button>

              {selectedOrder.status === "pendente" && (
                <Button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, "em_progresso")
                    setSelectedOrder(null)
                  }}
                >
                  Iniciar Serviço
                </Button>
              )}

              {selectedOrder.status === "em_progresso" && (
                <Button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, "completada")
                    setSelectedOrder(null)
                  }}
                >
                  Marcar como Concluído
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default PrestadorDashboard

