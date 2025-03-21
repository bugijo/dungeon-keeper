import { Node } from './Node';
import { Tile } from '../map/Tile';

export class Grid {
  private nodes: Node[][];
  private width: number;
  private height: number;

  constructor(tiles: Tile[][]) {
    this.width = tiles.length;
    this.height = tiles[0].length;
    this.nodes = this.initializeNodes(tiles);
  }

  private initializeNodes(tiles: Tile[][]): Node[][] {
    const nodes: Node[][] = [];

    for (let x = 0; x < this.width; x++) {
      nodes[x] = [];
      for (let y = 0; y < this.height; y++) {
        nodes[x][y] = new Node(x, y, tiles[x][y].isWalkable());
      }
    }

    return nodes;
  }

  public getNode(x: number, y: number): Node | null {
    if (this.isInBounds(x, y)) {
      return this.nodes[x][y];
    }
    return null;
  }

  public getNeighbors(node: Node): Node[] {
    const neighbors: Node[] = [];
    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // Ortogonal
      [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonal
    ];

    for (const [dx, dy] of dirs) {
      const x = node.x + dx;
      const y = node.y + dy;

      if (this.isInBounds(x, y)) {
        const neighbor = this.nodes[x][y];
        if (neighbor.walkable) {
          // Para movimentos diagonais, verificar se os nós adjacentes são walkable
          if (dx !== 0 && dy !== 0) {
            const node1 = this.nodes[node.x][node.y + dy];
            const node2 = this.nodes[node.x + dx][node.y];
            if (node1.walkable && node2.walkable) {
              neighbors.push(neighbor);
            }
          } else {
            neighbors.push(neighbor);
          }
        }
      }
    }

    return neighbors;
  }

  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  public resetNodes(): void {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.nodes[x][y].reset();
      }
    }
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }
}