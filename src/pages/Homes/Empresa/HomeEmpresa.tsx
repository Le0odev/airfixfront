import React, { useEffect, useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import api from "@/services/api"; // Serviço de API para fazer a requisição

// Usando React.lazy para carregar o Dashboard de forma assíncrona
const Dashboard = React.lazy(() => import("./Dashboard"));

const HomeEmpresa = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token"); // Obter o token do localStorage

      if (!token) {
        navigate("/login-company"); // Redirecionar para login se o token não existir
        return;
      }

      try {
        // Fazendo a requisição para verificar se o token é válido e o usuário é autorizado
        const response = await api.get("/empresa-dashboard", {
          headers: {
            Authorization: `Bearer ${token}` // Enviar o token no cabeçalho
          }
        });

        if (response.status === 200) {
          setIsAuthorized(true); // Permitir acesso se autorizado
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
        navigate("/login-company"); // Redirecionar para login em caso de erro
      }
    };

    verifyToken();
  }, [navigate]);

  if (!isAuthorized) {
    // Exibe um estado de carregamento enquanto verifica a autorização
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <Header userType="empresa" userAvatar="/path-to-avatar.jpg" />
      {/* Usando Suspense para mostrar um fallback enquanto o Dashboard é carregado */}
      <Suspense fallback={<div>Carregando Dashboard...</div>}>
        <Dashboard />
      </Suspense>
    </div>
  );
};

export default HomeEmpresa;
