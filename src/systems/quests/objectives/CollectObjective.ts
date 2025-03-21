import { QuestObjective } from '../QuestObjective';

export class CollectObjective extends QuestObjective {
  private itemId: string;

  constructor(description: string, itemId: string, required: number) {
    super(description, required);
    this.itemId = itemId;
  }

  public update(data: { itemId: string, quantity: number }): void {
    if (data.itemId === this.itemId) {
      this.current = data.quantity;
      this.checkCompletion();
    }
  }
}