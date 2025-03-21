from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum, auto
from datetime import datetime, timedelta

class StatusType(Enum):
    BUFF = auto()       # Efeitos positivos
    DEBUFF = auto()     # Efeitos negativos
    CONDITION = auto()  # Condições especiais
    TEMPORARY = auto()  # Efeitos temporários

class StatusCategory(Enum):
    PHYSICAL = auto()    # Efeitos físicos
    MENTAL = auto()      # Efeitos mentais
    MAGICAL = auto()     # Efeitos mágicos
    SOCIAL = auto()      # Efeitos sociais
    ENVIRONMENTAL = auto() # Efeitos ambientais

@dataclass
class StatusModifier:
    """Modificador de atributos ou estatísticas."""
    attribute: str
    value: float
    is_percentage: bool = False
    stacks: bool = False
    max_stacks: int = 1
    current_stacks: int = 1

@dataclass
class StatusEffect:
    """Representa um efeito de status."""
    name: str
    description: str
    status_type: StatusType
    category: StatusCategory
    duration: Optional[int] = None  # None para efeitos permanentes
    remaining_duration: Optional[int] = None
    modifiers: Dict[str, StatusModifier] = field(default_factory=dict)
    is_active: bool = True
    is_visible: bool = True
    can_be_dispelled: bool = True
    can_be_resisted: bool = True
    resistance_attribute: Optional[str] = None
    tick_effect: Optional[Callable] = None
    removal_effect: Optional[Callable] = None
    application_time: datetime = field(default_factory=datetime.now)
    tags: List[str] = field(default_factory=list)

@dataclass
class StatusEffectManager:
    """Gerenciador de efeitos de status."""
    active_effects: Dict[str, StatusEffect] = field(default_factory=dict)
    effect_history: List[StatusEffect] = field(default_factory=list)
    immunity_list: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        self._initialize_default_effects()
    
    def _initialize_default_effects(self):
        """Inicializa efeitos de status padrão."""
        # Efeitos positivos (Buffs)
        self.register_effect(
            "inspirado",
            "Aumenta a chance de sucesso em testes.",
            StatusType.BUFF,
            StatusCategory.MENTAL,
            duration=3,
            modifiers={
                "skill_check": StatusModifier("skill_check", 2)
            }
        )
        
        self.register_effect(
            "protegido",
            "Aumenta a defesa física.",
            StatusType.BUFF,
            StatusCategory.PHYSICAL,
            duration=5,
            modifiers={
                "defense": StatusModifier("defense", 3)
            }
        )
        
        # Efeitos negativos (Debuffs)
        self.register_effect(
            "envenenado",
            "Causa dano ao longo do tempo.",
            StatusType.DEBUFF,
            StatusCategory.PHYSICAL,
            duration=4,
            modifiers={
                "health_regen": StatusModifier("health_regen", -2)
            },
            tick_effect=lambda: {"damage": 3}
        )
        
        self.register_effect(
            "amedrontado",
            "Reduz a eficácia em combate.",
            StatusType.DEBUFF,
            StatusCategory.MENTAL,
            duration=2,
            modifiers={
                "attack": StatusModifier("attack", -2),
                "defense": StatusModifier("defense", -1)
            }
        )
    
    def register_effect(self, name: str, description: str,
                       status_type: StatusType, category: StatusCategory,
                       duration: Optional[int] = None,
                       modifiers: Dict[str, StatusModifier] = None,
                       tick_effect: Optional[Callable] = None,
                       removal_effect: Optional[Callable] = None,
                       tags: List[str] = None) -> None:
        """Registra um novo efeito de status."""
        effect = StatusEffect(
            name=name,
            description=description,
            status_type=status_type,
            category=category,
            duration=duration,
            remaining_duration=duration,
            modifiers=modifiers or {},
            tick_effect=tick_effect,
            removal_effect=removal_effect,
            tags=tags or []
        )
        self.active_effects[name] = effect
    
    def apply_effect(self, name: str, target_stats: Dict[str, float]) -> bool:
        """Aplica um efeito de status aos atributos do alvo."""
        if name not in self.active_effects or name in self.immunity_list:
            return False
        
        effect = self.active_effects[name]
        if not effect.is_active:
            return False
        
        # Aplica modificadores
        for mod in effect.modifiers.values():
            if mod.attribute in target_stats:
                if mod.is_percentage:
                    target_stats[mod.attribute] *= (1 + mod.value * mod.current_stacks)
                else:
                    target_stats[mod.attribute] += mod.value * mod.current_stacks
        
        return True
    
    def remove_effect(self, name: str, target_stats: Dict[str, float]) -> bool:
        """Remove um efeito de status."""
        if name not in self.active_effects:
            return False
        
        effect = self.active_effects[name]
        
        # Remove modificadores
        for mod in effect.modifiers.values():
            if mod.attribute in target_stats:
                if mod.is_percentage:
                    target_stats[mod.attribute] /= (1 + mod.value * mod.current_stacks)
                else:
                    target_stats[mod.attribute] -= mod.value * mod.current_stacks
        
        # Executa efeito de remoção
        if effect.removal_effect:
            effect.removal_effect()
        
        # Adiciona ao histórico
        self.effect_history.append(effect)
        
        # Remove o efeito
        del self.active_effects[name]
        
        return True
    
    def update_effects(self, target_stats: Dict[str, float]) -> List[Dict]:
        """Atualiza todos os efeitos ativos e retorna efeitos de tick."""
        tick_effects = []
        effects_to_remove = []
        
        for name, effect in self.active_effects.items():
            if not effect.is_active:
                continue
            
            # Atualiza duração
            if effect.duration is not None:
                if effect.remaining_duration is not None:
                    effect.remaining_duration -= 1
                    if effect.remaining_duration <= 0:
                        effects_to_remove.append(name)
                        continue
            
            # Processa efeito de tick
            if effect.tick_effect:
                tick_result = effect.tick_effect()
                if tick_result:
                    tick_effects.append(tick_result)
        
        # Remove efeitos expirados
        for name in effects_to_remove:
            self.remove_effect(name, target_stats)
        
        return tick_effects
    
    def stack_effect(self, name: str, target_stats: Dict[str, float]) -> bool:
        """Adiciona uma pilha a um efeito existente."""
        if name not in self.active_effects:
            return False
        
        effect = self.active_effects[name]
        
        # Verifica se pode empilhar
        for mod in effect.modifiers.values():
            if not mod.stacks or mod.current_stacks >= mod.max_stacks:
                return False
            
            # Remove valor atual
            if mod.attribute in target_stats:
                if mod.is_percentage:
                    target_stats[mod.attribute] /= (1 + mod.value * mod.current_stacks)
                else:
                    target_stats[mod.attribute] -= mod.value * mod.current_stacks
            
            # Incrementa pilhas
            mod.current_stacks += 1
            
            # Aplica novo valor
            if mod.attribute in target_stats:
                if mod.is_percentage:
                    target_stats[mod.attribute] *= (1 + mod.value * mod.current_stacks)
                else:
                    target_stats[mod.attribute] += mod.value * mod.current_stacks
        
        return True
    
    def clear_effects(self, target_stats: Dict[str, float],
                      type_filter: Optional[StatusType] = None,
                      category_filter: Optional[StatusCategory] = None) -> int:
        """Remove todos os efeitos que correspondam aos filtros."""
        effects_to_remove = [
            name for name, effect in self.active_effects.items()
            if (not type_filter or effect.status_type == type_filter) and
               (not category_filter or effect.category == category_filter) and
               effect.can_be_dispelled
        ]
        
        count = 0
        for name in effects_to_remove:
            if self.remove_effect(name, target_stats):
                count += 1
        
        return count
    
    def get_active_effects(self, type_filter: Optional[StatusType] = None,
                          category_filter: Optional[StatusCategory] = None) -> List[StatusEffect]:
        """Retorna lista de efeitos ativos com filtros opcionais."""
        return [
            effect for effect in self.active_effects.values()
            if effect.is_active and
               (not type_filter or effect.status_type == type_filter) and
               (not category_filter or effect.category == category_filter)
        ]
    
    def add_immunity(self, effect_name: str) -> None:
        """Adiciona imunidade a um efeito."""
        if effect_name not in self.immunity_list:
            self.immunity_list.append(effect_name)
    
    def remove_immunity(self, effect_name: str) -> None:
        """Remove imunidade a um efeito."""
        if effect_name in self.immunity_list:
            self.immunity_list.remove(effect_name)
    
    def is_immune(self, effect_name: str) -> bool:
        """Verifica se há imunidade a um efeito."""
        return effect_name in self.immunity_list
    
    def get_effect_duration(self, name: str) -> Optional[int]:
        """Retorna a duração restante de um efeito."""
        effect = self.active_effects.get(name)
        return effect.remaining_duration if effect else None
    
    def extend_duration(self, name: str, additional_duration: int) -> bool:
        """Estende a duração de um efeito."""
        if name not in self.active_effects:
            return False
        
        effect = self.active_effects[name]
        if effect.duration is not None and effect.remaining_duration is not None:
            effect.remaining_duration += additional_duration
            return True
        
        return False
    
    def get_effect_history(self, limit: Optional[int] = None) -> List[StatusEffect]:
        """Retorna histórico de efeitos aplicados."""
        if limit:
            return self.effect_history[-limit:]
        return self.effect_history
    
    def export_to_markdown(self) -> str:
        """Exporta todos os efeitos em formato markdown."""
        output = ["# Efeitos de Status\n\n"]
        
        # Organiza por tipo
        effects_by_type = {}
        for effect in self.active_effects.values():
            if effect.status_type not in effects_by_type:
                effects_by_type[effect.status_type] = []
            effects_by_type[effect.status_type].append(effect)
        
        # Gera saída organizada
        for status_type in StatusType:
            if status_type in effects_by_type:
                output.append(f"## {status_type.name}\n\n")
                for effect in effects_by_type[status_type]:
                    output.extend([
                        f"### {effect.name}\n\n",
                        f"*{effect.description}*\n\n",
                        f"**Categoria:** {effect.category.name}\n\n"
                    ])
                    
                    if effect.duration:
                        output.append(f"**Duração:** {effect.duration} turnos\n\n")
                    
                    if effect.modifiers:
                        output.append("**Modificadores:**\n")
                        for attr, mod in effect.modifiers.items():
                            value = f"{mod.value:+g}%" if mod.is_percentage else f"{mod.value:+g}"
                            output.append(f"- {attr}: {value}")
                            if mod.stacks:
                                output.append(f" (Máx: {mod.max_stacks} pilhas)")
                            output.append("\n")
                        output.append("\n")
                    
                    if effect.tags:
                        output.append(f"**Tags:** {', '.join(effect.tags)}\n\n")
        
        return "".join(output)