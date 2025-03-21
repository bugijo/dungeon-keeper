import { Character } from '../character/Character';

export abstract class AchievementCondition {
  protected description: string;

  constructor(description: string) {
    this.description = description;
  }

  public abstract check(character: Character): boolean;

  public getDescription(): string {
    return this.description;
  }
}