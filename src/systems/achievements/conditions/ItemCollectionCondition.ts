import { AchievementCondition } from '../AchievementCondition';
import { Character } from '../../character/Character';

export class ItemCollectionCondition extends AchievementCondition {
  private itemId: string;
  private requiredQuantity: number;

  constructor(description: string, itemId: string, requiredQuantity: number) {
    super(description);
    this.itemId = itemId;
    this.requiredQuantity = requiredQuantity;
  }

  public check(character: Character): boolean {
    return character.getInventory().getItemQuantity(this.itemId) >= this.requiredQuantity;
  }

  public getItemId(): string {
    return this.itemId;
  }

  public getRequiredQuantity(): number {
    return this.requiredQuantity;
  }
}