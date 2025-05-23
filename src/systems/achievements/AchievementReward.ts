export abstract class AchievementReward {
  protected description: string;

  constructor(description: string) {
    this.description = description;
  }

  public abstract grant(): void;

  public getDescription(): string {
    return this.description;
  }
}