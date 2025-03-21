import { AIBehavior, AIState } from '../AIBehavior';
import { Character } from '../../character/Character';
import { Map } from '../../map/Map';

export class CombatAI extends AIBehavior {
  private aggroRange: number;
  private fleeThreshold: number;
  private lastAttackTime: number;
  private attackCooldown: number;

  constructor(
    character: Character,
    map: Map,
    aggroRange: number = 5,
    fleeThreshold: number = 0.3,
    attackCooldown: number = 1000
  ) {
    super(character, map);
    this.aggroRange = aggroRange;
    this.fleeThreshold = fleeThreshold;
    this.lastAttackTime = 0;
    this.attackCooldown = attackCooldown;
  }

  public update(deltaTime: number): void {
    const newState = this.evaluateState();
    this.setState(newState);
    this.executeState(deltaTime);
  }

  protected evaluateState(): AIState {
    if (!this.target) {
      const nearestEnemy = this.findNearestEnemy();
      if (nearestEnemy) {
        this.setTarget(nearestEnemy);
      } else {
        return AIState.PATROL;
      }
    }

    const healthRatio = this.character.getCurrentHealth() / this.character.getMaxHealth();
    if (healthRatio <= this.fleeThreshold) {
      return AIState.FLEE;
    }

    const distanceToTarget = this.getDistanceToTarget();
    if (distanceToTarget <= 1) {
      return AIState.ATTACK;
    } else if (distanceToTarget <= this.aggroRange) {
      return AIState.CHASE;
    }

    return AIState.PATROL;
  }

  protected executeState(deltaTime: number): void {
    switch (this.currentState) {
      case AIState.PATROL:
        this.executePatrol();
        break;
      case AIState.CHASE:
        this.executeChase();
        break;
      case AIState.ATTACK:
        this.executeAttack();
        break;
      case AIState.FLEE:
        this.executeFlee();
        break;
      default:
        break;
    }
  }

  private findNearestEnemy(): Character | null {
    const position = this.character.getPosition();
    let nearestEnemy: Character | null = null;
    let minDistance = Infinity;

    this.map.getCharacters().forEach(character => {
      if (character !== this.character && this.isEnemy(character)) {
        const distance = this.calculateDistance(position, character.getPosition());
        if (distance < minDistance && distance <= this.aggroRange) {
          minDistance = distance;
          nearestEnemy = character;
        }
      }
    });

    return nearestEnemy;
  }

  private isEnemy(character: Character): boolean {
    // Implementar lógica de facções/relações
    return this.character.getFaction() !== character.getFaction();
  }

  private getDistanceToTarget(): number {
    if (!this.target) return Infinity;

    const position = this.character.getPosition();
    const targetPosition = this.target.getPosition();
    return this.calculateDistance(position, targetPosition);
  }

  private calculateDistance(pos1: { x: number, y: number }, pos2: { x: number, y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private executePatrol(): void {
    // Implementar lógica de patrulha
    const patrolPoints = this.character.getPatrolPoints();
    if (patrolPoints && patrolPoints.length > 0) {
      const currentPoint = patrolPoints[0];
      this.character.moveTo(currentPoint.x, currentPoint.y);
    }
  }

  private executeChase(): void {
    if (this.target) {
      const targetPosition = this.target.getPosition();
      this.character.moveTo(targetPosition.x, targetPosition.y);
    }
  }

  private executeAttack(): void {
    if (this.target && Date.now() - this.lastAttackTime >= this.attackCooldown) {
      this.character.attack(this.target);
      this.lastAttackTime = Date.now();
    }
  }

  private executeFlee(): void {
    if (this.target) {
      const position = this.character.getPosition();
      const targetPosition = this.target.getPosition();

      // Mover na direção oposta ao alvo
      const dx = position.x - targetPosition.x;
      const dy = position.y - targetPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const newX = position.x + (dx / distance) * 2;
      const newY = position.y + (dy / distance) * 2;

      this.character.moveTo(newX, newY);
    }
  }
}