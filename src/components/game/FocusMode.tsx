import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface FocusModeProps {
  children: React.ReactNode;
  className?: string;
  alwaysVisibleContent?: React.ReactNode;
}

/**
 * Componente de Modo de Foco para jogadores
 * Permite ocultar elementos não essenciais da interface durante o jogo
 */
export function FocusMode({
  children,
  className,
  alwaysVisibleContent,
}: FocusModeProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Gerencia o modo de tela cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Erro ao entrar em tela cheia: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Monitora mudanças no estado de tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Conteúdo principal que pode ser ocultado no modo de foco */}
      <div
        className={cn(
          'transition-opacity duration-300',
          isFocusMode ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'
        )}
      >
        {children}
      </div>

      {/* Conteúdo sempre visível (HP, dados críticos, etc) */}
      <div className="relative z-10">
        {alwaysVisibleContent}
      </div>

      {/* Controles do modo de foco */}
      <div className="fixed bottom-4 right-4 flex gap-2 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsFocusMode(!isFocusMode)}
          className="bg-amber-950/80 border-amber-800 hover:bg-amber-900 text-amber-200 rounded-full w-10 h-10"
          title={isFocusMode ? 'Mostrar interface completa' : 'Modo de foco'}
        >
          {isFocusMode ? <Eye size={18} /> : <EyeOff size={18} />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          className="bg-amber-950/80 border-amber-800 hover:bg-amber-900 text-amber-200 rounded-full w-10 h-10"
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </Button>
      </div>
    </div>
  );
}