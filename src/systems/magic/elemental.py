from typing import Dict, List, Tuple
from dataclasses import dataclass
from enum import Enum, auto
from .spell import Element

class ElementalInteraction(Enum):
    STRONG = auto()    # Dobro de dano
    WEAK = auto()      # Metade do dano
    NEUTRAL = auto()   # Dano normal
    IMMUNE = auto()    # Nenhum dano
    ABSORB = auto()    # Cura ao invés de dano
    REFLECT = auto()   # Reflete o dano

@dataclass
class ElementalSystem:
    """Sistema que gerencia interações entre elementos."""
    
    def __post_init__(self):
        # Define as relações entre elementos
        self.interactions: Dict[Element, Dict[Element, ElementalInteraction]] = {
            Element.PHYSICAL: {
                Element.PHYSICAL: ElementalInteraction.NEUTRAL,
                Element.FIRE: ElementalInteraction.NEUTRAL,
                Element.ICE: ElementalInteraction.STRONG,
                Element.LIGHTNING: ElementalInteraction.NEUTRAL,
                Element.EARTH: ElementalInteraction.WEAK,
                Element.WIND: ElementalInteraction.NEUTRAL,
                Element.LIGHT: ElementalInteraction.WEAK,
                Element.DARK: ElementalInteraction.NEUTRAL,
                Element.ARCANE: ElementalInteraction.WEAK
            },
            Element.FIRE: {
                Element.PHYSICAL: ElementalInteraction.NEUTRAL,
                Element.FIRE: ElementalInteraction.WEAK,
                Element.ICE: ElementalInteraction.STRONG,
                Element.LIGHTNING: ElementalInteraction.NEUTRAL,
                Element.EARTH: ElementalInteraction.WEAK,
                Element.WIND: ElementalInteraction.NEUTRAL,
                Element.LIGHT: ElementalInteraction.NEUTRAL,
                Element.DARK: ElementalInteraction.STRONG,
                Element.ARCANE: ElementalInteraction.NEUTRAL
            },
            Element.ICE: {
                Element.PHYSICAL: ElementalInteraction.WEAK,
                Element.FIRE: ElementalInteraction.WEAK,
                Element.ICE: ElementalInteraction.WEAK,
                Element.LIGHTNING: ElementalInteraction.STRONG,
                Element.EARTH: ElementalInteraction.NEUTRAL,
                Element.WIND: ElementalInteraction.STRONG,
                Element.LIGHT: ElementalInteraction.NEUTRAL,
                Element.DARK: ElementalInteraction.NEUTRAL,
                Element.ARCANE: ElementalInteraction.NEUTRAL
            },
            Element.LIGHTNING: {
                Element.PHYSICAL: ElementalInteraction.NEUTRAL,
                Element.FIRE: ElementalInteraction.NEUTRAL,
                Element.ICE: ElementalInteraction.WEAK,
                Element.LIGHTNING: ElementalInteraction.WEAK,
                Element.EARTH: ElementalInteraction.STRONG,
                Element.WIND: ElementalInteraction.WEAK,
                Element.LIGHT: ElementalInteraction.STRONG,
                Element.DARK: ElementalInteraction.WEAK,
                Element.ARCANE: ElementalInteraction.NEUTRAL
            },
            Element.EARTH: {
                Element.PHYSICAL: ElementalInteraction.STRONG,
                Element.FIRE: ElementalInteraction.STRONG,
                Element.ICE: ElementalInteraction.NEUTRAL,
                Element.LIGHTNING: ElementalInteraction.WEAK,
                Element.EARTH: ElementalInteraction.NEUTRAL,
                Element.WIND: ElementalInteraction.WEAK,
                Element.LIGHT: ElementalInteraction.NEUTRAL,
                Element.DARK: ElementalInteraction.STRONG,
                Element.ARCANE: ElementalInteraction.WEAK
            },
            Element.WIND: {
                Element.PHYSICAL: ElementalInteraction.NEUTRAL,
                Element.FIRE: ElementalInteraction.STRONG,
                Element.ICE: ElementalInteraction.WEAK,
                Element.LIGHTNING: ElementalInteraction.STRONG,
                Element.EARTH: ElementalInteraction.STRONG,
                Element.WIND: ElementalInteraction.WEAK,
                Element.LIGHT: ElementalInteraction.NEUTRAL,
                Element.DARK: ElementalInteraction.NEUTRAL,
                Element.ARCANE: ElementalInteraction.NEUTRAL
            },
            Element.LIGHT: {
                Element.PHYSICAL: ElementalInteraction.STRONG,
                Element.FIRE: ElementalInteraction.NEUTRAL,
                Element.ICE: ElementalInteraction.NEUTRAL,
                Element.LIGHTNING: ElementalInteraction.WEAK,
                Element.EARTH: ElementalInteraction.NEUTRAL,
                Element.WIND: ElementalInteraction.NEUTRAL,
                Element.LIGHT: ElementalInteraction.WEAK,
                Element.DARK: ElementalInteraction.STRONG,
                Element.ARCANE: ElementalInteraction.WEAK
            },
            Element.DARK: {
                Element.PHYSICAL: ElementalInteraction.NEUTRAL,
                Element.FIRE: ElementalInteraction.WEAK,
                Element.ICE: ElementalInteraction.NEUTRAL,
                Element.LIGHTNING: ElementalInteraction.STRONG,
                Element.EARTH: ElementalInteraction.WEAK,
                Element.WIND: ElementalInteraction.NEUTRAL,
                Element.LIGHT: ElementalInteraction.STRONG,
                Element.DARK: ElementalInteraction.WEAK,
                Element.ARCANE: ElementalInteraction.STRONG
            },
            Element.ARCANE: {
                Element.PHYSICAL: ElementalInteraction.STRONG,
                Element.FIRE: ElementalInteraction.NEUTRAL,
                Element.ICE: ElementalInteraction.NEUTRAL,
                Element.LIGHTNING: ElementalInteraction.NEUTRAL,
                Element.EARTH: ElementalInteraction.STRONG,
                Element.WIND: ElementalInteraction.NEUTRAL,
                Element.LIGHT: ElementalInteraction.STRONG,
                Element.DARK: ElementalInteraction.STRONG,
                Element.ARCANE: ElementalInteraction.REFLECT
            }
        }
        
        # Define combinações de elementos que criam novos efeitos
        self.combinations: Dict[Tuple[Element, Element], Tuple[str, float]] = {
            (Element.FIRE, Element.ICE): ("Steam", 1.5),      # Dano aumentado
            (Element.FIRE, Element.EARTH): ("Lava", 2.0),     # Dano muito aumentado
            (Element.ICE, Element.WIND): ("Blizzard", 1.8),   # Dano aumentado + Slow
            (Element.LIGHTNING, Element.WATER): ("Shock", 2.0), # Dano aumentado + Stun
            (Element.LIGHT, Element.DARK): ("Void", 2.5),     # Dano massivo
            (Element.FIRE, Element.WIND): ("Inferno", 1.8),   # DoT aumentado
            (Element.EARTH, Element.WIND): ("Sandstorm", 1.5) # Dano + Blind
        }
    
    def get_interaction(self, attacker: Element, defender: Element) -> ElementalInteraction:
        """Retorna a interação entre dois elementos."""
        return self.interactions[attacker][defender]
    
    def calculate_damage_multiplier(self, interaction: ElementalInteraction) -> float:
        """Calcula o multiplicador de dano baseado na interação."""
        multipliers = {
            ElementalInteraction.STRONG: 2.0,
            ElementalInteraction.WEAK: 0.5,
            ElementalInteraction.NEUTRAL: 1.0,
            ElementalInteraction.IMMUNE: 0.0,
            ElementalInteraction.ABSORB: -1.0,  # Negativo para indicar cura
            ElementalInteraction.REFLECT: 0.0   # Tratado separadamente
        }
        return multipliers[interaction]
    
    def get_combination_effect(self, element1: Element, element2: Element) -> Optional[Tuple[str, float]]:
        """Retorna o efeito da combinação de dois elementos, se existir."""
        combo = (element1, element2)
        reverse_combo = (element2, element1)
        
        return self.combinations.get(combo) or self.combinations.get(reverse_combo)
    
    def get_effective_elements(self, element: Element) -> List[Element]:
        """Retorna uma lista de elementos contra os quais o elemento é efetivo."""
        return [def_element for def_element in Element 
                if self.interactions[element][def_element] == ElementalInteraction.STRONG]
    
    def get_weak_elements(self, element: Element) -> List[Element]:
        """Retorna uma lista de elementos contra os quais o elemento é fraco."""
        return [def_element for def_element in Element 
                if self.interactions[element][def_element] == ElementalInteraction.WEAK]
    
    def get_immune_elements(self, element: Element) -> List[Element]:
        """Retorna uma lista de elementos aos quais o elemento é imune."""
        return [def_element for def_element in Element 
                if self.interactions[element][def_element] == ElementalInteraction.IMMUNE]
    
    def calculate_total_damage(self, base_damage: int, attacker: Element, 
                             defender: Element, resistances: Dict[Element, float] = None) -> int:
        """Calcula o dano total considerando elementos e resistências."""
        interaction = self.get_interaction(attacker, defender)
        multiplier = self.calculate_damage_multiplier(interaction)
        
        # Aplica resistências elementais se existirem
        if resistances and defender in resistances:
            resistance_multiplier = max(0, 1 - resistances[defender])
            multiplier *= resistance_multiplier
        
        return int(base_damage * multiplier)