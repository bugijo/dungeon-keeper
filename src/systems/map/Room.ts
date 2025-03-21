export class Room {
  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;
  private _connections: Room[];

  constructor(x: number, y: number, width: number, height: number) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._connections = [];
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get connections(): Room[] {
    return this._connections;
  }

  public addConnection(room: Room): void {
    if (!this._connections.includes(room)) {
      this._connections.push(room);
    }
  }

  public getCenter(): { x: number; y: number } {
    return {
      x: this._x + Math.floor(this._width / 2),
      y: this._y + Math.floor(this._height / 2)
    };
  }

  public intersects(other: Room): boolean {
    return !(this._x + this._width < other.x ||
             other.x + other.width < this._x ||
             this._y + this._height < other.y ||
             other.y + other.height < this._y);
  }

  public getArea(): number {
    return this._width * this._height;
  }

  public getPerimeter(): number {
    return 2 * (this._width + this._height);
  }

  public containsPoint(x: number, y: number): boolean {
    return x >= this._x && x < this._x + this._width &&
           y >= this._y && y < this._y + this._height;
  }
}