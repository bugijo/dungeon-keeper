export enum MapTheme {
  DUNGEON = 'DUNGEON',
  CAVE = 'CAVE',
  FOREST = 'FOREST',
  CASTLE = 'CASTLE',
  RUINS = 'RUINS',
  TEMPLE = 'TEMPLE'
}

export interface ThemeConfig {
  wallChar: string;
  floorChar: string;
  decorationChars: string[];
  doorChar: string;
  stairsUpChar: string;
  stairsDownChar: string;
  waterChar: string;
  lavaChar: string;
  trapChar: string;
}

export const themeConfigs: Record<MapTheme, ThemeConfig> = {
  [MapTheme.DUNGEON]: {
    wallChar: '#',
    floorChar: '.',
    decorationChars: ['*', '+', '='],
    doorChar: '+',
    stairsUpChar: '<',
    stairsDownChar: '>',
    waterChar: '~',
    lavaChar: '^',
    trapChar: '^'
  },
  [MapTheme.CAVE]: {
    wallChar: '#',
    floorChar: '.',
    decorationChars: ['*', ':', ','],
    doorChar: 'O',
    stairsUpChar: '<',
    stairsDownChar: '>',
    waterChar: '~',
    lavaChar: '^',
    trapChar: '^'
  },
  [MapTheme.FOREST]: {
    wallChar: '♣',
    floorChar: '.',
    decorationChars: ['♠', '♣', '♥'],
    doorChar: '⌂',
    stairsUpChar: '↑',
    stairsDownChar: '↓',
    waterChar: '≈',
    lavaChar: '♨',
    trapChar: '⚔'
  },
  [MapTheme.CASTLE]: {
    wallChar: '█',
    floorChar: '·',
    decorationChars: ['♦', '◊', '○'],
    doorChar: '▒',
    stairsUpChar: '↑',
    stairsDownChar: '↓',
    waterChar: '~',
    lavaChar: '♨',
    trapChar: '†'
  },
  [MapTheme.RUINS]: {
    wallChar: '▓',
    floorChar: '·',
    decorationChars: ['░', '▒', '▓'],
    doorChar: '□',
    stairsUpChar: '↑',
    stairsDownChar: '↓',
    waterChar: '~',
    lavaChar: '♨',
    trapChar: '×'
  },
  [MapTheme.TEMPLE]: {
    wallChar: '┼',
    floorChar: '·',
    decorationChars: ['╬', '╪', '╫'],
    doorChar: '╡',
    stairsUpChar: '↑',
    stairsDownChar: '↓',
    waterChar: '≈',
    lavaChar: '♨',
    trapChar: '†'
  }
};