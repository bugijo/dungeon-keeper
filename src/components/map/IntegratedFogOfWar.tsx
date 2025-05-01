import React, { useState, useEffect } from 'react';
import FogOfWar from './FogOfWar';
import EnhancedFogOfWarController from './EnhancedFogOfWarController';
import IntegratedDynamicLighting from './IntegratedDynamicLighting';
import { Obstacle } from '@/utils/fogOfWarUtils';

interface RevealedArea {
  id?: string;
  x: number;
  y: number;
  radius: number;
  shape: 'circle' | 'square' | 'polygon';
  points?: { x: number; y: number }[];
  color?: string;
  opacity?: number;
  created_by?: string;
  created_at?: string;
}

interface IntegratedFogOfWarProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  width: number;
  height: number;
  gridSize: number;
  obstacles?: Obstacle[];
}

const IntegratedFogOfWar: React.FC<IntegratedFogOfWarProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  width,
  height,
  gridSize,
  obstacles = []
}) => {
  const [revealedAreas, setRevealedAreas] = useState<RevealedArea[]>([]);
  const [showFog, setShowFog] = useState(true);

  const handleFogUpdate = (areas: RevealedArea[]) => {
    setRevealedAreas(areas);
  };

  const handleToggleFog = (show: boolean) => {
    setShowFog(show);
  };

  return (
    <div className="relative">
      {/* Componente principal de Fog of War */}
      <FogOfWar
        mapId={mapId}
        gameId={gameId}
        userId={userId}
        isGameMaster={isGameMaster}
        width={width}
        height={height}
        gridSize={gridSize}
        onFogUpdate={handleFogUpdate}
      />
      
      {/* Sistema de iluminação dinâmica integrado */}
      <IntegratedDynamicLighting
        mapId={mapId}
        gameId={gameId}
        userId={userId}
        isGameMaster={isGameMaster}
        obstacles={obstacles}
        revealedAreas={revealedAreas}
        onRevealedAreasUpdate={handleFogUpdate}
        width={width}
        height={height}
        gridSize={gridSize}
      />
      
      {/* Controlador avançado para o mestre */}
      <div className="absolute top-2 right-2 z-30">
        <EnhancedFogOfWarController
          mapId={mapId}
          gameId={gameId}
          userId={userId}
          isGameMaster={isGameMaster}
          revealedAreas={revealedAreas}
          onFogUpdate={handleFogUpdate}
          onToggleFog={handleToggleFog}
          showFog={showFog}
          gridSize={gridSize}
          width={width}
          height={height}
        />
      </div>
    </div>
  );
};

export default IntegratedFogOfWar;