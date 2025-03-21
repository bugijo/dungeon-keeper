import { QuestReward } from '../QuestReward';
import { Player } from '../../character/Player';

export class ExperienceReward extends QuestReward {
  private experience: number;
  private player: Player;

  constructor(description: string, experience: number, player: Player) {
    super(description);
    this.experience = experience;
    this.player = player;
  }

  public grant(): void {
    this.player.addExperience(this.experience);
  }
}