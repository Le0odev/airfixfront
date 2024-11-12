import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import WelcomePage from './pages/WelcomePage';
import LoginScreen from './pages/Login';
import RegisterScreen from './pages/RegisterScreen';
import ServiceProviderRegister from './pages/ServiceProviderRegister';
import CompanyRegisterScreen from './pages/CompanyRegisterScreen';
import CompanyLoginScreen from './pages/CompanyLoginScreen';
import HomeEmpresa from './pages/Homes/HomeEmpresa';
import HomeCliente from './pages/Homes/HomeCliente';
import HomePrestador from './pages/Homes/HomePrestador';
import NotFound from './pages/Homes/NotFound';

// Importar outros componentes conforme necessário

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path='/company-register' element={<CompanyRegisterScreen />} />
          <Route path='/login-company' element={<CompanyLoginScreen />} />
          <Route path='/login-client' element={<LoginScreen />} />
          <Route path='/user-register' element={<RegisterScreen />} />
          <Route path='/service-provider' element={<ServiceProviderRegister />} />


          <Route path="/home/empresa" element={<HomeEmpresa />} />
          <Route path="/home/cliente" element={<HomeCliente />} />
          <Route path="/home/prestador" element={<HomePrestador />} />
          
          {/* Rota de fallback para páginas não encontradas */}
          <Route path="*" element={<NotFound />} />        
          </Routes>
      </div>
    </Router>
  );
}

export default App;
