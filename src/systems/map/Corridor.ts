export class Corridor {
  private startX: number;
  private startY: number;
  private endX: number;
  private endY: number;

  constructor(startX: number, startY: number, endX: number, endY: number) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
  }

  public getPoints(): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    let x = this.startX;
    let y = this.startY;

    // Primeiro movimento horizontal
    while (x !== this.endX) {
      points.push({ x, y });
      x += x < this.endX ? 1 : -1;
    }

    // Depois movimento vertical
    while (y !== this.endY) {
      points.push({ x, y });
      y += y < this.endY ? 1 : -1;
    }

    // Ponto final
    points.push({ x: this.endX, y: this.endY });

    return points;
  }

  public getLength(): number {
    return Math.abs(this.endX - this.startX) + Math.abs(this.endY - this.startY);
  }

  public intersects(other: Corridor): boolean {
    const thisPoints = new Set(this.getPoints().map(p => `${p.x},${p.y}`));
    return other.getPoints().some(p => thisPoints.has(`${p.x},${p.y}`));
  }

  public getDirection(): string {
    if (Math.abs(this.endX - this.startX) > Math.abs(this.endY - this.startY)) {
      return 'horizontal';
    }
    return 'vertical';
  }
}