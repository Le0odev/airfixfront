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

const ServiceReportManagement: React.FC<Props> = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
  const [newReport, setNewReport] = useState({
    descricao: '',
    empresaId: 0,
    prestadorId: 0,
    ordemServicoId: 0,
    custo_total: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  

  const handleCreateReport = async () => {
    // Pegando o token do localStorage (ou de onde você armazena o token)
    const token = localStorage.getItem('token');
    
    const empresaId = getEmpresaIdFromToken();  // Certifique-se de que esta função retorna o ID correto da empresa
    
    if (!empresaId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await api.post(
        '/relatorio-servico', 
        {
          descricao: newReport.descricao,
          empresaId,
          prestadorId: newReport.prestadorId,
          ordemServicoId: newReport.ordemServicoId,
          custo_total: newReport.custo_total
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,  // Adiciona o token como Bearer
          }
        }
      );
  
      if (response.status === 201) {
        // Atualiza a lista de relatórios com o novo relatório
        setServiceReports([...serviceReports, response.data]);
        setIsDialogOpen(false);  // Fecha o modal
        setNewReport({
          descricao: '',
          empresaId: 0,
          prestadorId: 0,
          ordemServicoId: 0,
          custo_total: 0
        });  // Reseta os campos do formulário

        toast({
          title: "Sucesso",
          description: "Relatório de serviço criado com sucesso",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o relatório de serviço",
        variant: "destructive"
      });
      console.error("Erro ao carregar os relatórios de serviço:", error);

    }
  };
 
  const fetchServiceReports = async () => {
    const empresaId = getEmpresaIdFromToken();
    if (!empresaId) {
      toast({
        title: "Erro",
        description: "Empresa ID não encontrado no token",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await api.get(`/relatorios-servico/empresa/${empresaId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      setServiceReports(response.data);
      console.log(response.data)
    } catch (error) {
      console.error("Erro ao carregar os relatórios de serviço:", error);
    }
  };

  // Chama a requisição GET quando o componente for montado
  useEffect(() => {
    fetchServiceReports();
    
  }, []);
  
  

  return (
    <>
    <Header userType='empresa'></Header>
    <div className="md:ml-60 md:p-4 space-y-6">
    <Card className="w-full">
        <CardHeader className="flex flex-row justify-between items-center text-secondaryp-4">
          <CardTitle className="text-xl font-bold">Relatórios de Serviço</CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="flex items-center">
                <CircleFadingPlus className="mr-2 h-4 w-4" /> Criar Relatório
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Relatório de Serviço</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Descrição"
                  value={newReport.descricao}
                  onChange={(e) => setNewReport({ ...newReport, descricao: e.target.value })}
                />
                <Input
                  placeholder="ID do Prestador"
                  type="number"
                  value={newReport.prestadorId || 0}
                  onChange={(e) => setNewReport({ ...newReport, prestadorId: Number(e.target.value) })}
                />
                <Input
                  placeholder="ID da Ordem de Serviço"
                  type="number"
                  value={newReport.ordemServicoId || 0}
                  onChange={(e) => setNewReport({ ...newReport, ordemServicoId: Number(e.target.value) })}
                />
                <Input
                  placeholder="Custo Total"
                  type="number"
                  value={newReport.custo_total || 0}
                  onChange={(e) => setNewReport({ ...newReport, custo_total: Number(e.target.value) })}
                />
                <Button 
                  onClick={handleCreateReport}
                  disabled={!newReport.descricao || !newReport.prestadorId || !newReport.ordemServicoId}
                >
                  Salvar Relatório
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Prestador</TableHead>
                <TableHead>Ordem de Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Custo Estimado</TableHead>
                <TableHead>Custo Total</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Empresa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.descricao}</TableCell>
                  <TableCell>{report.prestador?.nome || 'N/A'}</TableCell>
                  <TableCell>{report.ordemServico?.descricao || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        report.ordemServico?.status === 'Concluído' 
                          ? 'default'  // Changed from 'success'
                          : 'outline'  // Changed from 'warning'
                      }
                    >
                      {report.ordemServico?.status || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>R$ {report.ordemServico?.custo_estimado || 'N/A'}</TableCell>
                  <TableCell>R$ {report.custo_total }</TableCell>
                  <TableCell>{new Date(report.data_criacao).toLocaleDateString()}</TableCell>
                  <TableCell>{report.empresa?.nome || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default ServiceReportManagement;
