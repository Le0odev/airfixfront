'use client'

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  User, 
  Briefcase, 
  PencilIcon, 
  Search, 
  Loader2, 
  Download,
  Filter,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from '@/services/api';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';

interface Prestador {
  id: number;
  nome: string;
  servico: string;
  status: string;
  avatar?: string;
}

interface Cliente {
  id: number;
  nome: string;
  email: string;
  avatar?: string;

}

interface LoadingState {
  prestadores: boolean;
  clientes: boolean;
}

const Gerenciamento: React.FC = () => {
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ prestadores: true, clientes: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [sortField, setSortField] = useState<'nome' | 'id'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleNavigate = (type: 'prestadores' | 'clientes', action: 'new' | 'edit' = 'new', id?: number) => {
    if (type === 'prestadores') {
      navigate(action === 'new' ? '/provider-register' : `/provider-register/${id}`);
    } else {
      navigate(action === 'new' ? '/user-register' : `/user-register/${id}`);
    }
  };

  const getTokenFromLocalStorage = (): string | null => {
    return localStorage.getItem('token');
  };

  const getEmpresaIdFromToken = (): string | null => {
    const token = getTokenFromLocalStorage();
    if (!token) return null;
  
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); 
      return decodedToken?.id || null;
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = getTokenFromLocalStorage();
      const empresaId = getEmpresaIdFromToken();

      if (!token || !empresaId) {
        toast({
          title: "Erro de autenticação",
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive",
        });
        setLoading({ prestadores: false, clientes: false });
        navigate('/login');
        return;
      }

      const fetchPrestadores = async () => {
        setLoading(prev => ({ ...prev, prestadores: true }));
        try {
          const response = await api.get(`/prestadores/${empresaId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
      
          if (response.status === 200) {
            setPrestadores(response.data.data.prestadores || []);
            console.log(response.data.data.prestadores);
          } else {
            throw new Error(`Erro ao carregar os prestadores`);
          }
        } catch (err) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os prestadores",
            variant: "destructive",
          });
        } finally {
          setLoading(prev => ({ ...prev, prestadores: false }));
        }
      };
      
      const fetchClientes = async () => {
        setLoading(prev => ({ ...prev, clientes: true }));
        try {
          const response = await api.get(`/clientes`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
          if (response.status === 200) {
            setClientes(response.data);
          } else {
            throw new Error(`Erro ao carregar os clientes`);
          }
        } catch (err) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os clientes",
            variant: "destructive",
          });
        } finally {
          setLoading(prev => ({ ...prev, clientes: false }));
        }
      };

      await Promise.all([fetchPrestadores(), fetchClientes()]);
    };

    fetchData();
  }, [toast, navigate]);

  const handleSort = (field: 'nome' | 'id') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filterAndSortItems = (items: Prestador[] | Cliente[], type: 'prestadores' | 'clientes') => {
    return items
      .filter(item => {
        const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
        if (type === 'prestadores') {
          const prestador = item as Prestador;
          const matchesStatus = statusFilter === 'todos' || prestador.status?.toLowerCase() === statusFilter;
          return matchesSearch && matchesStatus;
        }
        return matchesSearch;
      })
      .sort((a, b) => {
        const compareValue = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'nome') {
          return a.nome.localeCompare(b.nome) * compareValue;
        }
        return ((a.id > b.id) ? 1 : -1) * compareValue;
      });
  };
  
  const getStatusBadgeStyles = (status?: string) => {
    const styles = {
      ativo: 'bg-emerald-50 text-emerald-600 border-0',
      inativo: 'bg-rose-50 text-rose-600 border-0',
      pendente: 'bg-amber-50 text-amber-600 border-0'
    };
    return styles[status?.toLowerCase() as keyof typeof styles] || 'bg-gray-50 text-gray-600 border-0';
  };

  const renderList = (items: Prestador[] | Cliente[], type: 'prestadores' | 'clientes') => {
    const filteredItems = filterAndSortItems(items, type);
    
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {type === 'prestadores' ? 'Prestadores' : 'Clientes'}
            </h2>
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 rounded-full">
              {filteredItems.length}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button 
              onClick={() => handleNavigate(type)}
              variant="default"
              size="sm"
              className="bg-gray-900 hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              {type === 'prestadores' ? 'Novo Prestador' : 'Novo Cliente'}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Buscar ${type === 'prestadores' ? 'prestador' : 'cliente'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-gray-200"
            />
          </div>
          
          <div className="flex gap-2">
            {type === 'prestadores' && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] border-gray-200">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <Button
              variant="outline"
              size="icon"
              className="border-gray-200"
            >
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="border-gray-200"
            >
              <Filter className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* List */}
        {filteredItems.length === 0 ? (
          <Card className="border-dashed border-gray-200">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'todos' 
                  ? 'Nenhum resultado encontrado para os filtros selecionados' 
                  : `Nenhum ${type === 'prestadores' ? 'prestador' : 'cliente'} cadastrado`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-px">
              {filteredItems.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage className='rounded-full object-cover' src={item.avatar} />
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      {item.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{item.nome}</span>
                      <span className="text-xs text-gray-500">
                        #{item.id.toString().padStart(3, '0')}
                      </span>
                    </div>
                  </div>

                  {type === 'prestadores' && (
                    <Badge 
                      variant="secondary"
                      className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeStyles((item as Prestador).status)}`}
                    >
                      {(item as Prestador).status?.charAt(0).toUpperCase() + 
                       (item as Prestador).status?.slice(1).toLowerCase()}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };

  if (loading.prestadores || loading.clientes) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header userType="empresa" />
      <div className="md:ml-60 p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="prestadores" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="prestadores">
                Prestadores
              </TabsTrigger>
              <TabsTrigger value="clientes">
                Clientes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="prestadores" className="m-0">
              {renderList(prestadores, 'prestadores')}
            </TabsContent>
            <TabsContent value="clientes" className="m-0">
              {renderList(clientes, 'clientes')}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Gerenciamento;