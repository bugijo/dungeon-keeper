import { AchievementReward } from '../AchievementReward';
import { Player } from '../../character/Player';

export class TitleReward extends AchievementReward {
  private title: string;
  private player: Player;

  constructor(description: string, title: string, player: Player) {
    super(description);
    this.title = title;
    this.player = player;
  }

  public grant(): void {
    this.player.addTitle(this.title);
  }
}