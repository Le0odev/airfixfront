import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Search, 
  Filter,
  XIcon,
  CalendarArrowDown,
  CheckCircle,
  ArrowLeft,
  Calendar,
  FilterIcon,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import Header from '../Header';
import InputField from '@/components/InputField';
import { Toaster } from '@/components/ui/toaster';

const theme = {
  header: {
    bg: "bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800",
    text: {
      primary: "text-white",
      secondary: "text-gray-400",
      accent: "text-blue-400",
    },
    hover: {
      bg: "hover:bg-gray-700/50",
      text: "hover:text-white",
    },
    active: {
      bg: "bg-blue-600/90",
      text: "text-white",
    },
    transition: "transition-all duration-200 ease-in-out",
  },
};

interface ServiceReport {
  id?: number;
  descricao: string;
  empresaId: number;
  prestadorId: number;
  ordemServicoId: number;
  custo_total: number;
  data_criacao: string;
  empresa: { id: number; nome: string };
  ordemServico: { 
    id: number; 
    descricao: string; 
    custo_estimado: number; 
    status: string 
  };
  prestador: { id: number; nome: string };
}

const getEmpresaIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    return decodedToken?.id || null;
  } catch (error) {
    console.error('Erro ao decodificar o token:', error);
    return null;
  }
};

const Relatorios: React.FC = () => {
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ServiceReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<{ startDate?: Date, endDate?: Date }>({});
  const [statusFilter, setStatusFilter] = useState<string | null>(null); // Novo estado para status
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilterOption, setActiveFilterOption] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState(""); // State para rastrear o botão ativo
  const [newReport, setNewReport] = useState({
    descricao: "",
    empresaId: 0,
    prestadorId: 0,
    ordemServicoId: 0,
    custo_total: 0,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<number | null | undefined>(undefined);

  const applyFilters = () => {
    const filtered = serviceReports.filter((report) => {
      // Search term filter
      const searchFields = [
        report.descricao,
        report.prestador?.nome,
        report.ordemServico?.descricao,
        report.ordemServico?.status,
      ];

      const matchesSearchTerm =
        !searchTerm ||
        searchFields
          .filter(Boolean) // Remove undefined fields
          .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()));

      // Date filter
      const reportDate = new Date(report.data_criacao);
      const matchesDateRange =
        (!dateFilter.startDate || reportDate >= dateFilter.startDate) &&
        (!dateFilter.endDate || reportDate <= dateFilter.endDate);

      // Status filter
      const matchesStatus = !statusFilter || report.ordemServico.status === statusFilter;

      return matchesSearchTerm && matchesDateRange && matchesStatus;
    });
    setFilteredReports(filtered);
  };

  const clearFilters = () => {
    // Reseta os filtros
    setSearchTerm('');
    setDateFilter({});
    setStatusFilter(null);
    setShowFilter(false);
    setShowSearch(false);
    setActiveButton("");
    setSearchTerm("");
    handleSearch("");
  
    // Restaura a lista completa de relatórios
    setFilteredReports(serviceReports);
  };
  


  // Enhanced filtering with more robust search
  const handleSearch = (term: string) => {
    setSearchTerm(term);

    const filtered = serviceReports.filter((report) => {
      // Enhanced text search with multiple fields
      const searchFields = [
        report.descricao, 
        report.prestador?.nome, 
        report.ordemServico?.descricao, 
        report.ordemServico?.status
      ];

      const matchesSearchTerm = !term || 
        searchFields
          .filter(Boolean)  // Remove undefined fields
          .some(field => 
            field.toLowerCase().includes(term.toLowerCase())
          );

      // Date filter condition with more flexible date handling
      const reportDate = new Date(report.data_criacao);
      const matchesDateRange = 
        (!dateFilter.startDate || reportDate >= dateFilter.startDate) && 
        (!dateFilter.endDate || reportDate <= dateFilter.endDate);

      return matchesSearchTerm && matchesDateRange;
    });

    setFilteredReports(filtered);
  };

 

  // Fetch service reports
  const fetchServiceReports = async () => {
    const empresaId = getEmpresaIdFromToken();
    if (!empresaId) {
      toast({ title: "Erro", description: "Empresa ID não encontrado no token", variant: "destructive" });
      return;
    }

    try {
      const response = await api.get(`/relatorios-servico/empresa/${empresaId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setServiceReports(response.data);
      setFilteredReports(response.data);
    } catch (error) {
      console.error("Erro ao carregar os relatórios de serviço:", error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, dateFilter, statusFilter]);

  // Fetch reports on component mount
  useEffect(() => {
    fetchServiceReports();
  }, []);

  

  
  // Create report handler
  const handleCreateReport = async () => {
    const empresaId = getEmpresaIdFromToken();
    const token = localStorage.getItem("token");
  
    if (!empresaId) {
      toast({ title: "Erro", description: "ID da empresa não encontrado", variant: "destructive" });
      return;
    }
  
    try {
      const response = await api.post("/relatorio-servico", { ...newReport, empresaId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.status === 201) {
        const newServiceReport = response.data;
        setServiceReports((prevReports) => [...prevReports, newServiceReport]);
        setFilteredReports((prevReports) => [...prevReports, newServiceReport]);
  
        setIsDialogOpen(false);
        setNewReport({ descricao: "", empresaId: 0, prestadorId: 0, ordemServicoId: 0, custo_total: 0 });
  
        toast({ title: "Sucesso", description: "Relatório de serviço criado com sucesso" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível criar o relatório de serviço", variant: "destructive" });
    }
  };

  // Delete report handler
  const handleDeleteReport = async (reportId: number) => {
    const token = localStorage.getItem("token");

    try {
      const response = await api.delete(`/relatorio-servico/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setServiceReports(serviceReports.filter((report) => report.id !== reportId));
        setFilteredReports(filteredReports.filter((report) => report.id !== reportId));
        toast({ title: "Sucesso", description: "Relatório de serviço excluído com sucesso" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir o relatório de serviço", variant: "destructive" });
    }
  };

  // Edit report handler
  const handleEditReport = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await api.put(`/relatorio-servico/${currentReportId}`, { ...newReport }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        const updatedReports = serviceReports.map((report) => 
          report.id === currentReportId ? { ...report, ...newReport } : report
        );
        setServiceReports(updatedReports);
        setFilteredReports(updatedReports);
        setIsEditDialogOpen(false);
        toast({ title: "Sucesso", description: "Relatório de serviço atualizado com sucesso" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o relatório de serviço", variant: "destructive" });
    }
  };


  return (
    <>
    <Toaster />
    <Header userType="empresa" />
  
    <div className="md:ml-60 md:p-7 p-6 space-y-8">
      {/* Page Header */}
      <div className="bg-white shadow rounded-lg p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios de Serviço</h1>
  
        {/* Create New Report Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg default text-white py-2 px-4 rounded-md flex items-center gap-2  transition">
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
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="ID do Prestador" 
                  type="number" 
                  value={newReport.prestadorId} 
                  onChange={(e) => setNewReport({ ...newReport, prestadorId: Number(e.target.value) })} 
                />
                <InputField 
                  label="ID da Ordem de Serviço" 
                  type="number" 
                  value={newReport.ordemServicoId} 
                  onChange={(e) => setNewReport({ ...newReport, ordemServicoId: Number(e.target.value) })} 
                />
              </div>
              <InputField 
                label="Custo Total" 
                type="number" 
                value={newReport.custo_total} 
                onChange={(e) => setNewReport({ ...newReport, custo_total: Number(e.target.value) })} 
              />
              <Button 
                onClick={handleCreateReport}
                disabled={!newReport.descricao || !newReport.prestadorId || !newReport.ordemServicoId}
                className="w-full bg default text-white py-2 rounded-md hover:bg-gray-600 transition"
              >
                Salvar Relatório
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  
      
  
      <div className="bg-white rounded-lg shadow-lg p-6 relative">
  <div className="flex gap-3 items-center">
    <div className="flex gap-4">
      {/* Botão ou Input de Busca */}
      {!showSearch ? (
       <button
       className={`rounded-lg px-3 py-2 flex items-center gap-2 transition-all duration-300 
         ${activeButton === "search"
           ? "bg-blue-600 text-white shadow-md"
           : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
       } text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300`}
       onClick={() => {
         setShowSearch(true);
         setShowFilter(false);
         setActiveButton("search");
       }}
     >
       <Search className="w-5 h-5" />
       <span>Buscar</span>
     </button>
      ) : (
        <div className="relative w-full max-w-md flex-grow flex items-center border border-gray-300 rounded-lg shadow-sm">
          <Search className="w-6 h-6 text-gray-400 ml-3" />
          <Input
            placeholder="Buscar por título, prestador, ordem de serviço..."
            className="pl-2 pr-10 py-2 w-full text-gray-700 text-sm truncate" // Adicionando padding-right
            style={{
              border: "none",
              outline: "none",
              boxShadow: "none",
              textOverflow: "ellipsis", 
              whiteSpace: "nowrap", 
            }}
            value={searchTerm}
            onChange={(e) => {
              const term = e.target.value;
              setSearchTerm(term);
              handleSearch(term);
            }}
          />
          <button
            className="p-3 text-gray-400 hover:text-red-500 absolute right-0 top-1/2 transform -translate-y-1/2"
            onClick={() => {
              setShowSearch(false);
              setSearchTerm("");
              handleSearch("");
              setActiveButton("");
            }}
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>

    <div className="relative">
      {/* Botão Filtrar */}
      <button
      className={`rounded-lg px-3 py-2 flex items-center gap-2 transition-all duration-300 
        ${activeButton === "filter"
          ? "bg-blue-600 text-white shadow-md"
          : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
      } text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300`}
      onClick={() => {
        setShowFilter(!showFilter);
        setActiveFilterOption(null);
        setActiveButton(activeButton === "filter" ? "" : "filter");
      }}
    >
      <Filter className="w-5 h-5" />
      <span>Filtrar</span>
    </button>

      {/* Conteúdo do Filtro */}
      {showFilter && (
        <div className="absolute top-full right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 mt-3 w-[22rem] z-50 overflow-hidden">
          {/* Close Button */}
          <button 
            onClick={() => setShowFilter(false)}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          </button>

          {/* Filter Header */}
          <div className="flex items-center mb-5 pb-3 border-b border-gray-100">
            <FilterIcon className="w-5 h-5 mr-2 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Filtros</h2>
          </div>

          {/* Initial Filter Selection */}
          {!activeFilterOption && (
            <div className="grid grid-cols-2 gap-3">
              <button
                className="group flex flex-col items-center bg-gray-50 hover:bg-blue-50 p-4 rounded-xl transition-all duration-300 ease-in-out hover:shadow-sm"
                onClick={() => setActiveFilterOption("data")}
              >
                <Calendar className="w-6 h-6 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                  Por Data
                </span>
              </button>
              <button
                className="group flex flex-col items-center bg-gray-50 hover:bg-blue-50 p-4 rounded-xl transition-all duration-300 ease-in-out hover:shadow-sm"
                onClick={() => setActiveFilterOption("status")}
              >
                <CheckCircle className="w-6 h-6 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                  Por Status
                </span>
              </button>
            </div>
          )}

          {/* Date Filter */}
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

          {/* Status Filter */}
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
                  <option value="pendente">Pendente</option>
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
        </div>
      )}
    </div>


    {/* Botão de Limpar Filtros */}
    {(showFilter || showSearch) && (
      <button
      className="rounded-lg px-3 py-2 ml-2 border border-gray-300 bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-200"
      onClick={clearFilters}
    >
      <XIcon className="w-5 h-5 text-red-600" /> 
      <span>Limpar filtros</span>
    </button>
    )}
  </div>

  <Table className="w-full mt-4 border border-gray-200 rounded-md shadow-sm overflow-hidden">
  <TableHeader className="bg-gray-100">
    <TableRow>
      {[
        "Descrição",
        "Ordem de Serviço",
        "Prestador",
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
    {filteredReports.map((report, index) => (
      <TableRow
        key={report.id}
        className={`${
          index % 2 === 0 ? "bg-white" : "bg-gray-50"
        } hover:bg-blue-50 transition-colors duration-150 border-b border-gray-200`}
      >
        <TableCell className="px-4 py-2 text-xs text-gray-700">
          {report.descricao}
        </TableCell>
        <TableCell className="px-4 py-2 text-xs text-gray-700">
          {report.ordemServico?.descricao}
        </TableCell>
        <TableCell className="px-4 py-2 text-xs text-gray-700">
          {report.prestador?.nome}
        </TableCell>
        <TableCell className="px-4 py-2 text-xs text-gray-700 text-right">
          R$ {report.ordemServico?.custo_estimado?.toLocaleString("pt-BR")}
        </TableCell>
        <TableCell className="px-4 py-2 text-xs text-gray-700 text-right">
          R$ {report.custo_total?.toLocaleString("pt-BR")}
        </TableCell>
        <TableCell className="px-4 py-2 text-xs text-center text-gray-700">
          {new Date(report.data_criacao).toLocaleDateString("pt-BR")}
        </TableCell>
        <TableCell className="px-4 py-2 text-xs text-center">
          <Badge
            className={`py-0.5 px-2 text-[10px] rounded-full font-semibold ${
              report.ordemServico?.status === "completada"
                ? "bg-green-100 text-green-700"
                : report.ordemServico?.status === "em_progresso"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {report.ordemServico?.status}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-2 flex justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="text-blue-500 bg-blue-50 hover:bg-blue-100 p-2 rounded-md shadow-sm transition-all duration-150"
            onClick={() => {
              setIsEditDialogOpen(true);
              setCurrentReportId(report.id ?? null);
              setNewReport({ ...report });
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-md shadow-sm transition-all duration-150"
            onClick={() => handleDeleteReport(report.id!)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>



  
        {filteredReports.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            Nenhum relatório encontrado.
          </div>
        )}
      </div>
  
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
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="ID do Prestador" 
                type="number" 
                value={newReport.prestadorId} 
                onChange={(e) => setNewReport({ ...newReport, prestadorId: Number(e.target.value) })} 
              />
              <InputField 
                label="ID da Ordem de Serviço" 
                type="number" 
                value={newReport.ordemServicoId} 
                onChange={(e) => setNewReport({ ...newReport, ordemServicoId: Number(e.target.value) })} 
              />
            </div>
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
  </>
  

    );
};

export default Relatorios;






