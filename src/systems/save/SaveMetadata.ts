export interface SaveMetadata {
  timestamp: string;
  type: 'manual' | 'auto' | 'checkpoint';
  gameVersion: string;
  characterName: string;
  location: string;
  playTime: number;
  screenshot?: string; // Base64 encoded thumbnail
  customData?: Record<string, any>;
}