from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from .item import Item, ItemType, EquipmentSlot, ItemEffect

@dataclass
class Equipment(Item):
    """Classe para itens equipáveis."""
    slot: EquipmentSlot
    defense: int = 0
    attack: int = 0
    magic_attack: int = 0
    magic_defense: int = 0
    stat_requirements: Dict[str, int] = field(default_factory=dict)
    level_requirement: int = 1
    class_requirements: List[str] = field(default_factory=list)
    enchantments: List[ItemEffect] = field(default_factory=list)
    set_name: Optional[str] = None
    
    def __post_init__(self):
        super().__post_init__()
        self.stackable = False
        self.requirements.update(self.stat_requirements)
        self.requirements['level'] = self.level_requirement
    
    def can_be_equipped_by(self, character: Any) -> bool:
        """Verifica se o personagem pode equipar este item."""
        # Verifica nível
        if character.level < self.level_requirement:
            return False
        
        # Verifica classe
        if self.class_requirements and character.character_class not in self.class_requirements:
            return False
        
        # Verifica requisitos de atributos
        for stat, value in self.stat_requirements.items():
            if character.get_stat(stat) < value:
                return False
        
        return True
    
    def on_equip(self, character: Any) -> None:
        """Chamado quando o item é equipado."""
        # Aplica modificadores base
        character.modify_stat('defense', self.defense)
        character.modify_stat('attack', self.attack)
        character.modify_stat('magic_attack', self.magic_attack)
        character.modify_stat('magic_defense', self.magic_defense)
        
        # Aplica efeitos
        self.apply_effects(character)
        
        # Aplica encantamentos
        for enchantment in self.enchantments:
            enchantment.apply_effects(character)
    
    def on_unequip(self, character: Any) -> None:
        """Chamado quando o item é desequipado."""
        # Remove modificadores base
        character.modify_stat('defense', -self.defense)
        character.modify_stat('attack', -self.attack)
        character.modify_stat('magic_attack', -self.magic_attack)
        character.modify_stat('magic_defense', -self.magic_defense)
        
        # Remove efeitos
        self.remove_effects(character)
        
        # Remove encantamentos
        for enchantment in self.enchantments:
            enchantment.remove_effects(character)
    
    def add_enchantment(self, enchantment: ItemEffect) -> None:
        """Adiciona um encantamento ao equipamento."""
        self.enchantments.append(enchantment)
    
    def remove_enchantment(self, enchantment: ItemEffect) -> None:
        """Remove um encantamento do equipamento."""
        if enchantment in self.enchantments:
            self.enchantments.remove(enchantment)
    
    def get_total_defense(self) -> int:
        """Calcula a defesa total incluindo encantamentos."""
        total = self.defense
        for enchant in self.enchantments:
            total += enchant.stat_modifiers.get('defense', 0)
        return total
    
    def get_total_attack(self) -> int:
        """Calcula o ataque total incluindo encantamentos."""
        total = self.attack
        for enchant in self.enchantments:
            total += enchant.stat_modifiers.get('attack', 0)
        return total
    
    def get_total_magic_attack(self) -> int:
        """Calcula o ataque mágico total incluindo encantamentos."""
        total = self.magic_attack
        for enchant in self.enchantments:
            total += enchant.stat_modifiers.get('magic_attack', 0)
        return total
    
    def get_total_magic_defense(self) -> int:
        """Calcula a defesa mágica total incluindo encantamentos."""
        total = self.magic_defense
        for enchant in self.enchantments:
            total += enchant.stat_modifiers.get('magic_defense', 0)
        return total