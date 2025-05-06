/**
 * Tipos para o sistema de fontes de luz
 */

export interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  flickering: boolean;
  castShadows: boolean;
}

export interface LightSourceSettings {
  radius: number;
  color: string;
  intensity: number;
  flickering: boolean;
  castShadows: boolean;
}