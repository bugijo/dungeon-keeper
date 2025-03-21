from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
from .item import Item, ItemType, ItemEffect

class ConsumableType(Enum):
    POTION = auto()
    FOOD = auto()
    SCROLL = auto()
    INGREDIENT = auto()
    ELIXIR = auto()

@dataclass
class ConsumableEffect(ItemEffect):
    """Efeito específico para itens consumiveis."""
    instant_heal: int = 0
    heal_over_time: int = 0
    instant_mana: int = 0
    mana_over_time: int = 0
    status_cure: List[str] = field(default_factory=list)
    status_apply: List[str] = field(default_factory=list)

@dataclass
class Consumable(Item):
    """Classe para itens consumiveis."""
    consumable_type: ConsumableType
    use_time: float = 1.0  # Tempo em segundos para usar
    cooldown: float = 0.0  # Tempo em segundos entre usos
    charges: Optional[int] = None  # Número de usos, None para infinito
    consume_on_use: bool = True
    effects: List[ConsumableEffect] = field(default_factory=list)
    custom_use_effect: Optional[Callable[[Any], None]] = None
    
    def __post_init__(self):
        super().__post_init__()
        self.item_type = ItemType.CONSUMABLE
    
    def can_use(self, character: Any) -> bool:
        """Verifica se o item pode ser usado."""
        if not self.meets_requirements(character):
            return False
            
        if self.charges is not None and self.charges <= 0:
            return False
            
        # Aqui verificaria cooldown usando um sistema de tempo
        return True
    
    def use(self, character: Any) -> bool:
        """Usa o item no personagem alvo."""
        if not self.can_use(character):
            return False
            
        # Aplica efeitos instantâneos
        for effect in self.effects:
            self._apply_instant_effects(effect, character)
            
        # Aplica efeitos ao longo do tempo
        for effect in self.effects:
            if effect.duration:
                self._apply_duration_effects(effect, character)
        
        # Executa efeito customizado
        if self.custom_use_effect:
            self.custom_use_effect(character)
        
        # Atualiza charges
        if self.charges is not None:
            self.charges -= 1
        
        # Consome o item se necessário
        if self.consume_on_use:
            self.current_stack -= 1
        
        return True
    
    def _apply_instant_effects(self, effect: ConsumableEffect, character: Any) -> None:
        """Aplica os efeitos instantâneos do consumivel."""
        if effect.instant_heal:
            character.heal(effect.instant_heal)
            
        if effect.instant_mana:
            character.restore_mana(effect.instant_mana)
            
        for status in effect.status_cure:
            character.remove_status_effect(status)
            
        for status in effect.status_apply:
            character.add_status_effect(status)
    
    def _apply_duration_effects(self, effect: ConsumableEffect, character: Any) -> None:
        """Aplica os efeitos de duração do consumivel."""
        if effect.heal_over_time:
            # Aqui seria integrado com o sistema de status effects
            # para aplicar cura ao longo do tempo
            pass
            
        if effect.mana_over_time:
            # Aqui seria integrado com o sistema de status effects
            # para aplicar restauração de mana ao longo do tempo
            pass