/**
 * Utilitários para armazenamento local e sincronização por proximidade
 * para jogos presenciais offline
 */

import { Point, RevealedArea, Obstacle } from './fogOfWarUtils';
import { LightSource } from './lightingUtils';

// Tipos de dados para armazenamento local
export interface LocalGameData {
  id: string;
  name: string;
  lastUpdated: string;
  mapId: string;
  revealedAreas?: RevealedArea[];
  memoryPoints?: Point[];
  lightSources?: LightSource[];
  obstacles?: Obstacle[];
  settings?: GameSettings;
}

export interface GameSettings {
  fogOpacity: number;
  fogColor: string;
  memoryEnabled: boolean;
  memoryOpacity: number;
  memoryColor: string;
  ambientLight: number;
}

export interface SyncPeer {
  id: string;
  name: string;
  isGameMaster: boolean;
  lastSeen: string;
}

// Chaves para armazenamento local
const STORAGE_KEYS = {
  GAMES: 'dungeon_kreeper_games',
  CURRENT_GAME: 'dungeon_kreeper_current_game',
  PEERS: 'dungeon_kreeper_peers',
  USER_PROFILE: 'dungeon_kreeper_user_profile'
};

/**
 * Salva um jogo no armazenamento local
 */
export const saveGameLocally = (gameData: LocalGameData): void => {
  try {
    // Obter jogos existentes
    const existingGamesJson = localStorage.getItem(STORAGE_KEYS.GAMES);
    const existingGames: LocalGameData[] = existingGamesJson ? JSON.parse(existingGamesJson) : [];
    
    // Verificar se o jogo já existe
    const gameIndex = existingGames.findIndex(game => game.id === gameData.id);
    
    if (gameIndex >= 0) {
      // Atualizar jogo existente
      existingGames[gameIndex] = {
        ...existingGames[gameIndex],
        ...gameData,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Adicionar novo jogo
      existingGames.push({
        ...gameData,
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Salvar jogos atualizados
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(existingGames));
    
    // Atualizar jogo atual
    localStorage.setItem(STORAGE_KEYS.CURRENT_GAME, gameData.id);
    
    console.log(`Jogo ${gameData.name} salvo localmente`);
  } catch (error) {
    console.error('Erro ao salvar jogo localmente:', error);
  }
};

/**
 * Carrega um jogo do armazenamento local
 */
export const loadGameLocally = (gameId: string): LocalGameData | null => {
  try {
    const gamesJson = localStorage.getItem(STORAGE_KEYS.GAMES);
    if (!gamesJson) return null;
    
    const games: LocalGameData[] = JSON.parse(gamesJson);
    const game = games.find(g => g.id === gameId);
    
    return game || null;
  } catch (error) {
    console.error('Erro ao carregar jogo localmente:', error);
    return null;
  }
};

/**
 * Carrega o jogo atual do armazenamento local
 */
export const loadCurrentGame = (): LocalGameData | null => {
  try {
    const currentGameId = localStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
    if (!currentGameId) return null;
    
    return loadGameLocally(currentGameId);
  } catch (error) {
    console.error('Erro ao carregar jogo atual:', error);
    return null;
  }
};

/**
 * Lista todos os jogos salvos localmente
 */
export const listLocalGames = (): LocalGameData[] => {
  try {
    const gamesJson = localStorage.getItem(STORAGE_KEYS.GAMES);
    if (!gamesJson) return [];
    
    return JSON.parse(gamesJson);
  } catch (error) {
    console.error('Erro ao listar jogos locais:', error);
    return [];
  }
};

/**
 * Remove um jogo do armazenamento local
 */
export const removeLocalGame = (gameId: string): boolean => {
  try {
    const gamesJson = localStorage.getItem(STORAGE_KEYS.GAMES);
    if (!gamesJson) return false;
    
    const games: LocalGameData[] = JSON.parse(gamesJson);
    const updatedGames = games.filter(game => game.id !== gameId);
    
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(updatedGames));
    
    // Se o jogo removido for o atual, limpar referência
    const currentGameId = localStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
    if (currentGameId === gameId) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_GAME);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao remover jogo local:', error);
    return false;
  }
};

/**
 * Salva apenas os pontos de memória de um jogo
 */
export const saveMemoryPointsLocally = (gameId: string, memoryPoints: Point[]): void => {
  try {
    const game = loadGameLocally(gameId);
    if (!game) return;
    
    saveGameLocally({
      ...game,
      memoryPoints,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao salvar pontos de memória:', error);
  }
};

/**
 * Salva apenas as fontes de luz de um jogo
 */
export const saveLightSourcesLocally = (gameId: string, lightSources: LightSource[]): void => {
  try {
    const game = loadGameLocally(gameId);
    if (!game) return;
    
    saveGameLocally({
      ...game,
      lightSources,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao salvar fontes de luz:', error);
  }
};

/**
 * Salva apenas as configurações de um jogo
 */
export const saveGameSettingsLocally = (gameId: string, settings: GameSettings): void => {
  try {
    const game = loadGameLocally(gameId);
    if (!game) return;
    
    saveGameLocally({
      ...game,
      settings,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
  }
};

// Funções para sincronização por proximidade (usando Web Bluetooth API)

/**
 * Verifica se o dispositivo suporta Bluetooth
 */
export const isBluetoothSupported = (): boolean => {
  return navigator.bluetooth !== undefined;
};

/**
 * Procura por jogadores próximos usando Bluetooth
 */
export const scanForNearbyPlayers = async (): Promise<SyncPeer[]> => {
  if (!isBluetoothSupported()) {
    console.error('Bluetooth não suportado neste dispositivo');
    return [];
  }
  
  try {
    // Implementação simplificada - em um cenário real, seria necessário
    // implementar um protocolo de descoberta e comunicação mais robusto
    console.log('Procurando por jogadores próximos...');
    
    // Simular descoberta de jogadores para demonstração
    const mockPeers: SyncPeer[] = [
      {
        id: 'peer-1',
        name: 'Jogador Próximo 1',
        isGameMaster: false,
        lastSeen: new Date().toISOString()
      },
      {
        id: 'peer-2',
        name: 'Mestre do Jogo',
        isGameMaster: true,
        lastSeen: new Date().toISOString()
      }
    ];
    
    // Salvar peers encontrados
    localStorage.setItem(STORAGE_KEYS.PEERS, JSON.stringify(mockPeers));
    
    return mockPeers;
  } catch (error) {
    console.error('Erro ao procurar jogadores próximos:', error);
    return [];
  }
};

/**
 * Sincroniza dados do jogo com um jogador próximo
 */
export const syncWithNearbyPlayer = async (peerId: string, gameData: LocalGameData): Promise<boolean> => {
  if (!isBluetoothSupported()) {
    console.error('Bluetooth não suportado neste dispositivo');
    return false;
  }
  
  try {
    // Implementação simplificada - em um cenário real, seria necessário
    // implementar um protocolo de sincronização mais robusto
    console.log(`Sincronizando com jogador ${peerId}...`);
    
    // Simular sincronização bem-sucedida
    console.log('Sincronização concluída com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar com jogador próximo:', error);
    return false;
  }
};

/**
 * Exporta dados do jogo para compartilhamento
 */
export const exportGameData = (gameId: string): string => {
  try {
    const game = loadGameLocally(gameId);
    if (!game) return '';
    
    // Converter para string JSON para compartilhamento
    return JSON.stringify(game);
  } catch (error) {
    console.error('Erro ao exportar dados do jogo:', error);
    return '';
  }
};

/**
 * Importa dados do jogo a partir de uma string JSON
 */
export const importGameData = (jsonData: string): LocalGameData | null => {
  try {
    const gameData: LocalGameData = JSON.parse(jsonData);
    
    // Validar dados básicos
    if (!gameData.id || !gameData.name || !gameData.mapId) {
      throw new Error('Dados de jogo inválidos');
    }
    
    // Salvar jogo importado
    saveGameLocally(gameData);
    
    return gameData;
  } catch (error) {
    console.error('Erro ao importar dados do jogo:', error);
    return null;
  }
};