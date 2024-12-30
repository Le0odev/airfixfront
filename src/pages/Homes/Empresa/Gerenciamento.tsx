'use client'

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, User, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
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
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleNavigate = (type: 'prestadores' | 'clientes') => {
    if (type === 'prestadores') {
      navigate('/provider-register');
    } else {
      navigate('/user-register');
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

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const fetchPrestadores = async () => {
        setLoading(prevState => ({ ...prevState, prestadores: true })); // Define que está carregando
      
        try {
          // Fazendo a requisição usando a instância da API
          const response = await api.get(`/prestadores/${empresaId}`, {
            headers: {
              'Authorization': `Bearer ${token}`, // Se necessário, coloque seu token
              'Content-Type': 'application/json',
            }
          });
      
          // Verificando se a resposta foi bem-sucedida
          if (response.status === 200) {
            setPrestadores(response.data.data.prestadores || []); // Atualiza o estado com os prestadores ou uma lista vazia
          } else {
            // Caso a requisição não tenha sido bem-sucedida
            throw new Error(`Erro ao carregar os prestadores. Status: ${response.status}`);
          }
      
        } catch (err) {
          // Captura de erros
          toast({
            title: "Erro",
            description: err instanceof Error ? err.message : "Ocorreu um erro ao carregar os prestadores",
            variant: "destructive", // Você pode ajustar o tipo de toast conforme necessário
          });
        } finally {
          // Finaliza o carregamento, independentemente do sucesso ou erro
          setLoading(prevState => ({ ...prevState, prestadores: false }));
        }
      };
      
      const fetchClientes = async () => {
        try {
          const response = await fetch(`/api/clientes/empresa/${empresaId}`, { headers });
          if (!response.ok) {
            throw new Error('Falha ao buscar clientes');
          }
          const data = await response.json();
          setClientes(data || []);
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

  const renderList = (items: Prestador[] | Cliente[], type: 'prestadores' | 'clientes') => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{type === 'prestadores' ? 'Prestadores' : 'Clientes'}</h2>
        <Button onClick={() => handleNavigate(type)} className="flex items-center gap-2">
          <Plus size={16} />
          {type === 'prestadores' ? 'Novo Prestador' : 'Novo Cliente'}
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {type === 'prestadores' ? (
                <Briefcase className="h-8 w-8 text-gray-400" />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
              <div>
                <h3 className="font-medium">{item.nome}</h3>
                
                <p className="text-sm text-gray-500">
                  {type === 'prestadores' ? (item as Prestador).servico : (item as Cliente).email}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

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

