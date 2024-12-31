'use client'

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, User, Briefcase, PencilIcon, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from '@/services/api';

interface Prestador {
  id: number;
  nome: string;
  servico: string;
  status: string;
}

interface Cliente {
  id: number;
  nome: string;
  email: string;
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
    if (!token) {
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

  useEffect(() => {
    const fetchData = async () => {
      const token = getTokenFromLocalStorage();
      const empresaId = getEmpresaIdFromToken();

      if (!token || !empresaId) {
        toast({
          title: "Erro",
          description: "Não foi possível obter o token ou ID da empresa",
          variant: "destructive",
        });
        setLoading({ prestadores: false, clientes: false });
        return;
      }

      const fetchPrestadores = async () => {
        setLoading(prevState => ({ ...prevState, prestadores: true }));
      
        try {
          const response = await api.get(`/prestadores/${empresaId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
      
          if (response.status === 200) {
            setPrestadores(response.data.data.prestadores || []);
          } else {
            throw new Error(`Erro ao carregar os prestadores. Status: ${response.status}`);
          }
        } catch (err) {
          toast({
            title: "Erro",
            description: err instanceof Error ? err.message : "Ocorreu um erro ao carregar os prestadores",
            variant: "destructive",
          });
        } finally {
          setLoading(prevState => ({ ...prevState, prestadores: false }));
        }
      };
      
      const fetchClientes = async () => {
        setLoading(prevState => ({ ...prevState, clientes: true }));

        try {
          const response = await api.get(`/clientes`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
          if (response.status === 200) {
            setClientes(response.data)
          } else {
            throw new Error(`Erro ao carregar os prestadores. Status: ${response.status}`);
          }
        } catch (err) {
          toast({
            title: "Erro",
            description: err instanceof Error ? err.message : "Ocorreu um erro ao carregar os clientes",
            variant: "destructive",
          });
        } finally {
          setLoading(prevState => ({ ...prevState, clientes: false }));
        }
      };

      fetchPrestadores();
      fetchClientes();
    };

    fetchData();
  }, [toast]);

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'inativo':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const filterItems = (items: Prestador[] | Cliente[], type: 'prestadores' | 'clientes') => {
    return items.filter(item => {
      const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (type === 'prestadores') {
        const prestador = item as Prestador;
        const matchesStatus = statusFilter === 'todos' || prestador.status?.toLowerCase() === statusFilter;
        return matchesSearch && matchesStatus;
      }
      
      return matchesSearch;
    });
  };
  
  const renderList = (items: Prestador[] | Cliente[], type: 'prestadores' | 'clientes') => {
    const filteredItems = filterItems(items, type);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{type === 'prestadores' ? 'Prestadores' : 'Clientes'}</h2>
          <Button onClick={() => handleNavigate(type)} className="flex items-center gap-2">
            <Plus size={16} />
            {type === 'prestadores' ? 'Novo Prestador' : 'Novo Cliente'}
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {type === 'prestadores' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {filteredItems.length} {type === 'prestadores' ? 'prestadores' : 'clientes'} encontrados
        </div>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <div className="mb-3">
                {type === 'prestadores' ? 
                  <Briefcase className="h-8 w-8 mx-auto text-gray-400" /> : 
                  <User className="h-8 w-8 mx-auto text-gray-400" />
                }
              </div>
              <p>
                {searchTerm || statusFilter !== 'todos' 
                  ? 'Nenhum resultado encontrado para os filtros selecionados' 
                  : `Nenhum ${type === 'prestadores' ? 'prestador' : 'cliente'} cadastrado`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="flex items-center gap-4 p-4">
                  {type === 'prestadores' ? (
                    <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                      <Briefcase className="h-6 w-6 text-gray-500" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{item.nome}</h3>
                      <span className="flex-shrink-0 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">
                        #{item.id.toString().padStart(3, '0')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {type === 'prestadores' ? (item as Prestador).servico : (item as Cliente).email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {type === 'prestadores' && (
                      <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor((item as Prestador).status)}`}>
                        {((item as Prestador).status ? (item as Prestador).status.charAt(0).toUpperCase() + (item as Prestador).status.slice(1).toLowerCase() : 'N/A')}
                      </span>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleNavigate(type, 'edit', item.id)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading.prestadores || loading.clientes) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  return (
    <>
      <Header userType="empresa" />
      <div className="md:ml-60 md:p-7 p-6 space-y-8">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento</h1>

        <Tabs defaultValue="prestadores" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prestadores">Prestadores</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
          </TabsList>
          <TabsContent value="prestadores" className="mt-6">
            {renderList(prestadores, 'prestadores')}
          </TabsContent>
          <TabsContent value="clientes" className="mt-6">
            {renderList(clientes, 'clientes')}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Gerenciamento;