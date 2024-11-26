import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import WelcomePage from './pages/WelcomePage';
import LoginScreen from './pages/Login';
import RegisterScreen from './pages/RegisterScreen';
import ServiceProviderRegister from './pages/ServiceProviderRegister';
import CompanyRegisterScreen from './pages/CompanyRegisterScreen';
import CompanyLoginScreen from './pages/CompanyLoginScreen';
import HomeEmpresa from './pages/Homes/Empresa/HomeEmpresa';
import HomeCliente from './pages/Homes/Cliente/HomeCliente';
import NotFound from './pages/Homes/NotFound';
import HomePrestador from './pages/Homes/Prestador/HomePrestador';
import Servicos from './pages/Homes/Empresa/Serviços';
import EstoquePedidos from './pages/Homes/Empresa/Estoque';
import { AuthProvider } from "@/services/AuthContext"; // Certifique-se de ajustar o caminho do contexto


// Importar outros componentes conforme necessário

function App() {
  return (
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<SplashScreen />} />
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/company-register" element={<CompanyRegisterScreen />} />
                <Route path="/login-company" element={<CompanyLoginScreen />} />
                <Route path="/login-client" element={<LoginScreen />} />
                <Route path="/user-register" element={<RegisterScreen />} />
                <Route path="/provider-register" element={<ServiceProviderRegister />} />
                <Route path="/home/empresa" element={<HomeEmpresa />} />
                <Route path="/home/cliente" element={<HomeCliente />} />
                <Route path="/home/prestador" element={<HomePrestador />} />
                <Route path="/empresa/servicos" element={<Servicos />} />
                <Route path="/empresa/estoque" element={<EstoquePedidos />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
  );
}

export default App;
