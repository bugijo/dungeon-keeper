
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users, MessageSquare, Play } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import SessionTimeAlert from './SessionTimeAlert';

interface PlayerPreSessionScreenProps {
  tableId: string;
  weekday?: string;
  time?: string;
  character?: any;
}

const PlayerPreSessionScreen = ({ tableId, weekday, time, character }: PlayerPreSessionScreenProps) => {
  const navigate = useNavigate();

  const joinSession = () => {
    navigate(`/table/player/${tableId}`);
  };

  return (
    <div className="space-y-4">
      <SessionTimeAlert scheduledTime={time} weekday={weekday} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card className="p-4 bg-fantasy-dark/40 border-fantasy-purple/30">
          <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4 flex items-center gap-2">
            <User size={20} />
            Seu Personagem
          </h2>
          {character ? (
            <div className="space-y-2">
              <p className="text-white text-lg">{character.name}</p>
              <p className="text-fantasy-stone">
                {character.race} {character.class} - Nível {character.level}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-fantasy-stone mb-2">Você ainda não selecionou um personagem</p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/character')}
                className="mt-2"
              >
                Escolher Personagem
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-4 bg-fantasy-dark/40 border-fantasy-purple/30">
          <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            Chat da Mesa
          </h2>
          <div className="h-32 flex items-center justify-center">
            <p className="text-fantasy-stone">O chat estará disponível durante a sessão</p>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-fantasy-dark/40 border-fantasy-purple/30">
        <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4 flex items-center gap-2">
          <Users size={20} />
          Grupo
        </h2>
        <div className="text-center py-4">
          <p className="text-fantasy-stone mb-4">Aguardando o início da sessão</p>
          <Button 
            onClick={joinSession}
            className="fantasy-button primary flex items-center justify-center gap-2"
          >
            <Play size={16} />
            Entrar na Sessão
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PlayerPreSessionScreen;
