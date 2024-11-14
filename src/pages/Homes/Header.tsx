
import React, { useState, useEffect } from "react";
import {  Search, Bell, X, ChevronDown, Home, ShoppingBag, Calendar, Headphones, LayoutGrid, ClipboardCheck, FileText, PlusCircle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Types
interface HeaderProps {
  userType: "empresa" | "cliente" | "prestador";
  userAvatar?: string;
  userName?: string;
  notificationCount?: number;
}

type NavigationLink = {
  label: string;
  href: string;
};

// Theme configuration
const theme = {
  header: {
    bg: "bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800",
    text: {
      primary: "text-white",
      secondary: "text-gray-400",
      accent: "text-blue-400",
    },
    hover: {
      bg: "hover:bg-gray-700/50",
      text: "hover:text-white",
    },
    active: {
      bg: "bg-blue-600/90",
      text: "text-white",
    },
    transition: "transition-all duration-200 ease-in-out",
  },
};

// Navigation configuration
const navigationLinks: Record<HeaderProps["userType"], NavigationLink[]> = {
  empresa: [
    { label: "Painel", href: "/dashboard" },
    { label: "Serviços", href: "/servicos" },
    { label: "Estoque", href: "/estoque" },
    { label: "Relatórios", href: "/relatórios" },

    
  ],
  cliente: [
    { label: "Solicitar Serviço", href: "/solicitar-servico" },
    { label: "Minha OS", href: "/minha-os" },
    { label: "Histórico", href: "/historico" },
    { label: "Suporte", href: "/suporte" },

  ],
  prestador: [
    { label: "Minhas Tarefas", href: "/minhas-tarefas" },
    { label: "Agenda", href: "/agenda" },
    { label: "Painel OS", href: "/painel-os" },
    { label: "Relatórios", href: "/relatorios" }
    ],
};

// Skip Link Component
const SkipLink: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white focus:text-black"
  >
    Pular para o conteúdo principal
  </a>
);

const Logo: React.FC = React.memo(() => (
  <div className="flex items-center">
    <a href="/" className="flex items-center" aria-label="Ir para página inicial">
      <img
        src="/assets/logo3.png"
        alt="Logo AirTech"
        className="h-9 w-auto" 
      />
    </a>
    <div className="flex flex-col space-y-0 ml-2.5"> 
      <span className="text-white text-lg font-bold tracking-tight">
        AirTech
      </span>
      <span className="text-blue-400/90 text-xs font-medium hidden md:block">
        Solutions & Services
      </span>
    </div>
  </div>
));

Logo.displayName = "Logo";

// Navigation Component
const NavigationLinks: React.FC<{
  links: NavigationLink[];
  className?: string;
}> = React.memo(({ links, className }) => {
  const [activeLink, setActiveLink] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '';
  });

  return (
    <nav className={`flex ${className} ml-8`}> 
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={`px-4 py-1.5 mx-1 rounded-md ${theme.header.transition} text-sm font-medium
            ${activeLink === link.href
              ? `${theme.header.active.bg} ${theme.header.active.text} shadow-lg`
              : `text-gray-300 ${theme.header.hover.bg} hover:text-white`
            }`}
          onClick={() => setActiveLink(link.href)}
          aria-current={activeLink === link.href ? "page" : undefined}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
});

NavigationLinks.displayName = "NavigationLinks";

// Search Bar Component
const SearchBar: React.FC<{
  isMobile?: boolean;
  onClose?: () => void;
  isPWA?: boolean;
}> = React.memo(({ isMobile, onClose, isPWA }) => {
  const [isFocused, setIsFocused] = useState(false);

  if (isMobile) {
    return (
      <div 
        className={`absolute inset-x-0 top-0 h-16 bg-gray-900 px-4 flex items-center ${
          isPWA ? 'pt-safe-top' : ''
        }`}
        style={{
          paddingTop: isPWA ? 'env(safe-area-inset-top, 0px)' : '0px',
        }}
      >
        <Input
          type="text"
          placeholder="Pesquisar..."
          className="flex-1 bg-gray-800/90 border-gray-700 text-white placeholder-gray-400 
            rounded-full shadow-md focus:ring-2 focus:ring-blue-500/50"
          autoFocus
        />
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative hidden md:block">
      <Input
        type="text"
        placeholder="Busque produtos, serviços..."
        className={`w-72 bg-gray-800/90 border-gray-700 text-white placeholder-gray-400 
          ${theme.header.transition} rounded-lg shadow-md ${
            isFocused 
              ? "ring-2 ring-blue-500/50 border-transparent" 
              : "hover:bg-gray-700/80"
          }`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
});

SearchBar.displayName = "SearchBar";

// NotificationBadge Component
const NotificationBadge: React.FC<{
  count: number;
}> = React.memo(({ count }) => {
  if (count === 0) return null;
  
  return (
    <Badge 
      className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center 
        bg-blue-600 border border-gray-900 text-xs font-semibold"
      variant="secondary"
    >
      {count}
    </Badge>
  );
});

NotificationBadge.displayName = "NotificationBadge";

// UserMenu Component
const UserMenu: React.FC<{
  userName: string;
  userType: string;
  userAvatar?: string;
}> = React.memo(({ userName, userType, userAvatar }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800/80 focus:outline-none"
        >
          <Avatar className="h-8 w-8 border-2 border-gray-700 hover:border-blue-500 transition-colors">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-gray-600">
              {userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 
              ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-56 bg-gray-800 border-gray-700 text-gray-100 mt-2 rounded-lg shadow-lg"
        align="end"
      >
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex flex-col space-y-1">
            <p className="font-medium">{userName}</p>
            <p className="text-xs text-gray-400">
              {userType.charAt(0).toUpperCase() + userType.slice(1)}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        <DropdownMenuItem className="hover:bg-gray-700/80">
          <span className="flex items-center cursor-pointer">Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-gray-700/80">
          <span className="flex items-center cursor-pointer">Configs</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
          <span className="flex items-center cursor-pointer">Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserMenu.displayName = "UserMenu";

// Mobile Menu Component
const MobileMenu: React.FC<{
  userType: HeaderProps["userType"];
  userName: string;
  userAvatar?: string;
  links: NavigationLink[];
  isPWA: boolean;
}> = React.memo(({  links, isPWA }) => {
  const [activeLink, setActiveLink] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return "";
  });

  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "painel":
        return <Home className="h-5 w-5" />;
      case "serviços":
        return <LayoutGrid className="h-5 w-5" />;
      case "estoque":
        return <ShoppingBag className="h-5 w-5" />;
      case "relatórios":
        return <ClipboardList className="h-5 w-5" />;
      case "solicitar serviço":
        return <PlusCircle className="h-5 w-5" />;
      case "minha os":
        return <FileText className="h-5 w-5" />;
      case "suporte":
        return <Headphones className="h-5 w-5" />;
      case "histórico":
        return <Calendar className="h-5 w-5" />;
      case "minhas tarefas":
        return <ClipboardCheck className="h-5 w-5" />;
      case "painel os":
        return <Home className="h-5 w-5" />;
      case "agenda":
        return <Calendar className="h-5 w-5" />;
      default:
        return <Home className="h-5 w-5" />;
    }
  };
  

  return (
    <nav 
      className={`
        md:hidden 
        fixed 
        bottom-0 
        left-0 
        right-0 
        z-50 
        bg-gray-900 
        border-t 
        border-gray-800 
        rounded-t-xl
        ${isPWA ? 'pb-safe-bottom' : ''}
      `}
      style={{
        paddingBottom: isPWA ? 'env(safe-area-inset-bottom, 0px)' : '0px',
        paddingLeft: isPWA ? 'env(safe-area-inset-left, 0px)' : '0px',
        paddingRight: isPWA ? 'env(safe-area-inset-right, 0px)' : '0px',
      }}
    >
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {links.map((item) => {
            const icon = getIcon(item.label);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setActiveLink(item.href)}
                className={`flex flex-col items-center justify-center space-y-1 ${
                  activeLink === item.href ? "text-blue-400" : "text-gray-400"
                }`}
              >
                {icon}
                <span className="text-xs">{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

MobileMenu.displayName = "MobileMenu";

// Main Header Component
const Header: React.FC<HeaderProps> = ({ 
  userType, 
  userAvatar, 
  userName = "Usuário", 
  notificationCount = 0 
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Detecta se está rodando como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWA(isStandalone);
  }, []);

  return (
    <div className="relative">
      <header 
        className={`
          ${theme.header.bg} 
          shadow-lg 
          sticky 
          top-0 
          z-50
          ${isPWA ? 'pt-safe-top' : ''} 
        `}
        style={{
          paddingTop: isPWA ? 'env(safe-area-inset-top, 0px)' : '0px',
        }}
        role="banner"
      >
        <SkipLink />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo e nome */}
            <div className={`flex items-center transition-opacity duration-300 ${isMobileSearchOpen ? 'md:opacity-100 opacity-0' : 'opacity-100'} ml-0`}>
              <Logo />
            </div>

            {/* Navegação Desktop */}
            <div className="hidden md:flex items-center justify-center flex-1 px-0 space-x-1">
            <NavigationLinks
                links={navigationLinks[userType]}
                className="mx-auto"
              />
            </div>

            {/* Área direita */}
            <div className="flex items-center space-x-4 " >
              {/* Busca */}
              {isMobileSearchOpen ? (
                <SearchBar isMobile onClose={() => setIsMobileSearchOpen(false)} />
              ) : (
                <>
                  <SearchBar />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-gray-400 hover:text-white"
                    onClick={() => setIsMobileSearchOpen(true)}
                    aria-label="Abrir busca"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Ícones de Notificação e Avatar - Somente visíveis quando a busca não estiver aberta */}
              {!isMobileSearchOpen && (
                <>
                  {/* Notificações */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-gray-400 hover:text-white"
                    aria-label={`${notificationCount} notificações`}
                  >
                    <Bell className="h-5 w-5" />
                    <NotificationBadge count={notificationCount} />
                  </Button>

                  {/* Menu do usuário */}
                  <UserMenu
                    userName={userName}
                    userType={userType}
                    userAvatar={userAvatar}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 rounded-t-xl">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            {navigationLinks[userType].map((item) => {
              const IconComponent = getNavigationIcon(item.label);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center space-y-1 text-gray-400 hover:text-blue-400"
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      <div
        className={`md:pb-0 ${
          isPWA ? 'pb-safe-bottom' : 'pb-16'
        }`}
        style={{
          paddingBottom: isPWA ? 'env(safe-area-inset-bottom, 0px)' : '4rem',
        }}
      >
        {/* Conteúdo principal */}
      </div>
    </div>
  );
};

// Helper function to get navigation icons
const getNavigationIcon = (label: string) => {
  switch (label.toLowerCase()) {
    case "painel":
      return Home;
    case "serviços":
      return LayoutGrid;
    case "estoque":
      return ShoppingBag;
    case "relatórios":
      return ClipboardList;
    case "solicitar serviço":
      return PlusCircle;
    case "minha os":
      return FileText;
    case "suporte":
      return Headphones;
    case "histórico":
      return Calendar;
    case "minhas tarefas":
      return ClipboardCheck;
    case "painel os":
      return Home;
    case "agenda":
      return Calendar;
    default:
      return Home;
  }
  
};

export default Header;