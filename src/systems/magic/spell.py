from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from enum import Enum, auto

class SpellSchool(Enum):
    ABJURATION = auto()    # Proteção e defesa
    CONJURATION = auto()   # Invocação e teleporte
    DIVINATION = auto()    # Conhecimento e detecção
    ENCHANTMENT = auto()   # Controle mental e buff
    EVOCATION = auto()     # Dano elemental e energia
    ILLUSION = auto()      # Engano e controle
    NECROMANCY = auto()    # Morte e alma
    TRANSMUTATION = auto() # Transformação

class SpellType(Enum):
    ATTACK = auto()      # Dano direto
    DEFENSE = auto()     # Proteção
    UTILITY = auto()     # Utilidade geral
    HEALING = auto()     # Cura e restauração
    CONTROL = auto()     # Controle de campo
    SUMMONING = auto()   # Invocação de criaturas
    BUFF = auto()        # Melhorias temporárias
    DEBUFF = auto()      # Penalidades ao alvo

class CastType(Enum):
    INSTANT = auto()     # Efeito instantâneo
    CHANNELED = auto()   # Precisa canalizar
    CHARGED = auto()     # Pode ser carregada
    RITUAL = auto()      # Ritual longo
    PASSIVE = auto()     # Efeito passivo

class TargetType(Enum):
    SELF = auto()        # Apenas o conjurador
    SINGLE = auto()      # Um alvo
    AREA = auto()        # Área de efeito
    LINE = auto()        # Linha reta
    CONE = auto()        # Cone
    GLOBAL = auto()      # Todos na área/mapa

class Element(Enum):
    PHYSICAL = auto()
    FIRE = auto()
    ICE = auto()
    LIGHTNING = auto()
    EARTH = auto()
    WIND = auto()
    LIGHT = auto()
    DARK = auto()
    ARCANE = auto()

@dataclass
class SpellEffect:
    """Representa um efeito que uma magia pode causar."""
    name: str
    description: str
    element: Element
    power: int
    duration: Optional[int] = None  # Em turnos
    tick_rate: Optional[int] = None  # A cada X turnos
    stat_modifiers: Dict[str, int] = field(default_factory=dict)
    status_effects: List[str] = field(default_factory=list)
    special_effects: Dict[str, Any] = field(default_factory=dict)

@dataclass
class SpellRequirement:
    """Requisitos para lançar uma magia."""
    level: int = 1
    mana_cost: int = 0
    health_cost: int = 0
    cast_time: float = 0.0  # Em segundos
    cooldown: float = 0.0   # Em segundos
    reagents: Dict[str, int] = field(default_factory=dict)
    stat_requirements: Dict[str, int] = field(default_factory=dict)
    skill_requirements: Dict[str, int] = field(default_factory=dict)

@dataclass
class Spell:
    """Classe base para todas as magias do jogo."""
    name: str
    description: str
    level: int
    school: SpellSchool
    spell_type: SpellType
    cast_type: CastType
    target_type: TargetType
    element: Element
    effects: List[SpellEffect] = field(default_factory=list)
    requirements: SpellRequirement = field(default_factory=SpellRequirement)
    range: float = 1.0
    area: float = 0.0
    is_learned: bool = False
    is_equipped: bool = False
    experience: int = 0
    max_charges: Optional[int] = None
    current_charges: Optional[int] = None
    last_cast_time: float = 0.0
    
    def can_cast(self, caster: Any) -> bool:
        """Verifica se a magia pode ser lançada."""
        # Verifica nível
        if caster.level < self.requirements.level:
            return False
        
        # Verifica custos
        if caster.mana < self.requirements.mana_cost:
            return False
        if caster.hp <= self.requirements.health_cost:  # Não permite matar o conjurador
            return False
        
        # Verifica cooldown
        current_time = caster.get_current_time()
        if current_time - self.last_cast_time < self.requirements.cooldown:
            return False
        
        # Verifica cargas
        if self.max_charges and self.current_charges <= 0:
            return False
        
        # Verifica requisitos de atributos
        for stat, value in self.requirements.stat_requirements.items():
            if caster.get_stat(stat) < value:
                return False
        
        # Verifica requisitos de habilidades
        for skill, value in self.requirements.skill_requirements.items():
            if caster.get_skill(skill) < value:
                return False
        
        # Verifica reagentes
        for reagent, amount in self.requirements.reagents.items():
            if not caster.has_reagent(reagent, amount):
                return False
        
        return True
    
    def cast(self, caster: Any, targets: List[Any]) -> bool:
        """Lança a magia."""
        if not self.can_cast(caster):
            return False
        
        # Aplica custos
        caster.spend_mana(self.requirements.mana_cost)
        caster.take_damage(self.requirements.health_cost)
        
        # Consome reagentes
        for reagent, amount in self.requirements.reagents.items():
            caster.consume_reagent(reagent, amount)
        
        # Atualiza cooldown
        self.last_cast_time = caster.get_current_time()
        
        # Atualiza cargas
        if self.max_charges:
            self.current_charges -= 1
        
        # Aplica efeitos
        for target in targets:
            if self._is_valid_target(caster, target):
                self._apply_effects(caster, target)
        
        # Adiciona experiência
        self.experience += 1
        
        return True
    
    def _is_valid_target(self, caster: Any, target: Any) -> bool:
        """Verifica se o alvo é válido para a magia."""
        # Verifica distância
        if self.target_type != TargetType.SELF:
            distance = caster.get_distance_to(target)
            if distance > self.range:
                return False
        
        # Verifica tipo de alvo
        if self.target_type == TargetType.SELF and target != caster:
            return False
        
        return True
    
    def _apply_effects(self, caster: Any, target: Any) -> None:
        """Aplica os efeitos da magia ao alvo."""
        for effect in self.effects:
            # Aplica dano/cura base
            if effect.power > 0:
                if self.spell_type == SpellType.HEALING:
                    target.heal(self._calculate_healing(caster, effect))
                else:
                    target.take_damage(
                        self._calculate_damage(caster, effect),
                        effect.element
                    )
            
            # Aplica modificadores de atributos
            for stat, value in effect.stat_modifiers.items():
                target.add_stat_modifier(stat, value, effect.duration)
            
            # Aplica efeitos de status
            for status in effect.status_effects:
                target.add_status_effect(status, effect.duration)
            
            # Aplica efeitos especiais
            for effect_name, effect_data in effect.special_effects.items():
                target.apply_special_effect(effect_name, effect_data, effect.duration)
    
    def _calculate_damage(self, caster: Any, effect: SpellEffect) -> int:
        """Calcula o dano base da magia."""
        base_damage = effect.power
        magic_power = caster.get_stat('magic_power')
        elemental_bonus = caster.get_elemental_bonus(effect.element)
        
        return int(base_damage * (1 + magic_power/100) * (1 + elemental_bonus/100))
    
    def _calculate_healing(self, caster: Any, effect: SpellEffect) -> int:
        """Calcula a cura base da magia."""
        base_healing = effect.power
        healing_power = caster.get_stat('healing_power')
        
        return int(base_healing * (1 + healing_power/100))
    
    def get_total_casts(self) -> int:
        """Retorna o número total de vezes que a magia foi lançada."""
        return self.experience
    
    def is_on_cooldown(self, current_time: float) -> bool:
        """Verifica se a magia está em cooldown."""
        return current_time - self.last_cast_time < self.requirements.cooldown
    
    def get_remaining_cooldown(self, current_time: float) -> float:
        """Retorna o tempo restante de cooldown."""
        if not self.is_on_cooldown(current_time):
            return 0.0
        return self.requirements.cooldown - (current_time - self.last_cast_time)
    
    def reset_cooldown(self) -> None:
        """Reseta o cooldown da magia."""
        self.last_cast_time = 0.0
    
    def restore_charge(self) -> None:
        """Restaura uma carga da magia."""
        if self.max_charges and self.current_charges < self.max_charges:
            self.current_charges += 1