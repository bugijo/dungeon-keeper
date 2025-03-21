import { EnvironmentalEffect, EnvironmentalEffectType } from './EnvironmentalEffect';
import { Character } from '../character/Character';
import { Map } from '../map/Map';
import { EventEmitter } from 'events';

export class EnvironmentalEffectManager {
  private effects: Map<string, EnvironmentalEffect>;
  private map: Map;
  private eventEmitter: EventEmitter;

  constructor(map: Map) {
    this.effects = new Map();
    this.map = map;
    this.eventEmitter = new EventEmitter();
  }

  public addEffect(effect: EnvironmentalEffect): void {
    this.effects.set(effect.getId(), effect);
    this.eventEmitter.emit('effectAdded', { effect });
  }

  public removeEffect(effectId: string): void {
    const effect = this.effects.get(effectId);
    if (effect) {
      this.effects.delete(effectId);
      this.eventEmitter.emit('effectRemoved', { effect });
    }
  }

  public getEffect(effectId: string): EnvironmentalEffect | undefined {
    return this.effects.get(effectId);
  }

  public getEffectsByType(type: EnvironmentalEffectType): EnvironmentalEffect[] {
    return Array.from(this.effects.values())
      .filter(effect => effect.getType() === type && effect.isActive());
  }

  public getActiveEffects(): EnvironmentalEffect[] {
    return Array.from(this.effects.values())
      .filter(effect => effect.isActive());
  }

  public update(deltaTime: number): void {
    // Atualizar todos os efeitos ativos
    this.getActiveEffects().forEach(effect => {
      effect.update(deltaTime);

      if (!effect.isActive()) {
        this.removeEffect(effect.getId());
      }
    });

    // Aplicar efeitos a todos os personagens no mapa
    const characters = this.map.getCharacters();
    characters.forEach(character => {
      const position = character.getPosition();
      const tile = this.map.getTile(position.x, position.y);

      this.getActiveEffects().forEach(effect => {
        const distance = this.calculateDistance(position, effect);
        if (distance <= effect.getRadius()) {
          effect.apply(character, tile);
        }
      });
    });
  }

  private calculateDistance(position: { x: number, y: number }, effect: EnvironmentalEffect): number {
    // Implementar cálculo de distância baseado no tipo de efeito
    // Por exemplo, para efeitos circulares:
    const effectCenter = this.map.getEffectCenter(effect.getId());
    const dx = position.x - effectCenter.x;
    const dy = position.y - effectCenter.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public onEffectAdded(callback: (data: { effect: EnvironmentalEffect }) => void): void {
    this.eventEmitter.on('effectAdded', callback);
  }

  public onEffectRemoved(callback: (data: { effect: EnvironmentalEffect }) => void): void {
    this.eventEmitter.on('effectRemoved', callback);
  }

  public onEffectUpdated(callback: (data: { effect: EnvironmentalEffect }) => void): void {
    this.eventEmitter.on('effectUpdated', callback);
  }
}