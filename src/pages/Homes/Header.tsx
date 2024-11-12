import React, { useState } from 'react';
import { Camera, Menu as MenuIcon, X } from 'lucide-react';

interface HeaderProps {
  userType: 'empresa' | 'cliente' | 'prestador';
  userAvatar?: string;
}

const Header: React.FC<HeaderProps> = ({ userType, userAvatar }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Define opções de menu baseadas no tipo de usuário
  const navigationLinks = {
    empresa: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Products', href: '/products' },
      { label: 'Settings', href: '/settings' },
    ],
    cliente: [
      { label: 'Pedidos', href: '/pedidos' },
      { label: 'Histórico', href: '/historico' },
      { label: 'Suporte', href: '/suporte' },
    ],
    prestador: [
      { label: 'Serviços', href: '/servicos' },
      { label: 'Agenda', href: '/agenda' },
      { label: 'Configurações', href: '/configuracoes' },
    ],
  };

  return (
    <header className="bg-gray-900 text-white py-4 px-6 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <img
          src="/api/placeholder/100/40"
          alt={`${userType} Logo`}
          className="h-8"
        />
        <nav className={`${isMenuOpen ? 'block' : 'hidden'} md:block`}>
          <ul className="flex md:space-x-4 flex-col md:flex-row">
            {navigationLinks[userType].map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-gray-400 block md:inline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-800 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
            <Camera size={20} />
          </button>
        </div>
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
        <div className="hidden md:block">
          <img
            src={userAvatar || '/api/placeholder/40/40'}
            alt="User Avatar"
            className="rounded-full"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;