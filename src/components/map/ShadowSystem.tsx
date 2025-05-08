import React, { useEffect, useRef, useState } from 'react';
import { useAutoSave } from '@/hooks/useAutoSave';

interface ShadowSystemProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  mapId: string;
  lightSources: LightSource[];
  obstacles: Obstacle[];
  quality: 'low' | 'medium' | 'high';
  onRender?: () => void;
}

interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
  flickering?: boolean;
  flickerIntensity?: number;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number; // 0 = transparente, 1 = opaco
  type: 'wall' | 'door' | 'window' | 'furniture' | 'water' | 'glass';
}

interface ShadowData {
  mapId: string;
  shadowMap: Uint8ClampedArray;
  width: number;
  height: number;
  timestamp: number;
}

/**
 * Sistema avançado de sombras com suporte a soft shadows e penumbras
 * Implementa o algoritmo PCF (Percentage Closer Filtering) para cálculo de penumbras
 */
const ShadowSystem: React.FC<ShadowSystemProps> = ({
  canvasRef,
  mapId,
  lightSources,
  obstacles,
  quality,
  onRender
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const shadowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const shadowContextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Configurações de qualidade
  const qualitySettings = {
    low: { samples: 4, resolution: 0.5 },
    medium: { samples: 8, resolution: 0.75 },
    high: { samples: 16, resolution: 1.0 }
  };
  
  // Hook para salvar automaticamente o mapa de sombras
  const { saveData } = useAutoSave();
  
  // Inicializar o sistema de sombras
  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;
    
    // Criar canvas de sombras
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = canvasRef.current.width * qualitySettings[quality].resolution;
    shadowCanvas.height = canvasRef.current.height * qualitySettings[quality].resolution;
    shadowCanvasRef.current = shadowCanvas;
    
    // Obter contexto
    const shadowContext = shadowCanvas.getContext('2d', { willReadFrequently: true });
    if (!shadowContext) return;
    shadowContextRef.current = shadowContext;
    
    setIsInitialized(true);
    
    // Carregar dados de sombra salvos anteriormente
    loadShadowData();
    
    return () => {
      // Limpar recursos ao desmontar
      shadowCanvasRef.current = null;
      shadowContextRef.current = null;
    };
  }, [canvasRef, quality]);
  
  // Renderizar sombras quando as fontes de luz ou obstáculos mudarem
  useEffect(() => {
    if (!isInitialized || !shadowContextRef.current) return;
    renderShadows();
  }, [lightSources, obstacles, isInitialized, quality]);
  
  // Carregar dados de sombra salvos
  const loadShadowData = async () => {
    try {
      // Implementar carregamento de dados do Supabase
      // Código para carregar dados de sombra do banco de dados
    } catch (error) {
      console.error('Erro ao carregar dados de sombra:', error);
    }
  };
  
  // Salvar dados de sombra
  const saveShadowData = async () => {
    if (!shadowCanvasRef.current || !shadowContextRef.current) return;
    
    try {
      const imageData = shadowContextRef.current.getImageData(
        0, 0, shadowCanvasRef.current.width, shadowCanvasRef.current.height
      );
      
      const shadowData: ShadowData = {
        mapId,
        shadowMap: imageData.data,
        width: imageData.width,
        height: imageData.height,
        timestamp: Date.now()
      };
      
      // Salvar dados no Supabase
      await saveData('shadow_maps', { id: mapId, data: shadowData });
    } catch (error) {
      console.error('Erro ao salvar dados de sombra:', error);
    }
  };
  
  // Renderizar sombras usando PCF (Percentage Closer Filtering)
  const renderShadows = () => {
    if (!shadowCanvasRef.current || !shadowContextRef.current || !canvasRef.current) return;
    
    const ctx = shadowContextRef.current;
    const canvas = shadowCanvasRef.current;
    const samples = qualitySettings[quality].samples;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Definir cor de fundo (escuridão total)
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Para cada fonte de luz
    lightSources.forEach(light => {
      // Aplicar efeito de flickering se necessário
      let currentIntensity = light.intensity;
      if (light.flickering && light.flickerIntensity) {
        const flickerAmount = Math.random() * light.flickerIntensity - (light.flickerIntensity / 2);
        currentIntensity = Math.max(0.1, Math.min(1.0, light.intensity + flickerAmount));
      }
      
      // Criar gradiente radial para a luz
      const gradient = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, light.radius
      );
      
      // Definir cores do gradiente
      const lightColor = hexToRgba(light.color, currentIntensity);
      gradient.addColorStop(0, lightColor);
      gradient.addColorStop(0.7, hexToRgba(light.color, currentIntensity * 0.7));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      // Desenhar luz base
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Calcular sombras para esta luz
      calculateShadows(ctx, light, obstacles, samples);
    });
    
    // Aplicar sombras ao canvas principal
    applyShadowsToMainCanvas();
    
    // Salvar dados de sombra
    saveShadowData();
    
    // Notificar que a renderização foi concluída
    if (onRender) onRender();
  };
  
  // Calcular sombras para uma fonte de luz usando PCF
  const calculateShadows = (
    ctx: CanvasRenderingContext2D,
    light: LightSource,
    obstacles: Obstacle[],
    samples: number
  ) => {
    // Configurar para desenhar sombras
    ctx.globalCompositeOperation = 'multiply';
    
    // Para cada obstáculo
    obstacles.forEach(obstacle => {
      // Pular objetos totalmente transparentes
      if (obstacle.opacity <= 0) return;
      
      // Calcular pontos do obstáculo
      const points = [
        { x: obstacle.x, y: obstacle.y },
        { x: obstacle.x + obstacle.width, y: obstacle.y },
        { x: obstacle.x + obstacle.width, y: obstacle.y + obstacle.height },
        { x: obstacle.x, y: obstacle.y + obstacle.height }
      ];
      
      // Para cada ponto do obstáculo
      points.forEach((point, i) => {
        const nextPoint = points[(i + 1) % points.length];
        
        // Calcular vetor do ponto para a luz
        const dx = point.x - light.x;
        const dy = point.y - light.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalizar vetor
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calcular pontos de sombra
        const shadowLength = light.radius * 2;
        
        // Aplicar PCF (múltiplas amostras para soft shadows)
        for (let s = 0; s < samples; s++) {
          // Adicionar pequena variação para cada amostra
          const offset = (s / samples) - 0.5;
          const offsetX = -ny * offset * 10; // Perpendicular ao vetor principal
          const offsetY = nx * offset * 10;
          
          // Pontos de origem ajustados
          const ox = point.x + offsetX;
          const oy = point.y + offsetY;
          const nox = nextPoint.x + offsetX;
          const noy = nextPoint.y + offsetY;
          
          // Pontos extremos da sombra
          const shadowPoint1 = {
            x: ox + nx * shadowLength,
            y: oy + ny * shadowLength
          };
          const shadowPoint2 = {
            x: nox + nx * shadowLength,
            y: noy + ny * shadowLength
          };
          
          // Desenhar polígono de sombra
          ctx.fillStyle = `rgba(0, 0, 0, ${obstacle.opacity / samples})`;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(shadowPoint1.x, shadowPoint1.y);
          ctx.lineTo(shadowPoint2.x, shadowPoint2.y);
          ctx.lineTo(nox, noy);
          ctx.closePath();
          ctx.fill();
        }
      });
      
      // Para objetos semi-transparentes (como vidro ou água)
      if (obstacle.opacity < 1) {
        // Aplicar efeito de refração para água ou vidro
        if (obstacle.type === 'water' || obstacle.type === 'glass') {
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = obstacle.type === 'water' ? 'rgba(0, 100, 255, 0.2)' : 'rgba(200, 200, 255, 0.3)';
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          ctx.globalCompositeOperation = 'multiply';
        }
      }
    });
  };
  
  // Aplicar sombras ao canvas principal
  const applyShadowsToMainCanvas = () => {
    if (!shadowCanvasRef.current || !canvasRef.current) return;
    
    const mainCtx = canvasRef.current.getContext('2d');
    if (!mainCtx) return;
    
    // Desenhar o canvas de sombras no canvas principal
    mainCtx.globalCompositeOperation = 'multiply';
    mainCtx.drawImage(
      shadowCanvasRef.current,
      0, 0, shadowCanvasRef.current.width, shadowCanvasRef.current.height,
      0, 0, canvasRef.current.width, canvasRef.current.height
    );
    
    // Restaurar modo de composição
    mainCtx.globalCompositeOperation = 'source-over';
  };
  
  // Utilitário para converter cor hex para rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  return null; // Este componente não renderiza nada diretamente
};

export default ShadowSystem;