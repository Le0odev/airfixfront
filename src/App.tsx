import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './hooks/SplashScreen';
import WelcomePage from './pages/WelcomePage';
import LoginScreen from './auth/auth-cliente/Login';
import RegisterScreen from './auth/auth-cliente/RegisterScreen';
import ServiceProviderRegister from './auth/auth-prestador/ServiceProviderRegister';
import CompanyRegisterScreen from './auth/auth-empresa/CompanyRegisterScreen';
import CompanyLoginScreen from './auth/auth-empresa/CompanyLoginScreen';
import HomeEmpresa from './pages/Homes/Empresa/HomeEmpresa';
import HomeCliente from './pages/Homes/Cliente/HomeCliente';
import NotFound from './pages/Homes/NotFound';
import HomePrestador from './pages/Homes/Prestador/HomePrestador';
import Servicos from './pages/Homes/Empresa/Serviços';
import EstoquePedidos from './pages/Homes/Empresa/Estoque';
import { AuthProvider } from "@/services/AuthContext"; // Certifique-se de ajustar o caminho do contexto
import Relatorios from './pages/Homes/Empresa/Relatorios';
import Gerenciamento from './pages/Homes/Empresa/Gerenciamento';
import ProviderLogin from './auth/auth-prestador/ProviderLogin';
import Agenda from './pages/Homes/Prestador/Agenda';
import PainelOS from './pages/Homes/Prestador/PainelOs';
import RelatoriosPrestador from './pages/Homes/Prestador/RelatorioPrestador';


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

                // Registros e login
                <Route path="/company-register" element={<CompanyRegisterScreen />} />
                <Route path="/login-company" element={<CompanyLoginScreen />} />
                <Route path="/login-client" element={<LoginScreen />} />
                <Route path="/user-register" element={<RegisterScreen />} />
                <Route path="/provider-register" element={<ServiceProviderRegister />} />
                <Route path="/provider-login" element={<ProviderLogin />} />
                // Homes
                <Route path="/home/empresa" element={<HomeEmpresa />} />
                <Route path="/home/cliente" element={<HomeCliente />} />
                <Route path="/home/prestador/minhas-tarefas" element={<HomePrestador />} />

                // Rotas empresa
                <Route path="/empresa/servicos" element={<Servicos />} />
                <Route path="/empresa/estoque" element={<EstoquePedidos />} />
                <Route path="/empresa/relatórios" element={<Relatorios />} />
                <Route path="/empresa/gerenciamento" element={<Gerenciamento/>} />

                // Rotas prestador
                <Route path="/prestador/agenda" element={<Agenda />} />
                <Route path="/prestador/painel-os" element={<PainelOS />} />
                <Route path="/prestador/provider-report" element={<RelatoriosPrestador />} />


                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
  );
}

export default App;
