import { Achievement } from './Achievement';
import { Character } from '../character/Character';
import { EventEmitter } from 'events';

export class AchievementTracker {
  private character: Character;
  private trackedAchievements: Map<string, Achievement>;
  private eventEmitter: EventEmitter;

  constructor(character: Character) {
    this.character = character;
    this.trackedAchievements = new Map();
    this.eventEmitter = new EventEmitter();
  }

  public trackAchievement(achievement: Achievement): void {
    this.trackedAchievements.set(achievement.getId(), achievement);
    this.setupAchievementListeners(achievement);
    this.eventEmitter.emit('achievementTracked', { achievement });
  }

  public untrackAchievement(achievementId: string): void {
    const achievement = this.trackedAchievements.get(achievementId);
    if (achievement) {
      this.trackedAchievements.delete(achievementId);
      this.eventEmitter.emit('achievementUntracked', { achievement });
    }
  }

  private setupAchievementListeners(achievement: Achievement): void {
    achievement.onProgressUpdated(data => {
      this.eventEmitter.emit('progressUpdated', { achievement, ...data });
    });

    achievement.onCompleted(() => {
      this.eventEmitter.emit('achievementCompleted', { achievement });
      this.untrackAchievement(achievement.getId());
    });
  }

  public update(): void {
    this.trackedAchievements.forEach(achievement => {
      achievement.checkConditions(this.character);
    });
  }

  public getTrackedAchievements(): Achievement[] {
    return Array.from(this.trackedAchievements.values());
  }

  public onAchievementTracked(callback: (data: { achievement: Achievement }) => void): void {
    this.eventEmitter.on('achievementTracked', callback);
  }

  public onAchievementUntracked(callback: (data: { achievement: Achievement }) => void): void {
    this.eventEmitter.on('achievementUntracked', callback);
  }

  public onProgressUpdated(callback: (data: {
    achievement: Achievement,
    oldProgress: number,
    newProgress: number
  }) => void): void {
    this.eventEmitter.on('progressUpdated', callback);
  }

  public onAchievementCompleted(callback: (data: { achievement: Achievement }) => void): void {
    this.eventEmitter.on('achievementCompleted', callback);
  }
}