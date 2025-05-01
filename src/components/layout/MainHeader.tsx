
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationBell from './NotificationBell';

const MainHeader = () => {
  const { user, logOut } = useAuth(); // Changed from logout to logOut to match context

  const handleSignOut = async () => {
    try {
      await logOut(); // Changed from logout to logOut
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <header className="bg-fantasy-dark border-b border-fantasy-purple/30 px-6 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="RPG Master" className="h-8 mr-2" />
            <span className="text-xl font-medievalsharp text-fantasy-gold">RPG Master</span>
          </Link>
          <nav className="ml-10 hidden md:block">
            <ul className="flex space-x-6">
              <li><Link to="/tables" className="text-fantasy-stone hover:text-white">Mesas</Link></li>
              <li><Link to="/characters" className="text-fantasy-stone hover:text-white">Personagens</Link></li>
              <li><Link to="/tools" className="text-fantasy-stone hover:text-white">Ferramentas</Link></li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatar-placeholder.png" alt="Avatar" />
                      <AvatarFallback className="bg-fantasy-purple/20 text-fantasy-gold">
                        {user?.email?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-fantasy-dark border-fantasy-purple/30">
                  <DropdownMenuItem className="text-fantasy-stone">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-fantasy-purple/30" />
                  <DropdownMenuItem 
                    onSelect={handleSignOut}
                    className="text-red-400 cursor-pointer"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          {!user && (
            <Link to="/signin">
              <Button variant="outline" className="fantasy-button secondary">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
