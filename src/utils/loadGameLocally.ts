/**
 * Carrega dados do jogo armazenados localmente
 */
import { Game } from '../types/game';

export const loadGameLocally = (gameId: string): Game | null => {
  try {
    // Verificar se o localStorage está disponível
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage não está disponível');
      return null;
    }
    
    // Buscar dados do jogo no localStorage
    const gamesData = localStorage.getItem('dungeon_kreeper_games');
    
    if (!gamesData) {
      return null;
    }
    
    // Converter string JSON para objeto
    const games: Record<string, Game> = JSON.parse(gamesData);
    
    // Retornar o jogo específico se existir
    if (games[gameId]) {
      return games[gameId];
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao carregar jogo localmente:', error);
    return null;
  }
};

/**
 * Carrega todos os jogos armazenados localmente
 */
export const loadAllGamesLocally = (): Game[] => {
  try {
    // Verificar se o localStorage está disponível
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage não está disponível');
      return [];
    }
    
    // Buscar dados dos jogos no localStorage
    const gamesData = localStorage.getItem('dungeon_kreeper_games');
    
    if (!gamesData) {
      return [];
    }
    
    // Converter string JSON para objeto
    const games: Record<string, Game> = JSON.parse(gamesData);
    
    // Retornar array com todos os jogos
    return Object.values(games);
  } catch (error) {
    console.error('Erro ao carregar jogos localmente:', error);
    return [];
  }
};