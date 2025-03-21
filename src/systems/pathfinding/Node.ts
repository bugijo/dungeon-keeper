export class Node {
  public x: number;
  public y: number;
  public f: number;
  public g: number;
  public h: number;
  public walkable: boolean;
  public parent: Node | null;

  constructor(x: number, y: number, walkable: boolean) {
    this.x = x;
    this.y = y;
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.walkable = walkable;
    this.parent = null;
  }

  public reset(): void {
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.parent = null;
  }

  public equals(other: Node): boolean {
    return this.x === other.x && this.y === other.y;
  }
}