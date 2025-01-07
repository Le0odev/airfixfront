export interface Prestador {
  id: number;
  nome: string;
  servico: string;
  status: string;
  email: string;
  telefone: string;
  especialidade: string;
  anos_experiencia: number;
  certificados: string;
  avatar?: string;
  cpf: string;
}

export interface Cliente {
  id: number;
  nome: string;
  email: string;
  avatar?: string;
}

export interface LoadingState {
  prestadores: boolean;
  clientes: boolean;
}

export interface StatCard {
  label: string;
  value: number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export type TabType = 'prestadores' | 'clientes';
export type ViewType = 'grid' | 'list';
export type SortField = 'nome' | 'id';
export type SortOrder = 'asc' | 'desc';
