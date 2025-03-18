"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Clipboard,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  MoreHorizontal,
  Star,
  MessageSquare,
  Banknote,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getPrestadorIdFromToken } from "../Empresa/utils"
import Header from "../Header"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import api from "@/services/api"

interface Cliente {
  id: number
  nome: string
  telefone: string
  email: string
}

interface OrdemServico {
  id: number
  descricao: string
  Cliente: Cliente
  status: "pendente" | "em_progresso" | "completada" | "cancelada"
  data_estimativa: string
  custo_estimado: number
  prestador_id: number
  created_at: string
  updated_at: string
  endereco_servico: string
  prioridade: "baixa" | "medium" | "alta" | "urgente"
  observacoes?: string
  avaliacao?: number
  comentario_cliente?: string
}

interface PainelOSState {
  ordens: OrdemServico[]
  loading: boolean
  error: string | null
  filteredOrdens: OrdemServico[]
  searchTerm: string
  statusFilter: string
  prioridadeFilter: string
  sortConfig: { key: string; direction: "ascending" | "descending" } | null
  selectedOrdem: OrdemServico | null
  isDialogOpen: boolean
  isAddingComment: boolean
  newComment: string
  currentPage: number
  itemsPerPage: number
  totalPages: number
}

const PainelOS: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [state, setState] = useState<PainelOSState>({
    ordens: [],
    loading: true,
    error: null,
    filteredOrdens: [],
    searchTerm: "",
    statusFilter: "all",
    prioridadeFilter: "all",
    sortConfig: null,
    selectedOrdem: null,
    isDialogOpen: false,
    isAddingComment: false,
    newComment: "",
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
  })

  const fetchOrdens = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }))
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
      if (!token) throw new Error("Token não encontrado")

      const response = await api.get(`/ordens-servico/prestador/${prestadorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = response.data
      console.log("Dados recebidos da API:", data)

      if (data && Array.isArray(data.orders)) {
        setState((prev) => ({
          ...prev,
          ordens: data.orders,
          filteredOrdens: data.orders,
          loading: false,
          error: null,
        }))
      } else {
        throw new Error("Formato de dados inválido")
      }
    } catch (error) {
      console.error("Erro ao buscar ordens de serviço:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      toast({
        title: "Erro",
        description: "Falha ao carregar as ordens de serviço.",
        variant: "destructive",
      })
    }
  }, [navigate, toast])

  useEffect(() => {
    fetchOrdens()
  }, [fetchOrdens])

  useEffect(() => {
    // Filtrar e ordenar ordens sempre que os filtros ou a ordenação mudarem
    let result = [...state.ordens]

    // Aplicar filtro de pesquisa
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase()
      result = result.filter(
        (ordem) =>
          ordem.descricao.toLowerCase().includes(searchLower) ||
          ordem.Cliente?.nome.toLowerCase().includes(searchLower) ||
          ordem.endereco_servico.toLowerCase().includes(searchLower),
      )
    }

    // Aplicar filtro de status
    if (state.statusFilter !== "all") {
      result = result.filter((ordem) => ordem.status === state.statusFilter)
    }

    // Aplicar filtro de prioridade
    if (state.prioridadeFilter !== "all") {
      result = result.filter((ordem) => ordem.prioridade === state.prioridadeFilter)
    }

    // Aplicar ordenação
    if (state.sortConfig) {
      result.sort((a, b) => {
        if (state.sortConfig?.key === "cliente") {
          const aValue = a.Cliente?.nome || ""
          const bValue = b.Cliente?.nome || ""
          return state.sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        } else if (state.sortConfig?.key === "data") {
          return state.sortConfig.direction === "ascending"
            ? new Date(a.data_estimativa).getTime() - new Date(b.data_estimativa).getTime()
            : new Date(b.data_estimativa).getTime() - new Date(a.data_estimativa).getTime()
        } else if (state.sortConfig?.key === "prioridade") {
          const prioridadeOrder = { baixa: 1, medium: 2, alta: 3, urgente: 4 }
          const aValue = prioridadeOrder[a.prioridade] || 0
          const bValue = prioridadeOrder[b.prioridade] || 0
          return state.sortConfig.direction === "ascending" ? aValue - bValue : bValue - aValue
        }
        return 0
      })
    }

    setState((prev) => ({ ...prev, filteredOrdens: result }))
  }, [state.ordens, state.searchTerm, state.statusFilter, state.prioridadeFilter, state.sortConfig])

  useEffect(() => {
    // Calcular o número total de páginas
    const totalPages = Math.ceil(state.filteredOrdens.length / state.itemsPerPage)

    // Atualizar o estado com o número total de páginas
    setState((prev) => ({ ...prev, totalPages }))

    // Se a página atual for maior que o total de páginas, voltar para a primeira página
    if (state.currentPage > totalPages && totalPages > 0) {
      setState((prev) => ({ ...prev, currentPage: 1 }))
    }
  }, [state.filteredOrdens, state.itemsPerPage, state.currentPage])

  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }))
  }

  const handlePreviousPage = () => {
    if (state.currentPage > 1) {
      setState((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
    }
  }

  const handleNextPage = () => {
    if (state.currentPage < state.totalPages) {
      setState((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    setState((prev) => ({ ...prev, itemsPerPage: Number.parseInt(value), currentPage: 1 }))
  }

  // Calcular os itens da página atual
  const paginatedOrdens = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage
    const endIndex = startIndex + state.itemsPerPage
    return state.filteredOrdens.slice(startIndex, endIndex)
  }, [state.filteredOrdens, state.currentPage, state.itemsPerPage])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, searchTerm: e.target.value }))
  }

  const handleStatusFilter = (value: string) => {
    setState((prev) => ({ ...prev, statusFilter: value }))
  }

  const handlePrioridadeFilter = (value: string) => {
    setState((prev) => ({ ...prev, prioridadeFilter: value }))
  }

  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (state.sortConfig && state.sortConfig.key === key && state.sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setState((prev) => ({ ...prev, sortConfig: { key, direction } }))
  }

  const handleOpenDetails = (ordem: OrdemServico) => {
    setState((prev) => ({ ...prev, selectedOrdem: ordem, isDialogOpen: true }))
  }

  const handleCloseDetails = () => {
    setState((prev) => ({ ...prev, isDialogOpen: false, selectedOrdem: null }))
  }

  const updateOrdemStatus = async (id: number, newStatus: OrdemServico["status"]) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado")

      await api.patch(`/ordens-servico/${id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } })

      // Atualizar localmente
      setState((prev) => ({
        ...prev,
        ordens: prev.ordens.map((ordem) => (ordem.id === id ? { ...ordem, status: newStatus } : ordem)),
        selectedOrdem:
          prev.selectedOrdem?.id === id ? { ...prev.selectedOrdem, status: newStatus } : prev.selectedOrdem,
      }))

      toast({
        title: "Status atualizado",
        description: "O status da ordem de serviço foi atualizado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Falha ao atualizar o status. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleAddComment = () => {
    setState((prev) => ({ ...prev, isAddingComment: true }))
  }

  const handleSaveComment = async () => {
    if (!state.selectedOrdem) return

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado")

      await api.patch(
        `/ordens-servico/${state.selectedOrdem.id}/observacoes`,
        { observacoes: state.newComment },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Atualizar localmente
      setState((prev) => ({
        ...prev,
        ordens: prev.ordens.map((ordem) =>
          ordem.id === prev.selectedOrdem?.id ? { ...ordem, observacoes: prev.newComment } : ordem,
        ),
        selectedOrdem: prev.selectedOrdem ? { ...prev.selectedOrdem, observacoes: prev.newComment } : null,
        isAddingComment: false,
        newComment: "",
      }))

      toast({
        title: "Observação adicionada",
        description: "A observação foi adicionada com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao adicionar observação:", error)
      toast({
        title: "Erro",
        description: "Falha ao adicionar observação. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleCancelComment = () => {
    setState((prev) => ({ ...prev, isAddingComment: false, newComment: "" }))
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState((prev) => ({ ...prev, newComment: e.target.value }))
  }

  const getStatusBadge = (status: OrdemServico["status"]) => {
    const statusStyles: Record<OrdemServico["status"], { bg: string; text: string; icon: React.ReactNode }> = {
      pendente: { bg: "bg-yellow-100", text: "text-yellow-800", icon: <Clock className="h-3 w-3 mr-1" /> },
      em_progresso: { bg: "bg-blue-100", text: "text-blue-800", icon: <RefreshCw className="h-3 w-3 mr-1" /> },
      completada: { bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      cancelada: { bg: "bg-red-100", text: "text-red-800", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
    }

    const statusLabels: Record<OrdemServico["status"], string> = {
      pendente: "Pendente",
      em_progresso: "Em Andamento",
      completada: "Concluído",
      cancelada: "Cancelado",
    }

    const style = statusStyles[status]
    return (
      <Badge className={`${style.bg} ${style.text} flex items-center`}>
        {style.icon}
        {statusLabels[status]}
      </Badge>
    )
  }

  const getPrioridadeBadge = (prioridade: OrdemServico["prioridade"]) => {
    const prioridadeStyles: Record<string, { bg: string; text: string }> = {
      baixa: { bg: "bg-green-100", text: "text-green-800" },
      media: { bg: "bg-blue-100", text: "text-blue-800" },
      alta: { bg: "bg-orange-100", text: "text-orange-800" },
      urgente: { bg: "bg-red-100", text: "text-red-800" },
      default: { bg: "bg-gray-100", text: "text-gray-800" }, // Valor padrão
    }

    const prioridadeLabels: Record<string, string> = {
      baixa: "Baixa",
      media: "Média",
      alta: "Alta",
      urgente: "Urgente",
      default: "Não definida", // Valor padrão
    }

    // Verificar se a prioridade existe no objeto de estilos, caso contrário usar o padrão
    const style = prioridadeStyles[prioridade] || prioridadeStyles.default
    const label = prioridadeLabels[prioridade] || prioridadeLabels.default

    return <Badge className={`${style.bg} ${style.text}`}>{label}</Badge>
  }

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "Data não disponível"

    try {
      const date = new Date(dateString)
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return "Data inválida"
      }

      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    } catch (error) {
      console.error("Erro ao formatar data:", error)
      return "Erro ao formatar data"
    }
  }

  const formatTime = (dateString: string | undefined | null) => {
    if (!dateString) return "Hora não disponível"

    try {
      const date = new Date(dateString)
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return "Hora inválida"
      }

      return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch (error) {
      console.error("Erro ao formatar hora:", error)
      return "Erro ao formatar hora"
    }
  }

  const formatDateTime = (dateString: string | undefined | null) => {
    if (!dateString) return "Data/hora não disponível"

    try {
      const date = new Date(dateString)
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return "Data/hora inválida"
      }

      return `${formatDate(dateString)} às ${formatTime(dateString)}`
    } catch (error) {
      console.error("Erro ao formatar data e hora:", error)
      return "Erro ao formatar data e hora"
    }
  }

  if (state.loading) {
    return (
      <>
        <Header userType="prestador" userAvatar="/path-to-avatar.jpg" />
        <div className="p-4 md:p-8 md:ml-60">
          <div className="flex flex-col space-y-4">
            <Skeleton className="h-12 w-[250px]" />
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Skeleton className="h-10 w-full md:w-[250px]" />
              <Skeleton className="h-10 w-full md:w-[150px]" />
              <Skeleton className="h-10 w-full md:w-[150px]" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </>
    )
  }

  if (state.error) {
    return (
      <>
        <Header userType="prestador" userAvatar="/path-to-avatar.jpg" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Erro ao carregar ordens de serviço</h2>
            <p className="text-gray-600 mt-2">{state.error}</p>
            <Button onClick={() => fetchOrdens()} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header userType="prestador" userAvatar="/path-to-avatar.jpg" />
      <div className="p-4 md:p-8 md:ml-60">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Clipboard className="h-6 w-6" />
                Painel de Ordens de Serviço
              </h1>
              <p className="text-muted-foreground">Gerencie todas as suas ordens de serviço em um só lugar</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchOrdens}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate("/prestador/agenda")}>
                <Calendar className="h-4 w-4 mr-2" />
                Ver Agenda
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex items-center w-full md:w-auto">
                  <Search className="h-4 w-4 text-muted-foreground mr-2" />
                  <Input
                    placeholder="Buscar por cliente, descrição ou endereço..."
                    value={state.searchTerm}
                    onChange={handleSearch}
                    className="w-full md:w-[300px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2">
                    <Select value={state.statusFilter} onValueChange={handleStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_progresso">Em Andamento</SelectItem>
                        <SelectItem value="completada">Concluído</SelectItem>
                        <SelectItem value="cancelada">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={state.prioridadeFilter} onValueChange={handlePrioridadeFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrar por prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as prioridades</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("cliente")}>
                        <div className="flex items-center">
                          Cliente
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("data")}>
                        <div className="flex items-center">
                          Data Agendada
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("prioridade")}>
                        <div className="flex items-center">
                          Prioridade
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrdens.length > 0 ? (
                      paginatedOrdens.map((ordem) => (
                        <TableRow key={ordem.id}>
                          <TableCell className="font-medium">#{ordem.id}</TableCell>
                          <TableCell>{ordem.Cliente?.nome || "N/A"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{ordem.descricao}</TableCell>
                          <TableCell>{formatDateTime(ordem.data_estimativa)}</TableCell>
                          <TableCell>{getStatusBadge(ordem.status)}</TableCell>
                          <TableCell>{getPrioridadeBadge(ordem.prioridade)}</TableCell>
                          <TableCell>R$ {ordem.custo_estimado}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDetails(ordem)}
                                title="Ver detalhes"
                              >
                                <Search className="h-4 w-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" title="Mais opções">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {ordem.status === "pendente" && (
                                    <DropdownMenuItem onClick={() => updateOrdemStatus(ordem.id, "em_progresso")}>
                                      <Clock className="h-4 w-4 mr-2" />
                                      Iniciar Serviço
                                    </DropdownMenuItem>
                                  )}
                                  {ordem.status === "em_progresso" && (
                                    <DropdownMenuItem onClick={() => updateOrdemStatus(ordem.id, "completada")}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Marcar como Concluído
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleOpenDetails(ordem)}>
                                    <FileText className="h-4 w-4 mr-2" />
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
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                          Nenhuma ordem de serviço encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Mostrando {paginatedOrdens.length} de {state.ordens.length} ordens
                </p>
                <Select value={state.itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Itens por página" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 por página</SelectItem>
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="20">20 por página</SelectItem>
                    <SelectItem value="50">50 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={state.currentPage === 1}>
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, state.totalPages) }, (_, i) => {
                    // Lógica para mostrar páginas ao redor da página atual
                    let pageToShow
                    if (state.totalPages <= 5) {
                      pageToShow = i + 1
                    } else if (state.currentPage <= 3) {
                      pageToShow = i + 1
                    } else if (state.currentPage >= state.totalPages - 2) {
                      pageToShow = state.totalPages - 4 + i
                    } else {
                      pageToShow = state.currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageToShow}
                        variant={state.currentPage === pageToShow ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => handlePageChange(pageToShow)}
                      >
                        {pageToShow}
                      </Button>
                    )
                  })}

                  {state.totalPages > 5 && state.currentPage < state.totalPages - 2 && (
                    <>
                      <span className="mx-1">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => handlePageChange(state.totalPages)}
                      >
                        {state.totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={state.currentPage === state.totalPages}
                >
                  Próxima
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Modal de detalhes da ordem */}
      {state.selectedOrdem && (
        <Dialog open={state.isDialogOpen} onOpenChange={handleCloseDetails}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Detalhes da Ordem de Serviço #{state.selectedOrdem.id}</DialogTitle>
              <DialogDescription>Criada em {formatDateTime(state.selectedOrdem.created_at)}</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Informações do Serviço</h3>
                  <div className="space-y-3 bg-muted/50 p-3 rounded-md">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Descrição</div>
                        <div className="text-sm">{state.selectedOrdem.descricao}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Data Agendada</div>
                        <div className="text-sm">{formatDateTime(state.selectedOrdem.data_estimativa)}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Endereço</div>
                        <div className="text-sm">{state.selectedOrdem.endereco_servico}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Banknote className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Valor Estimado</div>
                        <div className="text-sm">R$ {state.selectedOrdem.custo_estimado}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Prioridade</div>
                        <div>{getPrioridadeBadge(state.selectedOrdem.prioridade)}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Status</div>
                        <div>{getStatusBadge(state.selectedOrdem.status)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {state.selectedOrdem.avaliacao && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Avaliação do Cliente</h3>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < state.selectedOrdem!.avaliacao! ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-sm ml-2">{state.selectedOrdem.avaliacao} de 5</span>
                      </div>
                      {state.selectedOrdem.comentario_cliente && (
                        <div className="text-sm italic">"{state.selectedOrdem.comentario_cliente}"</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Informações do Cliente</h3>
                  <div className="space-y-3 bg-muted/50 p-3 rounded-md">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Nome</div>
                        <div className="text-sm">{state.selectedOrdem.Cliente.nome}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Telefone</div>
                        <div className="text-sm">{state.selectedOrdem.Cliente.telefone}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Email</div>
                        <div className="text-sm">{state.selectedOrdem.Cliente.email}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Observações</h3>
                  {state.isAddingComment ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Digite suas observações sobre este serviço..."
                        value={state.newComment}
                        onChange={handleCommentChange}
                        className="min-h-[120px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelComment}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSaveComment}>
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 p-3 rounded-md min-h-[120px]">
                      {state.selectedOrdem.observacoes ? (
                        <p className="text-sm whitespace-pre-line">{state.selectedOrdem.observacoes}</p>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-4">
                          <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhuma observação adicionada</p>
                          <Button variant="outline" size="sm" className="mt-2" onClick={handleAddComment}>
                            Adicionar Observação
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between items-center mt-6">
              <Button variant="outline" onClick={handleCloseDetails}>
                Fechar
              </Button>

              <div className="flex gap-2">
                {state.selectedOrdem.status === "pendente" && (
                  <Button
                    onClick={() => {
                      updateOrdemStatus(state.selectedOrdem!.id, "em_progresso")
                      handleCloseDetails()
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Iniciar Serviço
                  </Button>
                )}

                {state.selectedOrdem.status === "em_progresso" && (
                  <Button
                    onClick={() => {
                      updateOrdemStatus(state.selectedOrdem!.id, "completada")
                      handleCloseDetails()
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como Concluído
                  </Button>
                )}

                <Button variant="default" onClick={() => navigate(`/prestador/ordem/${state.selectedOrdem!.id}`)}>
                  Ver Detalhes Completos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default PainelOS

