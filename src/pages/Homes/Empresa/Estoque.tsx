import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, ShoppingCart, PlusCircle, Search, Loader2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/services/api";
import Header from "../Header";

interface FilterState {
  search: string;
  category: string;
  status: string;
}

interface EstoqueItem {
  id?: number;
  nome_produto: string;
  descricao: string;
  codigo_interno: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  estoque_minimo: number;
  tipo_gas: string;
  numero_cilindro: string;
  data_validade: string;
  empresaId: number;
}

interface ValidationErrors {
  [key: string]: string;
}

const initialEstoqueState: EstoqueItem = {
  nome_produto: '',
  descricao: '',
  codigo_interno: '',
  categoria: '',
  quantidade: 0,
  unidade: '',
  preco_unitario: 0,
  estoque_minimo: 0,
  tipo_gas: '',
  numero_cilindro: '',
  data_validade: '',
  empresaId: 0
};

const initialFilterState: FilterState = {
  search: "",
  category: "all",
  status: "all"
};

const EstoquePedidosAr: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [estoque, setEstoque] = useState<EstoqueItem>(initialEstoqueState);
  const [estoqueItems, setEstoqueItems] = useState<EstoqueItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [itemToDelete, setItemToDelete] = useState<EstoqueItem | null>(null);


  const getItemStatus = (item: EstoqueItem): string => {
    if (item.quantidade === 0) return "zerado";
    if (item.quantidade <= item.estoque_minimo) return "baixo";
    return "normal";
  };

  const handleOpenDialog = (item?: EstoqueItem) => {
    if (item) {
      setEstoque(item);
      setIsEditing(true);
    } else {
      setEstoque(initialEstoqueState);
      setIsEditing(false);
    }
    setCurrentStep(0);
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEstoque(initialEstoqueState);
    setIsEditing(false);
    setCurrentStep(0);
    setErrors({});
  };

  const handleUpdateProduct = async () => {
    const empresaId = getEmpresaIdFromToken();
    if (!empresaId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado",
        variant: "destructive"
      });
      return;
    }

    // Criar uma cópia do estado atual para rollback em caso de erro
    const previousItems = [...estoqueItems];
    
    // Atualizar otimisticamente o estado local
    setEstoqueItems(prev => 
      prev.map(item => 
        item.id === estoque.id ? { ...item, ...estoque } : item
      )
    );

    try {
      const response = await api.put(`/estoque/${estoque.id}`, {
        ...estoque,
        empresaId
      });

      if (response.status === 200) {
        handleCloseDialog();
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso"
        });
      }
    } catch (error: any) {
      // Reverter para o estado anterior em caso de erro
      setEstoqueItems(previousItems);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao atualizar produto",
        variant: "destructive"
      });
    }
  };

  const handleNextStep = () => {
    const fields = getStepFields(currentStep);
    if (!validateFields(fields)) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os campos marcados.",
        variant: "destructive"
      });
      return;
    }

    if (currentStep < 2) {
      setCurrentStep(current => current + 1);
    } else {
      isEditing ? handleUpdateProduct() : handleAddProduct();
    }
  };
  const categories = React.useMemo(() => {
    return Array.from(new Set(estoqueItems.map(item => item.categoria)))
      .filter(Boolean)
      .sort();
  }, [estoqueItems]);

  const filteredItems = React.useMemo(() => {
    return estoqueItems.filter(item => {
      // Search filter
      const searchTerm = filters.search.toLowerCase().trim();
      const searchMatch = !searchTerm || 
        item.nome_produto.toLowerCase().includes(searchTerm) ||
        item.codigo_interno.toLowerCase().includes(searchTerm) ||
        item.categoria.toLowerCase().includes(searchTerm);
      
      // Category filter
      const categoryMatch = filters.category === "all" || 
        item.categoria.toLowerCase() === filters.category.toLowerCase();
      
      // Status filter
      const itemStatus = getItemStatus(item);
      const statusMatch = filters.status === "all" || itemStatus === filters.status;
      
      return searchMatch && categoryMatch && statusMatch;
    });
  }, [estoqueItems, filters]);

  const validateFields = (fields: string[]): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;
  
    fields.forEach(field => {
      const value = estoque[field as keyof EstoqueItem];
      
      if (value === undefined || value === '') {
        newErrors[field] = `${field} é obrigatório`;
        isValid = false;
      }
      
      if (field === 'quantidade' || field === 'preco_unitario' || field === 'estoque_minimo') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0) {
          newErrors[field] = 'Valor não pode ser negativo';
          isValid = false;
        }
      }
  
      if (field === 'data_validade') {
        const date = new Date(value as string);
        if (date < new Date()) {
          newErrors[field] = 'Data deve ser futura';
          isValid = false;
        }
      }
    });
  
    setErrors(newErrors);
    return isValid;
  };

  const handleFilterChange = (type: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilterState);
  };

  

  const getStepFields = (step: number): string[] => {
    const steps = [
      ['nome_produto', 'descricao', 'codigo_interno', 'categoria'],
      ['quantidade', 'unidade', 'preco_unitario', 'estoque_minimo'],
      ['tipo_gas', 'numero_cilindro', 'data_validade']
    ];
    return steps[step] || [];
  };


  const handleAddProduct = async () => {
    const empresaId = getEmpresaIdFromToken();
    if (!empresaId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado",
        variant: "destructive",
      });
      return;
    }

    // Criar um ID temporário para o novo item
    const tempId = Date.now();
    const newItem = { ...estoque, id: tempId, empresaId };
    
    // Adicionar otimisticamente o item à lista
    setEstoqueItems(prev => [...prev, newItem]);
    
    try {
      const response = await api.post("/estoque", { ...estoque, empresaId });
      
      if (response.status === 201) {
        // Atualizar o item com os dados reais do servidor
        setEstoqueItems(prev => 
          prev.map(item => 
            item.id === tempId ? response.data : item
          )
        );
        
        handleCloseDialog();
        toast({
          title: "Sucesso",
          description: "Produto adicionado com sucesso",
        });
      }
    } catch (error: any) {
      // Remover o item temporário em caso de erro
      setEstoqueItems(prev => prev.filter(item => item.id !== tempId));
      
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao adicionar produto",
        variant: "destructive",
      });
    }
  };

  const getEmpresaIdFromToken = (): number | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded?.id || null;
    } catch {
      return null;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;

    // Guarda o estado atual para possível rollback
    const previousItems = [...estoqueItems];
    
    // Atualiza o estado otimisticamente
    setEstoqueItems(prev => prev.filter(item => item.id !== itemToDelete.id));

    try {
      await api.delete(`/estoque/${itemToDelete.id}`);
      
      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso"
      });
    } catch (error: any) {
      // Reverte o estado em caso de erro
      setEstoqueItems(previousItems);
      
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao excluir item",
        variant: "destructive"
      });
    } finally {
      setItemToDelete(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const empresaId = getEmpresaIdFromToken();
      if (!empresaId) {
        navigate("/login-company");
        return;
      }
  
      try {
        const response = await api.get(`/estoque/${empresaId}`);
        setEstoqueItems(response.data);
        setIsAuthorized(true);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        navigate("/login");
      }
    };
  
    loadData();
  }, [navigate]);

  const renderField = (label: string, name: keyof EstoqueItem, type: string = "text", placeholder: string) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        value={estoque[name]}
        placeholder={placeholder}
        onChange={(e) => setEstoque(prev => ({
          ...prev,
          [name]: type === "number" ? Number(e.target.value) : e.target.value
        }))}
        className={errors[name] ? "border-red-500" : ""}
      />
      {errors[name] && (
        <p className="text-sm text-red-500">{errors[name]}</p>
      )}
    </div>
  );

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-3">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <>
     <Header userType="empresa" />
      <div className="md:ml-60 md:p-8 p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestão de Estoque e Pedidos</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogTrigger asChild>
    <Button 
      className="flex items-center gap-2 bg-blue-600"
      onClick={() => handleOpenDialog()}
    >
      <PlusCircle className="w-5 h-5" />
      Novo Item
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {isEditing ? "Editar Item - " : "Novo Item - "}
        {currentStep === 0 ? "Informações Básicas" :
         currentStep === 1 ? "Quantidade e Valores" :
         "Informações Específicas"}
      </DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      {currentStep === 0 && (
        <>
          {renderField("Nome do Produto", "nome_produto", "text", "Ex: Cilindro de Oxigênio Medicinal 10m³")}
          {renderField("Descrição", "descricao", "text", "Ex: Cilindro de aço para oxigênio medicinal com capacidade de 10m³")}
          {renderField("Código Interno", "codigo_interno", "text", "Ex: OXI-10M-001")}
          {renderField("Categoria", "categoria", "text", "Ex: Gases Medicinais")}
        </>
      )}
      {currentStep === 1 && (
        <>
          {renderField("Quantidade", "quantidade", "number", "Ex: 10")}
          {renderField("Unidade", "unidade", "text", "Ex: Unidade")}
          {renderField("Preço Unitário", "preco_unitario", "number", "Ex: 850.00")}
          {renderField("Estoque Mínimo", "estoque_minimo", "number", "Ex: 3")}
        </>
      )}
      {currentStep === 2 && (
        <>
          {renderField("Tipo de Gás", "tipo_gas", "text", "Ex: Oxigênio Medicinal")}
          {renderField("Número do Cilindro", "numero_cilindro", "text", "Ex: CIL-2024-001")}
          {renderField("Data de Validade", "data_validade", "date", "DD/MM/AAAA")}
        </>
      )}
      <div className="flex justify-between mt-4">
        {currentStep > 0 && (
          <Button
            type="button"
            onClick={() => setCurrentStep(current => current - 1)}
            variant="outline"
          >
            Voltar
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleCloseDialog}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleNextStep}
            className="bg-blue-600"
          >
            {currentStep < 2 ? "Próximo" : (isEditing ? "Salvar" : "Adicionar")}
          </Button>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Resumo do Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {estoqueItems.filter(item => item.quantidade > item.estoque_minimo).length}
                  </div>
                  <div className="text-sm text-gray-500">Normal</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {estoqueItems.filter(item => 
                      item.quantidade <= item.estoque_minimo && 
                      item.quantidade > 0
                    ).length}
                  </div>
                  <div className="text-sm text-gray-500">Baixo</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">
                    {estoqueItems.filter(item => item.quantidade === 0).length}
                  </div>
                  <div className="text-sm text-gray-500">Zerado</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Resumo dos Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                {["pendente", "em_execucao", "concluido", "retirado"].map(status => (
                  <div key={status}>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-gray-500">
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="estoque" className="w-full">
          <TabsList>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
            <TabsTrigger value="retiradas">Retiradas</TabsTrigger>
          </TabsList>

          <div className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nome, código ou categoria..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="zerado">Zerado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {filteredItems.length} items encontrados
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              Limpar Filtros
            </Button>
          </div>

          <TabsContent value="estoque" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.nome_produto}</TableCell>
                    <TableCell>{item.quantidade}</TableCell>
                    <TableCell>{item.estoque_minimo}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-white ${
                        getItemStatus(item) === "zerado" ? "bg-red-500" :
                        getItemStatus(item) === "baixo" ? "bg-yellow-500" :
                        "bg-green-500"
                      }`}>
                        {getItemStatus(item).charAt(0).toUpperCase() + getItemStatus(item).slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(item)}
                          className="hover:bg-gray-100"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setItemToDelete(item)}
                          className="hover:bg-red-600"
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </div>
      </Tabs>
      
      </div>
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o item "{itemToDelete?.nome_produto}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EstoquePedidosAr;
