import { Character } from '../character/Character';
import { Tile } from '../map/Tile';

export enum EnvironmentalEffectType {
  WEATHER = 'WEATHER',
  TERRAIN = 'TERRAIN',
  HAZARD = 'HAZARD',
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF'
}

export abstract class EnvironmentalEffect {
  protected id: string;
  protected name: string;
  protected description: string;
  protected type: EnvironmentalEffectType;
  protected duration: number;
  protected intensity: number;
  protected radius: number;
  protected active: boolean;

  constructor(
    id: string,
    name: string,
    description: string,
    type: EnvironmentalEffectType,
    duration: number,
    intensity: number,
    radius: number
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = type;
    this.duration = duration;
    this.intensity = intensity;
    this.radius = radius;
    this.active = true;
  }

  public abstract apply(character: Character, tile: Tile): void;
  public abstract update(deltaTime: number): void;

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getType(): EnvironmentalEffectType {
    return this.type;
  }

  public getDuration(): number {
    return this.duration;
  }

  public getIntensity(): number {
    return this.intensity;
  }

  public getRadius(): number {
    return this.radius;
  }

  public isActive(): boolean {
    return this.active;
  }

  public deactivate(): void {
    this.active = false;
  }

  public setIntensity(intensity: number): void {
    this.intensity = Math.max(0, intensity);
  }

  public modifyIntensity(delta: number): void {
    this.setIntensity(this.intensity + delta);
  }
}