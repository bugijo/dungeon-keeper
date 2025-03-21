import { AchievementCondition } from '../AchievementCondition';
import { Character } from '../../character/Character';

export class KillCountCondition extends AchievementCondition {
  private targetType: string;
  private requiredCount: number;

  constructor(description: string, targetType: string, requiredCount: number) {
    super(description);
    this.targetType = targetType;
    this.requiredCount = requiredCount;
  }

  public check(character: Character): boolean {
    return character.getKillCount(this.targetType) >= this.requiredCount;
  }

  public getTargetType(): string {
    return this.targetType;
  }

  public getRequiredCount(): number {
    return this.requiredCount;
  }
}