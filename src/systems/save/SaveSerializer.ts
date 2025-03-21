import { GameState } from './GameState';
import { Character } from '../character/Character';
import { Inventory } from '../inventory/Inventory';
import { Quest } from '../quest/Quest';
import { Achievement } from '../achievements/Achievement';

export class SaveSerializer {
  public serialize(gameState: GameState): string {
    const serializedData = {
      version: process.env.GAME_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      character: this.serializeCharacter(gameState.getCharacter()),
      inventory: this.serializeInventory(gameState.getCharacter().getInventory()),
      quests: this.serializeQuests(gameState.getActiveQuests()),
      achievements: this.serializeAchievements(gameState.getAchievements()),
      worldState: gameState.getWorldState(),
      statistics: gameState.getStatistics(),
      settings: gameState.getSettings()
    };

    return JSON.stringify(serializedData);
  }

  public deserialize(data: string): GameState {
    const parsedData = JSON.parse(data);
    const gameState = new GameState();

    gameState.setCharacter(this.deserializeCharacter(parsedData.character));
    gameState.getCharacter().setInventory(this.deserializeInventory(parsedData.inventory));
    gameState.setActiveQuests(this.deserializeQuests(parsedData.quests));
    gameState.setAchievements(this.deserializeAchievements(parsedData.achievements));
    gameState.setWorldState(parsedData.worldState);
    gameState.setStatistics(parsedData.statistics);
    gameState.setSettings(parsedData.settings);

    return gameState;
  }

  private serializeCharacter(character: Character): any {
    return {
      id: character.getId(),
      name: character.getName(),
      level: character.getLevel(),
      experience: character.getExperience(),
      attributes: character.getAttributes(),
      skills: character.getSkills(),
      status: character.getStatus(),
      position: character.getPosition(),
      statistics: character.getStatistics()
    };
  }

  private deserializeCharacter(data: any): Character {
    const character = new Character(data.id, data.name);
    character.setLevel(data.level);
    character.setExperience(data.experience);
    character.setAttributes(data.attributes);
    character.setSkills(data.skills);
    character.setStatus(data.status);
    character.setPosition(data.position);
    character.setStatistics(data.statistics);
    return character;
  }

  private serializeInventory(inventory: Inventory): any {
    return {
      items: inventory.getItems().map(item => ({
        id: item.getId(),
        type: item.getType(),
        quantity: item.getQuantity(),
        properties: item.getProperties()
      })),
      gold: inventory.getGold(),
      capacity: inventory.getCapacity()
    };
  }

  private deserializeInventory(data: any): Inventory {
    const inventory = new Inventory(data.capacity);
    inventory.setGold(data.gold);
    data.items.forEach((itemData: any) => {
      inventory.addItem(itemData.id, itemData.quantity, itemData.properties);
    });
    return inventory;
  }

  private serializeQuests(quests: Quest[]): any[] {
    return quests.map(quest => ({
      id: quest.getId(),
      status: quest.getStatus(),
      progress: quest.getProgress(),
      objectives: quest.getObjectives(),
      rewards: quest.getRewards(),
      timeStarted: quest.getTimeStarted()?.toISOString(),
      timeCompleted: quest.getTimeCompleted()?.toISOString()
    }));
  }

  private deserializeQuests(data: any[]): Quest[] {
    return data.map(questData => {
      const quest = new Quest(questData.id);
      quest.setStatus(questData.status);
      quest.setProgress(questData.progress);
      quest.setObjectives(questData.objectives);
      quest.setRewards(questData.rewards);
      if (questData.timeStarted) quest.setTimeStarted(new Date(questData.timeStarted));
      if (questData.timeCompleted) quest.setTimeCompleted(new Date(questData.timeCompleted));
      return quest;
    });
  }

  private serializeAchievements(achievements: Achievement[]): any[] {
    return achievements.map(achievement => ({
      id: achievement.getId(),
      progress: achievement.getProgress(),
      completed: achievement.isCompleted(),
      dateCompleted: achievement.getDateCompleted()?.toISOString(),
      conditions: achievement.getConditions(),
      rewards: achievement.getRewards()
    }));
  }

  private deserializeAchievements(data: any[]): Achievement[] {
    return data.map(achievementData => {
      const achievement = new Achievement(achievementData.id);
      achievement.setProgress(achievementData.progress);
      if (achievementData.completed) achievement.complete();
      if (achievementData.dateCompleted) {
        achievement.setDateCompleted(new Date(achievementData.dateCompleted));
      }
      achievement.setConditions(achievementData.conditions);
      achievement.setRewards(achievementData.rewards);
      return achievement;
    });
  }
}