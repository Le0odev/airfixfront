
import React, { useState } from "react";
import { Menu as MenuIcon, Search, Bell, X } from "lucide-react";
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

interface HeaderProps {
  userType: "empresa" | "cliente" | "prestador";
  userAvatar?: string;
  userName?: string;
  notificationCount?: number;
}

const navigationLinks: Record<HeaderProps["userType"], { label: string; href: string }[]> = {
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

const NavigationLinks: React.FC<{ links: { label: string; href: string }[]; className?: string }> = ({ 
  links, 
  className 
}) => {
  const [activeLink, setActiveLink] = useState(window.location.pathname);

  return (
    <nav className={`flex ${className} ml-12`}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={`px-5 py-2 mx-1 rounded-md transition-colors duration-200 text-sm font-medium ${
            activeLink === link.href
              ? "text-white bg-blue-600"
              : "text-gray-300 hover:text-white hover:bg-gray-800"
          }`}
          onClick={() => setActiveLink(link.href)}
          aria-label={`Navegar para ${link.label}`}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

const Header: React.FC<HeaderProps> = ({ 
  userType, 
  userAvatar, 
  userName = "Usuário",
  notificationCount = 0 
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 shadow-lg sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-16 flex items-center justify-between">
        {/* Logo e nome */}
        <div className={`flex items-center transition-opacity duration-300 ${isMobileSearchOpen ? 'md:opacity-100 opacity-0' : 'opacity-100'} ml-0`}>
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <img
              src="/src/assets/logo3.png"
              alt={`Logo do ${userType}`}
              className="h-11 w-auto " // Ajustei o tamanho da logo
            />
          </a>
          <div className="flex flex-col space-y-0 ml-3 ">  {/* Alterei de space-x-1 para space-y-1 */}
            <span className="text-white text-xl font-bold tracking-tight">AirTech</span>
            <span className="text-blue-400 text-xs font-medium hidden md:block">Solutions & Services</span>
          </div>
        </div>
      </div>

  
        {/* Navegação Desktop */}
        <div className="hidden md:flex items-center justify-center flex-1 px-0 space-x-1">  {/* Ajustei de space-x-6 para space-x-2 */}
          <NavigationLinks
            links={navigationLinks[userType]}
            className="mx-auto"
          />
        </div>
  
        {/* Área direita - Busca e opções do usuário */}
        <div className="flex items-center space-x-4">
          {/* Campo de busca - Desktop */}
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder="Busque produtos, serviços..."
              className={`w-64 bg-gray-800 border-gray-700 text-white placeholder-gray-400 
                transition-all duration-200 rounded-lg shadow-md ${
                  isSearchFocused 
                    ? "ring-2 ring-blue-500 border-transparent" 
                    : "hover:bg-gray-700"
                }`}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label="Pesquisar"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label="Iniciar busca"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
  
          {/* Campo de busca - Mobile */}
          <div className="md:hidden">
            {isMobileSearchOpen ? (
              <div className="absolute inset-x-0 top-0 h-16 bg-gray-900 px-4 flex items-center">
                <Input
                  type="text"
                  placeholder="Pesquisar..."
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-full shadow-md"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-gray-400 hover:text-white"
                  onClick={() => setIsMobileSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => setIsMobileSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          {/* Notificações */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-400 hover:text-white"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-blue-600 border-2 border-gray-900"
                variant="secondary"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>
  
          {/* Menu de opções do usuário */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9 border-2 border-gray-700 hover:border-blue-500 transition-colors">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="bg-gray-600">
                      {userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 " align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="font-medium">{userName}</p>
                    <p className="text-xs text-gray-500">
                      {userType.charAt(0).toUpperCase() + userType.slice(1)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="flex items-center cursor-pointer">Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="flex items-center cursor-pointer">Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500">
                  <span className="flex items-center cursor-pointer">Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
  
          {/* Menu para dispositivos móveis */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white"
                  aria-label="Abrir menu"
                >
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-gray-900 text-white border-gray-800">
                <SheetHeader>
                  <SheetTitle className="text-white">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userAvatar} alt={userName} />
                        <AvatarFallback className="bg-gray-600">
                          {userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{userName}</p>
                        <p className="text-sm text-gray-400">
                          {userType.charAt(0).toUpperCase() + userType.slice(1)}
                        </p>
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6">
                  <ul className="space-y-4">
                    {navigationLinks[userType].map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          className="block py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 
                            transition-colors duration-200"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  </header>
  );
};

export default Header;




