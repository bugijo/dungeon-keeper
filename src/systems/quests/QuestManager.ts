import { Quest, QuestStatus } from './Quest';
import { EventEmitter } from 'events';

export class QuestManager {
  private quests: Map<string, Quest>;
  private activeQuests: Set<string>;
  private eventEmitter: EventEmitter;

  constructor() {
    this.quests = new Map();
    this.activeQuests = new Set();
    this.eventEmitter = new EventEmitter();
  }

  public addQuest(quest: Quest): void {
    this.quests.set(quest.getId(), quest);
  }

  public startQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (quest && quest.start()) {
      this.activeQuests.add(questId);
      this.eventEmitter.emit('questStarted', quest);
      return true;
    }
    return false;
  }

  public updateObjectives(data: any): void {
    this.activeQuests.forEach(questId => {
      const quest = this.quests.get(questId);
      if (quest) {
        quest.getObjectives().forEach(objective => {
          objective.update(data);
          if (objective.isCompleted()) {
            this.eventEmitter.emit('objectiveCompleted', { quest, objective });
          }
        });

        if (quest.getStatus() === QuestStatus.COMPLETED) {
          this.activeQuests.delete(questId);
          this.eventEmitter.emit('questCompleted', quest);
        }
      }
    });
  }

  public getActiveQuests(): Quest[] {
    return Array.from(this.activeQuests).map(id => this.quests.get(id)!).filter(Boolean);
  }

  public getAvailableQuests(): Quest[] {
    return Array.from(this.quests.values()).filter(quest => 
      quest.getStatus() === QuestStatus.NOT_STARTED && quest.canStart()
    );
  }

  public onQuestStarted(callback: (quest: Quest) => void): void {
    this.eventEmitter.on('questStarted', callback);
  }

  public onObjectiveCompleted(callback: (data: { quest: Quest, objective: any }) => void): void {
    this.eventEmitter.on('objectiveCompleted', callback);
  }

  public onQuestCompleted(callback: (quest: Quest) => void): void {
    this.eventEmitter.on('questCompleted', callback);
  }
}