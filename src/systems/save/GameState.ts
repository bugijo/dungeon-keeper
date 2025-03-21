import { Character } from '../character/Character';
import { Quest } from '../quest/Quest';
import { Achievement } from '../achievements/Achievement';

export class GameState {
  private character: Character | null;
  private activeQuests: Quest[];
  private achievements: Achievement[];
  private worldState: Record<string, any>;
  private statistics: Record<string, number>;
  private settings: Record<string, any>;
  private startTime: Date;
  private lastSaveTime: Date | null;

  constructor() {
    this.character = null;
    this.activeQuests = [];
    this.achievements = [];
    this.worldState = {};
    this.statistics = {};
    this.settings = {};
    this.startTime = new Date();
    this.lastSaveTime = null;
  }

  public getCharacter(): Character {
    if (!this.character) {
      throw new Error('Character not initialized');
    }
    return this.character;
  }

  public setCharacter(character: Character): void {
    this.character = character;
  }

  public getActiveQuests(): Quest[] {
    return this.activeQuests;
  }

  public setActiveQuests(quests: Quest[]): void {
    this.activeQuests = quests;
  }

  public getAchievements(): Achievement[] {
    return this.achievements;
  }

  public setAchievements(achievements: Achievement[]): void {
    this.achievements = achievements;
  }

  public getWorldState(): Record<string, any> {
    return this.worldState;
  }

  public setWorldState(state: Record<string, any>): void {
    this.worldState = state;
  }

  public getStatistics(): Record<string, number> {
    return this.statistics;
  }

  public setStatistics(stats: Record<string, number>): void {
    this.statistics = stats;
  }

  public getSettings(): Record<string, any> {
    return this.settings;
  }

  public setSettings(settings: Record<string, any>): void {
    this.settings = settings;
  }

  public getCurrentLocation(): string {
    return this.worldState.currentLocation || 'Unknown';
  }

  public getPlayTime(): number {
    const now = new Date();
    return now.getTime() - this.startTime.getTime();
  }

  public updateLastSaveTime(): void {
    this.lastSaveTime = new Date();
  }

  public getLastSaveTime(): Date | null {
    return this.lastSaveTime;
  }
}