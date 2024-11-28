import React, { ChangeEvent, useEffect, useState } from "react";
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
import { AxiosError } from "axios";

interface FormData {
  empresaId: string,
  descricao: string,
  cliente_id: string,
  prestador_id: string,
  prioridade: string,
  endereco_servico: string,
  data_estimativa: string,
  custo_estimado: number,
  anexos: string
  }


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
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);


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

  })

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

  const validateForm = () => {
    const { descricao, prestador_id, cliente_id, custo_estimado, data_estimativa, endereco_servico, prioridade } = formData;
  
    // Verifica se todos os campos obrigatórios estão preenchidos
    if (!descricao || !prestador_id || !cliente_id || !custo_estimado || !data_estimativa || !endereco_servico || !prioridade) {
      setErrorMessage('Todos os campos são obrigatórios.');
      return false;
    }
  
    // Validações adicionais podem ser adicionadas conforme necessário
    // Exemplo: Verificar se o custo estimado é um número válido e maior que 0
    if (isNaN(custo_estimado) || custo_estimado <= 0) {
      setErrorMessage('O custo estimado deve ser um número maior que 0.');
      return false;
    }
  
    setErrorMessage('');
    return true;
  };

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

  const getEmpresaIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("Token não encontrado");
      return null;
    }
  
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); 
      console.log("Token Decodificado:", decodedToken); // Exibindo o conteúdo do token
  
      return decodedToken?.id || null; // Agora pegamos o campo `id`
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      return null;
    }
  };


  const handleOrder = async () => {

     // Validando o formulário
     if (!validateForm()) return;

     const { descricao, prestador_id, cliente_id, custo_estimado, data_estimativa, endereco_servico, prioridade } = formData;

    // Obtendo o empresaId do token
    const empresaId = getEmpresaIdFromToken();
    if (!empresaId) {
      setErrorMessage('Empresa não identificada. Por favor, faça login novamente.');
      return;
    }

    setLoading(true);


    try {
      const response = await api.post('/servico', {
        descricao,
        prestador_id,
        cliente_id,
        custo_estimado,
        data_estimativa,
        endereco_servico,
        prioridade
      })

      // Se a criação do cliente for bem-sucedida
      if (response.status === 201) {
        resetForm(); // Resetando o formulário após o sucesso
        navigate('/login-client'); // Redirecionando para a tela de login
      }

    } catch (error) {
      // Tratando erros
      const axiosError = error as AxiosError<{ message: string }>;

      // Exibindo erro específico se a resposta for 400 (erro de validação)
      if (axiosError.response?.status === 400) {
        setErrorMessage(axiosError.response?.data?.message || 'Erro ao criar ordem de serviço. Tente novamente.');
      } else if (axiosError.response?.status === 500) {
        setErrorMessage('Erro interno no servidor. Tente novamente mais tarde.');
      } else {
        setErrorMessage('Ocorreu um erro ao registrar ordem. Tente novamente mais tarde.');
      }

      // Log para o desenvolvedor, para depuração
      console.error('Error during registration: ', error);
    } finally {
      setLoading(false); // Finalizando o carregamento
    }


  }




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
      {/* Campo Descrição */}
      <Input
        placeholder="Descrição do Serviço"
        value={formData.descricao}
        onChange={handleInputChange("descricao")}
      />

      {/* Dropdown para Cliente */}
      <Select
        value={formData.cliente_id}
        onValueChange={(value) => setFormData((prev) => ({ ...prev, cliente_id: value }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecionar Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Cliente 1</SelectItem>
          <SelectItem value="2">Cliente 2</SelectItem>
          {/* Substituir pelos dados reais da API */}
        </SelectContent>
      </Select>

      {/* Dropdown para Prestador */}
      <Select
        value={formData.prestador_id}
        onValueChange={(value) => setFormData((prev) => ({ ...prev, prestador_id: value }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecionar Prestador" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Prestador 1</SelectItem>
          <SelectItem value="2">Prestador 2</SelectItem>
          {/* Substituir pelos dados reais da API */}
        </SelectContent>
      </Select>

      {/* Dropdown para Prioridade */}
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

      {/* Campo Endereço do Serviço */}
      <Input
        placeholder="Endereço do Serviço"
        value={formData.endereco_servico}
        onChange={handleInputChange("endereco_servico")}
      />

      {/* Campo Data Estimativa */}
      <Input
        type="date"
        value={formData.data_estimativa}
        onChange={handleInputChange("data_estimativa")}
      />

      {/* Campo Custo Estimado */}
      <Input
        type="number"
        placeholder="Custo Estimado"
        value={formData.custo_estimado.toString()}
        onChange={handleInputChange("custo_estimado")}
      />

      {/* Mensagem de erro */}
      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

      {/* Botão para criar OS */}
      <Button className="w-full" onClick={handleOrder} disabled={loading}>
        {loading ? "Criando..." : "Criar OS"}
      </Button>
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
