"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/hooks/use-toast"
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
import {
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  Filter,
  XIcon,
  CheckCircle,
  ArrowLeft,
  Calendar,
  FilterIcon,
  X,
  DollarSign,
  ArrowDown,
} from "lucide-react"
import api from "@/services/api"
import Header from "../Header"
import InputField from "@/components/InputField"
import Pagination from "@/components/Pagination"

// Interfaces
interface ServiceReport {
  id?: number
  descricao: string
  empresaId: number
  prestadorId: number
  ordemServicoId: number
  custo_total: number
  data_criacao: string
  empresa: { id: number; nome: string }
  ordemServico: {
    id: number
    descricao: string
    custo_estimado: number
    status: string
  }
  prestador: { id: number; nome: string }
}

interface CostFilter {
  minValue: number | null
  maxValue: number | null
}

interface ApiError {
  response?: {
    data?: {
      error?: string
    }
    status?: number
  }
  message?: string
}

// Utilitários
const getPrestadorIdFromToken = (): number | null => {
  const token = localStorage.getItem("token")
  if (!token) return null

  try {
    const decodedToken = JSON.parse(atob(token.split(".")[1]))
    return decodedToken?.id || null
  } catch (error) {
    console.error("Erro ao decodificar o token:", error)
    return null
  }
}

const normalizeString = (str: string): string =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return "R$ 0,00"
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("pt-BR")
}

const getStatusClass = (status: string | undefined): string => {
  if (!status) return "bg-gray-200 text-gray-700"

  switch (status) {
    case "completada":
      return "bg-green-100 text-green-700"
    case "em_progresso":
      return "bg-yellow-100 text-yellow-700"
    default:
      return "bg-gray-200 text-gray-700"
  }
}

const RelatoriosPrestador: React.FC = () => {
  // Estados
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([])
  const [filteredReports, setFilteredReports] = useState<ServiceReport[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<{ startDate?: Date; endDate?: Date }>({})
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [costFilter, setCostFilter] = useState<CostFilter>({ minValue: null, maxValue: null })
  const [dateQuickFilter, setDateQuickFilter] = useState<string | null>(null)

  const [showSearch, setShowSearch] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [activeFilterOption, setActiveFilterOption] = useState<string | null>(null)
  const [activeButton, setActiveButton] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentReportId, setCurrentReportId] = useState<number | null | undefined>(undefined)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<ServiceReport | null>(null)

  const [newReport, setNewReport] = useState({
    descricao: "",
    empresaId: 0,
    prestadorId: 0,
    ordemServicoId: 0,
    custo_total: 0,
  })

  const [providerCompany, setProviderCompany] = useState<{ id: number; nome: string } | null>(null)

  // Dados paginados
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredReports.slice(startIndex, endIndex)
  }, [filteredReports, currentPage])

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)

  // Funções de filtro
  const applyFilters = () => {
    const filtered = serviceReports.filter((report) => {
      // Search term filter
      const searchFields = [
        report.descricao,
        report.empresa?.nome,
        report.ordemServico?.descricao,
        report.ordemServico?.status,
      ]

      const matchesSearchTerm =
        !searchTerm ||
        searchFields.filter(Boolean).some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))

      // Date filter
      const reportDate = new Date(report.data_criacao)
      const matchesDateRange =
        (!dateFilter.startDate || reportDate >= dateFilter.startDate) &&
        (!dateFilter.endDate || reportDate <= dateFilter.endDate)

      // Status filter
      const matchesStatus = !statusFilter || report.ordemServico.status === statusFilter

      // Total cost filter
      const matchesCostRange =
        (!costFilter.minValue || report.custo_total >= costFilter.minValue) &&
        (!costFilter.maxValue || report.custo_total <= costFilter.maxValue)

      return matchesSearchTerm && matchesDateRange && matchesStatus && matchesCostRange
    })
    setFilteredReports(filtered)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDateFilter({})
    setStatusFilter(null)
    setShowFilter(false)
    setShowSearch(false)
    setActiveButton("")
    setDateQuickFilter(null)
    setCostFilter({
      minValue: null,
      maxValue: null,
    })

    setFilteredReports(serviceReports)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)

    const normalizedTerm = normalizeString(term)

    const filtered = serviceReports.filter((report) => {
      const searchFields = [
        report.descricao,
        report.empresa?.nome,
        report.ordemServico?.descricao,
        report.ordemServico?.status,
      ]

      const matchesSearchTerm =
        !normalizedTerm || searchFields.filter(Boolean).some((field) => normalizeString(field).includes(normalizedTerm))

      const reportDate = new Date(report.data_criacao)
      const matchesDateRange =
        (!dateFilter.startDate || reportDate >= dateFilter.startDate) &&
        (!dateFilter.endDate || reportDate <= dateFilter.endDate)

      return matchesSearchTerm && matchesDateRange
    })

    setFilteredReports(filtered)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Funções de API
  const fetchServiceReports = async () => {
    const prestadorId = getPrestadorIdFromToken()
    if (!prestadorId) {
      toast({ title: "Erro", description: "Prestador ID não encontrado no token", variant: "destructive" })
      return
    }

    try {
      // Buscar os relatórios do prestador usando o endpoint específico
      const reportsResponse = await api.get(`/relatorios-servico/prestador/${prestadorId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      // Verificar se a resposta contém dados válidos
      if (reportsResponse.data) {
        setServiceReports(reportsResponse.data)
        setFilteredReports(reportsResponse.data)
      } else {
        // Se não houver dados, definir arrays vazios
        setServiceReports([])
        setFilteredReports([])
      }

      // Buscar informações do prestador, incluindo a empresa associada
      try {
        const providerResponse = await api.get(`/prestadores/${prestadorId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })

        if (providerResponse.data && providerResponse.data.empresa) {
          setProviderCompany({
            id: providerResponse.data.empresa.id,
            nome: providerResponse.data.empresa.nome,
          })

          // Atualizar o estado do novo relatório com o ID da empresa
          setNewReport((prev) => ({
            ...prev,
            empresaId: providerResponse.data.empresa.id,
          }))
        }
      } catch (error) {
        const apiError = error as ApiError
        console.error("Erro ao buscar informações do prestador:", apiError.message)
        // Não exibir toast para este erro específico para evitar múltiplas mensagens
      }
    } catch (error) {
      const apiError = error as ApiError
      console.error("Erro ao carregar os relatórios:", apiError.message)

      // Verificar se é um erro 404 (nenhum relatório encontrado)
      if (apiError.response && apiError.response.status === 404) {
        // Definir arrays vazios em vez de mostrar erro
        setServiceReports([])
        setFilteredReports([])
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os relatórios",
          variant: "destructive",
        })
      }
    }
  }

  const handleCreateReport = async () => {
    const prestadorId = getPrestadorIdFromToken()
    const token = localStorage.getItem("token")

    if (!prestadorId) {
      toast({ title: "Erro", description: "ID do prestador não encontrado", variant: "destructive" })
      return
    }

    if (!newReport.descricao || !newReport.ordemServicoId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      // Usar o endpoint específico para prestadores
      const reportData = {
        descricao: newReport.descricao,
        ordemServicoId: newReport.ordemServicoId,
        custo_total: newReport.custo_total || 0,
        prestadorId,
      }

      const response = await api.post("/relatorio-servico/prestador", reportData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 201) {
        const newServiceReport = response.data
        setServiceReports((prevReports) => [...prevReports, newServiceReport])
        setFilteredReports((prevReports) => [...prevReports, newServiceReport])

        setIsDialogOpen(false)
        setNewReport({
          descricao: "",
          empresaId: providerCompany?.id || 0,
          prestadorId: 0,
          ordemServicoId: 0,
          custo_total: 0,
        })

        toast({ title: "Sucesso", description: "Relatório de serviço criado com sucesso" })
      }
    } catch (error) {
      const apiError = error as ApiError
      console.error("Erro ao criar relatório:", apiError.message)

      // Mensagem de erro mais específica baseada na resposta do servidor
      let errorMessage = "Não foi possível criar o relatório de serviço"

      if (apiError.response) {
        if (apiError.response.data && apiError.response.data.error) {
          errorMessage = apiError.response.data.error
        } else if (apiError.response.status === 404) {
          errorMessage = "Ordem de serviço ou prestador não encontrado"
        } else if (apiError.response.status === 403) {
          errorMessage = "Você não tem permissão para criar este relatório"
        } else if (apiError.response.status === 400) {
          errorMessage = "Dados inválidos. Verifique os campos e tente novamente"
        }
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEditReport = async () => {
    const token = localStorage.getItem("token")

    if (!currentReportId) {
      toast({ title: "Erro", description: "ID do relatório não encontrado", variant: "destructive" })
      return
    }

    if (!newReport.descricao || !newReport.ordemServicoId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      // Preparar apenas os dados que precisam ser atualizados
      const updateData = {
        descricao: newReport.descricao,
        ordemServicoId: newReport.ordemServicoId,
        custo_total: newReport.custo_total || 0,
      }

      const response = await api.put(`/relatorio-servico/${currentReportId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 200) {
        const updatedReports = serviceReports.map((report) =>
          report.id === currentReportId ? { ...report, ...updateData } : report,
        )
        setServiceReports(updatedReports)
        setFilteredReports(updatedReports)
        setIsEditDialogOpen(false)
        toast({ title: "Sucesso", description: "Relatório de serviço atualizado com sucesso" })
      }
    } catch (error) {
      const apiError = error as ApiError
      console.error("Erro ao atualizar relatório:", apiError.message)

      // Mensagem de erro mais específica baseada na resposta do servidor
      let errorMessage = "Não foi possível atualizar o relatório de serviço"

      if (apiError.response) {
        if (apiError.response.data && apiError.response.data.error) {
          errorMessage = apiError.response.data.error
        } else if (apiError.response.status === 404) {
          errorMessage = "Relatório não encontrado"
        } else if (apiError.response.status === 403) {
          errorMessage = "Você não tem permissão para editar este relatório"
        }
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (report: ServiceReport) => {
    setReportToDelete(report)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!reportToDelete?.id) return

    const token = localStorage.getItem("token")

    try {
      const response = await api.delete(`/relatorio-servico/${reportToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 200) {
        setServiceReports(serviceReports.filter((report) => report.id !== reportToDelete.id))
        setFilteredReports(filteredReports.filter((report) => report.id !== reportToDelete.id))
        toast({ title: "Sucesso", description: "Relatório de serviço excluído com sucesso" })
      }
    } catch (error) {
      const apiError = error as ApiError
      console.error("Erro ao excluir relatório:", apiError.message)

      // Mensagem de erro mais específica baseada na resposta do servidor
      let errorMessage = "Não foi possível excluir o relatório de serviço"

      if (apiError.response) {
        if (apiError.response.data && apiError.response.data.error) {
          errorMessage = apiError.response.data.error
        } else if (apiError.response.status === 404) {
          errorMessage = "Relatório não encontrado"
        } else if (apiError.response.status === 403) {
          errorMessage = "Você não tem permissão para excluir este relatório"
        }
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setReportToDelete(null)
    }
  }

  // Effects
  useEffect(() => {
    fetchServiceReports()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, dateFilter, statusFilter, costFilter, serviceReports])

  // Renderização
  return (
    <>
      <Toaster />
      <Header userType="prestador" />

      <div className="md:ml-60 md:p-7 p-4 space-y-6">
        {/* Page Header */}
        <div className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Meus Relatórios de Serviço</h1>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-lg p-4 relative">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Quick Date Filters */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {[
                { key: "hoje", label: "Hoje" },
                { key: "semana", label: "Esta semana" },
                { key: "mes", label: "Este mês" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`relative rounded-lg px-3 py-2 text-sm transition-all border border-gray-300 duration-300 flex items-center ${
                    dateQuickFilter === key ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    let startDate, endDate
                    const hoje = new Date()

                    if (key === "hoje") {
                      startDate = new Date(hoje.setHours(0, 0, 0, 0))
                      endDate = new Date()
                    } else if (key === "semana") {
                      const inicioSemana = new Date(hoje)
                      inicioSemana.setDate(hoje.getDate() - hoje.getDay())
                      inicioSemana.setHours(0, 0, 0, 0)
                      startDate = inicioSemana
                      endDate = new Date()
                    } else if (key === "mes") {
                      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
                      inicioMes.setHours(0, 0, 0, 0)
                      startDate = inicioMes
                      endDate = new Date()
                    }

                    setDateFilter({ startDate, endDate })
                    setDateQuickFilter(key)
                  }}
                >
                  {label}

                  {dateQuickFilter === key && (
                    <button
                      className="ml-2 text-gray-300 hover:text-red-600 transition-colors duration-200 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDateFilter({ startDate: undefined, endDate: undefined })
                        setDateQuickFilter(null)
                      }}
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  )}
                </button>
              ))}
            </div>

            {/* Search and Filter Buttons */}
            <div className="flex gap-3 w-full sm:w-auto">
              {!showSearch ? (
                <button
                  className={`rounded-lg px-3 py-2 flex items-center gap-2 border border-gray-300 transition-all duration-300 
                    ${
                      activeButton === "search" ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
                    } text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300`}
                  onClick={() => {
                    setShowSearch(true)
                    setShowFilter(false)
                    setActiveButton("search")
                  }}
                >
                  <Search className="w-5 h-5" />
                  <span>Buscar</span>
                </button>
              ) : (
                <div className="relative w-full flex items-center border border-gray-300 rounded-lg shadow-sm">
                  <Search className="w-6 h-6 text-gray-400 ml-3" />
                  <Input
                    placeholder="Buscar por título, empresa, ordem de serviço..."
                    className="pl-2 pr-10 py-2 w-full text-gray-700 text-sm truncate"
                    style={{
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    value={searchTerm}
                    onChange={(e) => {
                      const term = e.target.value
                      setSearchTerm(term)
                      handleSearch(term)
                    }}
                  />
                  <button
                    className="p-3 text-gray-400 hover:text-red-500 absolute right-0 top-1/2 transform -translate-y-1/2"
                    onClick={() => {
                      setShowSearch(false)
                      setSearchTerm("")
                      handleSearch("")
                      setActiveButton("")
                    }}
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>
              )}

              <button
                className={`rounded-lg px-3 py-2 flex items-center gap-2 border border-gray-300 transition-all duration-300 
                  ${
                    activeButton === "filter" ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
                  } text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300`}
                onClick={() => {
                  const isActive = activeButton === "filter"
                  setShowFilter(!showFilter)
                  setActiveFilterOption(null)

                  if (isActive && showFilter) {
                    setActiveButton("")
                  } else {
                    setActiveButton("filter")
                  }
                }}
              >
                <Filter className="w-5 h-5" />
                <span>Filtrar</span>
                <ArrowDown
                  className={`w-4 h-4 transition-transform duration-300 ${showFilter ? "transform rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Filter Content */}
          {showFilter && (
            <div className="absolute top-full right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 mt-2 w-[90%] md:w-[17rem] z-50 overflow-hidden">
              <button
                onClick={() => {
                  setShowFilter(false)
                  setActiveButton("")
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors group focus:outline-none"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>

              <div className="flex items-center mb-5 pb-3 border-b border-gray-100">
                <FilterIcon className="w-5 h-5 mr-2 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-800">Filtros</h2>
              </div>

              {!activeFilterOption && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="group flex flex-col items-center bg-gray-50 hover:bg-blue-50 p-4 rounded-xl transition-all duration-300 ease-in-out hover:shadow-sm"
                    onClick={() => setActiveFilterOption("data")}
                  >
                    <Calendar className="w-6 h-6 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                      Data
                    </span>
                  </button>
                  <button
                    className="group flex flex-col items-center bg-gray-50 hover:bg-blue-50 p-4 rounded-xl transition-all duration-300 ease-in-out hover:shadow-sm"
                    onClick={() => setActiveFilterOption("status")}
                  >
                    <CheckCircle className="w-6 h-6 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                      Status
                    </span>
                  </button>
                  <button
                    className="group flex flex-col items-center bg-gray-50 hover:bg-blue-50 p-4 rounded-xl transition-all duration-300 ease-in-out hover:shadow-sm"
                    onClick={() => setActiveFilterOption("cost")}
                  >
                    <DollarSign className="w-6 h-6 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                      Custo
                    </span>
                  </button>
                </div>
              )}

              {activeFilterOption === "data" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Data Inicial</label>
                    <input
                      type="date"
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      onChange={(e) =>
                        setDateFilter((prev) => ({
                          ...prev,
                          startDate: e.target.value ? new Date(e.target.value) : undefined,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Data Final</label>
                    <input
                      type="date"
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      onChange={(e) =>
                        setDateFilter((prev) => ({
                          ...prev,
                          endDate: e.target.value ? new Date(e.target.value) : undefined,
                        }))
                      }
                    />
                  </div>

                  <div className="flex justify-between items-center mt-5">
                    <button
                      onClick={() => setActiveFilterOption(null)}
                      className="text-gray-600 hover:text-gray-800 transition-colors flex items-center text-sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                    </button>
                    <button
                      className="bg-blue-600 text-white font-semibold rounded-full px-5 py-2 text-sm hover:bg-blue-700 transition-all duration-300 ease-in-out"
                      onClick={() => setShowFilter(false)}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              {activeFilterOption === "status" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Status</label>
                    <select
                      className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      value={statusFilter || ""}
                      onChange={(e) => setStatusFilter(e.target.value || null)}
                    >
                      <option value="">Todos os Status</option>
                      <option value="em_progresso">Em Progresso</option>
                      <option value="completada">Completada</option>
                      <option value="Aberta">Pendente</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center mt-5">
                    <button
                      onClick={() => setActiveFilterOption(null)}
                      className="text-gray-600 hover:text-gray-800 transition-colors flex items-center text-sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                    </button>
                    <button
                      className="bg-blue-600 text-white font-semibold rounded-full px-5 py-2 text-sm hover:bg-blue-700 transition-all duration-300 ease-in-out"
                      onClick={() => setShowFilter(false)}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              {activeFilterOption === "cost" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Custo Total</label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-gray-600 text-xs mb-1">Mínimo</label>
                        <input
                          type="number"
                          placeholder="R$ Mínimo"
                          className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          value={costFilter.minValue || ""}
                          onChange={(e) =>
                            setCostFilter((prev) => ({
                              ...prev,
                              minValue: e.target.value ? Number.parseFloat(e.target.value) : null,
                            }))
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-gray-600 text-xs mb-1">Máximo</label>
                        <input
                          type="number"
                          placeholder="R$ Máximo"
                          className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          value={costFilter.maxValue || ""}
                          onChange={(e) =>
                            setCostFilter((prev) => ({
                              ...prev,
                              maxValue: e.target.value ? Number.parseFloat(e.target.value) : null,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-5">
                    <button
                      onClick={() => setActiveFilterOption(null)}
                      className="text-gray-600 hover:text-gray-800 transition-colors flex items-center text-sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                    </button>
                    <button
                      className="bg-blue-600 text-white font-semibold rounded-full px-5 py-2 text-sm hover:bg-blue-700 transition-all duration-300 ease-in-out"
                      onClick={() => setShowFilter(false)}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clear Filters Button */}
          {((dateFilter.startDate || dateFilter.endDate) && !dateQuickFilter) ||
          costFilter.minValue ||
          costFilter.maxValue ||
          statusFilter ? (
            <button
              className="rounded-lg px-3 py-2 ml-2 border border-gray-300 bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-200"
              onClick={clearFilters}
            >
              <XIcon className="w-5 h-5 text-red-600" />
              <span>Limpar filtros</span>
            </button>
          ) : null}

          {/* New Report Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition ml-auto">
                <PlusCircle className="w-5 h-5" />
                Novo Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">Criar Novo Relatório</DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                <InputField
                  label="Descrição do Serviço"
                  value={newReport.descricao}
                  onChange={(e) => setNewReport({ ...newReport, descricao: e.target.value })}
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <div className="p-2.5 bg-gray-100 rounded-lg border border-gray-200 text-gray-700">
                    {providerCompany?.nome || "Carregando..."}
                  </div>
                </div>
                <InputField
                  label="ID da Ordem de Serviço"
                  type="number"
                  value={newReport.ordemServicoId}
                  onChange={(e) => setNewReport({ ...newReport, ordemServicoId: Number(e.target.value) })}
                />
                <InputField
                  label="Custo Total"
                  type="number"
                  value={newReport.custo_total}
                  onChange={(e) => setNewReport({ ...newReport, custo_total: Number(e.target.value) })}
                />
                <Button
                  onClick={handleCreateReport}
                  disabled={!newReport.descricao || !newReport.ordemServicoId}
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                >
                  Salvar Relatório
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Table className="w-full mt-4 border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <TableHeader className="bg-gray-100">
            <TableRow>
              {[
                "Descrição",
                "Ordem de Serviço",
                "Empresa",
                "Custo Estimado",
                "Custo Total",
                "Data",
                "Status",
                "Ações",
              ].map((header) => (
                <TableHead
                  key={header}
                  className="py-2 px-4 text-left text-xs text-gray-600 font-medium uppercase tracking-wide border-b border-gray-200"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReports.length > 0 ? (
              paginatedReports.map((report, index) => (
                <TableRow
                  key={report.id}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition-colors duration-150 border-b border-gray-200`}
                >
                  <TableCell className="px-4 py-2 text-xs text-gray-700">{report.descricao}</TableCell>
                  <TableCell className="px-4 py-2 text-xs text-gray-700">
                    {report.ordemServico?.descricao || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-xs text-gray-700">{report.empresa?.nome || "-"}</TableCell>
                  <TableCell className="px-4 py-2 text-xs text-gray-700">
                    {formatCurrency(report.ordemServico?.custo_estimado)}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-xs text-gray-700">
                    {formatCurrency(report.custo_total)}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-xs text-gray-700">{formatDate(report.data_criacao)}</TableCell>
                  <TableCell className="px-4 py-2 text-xs">
                    <Badge
                      className={`py-0.5 px-2 text-[10px] rounded-full font-semibold ${getStatusClass(report.ordemServico?.status)}`}
                    >
                      {report.ordemServico?.status
                        ? report.ordemServico?.status.charAt(0).toUpperCase() + report.ordemServico?.status.slice(1)
                        : "Indefinido"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-blue-500 bg-blue-50 hover:bg-blue-100 p-2 rounded-md shadow-sm transition-all duration-150"
                      onClick={() => {
                        setIsEditDialogOpen(true)
                        setCurrentReportId(report.id ?? null)
                        setNewReport({ ...report })
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-md shadow-sm transition-all duration-150"
                      onClick={() => handleDeleteClick(report)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  Nenhum relatório encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filteredReports.length > itemsPerPage && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}

        {/* Edit Report Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Editar Relatório</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <InputField
                label="Descrição do Serviço"
                value={newReport.descricao}
                onChange={(e) => setNewReport({ ...newReport, descricao: e.target.value })}
              />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <div className="p-2.5 bg-gray-100 rounded-lg border border-gray-200 text-gray-700">
                  {providerCompany?.nome || "Carregando..."}
                </div>
              </div>
              <InputField
                label="ID da Ordem de Serviço"
                type="number"
                value={newReport.ordemServicoId}
                onChange={(e) => setNewReport({ ...newReport, ordemServicoId: Number(e.target.value) })}
              />
              <InputField
                label="Custo Total"
                type="number"
                value={newReport.custo_total}
                onChange={(e) => setNewReport({ ...newReport, custo_total: Number(e.target.value) })}
              />
              <Button
                onClick={handleEditReport}
                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
              >
                Atualizar Relatório
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este relatório de serviço?
              {reportToDelete && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Descrição:</span> {reportToDelete.descricao}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Empresa:</span> {reportToDelete.empresa?.nome}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Data:</span>{" "}
                    {reportToDelete.data_criacao
                      ? new Date(reportToDelete.data_criacao).toLocaleDateString("pt-BR")
                      : "-"}
                  </p>
                </div>
              )}
              <p className="mt-4 text-sm text-red-600">Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default RelatoriosPrestador

