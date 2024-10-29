import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import WelcomePage from './pages/WelcomePage';

// Importar outros componentes conforme necessário

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/welcome" element={<WelcomePage />} />
          
          {/* Adicione mais rotas aqui conforme necessário */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
