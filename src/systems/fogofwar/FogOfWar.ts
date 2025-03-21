import { EventEmitter } from 'events';

export enum TileVisibility {
  VISIBLE = 'VISIBLE',
  EXPLORED = 'EXPLORED',
  HIDDEN = 'HIDDEN'
}

export class FogOfWar {
  private width: number;
  private height: number;
  private visibility: TileVisibility[][];
  private eventEmitter: EventEmitter;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.visibility = this.initializeVisibility();
    this.eventEmitter = new EventEmitter();
  }

  private initializeVisibility(): TileVisibility[][] {
    const visibility: TileVisibility[][] = [];
    for (let x = 0; x < this.width; x++) {
      visibility[x] = [];
      for (let y = 0; y < this.height; y++) {
        visibility[x][y] = TileVisibility.HIDDEN;
      }
    }
    return visibility;
  }

  public updateVisibility(x: number, y: number, radius: number, lightPasses: (x: number, y: number) => boolean): void {
    const visibleTiles = this.calculateVisibleTiles(x, y, radius, lightPasses);

    // Marcar tiles anteriormente visíveis como explorados
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        if (this.visibility[i][j] === TileVisibility.VISIBLE) {
          this.visibility[i][j] = TileVisibility.EXPLORED;
        }
      }
    }

    // Atualizar tiles visíveis
    visibleTiles.forEach(tile => {
      const oldVisibility = this.visibility[tile.x][tile.y];
      this.visibility[tile.x][tile.y] = TileVisibility.VISIBLE;

      if (oldVisibility !== TileVisibility.VISIBLE) {
        this.eventEmitter.emit('visibilityChanged', {
          x: tile.x,
          y: tile.y,
          oldVisibility,
          newVisibility: TileVisibility.VISIBLE
        });
      }
    });
  }

  private calculateVisibleTiles(x: number, y: number, radius: number, lightPasses: (x: number, y: number) => boolean): { x: number, y: number }[] {
    const visibleTiles: { x: number, y: number }[] = [];
    const radiusSquared = radius * radius;

    // Calcular octantes
    for (let octant = 0; octant < 8; octant++) {
      this.computeOctant(x, y, radius, octant, radiusSquared, lightPasses, visibleTiles);
    }

    return visibleTiles;
  }

  private computeOctant(x: number, y: number, radius: number, octant: number, radiusSquared: number, lightPasses: (x: number, y: number) => boolean, visibleTiles: { x: number, y: number }[]): void {
    let line = new ShadowLine();
    let fullShadow = false;

    for (let row = 1; row <= radius; row++) {
      // Parar se atingir o limite do mapa
      if (fullShadow) break;

      for (let col = 0; col <= row; col++) {
        let currentX = x;
        let currentY = y;

        switch (octant) {
          case 0: currentX += col; currentY -= row; break;
          case 1: currentX += row; currentY -= col; break;
          case 2: currentX += row; currentY += col; break;
          case 3: currentX += col; currentY += row; break;
          case 4: currentX -= col; currentY += row; break;
          case 5: currentX -= row; currentY += col; break;
          case 6: currentX -= row; currentY -= col; break;
          case 7: currentX -= col; currentY -= row; break;
        }

        // Verificar se está dentro dos limites do mapa
        if (currentX < 0 || currentX >= this.width || currentY < 0 || currentY >= this.height) {
          continue;
        }

        // Calcular distância
        const dx = currentX - x;
        const dy = currentY - y;
        if (dx * dx + dy * dy > radiusSquared) {
          continue;
        }

        // Verificar se o tile está na sombra
        const projection = this.projectTile(row, col);
        if (fullShadow || line.isInShadow(projection)) {
          continue;
        }

        // Adicionar tile visível
        visibleTiles.push({ x: currentX, y: currentY });

        // Se o tile bloqueia luz, adicionar à linha de sombra
        if (!lightPasses(currentX, currentY)) {
          line.add(projection);
          fullShadow = line.isFullShadow();
        }
      }
    }
  }

  private projectTile(row: number, col: number): Shadow {
    const topLeft = col / (row + 2);
    const bottomRight = (col + 1) / (row + 1);
    return new Shadow(topLeft, bottomRight);
  }

  public isVisible(x: number, y: number): boolean {
    return this.isInBounds(x, y) && this.visibility[x][y] === TileVisibility.VISIBLE;
  }

  public isExplored(x: number, y: number): boolean {
    return this.isInBounds(x, y) && this.visibility[x][y] === TileVisibility.EXPLORED;
  }

  public getVisibility(x: number, y: number): TileVisibility {
    return this.isInBounds(x, y) ? this.visibility[x][y] : TileVisibility.HIDDEN;
  }

  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  public onVisibilityChanged(callback: (data: {
    x: number,
    y: number,
    oldVisibility: TileVisibility,
    newVisibility: TileVisibility
  }) => void): void {
    this.eventEmitter.on('visibilityChanged', callback);
  }
}

class Shadow {
  constructor(public start: number, public end: number) {}

  public contains(other: Shadow): boolean {
    return this.start <= other.start && this.end >= other.end;
  }
}

class ShadowLine {
  private shadows: Shadow[];

  constructor() {
    this.shadows = [];
  }

  public isInShadow(projection: Shadow): boolean {
    return this.shadows.some(shadow => shadow.contains(projection));
  }

  public add(shadow: Shadow): void {
    // Encontrar onde inserir a nova sombra
    let index = 0;
    for (; index < this.shadows.length; index++) {
      if (this.shadows[index].start >= shadow.start) break;
    }

    // Nova sombra está contida em uma existente
    if (index > 0 && this.shadows[index - 1].contains(shadow)) return;

    this.shadows.splice(index, 0, shadow);
    this.merge();
  }

  private merge(): void {
    if (this.shadows.length <= 1) return;

    const merged: Shadow[] = [];
    let current = this.shadows[0];

    for (let i = 1; i < this.shadows.length; i++) {
      const next = this.shadows[i];

      if (current.end >= next.start) {
        current = new Shadow(current.start, Math.max(current.end, next.end));
      } else {
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    this.shadows = merged;
  }

  public isFullShadow(): boolean {
    return this.shadows.length === 1 && 
           this.shadows[0].start <= 0 && 
           this.shadows[0].end >= 1;
  }
}