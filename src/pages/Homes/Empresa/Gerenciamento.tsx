'use client'

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  MoreHorizontal,
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Clock,
  SlidersHorizontal,
  MoreVertical,
  X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from '@/services/api';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";

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
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<Prestador | Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<'prestadores' | 'clientes'>('prestadores');
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

  const getStatusInfo = (status?: string) => {
    const statusConfig = {
      ativo: {
        color: 'bg-emerald-100/40 text-emerald-700 ring-emerald-600/20',
        icon: CheckCircle2,
        label: 'Ativo'
      },
      inativo: {
        color: 'bg-rose-100/40 text-rose-700 ring-rose-600/20',
        icon: XCircle,
        label: 'Inativo'
      },
      pendente: {
        color: 'bg-amber-100/40 text-amber-700 ring-amber-600/20',
        icon: AlertCircle,
        label: 'Pendente'
      }
    };
    return statusConfig[status?.toLowerCase() as keyof typeof statusConfig] || statusConfig.pendente;
  };

  const renderList = (items: Prestador[] | Cliente[], type: 'prestadores' | 'clientes') => {
    const filteredItems = filterAndSortItems(items, type);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-900">
                {type === 'prestadores' ? 'Prestadores' : 'Clientes'}
              </h2>
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 rounded-full px-3">
                {filteredItems.length}
              </Badge>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="default"
                className="text-gray-700 border-gray-200 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button 
                onClick={() => handleNavigate(type)}
                variant="default"
                size="default"
                className="bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                {type === 'prestadores' ? 'Novo Prestador' : 'Novo Cliente'}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={`Buscar ${type === 'prestadores' ? 'prestador' : 'cliente'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-gray-200 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
            
            <div className="flex gap-3">
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
                className="border-gray-200 hover:bg-gray-50"
              >
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
              </Button>
　
              <Button
                variant="outline"
                size="icon"
                className="border-gray-200 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-200">
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                {type === 'prestadores' ? 
                  <Briefcase className="h-8 w-8 text-gray-400" /> :
                  <User className="h-8 w-8 text-gray-400" />
                }
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {type === 'prestadores' ? 'Nenhum prestador encontrado' : 'Nenhum cliente encontrado'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'todos' 
                  ? 'Tente ajustar os filtros ou termos de busca' 
                  : `Comece adicionando seu primeiro ${type === 'prestadores' ? 'prestador' : 'cliente'}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <Avatar className="h-12 w-12 rounded-full ring-2 ring-white">
                      <AvatarImage 
                        className="rounded-full object-cover" 
                        src={item.avatar} 
                      />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-medium">
                        {item.nome.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">{item.nome}</span>
                        <span className="text-xs text-gray-500">
                          #{item.id.toString().padStart(3, '0')}
                        </span>
                      </div>
                      {type === 'prestadores' && (
                        <div className="text-sm text-gray-500 truncate">
                          {(item as Prestador).servico}
                        </div>
                      )}
                    </div>

                    {type === 'prestadores' && (
                      <Badge 
                        variant="secondary"
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeStyles((item as Prestador).status)}`}
                      >
                        {(item as Prestador).status?.charAt(0).toUpperCase() + 
                         (item as Prestador).status?.slice(1).toLowerCase()}
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  };

  if (loading.prestadores || loading.clientes) {
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
    <div className="min-h-screen bg-gray-50/50">
      <Header userType="empresa" />
      <main className="md:ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: 'Total Registros',
                value: activeTab === 'prestadores' ? prestadores.length : clientes.length,
                change: '+12.5%',
                trend: 'up'
              },
              {
                label: 'Ativos',
                value: activeTab === 'prestadores' 
                  ? prestadores.filter(p => p.status === 'ativo').length 
                  : clientes.length,
                change: '+5.2%',
                trend: 'up'
              },
              {
                label: 'Inativos',
                value: activeTab === 'prestadores' 
                  ? prestadores.filter(p => p.status === 'inativo').length 
                  : 0,
                change: '-2.1%',
                trend: 'down'
              },
              {
                label: 'Pendentes',
                value: activeTab === 'prestadores' 
                  ? prestadores.filter(p => p.status === 'pendente').length 
                  : 0,
                change: '0%',
                trend: 'neutral'
              }
            ].map((stat, index) => (
              <Card key={index} className="border border-gray-200/50">
                <CardHeader className="p-6">
                  <CardDescription className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </CardDescription>
                  <div className="flex items-baseline gap-2 mt-1">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </CardTitle>
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-emerald-600' :
                      stat.trend === 'down' ? 'text-rose-600' :
                      'text-gray-500'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="mb-8 bg-white rounded-xl shadow-sm p-1.5">
            <div className="grid grid-cols-2 gap-1">
              {(['prestadores', 'clientes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                    transition-all duration-200 text-sm font-medium
                    ${activeTab === tab 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {tab === 'prestadores' ? (
                    <>
                      <Briefcase className="h-4 w-4" />
                      Prestadores
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4" />
                      Clientes
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'prestadores' && (
              <motion.div
                key="prestadores"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderList(prestadores, 'prestadores')}
              </motion.div>
            )}
            {activeTab === 'clientes' && (
              <motion.div
                key="clientes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderList(clientes, 'clientes')}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick View Drawer */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="fixed top-0 right-0 w-full max-w-lg h-full bg-white shadow-xl border-l border-gray-200/50 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalhes do {activeTab === 'prestadores' ? 'Prestador' : 'Cliente'}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedItem.avatar} alt={selectedItem.nome} />
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xl font-medium">
                      {selectedItem.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedItem.nome}</h3>
                    <p className="text-sm text-gray-500">#{selectedItem.id.toString().padStart(4, '0')}</p>
                  </div>
                </div>

                {activeTab === 'prestadores' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge 
                        variant="secondary"
                        className={`mt-1 px-3 py-1 ${getStatusInfo((selectedItem as Prestador).status).color}`}
                      >
                        {React.createElement(getStatusInfo((selectedItem as Prestador).status).icon, {
                          className: "h-3.5 w-3.5 mr-1"
                        })}
                        {getStatusInfo((selectedItem as Prestador).status).label}
                      </Badge>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Serviço</label>
                      <p className="mt-1 text-gray-900">{(selectedItem as Prestador).servico}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">email@exemplo.com</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">(11) 99999-9999</span>
                    </div>
                  </div>
                </div>

                {activeTab === 'prestadores' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Cadastro</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">Jan 2024</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total de Serviços</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">32 serviços</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 flex gap-3">
                  <Button 
                    onClick={() => handleNavigate(activeTab, 'edit', selectedItem.id)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Gerenciamento;