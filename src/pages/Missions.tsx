
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { User, Star, Map, Package, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  category: 'personagem' | 'mapa' | 'item' | 'monstro' | 'npc';
  progress: number;
  total: number;
  reward: string;
  icon: React.ReactNode;
  completed: boolean;
}

const missions: Mission[] = [
  {
    id: '1',
    title: 'Iniciante em Criação',
    description: 'Crie seu primeiro personagem para começar sua jornada.',
    difficulty: 'Fácil',
    category: 'personagem',
    progress: 0,
    total: 1,
    reward: '100 moedas de ouro',
    icon: <User className="w-6 h-6 text-fantasy-gold" />,
    completed: false
  },
  {
    id: '2',
    title: 'Mestre das Histórias',
    description: 'Crie uma coleção de 5 personagens diferentes.',
    difficulty: 'Médio',
    category: 'personagem',
    progress: 2,
    total: 5,
    reward: '500 moedas de ouro + Item raro',
    icon: <Star className="w-6 h-6 text-fantasy-gold" />,
    completed: false
  },
  {
    id: '3',
    title: 'Cartógrafo Iniciante',
    description: 'Crie seu primeiro mapa de dungeon.',
    difficulty: 'Fácil',
    category: 'mapa',
    progress: 0,
    total: 1,
    reward: '150 moedas de ouro',
    icon: <Map className="w-6 h-6 text-fantasy-gold" />,
    completed: false
  },
  {
    id: '4',
    title: 'Criador de Artefatos',
    description: 'Crie 3 itens mágicos para suas aventuras.',
    difficulty: 'Médio',
    category: 'item',
    progress: 3,
    total: 3,
    reward: '300 moedas de ouro',
    icon: <Package className="w-6 h-6 text-fantasy-gold" />,
    completed: true
  },
  {
    id: '5',
    title: 'Construtor de Mundos',
    description: 'Crie 10 NPCs para popular seu mundo de jogo.',
    difficulty: 'Difícil',
    category: 'npc',
    progress: 7,
    total: 10,
    reward: '800 moedas de ouro + Item lendário',
    icon: <Users className="w-6 h-6 text-fantasy-gold" />,
    completed: false
  }
];

const Missions = () => {
  const claimReward = (missionId: string, reward: string) => {
    toast.success(`Recompensa recebida: ${reward}`, {
      description: "As recompensas foram adicionadas ao seu inventário!"
    });
    // Aqui seria implementada a lógica para adicionar a recompensa ao inventário do jogador
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-medievalsharp text-fantasy-gold mb-6 flex items-center gap-2">
          <Star className="w-8 h-8" />
          Missões
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <Card key={mission.id} className="bg-fantasy-dark border border-fantasy-purple/20 p-6 hover:border-fantasy-purple/50 transition-colors">
              <div className="mb-4">{mission.icon}</div>
              <h2 className="text-xl font-medievalsharp text-fantasy-gold mb-2">{mission.title}</h2>
              <p className="text-fantasy-stone mb-4">{mission.description}</p>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <Progress 
                  value={(mission.progress / mission.total) * 100} 
                  className="bg-fantasy-purple/10 h-2"
                />
                <p className="text-sm text-fantasy-stone mt-1 text-center">
                  {mission.progress}/{mission.total} completados
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-fantasy-stone">Dificuldade: {mission.difficulty}</span>
                <span className="text-sm text-fantasy-gold">Recompensa: {mission.reward}</span>
              </div>
              
              {mission.completed && (
                <Button 
                  className="w-full mt-4 bg-fantasy-gold hover:bg-fantasy-gold/80 text-fantasy-dark font-medievalsharp"
                  onClick={() => claimReward(mission.id, mission.reward)}
                >
                  Receber Recompensa
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Missions;
