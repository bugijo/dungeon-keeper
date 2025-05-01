
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, Eye, Lock, Unlock, User } from 'lucide-react';
import { GamePlayer } from '@/types/game';

interface PlayersTabProps {
  players: GamePlayer[];
  sessionId?: string;
  onKickPlayer?: (playerId: string) => void;
  onSendDirectMessage?: (playerId: string) => void;
  onTogglePlayerStatus?: (playerId: string, status: 'ready' | 'busy' | 'away') => void;
}

const PlayerStatus = {
  online: { label: 'Online', color: 'bg-green-500' },
  ready: { label: 'Pronto', color: 'bg-blue-500' },
  busy: { label: 'Ocupado', color: 'bg-yellow-500' },
  away: { label: 'Ausente', color: 'bg-red-500' },
  offline: { label: 'Offline', color: 'bg-gray-500' }
};

const PlayersTab = ({ 
  players, 
  sessionId, 
  onKickPlayer, 
  onSendDirectMessage, 
  onTogglePlayerStatus 
}: PlayersTabProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<GamePlayer | null>(null);
  
  return (
    <div className="fantasy-card p-4">
      <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4">Jogadores na Sessão</h2>
      
      {players.length > 0 ? (
        <div className="space-y-4">
          {players.map((player) => (
            <div key={player.id} className="p-4 bg-fantasy-dark/40 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medievalsharp text-white flex items-center gap-2">
                  {player.name}
                  <span 
                    className={`inline-block w-2 h-2 rounded-full ${player.online ? 'bg-green-500' : 'bg-gray-500'}`} 
                    title={player.online ? 'Online' : 'Offline'}
                  ></span>
                </h3>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <span className="sr-only">Opções</span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-fantasy-dark border-fantasy-purple text-white">
                    <DropdownMenuLabel>Ações do Jogador</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Detalhes do Personagem</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => onSendDirectMessage?.(player.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Mensagem Privada</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-500 hover:text-red-600"
                      onClick={() => {
                        if (onKickPlayer) {
                          onKickPlayer(player.id);
                          toast.success(`${player.name} foi removido da sessão`);
                        }
                      }}
                    >
                      <span>Remover da Sessão</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {player.characterName ? (
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-fantasy-stone">
                      {player.characterName} ({player.characterRace} {player.characterClass})
                    </p>
                    {player.characterLevel && (
                      <Badge 
                        variant="outline" 
                        className="bg-fantasy-purple/20 text-fantasy-purple border-fantasy-purple/40"
                      >
                        Nível {player.characterLevel}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => onTogglePlayerStatus?.(player.id, 'ready')}
                    >
                      <Check size={14} className="mr-1" />
                      Pronto
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => onTogglePlayerStatus?.(player.id, 'busy')}
                    >
                      <Lock size={14} className="mr-1" />
                      Ocupado
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => onTogglePlayerStatus?.(player.id, 'away')}
                    >
                      <Unlock size={14} className="mr-1" />
                      Ausente
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-fantasy-stone">Nenhum personagem selecionado</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-fantasy-stone text-center">Nenhum jogador encontrado nesta mesa</p>
      )}

      <Dialog>
        <DialogTrigger asChild>
          {selectedPlayer && <div className="hidden"></div>}
        </DialogTrigger>
        <DialogContent className="bg-fantasy-dark border-fantasy-purple text-white">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <DialogTitle className="font-medievalsharp text-fantasy-gold">
                  {selectedPlayer.characterName || selectedPlayer.name}
                </DialogTitle>
                <DialogDescription className="text-fantasy-stone">
                  {selectedPlayer.characterName && (
                    <>Jogador: {selectedPlayer.name}</>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 my-4">
                {selectedPlayer.characterName ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-fantasy-stone">Raça</p>
                        <p className="font-medium">{selectedPlayer.characterRace || "Desconhecido"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-fantasy-stone">Classe</p>
                        <p className="font-medium">{selectedPlayer.characterClass || "Desconhecido"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-fantasy-stone">Nível</p>
                        <p className="font-medium">{selectedPlayer.characterLevel || "1"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-fantasy-stone">Status</p>
                        <p className="font-medium">{selectedPlayer.online ? "Online" : "Offline"}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-fantasy-stone">Nenhum personagem selecionado pelo jogador</p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setSelectedPlayer(null)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayersTab;
