import { Quest } from '../quests/Quest';
import { FactionManager } from './FactionManager';

export class FactionQuest extends Quest {
  private factionId: string;
  private reputationReward: number;
  private factionManager: FactionManager;

  constructor(
    id: string,
    title: string,
    description: string,
    factionId: string,
    reputationReward: number,
    factionManager: FactionManager
  ) {
    super(id, title, description);
    this.factionId = factionId;
    this.reputationReward = reputationReward;
    this.factionManager = factionManager;
  }

  protected onComplete(characterId: string): void {
    super.onComplete(characterId);
    this.factionManager.modifyReputation(this.factionId, characterId, this.reputationReward);
  }

  public getFactionId(): string {
    return this.factionId;
  }

  public getReputationReward(): number {
    return this.reputationReward;
  }
}