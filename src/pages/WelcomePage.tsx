import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Wind } from 'lucide-react';

interface WelcomeButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'outline';
}

const WelcomeButton: React.FC<WelcomeButtonProps> = ({ onClick, children, variant = "default" }) => (
  <Button
    onClick={onClick}
    variant={variant}
    className="w-full mb-3 py-6 text-lg font-medium transition-all hover:scale-102"
  >
    {children}
  </Button>
);

const WelcomePage: React.FC = () => {
  const handleNavigation = (path: string): void => {
    // Navigation logic would go here
    console.log(`Navigating to: ${path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl">
        <CardHeader className="flex flex-col items-center space-y-2 pb-2">
          <div className="p-3 bg-blue-100 rounded-full">
            <Wind className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo</h1>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600 mb-8">
            Conectando prestadores de serviços a clientes de forma rápida e eficiente.
          </p>

          <div className="space-y-3">
            <WelcomeButton onClick={() => handleNavigation('/login')}>
              Login
            </WelcomeButton>

            <WelcomeButton onClick={() => handleNavigation('/register')} variant="outline">
              Cadastrar como Prestador
            </WelcomeButton>

            <div className="text-center mt-6">
              <button 
                onClick={() => handleNavigation('/home')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors underline-offset-4 hover:underline"
              >
                Continuar como Visitante
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomePage;