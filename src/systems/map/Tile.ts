import { TileType } from './TileType';

export class Tile {
  private _x: number;
  private _y: number;
  private _type: TileType;
  private _isExplored: boolean;
  private _isVisible: boolean;
  private _decoration: string | null;

  constructor(x: number, y: number, type: TileType) {
    this._x = x;
    this._y = y;
    this._type = type;
    this._isExplored = false;
    this._isVisible = false;
    this._decoration = null;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get type(): TileType {
    return this._type;
  }

  set type(value: TileType) {
    this._type = value;
  }

  get isExplored(): boolean {
    return this._isExplored;
  }

  set isExplored(value: boolean) {
    this._isExplored = value;
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  set isVisible(value: boolean) {
    this._isVisible = value;
  }

  get decoration(): string | null {
    return this._decoration;
  }

  set decoration(value: string | null) {
    this._decoration = value;
  }

  public isWalkable(): boolean {
    return this._type === TileType.FLOOR;
  }

  public isTransparent(): boolean {
    return this._type !== TileType.WALL;
  }

  public toString(): string {
    switch (this._type) {
      case TileType.WALL:
        return '#';
      case TileType.FLOOR:
        return '.';
      case TileType.DECORATION:
        return '*';
      default:
        return ' ';
    }
  }
}