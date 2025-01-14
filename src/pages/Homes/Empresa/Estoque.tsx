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
import { Package, ShoppingCart, PlusCircle, Search } from 'lucide-react';
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

const EstoquePedidosAr: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [estoque, setEstoque] = useState<EstoqueItem>(initialEstoqueState);
  const [estoqueItems, setEstoqueItems] = useState<EstoqueItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    status: "all"
  });
  const navigate = useNavigate();

  const categories = Array.from(new Set(estoqueItems.map(item => item.categoria)))
    .filter(Boolean);

  const getItemStatus = (item: EstoqueItem): string => {
    if (item.quantidade === 0) return "zerado";
    if (item.quantidade <= item.estoque_minimo) return "baixo";
    return "normal";
  };

  const filteredItems = estoqueItems.filter(item => {
    const searchMatch = !filters.search || 
      item.nome_produto.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.codigo_interno.toLowerCase().includes(filters.search.toLowerCase());
    
    const categoryMatch = filters.category === "all" || item.categoria === filters.category;
    const itemStatus = getItemStatus(item);
    const statusMatch = filters.status === "all" || itemStatus === filters.status;
    
    return searchMatch && categoryMatch && statusMatch;
  });

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

  const getStepFields = (step: number): string[] => {
    const steps = [
      ['nome_produto', 'descricao', 'codigo_interno', 'categoria'],
      ['quantidade', 'unidade', 'preco_unitario', 'estoque_minimo'],
      ['tipo_gas', 'numero_cilindro', 'data_validade']
    ];
    return steps[step] || [];
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
      handleAddProduct();
    }
  };

  const handleAddProduct = async () => {
    const empresaId = getEmpresaIdFromToken();
    if (!empresaId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await api.post("/estoque", { ...estoque, empresaId });
      if (response.status === 201) {
        setEstoqueItems(prev => [...prev, response.data]);
        setIsDialogOpen(false);
        setEstoque(initialEstoqueState);
        setCurrentStep(0);
        toast({
          title: "Sucesso",
          description: "Produto adicionado com sucesso"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao adicionar produto",
        variant: "destructive"
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

  useEffect(() => {
    const loadData = async () => {
      const empresaId = getEmpresaIdFromToken();
      const token = localStorage.getItem("token");
      if (!token) {
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

  const renderField = (label: string, name: keyof EstoqueItem, type: string = "text") => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        value={estoque[name]}
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

  if (!isAuthorized) return <div>Carregando...</div>;

  return (
    <>
      <Header userType="empresa" />
      <div className="md:ml-60 md:p-8 p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestão de Estoque e Pedidos</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600">
                <PlusCircle className="w-5 h-5" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentStep === 0 ? "Informações Básicas" :
                   currentStep === 1 ? "Quantidade e Valores" :
                   "Informações Específicas"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {currentStep === 0 && (
                  <>
                    {renderField("Nome do Produto", "nome_produto")}
                    {renderField("Descrição", "descricao")}
                    {renderField("Código Interno", "codigo_interno")}
                    {renderField("Categoria", "categoria")}
                  </>
                )}
                {currentStep === 1 && (
                  <>
                    {renderField("Quantidade", "quantidade", "number")}
                    {renderField("Unidade", "unidade")}
                    {renderField("Preço Unitário", "preco_unitario", "number")}
                    {renderField("Estoque Mínimo", "estoque_minimo", "number")}
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    {renderField("Tipo de Gás", "tipo_gas")}
                    {renderField("Número do Cilindro", "numero_cilindro")}
                    {renderField("Data de Validade", "data_validade", "date")}
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
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="ml-auto"
                  >
                    {currentStep < 2 ? "Próximo" : "Adicionar"}
                  </Button>
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
                  placeholder="Buscar por nome ou código..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>

              <Select
                value={filters.category || "all"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === "all" ? "" : value }))}>
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
                value={filters.status || "all"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}
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
                onClick={() => setFilters({ search: "", category: "", status: "all" })}
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
                          item.quantidade === 0 ? "bg-red-500" :
                          item.quantidade <= item.estoque_minimo ? "bg-yellow-500" :
                          "bg-green-500"
                        }`}>
                          {item.quantidade === 0 ? "Zerado" :
                           item.quantidade <= item.estoque_minimo ? "Baixo" : "Normal"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEstoque(item);
                            setIsDialogOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="pedidos">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Entregador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Pedidos data will be implemented later */}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="retiradas">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Tipo de Serviço</TableHead>
                    <TableHead>Peças</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Retiradas data will be implemented later */}
                </TableBody>
              </Table>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default EstoquePedidosAr;

