import { Faction, FactionRelation } from './Faction';
import { EventEmitter } from 'events';

export class FactionManager {
  private factions: Map<string, Faction>;
  private eventEmitter: EventEmitter;

  constructor() {
    this.factions = new Map();
    this.eventEmitter = new EventEmitter();
  }

  public createFaction(id: string, name: string, description: string): Faction {
    const faction = new Faction(id, name, description);
    this.factions.set(id, faction);
    this.eventEmitter.emit('factionCreated', faction);
    return faction;
  }

  public getFaction(id: string): Faction | undefined {
    return this.factions.get(id);
  }

  public setRelation(factionId1: string, factionId2: string, relation: FactionRelation): void {
    const faction1 = this.getFaction(factionId1);
    const faction2 = this.getFaction(factionId2);

    if (faction1 && faction2) {
      faction1.setRelation(factionId2, relation);
      faction2.setRelation(factionId1, relation);
      this.eventEmitter.emit('relationChanged', { faction1, faction2, relation });
    }
  }

  public modifyReputation(factionId: string, characterId: string, delta: number): void {
    const faction = this.getFaction(factionId);
    if (faction) {
      faction.modifyReputation(characterId, delta);
      this.eventEmitter.emit('reputationChanged', {
        faction,
        characterId,
        newReputation: faction.getReputation(characterId)
      });
    }
  }

  public getAllFactions(): Faction[] {
    return Array.from(this.factions.values());
  }

  public onFactionCreated(callback: (faction: Faction) => void): void {
    this.eventEmitter.on('factionCreated', callback);
  }

  public onRelationChanged(callback: (data: {
    faction1: Faction,
    faction2: Faction,
    relation: FactionRelation
  }) => void): void {
    this.eventEmitter.on('relationChanged', callback);
  }

  public onReputationChanged(callback: (data: {
    faction: Faction,
    characterId: string,
    newReputation: number
  }) => void): void {
    this.eventEmitter.on('reputationChanged', callback);
  }
}