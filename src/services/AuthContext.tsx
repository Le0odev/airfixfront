import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import api from "@/services/api"; // Serviço de API para verificar o token

// 1. Tipagem dos tipos de usuário
interface BaseUser {
  id: string;
  name: string;
  email: string;
}

interface Empresa extends BaseUser {
  role: "empresa";
}

interface Prestador extends BaseUser {
  role: "prestador";
  empresaId: string;
}

interface Cliente extends BaseUser {
  role: "cliente";
}

type User = Empresa | Prestador | Cliente;

// 2. Tipagem do AuthContext
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 3. Verificar o token ao carregar o app
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get("/verify-token", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data.user); // Atualiza o usuário com os dados retornados
      } catch (error) {
        console.error("Erro ao verificar token:", error);
        logout(); // Remove o token inválido
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // 4. Login
  const login = async (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    try {
      const response = await api.get("/verify-token", {
        headers: { Authorization: `Bearer ${newToken}` },
      });

      setUser(response.data.user); // Atualiza o usuário
    } catch (error) {
      console.error("Erro ao verificar token após login:", error);
      logout();
    }
  };

  // 5. Logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {!isLoading ? children : <div>Carregando...</div>}
    </AuthContext.Provider>
  );
};

// 6. Hook personalizado
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
