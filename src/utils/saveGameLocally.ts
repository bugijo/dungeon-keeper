/**
 * Salva dados do jogo localmente
 */
import { Game } from '../types/game';

export const saveGameLocally = (game: Game): void => {
  try {
    // Verificar se o localStorage está disponível
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage não está disponível');
      return;
    }
    
    // Buscar dados existentes
    const gamesData = localStorage.getItem('dungeon_kreeper_games');
    let games: Record<string, Game> = {};
    
    if (gamesData) {
      games = JSON.parse(gamesData);
    }
    
    // Atualizar ou adicionar o jogo
    games[game.id] = {
      ...game,
      lastUpdated: new Date().toISOString() // Atualizar timestamp
    };
    
    // Salvar de volta no localStorage
    localStorage.setItem('dungeon_kreeper_games', JSON.stringify(games));
    
    console.log(`Jogo ${game.id} salvo localmente`);
  } catch (error) {
    console.error('Erro ao salvar jogo localmente:', error);
  }
};

/**
 * Remove um jogo do armazenamento local
 */
export const removeGameLocally = (gameId: string): void => {
  try {
    // Verificar se o localStorage está disponível
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage não está disponível');
      return;
    }
    
    // Buscar dados existentes
    const gamesData = localStorage.getItem('dungeon_kreeper_games');
    
    if (!gamesData) {
      return;
    }
    
    const games: Record<string, Game> = JSON.parse(gamesData);
    
    // Remover o jogo se existir
    if (games[gameId]) {
      delete games[gameId];
      
      // Salvar de volta no localStorage
      localStorage.setItem('dungeon_kreeper_games', JSON.stringify(games));
      
      console.log(`Jogo ${gameId} removido localmente`);
    }
  } catch (error) {
    console.error('Erro ao remover jogo localmente:', error);
  }
};