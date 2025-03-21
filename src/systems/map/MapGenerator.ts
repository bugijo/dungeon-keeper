import { Tile } from './Tile';
import { Room } from './Room';
import { Corridor } from './Corridor';
import { TileType } from './TileType';

export class MapGenerator {
  private width: number;
  private height: number;
  private tiles: Tile[][];
  private rooms: Room[];
  private corridors: Corridor[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.rooms = [];
    this.corridors = [];
    this.initializeTiles();
  }

  private initializeTiles(): void {
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = new Tile(x, y, TileType.WALL);
      }
    }
  }

  public generateDungeon(minRooms: number, maxRooms: number): void {
    const numRooms = Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;
    
    for (let i = 0; i < numRooms; i++) {
      this.generateRoom();
    }

    this.connectRooms();
    this.addDecorations();
  }

  private generateRoom(): void {
    const minSize = 4;
    const maxSize = 10;
    const width = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const height = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const x = Math.floor(Math.random() * (this.width - width - 2)) + 1;
    const y = Math.floor(Math.random() * (this.height - height - 2)) + 1;

    if (this.canPlaceRoom(x, y, width, height)) {
      const room = new Room(x, y, width, height);
      this.rooms.push(room);
      this.carveRoom(room);
    }
  }

  private canPlaceRoom(x: number, y: number, width: number, height: number): boolean {
    for (let dy = y - 1; dy < y + height + 1; dy++) {
      for (let dx = x - 1; dx < x + width + 1; dx++) {
        if (dx < 0 || dx >= this.width || dy < 0 || dy >= this.height) {
          return false;
        }
        if (this.tiles[dy][dx].type === TileType.FLOOR) {
          return false;
        }
      }
    }
    return true;
  }

  private carveRoom(room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        this.tiles[y][x].type = TileType.FLOOR;
      }
    }
  }

  private connectRooms(): void {
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const roomA = this.rooms[i];
      const roomB = this.rooms[i + 1];
      this.createCorridor(roomA, roomB);
    }
  }

  private createCorridor(roomA: Room, roomB: Room): void {
    const startX = roomA.x + Math.floor(roomA.width / 2);
    const startY = roomA.y + Math.floor(roomA.height / 2);
    const endX = roomB.x + Math.floor(roomB.width / 2);
    const endY = roomB.y + Math.floor(roomB.height / 2);

    const corridor = new Corridor(startX, startY, endX, endY);
    this.corridors.push(corridor);
    this.carveCorridor(corridor);
  }

  private carveCorridor(corridor: Corridor): void {
    const points = corridor.getPoints();
    for (const point of points) {
      if (point.x >= 0 && point.x < this.width && point.y >= 0 && point.y < this.height) {
        this.tiles[point.y][point.x].type = TileType.FLOOR;
      }
    }
  }

  private addDecorations(): void {
    for (const room of this.rooms) {
      this.addRoomDecorations(room);
    }
    this.addCorridorDecorations();
  }

  private addRoomDecorations(room: Room): void {
    // Adiciona elementos decorativos como pilares, móveis, etc
    const numDecorations = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numDecorations; i++) {
      const x = room.x + Math.floor(Math.random() * (room.width - 2)) + 1;
      const y = room.y + Math.floor(Math.random() * (room.height - 2)) + 1;
      
      if (this.tiles[y][x].type === TileType.FLOOR) {
        this.tiles[y][x].type = TileType.DECORATION;
      }
    }
  }

  private addCorridorDecorations(): void {
    // Adiciona elementos decorativos nos corredores como tochas, etc
    for (const corridor of this.corridors) {
      const points = corridor.getPoints();
      for (const point of points) {
        if (Math.random() < 0.1 && this.tiles[point.y][point.x].type === TileType.FLOOR) {
          this.tiles[point.y][point.x].type = TileType.DECORATION;
        }
      }
    }
  }

  public getTiles(): Tile[][] {
    return this.tiles;
  }

  public getRooms(): Room[] {
    return this.rooms;
  }

  public getCorridors(): Corridor[] {
    return this.corridors;
  }
}