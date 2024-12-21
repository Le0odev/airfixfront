
import React, { ChangeEvent, useEffect, useState } from "react";
import { PlusCircle, Filter, Search, MoreVertical, XIcon } from "lucide-react";
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
import { AxiosError } from "axios";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Client {
  id: string;
  nome: string;
}

interface Provider {
  id: string;
  nome: string;
}

interface ServiceOrder {
  id: number;
  descricao: string;
  cliente: {
    nome: string;
  };
  status: "pendente" | "em_progresso" | "completada";
  data_estimativa: string;
  prioridade: "high" | "medium" | "low";
}

interface FormData {
  empresaId: string;
  descricao: string;
  cliente_id: string;
  prestador_id: string;
  prioridade: string;
  endereco_servico: string;
  data_estimativa: string;
  custo_estimado: number;
  anexos: string;
}

const Servico: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    empresaId: '',
    descricao: '',
    cliente_id: '',
    prestador_id: '',
    prioridade: '',
    endereco_servico: '',
    data_estimativa: '',
    custo_estimado: 0,
    anexos: '',
  });

  const resetForm = () => {
    setFormData({
      empresaId: '',
      descricao: '',
      cliente_id: '',
      prestador_id: '',
      prioridade: '',
      endereco_servico: '',
      data_estimativa: '',
      custo_estimado: 0,
      anexos: '',
    });
    setErrorMessage('');
  };

  const handleInputChange = (field: keyof FormData) => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };
  
  const dateFilterOptions = [
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mês' }
  ];

  const validateForm = () => {
    const { 
      descricao, 
      prestador_id, 
      cliente_id, 
      custo_estimado, 
      data_estimativa, 
      endereco_servico, 
      prioridade 
    } = formData;
  
    if (!descricao || !prestador_id || !cliente_id || !custo_estimado || !data_estimativa || !endereco_servico || !prioridade) {
      setErrorMessage('Todos os campos são obrigatórios.');
      return false;
    }
  
    if (isNaN(custo_estimado) || custo_estimado <= 0) {
      setErrorMessage('O custo estimado deve ser um número maior que 0.');
      return false;
    }
  
    setErrorMessage('');
    return true;
  };

  const getEmpresaIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("Token não encontrado");
      return null;
    }
  
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); 
      return decodedToken?.id || null;
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      return null;
    }
  };

  const fetchData = async () => {
    try {
        const token = localStorage.getItem("token");
        const empresaId = getEmpresaIdFromToken();

        if (!empresaId || !token) {
            alert("Erro: Empresa ID ou Token não encontrado.");
            return;
        }

        const serviceOrdersResponse = await api.get(`/ordens-servico/empresa/${empresaId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const ordersData = serviceOrdersResponse.data;

        const transformedServiceOrders = ordersData.map((order: any) => ({
            id: order.id,
            descricao: order.descricao,
            cliente: {
                nome: order.Cliente?.nome || 'Cliente não identificado',
            },
            status: order.status.toLowerCase() as ServiceOrder['status'],
            data_estimativa: new Date(order.data_estimativa).toLocaleDateString(),
            prioridade: order.prioridade,
        }));

        setServiceOrders(transformedServiceOrders);

        const clientsResponse = await api.get("/clientes", {
            headers: { Authorization: `Bearer ${token}` },
        });
        setClients(clientsResponse.data);

        const providersResponse = await api.get(`/prestadores/${empresaId}`, {
          headers: { Authorization: `Bearer ${token}` },
      });      
      if (providersResponse.data && providersResponse.data.data.prestadores) {
          setProviders(providersResponse.data.data.prestadores); // Use o array prestadores
      } else {
          console.warn("Formato inesperado na resposta de prestadores:", providersResponse.data);
          setProviders([]);
      }
      
      console.log("Prestadores após o set:", providers);

    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        alert("Não foi possível carregar os dados.");
    }
};



  const handleOrder = async () => {
    if (!validateForm()) return;
  
    const { 
      descricao, 
      prestador_id, 
      cliente_id, 
      custo_estimado, 
      data_estimativa, 
      endereco_servico, 
      prioridade 
    } = formData;
  
    const empresaId = getEmpresaIdFromToken();
    if (!empresaId) {
      setErrorMessage('Empresa não identificada. Por favor, faça login novamente.');
      return;
    }
  
    setLoading(true);
  
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/ordens-servico', {
        empresaId,
        descricao,
        prestador_id,
        cliente_id,
        custo_estimado,
        data_estimativa,
        endereco_servico,
        prioridade
      }, {
        headers: {
          Authorization: `Bearer ${token}` 
        }
      });
  
      if (response.status === 201) {
        resetForm();
        fetchData();
        alert('Ordem de serviço criada com sucesso!');
      }
  
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
  
      if (axiosError.response?.status === 400) {
        setErrorMessage(axiosError.response?.data?.message || 'Erro ao criar ordem de serviço. Tente novamente.');
      } else if (axiosError.response?.status === 500) {
        setErrorMessage('Erro interno no servidor. Tente novamente mais tarde.');
      } else {
        setErrorMessage('Ocorreu um erro ao registrar ordem. Tente novamente mais tarde.');
      }
  
      console.error('Erro durante o registro: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
  
    try {
      const response = await api.delete(`/ordens-servico/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.status === 200) {
        alert("Ordem de Serviço deletada com sucesso.");
        fetchData();
      }
    } catch (error: any) {
      console.error("Erro ao excluir a ordem de serviço:", error);
  
      if (error.response?.status === 404) {
        alert("Ordem de Serviço não encontrada.");
      } else if (error.response?.status === 403) {
        alert("Você não tem permissão para realizar esta ação.");
      } else {
        alert("Erro ao excluir a Ordem de Serviço.");
      }
    }
  };
  
  const handleUpdateStatus = async (id: number, newStatus: ServiceOrder["status"]) => {
    const token = localStorage.getItem("token");
  
    try {
      const response = await api.put(
        `/ordens-servico/${id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.status === 200) {
        alert("Status atualizado com sucesso.");
        fetchData();
      }
    } catch (error: any) {
      console.error("Erro ao atualizar o status da ordem de serviço:", error);
  
      if (error.response?.status === 404) {
        alert("Ordem de Serviço não encontrada.");
      } else if (error.response?.status === 403) {
        alert("Você não tem permissão para realizar esta ação.");
      } else {
        alert("Erro ao atualizar o status da Ordem de Serviço.");
      }
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login-company");
        return;
      }

      try {
        const response = await api.get("/empresa-dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          setIsAuthorized(true);
          fetchData();
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
        navigate("/login");
      }
    };

    verifyToken();
  }, [navigate]);

  if (!isAuthorized) {
    return <div>Carregando...</div>;
  }

  const getStatusBadge = (status: ServiceOrder["status"]) => {
    const statusStyles: Record<ServiceOrder["status"], string> = {
      pendente: "bg-yellow-100 text-yellow-800",
      em_progresso: "bg-blue-100 text-blue-800",
      completada: "bg-green-100 text-green-800",
    };

    const statusLabels: Record<ServiceOrder["status"], string> = {
      pendente: "Pendente",
      em_progresso: "Em Andamento",
      completada: "Concluído",
    };

    return (
      <Badge className={statusStyles[status]}>
        {statusLabels[status]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityStyles: Record<string, string> = {
      high: "bg-red-100 text-red-800",
      medium: "bg-orange-100 text-orange-800",
      low: "bg-blue-100 text-blue-800"
    };

    const priorityLabels: Record<string, string> = {
      high: "Alta",
      medium: "Média",
      low: "Baixa"
    };

    return (
      <Badge className={priorityStyles[priority]}>
        {priorityLabels[priority]}
      </Badge>
    );
  };

  


  const filteredServices = serviceOrders.filter((service) => {
    // Status filter
    const matchesStatus = statusFilter === "all" || 
                         service.status.toLowerCase() === statusFilter.toLowerCase();
    
    // Search filter
    const searchQuery = searchTerm.toLowerCase();
    const matchesSearch = service.descricao.toLowerCase().includes(searchQuery) ||
                         service.cliente.nome.toLowerCase().includes(searchQuery);
    
    // Date filter
    const matchesDate = (() => {
      if (dateFilter === "all") return true;
      
      // Parse the service date string (assuming format DD/MM/YYYY)
      const [day, month, year] = service.data_estimativa.split('/').map(Number);
      const serviceDate = new Date(year, month - 1, day); // month is 0-based in JS
      serviceDate.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (dateFilter) {
        case "today":
          return serviceDate.getTime() === today.getTime();
          
        case "week": {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
          const weekEnd = new Date(today);
          weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
          return serviceDate >= weekStart && serviceDate <= weekEnd;
        }
        
        case "month": {
          return (
            serviceDate.getMonth() === today.getMonth() &&
            serviceDate.getFullYear() === today.getFullYear()
          );
        }
        
        default:
          return true;
      }
    })();
  
    return matchesStatus && matchesSearch && matchesDate;
  });
  const getStatusColor = (status: ServiceOrder["status"]) => {
    return {
      pendente: "bg-yellow-500",
      em_progresso: "bg-blue-500",
      completada: "bg-green-500"
    }[status];
  };

  

  return (
    <>
      <Header userType="empresa" />
      
      <div className="md:ml-60 md:p-7 p-6 space-y-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-white rounded-lg shadow-sm">
          <CardTitle>Gestão de Serviços</CardTitle>
        </CardHeader>
  
        <CardContent className="bg-white rounded-lg shadow-md p-8">
        {/* Header com Filtros */}
        <div className="flex flex-col space-y-4 mb-6">
          {/* Linha superior com busca e ações */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por descrição ou cliente..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Status
                  {statusFilter !== 'all' && (
                    <span className="ml-1 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pendente")}>
                  Pendente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("em_progresso")}>
                  Em Andamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("completada")}>
                  Concluído
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="h-4 w-4" />
                Novo Serviço
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
                  type="date"
                  value={formData.data_estimativa}
                  onChange={handleInputChange("data_estimativa")}
                />

                <Input
                  type="number"
                  placeholder="Custo Estimado"
                  value={formData.custo_estimado.toString()}
                  onChange={handleInputChange("custo_estimado")}
                />

                {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

                <Button 
                  className="w-full" 
                  onClick={handleOrder} 
                  disabled={loading}
                >
                  {loading ? "Criando..." : "Criar OS"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>

          {/* Linha de filtros de data */}
          <div className="flex gap-2 border-b sm:border-b-0 sm:border-r border-gray-300 sm:pr-4 pb-2 sm:pb-0">
  {dateFilterOptions.map((option) => (
    <button
      key={option.id}
      onClick={() => setDateFilter(option.id)}
      className={`relative rounded-lg px-3 py-2 text-sm border border-gray-300 transition-all duration-300 flex items-center ${
        dateFilter === option.id
          ? "bg-blue-600 text-white shadow-md"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span>{option.label}</span>
      {/* Exibir o ícone de X apenas no botão selecionado */}
      {dateFilter === option.id && (
        <button
          className="ml-2 text-gray-300 hover:text-red-600 transition-colors duration-200 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation(); // Evita que o clique afete o botão principal
            setDateFilter("all"); // Reseta o filtro
          }}
        >
          <XIcon className="w-4 h-4" />
        </button>
      )}
    </button>
  ))}
</div>
        </div>

        {/* Grid de Serviços */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 col-span-full">
              Nenhum serviço encontrado
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="relative p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between bg-white"
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
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(service.id, "em_progresso")}
                    >
                      Marcar como em andamento
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(service.id, "completada")}
                    >
                      Marcar como concluído
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600"
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(
                        service.status
                      )}`}
                    />
                    <h3 className="font-semibold text-lg">{service.descricao}</h3>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Cliente: {service.cliente.nome}</p>
                    <p>Data: {service.data_estimativa}</p>
                    <p>OS #{service.id}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
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
  );
}
 
export default Servico;