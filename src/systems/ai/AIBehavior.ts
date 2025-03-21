import { Character } from '../character/Character';
import { Map } from '../map/Map';
import { EventEmitter } from 'events';

export enum AIState {
  IDLE = 'IDLE',
  PATROL = 'PATROL',
  CHASE = 'CHASE',
  ATTACK = 'ATTACK',
  FLEE = 'FLEE',
  INTERACT = 'INTERACT',
  FOLLOW = 'FOLLOW'
}

export abstract class AIBehavior {
  protected character: Character;
  protected currentState: AIState;
  protected target: Character | null;
  protected map: Map;
  protected eventEmitter: EventEmitter;

  constructor(character: Character, map: Map) {
    this.character = character;
    this.currentState = AIState.IDLE;
    this.target = null;
    this.map = map;
    this.eventEmitter = new EventEmitter();
  }

  public abstract update(deltaTime: number): void;
  protected abstract evaluateState(): AIState;
  protected abstract executeState(deltaTime: number): void;

  public getCurrentState(): AIState {
    return this.currentState;
  }

  public setTarget(target: Character | null): void {
    this.target = target;
    this.eventEmitter.emit('targetChanged', { target });
  }

  public getTarget(): Character | null {
    return this.target;
  }

  protected setState(newState: AIState): void {
    if (this.currentState !== newState) {
      const oldState = this.currentState;
      this.currentState = newState;
      this.eventEmitter.emit('stateChanged', { oldState, newState });
    }
  }

  public onStateChanged(callback: (data: { oldState: AIState, newState: AIState }) => void): void {
    this.eventEmitter.on('stateChanged', callback);
  }

  public onTargetChanged(callback: (data: { target: Character | null }) => void): void {
    this.eventEmitter.on('targetChanged', callback);
  }
}