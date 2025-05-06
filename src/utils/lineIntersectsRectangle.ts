/**
 * Verifica se uma linha intersecta um retângulo
 * Útil para cálculos de linha de visão e detecção de obstáculos
 */
export const LineIntersectsRectangle = (
  x1: number, y1: number, // Ponto inicial da linha
  x2: number, y2: number, // Ponto final da linha
  rectX: number, rectY: number, // Posição do retângulo
  rectWidth: number, rectHeight: number // Dimensões do retângulo
): boolean => {
  // Verificar se algum dos pontos está dentro do retângulo
  if (isPointInRectangle(x1, y1, rectX, rectY, rectWidth, rectHeight) ||
      isPointInRectangle(x2, y2, rectX, rectY, rectWidth, rectHeight)) {
    return true;
  }
  
  // Verificar interseção com cada borda do retângulo
  // Borda superior
  if (lineIntersectsLine(x1, y1, x2, y2, rectX, rectY, rectX + rectWidth, rectY)) {
    return true;
  }
  
  // Borda direita
  if (lineIntersectsLine(x1, y1, x2, y2, rectX + rectWidth, rectY, rectX + rectWidth, rectY + rectHeight)) {
    return true;
  }
  
  // Borda inferior
  if (lineIntersectsLine(x1, y1, x2, y2, rectX, rectY + rectHeight, rectX + rectWidth, rectY + rectHeight)) {
    return true;
  }
  
  // Borda esquerda
  if (lineIntersectsLine(x1, y1, x2, y2, rectX, rectY, rectX, rectY + rectHeight)) {
    return true;
  }
  
  return false;
};

/**
 * Verifica se um ponto está dentro de um retângulo
 */
const isPointInRectangle = (
  x: number, y: number, // Ponto
  rectX: number, rectY: number, // Posição do retângulo
  rectWidth: number, rectHeight: number // Dimensões do retângulo
): boolean => {
  return x >= rectX && x <= rectX + rectWidth && 
         y >= rectY && y <= rectY + rectHeight;
};

/**
 * Verifica se duas linhas se intersectam
 * Baseado no algoritmo de interseção de segmentos de linha
 */
const lineIntersectsLine = (
  x1: number, y1: number, // Primeira linha - ponto inicial
  x2: number, y2: number, // Primeira linha - ponto final
  x3: number, y3: number, // Segunda linha - ponto inicial
  x4: number, y4: number  // Segunda linha - ponto final
): boolean => {
  // Calcular os determinantes
  const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
  
  // Se o denominador for zero, as linhas são paralelas
  if (denominator === 0) {
    return false;
  }
  
  const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
  const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
  
  // Verificar se a interseção ocorre dentro dos segmentos de linha
  return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
};

/**
 * Calcula o ponto de interseção entre duas linhas
 */
export const calculateLineIntersection = (
  x1: number, y1: number, // Primeira linha - ponto inicial
  x2: number, y2: number, // Primeira linha - ponto final
  x3: number, y3: number, // Segunda linha - ponto inicial
  x4: number, y4: number  // Segunda linha - ponto final
): { x: number, y: number } | null => {
  // Calcular os determinantes
  const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
  
  // Se o denominador for zero, as linhas são paralelas
  if (denominator === 0) {
    return null;
  }
  
  const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
  const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
  
  // Verificar se a interseção ocorre dentro dos segmentos de linha
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    const x = x1 + (ua * (x2 - x1));
    const y = y1 + (ua * (y2 - y1));
    return { x, y };
  }
  
  return null;
};