import { Achievement } from './Achievement';
import { EventEmitter } from 'events';

export class AchievementChain {
  private id: string;
  private name: string;
  private description: string;
  private achievements: Achievement[];
  private currentIndex: number;
  private completed: boolean;
  private eventEmitter: EventEmitter;

  constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.achievements = [];
    this.currentIndex = 0;
    this.completed = false;
    this.eventEmitter = new EventEmitter();
  }

  public addAchievement(achievement: Achievement): void {
    this.achievements.push(achievement);
    this.setupAchievementListeners(achievement);
  }

  private setupAchievementListeners(achievement: Achievement): void {
    achievement.onCompleted(() => {
      if (this.achievements.indexOf(achievement) === this.currentIndex) {
        this.progressChain();
      }
    });
  }

  private progressChain(): void {
    this.currentIndex++;
    this.eventEmitter.emit('chainProgressed', {
      chainId: this.id,
      currentIndex: this.currentIndex,
      totalAchievements: this.achievements.length
    });

    if (this.currentIndex >= this.achievements.length) {
      this.completed = true;
      this.eventEmitter.emit('chainCompleted', { chainId: this.id });
    } else {
      this.achievements[this.currentIndex].unlock();
    }
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

  public getAchievements(): Achievement[] {
    return this.achievements;
  }

  public getCurrentAchievement(): Achievement | null {
    return this.currentIndex < this.achievements.length ? this.achievements[this.currentIndex] : null;
  }

  public isCompleted(): boolean {
    return this.completed;
  }

  public getProgress(): number {
    return (this.currentIndex / this.achievements.length) * 100;
  }

  public onChainProgressed(callback: (data: {
    chainId: string,
    currentIndex: number,
    totalAchievements: number
  }) => void): void {
    this.eventEmitter.on('chainProgressed', callback);
  }

  public onChainCompleted(callback: (data: { chainId: string }) => void): void {
    this.eventEmitter.on('chainCompleted', callback);
  }
}