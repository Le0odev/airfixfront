import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import LoadingSpinner from '../components/LoadingSpinner';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center">
      {/* Container principal com animação de fade in */}
      <div className="animate-fade-in flex flex-col items-center space-y-8">
        {/* Logo com animação de scale */}
        <div className="animate-scale-in">
          <Logo />
        </div>

        {/* Container do spinner e texto */}
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner className="w-12 h-12 text-white" />
          <p className="text-white text-lg font-medium animate-pulse">
            Carregando...
          </p>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-64 h-2 bg-blue-200 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-progress-bar rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

// Adicione estes estilos ao seu arquivo de CSS global ou Tailwind config
const style = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes progressBar {
  from { width: 0%; }
  to { width: 100%; }
}

.animate-fade-in {
  animation: fadeIn 1s ease-in;
}

.animate-scale-in {
  animation: scaleIn 0.8s ease-out;
}

.animate-progress-bar {
  animation: progressBar 2.5s linear;
}
`;