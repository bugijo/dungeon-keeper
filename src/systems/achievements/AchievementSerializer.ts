import { Achievement, AchievementCategory, AchievementTier } from './Achievement';
import { AchievementChain } from './AchievementChain';
import { AchievementCondition } from './AchievementCondition';
import { AchievementReward } from './AchievementReward';

export interface SerializedAchievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  points: number;
  progress: number;
  target: number;
  completed: boolean;
  dateCompleted?: string;
  hidden: boolean;
  conditions: SerializedCondition[];
  rewards: SerializedReward[];
}

export interface SerializedCondition {
  type: string;
  data: any;
}

export interface SerializedReward {
  type: string;
  data: any;
}

export interface SerializedChain {
  id: string;
  name: string;
  description: string;
  achievements: string[];
  currentIndex: number;
  completed: boolean;
}

export class AchievementSerializer {
  public static serializeAchievement(achievement: Achievement): SerializedAchievement {
    return {
      id: achievement.getId(),
      name: achievement.getName(),
      description: achievement.getDescription(),
      category: achievement.getCategory(),
      tier: achievement.getTier(),
      points: achievement.getPoints(),
      progress: achievement.getProgress(),
      target: achievement.getTarget(),
      completed: achievement.isCompleted(),
      dateCompleted: achievement.getDateCompleted()?.toISOString(),
      hidden: achievement.isHidden(),
      conditions: achievement.getConditions().map(condition => this.serializeCondition(condition)),
      rewards: achievement.getRewards().map(reward => this.serializeReward(reward))
    };
  }

  public static deserializeAchievement(data: SerializedAchievement): Achievement {
    const achievement = new Achievement(
      data.id,
      data.name,
      data.description,
      data.category,
      data.tier,
      data.points,
      data.target,
      data.hidden
    );

    if (data.completed) {
      achievement.complete();
    }

    if (data.dateCompleted) {
      achievement.setDateCompleted(new Date(data.dateCompleted));
    }

    data.conditions.forEach(conditionData => {
      const condition = this.deserializeCondition(conditionData);
      if (condition) {
        achievement.addCondition(condition);
      }
    });

    data.rewards.forEach(rewardData => {
      const reward = this.deserializeReward(rewardData);
      if (reward) {
        achievement.addReward(reward);
      }
    });

    return achievement;
  }

  public static serializeChain(chain: AchievementChain): SerializedChain {
    return {
      id: chain.getId(),
      name: chain.getName(),
      description: chain.getDescription(),
      achievements: chain.getAchievements().map(a => a.getId()),
      currentIndex: chain.getCurrentIndex(),
      completed: chain.isCompleted()
    };
  }

  public static deserializeChain(data: SerializedChain, achievements: Map<string, Achievement>): AchievementChain {
    const chain = new AchievementChain(data.id, data.name, data.description);

    data.achievements.forEach(achievementId => {
      const achievement = achievements.get(achievementId);
      if (achievement) {
        chain.addAchievement(achievement);
      }
    });

    if (data.completed) {
      chain.complete();
    }

    return chain;
  }

  private static serializeCondition(condition: AchievementCondition): SerializedCondition {
    return {
      type: condition.constructor.name,
      data: condition.serialize()
    };
  }

  private static deserializeCondition(data: SerializedCondition): AchievementCondition | null {
    // Implementar factory de conditions baseado no tipo
    return null;
  }

  private static serializeReward(reward: AchievementReward): SerializedReward {
    return {
      type: reward.constructor.name,
      data: reward.serialize()
    };
  }

  private static deserializeReward(data: SerializedReward): AchievementReward | null {
    // Implementar factory de rewards baseado no tipo
    return null;
  }
}