import { EnvironmentalEffect, EnvironmentalEffectType } from '../EnvironmentalEffect';
import { Character } from '../../character/Character';
import { Tile } from '../../map/Tile';

export enum WeatherType {
  RAIN = 'RAIN',
  SNOW = 'SNOW',
  FOG = 'FOG',
  STORM = 'STORM',
  HEAT_WAVE = 'HEAT_WAVE'
}

export class WeatherEffect extends EnvironmentalEffect {
  private weatherType: WeatherType;
  private visionModifier: number;
  private movementModifier: number;

  constructor(
    id: string,
    name: string,
    description: string,
    weatherType: WeatherType,
    duration: number,
    intensity: number,
    radius: number,
    visionModifier: number,
    movementModifier: number
  ) {
    super(id, name, description, EnvironmentalEffectType.WEATHER, duration, intensity, radius);
    this.weatherType = weatherType;
    this.visionModifier = visionModifier;
    this.movementModifier = movementModifier;
  }

  public apply(character: Character, tile: Tile): void {
    // Aplicar modificadores baseados no tipo de clima
    switch (this.weatherType) {
      case WeatherType.RAIN:
        this.applyRainEffects(character, tile);
        break;
      case WeatherType.SNOW:
        this.applySnowEffects(character, tile);
        break;
      case WeatherType.FOG:
        this.applyFogEffects(character, tile);
        break;
      case WeatherType.STORM:
        this.applyStormEffects(character, tile);
        break;
      case WeatherType.HEAT_WAVE:
        this.applyHeatWaveEffects(character, tile);
        break;
    }
  }

  private applyRainEffects(character: Character, tile: Tile): void {
    character.modifyVisionRange(this.visionModifier * this.intensity);
    character.modifyMovementSpeed(this.movementModifier * this.intensity);
    
    if (tile.isOutdoors()) {
      character.addStatusEffect('wet', this.intensity);
    }
  }

  private applySnowEffects(character: Character, tile: Tile): void {
    character.modifyVisionRange(this.visionModifier * this.intensity);
    character.modifyMovementSpeed(this.movementModifier * this.intensity);

    if (tile.isOutdoors()) {
      character.addStatusEffect('cold', this.intensity);
    }
  }

  private applyFogEffects(character: Character, tile: Tile): void {
    character.modifyVisionRange(this.visionModifier * this.intensity);
  }

  private applyStormEffects(character: Character, tile: Tile): void {
    character.modifyVisionRange(this.visionModifier * this.intensity);
    character.modifyMovementSpeed(this.movementModifier * this.intensity);

    if (tile.isOutdoors()) {
      character.addStatusEffect('wet', this.intensity);
      if (Math.random() < 0.1 * this.intensity) {
        character.takeDamage('lightning', 10 * this.intensity);
      }
    }
  }

  private applyHeatWaveEffects(character: Character, tile: Tile): void {
    if (tile.isOutdoors() || !tile.hasShade()) {
      character.addStatusEffect('heat_exhaustion', this.intensity);
      character.modifyStamina(-1 * this.intensity);
    }
  }

  public update(deltaTime: number): void {
    this.duration -= deltaTime;
    if (this.duration <= 0) {
      this.deactivate();
    }

    // Atualizar intensidade baseado no tempo
    if (this.weatherType === WeatherType.STORM) {
      this.intensity = Math.sin(Date.now() / 1000) * 0.5 + 0.5;
    }
  }

  public getWeatherType(): WeatherType {
    return this.weatherType;
  }

  public getVisionModifier(): number {
    return this.visionModifier;
  }

  public getMovementModifier(): number {
    return this.movementModifier;
  }
}