import { AchievementReward } from '../AchievementReward';
import { Item } from '../../inventory/Item';
import { Player } from '../../character/Player';

export class ItemReward extends AchievementReward {
  private item: Item;
  private quantity: number;
  private player: Player;

  constructor(description: string, item: Item, quantity: number, player: Player) {
    super(description);
    this.item = item;
    this.quantity = quantity;
    this.player = player;
  }

  public grant(): void {
    this.player.getInventory().addItem(this.item, this.quantity);
  }
}