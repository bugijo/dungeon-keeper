from typing import List, Dict, Optional, Callable
from dataclasses import dataclass
from enum import Enum, auto
from ..character.character import Character
from .condition import Condition, ConditionType
from .damage_type import DamageType

class EffectType(Enum):
    DAMAGE = auto()
    HEAL = auto()
    CONDITION = auto()
    BUFF = auto()
    DEBUFF = auto()
    AREA = auto()
    MOVEMENT = auto()

@dataclass
class EffectTarget:
    """Define o alvo do efeito."""
    single_target: bool = True
    area_of_effect: bool = False
    area_radius: int = 0
    affects_allies: bool = False
    affects_enemies: bool = True
    self_target: bool = False

@dataclass
class EffectDuration:
    """Define a duração do efeito."""
    instant: bool = True
    turns: int = 0
    until_dispelled: bool = False
    concentration: bool = False

class AbilityEffect:
    def __init__(self, 
                 effect_type: EffectType,
                 target: EffectTarget,
                 duration: EffectDuration):
        self.effect_type = effect_type
        self.target = target
        self.duration = duration
        self.conditions: List[Condition] = []
        self.damage: Dict[DamageType, int] = {}
        self.stat_modifiers: Dict[str, int] = {}
        self.custom_effect: Optional[Callable[[Character], None]] = None
        
    def add_damage(self, damage_type: DamageType, amount: int) -> None:
        """Adiciona dano ao efeito."""
        if damage_type in self.damage:
            self.damage[damage_type] += amount
        else:
            self.damage[damage_type] = amount
            
    def add_condition(self, condition: Condition) -> None:
        """Adiciona uma condição ao efeito."""
        self.conditions.append(condition)
        
    def add_stat_modifier(self, stat: str, modifier: int) -> None:
        """Adiciona um modificador de atributo ao efeito."""
        if stat in self.stat_modifiers:
            self.stat_modifiers[stat] += modifier
        else:
            self.stat_modifiers[stat] = modifier
            
    def set_custom_effect(self, effect_func: Callable[[Character], None]) -> None:
        """Define um efeito customizado."""
        self.custom_effect = effect_func

class AbilityEffectManager:
    def __init__(self):
        self.active_effects: Dict[Character, List[AbilityEffect]] = {}
        
    def apply_effect(self, effect: AbilityEffect, target: Character) -> None:
        """Aplica um efeito a um alvo."""
        # Aplica dano
        for damage_type, amount in effect.damage.items():
            # Aqui integraria com o sistema de dano
            pass
            
        # Aplica condições
        for condition in effect.conditions:
            # Aqui integraria com o sistema de condições
            pass
            
        # Aplica modificadores de atributo
        for stat, modifier in effect.stat_modifiers.items():
            target.modify_stat(stat, modifier)
            
        # Aplica efeito customizado
        if effect.custom_effect:
            effect.custom_effect(target)
            
        # Registra efeito se não for instantâneo
        if not effect.duration.instant:
            if target not in self.active_effects:
                self.active_effects[target] = []
            self.active_effects[target].append(effect)
            
    def update_effects(self, character: Character) -> None:
        """Atualiza os efeitos ativos em um personagem."""
        if character not in self.active_effects:
            return
            
        effects = self.active_effects[character]
        for effect in effects[:]:
            if effect.duration.turns > 0:
                effect.duration.turns -= 1
                if effect.duration.turns <= 0 and not effect.duration.until_dispelled:
                    self.remove_effect(effect, character)
                    
    def remove_effect(self, effect: AbilityEffect, character: Character) -> None:
        """Remove um efeito de um personagem."""
        if character in self.active_effects:
            if effect in self.active_effects[character]:
                # Remove modificadores de atributo
                for stat, modifier in effect.stat_modifiers.items():
                    character.modify_stat(stat, -modifier)
                
                self.active_effects[character].remove(effect)
                
    def get_active_effects(self, character: Character) -> List[AbilityEffect]:
        """Retorna todos os efeitos ativos em um personagem."""
        return self.active_effects.get(character, [])