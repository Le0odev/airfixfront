import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/services/api';

// Função para obter o ID da empresa do token
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

type Order = {
  id: number;
  descricao: string;
  status: 'em_progresso' | 'completada';
  data_criacao: string;
};

// Função para obter as estatísticas da API
const Dashboard = () => {
  const [quickStats, setQuickStats] = useState([
    { title: 'Total de OS', value: '0', desc: '' },
    { title: 'Serviços Ativos', value: '0', desc: '' },
    { title: 'Tempo Médio', value: '', desc: '' },
    { title: 'Custo Estimado Médio', value: 'R$ 0', desc: '' },
  ]);
  const [graficoData, setGraficoData] = useState([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);


  // Função para buscar as estatísticas rápidas e os dados do gráfico
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const empresaId = getEmpresaIdFromToken();
  
      // Verificando se o token ou o ID da empresa estão ausentes
      if (!empresaId || !token) {
        alert("Erro: Empresa ID ou Token não encontrado.");
        return;
      }
  
      // Requisição à API para buscar as estatísticas rápidas e dados do gráfico
      const responseStats = await api.get(`/ordens-servico/stats/${empresaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Verificando se a resposta de estatísticas é válida
      if (responseStats.status !== 200) {
        console.error("Erro na resposta da API para estatísticas:", responseStats.status);
        return;
      }
  
      const { totalOrders, activeOrders, tempoMedio, avgCost, graficoData } = responseStats.data;
  
      // Atualizando as estatísticas rápidas
      setQuickStats([
        { title: 'Total de OS', value: totalOrders, desc: 'Total de ordens de serviço' },
        { title: 'Serviços Ativos', value: activeOrders, desc: 'Ordens de serviço em progresso' },
        { title: 'Tempo Médio', value: tempoMedio, desc: 'Tempo médio de serviço' },
        { title: 'Custo Estimado Médio', value: `R$ ${avgCost}`, desc: 'Custo médio das ordens de serviço' },
      ]);
  
      // Atualizando os dados do gráfico
  
      // Requisição à API para buscar as ordens recentes
      const responseOrders = await api.get(`/ordens-servico/recentOrders/${empresaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Verificando se a resposta das ordens recentes é válida
      if (responseOrders.status !== 200) {
        console.error("Erro na resposta da API para ordens recentes:", responseOrders.status);
        return;
      }
  
      // Atualizando as ordens recentes
      setRecentOrders(responseOrders.data.recentOrders);

    } catch (error) {
      console.error("Erro ao carregar os dados do Dashboard:", error);
    }
  };
  

  // Carregar dados quando o componente for montado
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="md:p-10 p-6 space-y-6 md:ml-60">
      {/* Título da Página */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
        <p className="text-gray-500">Bem-vindo de volta! Aqui está um resumo da sua empresa.</p>
      </div>

      {/* Cards de Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Ordens Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">OS #{order.id}</p>
                      <p className="text-sm text-gray-500">{order.descricao}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'em_progresso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status === 'em_progresso' ? 'Em Progresso' : 'Completada'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">Nenhuma ordem recente.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
    
    </div>
  );
};

export default Dashboard;
