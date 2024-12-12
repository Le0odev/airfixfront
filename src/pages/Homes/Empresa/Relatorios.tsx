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
  ClipboardList,
  Download, 
  Filter,
  XIcon
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
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
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

  // Fetch reports on component mount
  useEffect(() => {
    fetchServiceReports();
  }, []);

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
                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
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
          className={`rounded-md p-3 flex items-center gap-3 transform hover:scale-101 hover:shadow-lg ${
            activeButton === "search"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => {
            setShowSearch(true);
            setShowFilter(false);
            setActiveButton("search");
          }}
        >
          <Search className="w-6 h-6" />
          Buscar
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

    <div>
      {/* Botão Filtrar */}
      <button
        className={`rounded-md p-3 flex items-center gap-3 transition-all duration-400 ease-in-out transform hover:scale-107 hover:shadow-lg ${
          activeButton === "filter"
            ? "bg-blue-600 text-white"
            : "text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => {
          setShowFilter(!showFilter);
          setShowSearch(false);
          setActiveButton(activeButton === "filter" ? "" : "filter");
        }}
      >
        <Filter className="w-6 h-6" />
        Filtrar
      </button>

      {showFilter && (
        <div className="absolute top-full right-0 bg-white shadow-lg rounded-lg p-4 mt-2 border border-gray-200">
          {/* Adicione as opções de filtro aqui */}
        </div>
      )}
    </div>

    {/* Botão de Limpar Filtros */}
    {(showFilter || showSearch) && (
      <button
        className="rounded-md p-3 ml-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-200 hover:text-red-700 transition-all flex items-center gap-3"
        onClick={() => {
          setShowFilter(false);
          setShowSearch(false);
          setActiveButton("");
          setSearchTerm("");
          handleSearch("");
        }}
      >
        <XIcon className="w-6 h-6 text-red-700" /> Limpar filtros
      </button>
    )}
  </div>

  <Table className="w-full mt-6">
    <TableHeader className="bg-gray-100">
      <TableRow>
        <TableHead className="py-3 px-5 text-left text-sm text-gray-600 font-semibold">Descrição</TableHead>
        <TableHead className="py-3 px-5 text-left text-sm text-gray-600 font-semibold">Ordem de Serviço</TableHead>
        <TableHead className="py-3 px-5 text-left text-sm text-gray-600 font-semibold">Prestador</TableHead>
        <TableHead className="py-3 px-5 text-left text-sm text-gray-600 font-semibold">Custo Estimado</TableHead>
        <TableHead className="py-3 px-5 text-left text-sm text-gray-600 font-semibold">Custo Total</TableHead>
        <TableHead className="py-3 px-5 text-left text-sm text-gray-600 font-semibold">Data</TableHead>
        <TableHead className="py-3 px-5 text-left text-sm text-gray-600 font-semibold">Status</TableHead>
        <TableHead className="py-3 px-5 text-left text-sm text-gray-600 font-semibold">Ações</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredReports.map((report) => (
        <TableRow key={report.id} className="hover:bg-gray-50 transition duration-200 ease-in-out">
          <TableCell className="px-5 py-3 text-sm text-gray-700">{report.descricao}</TableCell>
          <TableCell className="px-5 py-3 text-sm text-gray-700">{report.ordemServico?.descricao}</TableCell>
          <TableCell className="px-5 py-3 text-sm text-gray-700">{report.prestador?.nome}</TableCell>
          <TableCell className="px-5 py-3 text-sm text-gray-700">R$ {report.ordemServico?.custo_estimado?.toLocaleString('pt-BR')}</TableCell>
          <TableCell className="px-5 py-3 text-sm text-gray-700">R$ {report.custo_total?.toLocaleString('pt-BR')}</TableCell>
          <TableCell className="px-5 py-3 text-sm text-gray-700">{new Date(report.data_criacao).toLocaleDateString('pt-BR')}</TableCell>
          <TableCell>
            <Badge 
              variant="outline" 
              className={`${
                report.ordemServico?.status === 'completada' ? 'bg-green-100 text-green-800' : 
                report.ordemServico?.status === 'em_progresso' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'
              } text-sm py-1 px-3 rounded-full`}
            >
              {report.ordemServico?.status}
            </Badge>
          </TableCell>
          <TableCell className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="icon"
              className="text-blue-500 hover:bg-blue-100 p-3 rounded-full transition-all duration-200"
              onClick={() => {
                setIsEditDialogOpen(true);
                setCurrentReportId(report.id ?? null);
                setNewReport({ ...report });
              }}
            >
              <Edit2 className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-red-500 hover:bg-red-100 p-3 rounded-full transition-all duration-200"
              onClick={() => handleDeleteReport(report.id!)}
            >
              <Trash2 className="w-6 h-6" />
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






