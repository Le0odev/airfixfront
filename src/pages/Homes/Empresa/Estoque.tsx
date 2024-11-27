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
import { Package, ShoppingCart, PlusCircle } from "lucide-react";
import Header from "../Header";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";

interface ItemEstoque {
  id: number;
  item: string;
  quantidade: number;
  minimo: number;
  status: "ok" | "baixo" | "alerta";
  categoria: string;
}

interface Pedido {
  id: number;
  cliente: string;
  produto: string;
  quantidade: number;
  status: "pendente" | "em_execucao" | "concluido" | "retirado";
  data: string;
  entregador: string;
}

interface Retirada {
  id: number;
  prestador: string;
  tipoServico: string;
  pecas: string[];
  quantidade: number[];
  dataRetirada: string;
}

const EstoquePedidosAr: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [estoque] = useState<ItemEstoque[]>([
    { id: 1, item: "Gás Refrigerante R410A", quantidade: 5, minimo: 2, status: "ok", categoria: "Refrigerante" },
    { id: 2, item: "Capacitor 30+5 µF", quantidade: 3, minimo: 5, status: "baixo", categoria: "Componentes Elétricos" },
    { id: 3, item: "Placa Universal", quantidade: 4, minimo: 4, status: "alerta", categoria: "Eletrônica" },
    { id: 4, item: "Filtro de Ar Split", quantidade: 15, minimo: 6, status: "ok", categoria: "Filtros" },
  ]);
  const [pedidos] = useState<Pedido[]>([
    { id: 1, cliente: "João Silva", produto: "Gás Refrigerante R410A", quantidade: 10, status: "pendente", data: "2024-11-15", entregador: "Carlos Santos" },
    { id: 2, cliente: "Maria Santos", produto: "Capacitor 30+5 µF", quantidade: 5, status: "em_execucao", data: "2024-11-14", entregador: "André Lima" },
    { id: 3, cliente: "Pedro Costa", produto: "Placa Universal", quantidade: 3, status: "retirado", data: "2024-11-13", entregador: "Ricardo Oliveira" },
  ]);
  const [retiradas] = useState<Retirada[]>([
    { id: 1, prestador: "Prestador A", tipoServico: "Instalação", pecas: ["Gás Refrigerante R410A", "Filtro de Ar Split"], quantidade: [2, 1], dataRetirada: "2024-11-12" },
    { id: 2, prestador: "Prestador B", tipoServico: "Manutenção", pecas: ["Capacitor 30+5 µF"], quantidade: [5], dataRetirada: "2024-11-14" },
  ]);

  const navigate = useNavigate();

  type Status = 
  | "ok"
  | "baixo"
  | "alerta"
  | "pendente"
  | "em_execucao"
  | "retirado"
  | "concluido";

const getStatusColor = (status: Status): string => {
  const colors: Record<Status, string> = {
    ok: "bg-green-500",
    baixo: "bg-red-500",
    alerta: "bg-yellow-500",
    pendente: "bg-yellow-500",
    em_execucao: "bg-blue-500",
    retirado: "bg-purple-500",
    concluido: "bg-green-500",
  };

  return colors[status];
};

const getStatusText = (status: Status): string => {
  const texts: Record<Status, string> = {
    pendente: "Pendente",
    em_execucao: "Em Execução",
    concluido: "Concluído",
    retirado: "Retirado",
    ok: "OK",
    baixo: "Baixo",
    alerta: "Alerta",
  };

  return texts[status];
};

  const handleAddProduct = () => {
    console.log("Cadastrar novo produto");
    // Implemente a lógica de navegação ou modal para cadastro de produto aqui
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
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200) setIsAuthorized(true);
      } catch (error) {
        console.error("Erro na autenticação:", error);
        navigate("/login");
      }
    };
    verifyToken();
  }, [navigate]);

  if (!isAuthorized) return <div>Carregando...</div>;

  return (
    <>
      <Header userType="empresa" />
      <div className="p-6 md:p-10 space-y-6 md:ml-60">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestão de Estoque e Pedidos</h1>
          <Button
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-4 py-2  text-white rounded-md "
          >
            <PlusCircle className="h-5 w-5" />
            Cadastrar Produto
          </Button>
        </div>

        {/* Resumos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Estoque */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="h-5 w-5" />
                Resumo do Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{estoque.length}</div>
                  <div className="text-sm text-gray-500">Total de Itens</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">{estoque.filter((item) => item.status === "baixo").length}</div>
                  <div className="text-sm text-gray-500">Estoque Baixo</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{estoque.filter((item) => item.status === "alerta").length}</div>
                  <div className="text-sm text-gray-500">Em Alerta</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Resumo dos Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{pedidos.filter((pedido) => pedido.status === "pendente").length}</div>
                  <div className="text-sm text-gray-500">Pendentes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">{pedidos.filter((pedido) => pedido.status === "em_execucao").length}</div>
                  <div className="text-sm text-gray-500">Em Execução</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">{pedidos.filter((pedido) => pedido.status === "concluido").length}</div>
                  <div className="text-sm text-gray-500">Concluídos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-500">{pedidos.filter((pedido) => pedido.status === "retirado").length}</div>
                  <div className="text-sm text-gray-500">Retirados</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="estoque" className="w-full">
          <TabsList>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
            <TabsTrigger value="retiradas">Retiradas</TabsTrigger>
          </TabsList>
          {/* Conteúdo do Estoque */}
          <TabsContent value="estoque">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estoque.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.item}</TableCell>
                    <TableCell>{item.quantidade}</TableCell>
                    <TableCell>{item.minimo}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-white rounded-full ${getStatusColor(item.status)}`}
                      >
                        {getStatusText(item.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          {/* Conteúdo dos Pedidos */}
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
                {pedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell>{pedido.cliente}</TableCell>
                    <TableCell>{pedido.produto}</TableCell>
                    <TableCell>{pedido.quantidade}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-white rounded-full ${getStatusColor(pedido.status)}`}
                      >
                        {getStatusText(pedido.status)}
                      </span>
                    </TableCell>
                    <TableCell>{pedido.data}</TableCell>
                    <TableCell>{pedido.entregador}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          {/* Conteúdo das Retiradas */}
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
                {retiradas.map((retirada) => (
                  <TableRow key={retirada.id}>
                    <TableCell>{retirada.prestador}</TableCell>
                    <TableCell>{retirada.tipoServico}</TableCell>
                    <TableCell>
                      {retirada.pecas.map((peca, index) => (
                        <div key={index}>{`${peca} (${retirada.quantidade[index]})`}</div>
                      ))}
                    </TableCell>
                    <TableCell>{retirada.dataRetirada}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default EstoquePedidosAr;
