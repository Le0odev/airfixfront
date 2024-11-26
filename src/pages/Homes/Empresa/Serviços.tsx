import React, { useEffect, useState } from "react";
import { PlusCircle, Filter, Search, MoreVertical } from "lucide-react";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "../Header";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

// Tipos para tipagem
interface ServiceOrder {
  id: number;
  title: string;
  client: string;
  status: "pending" | "in_progress" | "completed";
  date: string;
  priority: "high" | "medium" | "low";
}

const Servico: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token"); // Obter o token do localStorage

      if (!token) {
        navigate("/login-company"); // Redirecionar para login se o token não existir
        return;
      }

      try {
        // Fazendo a requisição para verificar se o token é válido e o usuário é autorizado
        const response = await api.get("/empresa-dashboard", {
          headers: {
            Authorization: `Bearer ${token}` // Enviar o token no cabeçalho
          }
        });

        if (response.status === 200) {
          setIsAuthorized(true); // Permitir acesso se autorizado
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
        navigate("/login"); // Redirecionar para login em caso de erro
      }
    };

    verifyToken();
  }, [navigate]);

  if (!isAuthorized) {
    // Exibe um estado de carregamento enquanto verifica a autorização
    return <div>Carregando...</div>;
  }

  // Dados fictícios - Substituir por dados reais de uma API
  const serviceOrders: ServiceOrder[] = [
    {
      id: 1,
      title: "Manutenção Preventiva",
      client: "João Silva",
      status: "pending",
      date: "2024-11-16",
      priority: "high",
    },
    {
      id: 2,
      title: "Instalação de Equipamento",
      client: "Maria Santos",
      status: "in_progress",
      date: "2024-11-15",
      priority: "medium",
    },
    {
      id: 3,
      title: "Reparo de Máquina",
      client: "Pedro Costa",
      status: "completed",
      date: "2024-11-14",
      priority: "low",
    },
    {
      id: 3,
      title: "Reparo de Máquina",
      client: "Pedro Costa",
      status: "completed",
      date: "2024-11-14",
      priority: "low",
    },
    {
      id: 3,
      title: "Reparo de Máquina",
      client: "Pedro Costa",
      status: "completed",
      date: "2024-11-14",
      priority: "low",
    },
    {
      id: 3,
      title: "Reparo de Máquina",
      client: "Pedro Costa",
      status: "completed",
      date: "2024-11-14",
      priority: "low",
      
    },
    {
      id: 3,
      title: "Reparo de Máquina",
      client: "Pedro Costa",
      status: "completed",
      date: "2024-11-14",
      priority: "low",
    },
  ];

  // Obter o estilo e rótulo do status
  const getStatusBadge = (status: ServiceOrder["status"]) => {
    const statusStyles: Record<ServiceOrder["status"], string> = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };

    const statusLabels: Record<ServiceOrder["status"], string> = {
      pending: "Pendente",
      in_progress: "Em Andamento",
      completed: "Concluído",
    };

    return (
      <Badge className={statusStyles[status]}>
        {statusLabels[status]}
      </Badge>
    );
  };

  // Filtrar as ordens de serviço com base na busca e filtro
  const filteredServices = serviceOrders.filter(
    (service) =>
      (statusFilter === "all" || service.status === statusFilter) &&
      (service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.client.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Header userType="empresa" />
      
      <div className="md:ml-60 md:p-10 p-6 space-y-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Gestão de Serviços</CardTitle>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Ordem de Serviço</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Input placeholder="Título do Serviço" />
                <Input placeholder="Nome do Cliente" />
                
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button className="w-full">Criar OS</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
  
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por título ou cliente..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
  
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{service.title}</h3>
                  <p className="text-sm text-gray-500">
                    Cliente: {service.client}
                  </p>
                  <p className="text-sm text-gray-500">
                    Data: {service.date}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  {getStatusBadge(service.status)}
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    </>
  );
 }
 
export default Servico;
