import { EnvironmentalEffect, EnvironmentalEffectType } from '../EnvironmentalEffect';
import { Character } from '../../character/Character';
import { Tile } from '../../map/Tile';

export enum TerrainType {
  LAVA = 'LAVA',
  POISON_GAS = 'POISON_GAS',
  HOLY_GROUND = 'HOLY_GROUND',
  CURSED_GROUND = 'CURSED_GROUND',
  HEALING_SPRING = 'HEALING_SPRING'
}

export class TerrainEffect extends EnvironmentalEffect {
  private terrainType: TerrainType;
  private damagePerSecond: number;
  private healingPerSecond: number;

  constructor(
    id: string,
    name: string,
    description: string,
    terrainType: TerrainType,
    duration: number,
    intensity: number,
    radius: number,
    damagePerSecond: number = 0,
    healingPerSecond: number = 0
  ) {
    super(id, name, description, EnvironmentalEffectType.TERRAIN, duration, intensity, radius);
    this.terrainType = terrainType;
    this.damagePerSecond = damagePerSecond;
    this.healingPerSecond = healingPerSecond;
  }

  public apply(character: Character, tile: Tile): void {
    switch (this.terrainType) {
      case TerrainType.LAVA:
        this.applyLavaEffects(character);
        break;
      case TerrainType.POISON_GAS:
        this.applyPoisonGasEffects(character);
        break;
      case TerrainType.HOLY_GROUND:
        this.applyHolyGroundEffects(character);
        break;
      case TerrainType.CURSED_GROUND:
        this.applyCursedGroundEffects(character);
        break;
      case TerrainType.HEALING_SPRING:
        this.applyHealingSpringEffects(character);
        break;
    }
  }

  private applyLavaEffects(character: Character): void {
    character.takeDamage('fire', this.damagePerSecond * this.intensity);
    character.addStatusEffect('burning', this.intensity);
  }

  private applyPoisonGasEffects(character: Character): void {
    character.takeDamage('poison', this.damagePerSecond * this.intensity);
    character.addStatusEffect('poisoned', this.intensity);
  }

  private applyHolyGroundEffects(character: Character): void {
    if (character.isUndead()) {
      character.takeDamage('holy', this.damagePerSecond * this.intensity);
    } else {
      character.heal(this.healingPerSecond * this.intensity);
      character.addStatusEffect('blessed', this.intensity);
    }
  }

  private applyCursedGroundEffects(character: Character): void {
    if (!character.isUndead()) {
      character.takeDamage('dark', this.damagePerSecond * this.intensity);
      character.addStatusEffect('cursed', this.intensity);
    }
  }

  private applyHealingSpringEffects(character: Character): void {
    character.heal(this.healingPerSecond * this.intensity);
    character.removeStatusEffect('poisoned');
    character.removeStatusEffect('cursed');
  }

  public update(deltaTime: number): void {
    this.duration -= deltaTime;
    if (this.duration <= 0) {
      this.deactivate();
    }
  }

  public getTerrainType(): TerrainType {
    return this.terrainType;
  }

  public getDamagePerSecond(): number {
    return this.damagePerSecond;
  }

  public getHealingPerSecond(): number {
    return this.healingPerSecond;
  }
}