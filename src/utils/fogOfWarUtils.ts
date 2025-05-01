/**
 * Utilitários para cálculos e manipulação de Fog of War
 * Versão otimizada com suporte a obstáculos dinâmicos e sincronização em tempo real
 */

export interface Point {
  x: number;
  y: number;
}

export interface RevealedArea {
  id?: string;
  x: number;
  y: number;
  radius: number;
  shape: 'circle' | 'square' | 'polygon';
  points?: Point[];
  color?: string;
  opacity?: number;
  created_by?: string;
  created_at?: string;
  // Campos adicionais para suporte a obstáculos dinâmicos
  is_dynamic?: boolean;
  update_interval?: number; // Intervalo de atualização em ms
  last_updated?: string;
}

export interface Obstacle {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  is_dynamic?: boolean;
  blocks_vision?: boolean;
  blocks_movement?: boolean;
  opacity?: number;
}

/**
 * Atualiza a posição de obstáculos dinâmicos
 */
export const updateDynamicObstacles = (
  obstacles: Obstacle[],
  deltaTime: number,
  movementFunctions?: Map<string, (obstacle: Obstacle, deltaTime: number) => Point>
): Obstacle[] => {
  return obstacles.map(obstacle => {
    if (!obstacle.is_dynamic) return obstacle;
    
    // Se tiver uma função de movimento personalizada para este obstáculo, usá-la
    if (movementFunctions && obstacle.id && movementFunctions.has(obstacle.id)) {
      const moveFn = movementFunctions.get(obstacle.id);
      if (moveFn) {
        const newPosition = moveFn(obstacle, deltaTime);
        return {
          ...obstacle,
          x: newPosition.x,
          y: newPosition.y
        };
      }
    }
    
    // Implementação padrão: sem movimento
    return obstacle;
  });
};

/**
 * Verifica se um ponto está dentro de um obstáculo
 */
export const isPointInObstacle = (point: Point, obstacle: Obstacle): boolean => {
  return (
    point.x >= obstacle.x && 
    point.x <= obstacle.x + obstacle.width &&
    point.y >= obstacle.y && 
    point.y <= obstacle.y + obstacle.height
  );
};

/**
 * Verifica se uma área revelada está bloqueada por obstáculos
 */
export const isRevealedAreaBlockedByObstacles = (
  area: RevealedArea,
  obstacles: Obstacle[]
): boolean => {
  // Filtrar apenas obstáculos que bloqueiam visão
  const visionBlockers = obstacles.filter(obs => obs.blocks_vision !== false);
  
  if (area.shape === 'circle') {
    // Verificar se o centro da área está dentro de algum obstáculo
    const centerBlocked = visionBlockers.some(obs => 
      isPointInObstacle({ x: area.x, y: area.y }, obs)
    );
    
    if (centerBlocked) return true;
    
    // Verificar se há interseção entre o círculo e qualquer obstáculo
    return visionBlockers.some(obs => {
      // Encontrar o ponto mais próximo do centro do círculo no retângulo
      const closestX = Math.max(obs.x, Math.min(area.x, obs.x + obs.width));
      const closestY = Math.max(obs.y, Math.min(area.y, obs.y + obs.height));
      
      // Calcular a distância entre o ponto mais próximo e o centro do círculo
      const distance = calculateDistance(
        { x: area.x, y: area.y },
        { x: closestX, y: closestY }
      );
      
      // Se a distância for menor que o raio, há interseção
      return distance <= area.radius;
    });
  } else if (area.shape === 'polygon' && area.points && area.points.length > 0) {
    // Para polígonos, verificar se algum ponto está dentro de um obstáculo
    return area.points.some(point => 
      visionBlockers.some(obs => isPointInObstacle(point, obs))
    );
  }
  
  return false;
}

/**
 * Calcula a distância entre dois pontos
 */
export const calculateDistance = (point1: Point, point2: Point): number => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
};

/**
 * Verifica se um ponto está dentro de uma área revelada
 */
export const isPointInRevealedArea = (point: Point, area: RevealedArea): boolean => {
  if (area.shape === 'circle') {
    const distance = calculateDistance(point, { x: area.x, y: area.y });
    return distance <= area.radius;
  } else if (area.shape === 'square') {
    return (
      point.x >= area.x - area.radius &&
      point.x <= area.x + area.radius &&
      point.y >= area.y - area.radius &&
      point.y <= area.y + area.radius
    );
  } else if (area.shape === 'polygon' && area.points && area.points.length > 2) {
    return isPointInPolygon(point, area.points);
  }
  return false;
};

/**
 * Verifica se um ponto está dentro de um polígono usando o algoritmo ray-casting
 */
export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const intersect =
      polygon[i].y > point.y !== polygon[j].y > point.y &&
      point.x <
        ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) /
          (polygon[j].y - polygon[i].y) +
          polygon[i].x;
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Verifica se uma linha intersecta um retângulo
 */
export const lineIntersectsRectangle = (
  x1: number, y1: number, // Ponto inicial da linha
  x2: number, y2: number, // Ponto final da linha
  rx: number, ry: number, // Posição do retângulo
  rw: number, rh: number  // Dimensões do retângulo
): boolean => {
  // Verificar se a linha intersecta alguma das 4 bordas do retângulo
  return (
    lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) || // Borda superior
    lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh) || // Borda esquerda
    lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) || // Borda direita
    lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh)    // Borda inferior
  );
};

/**
 * Verifica se duas linhas se intersectam
 */
export const lineIntersectsLine = (
  x1: number, y1: number, // Primeira linha - ponto inicial
  x2: number, y2: number, // Primeira linha - ponto final
  x3: number, y3: number, // Segunda linha - ponto inicial
  x4: number, y4: number  // Segunda linha - ponto final
): boolean => {
  // Calcular os determinantes
  const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (den === 0) return false; // Linhas paralelas

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;

  // Verificar se a interseção está dentro dos segmentos de linha
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
};

/**
 * Calcula o ponto de interseção entre duas linhas
 * Retorna null se as linhas não se intersectam
 */
export const calculateLineIntersection = (
  x1: number, y1: number, // Primeira linha - ponto inicial
  x2: number, y2: number, // Primeira linha - ponto final
  x3: number, y3: number, // Segunda linha - ponto inicial
  x4: number, y4: number  // Segunda linha - ponto final
): Point | null => {
  // Calcular os determinantes
  const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (den === 0) return null; // Linhas paralelas

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;

  // Verificar se a interseção está dentro dos segmentos de linha
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    // Calcular o ponto de interseção
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }

  return null;
};

/**
 * Calcula os pontos ao longo de uma linha usando o algoritmo de Bresenham
 */
export const getPointsOnLine = (x0: number, y0: number, x1: number, y1: number): Point[] => {
  const points: Point[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return points;
};

/**
 * Calcula a área visível a partir de um ponto de origem, considerando obstáculos
 * Implementação otimizada usando raycasting
 */
/**
 * Calcula a área visível a partir de um ponto de origem, considerando obstáculos
 * Implementação otimizada usando raycasting com suporte a cache
 */
export const calculateVisibleArea = (
  origin: Point,
  maxDistance: number,
  obstacles: { x: number; y: number; width: number; height: number }[],
  angleStep: number = 1, // Permite ajustar a precisão do raycasting
  useCache: boolean = true // Permite desativar o cache quando necessário
): Point[] => {
  // Verificar cache primeiro se estiver ativado
  if (useCache) {
    const cacheKey = `${origin.x},${origin.y},${maxDistance},${angleStep},${JSON.stringify(obstacles)}`;
    if (calculationCache.visibleAreas.has(cacheKey)) {
      return calculationCache.visibleAreas.get(cacheKey) || [];
    }
  }
  
  const visiblePoints: Point[] = [];
  const visibleEdges: Point[] = []; // Pontos nas bordas da área visível
  
  // Gerar raios em um círculo ao redor da origem
  for (let angle = 0; angle < 360; angle += angleStep) {
    const radians = (angle * Math.PI) / 180;
    const endX = origin.x + Math.cos(radians) * maxDistance;
    const endY = origin.y + Math.sin(radians) * maxDistance;
    
    let closestIntersection: Point | null = null;
    let closestDistance = maxDistance;
    
    // Verificar interseção com cada obstáculo
    for (const obstacle of obstacles) {
      // Converter obstáculo em 4 linhas (bordas)
      const edges = [
        // Borda superior
        { x1: obstacle.x, y1: obstacle.y, x2: obstacle.x + obstacle.width, y2: obstacle.y },
        // Borda direita
        { x1: obstacle.x + obstacle.width, y1: obstacle.y, x2: obstacle.x + obstacle.width, y2: obstacle.y + obstacle.height },
        // Borda inferior
        { x1: obstacle.x, y1: obstacle.y + obstacle.height, x2: obstacle.x + obstacle.width, y2: obstacle.y + obstacle.height },
        // Borda esquerda
        { x1: obstacle.x, y1: obstacle.y, x2: obstacle.x, y2: obstacle.y + obstacle.height }
      ];
      
      // Verificar interseção com cada borda
      for (const edge of edges) {
        // Calcular interseção entre o raio e a borda
        const intersection = calculateLineIntersection(
          origin.x, origin.y, endX, endY,
          edge.x1, edge.y1, edge.x2, edge.y2
        );
        
        if (intersection) {
          const distance = calculateDistance(origin, intersection);
          
          // Manter apenas a interseção mais próxima
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIntersection = intersection;
          }
        }
      }
    }
    
    // Se encontrou uma interseção, usar esse ponto como limite visível
    if (closestIntersection) {
      visibleEdges.push(closestIntersection);
      
      // Adicionar alguns pontos ao longo do raio até a interseção
      const linePoints = getPointsOnLine(
        origin.x, origin.y, 
        closestIntersection.x, closestIntersection.y
      );
      
      // Adicionar pontos ao longo do raio (exceto o último que já está em visibleEdges)
      for (let i = 0; i < linePoints.length - 1; i++) {
        visiblePoints.push(linePoints[i]);
      }
    } else {
      // Se não houver obstáculo, usar o ponto máximo
      const maxPoint = { x: endX, y: endY };
      visibleEdges.push(maxPoint);
      
      // Adicionar pontos ao longo do raio
      const linePoints = getPointsOnLine(origin.x, origin.y, endX, endY);
      for (const point of linePoints) {
        visiblePoints.push(point);
      }
    }
  }
  
  // Adicionar os pontos de borda à lista de pontos visíveis
  visibleEdges.forEach(edge => visiblePoints.push(edge));
  
  // Armazenar no cache se estiver ativado
  if (useCache) {
    const cacheKey = `${origin.x},${origin.y},${maxDistance},${angleStep},${JSON.stringify(obstacles)}`;
    
    // Limitar o tamanho do cache
    if (calculationCache.visibleAreas.size >= calculationCache.maxCacheSize) {
      const firstKey = calculationCache.visibleAreas.keys().next().value;
      calculationCache.visibleAreas.delete(firstKey);
    }
    
    calculationCache.visibleAreas.set(cacheKey, [...visiblePoints]);
  }
  
  return visiblePoints;
};

/**
 * Converte uma área visível em uma área revelada
 * Útil para transformar o resultado de calculateVisibleArea em uma RevealedArea
 */
export const convertVisibleAreaToRevealed = (
  visiblePoints: Point[],
  origin: Point,
  color: string = 'rgba(0, 0, 0, 0.7)',
  opacity: number = 0.7
): RevealedArea => {
  // Calcular o raio máximo baseado na distância do ponto mais distante
  let maxRadius = 0;
  for (const point of visiblePoints) {
    const distance = calculateDistance(origin, point);
    if (distance > maxRadius) {
      maxRadius = distance;
    }
  }
  
  // Criar área revelada como polígono
  return {
    x: origin.x,
    y: origin.y,
    radius: maxRadius,
    shape: 'polygon',
    points: visiblePoints,
    color,
    opacity,
    is_dynamic: false,
    created_at: new Date().toISOString()
  };
};

/**
 * Mescla áreas reveladas sobrepostas para otimizar o desempenho
 */
// Cache para otimização de desempenho
const calculationCache = {
  visibleAreas: new Map<string, Point[]>(),
  mergedAreas: new Map<string, RevealedArea[]>(),
  maxCacheSize: 50,
  clearCache: () => {
    calculationCache.visibleAreas.clear();
    calculationCache.mergedAreas.clear();
  }
};

/**
 * Mescla áreas reveladas sobrepostas para otimizar o desempenho
 */
export const mergeOverlappingAreas = (areas: RevealedArea[]): RevealedArea[] => {
  // Implementação avançada que combina diferentes tipos de áreas
  
  if (areas.length <= 1) return areas;
  
  // Verificar cache primeiro
  const cacheKey = areas.map(a => `${a.id}-${a.x}-${a.y}-${a.radius}-${a.shape}`).join('|');
  if (calculationCache.mergedAreas.has(cacheKey)) {
    return calculationCache.mergedAreas.get(cacheKey) || [];
  }
  
  const result: RevealedArea[] = [];
  const processed = new Set<string>();
  
  // Primeiro passo: agrupar áreas por tipo
  const circleAreas: RevealedArea[] = [];
  const squareAreas: RevealedArea[] = [];
  const polygonAreas: RevealedArea[] = [];
  
  areas.forEach(area => {
    if (area.shape === 'circle') circleAreas.push(area);
    else if (area.shape === 'square') squareAreas.push(area);
    else if (area.shape === 'polygon') polygonAreas.push(area);
  });
  
  // Mesclar círculos
  for (let i = 0; i < circleAreas.length; i++) {
    if (processed.has(circleAreas[i].id || `circle-${i}`)) continue;
    
    let currentArea = { ...circleAreas[i] };
    processed.add(circleAreas[i].id || `circle-${i}`);
    
    let mergedAny = true;
    while (mergedAny) {
      mergedAny = false;
      
      for (let j = 0; j < circleAreas.length; j++) {
        const areaId = circleAreas[j].id || `circle-${j}`;
        if (processed.has(areaId)) continue;
        
        const distance = calculateDistance(
          { x: currentArea.x, y: currentArea.y },
          { x: circleAreas[j].x, y: circleAreas[j].y }
        );
        
        // Se os círculos se sobrepõem ou estão próximos
        if (distance < currentArea.radius + circleAreas[j].radius + 5) { // +5 para margem de sobreposição
          // Calcular o novo centro e raio para englobar ambos os círculos
          const newCenter: Point = {
            x: (currentArea.x * currentArea.radius + circleAreas[j].x * circleAreas[j].radius) / 
               (currentArea.radius + circleAreas[j].radius),
            y: (currentArea.y * currentArea.radius + circleAreas[j].y * circleAreas[j].radius) / 
               (currentArea.radius + circleAreas[j].radius)
          };
          
          // Calcular o novo raio que engloba ambos os círculos
          const newRadius = Math.max(
            currentArea.radius + calculateDistance(newCenter, { x: currentArea.x, y: currentArea.y }),
            circleAreas[j].radius + calculateDistance(newCenter, { x: circleAreas[j].x, y: circleAreas[j].y })
          );
          
          currentArea = {
            ...currentArea,
            x: newCenter.x,
            y: newCenter.y,
            radius: newRadius,
            // Manter a maior opacidade para melhor visibilidade
            opacity: Math.max(currentArea.opacity || 0.7, circleAreas[j].opacity || 0.7)
          };
          
          processed.add(areaId);
          mergedAny = true;
          break; // Recomeçar o loop após uma mesclagem
        }
      }
    }
    
    result.push(currentArea);
  }
  
  // Mesclar quadrados (lógica simplificada)
  for (let i = 0; i < squareAreas.length; i++) {
    if (processed.has(squareAreas[i].id || `square-${i}`)) continue;
    
    let currentArea = { ...squareAreas[i] };
    processed.add(squareAreas[i].id || `square-${i}`);
    
    for (let j = 0; j < squareAreas.length; j++) {
      const areaId = squareAreas[j].id || `square-${j}`;
      if (processed.has(areaId)) continue;
      
      // Verificar se os quadrados se sobrepõem
      const overlapX = Math.abs(currentArea.x - squareAreas[j].x) <= (currentArea.radius + squareAreas[j].radius);
      const overlapY = Math.abs(currentArea.y - squareAreas[j].y) <= (currentArea.radius + squareAreas[j].radius);
      
      if (overlapX && overlapY) {
        // Calcular os limites do novo quadrado
        const minX = Math.min(currentArea.x - currentArea.radius, squareAreas[j].x - squareAreas[j].radius);
        const maxX = Math.max(currentArea.x + currentArea.radius, squareAreas[j].x + squareAreas[j].radius);
        const minY = Math.min(currentArea.y - currentArea.radius, squareAreas[j].y - squareAreas[j].radius);
        const maxY = Math.max(currentArea.y + currentArea.radius, squareAreas[j].y + squareAreas[j].radius);
        
        // Calcular o novo centro e raio
        const newCenter: Point = {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2
        };
        
        const newRadius = Math.max((maxX - minX) / 2, (maxY - minY) / 2);
        
        currentArea = {
          ...currentArea,
          x: newCenter.x,
          y: newCenter.y,
          radius: newRadius,
          opacity: Math.max(currentArea.opacity || 0.7, squareAreas[j].opacity || 0.7)
        };
        
        processed.add(areaId);
      }
    }
    
    result.push(currentArea);
  }
  
  // Adicionar polígonos não processados
  polygonAreas.forEach(area => {
    if (!processed.has(area.id || '')) {
      result.push(area);
    }
  });
  
  // Armazenar no cache
  if (calculationCache.mergedAreas.size >= calculationCache.maxCacheSize) {
    // Limpar o primeiro item se o cache estiver cheio
    const firstKey = calculationCache.mergedAreas.keys().next().value;
    calculationCache.mergedAreas.delete(firstKey);
  }
  calculationCache.mergedAreas.set(cacheKey, [...result]);
  
  return result;
};

/**
 * Sincroniza áreas reveladas entre jogadores em tempo real
 * @param supabase Cliente Supabase para comunicação em tempo real
 * @param mapId ID do mapa para sincronização
 * @param areas Áreas reveladas a serem sincronizadas
 * @param userId ID do usuário que está enviando a atualização
 */
export const syncRevealedAreas = async (
  supabase: any,
  mapId: string,
  areas: RevealedArea[],
  userId: string
): Promise<boolean> => {
  try {
    // Otimizar áreas antes de sincronizar
    const optimizedAreas = mergeOverlappingAreas(areas);
    
    // Enviar atualização via canal em tempo real
    await supabase
      .channel(`fog-updates-${mapId}`)
      .send({
        type: 'broadcast',
        event: 'fog_update',
        payload: {
          areas: optimizedAreas,
          updated_by: userId,
          timestamp: new Date().toISOString()
        }
      });
    
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar áreas reveladas:', error);
    return false;
  }
};

/**
 * Limpa o cache de cálculos para liberar memória
 */
export const clearFogCalculationCache = (): void => {
  calculationCache.clearCache();
};

/**
 * Otimiza o processamento de áreas reveladas para mapas grandes
 * Divide o mapa em quadrantes para processamento mais eficiente
 */
export const optimizeLargeMapFogProcessing = (
  mapWidth: number,
  mapHeight: number,
  revealedAreas: RevealedArea[],
  quadrantSize: number = 500 // Tamanho padrão do quadrante em pixels
): Map<string, RevealedArea[]> => {
  // Criar mapa de quadrantes
  const quadrants = new Map<string, RevealedArea[]>();
  
  // Calcular número de quadrantes em cada dimensão
  const numQuadrantsX = Math.ceil(mapWidth / quadrantSize);
  const numQuadrantsY = Math.ceil(mapHeight / quadrantSize);
  
  // Inicializar quadrantes vazios
  for (let qx = 0; qx < numQuadrantsX; qx++) {
    for (let qy = 0; qy < numQuadrantsY; qy++) {
      quadrants.set(`${qx},${qy}`, []);
    }
  }
  
  // Distribuir áreas reveladas nos quadrantes apropriados
  revealedAreas.forEach(area => {
    // Determinar quais quadrantes esta área pode afetar
    const affectedQuadrants = new Set<string>();
    
    if (area.shape === 'circle') {
      // Para círculos, verificar todos os quadrantes que podem ser afetados
      const minQX = Math.max(0, Math.floor((area.x - area.radius) / quadrantSize));
      const maxQX = Math.min(numQuadrantsX - 1, Math.floor((area.x + area.radius) / quadrantSize));
      const minQY = Math.max(0, Math.floor((area.y - area.radius) / quadrantSize));
      const maxQY = Math.min(numQuadrantsY - 1, Math.floor((area.y + area.radius) / quadrantSize));
      
      for (let qx = minQX; qx <= maxQX; qx++) {
        for (let qy = minQY; qy <= maxQY; qy++) {
          affectedQuadrants.add(`${qx},${qy}`);
        }
      }
    } else if (area.shape === 'square') {
      // Para quadrados, verificar todos os quadrantes que podem ser afetados
      const minQX = Math.max(0, Math.floor((area.x - area.radius) / quadrantSize));
      const maxQX = Math.min(numQuadrantsX - 1, Math.floor((area.x + area.radius) / quadrantSize));
      const minQY = Math.max(0, Math.floor((area.y - area.radius) / quadrantSize));
      const maxQY = Math.min(numQuadrantsY - 1, Math.floor((area.y + area.radius) / quadrantSize));
      
      for (let qx = minQX; qx <= maxQX; qx++) {
        for (let qy = minQY; qy <= maxQY; qy++) {
          affectedQuadrants.add(`${qx},${qy}`);
        }
      }
    } else if (area.shape === 'polygon' && area.points && area.points.length > 0) {
      // Para polígonos, verificar quadrantes afetados por cada ponto
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      // Encontrar limites do polígono
      area.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
      
      const minQX = Math.max(0, Math.floor(minX / quadrantSize));
      const maxQX = Math.min(numQuadrantsX - 1, Math.floor(maxX / quadrantSize));
      const minQY = Math.max(0, Math.floor(minY / quadrantSize));
      const maxQY = Math.min(numQuadrantsY - 1, Math.floor(maxY / quadrantSize));
      
      for (let qx = minQX; qx <= maxQX; qx++) {
        for (let qy = minQY; qy <= maxQY; qy++) {
          affectedQuadrants.add(`${qx},${qy}`);
        }
      }
    }
    
    // Adicionar a área a todos os quadrantes afetados
    affectedQuadrants.forEach(quadrantKey => {
      const areasInQuadrant = quadrants.get(quadrantKey) || [];
      areasInQuadrant.push(area);
      quadrants.set(quadrantKey, areasInQuadrant);
    });
  });
  
  // Otimizar cada quadrante individualmente
  quadrants.forEach((areas, key) => {
    if (areas.length > 10) { // Só otimizar se houver muitas áreas
      const optimizedAreas = mergeOverlappingAreas(areas);
      quadrants.set(key, optimizedAreas);
    }
  });
  
  return quadrants;
};
  
  return quadrants;
};

/**
 * Verifica se um ponto está visível considerando todas as áreas reveladas
 * Otimizado para usar a estrutura de quadrantes
 */
export const isPointVisible = (
  point: Point,
  quadrants: Map<string, RevealedArea[]>,
  quadrantSize: number
): boolean => {
  // Determinar em qual quadrante o ponto está
  const qx = Math.floor(point.x / quadrantSize);
  const qy = Math.floor(point.y / quadrantSize);
  const key = `${qx},${qy}`;
  
  // Verificar se o quadrante existe
  if (!quadrants.has(key)) return false;
  
  // Verificar se o ponto está em alguma área revelada deste quadrante
  const areas = quadrants.get(key) || [];
  return areas.some(area => isPointInRevealedArea(point, area));
};

/**
 * Renderiza o Fog of War em um canvas de forma otimizada
 * @param ctx Contexto 2D do canvas
 * @param revealedAreas Áreas reveladas a serem renderizadas
 * @param mapWidth Largura do mapa
 * @param mapHeight Altura do mapa
 * @param fogColor Cor da névoa (padrão: preto)
 * @param fogOpacity Opacidade da névoa (0-1)
 * @param useQuadrants Se deve usar otimização por quadrantes
 */
export const renderFogOfWar = (
  ctx: CanvasRenderingContext2D,
  revealedAreas: RevealedArea[],
  mapWidth: number,
  mapHeight: number,
  fogColor: string = '#1a1a1a',
  fogOpacity: number = 0.7,
  useQuadrants: boolean = true
): void => {
  // Limpar o canvas
  ctx.clearRect(0, 0, mapWidth, mapHeight);
  
  // Desenhar o fog base (cobrindo todo o mapa)
  ctx.fillStyle = fogColor;
  ctx.globalAlpha = fogOpacity;
  ctx.fillRect(0, 0, mapWidth, mapHeight);
  
  // Configurar para modo de composição 'destination-out' para criar buracos no fog
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  
  // Otimizar para mapas grandes usando quadrantes
  if (useQuadrants && revealedAreas.length > 20) {
    const quadrantSize = 500; // Tamanho do quadrante em pixels
    const quadrants = optimizeLargeMapFogProcessing(mapWidth, mapHeight, revealedAreas, quadrantSize);
    
    // Renderizar apenas os quadrantes visíveis
    const visibleQuadrantsX = Math.ceil(mapWidth / quadrantSize);
    const visibleQuadrantsY = Math.ceil(mapHeight / quadrantSize);
    
    for (let qx = 0; qx < visibleQuadrantsX; qx++) {
      for (let qy = 0; qy < visibleQuadrantsY; qy++) {
        const key = `${qx},${qy}`;
        const areas = quadrants.get(key) || [];
        
        // Renderizar áreas neste quadrante
        renderRevealedAreas(ctx, areas);
      }
    }
  } else {
    // Para mapas menores, renderizar diretamente
    renderRevealedAreas(ctx, revealedAreas);
  }
  
  // Resetar o modo de composição
  ctx.globalCompositeOperation = 'source-over';
};

/**
 * Função auxiliar para renderizar áreas reveladas
 */
const renderRevealedAreas = (ctx: CanvasRenderingContext2D, areas: RevealedArea[]): void => {
  areas.forEach(area => {
    if (area.shape === 'circle') {
      // Renderizar círculo
      ctx.beginPath();
      ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (area.shape === 'square') {
      // Renderizar quadrado
      ctx.fillRect(
        area.x - area.radius,
        area.y - area.radius,
        area.radius * 2,
        area.radius * 2
      );
    } else if (area.shape === 'polygon' && area.points && area.points.length > 2) {
      // Renderizar polígono
      ctx.beginPath();
      ctx.moveTo(area.points[0].x, area.points[0].y);
      
      for (let i = 1; i < area.points.length; i++) {
        ctx.lineTo(area.points[i].x, area.points[i].y);
      }
      
      ctx.closePath();
      ctx.fill();
    }
  });
};

/**
 * Atualiza áreas dinâmicas baseadas em fontes de luz em movimento
 * @param dynamicAreas Áreas dinâmicas a serem atualizadas
 * @param lightSources Fontes de luz que se movem (ex: tochas, lanternas)
 * @param obstacles Obstáculos que bloqueiam a visão
 */
export const updateDynamicLightSources = (
  dynamicAreas: RevealedArea[],
  lightSources: Array<{id: string, position: Point, radius: number, color?: string}>,
  obstacles: Obstacle[]
): RevealedArea[] => {
  // Atualizar áreas existentes ou criar novas
  const updatedAreas: RevealedArea[] = [];
  
  lightSources.forEach(source => {
    // Procurar área existente para esta fonte de luz
    const existingAreaIndex = dynamicAreas.findIndex(area => 
      area.id === `light-${source.id}`
    );
    
    // Calcular área visível considerando obstáculos
    const visiblePoints = calculateVisibleArea(
      source.position,
      source.radius,
      obstacles,
      2, // Usar um ângulo maior para melhor desempenho
      false // Não usar cache para fontes dinâmicas
    );
    
    // Criar nova área revelada
    const updatedArea: RevealedArea = {
      id: `light-${source.id}`,
      x: source.position.x,
      y: source.position.y,
      radius: source.radius,
      shape: 'polygon',
      points: visiblePoints,
      color: source.color || 'rgba(255, 255, 200, 0.8)',
      opacity: 0.8,
      is_dynamic: true,
      last_updated: new Date().toISOString()
    };
    
    if (existingAreaIndex >= 0) {
      // Substituir área existente
      updatedAreas.push(updatedArea);
    } else {
      // Adicionar nova área
      updatedAreas.push(updatedArea);
    }
  });
  
  // Adicionar áreas dinâmicas que não são fontes de luz
  dynamicAreas.forEach(area => {
    if (!area.id?.startsWith('light-')) {
      updatedAreas.push(area);
    }
  });
  
  return updatedAreas;
};