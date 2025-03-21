export enum QuestStatus {
  NOT_STARTED,
  IN_PROGRESS,
  COMPLETED,
  FAILED
}

export class Quest {
  private id: string;
  private title: string;
  private description: string;
  private objectives: QuestObjective[];
  private rewards: QuestReward[];
  private status: QuestStatus;
  private prerequisites: Quest[];
  private nextQuests: Quest[];

  constructor(id: string, title: string, description: string) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.objectives = [];
    this.rewards = [];
    this.status = QuestStatus.NOT_STARTED;
    this.prerequisites = [];
    this.nextQuests = [];
  }

  public addObjective(objective: QuestObjective): void {
    this.objectives.push(objective);
  }

  public addReward(reward: QuestReward): void {
    this.rewards.push(reward);
  }

  public addPrerequisite(quest: Quest): void {
    this.prerequisites.push(quest);
  }

  public addNextQuest(quest: Quest): void {
    this.nextQuests.push(quest);
  }

  public start(): boolean {
    if (!this.canStart()) {
      return false;
    }
    this.status = QuestStatus.IN_PROGRESS;
    return true;
  }

  public complete(): void {
    if (this.canComplete()) {
      this.status = QuestStatus.COMPLETED;
      this.grantRewards();
    }
  }

  public fail(): void {
    this.status = QuestStatus.FAILED;
  }

  private canStart(): boolean {
    return this.prerequisites.every(quest => quest.status === QuestStatus.COMPLETED);
  }

  private canComplete(): boolean {
    return this.objectives.every(objective => objective.isCompleted());
  }

  private grantRewards(): void {
    this.rewards.forEach(reward => reward.grant());
  }

  public getStatus(): QuestStatus {
    return this.status;
  }

  public getProgress(): number {
    if (this.objectives.length === 0) return 0;
    const completed = this.objectives.filter(obj => obj.isCompleted()).length;
    return (completed / this.objectives.length) * 100;
  }
}