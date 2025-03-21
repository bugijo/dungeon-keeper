import { FogOfWar, TileVisibility } from './FogOfWar';
import { Character } from '../character/Character';
import { Map } from '../map/Map';
import { EventEmitter } from 'events';

export class FogOfWarManager {
  private fogOfWar: FogOfWar;
  private map: Map;
  private characters: Character[];
  private eventEmitter: EventEmitter;

  constructor(map: Map) {
    this.map = map;
    this.fogOfWar = new FogOfWar(map.getWidth(), map.getHeight());
    this.characters = [];
    this.eventEmitter = new EventEmitter();

    this.setupFogOfWarListeners();
  }

  private setupFogOfWarListeners(): void {
    this.fogOfWar.onVisibilityChanged(data => {
      this.eventEmitter.emit('visibilityChanged', data);
    });
  }

  public addCharacter(character: Character): void {
    this.characters.push(character);
    this.updateVisibility();
  }

  public removeCharacter(character: Character): void {
    const index = this.characters.indexOf(character);
    if (index !== -1) {
      this.characters.splice(index, 1);
      this.updateVisibility();
    }
  }

  public updateVisibility(): void {
    this.characters.forEach(character => {
      const position = character.getPosition();
      const visionRadius = character.getVisionRadius();

      this.fogOfWar.updateVisibility(
        position.x,
        position.y,
        visionRadius,
        (x, y) => this.map.isTransparent(x, y)
      );
    });
  }

  public isVisible(x: number, y: number): boolean {
    return this.fogOfWar.isVisible(x, y);
  }

  public isExplored(x: number, y: number): boolean {
    return this.fogOfWar.isExplored(x, y);
  }

  public getVisibility(x: number, y: number): TileVisibility {
    return this.fogOfWar.getVisibility(x, y);
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