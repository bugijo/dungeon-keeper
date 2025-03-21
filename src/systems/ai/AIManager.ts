import { AIBehavior, AIState } from './AIBehavior';
import { Character } from '../character/Character';
import { Map } from '../map/Map';
import { EventEmitter } from 'events';

export class AIManager {
  private behaviors: Map<string, AIBehavior>;
  private map: Map;
  private eventEmitter: EventEmitter;

  constructor(map: Map) {
    this.behaviors = new Map();
    this.map = map;
    this.eventEmitter = new EventEmitter();
  }

  public addBehavior(character: Character, behavior: AIBehavior): void {
    this.behaviors.set(character.getId(), behavior);
    this.setupBehaviorListeners(behavior);
    this.eventEmitter.emit('behaviorAdded', { character, behavior });
  }

  public removeBehavior(characterId: string): void {
    const behavior = this.behaviors.get(characterId);
    if (behavior) {
      this.behaviors.delete(characterId);
      this.eventEmitter.emit('behaviorRemoved', { characterId, behavior });
    }
  }

  public getBehavior(characterId: string): AIBehavior | undefined {
    return this.behaviors.get(characterId);
  }

  public update(deltaTime: number): void {
    this.behaviors.forEach(behavior => {
      behavior.update(deltaTime);
    });
  }

  private setupBehaviorListeners(behavior: AIBehavior): void {
    behavior.onStateChanged(data => {
      this.eventEmitter.emit('stateChanged', { behavior, ...data });
    });

    behavior.onTargetChanged(data => {
      this.eventEmitter.emit('targetChanged', { behavior, ...data });
    });
  }

  public onBehaviorAdded(callback: (data: {
    character: Character,
    behavior: AIBehavior
  }) => void): void {
    this.eventEmitter.on('behaviorAdded', callback);
  }

  public onBehaviorRemoved(callback: (data: {
    characterId: string,
    behavior: AIBehavior
  }) => void): void {
    this.eventEmitter.on('behaviorRemoved', callback);
  }

  public onStateChanged(callback: (data: {
    behavior: AIBehavior,
    oldState: AIState,
    newState: AIState
  }) => void): void {
    this.eventEmitter.on('stateChanged', callback);
  }

  public onTargetChanged(callback: (data: {
    behavior: AIBehavior,
    target: Character | null
  }) => void): void {
    this.eventEmitter.on('targetChanged', callback);
  }
}