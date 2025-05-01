import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import GameMasterDashboard from '@/components/game/GameMasterDashboard';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';
import { Link } from 'react-router-dom';

const GameMasterPage: React.FC = () => {
  // Dados de exemplo para desenvolvimento
  const mockPlayers = [
    { id: '1', name: 'João', character: 'Thorin, o Anão Guerreiro', isOnline: true },
    { id: '2', name: 'Maria', character: 'Elaria, a Elfa Maga', isOnline: true },
    { id: '3', name: 'Pedro', character: 'Grom, o Meio-Orc Bárbaro', isOnline: false },
    { id: '4', name: 'Ana', character: 'Lyra, a Humana Clériga', isOnline: true },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Painel do Mestre</h1>
            <Link to="/mestre/audio">
              <Button className="flex items-center gap-2">
                <Music size={16} />
                Painel de Áudio e Ambiente
              </Button>
            </Link>
          </div>
        </div>
        <GameMasterDashboard 
          sessionId="sessao-teste-123"
          players={mockPlayers}
        />
      </div>
    </MainLayout>
  );
};

export default GameMasterPage;