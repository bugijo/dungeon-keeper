from typing import List, Dict, Optional, Set
from dataclasses import dataclass
from enum import Enum, auto
from ..character.character import Character
from .combat_state import CombatState, CombatAction

class ActionType(Enum):
    STANDARD = auto()
    BONUS = auto()
    REACTION = auto()
    MOVEMENT = auto()
    FREE = auto()

@dataclass
class ActionUsage:
    """Controla o uso de ações em um turno."""
    standard_action: bool = False
    bonus_action: bool = False
    reaction: bool = False
    movement: bool = False

class CombatRound:
    def __init__(self, combat_state: CombatState):
        self.combat_state = combat_state
        self.round_number = 0
        self.action_usage: Dict[Character, ActionUsage] = {}
        self.reaction_opportunities: Dict[Character, Set[str]] = {}
        
    def start_round(self) -> None:
        """Inicia um novo round de combate."""
        self.round_number += 1
        self.reset_actions()
        
    def reset_actions(self) -> None:
        """Reseta o uso de ações para todos os participantes."""
        self.action_usage.clear()
        for participant in self.combat_state.participants:
            self.action_usage[participant] = ActionUsage()
        self.reaction_opportunities.clear()
        
    def can_take_action(self, character: Character, action_type: ActionType) -> bool:
        """Verifica se um personagem pode realizar uma ação específica."""
        if character not in self.action_usage:
            self.action_usage[character] = ActionUsage()
            
        usage = self.action_usage[character]
        
        if action_type == ActionType.STANDARD:
            return not usage.standard_action
        elif action_type == ActionType.BONUS:
            return not usage.bonus_action
        elif action_type == ActionType.REACTION:
            return not usage.reaction
        elif action_type == ActionType.MOVEMENT:
            return not usage.movement
        return True
        
    def use_action(self, character: Character, action_type: ActionType) -> bool:
        """Marca uma ação como usada."""
        if not self.can_take_action(character, action_type):
            return False
            
        usage = self.action_usage[character]
        
        if action_type == ActionType.STANDARD:
            usage.standard_action = True
        elif action_type == ActionType.BONUS:
            usage.bonus_action = True
        elif action_type == ActionType.REACTION:
            usage.reaction = True
        elif action_type == ActionType.MOVEMENT:
            usage.movement = True
            
        return True
        
    def register_reaction_opportunity(self, character: Character, trigger: str) -> None:
        """Registra uma oportunidade de reação para um personagem."""
        if character not in self.reaction_opportunities:
            self.reaction_opportunities[character] = set()
        self.reaction_opportunities[character].add(trigger)
        
    def can_react_to(self, character: Character, trigger: str) -> bool:
        """Verifica se um personagem pode reagir a um gatilho específico."""
        if not self.can_take_action(character, ActionType.REACTION):
            return False
        return character in self.reaction_opportunities and trigger in self.reaction_opportunities[character]
        
    def process_reaction(self, character: Character, trigger: str, action: CombatAction) -> bool:
        """Processa uma reação de um personagem."""
        if not self.can_react_to(character, trigger):
            return False
            
        self.use_action(character, ActionType.REACTION)
        self.combat_state.record_action(action)
        return True
        
    def get_available_actions(self, character: Character) -> List[ActionType]:
        """Retorna a lista de ações disponíveis para um personagem."""
        available = []
        for action_type in ActionType:
            if self.can_take_action(character, action_type):
                available.append(action_type)
        return available
        
    def is_turn_complete(self, character: Character) -> bool:
        """Verifica se um personagem completou todas as ações principais do turno."""
        if character not in self.action_usage:
            return False
        usage = self.action_usage[character]
        return usage.standard_action and usage.movement