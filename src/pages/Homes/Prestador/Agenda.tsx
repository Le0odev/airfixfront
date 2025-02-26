"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, ArrowLeft, ArrowRight, User, Clock, MapPin, Banknote, FileText, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getPrestadorIdFromToken } from "../Empresa/utils"
import Header from "../Header"
import api from "@/services/api"

// Types
interface Cliente {
  id: number
  nome: string
}

interface OrdemServico {
  id: number
  descricao: string
  Cliente: Cliente
  status: "pendente" | "em_progresso" | "completada"
  data_estimativa: string
  custo_estimado: number
  prestador_id: number
  created_at: string
  updated_at: string
  endereco_servico: string
  prioridade: string
}

interface WeeklyAppointment extends OrdemServico {
  timeSlot: string
  dayIndex: number
}

type StatusColorConfig = {
  background: string
  text: string
  border: string
}

type StatusColors = {
  [K in OrdemServico["status"]]: StatusColorConfig
}

// Constants
const STATUS_COLORS: StatusColors = {
  pendente: {
    background: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
  },
  em_progresso: {
    background: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  completada: {
    background: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

// Helper functions
const getWeekDays = (date: Date): Date[] => {
  const week: Date[] = []
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())

  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    week.push(day)
  }
  return week
}

// AppointmentDetails Component
interface AppointmentDetailsProps {
  isOpen: boolean
  onClose: () => void
  appointment: OrdemServico | null
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ isOpen, onClose, appointment }) => {
  if (!appointment) return null

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString))
  }

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  const getStatusBadge = (status: OrdemServico["status"]) => {
    const defaultStyle = {
      background: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
    }

    const styles = STATUS_COLORS[status] || defaultStyle
    const labels = {
      pendente: "Pendente",
      em_progresso: "Em Progresso",
      completada: "Completada",
    }

    return (
      <Badge className={`${styles.background} ${styles.text} ${styles.border} capitalize`}>
        {labels[status] || status}
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="text-sm font-medium">Status</div>
              {getStatusBadge(appointment.status)}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Código</div>
              <div className="text-sm text-gray-500">#{appointment.id}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
              <div>
                <div className="text-sm font-medium">Cliente</div>
                <div className="text-sm text-gray-500">{appointment.Cliente.nome}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
              <div>
                <div className="text-sm font-medium">Data</div>
                <div className="text-sm text-gray-500">{formatDate(appointment.data_estimativa)}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
              <div>
                <div className="text-sm font-medium">Horário</div>
                <div className="text-sm text-gray-500">{formatTime(appointment.data_estimativa)}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
              <div>
                <div className="text-sm font-medium">Endereço</div>
                <div className="text-sm text-gray-500">{appointment.endereco_servico}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Banknote className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
              <div>
                <div className="text-sm font-medium">Valor Estimado</div>
                <div className="text-sm text-gray-500">R$ {appointment.custo_estimado}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
              <div>
                <div className="text-sm font-medium">Descrição</div>
                <div className="text-sm text-gray-500">{appointment.descricao}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// AppointmentCard Component
interface AppointmentCardProps {
  appointment: OrdemServico
  onClick: () => void
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick }) => {
  const defaultStyle = {
    background: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
  }

  const statusStyle = STATUS_COLORS[appointment.status] || defaultStyle

  return (
    <div
      onClick={onClick}
      className={`p-2 rounded-lg ${statusStyle.background} ${statusStyle.text} ${statusStyle.border} h-full overflow-hidden border cursor-pointer transition-colors hover:opacity-90`}
    >
      <div className="font-medium text-sm">{appointment.Cliente.nome}</div>
      <div className="text-xs truncate">{appointment.descricao}</div>
      <Badge className="mt-1" variant="secondary">
        R$ {appointment.custo_estimado}
      </Badge>
    </div>
  )
}

// Main Component
interface WeeklyCalendarState {
  appointments: WeeklyAppointment[]
  loading: boolean
  error: string | null
  currentWeek: Date
}

const Agenda: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [state, setState] = useState<WeeklyCalendarState>({
    appointments: [],
    loading: true,
    error: null,
    currentWeek: new Date(),
  })
  const [selectedAppointment, setSelectedAppointment] = useState<OrdemServico | null>(null)

  const getAppointmentsForDay = (dayIndex: number) => {
    return state.appointments
      .filter((apt) => apt.dayIndex === dayIndex)
      .sort((a, b) => {
        const timeA = Number.parseInt(a.timeSlot.split(":")[0])
        const timeB = Number.parseInt(b.timeSlot.split(":")[0])
        return timeA - timeB
      })
  }

  const fetchAppointments = useCallback(async () => {
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

      const startOfWeek = new Date(state.currentWeek)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado")

      const response = await api.get(`/ordens-servico/prestador/${prestadorId}/agenda`, {
        params: {
          start: startOfWeek.toISOString(),
          end: endOfWeek.toISOString(),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = response.data
      console.log("Dados recebidos da API:", data)

      const processedAppointments = data.map((appointment: OrdemServico) => {
        const date = new Date(appointment.data_estimativa)

        return {
          ...appointment,
          timeSlot: `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
          dayIndex: date.getDay(),
        }
      })

      setState((prev) => ({
        ...prev,
        appointments: processedAppointments,
        loading: false,
        error: null,
      }))
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      toast({
        title: "Erro",
        description: "Falha ao carregar os agendamentos.",
        variant: "destructive",
      })
    }
  }, [state.currentWeek, navigate, toast])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleWeekNavigation = (direction: "previous" | "next") => {
    setState((prev) => {
      const newDate = new Date(prev.currentWeek)
      newDate.setDate(newDate.getDate() + (direction === "previous" ? -7 : 7))
      return { ...prev, currentWeek: newDate }
    })
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }).format(date)
  }

  const weekDays = getWeekDays(state.currentWeek)

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Erro ao carregar agenda</h2>
          <p className="text-gray-600 mt-2">{state.error}</p>
          <Button onClick={() => fetchAppointments()} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header userType="prestador" userAvatar="/path-to-avatar.jpg" />
      <div className="p-4 md:p-8 md:ml-60">
        <Card className="w-full">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agenda Semanal
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekNavigation("previous")}
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekNavigation("next")}
                className="flex-1 sm:flex-none"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              {weekDays.map((day, dayIndex) => {
                const dayAppointments = getAppointmentsForDay(dayIndex)

                return (
                  <div key={dayIndex} className="space-y-4">
                    <div className="text-center pb-2 border-b">
                      <div className="font-medium">{WEEK_DAYS[dayIndex]}</div>
                      <div className="text-sm text-gray-500">{formatDate(day)}</div>
                    </div>
                    {dayAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {dayAppointments.map((appointment) => (
                          <div key={appointment.id} className="relative">
                            <div className="text-xs text-gray-500 mb-1 font-medium">{appointment.timeSlot}</div>
                            <div className="h-24">
                              <AppointmentCard
                                appointment={appointment}
                                onClick={() => setSelectedAppointment(appointment)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center text-sm text-gray-400">
                        Nenhum agendamento
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <AppointmentDetails
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
      />
    </>
  )
}

export default Agenda

