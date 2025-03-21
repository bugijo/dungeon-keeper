import { Grid } from './Grid';
import { AStar } from './AStar';
import { Node } from './Node';
import { Tile } from '../map/Tile';
import { EventEmitter } from 'events';

export class PathfindingManager {
  private grid: Grid;
  private pathfinder: AStar;
  private eventEmitter: EventEmitter;

  constructor(tiles: Tile[][]) {
    this.grid = new Grid(tiles);
    this.pathfinder = new AStar(this.grid);
    this.eventEmitter = new EventEmitter();
  }

  public findPath(startX: number, startY: number, endX: number, endY: number): Node[] {
    const path = this.pathfinder.findPath(startX, startY, endX, endY);
    this.eventEmitter.emit('pathFound', { startX, startY, endX, endY, path });
    return path;
  }

  public updateGrid(tiles: Tile[][]): void {
    this.grid = new Grid(tiles);
    this.pathfinder = new AStar(this.grid);
    this.eventEmitter.emit('gridUpdated');
  }

  public isWalkable(x: number, y: number): boolean {
    const node = this.grid.getNode(x, y);
    return node ? node.walkable : false;
  }

  public setWalkable(x: number, y: number, walkable: boolean): void {
    const node = this.grid.getNode(x, y);
    if (node) {
      node.walkable = walkable;
      this.eventEmitter.emit('walkabilityChanged', { x, y, walkable });
    }
  }

  public onPathFound(callback: (data: {
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    path: Node[]
  }) => void): void {
    this.eventEmitter.on('pathFound', callback);
  }

  public onGridUpdated(callback: () => void): void {
    this.eventEmitter.on('gridUpdated', callback);
  }

  public onWalkabilityChanged(callback: (data: {
    x: number,
    y: number,
    walkable: boolean
  }) => void): void {
    this.eventEmitter.on('walkabilityChanged', callback);
  }
}