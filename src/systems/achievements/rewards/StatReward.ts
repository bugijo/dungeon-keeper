import { AchievementReward } from '../AchievementReward';
import { Player } from '../../character/Player';

export class StatReward extends AchievementReward {
  private statName: string;
  private value: number;
  private player: Player;

  constructor(description: string, statName: string, value: number, player: Player) {
    super(description);
    this.statName = statName;
    this.value = value;
    this.player = player;
  }

  public grant(): void {
    this.player.modifyStat(this.statName, this.value);
  }
}