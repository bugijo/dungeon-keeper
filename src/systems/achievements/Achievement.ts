export enum AchievementCategory {
  COMBAT = 'COMBAT',
  EXPLORATION = 'EXPLORATION',
  CRAFTING = 'CRAFTING',
  SOCIAL = 'SOCIAL',
  COLLECTION = 'COLLECTION',
  PROGRESSION = 'PROGRESSION'
}

export enum AchievementTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

export class Achievement {
  private id: string;
  private name: string;
  private description: string;
  private category: AchievementCategory;
  private tier: AchievementTier;
  private points: number;
  private progress: number;
  private target: number;
  private completed: boolean;
  private dateCompleted?: Date;
  private hidden: boolean;
  private rewards: AchievementReward[];

  constructor(
    id: string,
    name: string,
    description: string,
    category: AchievementCategory,
    tier: AchievementTier,
    points: number,
    target: number,
    hidden: boolean = false
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.category = category;
    this.tier = tier;
    this.points = points;
    this.progress = 0;
    this.target = target;
    this.completed = false;
    this.hidden = hidden;
    this.rewards = [];
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getCategory(): AchievementCategory {
    return this.category;
  }

  public getTier(): AchievementTier {
    return this.tier;
  }

  public getPoints(): number {
    return this.points;
  }

  public getProgress(): number {
    return this.progress;
  }

  public getTarget(): number {
    return this.target;
  }

  public isCompleted(): boolean {
    return this.completed;
  }

  public getDateCompleted(): Date | undefined {
    return this.dateCompleted;
  }

  public isHidden(): boolean {
    return this.hidden;
  }

  public addReward(reward: AchievementReward): void {
    this.rewards.push(reward);
  }

  public getRewards(): AchievementReward[] {
    return this.rewards;
  }

  public updateProgress(value: number): void {
    if (this.completed) return;

    this.progress = Math.min(this.target, value);
    if (this.progress >= this.target) {
      this.complete();
    }
  }

  private complete(): void {
    this.completed = true;
    this.dateCompleted = new Date();
    this.rewards.forEach(reward => reward.grant());
  }

  public getProgressPercentage(): number {
    return (this.progress / this.target) * 100;
  }
}