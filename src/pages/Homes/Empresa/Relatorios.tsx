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
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import Header from '../Header';
import InputField from '@/components/InputField';
import { Toaster } from '@/components/ui/toaster';

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
        <div className="bg-white shadow-sm rounded-lg p-6 flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-gray-900">Relatórios de Serviço</h1>
          
          {/* Create New Report Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg default text-white py-3 px-6 rounded-md transition-all duration-200">
                <PlusCircle className="w-5 h-5 mr-2" />
                Novo Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-lg p-8 shadow-lg w-full max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-gray-900">Criar Novo Relatório</DialogTitle>
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
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-all"
                >
                  Salvar Relatório
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-4">
  {/* Search button */}
  <button
    className='bg default rounded-md hover:bg-gray-600 p-3'
    onClick={() => setShowSearch(!showSearch)}
  >
    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
    <span>Search</span>
  </button>

  {showSearch && (
    <div className="relative w-full sm:max-w-md flex-grow">
      <Input
        placeholder="Buscar por título, prestador, ordem de serviço..."
        className="pl-12 py-3 w-full border border-gray-300 rounded-lg shadow-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => {
          const term = e.target.value;
          setSearchTerm(term);
          handleSearch(term);
        }}
      />
    </div>
  )}

  {/* Filter button */}
  <button
    className='bg default rounded-md hover:bg-gray-600 p-3'
    onClick={() => setShowFilter(!showFilter)}
  >
    <Filter /> Filter
  </button>

  {showFilter && (
    <div className="flex flex-wrap items-end space-y-4 sm:space-y-0 sm:space-x-4">
      {/* Add your filter options here */}
    </div>
  )}
</div>
      
            

      {/* Tabela de Relatórios */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <Table className="w-full">
          <TableHeader className="bg-gray-100 text-gray-700">
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Ordem de Serviço</TableHead>
              <TableHead>Prestador</TableHead>
              <TableHead>Custo Estimado</TableHead>
              <TableHead>Custo Total</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id} className="hover:bg-gray-50 transition-all">
                <TableCell>{report.descricao}</TableCell>
                <TableCell>{report.ordemServico?.descricao}</TableCell>
                <TableCell>{report.prestador?.nome}</TableCell>
                <TableCell>
                    R$ {report.ordemServico?.custo_estimado?.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).replace('R$', '').trim()}
                  </TableCell>
                  <TableCell>
                    R$ {report.custo_total?.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).replace('R$', '').trim()}
                  </TableCell>
                <TableCell>{new Date(report.data_criacao).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                <Badge 
                    variant="outline" 
                    className={`${
                      report.ordemServico?.status === 'completada' ? 'bg-green-100 text-green-800' : 
                      report.ordemServico?.status === 'em_progresso' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {report.ordemServico?.status
                    ? report.ordemServico.status.charAt(0).toUpperCase() + report.ordemServico.status.slice(1)
                    : ''}
                </Badge>
                </TableCell>
                <TableCell className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="text-black hover:bg-blue-50 p-2 rounded-full transition-all mr-2"
                    onClick={() => {
                      setIsEditDialogOpen(true);
                      setCurrentReportId(report.id ?? null); // Garantir que nunca seja undefined
                      setNewReport({ ...report });
                    }}
                  >
                    <Edit2 className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                    onClick={() => handleDeleteReport(report.id!)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Mensagem caso não haja relatórios */}
        {filteredReports.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            Nenhum relatório encontrado
          </div>
        )}
      </div>

      {/* Modal de Edição de Relatório */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild />
        <DialogContent className="bg-white rounded-lg p-8 shadow-lg w-full max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900">Editar Relatório de Serviço</DialogTitle>
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
              disabled={!newReport.descricao || !newReport.prestadorId || !newReport.ordemServicoId}
              className="w-full bg default text-white py-3 rounded-md hover:bg-gray-700 transition-all"
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




















