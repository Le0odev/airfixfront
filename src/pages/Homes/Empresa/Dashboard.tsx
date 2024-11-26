import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Jan', ordens: 40, servicos: 24, ganhos: 2400 },
  { name: 'Fev', ordens: 30, servicos: 13, ganhos: 1398 },
  { name: 'Mar', ordens: 20, servicos: 28, ganhos: 9800 },
  { name: 'Abr', ordens: 27, servicos: 39, ganhos: 3908 },
  { name: 'Mai', ordens: 18, servicos: 48, ganhos: 4800 },
  { name: 'Jun', ordens: 23, servicos: 38, ganhos: 3800 },
];

const quickStats = [
  { title: 'Total de OS', value: '158', desc: '+12.5% desde último mês' },
  { title: 'Serviços Ativos', value: '32', desc: '4 aguardando aprovação' },
  { title: 'Tempo Médio', value: '2.4h', desc: 'Por ordem de serviço' },
  { title: 'Satisfação', value: '98%', desc: 'Baseado em 124 avaliações' }
];

export default function Dashboard() {
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

      {/* Gráfico Principal */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Visão Geral de Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="ordens" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="servicos" 
                  stroke="#16a34a" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards Informativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ordens Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1,2,3].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">OS #{String(1000 + i)}</p>
                    <p className="text-sm text-gray-500">Manutenção Preventiva</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Em Progresso
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent className='mb-2'>
            <div className="space-y-4">
              {[1,2,3].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Cliente {i + 1}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(2024, 0, i + 15).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Confirmado
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}