from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum, auto

class ItemRarity(Enum):
    COMMON = auto()
    UNCOMMON = auto()
    RARE = auto()
    EPIC = auto()
    LEGENDARY = auto()
    MYTHIC = auto()

class ItemType(Enum):
    WEAPON = auto()
    ARMOR = auto()
    ACCESSORY = auto()
    CONSUMABLE = auto()
    MATERIAL = auto()
    QUEST = auto()
    TREASURE = auto()

class EquipmentSlot(Enum):
    HEAD = auto()
    CHEST = auto()
    LEGS = auto()
    FEET = auto()
    HANDS = auto()
    MAIN_HAND = auto()
    OFF_HAND = auto()
    NECK = auto()
    RING_1 = auto()
    RING_2 = auto()

@dataclass
class ItemEffect:
    """Representa um efeito que um item pode ter."""
    name: str
    description: str
    stat_modifiers: Dict[str, int] = field(default_factory=dict)
    duration: Optional[int] = None
    is_permanent: bool = True
    trigger_condition: Optional[str] = None
    trigger_chance: float = 1.0

@dataclass
class Item:
    """Classe base para todos os itens do jogo."""
    name: str
    description: str
    item_type: ItemType
    rarity: ItemRarity
    weight: float
    value: int
    stackable: bool = False
    max_stack: int = 1
    current_stack: int = 1
    durability: Optional[int] = None
    max_durability: Optional[int] = None
    requirements: Dict[str, Any] = field(default_factory=dict)
    effects: List[ItemEffect] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    
    def can_stack_with(self, other: 'Item') -> bool:
        """Verifica se este item pode ser empilhado com outro."""
        if not self.stackable or not other.stackable:
            return False
        return (
            self.name == other.name
            and self.item_type == other.item_type
            and self.rarity == other.rarity
        )
    
    def stack_with(self, other: 'Item') -> bool:
        """Tenta empilhar este item com outro."""
        if not self.can_stack_with(other):
            return False
            
        total_stack = self.current_stack + other.current_stack
        if total_stack > self.max_stack:
            return False
            
        self.current_stack = total_stack
        return True
    
    def split_stack(self, amount: int) -> Optional['Item']:
        """Divide a pilha de itens."""
        if not self.stackable or amount >= self.current_stack:
            return None
            
        new_item = Item(
            name=self.name,
            description=self.description,
            item_type=self.item_type,
            rarity=self.rarity,
            weight=self.weight,
            value=self.value,
            stackable=True,
            max_stack=self.max_stack,
            current_stack=amount
        )
        
        self.current_stack -= amount
        return new_item
    
    def meets_requirements(self, character: Any) -> bool:
        """Verifica se um personagem atende aos requisitos para usar este item."""
        for stat, value in self.requirements.items():
            if character.get_stat(stat) < value:
                return False
        return True
    
    def apply_effects(self, target: Any) -> None:
        """Aplica os efeitos do item a um alvo."""
        for effect in self.effects:
            if effect.is_permanent:
                self._apply_permanent_effect(effect, target)
            else:
                self._apply_temporary_effect(effect, target)
    
    def remove_effects(self, target: Any) -> None:
        """Remove os efeitos do item de um alvo."""
        for effect in self.effects:
            if effect.is_permanent:
                self._remove_permanent_effect(effect, target)
    
    def use_durability(self) -> bool:
        """Usa um ponto de durabilidade do item."""
        if self.durability is None:
            return True
            
        self.durability -= 1
        return self.durability > 0
    
    def repair(self, amount: int) -> None:
        """Repara o item."""
        if self.durability is None or self.max_durability is None:
            return
            
        self.durability = min(self.durability + amount, self.max_durability)
    
    def _apply_permanent_effect(self, effect: ItemEffect, target: Any) -> None:
        """Aplica um efeito permanente."""
        for stat, modifier in effect.stat_modifiers.items():
            target.modify_stat(stat, modifier)
    
    def _apply_temporary_effect(self, effect: ItemEffect, target: Any) -> None:
        """Aplica um efeito temporário."""
        # Aqui seria integrado com o sistema de status effects
        pass
    
    def _remove_permanent_effect(self, effect: ItemEffect, target: Any) -> None:
        """Remove um efeito permanente."""
        for stat, modifier in effect.stat_modifiers.items():
            target.modify_stat(stat, -modifier)