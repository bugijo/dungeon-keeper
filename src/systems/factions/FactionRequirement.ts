import { Faction, FactionRelation } from './Faction';

export class FactionRequirement {
  private faction: Faction;
  private minReputation: number;
  private requiredRelation: FactionRelation;

  constructor(faction: Faction, minReputation: number, requiredRelation: FactionRelation) {
    this.faction = faction;
    this.minReputation = minReputation;
    this.requiredRelation = requiredRelation;
  }

  public check(characterId: string): boolean {
    const currentReputation = this.faction.getReputation(characterId);
    const currentRelation = this.faction.getReputationLevel(characterId);

    return currentReputation >= this.minReputation &&
           this.isRelationSufficient(currentRelation);
  }

  private isRelationSufficient(currentRelation: FactionRelation): boolean {
    const relationValues = {
      [FactionRelation.HOSTILE]: 0,
      [FactionRelation.UNFRIENDLY]: 1,
      [FactionRelation.NEUTRAL]: 2,
      [FactionRelation.FRIENDLY]: 3,
      [FactionRelation.ALLIED]: 4
    };

    return relationValues[currentRelation] >= relationValues[this.requiredRelation];
  }

  public getFaction(): Faction {
    return this.faction;
  }

  public getMinReputation(): number {
    return this.minReputation;
  }

  public getRequiredRelation(): FactionRelation {
    return this.requiredRelation;
  }
}