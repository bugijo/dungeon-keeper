export enum FactionRelation {
  ALLIED = 'ALLIED',
  FRIENDLY = 'FRIENDLY',
  NEUTRAL = 'NEUTRAL',
  UNFRIENDLY = 'UNFRIENDLY',
  HOSTILE = 'HOSTILE'
}

export class Faction {
  private id: string;
  private name: string;
  private description: string;
  private relations: Map<string, FactionRelation>;
  private reputation: Map<string, number>;

  constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.relations = new Map();
    this.reputation = new Map();
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

  public setRelation(factionId: string, relation: FactionRelation): void {
    this.relations.set(factionId, relation);
  }

  public getRelation(factionId: string): FactionRelation {
    return this.relations.get(factionId) || FactionRelation.NEUTRAL;
  }

  public setReputation(characterId: string, value: number): void {
    this.reputation.set(characterId, Math.max(-100, Math.min(100, value)));
  }

  public getReputation(characterId: string): number {
    return this.reputation.get(characterId) || 0;
  }

  public modifyReputation(characterId: string, delta: number): void {
    const currentRep = this.getReputation(characterId);
    this.setReputation(characterId, currentRep + delta);
  }

  public getReputationLevel(characterId: string): FactionRelation {
    const rep = this.getReputation(characterId);
    if (rep >= 75) return FactionRelation.ALLIED;
    if (rep >= 25) return FactionRelation.FRIENDLY;
    if (rep >= -25) return FactionRelation.NEUTRAL;
    if (rep >= -75) return FactionRelation.UNFRIENDLY;
    return FactionRelation.HOSTILE;
  }
}