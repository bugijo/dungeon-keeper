export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class SaveValidator {
  public validate(data: string): ValidationResult {
    try {
      const parsedData = JSON.parse(data);
      const errors: string[] = [];

      // Validate version
      if (!parsedData.version) {
        errors.push('Missing game version');
      }

      // Validate character data
      if (!this.validateCharacter(parsedData.character)) {
        errors.push('Invalid character data');
      }

      // Validate inventory
      if (!this.validateInventory(parsedData.inventory)) {
        errors.push('Invalid inventory data');
      }

      // Validate quests
      if (!this.validateQuests(parsedData.quests)) {
        errors.push('Invalid quests data');
      }

      // Validate achievements
      if (!this.validateAchievements(parsedData.achievements)) {
        errors.push('Invalid achievements data');
      }

      // Validate world state
      if (!this.validateWorldState(parsedData.worldState)) {
        errors.push('Invalid world state data');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid JSON format']
      };
    }
  }

  private validateCharacter(character: any): boolean {
    if (!character) return false;

    const requiredFields = ['id', 'name', 'level', 'experience', 'attributes', 'skills'];
    return requiredFields.every(field => character.hasOwnProperty(field));
  }

  private validateInventory(inventory: any): boolean {
    if (!inventory) return false;

    const requiredFields = ['items', 'gold', 'capacity'];
    if (!requiredFields.every(field => inventory.hasOwnProperty(field))) {
      return false;
    }

    // Validate each item in the inventory
    return inventory.items.every((item: any) => {
      const itemFields = ['id', 'type', 'quantity'];
      return itemFields.every(field => item.hasOwnProperty(field));
    });
  }

  private validateQuests(quests: any): boolean {
    if (!Array.isArray(quests)) return false;

    return quests.every(quest => {
      const requiredFields = ['id', 'status', 'progress', 'objectives'];
      return requiredFields.every(field => quest.hasOwnProperty(field));
    });
  }

  private validateAchievements(achievements: any): boolean {
    if (!Array.isArray(achievements)) return false;

    return achievements.every(achievement => {
      const requiredFields = ['id', 'progress', 'completed'];
      return requiredFields.every(field => achievement.hasOwnProperty(field));
    });
  }

  private validateWorldState(worldState: any): boolean {
    if (!worldState) return false;

    // Add specific world state validation logic here
    return true;
  }
}