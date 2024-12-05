import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
  CircleFadingPlus, 
  FileEdit, 
  Trash2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import Header from '../Header';

interface ServiceReport {
  id?: number;
  descricao: string; // Descrição do relatório
  empresaId: number; // ID da empresa
  prestadorId: number; // ID do prestador
  ordemServicoId: number; // ID da ordem de serviço
  custo_total: number; // Custo total do serviço realizado
  data_criacao: string; // Data de criação do relatório
  empresa: {
    id: number; // ID da empresa
    nome: string; // Nome da empresa
  };
  ordemServico: {
    id: number; // ID da ordem de serviço
    descricao: string; // Descrição da ordem de serviço
    custo_estimado: number; // Custo estimado para a ordem de serviço
    status: string; // Status da ordem de serviço (ex: "completed")
  };
  prestador: {
    id: number; // ID do prestador
    nome: string; // Nome do prestador
  };
}

interface Props {
  serviceReports: ServiceReport[];
}

interface Empresa {
  id: number;
  nome: string;
}

interface Prestador {
  id: number;
  nome: string;
}

interface OrdemServico {
  id: number;
  descricao: string;
}



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

const ServiceReportManagement: React.FC = () => {
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ServiceReport[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [newReport, setNewReport] = useState({
    descricao: "",
    empresaId: 0,
    prestadorId: 0,
    ordemServicoId: 0,
    custo_total: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getEmpresaIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      return decodedToken?.id || null;
    } catch (error) {
      console.error("Erro ao decodificar o token:", error);
      return null;
    }
  };

  const fetchServiceReports = async () => {
    const empresaId = getEmpresaIdFromToken();
    if (!empresaId) {
      toast({
        title: "Erro",
        description: "Empresa ID não encontrado no token",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.get(`/relatorios-servico/empresa/${empresaId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setServiceReports(response.data);
      setFilteredReports(response.data);
    } catch (error) {
      console.error("Erro ao carregar os relatórios de serviço:", error);
    }
  };

  const handleCreateReport = async () => {
    const token = localStorage.getItem("token");
    const empresaId = getEmpresaIdFromToken();

    if (!empresaId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.post(
        "/relatorio-servico",
        {
          ...newReport,
          empresaId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        setServiceReports([...serviceReports, response.data]);
        setFilteredReports([...filteredReports, response.data]);
        setIsDialogOpen(false);
        setNewReport({
          descricao: "",
          empresaId: 0,
          prestadorId: 0,
          ordemServicoId: 0,
          custo_total: 0,
        });

        toast({
          title: "Sucesso",
          description: "Relatório de serviço criado com sucesso",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o relatório de serviço",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);

    if (!term) {
      setFilteredReports(serviceReports);
      return;
    }

    const filtered = serviceReports.filter((report) =>
      [report.descricao, report.prestador?.nome, report.ordemServico?.status]
        .join(" ")
        .toLowerCase()
        .includes(term.toLowerCase())
    );

    setFilteredReports(filtered);
  };

  useEffect(() => {
    fetchServiceReports();
  }, []);
  
  

  return (
    <>
    <Header userType="empresa" />
    <div className="md:ml-60 p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Relatórios de Serviço</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition">
                <CircleFadingPlus className="h-5 w-5" />
                Criar Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Novo Relatório</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <Input
                    placeholder="Ex: Manutenção realizada com sucesso"
                    value={newReport.descricao}
                    onChange={(e) =>
                      setNewReport({ ...newReport, descricao: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      ID do Prestador
                    </label>
                    <Input
                      placeholder="Ex: 123"
                      type="number"
                      value={newReport.prestadorId || ""}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          prestadorId: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      ID da Ordem de Serviço
                    </label>
                    <Input
                      placeholder="Ex: 456"
                      type="number"
                      value={newReport.ordemServicoId || ""}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          ordemServicoId: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Custo Total</label>
                  <Input
                    placeholder="Ex: 500.00"
                    type="number"
                    value={newReport.custo_total || ""}
                    onChange={(e) =>
                      setNewReport({
                        ...newReport,
                        custo_total: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleCreateReport}
                  disabled={
                    !newReport.descricao ||
                    !newReport.prestadorId ||
                    !newReport.ordemServicoId
                  }
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                >
                  Salvar Relatório
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
  
         {/* Filtros */}
         <div className="mt-6 flex items-center gap-4">
          <Input
            placeholder="Buscar por descrição, prestador ou status"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 border-gray-300 rounded-lg"
          />
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full table-auto bg-white border border-gray-200 rounded-lg shadow">
            <thead className="bg-gray-100">
              <tr>
                {["Descrição", "Prestador", "Status", "Custo Total", "Data de Criação"].map(
                  (header, index) => (
                    <th key={index} className="px-6 py-3 text-left text-sm font-semibold text-gray-600 border-b">
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report, index) => (
                  <tr
                    key={report.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-800">{report.descricao}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {report.prestador?.nome || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge>{report.ordemServico?.status || "N/A"}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      R$ {report.custo_total || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {new Date(report.data_criacao).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-sm text-center text-gray-600"
                  >
                    Nenhum relatório encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>

  );
};

export default ServiceReportManagement;
