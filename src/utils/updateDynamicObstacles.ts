/**
 * Atualiza obstáculos dinâmicos no mapa
 * Útil para objetos que podem se mover ou mudar de tamanho durante o jogo
 */
import { Obstacle } from './fogOfWarUtils';

export const updateDynamicObstacles = (
  obstacles: Obstacle[],
  deltaTime: number = 16.67, // Tempo padrão entre frames (60 FPS)
  gridSize: number = 50
): Obstacle[] => {
  // Filtrar apenas obstáculos dinâmicos
  const dynamicObstacles = obstacles.filter(obs => obs.is_dynamic);
  const staticObstacles = obstacles.filter(obs => !obs.is_dynamic);
  
  // Atualizar cada obstáculo dinâmico
  const updatedDynamicObstacles = dynamicObstacles.map(obstacle => {
    // Clone o obstáculo para não modificar o original
    const updatedObstacle = { ...obstacle };
    
    // Se o obstáculo tiver velocidade, atualize sua posição
    if (updatedObstacle.velocity_x || updatedObstacle.velocity_y) {
      const newX = updatedObstacle.x + (updatedObstacle.velocity_x || 0) * (deltaTime / 1000);
      const newY = updatedObstacle.y + (updatedObstacle.velocity_y || 0) * (deltaTime / 1000);
      
      // Verificar colisões com obstáculos estáticos
      const wouldCollide = checkCollision(
        { ...updatedObstacle, x: newX, y: newY },
        staticObstacles
      );
      
      if (!wouldCollide) {
        updatedObstacle.x = newX;
        updatedObstacle.y = newY;
      } else {
        // Se houver colisão, inverter a direção
        if (updatedObstacle.velocity_x) updatedObstacle.velocity_x *= -1;
        if (updatedObstacle.velocity_y) updatedObstacle.velocity_y *= -1;
      }
    }
    
    // Se o obstáculo tiver animação de tamanho
    if (updatedObstacle.size_animation) {
      const { min_width, max_width, min_height, max_height, speed } = updatedObstacle.size_animation;
      
      // Atualizar largura
      if (min_width !== undefined && max_width !== undefined) {
        // Determinar direção da animação
        if (!updatedObstacle.size_animation.direction_x) {
          updatedObstacle.size_animation.direction_x = 1; // Crescendo
        }
        
        // Atualizar tamanho
        updatedObstacle.width += speed * updatedObstacle.size_animation.direction_x * (deltaTime / 1000);
        
        // Verificar limites
        if (updatedObstacle.width >= max_width) {
          updatedObstacle.width = max_width;
          updatedObstacle.size_animation.direction_x = -1; // Começar a diminuir
        } else if (updatedObstacle.width <= min_width) {
          updatedObstacle.width = min_width;
          updatedObstacle.size_animation.direction_x = 1; // Começar a crescer
        }
      }
      
      // Atualizar altura
      if (min_height !== undefined && max_height !== undefined) {
        // Determinar direção da animação
        if (!updatedObstacle.size_animation.direction_y) {
          updatedObstacle.size_animation.direction_y = 1; // Crescendo
        }
        
        // Atualizar tamanho
        updatedObstacle.height += speed * updatedObstacle.size_animation.direction_y * (deltaTime / 1000);
        
        // Verificar limites
        if (updatedObstacle.height >= max_height) {
          updatedObstacle.height = max_height;
          updatedObstacle.size_animation.direction_y = -1; // Começar a diminuir
        } else if (updatedObstacle.height <= min_height) {
          updatedObstacle.height = min_height;
          updatedObstacle.size_animation.direction_y = 1; // Começar a crescer
        }
      }
    }
    
    return updatedObstacle;
  });
  
  // Combinar obstáculos estáticos e dinâmicos atualizados
  return [...staticObstacles, ...updatedDynamicObstacles];
};

/**
 * Verifica se há colisão entre um obstáculo e uma lista de outros obstáculos
 */
const checkCollision = (
  obstacle: Obstacle,
  otherObstacles: Obstacle[]
): boolean => {
  for (const other of otherObstacles) {
    // Verificar se os retângulos se sobrepõem
    if (obstacle.x < other.x + other.width &&
        obstacle.x + obstacle.width > other.x &&
        obstacle.y < other.y + other.height &&
        obstacle.y + obstacle.height > other.y) {
      return true; // Colisão detectada
    }
  }
  
  return false; // Sem colisão
};