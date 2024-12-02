import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import api from '@/services/api';
import Header from '../Header';



api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);
// Esquema de validação
const relatorioSchema = z.object({
  descricao: z.string().min(5, "Descrição muito curta"),
  custo_total: z.number().min(0, "Custo deve ser positivo"),
  ordemServicoId: z.number().min(1, "Ordem de serviço é obrigatória"),
  empresaId: z.number().min(1, "Empresa é obrigatória"),
  prestadorId: z.number().optional()
});

type RelatorioFormData = z.infer<typeof relatorioSchema>;

interface Relatorio {
  id: number;
  descricao: string;
  custo_total: number;
  empresa: { id: number; nome: string };
  prestador?: { id: number; nome: string };
  ordemServico: { id: number; descricao: string };
}

const getEmpresaIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("Token não encontrado");
      return null;
    }
  
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); 
  
      return decodedToken?.id || null; // Agora pegamos o campo `id`
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      return null;
    }
  };

  const getToken = () => localStorage.getItem('token');


  
  const Relatorios: React.FC = () => {
    const empresaId = getEmpresaIdFromToken(); 
    const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
    const [prestadores, setPrestadores] = useState<{ id: number; nome: string }[]>([]);
    const [ordensServico, setOrdensServico] = useState<{ id: number; descricao: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingRelatorio, setEditingRelatorio] = useState<Relatorio | null>(null);
  
    const form = useForm<RelatorioFormData>({
      resolver: zodResolver(relatorioSchema),
      defaultValues: {
        descricao: '',
        custo_total: 0,
        ordemServicoId: 0,
        empresaId: empresaId || 0,
      },
    });
  
    // Buscar dados iniciais
    useEffect(() => {
      const fetchRelatorios = async () => {
        try {
          const response = await axios.get('/relatorio-servico', {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          setRelatorios(response.data);
        } catch (error) {
          toast({
            title: "Erro",
            description: "Falha ao carregar relatórios",
            variant: "destructive",
          });
        }
      };
  
      const fetchPrestadores = async () => {
        try {
          const response = await axios.get('/prestador', {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          setPrestadores(response.data);
        } catch (error) {
          toast({
            title: "Erro",
            description: "Falha ao carregar prestadores",
            variant: "destructive",
          });
        }
      };
  
      const fetchOrdensServico = async () => {
        try {
          const response = await axios.get('/ordem-servico', {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          setOrdensServico(response.data);
        } catch (error) {
          toast({
            title: "Erro",
            description: "Falha ao carregar ordens de serviço",
            variant: "destructive",
          });
        }
      };
  
      fetchRelatorios();
      fetchPrestadores();
      fetchOrdensServico();
      setLoading(false);
    }, []);
  
    // Submeter relatório
    const onSubmit = async (data: RelatorioFormData) => {
      try {
        const requestData = {
          ...data,
          empresaId: empresaId,
        };
  
        if (editingRelatorio) {
          // Atualizar
          const response = await axios.put(
            `/relatorio-servico/${editingRelatorio.id}`,
            requestData,
            {
              headers: { Authorization: `Bearer ${getToken()}` },
            }
          );
          setRelatorios(
            relatorios.map((r) => (r.id === editingRelatorio.id ? response.data : r))
          );
          toast({ title: "Sucesso", description: "Relatório atualizado" });
        } else {
          // Criar
          const response = await axios.post('/relatorio-servico', requestData, {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          setRelatorios([...relatorios, response.data]);
          toast({ title: "Sucesso", description: "Relatório criado" });
        }
  
        setOpenDialog(false);
        form.reset();
        setEditingRelatorio(null);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao salvar relatório",
          variant: "destructive",
        });
      }
    };
  
    // Deletar relatório
    const handleDelete = async (id: number) => {
      try {
        await axios.delete(`/relatorio-servico/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setRelatorios(relatorios.filter((r) => r.id !== id));
        toast({ title: "Sucesso", description: "Relatório deletado" });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao deletar relatório",
          variant: "destructive",
        });
      }
    };
  
    // Editar relatório
    const handleEdit = (relatorio: Relatorio) => {
      setEditingRelatorio(relatorio);
      form.reset({
        descricao: relatorio.descricao,
        custo_total: relatorio.custo_total,
        ordemServicoId: relatorio.ordemServico.id,
        empresaId: relatorio.empresa.id,
        prestadorId: relatorio.prestador?.id,
      });
      setOpenDialog(true);
    };
  
  
  

  
  if (loading) return <div>Carregando...</div>;

  return (
    <>
    <Header userType='empresa'></Header>
    <div className="md:ml-60 md:p-4 space-y-6">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Relatórios de Serviço</CardTitle>
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Relatório
        </Button>
      </CardHeader>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRelatorio ? 'Editar' : 'Criar'} Relatório de Serviço
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="custo_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Total</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="empresaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>

                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ordemServicoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem de Serviço</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a ordem de serviço" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ordensServico.map(os => (
                          <SelectItem key={os.id} value={os.id.toString()}>
                            {os.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prestadorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prestador (Opcional)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o prestador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {prestadores.map(prest => (
                          <SelectItem key={prest.id} value={prest.id.toString()}>
                            {prest.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button type="submit">
                  <Check className="mr-2 h-4 w-4" /> 
                  {editingRelatorio ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Prestador</TableHead>
              <TableHead>Custo Total</TableHead>
              <TableHead>Ordem de Serviço</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relatorios.map((relatorio) => (
              <TableRow key={relatorio.id}>
                <TableCell>{relatorio.id}</TableCell>
                <TableCell>{relatorio.descricao}</TableCell>
                <TableCell>{relatorio.empresa.nome}</TableCell>
                <TableCell>{relatorio.prestador?.nome || 'N/A'}</TableCell>
                <TableCell>R$ {relatorio.custo_total.toFixed(2)}</TableCell>
                <TableCell>{relatorio.ordemServico.descricao}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleEdit(relatorio)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este relatório?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(relatorio.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
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

export default Relatorios;