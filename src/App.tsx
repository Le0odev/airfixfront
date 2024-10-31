import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import WelcomePage from './pages/WelcomePage';
import LoginScreen from './pages/Login';
import RegisterScreen from './pages/RegisterScreen';
import ServiceProviderRegister from './pages/ServiceProviderRegister';

// Importar outros componentes conforme necessário

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path='/login' element={<LoginScreen />} />
          <Route path='/user-register' element={<RegisterScreen />} />
          <Route path='/service-provider' element={<ServiceProviderRegister />} />
          
          {/* Adicione mais rotas aqui conforme necessário */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
