from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field
from enum import Enum, auto
from .spell import Spell, SpellEffect
from ..inventory.item import Item

class SpellComponent(Enum):
    VERBAL = auto()      # Componente verbal (palavras mágicas)
    SOMATIC = auto()     # Componente somático (gestos)
    MATERIAL = auto()    # Componente material (itens)

class SpellSchool(Enum):
    ABJURATION = auto()    # Proteção
    CONJURATION = auto()   # Invocação
    DIVINATION = auto()    # Adivinhação
    ENCHANTMENT = auto()   # Encantamento
    EVOCATION = auto()     # Evocação
    ILLUSION = auto()      # Ilusão
    NECROMANCY = auto()    # Necromancia
    TRANSMUTATION = auto() # Transmutação

@dataclass
class SpellRecipe:
    """Receita para criar uma magia."""
    name: str
    description: str
    school: SpellSchool
    level: int
    components: Set[SpellComponent]
    material_components: Dict[Item, int] = field(default_factory=dict)  # Item e quantidade
    mana_cost: int = 0
    casting_time: str = "1 ação"
    duration: str = "instantâneo"
    range: str = "pessoal"
    effects: List[SpellEffect] = field(default_factory=list)

@dataclass
class SpellModifier:
    """Modificador que pode ser aplicado a uma magia durante o crafting."""
    name: str
    description: str
    mana_cost_modifier: int = 0
    casting_time_modifier: str = ""
    duration_modifier: str = ""
    range_modifier: str = ""
    additional_effects: List[SpellEffect] = field(default_factory=list)
    material_cost: Dict[Item, int] = field(default_factory=dict)

@dataclass
class SpellCrafting:
    """Sistema de crafting de magias."""
    recipes: Dict[str, SpellRecipe] = field(default_factory=dict)
    modifiers: Dict[str, SpellModifier] = field(default_factory=dict)
    
    def __post_init__(self):
        self._initialize_default_content()
    
    def _initialize_default_content(self):
        """Inicializa o conteúdo padrão do sistema."""
        # Exemplo de receita: Bola de Fogo
        self.add_recipe(
            "Bola de Fogo",
            "Conjura uma explosão de chamas.",
            SpellSchool.EVOCATION,
            3,  # Nível 3
            {SpellComponent.VERBAL, SpellComponent.SOMATIC, SpellComponent.MATERIAL},
            {"enxofre": 1, "pó de ferro": 1},
            mana_cost=30,
            range="20 metros",
            effects=[SpellEffect("damage", {"fire": 8, "radius": 6})]
        )
        
        # Exemplo de modificador: Ampliar Alcance
        self.add_modifier(
            "Ampliar Alcance",
            "Aumenta o alcance da magia.",
            mana_cost_modifier=10,
            range_modifier="dobrado",
            material_cost={"cristal de quartzo": 1}
        )
    
    def add_recipe(self, name: str, description: str, school: SpellSchool,
                   level: int, components: Set[SpellComponent],
                   material_components: Dict[str, int] = None,
                   mana_cost: int = 0, casting_time: str = "1 ação",
                   duration: str = "instantâneo", range: str = "pessoal",
                   effects: List[SpellEffect] = None) -> None:
        """Adiciona uma nova receita de magia."""
        self.recipes[name] = SpellRecipe(
            name=name,
            description=description,
            school=school,
            level=level,
            components=components,
            material_components=material_components or {},
            mana_cost=mana_cost,
            casting_time=casting_time,
            duration=duration,
            range=range,
            effects=effects or []
        )
    
    def add_modifier(self, name: str, description: str,
                     mana_cost_modifier: int = 0,
                     casting_time_modifier: str = "",
                     duration_modifier: str = "",
                     range_modifier: str = "",
                     additional_effects: List[SpellEffect] = None,
                     material_cost: Dict[str, int] = None) -> None:
        """Adiciona um novo modificador de magia."""
        self.modifiers[name] = SpellModifier(
            name=name,
            description=description,
            mana_cost_modifier=mana_cost_modifier,
            casting_time_modifier=casting_time_modifier,
            duration_modifier=duration_modifier,
            range_modifier=range_modifier,
            additional_effects=additional_effects or [],
            material_cost=material_cost or {}
        )
    
    def get_recipe(self, name: str) -> Optional[SpellRecipe]:
        """Retorna uma receita de magia pelo nome."""
        return self.recipes.get(name)
    
    def get_modifier(self, name: str) -> Optional[SpellModifier]:
        """Retorna um modificador pelo nome."""
        return self.modifiers.get(name)
    
    def list_recipes_by_school(self, school: SpellSchool) -> List[SpellRecipe]:
        """Lista todas as receitas de uma escola de magia."""
        return [recipe for recipe in self.recipes.values()
                if recipe.school == school]
    
    def list_recipes_by_level(self, level: int) -> List[SpellRecipe]:
        """Lista todas as receitas de um nível específico."""
        return [recipe for recipe in self.recipes.values()
                if recipe.level == level]
    
    def craft_spell(self, recipe_name: str,
                    modifier_names: List[str] = None) -> Optional[Spell]:
        """Cria uma magia a partir de uma receita e modificadores opcionais."""
        recipe = self.get_recipe(recipe_name)
        if not recipe:
            return None
        
        # Começa com os valores base da receita
        mana_cost = recipe.mana_cost
        casting_time = recipe.casting_time
        duration = recipe.duration
        range_value = recipe.range
        effects = recipe.effects.copy()
        
        # Aplica modificadores
        if modifier_names:
            for mod_name in modifier_names:
                modifier = self.get_modifier(mod_name)
                if modifier:
                    mana_cost += modifier.mana_cost_modifier
                    if modifier.casting_time_modifier:
                        casting_time = modifier.casting_time_modifier
                    if modifier.duration_modifier:
                        duration = modifier.duration_modifier
                    if modifier.range_modifier:
                        range_value = modifier.range_modifier
                    effects.extend(modifier.additional_effects)
        
        # Cria a magia
        return Spell(
            name=recipe.name,
            description=recipe.description,
            level=recipe.level,
            mana_cost=mana_cost,
            casting_time=casting_time,
            duration=duration,
            range=range_value,
            effects=effects
        )
    
    def get_total_material_cost(self, recipe_name: str,
                               modifier_names: List[str] = None) -> Dict[str, int]:
        """Calcula o custo total de materiais para criar uma magia."""
        recipe = self.get_recipe(recipe_name)
        if not recipe:
            return {}
        
        # Começa com os materiais da receita
        total_cost = recipe.material_components.copy()
        
        # Adiciona materiais dos modificadores
        if modifier_names:
            for mod_name in modifier_names:
                modifier = self.get_modifier(mod_name)
                if modifier:
                    for item, quantity in modifier.material_cost.items():
                        if item in total_cost:
                            total_cost[item] += quantity
                        else:
                            total_cost[item] = quantity
        
        return total_cost
    
    def validate_crafting(self, recipe_name: str,
                         modifier_names: List[str] = None,
                         available_materials: Dict[str, int] = None) -> bool:
        """Verifica se é possível criar a magia com os materiais disponíveis."""
        if not available_materials:
            return False
        
        # Calcula materiais necessários
        required_materials = self.get_total_material_cost(recipe_name, modifier_names)
        
        # Verifica se há materiais suficientes
        for item, quantity in required_materials.items():
            if item not in available_materials or available_materials[item] < quantity:
                return False
        
        return True
    
    def get_possible_recipes(self, available_materials: Dict[str, int]) -> List[str]:
        """Lista todas as receitas possíveis com os materiais disponíveis."""
        possible_recipes = []
        
        for recipe_name in self.recipes:
            if self.validate_crafting(recipe_name, None, available_materials):
                possible_recipes.append(recipe_name)
        
        return possible_recipes
    
    def export_to_markdown(self) -> str:
        """Exporta todas as receitas e modificadores em formato markdown."""
        output = ["# Grimório de Crafting de Magias\n\n"]
        
        # Receitas por escola
        output.append("## Receitas por Escola\n\n")
        for school in SpellSchool:
            recipes = self.list_recipes_by_school(school)
            if recipes:
                output.append(f"### {school.name}\n\n")
                for recipe in recipes:
                    output.extend([
                        f"#### {recipe.name} (Nível {recipe.level})\n\n",
                        f"*{recipe.description}*\n\n",
                        "**Componentes:**\n",
                        ", ".join(comp.name for comp in recipe.components),
                        "\n\n"
                    ])
                    if recipe.material_components:
                        output.append("**Materiais:**\n")
                        for item, quantity in recipe.material_components.items():
                            output.append(f"- {item}: {quantity}\n")
                        output.append("\n")
        
        # Modificadores
        output.append("## Modificadores\n\n")
        for modifier in self.modifiers.values():
            output.extend([
                f"### {modifier.name}\n\n",
                f"*{modifier.description}*\n\n"
            ])
            if modifier.material_cost:
                output.append("**Custo Material:**\n")
                for item, quantity in modifier.material_cost.items():
                    output.append(f"- {item}: {quantity}\n")
                output.append("\n")
        
        return "".join(output)