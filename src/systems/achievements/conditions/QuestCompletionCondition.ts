import { AchievementCondition } from '../AchievementCondition';
import { Character } from '../../character/Character';

export class QuestCompletionCondition extends AchievementCondition {
  private questId: string;

  constructor(description: string, questId: string) {
    super(description);
    this.questId = questId;
  }

  public check(character: Character): boolean {
    return character.hasCompletedQuest(this.questId);
  }

  public getQuestId(): string {
    return this.questId;
  }
}