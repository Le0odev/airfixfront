import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';


export const getTokenFromLocalStorage = (): string | null => {
  return localStorage.getItem('token');
};

export const getEmpresaIdFromToken = (): string | null => {
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


export const getPrestadorIdFromToken = (): string | null => {
  const token = getTokenFromLocalStorage()
  if (!token) return null

  try {
    const decodedToken = JSON.parse(atob(token.split(".")[1]))
    return decodedToken?.id || null
  } catch (error) {
    console.error("Erro ao decodificar o token:", error)
    return null
  }
}

export const getStatusBadgeStyles = (status?: string) => {
  const styles = {
    ativo: 'bg-emerald-50 text-emerald-600 border-0',
    inativo: 'bg-rose-50 text-rose-600 border-0',
    pendente: 'bg-amber-50 text-amber-600 border-0'
  };
  return styles[status?.toLowerCase() as keyof typeof styles] || 'bg-gray-50 text-gray-600 border-0';
};

export const getStatusInfo = (status?: string) => {
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
