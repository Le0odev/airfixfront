import React, { useState} from "react";
import { Menu as MenuIcon, Search, Bell, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
    { label: "Produtos", href: "/products" },
    { label: "Configurações", href: "/settings" },
  ],
  cliente: [
    { label: "Pedidos", href: "/pedidos" },
    { label: "Histórico", href: "/historico" },
    { label: "Suporte", href: "/suporte" },
  ],
  prestador: [
    { label: "Serviços", href: "/servicos" },
    { label: "Agenda", href: "/agenda" },
    { label: "Configurações", href: "/configuracoes" },
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
}> = React.memo(({ isMobile, onClose }) => {
  const [isFocused, setIsFocused] = useState(false);

  if (isMobile) {
    return (
      <div className="absolute inset-x-0 top-0 h-16 bg-gray-900 px-4 flex items-center">
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

// NotificationBadge atualizado
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

// UserMenu atualizado
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
          className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/80"
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
        className="w-56 bg-gray-800 border-gray-700 text-gray-100" 
        align="end"
      >
        <DropdownMenuLabel className="font-normal">
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
          <span className="flex items-center cursor-pointer">Configurações</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
          <span className="flex items-center cursor-pointer">Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});


//melhore a partir daqui
UserMenu.displayName = "UserMenu";

const MobileMenu: React.FC<{
  userType: HeaderProps["userType"];
  userName: string;
  userAvatar?: string;
  links: NavigationLink[];
}> = React.memo(({ userType, userName, userAvatar, links }) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-400 hover:text-white md:hidden"
        aria-label="Abrir menu"
      >
        <MenuIcon className="h-6 w-6" />
      </Button>
    </SheetTrigger>
    <SheetContent side="right" className="w-[320px] bg-gray-900 text-white border-l border-gray-800">
      <SheetHeader>
        <SheetTitle className="text-white">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-gray-600">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{userName}</p>
              <p className="text-sm text-gray-400">
                {userType.charAt(0).toUpperCase() + userType.slice(1)}
              </p>
            </div>
          </div>
        </SheetTitle>
      </SheetHeader>
      <nav className="mt-8">
        <ul className="space-y-6">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="block py-3 px-5 rounded-lg bg-gray-800 hover:bg-gray-700 
                  transition-colors duration-300 ease-in-out"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </SheetContent>
  </Sheet>
));

MobileMenu.displayName = "MobileMenu";

// Main Header Component
const Header: React.FC<HeaderProps> = ({ 
  userType, 
  userAvatar, 
  userName = "Usuário",
  notificationCount = 0 
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header 
      className={`${theme.header.bg} shadow-lg sticky top-0 z-50`}
      role="banner"
    >
      <SkipLink />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo e nome */}
          <div className={`flex items-center transition-opacity duration-300 ${
            isMobileSearchOpen ? 'md:opacity-100 opacity-0' : 'opacity-100'
          } ml-0`}>
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
          <div className="flex items-center space-x-4">
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

            {/* Menu do usuário - Desktop */}
            <div className="hidden md:block">
              <UserMenu
                userName={userName}
                userType={userType}
                userAvatar={userAvatar}
              />
            </div>

            {/* Menu Mobile */}
            <MobileMenu
              userType={userType}
              userName={userName}
              userAvatar={userAvatar}
              links={navigationLinks[userType]}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;