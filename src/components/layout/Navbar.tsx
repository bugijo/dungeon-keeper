
import React from 'react';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Link } from 'react-router-dom';
import { Book, Dice, Users } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <nav className="fixed top-0 w-full bg-fantasy-dark border-b border-fantasy-purple/30 z-50">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-lg font-medievalsharp text-white">
            RPG Companion
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          {user && (
            <>
              <Link to="/characters" className="text-fantasy-stone hover:text-fantasy-gold transition-colors flex items-center gap-1">
                <Book className="h-4 w-4" />
                <span>Personagens</span>
              </Link>
              <Link to="/dice" className="text-fantasy-stone hover:text-fantasy-gold transition-colors flex items-center gap-1">
                <Dice className="h-4 w-4" />
                <span>Dados</span>
              </Link>
              <Link to="/mesas" className="text-fantasy-stone hover:text-fantasy-gold transition-colors flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Mesas</span>
              </Link>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {user && <NotificationsDropdown />}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
