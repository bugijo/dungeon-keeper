import { AIBehavior, AIState } from '../AIBehavior';
import { Character } from '../../character/Character';
import { Map } from '../../map/Map';
import { Quest } from '../../quests/Quest';

export class QuestGiverAI extends AIBehavior {
  private availableQuests: Quest[];
  private interactionRange: number;
  private position: { x: number, y: number };

  constructor(
    character: Character,
    map: Map,
    position: { x: number, y: number },
    interactionRange: number = 2
  ) {
    super(character, map);
    this.position = position;
    this.interactionRange = interactionRange;
    this.availableQuests = [];
  }

  public update(deltaTime: number): void {
    const newState = this.evaluateState();
    this.setState(newState);
    this.executeState(deltaTime);
  }

  protected evaluateState(): AIState {
    if (this.target && this.isInInteractionRange(this.target)) {
      return AIState.INTERACT;
    }

    const position = this.character.getPosition();
    if (position.x !== this.position.x || position.y !== this.position.y) {
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

  public addQuest(quest: Quest): void {
    this.availableQuests.push(quest);
  }

  public removeQuest(questId: string): void {
    this.availableQuests = this.availableQuests.filter(quest => quest.getId() !== questId);
  }

  public getAvailableQuests(): Quest[] {
    return this.availableQuests;
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
    // Comportamento padrão quando está no ponto fixo
    // Pode incluir animações ou outros comportamentos
  }

  private executeInteract(): void {
    if (this.target) {
      const availableQuests = this.getAvailableQuestsForCharacter(this.target);
      if (availableQuests.length > 0) {
        this.character.startDialogue(this.target, 'quest', { quests: availableQuests });
      }
    }
  }

  private executeFollow(): void {
    this.character.moveTo(this.position.x, this.position.y);
  }

  private getAvailableQuestsForCharacter(character: Character): Quest[] {
    return this.availableQuests.filter(quest => {
      // Verificar requisitos da quest
      return quest.canBeStartedBy(character);
    });
  }
}