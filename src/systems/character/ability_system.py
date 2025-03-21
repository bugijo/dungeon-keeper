from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field
from enum import Enum, auto
from ..combat.damage_type import DamageType
from ..combat.ability_effect import AbilityEffect

class AbilityType(Enum):
    PASSIVE = auto()    # Habilidades passivas
    ACTIVE = auto()     # Habilidades ativas
    REACTION = auto()   # Habilidades de reação
    RITUAL = auto()     # Habilidades rituais

class AbilityResource(Enum):
    NONE = auto()       # Sem custo
    MANA = auto()       # Custo em mana
    STAMINA = auto()    # Custo em stamina
    HEALTH = auto()     # Custo em vida
    CHARGE = auto()     # Cargas limitadas

@dataclass
class AbilityCost:
    """Custo de uso de uma habilidade."""
    resource_type: AbilityResource
    amount: int = 0
    charges: int = 0  # Para habilidades baseadas em cargas

@dataclass
class AbilityRequirement:
    """Requisitos para usar uma habilidade."""
    level: int = 1
    attributes: Dict[str, int] = field(default_factory=dict)
    equipment_types: Set[str] = field(default_factory=set)
    prerequisites: Set[str] = field(default_factory=set)  # Outras habilidades necessárias

@dataclass
class Ability:
    """Representa uma habilidade do personagem."""
    name: str
    description: str
    ability_type: AbilityType
    cost: AbilityCost
    requirements: AbilityRequirement
    effects: List[AbilityEffect] = field(default_factory=list)
    cooldown: int = 0  # Em turnos
    range: str = "pessoal"
    area: str = "nenhuma"
    duration: str = "instantâneo"
    current_cooldown: int = 0
    is_enabled: bool = True

@dataclass
class AbilityTree:
    """Representa uma árvore de habilidades."""
    name: str
    description: str
    abilities: Dict[str, Ability] = field(default_factory=dict)
    prerequisites: Dict[str, Set[str]] = field(default_factory=dict)

@dataclass
class AbilitySystem:
    """Sistema de gerenciamento de habilidades."""
    trees: Dict[str, AbilityTree] = field(default_factory=dict)
    learned_abilities: Dict[str, Ability] = field(default_factory=dict)
    
    def __post_init__(self):
        self._initialize_default_content()
    
    def _initialize_default_content(self):
        """Inicializa o conteúdo padrão do sistema."""
        # Árvore de Combate
        combat_tree = AbilityTree(
            "Combate",
            "Habilidades focadas em combate corpo a corpo e à distância"
        )
        
        # Adiciona habilidades básicas de combate
        combat_tree.abilities["golpe_preciso"] = Ability(
            "Golpe Preciso",
            "Um ataque preciso que causa dano adicional.",
            AbilityType.ACTIVE,
            AbilityCost(AbilityResource.STAMINA, 10),
            AbilityRequirement(level=1),
            effects=[AbilityEffect("damage", {"physical": 6})],
            cooldown=2
        )
        
        combat_tree.abilities["postura_defensiva"] = Ability(
            "Postura Defensiva",
            "Assume uma postura defensiva, aumentando a defesa.",
            AbilityType.ACTIVE,
            AbilityCost(AbilityResource.STAMINA, 15),
            AbilityRequirement(level=2),
            effects=[AbilityEffect("buff", {"defense": 3, "duration": 3})],
            cooldown=4
        )
        
        self.trees["combate"] = combat_tree
        
        # Árvore de Utilidade
        utility_tree = AbilityTree(
            "Utilidade",
            "Habilidades de suporte e utilidade geral"
        )
        
        utility_tree.abilities["primeiros_socorros"] = Ability(
            "Primeiros Socorros",
            "Cura ferimentos leves.",
            AbilityType.ACTIVE,
            AbilityCost(AbilityResource.NONE),
            AbilityRequirement(level=1),
            effects=[AbilityEffect("heal", {"amount": 5})],
            cooldown=6
        )
        
        self.trees["utilidade"] = utility_tree
    
    def add_ability_tree(self, name: str, description: str) -> None:
        """Adiciona uma nova árvore de habilidades."""
        self.trees[name] = AbilityTree(name, description)
    
    def add_ability(self, tree_name: str, ability: Ability,
                    prerequisites: Set[str] = None) -> bool:
        """Adiciona uma nova habilidade a uma árvore."""
        if tree_name not in self.trees:
            return False
        
        tree = self.trees[tree_name]
        tree.abilities[ability.name] = ability
        if prerequisites:
            tree.prerequisites[ability.name] = prerequisites
        
        return True
    
    def can_learn_ability(self, tree_name: str, ability_name: str,
                         character_level: int,
                         character_attributes: Dict[str, int]) -> bool:
        """Verifica se uma habilidade pode ser aprendida."""
        if tree_name not in self.trees:
            return False
        
        tree = self.trees[tree_name]
        if ability_name not in tree.abilities:
            return False
        
        ability = tree.abilities[ability_name]
        
        # Verifica nível
        if character_level < ability.requirements.level:
            return False
        
        # Verifica atributos
        for attr, required_value in ability.requirements.attributes.items():
            if attr not in character_attributes or \
               character_attributes[attr] < required_value:
                return False
        
        # Verifica pré-requisitos
        if ability_name in tree.prerequisites:
            for prereq in tree.prerequisites[ability_name]:
                if prereq not in self.learned_abilities:
                    return False
        
        return True
    
    def learn_ability(self, tree_name: str, ability_name: str,
                      character_level: int,
                      character_attributes: Dict[str, int]) -> bool:
        """Aprende uma nova habilidade."""
        if not self.can_learn_ability(tree_name, ability_name,
                                    character_level, character_attributes):
            return False
        
        ability = self.trees[tree_name].abilities[ability_name]
        self.learned_abilities[ability_name] = ability
        return True
    
    def can_use_ability(self, ability_name: str,
                        current_resources: Dict[AbilityResource, int]) -> bool:
        """Verifica se uma habilidade pode ser usada."""
        if ability_name not in self.learned_abilities:
            return False
        
        ability = self.learned_abilities[ability_name]
        
        # Verifica se está habilitada
        if not ability.is_enabled:
            return False
        
        # Verifica cooldown
        if ability.current_cooldown > 0:
            return False
        
        # Verifica recursos
        cost = ability.cost
        if cost.resource_type != AbilityResource.NONE:
            if cost.resource_type not in current_resources or \
               current_resources[cost.resource_type] < cost.amount:
                return False
        
        return True
    
    def use_ability(self, ability_name: str,
                    current_resources: Dict[AbilityResource, int]) -> Optional[List[AbilityEffect]]:
        """Usa uma habilidade, consumindo recursos e aplicando efeitos."""
        if not self.can_use_ability(ability_name, current_resources):
            return None
        
        ability = self.learned_abilities[ability_name]
        
        # Consome recursos
        if ability.cost.resource_type != AbilityResource.NONE:
            current_resources[ability.cost.resource_type] -= ability.cost.amount
        
        # Ativa cooldown
        ability.current_cooldown = ability.cooldown
        
        return ability.effects
    
    def update_cooldowns(self) -> None:
        """Atualiza os cooldowns de todas as habilidades."""
        for ability in self.learned_abilities.values():
            if ability.current_cooldown > 0:
                ability.current_cooldown -= 1
    
    def reset_cooldowns(self) -> None:
        """Reseta todos os cooldowns."""
        for ability in self.learned_abilities.values():
            ability.current_cooldown = 0
    
    def get_available_abilities(self,
                               current_resources: Dict[AbilityResource, int]) -> List[str]:
        """Retorna lista de habilidades disponíveis para uso."""
        return [name for name in self.learned_abilities.keys()
                if self.can_use_ability(name, current_resources)]
    
    def get_ability_tree(self, tree_name: str) -> Optional[AbilityTree]:
        """Retorna uma árvore de habilidades pelo nome."""
        return self.trees.get(tree_name)
    
    def get_ability_info(self, ability_name: str) -> Optional[Ability]:
        """Retorna informações detalhadas sobre uma habilidade."""
        return self.learned_abilities.get(ability_name)
    
    def export_to_markdown(self) -> str:
        """Exporta todas as árvores de habilidades em formato markdown."""
        output = ["# Árvores de Habilidades\n\n"]
        
        for tree_name, tree in self.trees.items():
            output.extend([
                f"## {tree.name}\n\n",
                f"*{tree.description}*\n\n"
            ])
            
            for ability_name, ability in tree.abilities.items():
                output.extend([
                    f"### {ability.name}\n\n",
                    f"*{ability.description}*\n\n",
                    f"**Tipo:** {ability.ability_type.name}\n\n",
                    f"**Custo:** {ability.cost.amount} {ability.cost.resource_type.name}\n\n",
                    f"**Cooldown:** {ability.cooldown} turnos\n\n"
                ])
                
                if ability.requirements.level > 1:
                    output.append(f"**Nível Mínimo:** {ability.requirements.level}\n\n")
                
                if ability.requirements.attributes:
                    output.append("**Atributos Necessários:**\n")
                    for attr, value in ability.requirements.attributes.items():
                        output.append(f"- {attr}: {value}\n")
                    output.append("\n")
                
                if ability_name in tree.prerequisites:
                    output.append("**Pré-requisitos:**\n")
                    for prereq in tree.prerequisites[ability_name]:
                        output.append(f"- {prereq}\n")
                    output.append("\n")
        
        return "".join(output)