
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import SessionsSection from '@/components/home/SessionsSection';
import { QuickActions } from '@/components/home/QuickActions';
import { WelcomeSection } from '@/components/home/WelcomeSection';

const Home = () => {
  const { user } = useAuth();
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        {user ? <WelcomeSection /> : <h1 className="text-3xl font-medievalsharp text-white mb-6">Bem-vindo ao Reino das Aventuras</h1>}
        
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <SessionsSection />
            </div>
            <div className="lg:col-span-1">
              <QuickActions />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/tables" className="fantasy-card p-6 hover:bg-fantasy-purple/10 transition-colors">
            <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-2">Mesas</h2>
            <p className="text-fantasy-stone">Gerencie e participe de mesas de RPG</p>
          </Link>
          
          <Link to="/characters" className="fantasy-card p-6 hover:bg-fantasy-purple/10 transition-colors">
            <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-2">Personagens</h2>
            <p className="text-fantasy-stone">Crie e gerencie seus personagens</p>
          </Link>
          
          <Link to="/items" className="fantasy-card p-6 hover:bg-fantasy-purple/10 transition-colors">
            <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-2">Itens</h2>
            <p className="text-fantasy-stone">Explore e crie itens e equipamentos</p>
          </Link>
          
          <Link to="/missions" className="fantasy-card p-6 hover:bg-fantasy-purple/10 transition-colors">
            <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-2">Missões</h2>
            <p className="text-fantasy-stone">Complete missões e ganhe recompensas</p>
          </Link>
          
          <Link to="/inventory" className="fantasy-card p-6 hover:bg-fantasy-purple/10 transition-colors">
            <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-2">Inventário</h2>
            <p className="text-fantasy-stone">Veja e gerencie todas as suas criações</p>
          </Link>
          
          <Link to="/shop" className="fantasy-card p-6 hover:bg-fantasy-purple/10 transition-colors">
            <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-2">Loja</h2>
            <p className="text-fantasy-stone">Adquira itens e recursos para suas aventuras</p>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
