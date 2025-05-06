/**
 * Tipos para o sistema de obstáculos
 */

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blocks_vision: boolean;
  blocks_movement: boolean;
  opacity: number;
  is_dynamic: boolean;
  velocity_x?: number;
  velocity_y?: number;
  size_animation?: {
    min_width?: number;
    max_width?: number;
    min_height?: number;
    max_height?: number;
    speed: number;
    direction_x?: number;
    direction_y?: number;
  };
}