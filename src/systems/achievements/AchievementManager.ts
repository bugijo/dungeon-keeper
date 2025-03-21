import { Achievement, AchievementCategory, AchievementTier } from './Achievement';
import { EventEmitter } from 'events';

export class AchievementManager {
  private achievements: Map<string, Achievement>;
  private eventEmitter: EventEmitter;

  constructor() {
    this.achievements = new Map();
    this.eventEmitter = new EventEmitter();
  }

  public registerAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.getId(), achievement);
  }

  public getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  public updateProgress(achievementId: string, progress: number): void {
    const achievement = this.getAchievement(achievementId);
    if (achievement) {
      const oldProgress = achievement.getProgress();
      achievement.updateProgress(progress);

      this.eventEmitter.emit('progressUpdated', {
        achievement,
        oldProgress,
        newProgress: achievement.getProgress()
      });

      if (achievement.isCompleted()) {
        this.eventEmitter.emit('achievementCompleted', achievement);
      }
    }
  }

  public getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getVisibleAchievements(): Achievement[] {
    return this.getAllAchievements().filter(a => !a.isHidden());
  }

  public getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.getAllAchievements().filter(a => a.getCategory() === category);
  }

  public getAchievementsByTier(tier: AchievementTier): Achievement[] {
    return this.getAllAchievements().filter(a => a.getTier() === tier);
  }

  public getCompletedAchievements(): Achievement[] {
    return this.getAllAchievements().filter(a => a.isCompleted());
  }

  public getTotalPoints(): number {
    return this.getCompletedAchievements()
      .reduce((total, achievement) => total + achievement.getPoints(), 0);
  }

  public onProgressUpdated(callback: (data: {
    achievement: Achievement,
    oldProgress: number,
    newProgress: number
  }) => void): void {
    this.eventEmitter.on('progressUpdated', callback);
  }

  public onAchievementCompleted(callback: (achievement: Achievement) => void): void {
    this.eventEmitter.on('achievementCompleted', callback);
  }
}