from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum, auto
from .item import Item, ItemType, ItemRarity

class CraftingType(Enum):
    BLACKSMITHING = auto()
    ALCHEMY = auto()
    ENCHANTING = auto()
    COOKING = auto()
    TAILORING = auto()
    WOODWORKING = auto()
    JEWELCRAFTING = auto()

class CraftingQuality(Enum):
    POOR = 0.8
    NORMAL = 1.0
    GOOD = 1.2
    EXCELLENT = 1.5
    MASTERWORK = 2.0
    LEGENDARY = 3.0

@dataclass
class CraftingRequirement:
    """Requisitos para criar um item."""
    skill_type: CraftingType
    skill_level: int
    materials: Dict[str, int]
    tools: List[str]
    station: Optional[str] = None
    time: float = 1.0  # Tempo em segundos
    gold_cost: int = 0

@dataclass
class CraftingRecipe:
    """Representa uma receita de crafting."""
    name: str
    description: str
    result_item: Item
    requirements: CraftingRequirement
    base_success_rate: float = 0.7
    quality_thresholds: Dict[CraftingQuality, int] = field(default_factory=dict)
    experience_reward: int = 10
    unlocked: bool = False
    
    def calculate_success_chance(self, crafter_level: int) -> float:
        """Calcula a chance de sucesso baseado no nível do crafter."""
        level_difference = crafter_level - self.requirements.skill_level
        bonus = min(0.3, max(0, level_difference * 0.05))  # +5% por nível, max 30%
        return min(1.0, self.base_success_rate + bonus)
    
    def determine_quality(self, crafter_level: int, roll: float) -> CraftingQuality:
        """Determina a qualidade do item baseado no nível e sorte."""
        for quality, threshold in sorted(
            self.quality_thresholds.items(),
            key=lambda x: x[1],
            reverse=True
        ):
            if crafter_level >= threshold and roll >= (1 - quality.value * 0.2):
                return quality
        return CraftingQuality.POOR

@dataclass
class CraftingSystem:
    """Sistema que gerencia crafting de itens."""
    recipes: Dict[str, CraftingRecipe] = field(default_factory=dict)
    skill_levels: Dict[CraftingType, int] = field(default_factory=dict)
    active_stations: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        # Inicializa níveis de habilidade
        for craft_type in CraftingType:
            self.skill_levels[craft_type] = 1
    
    def add_recipe(self, recipe: CraftingRecipe) -> None:
        """Adiciona uma nova receita ao sistema."""
        self.recipes[recipe.name] = recipe
    
    def unlock_recipe(self, recipe_name: str) -> bool:
        """Desbloqueia uma receita."""
        if recipe_name in self.recipes:
            self.recipes[recipe_name].unlocked = True
            return True
        return False
    
    def get_available_recipes(self, crafter_level: Dict[CraftingType, int]) -> List[CraftingRecipe]:
        """Retorna todas as receitas disponíveis para o nível atual."""
        return [
            recipe for recipe in self.recipes.values()
            if recipe.unlocked and 
            crafter_level[recipe.requirements.skill_type] >= recipe.requirements.skill_level
        ]
    
    def can_craft(self, recipe: CraftingRecipe, inventory: Any) -> bool:
        """Verifica se é possível criar o item."""
        # Verifica nível de habilidade
        if self.skill_levels[recipe.requirements.skill_type] < recipe.requirements.skill_level:
            return False
        
        # Verifica materiais
        for material, amount in recipe.requirements.materials.items():
            if not inventory.has_item(material, amount):
                return False
        
        # Verifica ferramentas
        for tool in recipe.requirements.tools:
            if not inventory.has_tool(tool):
                return False
        
        # Verifica estação de crafting
        if recipe.requirements.station and \
           recipe.requirements.station not in self.active_stations:
            return False
        
        # Verifica custo em ouro
        if inventory.gold < recipe.requirements.gold_cost:
            return False
        
        return True
    
    def craft_item(self, recipe: CraftingRecipe, inventory: Any, quality_bonus: float = 0) -> Optional[Item]:
        """Tenta criar um item usando a receita."""
        if not self.can_craft(recipe, inventory):
            return None
        
        # Consome materiais
        for material, amount in recipe.requirements.materials.items():
            inventory.remove_item_by_name(material, amount)
        
        # Consome ouro
        inventory.remove_gold(recipe.requirements.gold_cost)
        
        # Calcula sucesso e qualidade
        crafter_level = self.skill_levels[recipe.requirements.skill_type]
        success_chance = recipe.calculate_success_chance(crafter_level)
        
        import random
        roll = random.random() + quality_bonus
        
        if roll <= success_chance:
            # Determina qualidade
            quality = recipe.determine_quality(crafter_level, roll)
            
            # Cria o item com modificadores de qualidade
            crafted_item = self._create_item_with_quality(recipe.result_item, quality)
            
            # Adiciona experiência
            self._add_experience(recipe.requirements.skill_type, recipe.experience_reward)
            
            return crafted_item
        
        # Falha no crafting - retorna alguns materiais
        self._return_some_materials(recipe, inventory)
        return None
    
    def _create_item_with_quality(self, base_item: Item, quality: CraftingQuality) -> Item:
        """Cria uma cópia do item com modificadores de qualidade."""
        # Cria uma cópia profunda do item
        import copy
        item = copy.deepcopy(base_item)
        
        # Aplica modificadores baseados na qualidade
        multiplier = quality.value
        
        # Modifica atributos básicos
        item.value = int(item.value * multiplier)
        
        # Modifica atributos específicos do tipo de item
        if hasattr(item, 'attack'):
            item.attack = int(item.attack * multiplier)
        if hasattr(item, 'defense'):
            item.defense = int(item.defense * multiplier)
        if hasattr(item, 'magic_attack'):
            item.magic_attack = int(item.magic_attack * multiplier)
        if hasattr(item, 'magic_defense'):
            item.magic_defense = int(item.magic_defense * multiplier)
        
        # Adiciona sufixo de qualidade ao nome
        item.name = f"{item.name} ({quality.name})"
        
        return item
    
    def _add_experience(self, skill_type: CraftingType, base_exp: int) -> None:
        """Adiciona experiência a uma habilidade de crafting."""
        # Aqui seria implementada a lógica de progressão de nível
        self.skill_levels[skill_type] += 1
    
    def _return_some_materials(self, recipe: CraftingRecipe, inventory: Any) -> None:
        """Retorna alguns materiais quando o crafting falha."""
        import random
        for material, amount in recipe.requirements.materials.items():
            # 50% de chance de recuperar cada material
            returned_amount = sum(1 for _ in range(amount) if random.random() > 0.5)
            if returned_amount > 0:
                inventory.add_item_by_name(material, returned_amount)