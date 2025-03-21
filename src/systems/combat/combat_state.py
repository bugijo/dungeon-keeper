from typing import List, Dict, Optional
from enum import Enum, auto
from dataclasses import dataclass
from ..character.character import Character
from .initiative import Initiative
from .condition import ConditionManager
from .damage_type import DamageTypeManager
from .ability_effect import AbilityEffectManager

class CombatPhase(Enum):
    NOT_STARTED = auto()
    INITIATIVE = auto()
    COMBAT = auto()
    ENDED = auto()

@dataclass
class CombatAction:
    """Representa uma ação em combate."""
    actor: Character
    target: Optional[Character] = None
    action_type: str = "attack"
    damage_type: Optional[str] = None
    damage_amount: int = 0
    ability_name: Optional[str] = None

class CombatState:
    def __init__(self):
        self.phase = CombatPhase.NOT_STARTED
        self.round_number = 0
        self.initiative = Initiative()
        self.condition_manager = ConditionManager()
        self.damage_type_manager = DamageTypeManager()
        self.effect_manager = AbilityEffectManager()
        self.participants: List[Character] = []
        self.action_history: List[CombatAction] = []
        
    def start_combat(self, participants: List[Character]) -> None:
        """Inicia o combate com os participantes especificados."""
        self.participants = participants
        self.phase = CombatPhase.INITIATIVE
        self.initiative.roll_initiative(participants)
        self.round_number = 1
        self.phase = CombatPhase.COMBAT
        
    def end_combat(self) -> None:
        """Finaliza o combate e limpa os estados."""
        self.phase = CombatPhase.ENDED
        self.participants.clear()
        self.action_history.clear()
        
    def next_turn(self) -> Character:
        """Avança para o próximo turno e retorna o personagem atual."""
        current_character = self.initiative.next_turn()
        if current_character:
            # Atualiza efeitos e condições
            self.effect_manager.update_effects(current_character)
            self.condition_manager.update_conditions(current_character)
        return current_character
        
    def get_current_character(self) -> Optional[Character]:
        """Retorna o personagem atual no turno."""
        return self.initiative.get_current_character()
        
    def record_action(self, action: CombatAction) -> None:
        """Registra uma ação no histórico de combate."""
        self.action_history.append(action)
        
    def get_action_history(self) -> List[CombatAction]:
        """Retorna o histórico de ações do combate."""
        return self.action_history
        
    def is_combat_active(self) -> bool:
        """Verifica se o combate está ativo."""
        return self.phase == CombatPhase.COMBAT
        
    def get_remaining_participants(self) -> List[Character]:
        """Retorna a lista de participantes ainda no combate."""
        return [p for p in self.participants if p.stats['hp'] > 0]
        
    def remove_participant(self, character: Character) -> None:
        """Remove um participante do combate."""
        if character in self.participants:
            self.participants.remove(character)
            self.initiative.remove_participant(character)
            
    def add_participant(self, character: Character) -> None:
        """Adiciona um novo participante ao combate."""
        if character not in self.participants:
            self.participants.append(character)
            self.initiative.add_participant(character)
            
    def save_state(self) -> Dict:
        """Salva o estado atual do combate."""
        return {
            'phase': self.phase.name,
            'round_number': self.round_number,
            'participants': [p.name for p in self.participants],
            'action_history': [(a.actor.name, a.action_type) for a in self.action_history]
        }
        
    def load_state(self, state: Dict) -> None:
        """Carrega um estado salvo do combate."""
        self.phase = CombatPhase[state['phase']]
        self.round_number = state['round_number']
        # Outros dados precisariam ser reconstruídos com referências aos objetos reais