import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/layout/MainLayout';
import CharacterSharingManager from '@/components/character/CharacterSharingManager';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CharacterLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>(undefined);

  // Função para lidar com o carregamento de um personagem
  const handleLoadCharacter = (characterId: string) => {
    // Aqui você redirecionaria para a página de edição do personagem
    navigate(`/character/${characterId}`);
  };

  // Função para criar um novo personagem
  const handleCreateNewCharacter = () => {
    navigate('/character/new');
  };

  return (
    <MainLayout>
      <Helmet>
        <title>Biblioteca de Personagens | Dungeon Kreeper</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-medievalsharp text-fantasy-gold">Biblioteca de Personagens</h1>
          <Button 
            onClick={handleCreateNewCharacter}
            className="bg-fantasy-purple hover:bg-fantasy-purple/80"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Novo Personagem
          </Button>
        </div>

        <p className="text-muted-foreground mb-8">
          Gerencie seus personagens, compartilhe com amigos ou descubra personagens criados pela comunidade.
        </p>

        <CharacterSharingManager 
          characterId={selectedCharacterId} 
          onLoad={handleLoadCharacter}
        />
      </motion.div>
    </MainLayout>
  );
};

export default CharacterLibrary;