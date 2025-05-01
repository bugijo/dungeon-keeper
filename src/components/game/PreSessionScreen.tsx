
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Eye, Map, Users, Sword, BookOpen, Play } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import SessionTimeAlert from './SessionTimeAlert';

interface PreSessionScreenProps {
  tableId: string;
  weekday?: string;
  time?: string;
}

const PreSessionScreen = ({ tableId, weekday, time }: PreSessionScreenProps) => {
  const navigate = useNavigate();

  const startSession = () => {
    navigate(`/table/gm/${tableId}`);
  };

  return (
    <div className="space-y-4">
      <SessionTimeAlert scheduledTime={time} weekday={weekday} />
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Eye size={16} />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="maps" className="flex items-center gap-1">
            <Map size={16} />
            Mapas
          </TabsTrigger>
          <TabsTrigger value="monsters" className="flex items-center gap-1">
            <Sword size={16} />
            Monstros
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-1">
            <BookOpen size={16} />
            Notas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="fantasy-card p-4">
            <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4">Preparação da Sessão</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate(`/maps?table=${tableId}`)}
              >
                <Map size={24} />
                <span>Preparar Mapas</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate(`/monsters?table=${tableId}`)}
              >
                <Sword size={24} />
                <span>Preparar Monstros</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate(`/npcs?table=${tableId}`)}
              >
                <Users size={24} />
                <span>Gerenciar NPCs</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate(`/stories?table=${tableId}`)}
              >
                <BookOpen size={24} />
                <span>Revisar História</span>
              </Button>
            </div>
          </div>
          
          <div className="fantasy-card p-4 text-center">
            <Button 
              onClick={startSession}
              className="fantasy-button primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Play size={16} />
              Iniciar Sessão
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="maps">
          <div className="fantasy-card p-4">
            <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4">Mapas Preparados</h2>
            {/* Map content will be implemented later */}
            <p className="text-fantasy-stone text-center py-8">Carregue seus mapas para a sessão aqui</p>
          </div>
        </TabsContent>

        <TabsContent value="monsters">
          <div className="fantasy-card p-4">
            <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4">Monstros Preparados</h2>
            {/* Monsters content will be implemented later */}
            <p className="text-fantasy-stone text-center py-8">Organize seus monstros para os encontros aqui</p>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="fantasy-card p-4">
            <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4">Notas da Sessão</h2>
            <textarea 
              className="w-full h-64 bg-fantasy-dark/40 text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-fantasy-purple"
              placeholder="Anote aqui seus planos para a sessão..."
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PreSessionScreen;
