import { AIBehavior, AIState } from '../AIBehavior';
import { Character } from '../../character/Character';
import { Map } from '../../map/Map';

export class MerchantAI extends AIBehavior {
  private shopPosition: { x: number, y: number };
  private interactionRange: number;
  private workingHours: { start: number, end: number };

  constructor(
    character: Character,
    map: Map,
    shopPosition: { x: number, y: number },
    interactionRange: number = 2,
    workingHours: { start: number, end: number } = { start: 8, end: 20 }
  ) {
    super(character, map);
    this.shopPosition = shopPosition;
    this.interactionRange = interactionRange;
    this.workingHours = workingHours;
  }

  public update(deltaTime: number): void {
    const newState = this.evaluateState();
    this.setState(newState);
    this.executeState(deltaTime);
  }

  protected evaluateState(): AIState {
    const currentHour = new Date().getHours();
    const isWorkingHours = currentHour >= this.workingHours.start && currentHour < this.workingHours.end;

    if (!isWorkingHours) {
      return AIState.IDLE;
    }

    if (this.target && this.isInInteractionRange(this.target)) {
      return AIState.INTERACT;
    }

    const position = this.character.getPosition();
    if (position.x !== this.shopPosition.x || position.y !== this.shopPosition.y) {
      return AIState.FOLLOW;
    }

    return AIState.IDLE;
  }

  protected executeState(deltaTime: number): void {
    switch (this.currentState) {
      case AIState.IDLE:
        this.executeIdle();
        break;
      case AIState.INTERACT:
        this.executeInteract();
        break;
      case AIState.FOLLOW:
        this.executeFollow();
        break;
      default:
        break;
    }
  }

  private isInInteractionRange(character: Character): boolean {
    const position = this.character.getPosition();
    const targetPosition = character.getPosition();
    const distance = this.calculateDistance(position, targetPosition);
    return distance <= this.interactionRange;
  }

  private calculateDistance(pos1: { x: number, y: number }, pos2: { x: number, y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private executeIdle(): void {
    // Comportamento padrão quando está na loja
    // Pode incluir animações ou outros comportamentos
  }

  private executeInteract(): void {
    if (this.target) {
      this.character.startTrade(this.target);
    }
  }

  private executeFollow(): void {
    this.character.moveTo(this.shopPosition.x, this.shopPosition.y);
  }
}