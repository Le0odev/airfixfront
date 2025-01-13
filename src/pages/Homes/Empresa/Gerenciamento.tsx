'use client'

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Loader2,
  Download,
  Filter,
  ArrowUpDown,
  Search,
  Mail,
  X,
  Phone,
  IdCard,
  Briefcase,
  Clock,
  Award,
  PencilIcon,
  History,
  MapPinHouse,
  ArrowDown,
  Calendar,
  FilterIcon,
  DollarSign,
  Users,
} from 'lucide-react';
import Header from "../Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Badge } from "@/components/ui/badge";
import api from '@/services/api';

import { StatsOverview } from './components/StatsOverview';
import { TabSelector } from './components/TabSelector';
import { ItemList } from './components/ItemList';
import { getTokenFromLocalStorage, getEmpresaIdFromToken, getStatusInfo } from './utils';
import { Prestador, Cliente, LoadingState, TabType } from './types';

const Gerenciamento: React.FC = () => {
  // State
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ prestadores: true, clientes: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [sortField, setSortField] = useState<'nome' | 'id'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItem, setSelectedItem] = useState<Prestador | Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('prestadores');
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [activeFilterOption, setActiveFilterOption] = useState<string | null>(null);
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string[]>([]);
  const [certificationFilter, setCertificationFilter] = useState<string[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Handlers
  const handleNavigate = (type: TabType, action: 'new' | 'edit' = 'new', id?: number) => {
    if (type === 'prestadores') {
      navigate(action === 'new' ? '/provider-register' : `/provider-register/${id}`);
    } else {
      navigate(action === 'new' ? '/user-register' : `/user-register/${id}`);
    }
  };

  const handleSort = (field: 'nome' | 'id') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filterAndSortItems = (items: Prestador[] | Cliente[], type: TabType) => {
    return items
      .filter(item => {
        const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
        if (type === 'prestadores') {
          const prestador = item as Prestador;
          const matchesStatus = statusFilter === 'todos' || prestador.status?.toLowerCase() === statusFilter;
          const matchesExperience = experienceFilter === "all" || (
            experienceFilter === "0-2" && prestador.anos_experiencia >= 0 && prestador.anos_experiencia <= 2
          ) || (
            experienceFilter === "3-5" && prestador.anos_experiencia >= 3 && prestador.anos_experiencia <= 5
          ) || (
            experienceFilter === "5+" && prestador.anos_experiencia > 5
          );
          const matchesSpecialty = specialtyFilter.length === 0 || specialtyFilter.every(specialty => prestador.especialidade.includes(specialty));
          const matchesCertification = certificationFilter.length === 0 || certificationFilter.some(cert => prestador.certificados.includes(cert));
          return matchesSearch && matchesStatus && matchesExperience && matchesSpecialty && matchesCertification;
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

  // Effects
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

  // Loading state
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
    <>
      <Header userType="empresa" />
      <main className="md:ml-64 px-4 sm:px-6 md:px-8 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            {/* Grupo da esquerda - Search + Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={`Buscar ${activeTab === 'prestadores' ? 'prestador' : 'cliente'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-gray-200 focus:ring-gray-900 focus:border-gray-900 w-full"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                {activeTab === 'prestadores' && (
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] border-gray-200">
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

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-200 hover:bg-gray-50"
                    onClick={() => handleSort('nome')}
                  >
                    <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-200 hover:bg-gray-50"
                    onClick={() => setIsFilterActive(!isFilterActive)}
                  >
                    <Filter className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Botão Novo Prestador isolado à direita */}
            <Button 
              onClick={() => handleNavigate(activeTab)}
              variant="default"
              size="default"
              className="bg-gray-900 hover:bg-gray-800 transition-colors w-full sm:w-auto sm:ml-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === 'prestadores' ? 'Novo Prestador' : 'Novo Cliente'}
            </Button>
          </div>

          {/* Filtros Avançados */}
          {isFilterActive && activeTab === 'prestadores' && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Filtro de Experiência */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Experiência</label>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione a experiência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="0-2">0-2 anos</SelectItem>
                      <SelectItem value="3-5">3-5 anos</SelectItem>
                      <SelectItem value="5+">Mais de 5 anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Especialidade */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Especialidade</label>
                  <Input
                    placeholder="Digite a especialidade"
                    value={specialtyFilter.join(', ')}
                    onChange={(e) => setSpecialtyFilter(e.target.value.split(', '))}
                    className="mt-1"
                  />
                </div>

                {/* Filtro de Certificação */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Certificação</label>
                  <Input
                    placeholder="Digite a certificação"
                    value={certificationFilter.join(', ')}
                    onChange={(e) => setCertificationFilter(e.target.value.split(', '))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

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
                <ItemList 
                  items={filterAndSortItems(prestadores, 'prestadores')} 
                  type="prestadores"
                  onItemSelect={setSelectedItem}
                />
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
                <ItemList 
                  items={filterAndSortItems(clientes, 'clientes')} 
                  type="clientes"
                  onItemSelect={setSelectedItem}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed top-0 right-0 w-full max-w-lg h-[100vh] bg-white shadow-xl border-l border-gray-200/50 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Detalhes do {activeTab === 'prestadores' ? 'Prestador' : 'Cliente'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

      <div className="space-y-6">
        {/* Header com Avatar */}
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage className="rounded-full" src={selectedItem.avatar} alt={selectedItem.nome} />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-xl font-medium">
              {selectedItem.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div> 
            <h3 className="text-lg font-semibold text-gray-900">{selectedItem.nome}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">ID #{selectedItem.id.toString().padStart(4, '0')}</span>
              {activeTab === 'prestadores' && (
                <Badge 
                  variant="secondary"
                  className={`px-2 py-0.5 ${getStatusInfo((selectedItem as Prestador).status).color}`}
                >
                  {React.createElement(getStatusInfo((selectedItem as Prestador).status).icon, {
                    className: "h-3 w-3 mr-1"
                  })}
                  {getStatusInfo((selectedItem as Prestador).status).label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'prestadores' && (
          <>
            {/* Informações Pessoais */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 border-b pb-1">Informações Pessoais</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">CPF</label>
                  <div className="flex items-center gap-2 mt-1">
                    <IdCard className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{(selectedItem as Prestador).cpf}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{(selectedItem as Prestador).telefone}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{(selectedItem as Prestador).email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Profissionais */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 border-b pb-1">Informações Profissionais</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Especialidade</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{(selectedItem as Prestador).especialidade}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Anos de Experiência</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{(selectedItem as Prestador).anos_experiencia} anos</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-900">{(selectedItem as Prestador).servico}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Certificados</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{(selectedItem as Prestador).certificados}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className=" pt-6 flex gap-2">
              <Button 
                onClick={() => handleNavigate(activeTab, 'edit', selectedItem.id)}
                className="flex-1 bg-gray-900 hover:bg-gray-800"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="outline"
                className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            </div>
          </>
        )}

        {activeTab === 'clientes' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{(selectedItem as Cliente).email}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Telefone</label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{(selectedItem as Cliente).telefone}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Endereço</label>
              <div className="flex items-center gap-2 mt-1">
                <MapPinHouse className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{(selectedItem as Cliente).endereco}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>
      </main>
    </>
  );
};

export default Gerenciamento;