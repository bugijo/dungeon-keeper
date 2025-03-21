from typing import Dict, List, Optional
from enum import Enum, auto
from dataclasses import dataclass
from ..character.character import Character

class ConditionType(Enum):
    STUNNED = auto()
    POISONED = auto()
    PARALYZED = auto()
    BLINDED = auto()
    CHARMED = auto()
    FRIGHTENED = auto()
    PRONE = auto()
    RESTRAINED = auto()
    SILENCED = auto()
    INVISIBLE = auto()

@dataclass
class ConditionEffect:
    """Efeitos de uma condição em um personagem."""
    stat_modifiers: Dict[str, int] = None
    cant_move: bool = False
    cant_attack: bool = False
    cant_cast: bool = False
    disadvantage_on_attacks: bool = False
    disadvantage_on_saves: bool = False
    advantage_against: bool = False

class Condition:
    def __init__(self, condition_type: ConditionType, duration: int = 1):
        self.type = condition_type
        self.duration = duration
        self.effects = self._get_condition_effects()
        
    def _get_condition_effects(self) -> ConditionEffect:
        """Retorna os efeitos baseados no tipo da condição."""
        effects = {
            ConditionType.STUNNED: ConditionEffect(
                cant_move=True,
                cant_attack=True,
                cant_cast=True,
                advantage_against=True
            ),
            ConditionType.POISONED: ConditionEffect(
                stat_modifiers={'strength': -2, 'dexterity': -2},
                disadvantage_on_attacks=True,
                disadvantage_on_saves=True
            ),
            ConditionType.PARALYZED: ConditionEffect(
                cant_move=True,
                cant_attack=True,
                advantage_against=True
            ),
            ConditionType.BLINDED: ConditionEffect(
                disadvantage_on_attacks=True,
                advantage_against=True
            ),
            # Adicionar outros efeitos para cada tipo de condição
        }
        return effects.get(self.type, ConditionEffect())

class ConditionManager:
    def __init__(self):
        self.conditions: Dict[Character, List[Condition]] = {}
        
    def add_condition(self, character: Character, condition: Condition) -> None:
        """Adiciona uma condição a um personagem."""
        if character not in self.conditions:
            self.conditions[character] = []
        self.conditions[character].append(condition)
        self._apply_condition_effects(character, condition)
        
    def remove_condition(self, character: Character, condition_type: ConditionType) -> None:
        """Remove uma condição de um personagem."""
        if character in self.conditions:
            conditions = self.conditions[character]
            for condition in conditions[:]:
                if condition.type == condition_type:
                    conditions.remove(condition)
                    self._remove_condition_effects(character, condition)
                    
    def get_conditions(self, character: Character) -> List[Condition]:
        """Retorna todas as condições ativas em um personagem."""
        return self.conditions.get(character, [])
        
    def update_conditions(self, character: Character) -> None:
        """Atualiza a duração das condições e remove as expiradas."""
        if character in self.conditions:
            conditions = self.conditions[character]
            for condition in conditions[:]:
                condition.duration -= 1
                if condition.duration <= 0:
                    conditions.remove(condition)
                    self._remove_condition_effects(character, condition)
                    
    def _apply_condition_effects(self, character: Character, condition: Condition) -> None:
        """Aplica os efeitos de uma condição ao personagem."""
        effects = condition.effects
        if effects.stat_modifiers:
            for stat, modifier in effects.stat_modifiers.items():
                character.modify_stat(stat, modifier)
                
    def _remove_condition_effects(self, character: Character, condition: Condition) -> None:
        """Remove os efeitos de uma condição do personagem."""
        effects = condition.effects
        if effects.stat_modifiers:
            for stat, modifier in effects.stat_modifiers.items():
                character.modify_stat(stat, -modifier)  # Reverte o modificador