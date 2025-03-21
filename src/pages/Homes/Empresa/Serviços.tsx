"use client"

import type React from "react"
import { type ChangeEvent, useEffect, useState, useCallback } from "react"
import { PlusCircle, Filter, Search, MoreVertical, XIcon, ArrowDown, CheckSquare } from "lucide-react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Header from "../Header"
import { useNavigate } from "react-router-dom"
import api from "@/services/api"
import type { AxiosError } from "axios"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import moment from "moment-timezone"

interface Client {
  id: string
  nome: string
}

interface Provider {
  id: string
  nome: string
}

interface ServiceOrder {
  id: number
  descricao: string
  cliente: {
    nome: string
  }
  status: "pendente" | "em_progresso" | "completada"
  data_estimativa: string
  prioridade: "high" | "medium" | "low"
}

interface FormData {
  empresaId: string
  descricao: string
  cliente_id: string
  prestador_id: string
  prioridade: string
  endereco_servico: string
  data_estimativa: string
  custo_estimado: number
  anexos: string
}

const Servico: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [dateFilter, setDateFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isFilterActive, setIsFilterActive] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [showCompleted, setShowCompleted] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    empresaId: "",
    descricao: "",
    cliente_id: "",
    prestador_id: "",
    prioridade: "",
    endereco_servico: "",
    data_estimativa: "",
    custo_estimado: 0,
    anexos: "",
  })

  const resetForm = () => {
    setFormData({
      empresaId: "",
      descricao: "",
      cliente_id: "",
      prestador_id: "",
      prioridade: "",
      endereco_servico: "",
      data_estimativa: "",
      custo_estimado: 0,
      anexos: "",
    })
    setErrorMessage("")
  }

  const handleInputChange = (field: keyof FormData) => (e: ChangeEvent<HTMLInputElement>) => {
    if (field === "data_estimativa") {
      // Convert the local date to BRT
      const localDate = new Date(e.target.value)
      const brtDate = moment.tz(localDate, "America/Sao_Paulo")
      setFormData((prev) => ({
        ...prev,
        [field]: brtDate.toISOString(),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }))
    }
  }

  const dateFilterOptions = [
    { id: "today", label: "Hoje" },
    { id: "week", label: "Esta semana" },
    { id: "month", label: "Este mês" },
  ]

  const validateForm = () => {
    const { descricao, prestador_id, cliente_id, custo_estimado, data_estimativa, endereco_servico, prioridade } =
      formData

    if (
      !descricao ||
      !prestador_id ||
      !cliente_id ||
      !custo_estimado ||
      !data_estimativa ||
      !endereco_servico ||
      !prioridade
    ) {
      setErrorMessage("Todos os campos são obrigatórios.")
      return false
    }

    if (isNaN(custo_estimado) || custo_estimado <= 0) {
      setErrorMessage("O custo estimado deve ser um número maior que 0.")
      return false
    }

    setErrorMessage("")
    return true
  }

  const getEmpresaIdFromToken = () => {
    const token = localStorage.getItem("token")
    if (!token) {
      return null
    }

    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1]))
      return decodedToken?.id || null
    } catch (error) {
      console.error("Erro ao decodificar o token:", error)
      return null
    }
  }

  // Remova 'providers' do array de dependências do useCallback
const fetchData = useCallback(async () => {
  try {
    const token = localStorage.getItem("token")
    const empresaId = getEmpresaIdFromToken()

    if (!empresaId || !token) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Empresa não identificada. Por favor, faça login novamente.",
      })
      return
    }

    // Melhore o tratamento de erros aqui
    try {
      const serviceOrdersResponse = await api.get(`/ordens-servico/empresa/${empresaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const ordersData = serviceOrdersResponse.data

      const transformedServiceOrders = ordersData.map((order: any) => ({
        id: order.id,
        descricao: order.descricao,
        cliente: {
          nome: order.Cliente?.nome || "Cliente não identificado",
        },
        status: order.status?.toLowerCase() || "pendente", // Adicione fallback
        data_estimativa: order.data_estimativa ? moment(order.data_estimativa).tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm") : "Data não definida",
        prioridade: order.prioridade || "medium", // Adicione fallback
      }))

      setServiceOrders(transformedServiceOrders)
    } catch (error) {
      console.error("Erro ao buscar ordens de serviço:", error)
      // Não deslogue aqui, apenas mostre o erro
    }

    // Separe as chamadas para evitar que uma falha afete as outras
    try {
      const clientsResponse = await api.get("/clientes", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setClients(clientsResponse.data)
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
    }

    // Melhore o tratamento da resposta de prestadores
    try {
      const providersResponse = await api.get(`/prestadores/${empresaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // Verifique as diferentes estruturas possíveis na resposta
      if (providersResponse.data?.data?.prestadores) {
        setProviders(providersResponse.data.data.prestadores)
      } else if (Array.isArray(providersResponse.data)) {
        setProviders(providersResponse.data)
      } else if (providersResponse.data?.prestadores) {
        setProviders(providersResponse.data.prestadores)
      } else {
        console.warn("Formato inesperado na resposta de prestadores:", providersResponse.data)
        setProviders([])
      }
    } catch (error) {
      console.error("Erro ao buscar prestadores:", error)
    }
  } catch (error) {
    console.error("Erro geral no fetchData:", error)
    toast({
      variant: "destructive",
      title: "Erro de load",
      description: "Não foi possível carregar dados.",
    })
    // Não deslogue automaticamente aqui
  }
// Remova 'providers' daqui para evitar loop infinito
}, [toast]);

  const handleOrder = async () => {
    if (!validateForm()) return

    const { descricao, prestador_id, cliente_id, custo_estimado, data_estimativa, endereco_servico, prioridade } =
      formData

    const empresaId = getEmpresaIdFromToken()
    if (!empresaId) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Empresa não identificada. Por favor, faça login novamente.",
      })
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const response = await api.post(
        "/ordens-servico",
        {
          empresaId,
          descricao,
          prestador_id,
          cliente_id,
          custo_estimado,
          data_estimativa: moment(formData.data_estimativa).tz("America/Sao_Paulo").format(),
          endereco_servico,
          prioridade,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 201) {
        resetForm()
        fetchData()
        toast({
          title: "Sucesso",
          description: "Ordem de serviço criada com sucesso!",
        })
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>

      const errorMessage =
        axiosError.response?.status === 400
          ? axiosError.response?.data?.message
          : axiosError.response?.status === 500
            ? "Erro interno no servidor. Tente novamente mais tarde."
            : "Ocorreu um erro ao registrar ordem. Tente novamente mais tarde."

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      })

      console.error("Erro durante o registro: ", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return

    const token = localStorage.getItem("token")

    try {
      const response = await api.delete(`/ordens-servico/${serviceToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 200) {
        toast({
          title: "Sucesso",
          description: "Ordem de Serviço deletada com sucesso.",
        })
        fetchData()
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.status === 404
          ? "Ordem de Serviço não encontrada."
          : error.response?.status === 403
            ? "Você não tem permissão para realizar esta ação."
            : "Erro ao excluir a Ordem de Serviço."

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      })
    } finally {
      setServiceToDelete(null)
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: ServiceOrder["status"]) => {
    const token = localStorage.getItem("token")

    try {
      const response = await api.put(
        `/ordens-servico/${id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (response.status === 200) {
        toast({
          title: "Sucesso",
          description: "Status atualizado com sucesso.",
        })
        fetchData()
      }
    } catch (error: any) {
      console.error("Erro ao atualizar o status da ordem de serviço:", error)

      const errorMessage =
        error.response?.status === 404
          ? "Ordem de Serviço não encontrada."
          : error.response?.status === 403
            ? "Você não tem permissão para realizar esta ação."
            : "Erro ao atualizar o status da Ordem de Serviço."

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login-company")
        return
      }

      try {
        const response = await api.get("/empresa-dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.status === 200) {
          setIsAuthorized(true)
          fetchData()
        }
      } catch (error) {
        console.error("Erro na autenticação:", error)
        navigate("/login")
      }
    }

    verifyToken()
  }, [navigate, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!isAuthorized) {
    return <div>Carregando...</div>
  }

  const getStatusBadge = (status: ServiceOrder["status"]) => {
    const statusStyles: Record<ServiceOrder["status"], string> = {
      pendente: "bg-yellow-100 text-yellow-800",
      em_progresso: "bg-blue-100 text-blue-800",
      completada: "bg-green-100 text-green-800",
    }

    const statusLabels: Record<ServiceOrder["status"], string> = {
      pendente: "Pendente",
      em_progresso: "Em Andamento",
      completada: "Concluído",
    }

    return <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityStyles: Record<string, string> = {
      high: "bg-red-100 text-red-800",
      medium: "bg-orange-100 text-orange-800",
      low: "bg-blue-100 text-blue-800",
    }

    const priorityLabels: Record<string, string> = {
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    }

    return <Badge className={priorityStyles[priority]}>{priorityLabels[priority]}</Badge>
  }

  const handleButtonClick = () => {
    // Alterna o estado de isFilterActive
    setIsFilterActive((prev) => !prev)
  }

  const filteredServices = serviceOrders.filter((service) => {
    // First check if we should show completed or non-completed services
    const completedFilter = showCompleted ? service.status === "completada" : service.status !== "completada"

    // Status filter (only apply if not showing completed)
    const matchesStatus = showCompleted
      ? true
      : statusFilter === "all" || service.status.toLowerCase() === statusFilter.toLowerCase()

    // Search filter
    const searchQuery = searchTerm.toLowerCase()
    const matchesSearch =
      service.descricao.toLowerCase().includes(searchQuery) || service.cliente.nome.toLowerCase().includes(searchQuery)

    // Date filter
    const matchesDate = (() => {
      if (dateFilter === "all") return true

      const [day, month, year] = service.data_estimativa.split("/").map(Number)
      const serviceDate = new Date(year, month - 1, day)
      serviceDate.setHours(0, 0, 0, 0)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      switch (dateFilter) {
        case "today":
          return serviceDate.getTime() === today.getTime()

        case "week": {
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay())
          const weekEnd = new Date(today)
          weekEnd.setDate(weekStart.getDate() + 6)
          return serviceDate >= weekStart && serviceDate <= weekEnd
        }

        case "month": {
          return serviceDate.getMonth() === today.getMonth() && serviceDate.getFullYear() === today.getFullYear()
        }

        default:
          return true
      }
    })()

    return completedFilter && matchesStatus && matchesSearch && matchesDate
  })

  const getStatusColor = (status: ServiceOrder["status"]) => {
    return {
      pendente: "bg-yellow-500",
      em_progresso: "bg-blue-500",
      completada: "bg-green-500",
    }[status]
  }

  return (
    <>
      <Toaster />
      <Header userType="empresa" />

      <div className="md:ml-60 p-4 md:p-7 space-y-4 md:space-y-6">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 bg-white rounded-lg shadow-sm p-4">
          <CardTitle className="text-xl md:text-2xl">Gestão de Serviços</CardTitle>
        </CardHeader>

        <CardContent className="bg-white rounded-lg shadow-md p-4 md:p-8">
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar serviço..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {!showCompleted && (
                  <DropdownMenu open={isFilterActive} onOpenChange={setIsFilterActive}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">Status</span>
                        {statusFilter !== "all" && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                        <ArrowDown
                          className={`w-4 h-4 transition-transform duration-300 ${isFilterActive ? "transform rotate-180" : ""}`}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>Todos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("pendente")}>Pendente</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("em_progresso")}>Em Andamento</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button
                  variant={showCompleted ? "default" : "outline"}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 ${
                    showCompleted ? "bg-green-600 hover:bg-green-700" : ""
                  }`}
                  onClick={() => {
                    setShowCompleted(!showCompleted)
                    setStatusFilter("all")
                  }}
                >
                  <CheckSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">{showCompleted ? "Voltar" : "Concluídos"}</span>
                </Button>

                {!showCompleted && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
                        <PlusCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Novo</span>
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Nova Ordem de Serviço</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">
                        <Input
                          placeholder="Descrição do Serviço"
                          value={formData.descricao}
                          onChange={handleInputChange("descricao")}
                        />

                        <Select
                          value={formData.cliente_id}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, cliente_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar Cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={formData.prestador_id}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, prestador_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar Prestador" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(providers) && providers.length > 0 ? (
                              providers.map((provider) => (
                                <SelectItem key={provider.id} value={String(provider.id)}>
                                  {provider.nome}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem disabled value="no-providers">
                                Nenhum prestador disponível
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>

                        <Select
                          value={formData.prioridade}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, prioridade: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar Prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="low">Baixa</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Endereço do Serviço"
                          value={formData.endereco_servico}
                          onChange={handleInputChange("endereco_servico")}
                        />

                        <Input
                          type="datetime-local"
                          value={moment(formData.data_estimativa).tz("America/Sao_Paulo").format("YYYY-MM-DDTHH:mm")}
                          onChange={handleInputChange("data_estimativa")}
                        />

                        <Input
                          type="number"
                          placeholder="Custo Estimado"
                          value={formData.custo_estimado.toString()}
                          onChange={handleInputChange("custo_estimado")}
                        />

                        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

                        <Button className="w-full" onClick={handleOrder} disabled={loading}>
                          {loading ? "Criando..." : "Criar OS"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-x-visible">
              {dateFilterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDateFilter(option.id)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm border border-gray-300 transition-all duration-300 flex items-center ${
                    dateFilter === option.id ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{option.label}</span>
                  {dateFilter === option.id && (
                    <button
                      className="ml-2 text-gray-300 hover:text-red-600 transition-colors duration-200 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDateFilter("all")
                      }}
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500 col-span-full">Nenhum serviço encontrado</div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="relative p-4 md:p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between bg-white"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 p-1 text-gray-600 hover:text-blue-600"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleUpdateStatus(service.id, "em_progresso")}>
                        Em andamento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(service.id, "completada")}>
                        Concluído
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setServiceToDelete(service.id)} className="text-red-600">
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <AlertDialog
                    open={serviceToDelete === service.id}
                    onOpenChange={(open) => {
                      if (!open) setServiceToDelete(null)
                    }}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            handleDeleteConfirm()
                            setServiceToDelete(null)
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`w-2 md:w-3 h-2 md:h-3 rounded-full ${getStatusColor(service.status)}`} />
                      <h3 className="font-semibold text-base md:text-lg line-clamp-2">{service.descricao}</h3>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 space-y-1">
                      <p>Cliente: {service.cliente.nome}</p>
                      <p>Data: {service.data_estimativa}</p>
                      <p>OS #{service.id}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                      {getStatusBadge(service.status)}
                      {getPriorityBadge(service.prioridade)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </div>
    </>
  )
}

export default Servico

