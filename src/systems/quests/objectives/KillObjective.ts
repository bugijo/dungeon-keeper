import { QuestObjective } from '../QuestObjective';

export class KillObjective extends QuestObjective {
  private targetType: string;

  constructor(description: string, targetType: string, required: number) {
    super(description, required);
    this.targetType = targetType;
  }

  public update(data: { type: string }): void {
    if (data.type === this.targetType) {
      this.current++;
      this.checkCompletion();
    }
  }
}