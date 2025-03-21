from typing import Dict, Set
from enum import Enum, auto
from ..character.character import Character

class DamageType(Enum):
    SLASHING = auto()
    PIERCING = auto()
    BLUDGEONING = auto()
    FIRE = auto()
    COLD = auto()
    LIGHTNING = auto()
    ACID = auto()
    POISON = auto()
    NECROTIC = auto()
    RADIANT = auto()
    FORCE = auto()
    PSYCHIC = auto()

class ResistanceType(Enum):
    NORMAL = auto()
    RESISTANT = auto()
    VULNERABLE = auto()
    IMMUNE = auto()

class DamageTypeManager:
    def __init__(self):
        self.resistances: Dict[Character, Dict[DamageType, ResistanceType]] = {}
        
    def set_resistance(self, character: Character, damage_type: DamageType, resistance_type: ResistanceType) -> None:
        """Define a resistência de um personagem a um tipo de dano."""
        if character not in self.resistances:
            self.resistances[character] = {}
        self.resistances[character][damage_type] = resistance_type
        
    def get_resistance(self, character: Character, damage_type: DamageType) -> ResistanceType:
        """Retorna o tipo de resistência de um personagem a um tipo de dano."""
        if character in self.resistances and damage_type in self.resistances[character]:
            return self.resistances[character][damage_type]
        return ResistanceType.NORMAL
        
    def calculate_damage(self, base_damage: int, damage_type: DamageType, target: Character) -> int:
        """Calcula o dano final baseado nas resistências do alvo."""
        resistance = self.get_resistance(target, damage_type)
        
        if resistance == ResistanceType.RESISTANT:
            return max(1, base_damage // 2)
        elif resistance == ResistanceType.VULNERABLE:
            return base_damage * 2
        elif resistance == ResistanceType.IMMUNE:
            return 0
        return base_damage
        
    def add_immunity(self, character: Character, damage_type: DamageType) -> None:
        """Adiciona imunidade a um tipo de dano."""
        self.set_resistance(character, damage_type, ResistanceType.IMMUNE)
        
    def add_resistance(self, character: Character, damage_type: DamageType) -> None:
        """Adiciona resistência a um tipo de dano."""
        self.set_resistance(character, damage_type, ResistanceType.RESISTANT)
        
    def add_vulnerability(self, character: Character, damage_type: DamageType) -> None:
        """Adiciona vulnerabilidade a um tipo de dano."""
        self.set_resistance(character, damage_type, ResistanceType.VULNERABLE)
        
    def remove_special_resistance(self, character: Character, damage_type: DamageType) -> None:
        """Remove qualquer resistência especial, voltando ao normal."""
        self.set_resistance(character, damage_type, ResistanceType.NORMAL)
        
    def get_all_resistances(self, character: Character) -> Dict[DamageType, ResistanceType]:
        """Retorna todas as resistências de um personagem."""
        return self.resistances.get(character, {})