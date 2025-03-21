from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from .spell import Spell, SpellSchool, SpellType, Element

@dataclass
class SpellSlot:
    """Representa um slot de magia equipada."""
    spell: Optional[Spell] = None
    locked: bool = False
    unlock_level: int = 1

@dataclass
class SpellBook:
    """Gerencia as magias do personagem."""
    max_equipped_spells: int
    equipped_slots: List[SpellSlot] = field(default_factory=list)
    known_spells: List[Spell] = field(default_factory=list)
    spell_experience: Dict[str, int] = field(default_factory=dict)
    school_levels: Dict[SpellSchool, int] = field(default_factory=dict)
    element_affinities: Dict[Element, int] = field(default_factory=dict)
    
    def __post_init__(self):
        # Inicializa slots de magias equipadas
        self.equipped_slots = [SpellSlot() for _ in range(self.max_equipped_spells)]
        
        # Inicializa níveis das escolas de magia
        for school in SpellSchool:
            self.school_levels[school] = 1
        
        # Inicializa afinidades elementais
        for element in Element:
            self.element_affinities[element] = 0
    
    def learn_spell(self, spell: Spell) -> bool:
        """Aprende uma nova magia."""
        if spell in self.known_spells:
            return False
        
        self.known_spells.append(spell)
        spell.is_learned = True
        self.spell_experience[spell.name] = 0
        return True
    
    def forget_spell(self, spell: Spell) -> bool:
        """Esquece uma magia."""
        if spell not in self.known_spells:
            return False
        
        # Remove dos slots equipados primeiro
        self.unequip_spell(spell)
        
        self.known_spells.remove(spell)
        spell.is_learned = False
        del self.spell_experience[spell.name]
        return True
    
    def equip_spell(self, spell: Spell, slot_index: int) -> bool:
        """Equipa uma magia em um slot específico."""
        if slot_index < 0 or slot_index >= len(self.equipped_slots):
            return False
            
        slot = self.equipped_slots[slot_index]
        if slot.locked:
            return False
        
        # Verifica se a magia já está equipada em outro slot
        for other_slot in self.equipped_slots:
            if other_slot.spell == spell:
                return False
        
        slot.spell = spell
        spell.is_equipped = True
        return True
    
    def unequip_spell(self, spell: Spell) -> bool:
        """Desequipa uma magia."""
        for slot in self.equipped_slots:
            if slot.spell == spell:
                slot.spell = None
                spell.is_equipped = False
                return True
        return False
    
    def get_equipped_spells(self) -> List[Spell]:
        """Retorna todas as magias equipadas."""
        return [slot.spell for slot in self.equipped_slots if slot.spell]
    
    def get_spells_by_school(self, school: SpellSchool) -> List[Spell]:
        """Retorna todas as magias conhecidas de uma escola."""
        return [spell for spell in self.known_spells if spell.school == school]
    
    def get_spells_by_type(self, spell_type: SpellType) -> List[Spell]:
        """Retorna todas as magias conhecidas de um tipo."""
        return [spell for spell in self.known_spells if spell.spell_type == spell_type]
    
    def get_spells_by_element(self, element: Element) -> List[Spell]:
        """Retorna todas as magias conhecidas de um elemento."""
        return [spell for spell in self.known_spells if spell.element == element]
    
    def add_spell_experience(self, spell: Spell, amount: int) -> None:
        """Adiciona experiência a uma magia."""
        if spell.name in self.spell_experience:
            self.spell_experience[spell.name] += amount
            # Aqui poderia adicionar lógica de evolução da magia
    
    def increase_school_level(self, school: SpellSchool, amount: int = 1) -> None:
        """Aumenta o nível de uma escola de magia."""
        if school in self.school_levels:
            self.school_levels[school] += amount
    
    def increase_element_affinity(self, element: Element, amount: int = 1) -> None:
        """Aumenta a afinidade com um elemento."""
        if element in self.element_affinities:
            self.element_affinities[element] += amount
    
    def get_spell_power_multiplier(self, spell: Spell) -> float:
        """Calcula o multiplicador de poder para uma magia."""
        school_bonus = (self.school_levels[spell.school] - 1) * 0.1  # 10% por nível
        element_bonus = self.element_affinities[spell.element] * 0.05  # 5% por nível
        experience_bonus = self.spell_experience[spell.name] * 0.01  # 1% por uso
        
        return 1.0 + school_bonus + element_bonus + experience_bonus
    
    def unlock_slot(self, slot_index: int, character_level: int) -> bool:
        """Destrava um slot de magia."""
        if slot_index < 0 or slot_index >= len(self.equipped_slots):
            return False
            
        slot = self.equipped_slots[slot_index]
        if character_level >= slot.unlock_level:
            slot.locked = False
            return True
        return False
    
    def reset_cooldowns(self) -> None:
        """Reseta o cooldown de todas as magias."""
        for spell in self.known_spells:
            spell.reset_cooldown()
    
    def restore_all_charges(self) -> None:
        """Restaura todas as cargas de todas as magias."""
        for spell in self.known_spells:
            if spell.max_charges:
                spell.current_charges = spell.max_charges
    
    def get_available_spells(self, character: Any) -> List[Spell]:
        """Retorna todas as magias que podem ser lançadas no momento."""
        return [spell for spell in self.known_spells if spell.can_cast(character)]
    
    def get_spell_by_name(self, name: str) -> Optional[Spell]:
        """Encontra uma magia pelo nome."""
        for spell in self.known_spells:
            if spell.name == name:
                return spell
        return None