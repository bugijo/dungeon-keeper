import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Maximize, Minimize, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FocusModeProps {
  children: React.ReactNode;
  characterHP?: number;
  characterMaxHP?: number;
  activeEffects?: string[];
  importantResources?: { name: string; current: number; max: number }[];
}

const FocusMode: React.FC<FocusModeProps> = ({
  children,
  characterHP = 0,
  characterMaxHP = 0,
  activeEffects = [],
  importantResources = []
}) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Verificar se o navegador está em modo de tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Alternar modo de foco
  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
    toast.info(isFocusMode ? 'Modo normal ativado' : 'Modo de foco ativado');
  };
  
  // Alternar tela cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast.error(`Erro ao entrar em tela cheia: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // Calcular porcentagem de HP
  const hpPercentage = characterMaxHP > 0 ? (characterHP / characterMaxHP) * 100 : 0;
  
  // Determinar cor do HP baseado na porcentagem
  const getHPColor = () => {
    if (hpPercentage <= 25) return 'bg-red-500';
    if (hpPercentage <= 50) return 'bg-amber-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="relative">
      {/* Barra de controle do modo de foco */}
      <div className="fixed top-2 right-2 z-50 flex items-center space-x-2">
        <div 
          className="relative" 
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-fantasy-paper/80 border-fantasy-stone/30 hover:bg-fantasy-paper hover:border-fantasy-purple/50"
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <Info className="h-4 w-4 text-fantasy-stone" />
          </Button>
          
          {showTooltip && (
            <div className="absolute right-0 mt-2 w-64 p-3 bg-fantasy-paper border border-fantasy-stone/30 rounded-md shadow-lg z-50">
              <h4 className="font-medievalsharp text-fantasy-purple text-sm mb-2">Modo de Foco</h4>
              <p className="text-xs text-fantasy-stone mb-2">
                Oculta elementos não essenciais da interface para melhorar a imersão durante o jogo.
              </p>
              <p className="text-xs text-fantasy-stone">
                Apenas informações críticas como HP, condições e recursos importantes permanecem visíveis.
              </p>
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-fantasy-paper/80 border-fantasy-stone/30 hover:bg-fantasy-paper hover:border-fantasy-purple/50"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4 text-fantasy-stone" />
          ) : (
            <Maximize className="h-4 w-4 text-fantasy-stone" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className={`h-8 w-8 ${isFocusMode ? 'bg-fantasy-purple text-white' : 'bg-fantasy-paper/80 border-fantasy-stone/30 hover:bg-fantasy-paper hover:border-fantasy-purple/50'}`}
          onClick={toggleFocusMode}
        >
          {isFocusMode ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4 text-fantasy-stone" />
          )}
        </Button>
      </div>
      
      {/* Conteúdo principal */}
      <div className={`transition-all duration-300 ${isFocusMode ? 'focus-mode' : ''}`}>
        {children}
      </div>
      
      {/* Informações críticas (sempre visíveis) */}
      {isFocusMode && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-fantasy-paper/90 border border-fantasy-stone/30 rounded-lg shadow-lg p-3 flex items-center space-x-4">
          {/* HP */}
          <div className="flex flex-col items-center">
            <div className="text-xs text-fantasy-stone mb-1">HP</div>
            <div className="w-32 h-4 bg-fantasy-stone/20 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getHPColor()} transition-all duration-300`}
                style={{ width: `${hpPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-fantasy-stone mt-1">
              {characterHP} / {characterMaxHP}
            </div>
          </div>
          
          {/* Condições ativas */}
          {activeEffects.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="text-xs text-fantasy-stone mb-1">Condições</div>
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {activeEffects.map((effect, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-0.5 text-xs rounded-full bg-fantasy-purple/20 text-fantasy-purple"
                  >
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Recursos importantes */}
          {importantResources.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="text-xs text-fantasy-stone mb-1">Recursos</div>
              <div className="flex flex-wrap gap-2 max-w-[200px]">
                {importantResources.map((resource, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <span className="text-xs text-fantasy-stone">{resource.name}</span>
                    <span className="text-xs font-medium text-fantasy-purple">
                      {resource.current}/{resource.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Estilos CSS para o modo de foco */}
      <style jsx global>{`
        .focus-mode .sidebar,
        .focus-mode .navbar,
        .focus-mode .footer,
        .focus-mode .tabs-container,
        .focus-mode .secondary-panel,
        .focus-mode .chat-panel:not(.active),
        .focus-mode .settings-panel,
        .focus-mode .non-essential {
          opacity: 0;
          visibility: hidden;
          height: 0;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        
        .focus-mode .game-content {
          width: 100%;
          height: 100vh;
          max-width: 100%;
          padding: 0;
          margin: 0;
        }
        
        .focus-mode .map-container {
          width: 100%;
          height: 100vh;
          border: none;
          border-radius: 0;
        }
      `}</style>
    </div>
  );
};

export default FocusMode;