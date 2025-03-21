import pytest
from src.systems.inventory.equipment import Equipment
from src.systems.inventory.item import ItemType, ItemRarity, ItemEffect, EquipmentSlot

@pytest.fixture
def basic_equipment():
    return Equipment(
        name="Test Sword",
        description="A test sword",
        item_type=ItemType.WEAPON,
        rarity=ItemRarity.UNCOMMON,
        weight=2.0,
        value=100,
        slot=EquipmentSlot.MAIN_HAND,
        attack=10,
        defense=0,
        magic_attack=0,
        magic_defense=0,
        level_requirement=5
    )

@pytest.fixture
def enchanted_equipment():
    enchantment = ItemEffect(
        name="Fire Damage",
        description="Adds fire damage",
        stat_modifiers={"attack": 5, "magic_attack": 3}
    )
    
    return Equipment(
        name="Enchanted Sword",
        description="A magical sword",
        item_type=ItemType.WEAPON,
        rarity=ItemRarity.RARE,
        weight=2.0,
        value=500,
        slot=EquipmentSlot.MAIN_HAND,
        attack=15,
        defense=0,
        magic_attack=5,
        magic_defense=0,
        level_requirement=10,
        enchantments=[enchantment]
    )

class MockCharacter:
    def __init__(self, level=1):
        self.stats = {
            "strength": 10,
            "dexterity": 10,
            "defense": 5,
            "attack": 5,
            "magic_attack": 5,
            "magic_defense": 5
        }
        self.level = level
        self.character_class = "Warrior"
    
    def modify_stat(self, stat, value):
        self.stats[stat] += value
    
    def get_stat(self, stat):
        return self.stats[stat]

def test_equipment_creation(basic_equipment):
    assert basic_equipment.slot == EquipmentSlot.MAIN_HAND
    assert basic_equipment.attack == 10
    assert basic_equipment.level_requirement == 5
    assert not basic_equipment.stackable

def test_equipment_requirements(basic_equipment):
    low_level_char = MockCharacter(level=1)
    high_level_char = MockCharacter(level=10)
    
    assert not basic_equipment.can_be_equipped_by(low_level_char)
    assert basic_equipment.can_be_equipped_by(high_level_char)

def test_equipment_equip_unequip(basic_equipment):
    character = MockCharacter(level=10)
    
    # Testa equip
    basic_equipment.on_equip(character)
    assert character.stats["attack"] == 15  # 5 base + 10 do equipamento
    
    # Testa unequip
    basic_equipment.on_unequip(character)
    assert character.stats["attack"] == 5  # Volta ao valor base

def test_enchanted_equipment(enchanted_equipment):
    character = MockCharacter(level=10)
    
    # Verifica total de ataque com encantamentos
    assert enchanted_equipment.get_total_attack() == 20  # 15 base + 5 do encantamento
    assert enchanted_equipment.get_total_magic_attack() == 8  # 5 base + 3 do encantamento
    
    # Testa equip com encantamentos
    enchanted_equipment.on_equip(character)
    assert character.stats["attack"] == 25  # 5 base + 15 equip + 5 enchant
    assert character.stats["magic_attack"] == 13  # 5 base + 5 equip + 3 enchant
    
    # Testa unequip
    enchanted_equipment.on_unequip(character)
    assert character.stats["attack"] == 5
    assert character.stats["magic_attack"] == 5

def test_add_remove_enchantment(basic_equipment):
    new_enchant = ItemEffect(
        name="Strength Boost",
        description="Increases strength",
        stat_modifiers={"attack": 3}
    )
    
    # Adiciona encantamento
    basic_equipment.add_enchantment(new_enchant)
    assert len(basic_equipment.enchantments) == 1
    assert basic_equipment.get_total_attack() == 13  # 10 base + 3 do encantamento
    
    # Remove encantamento
    basic_equipment.remove_enchantment(new_enchant)
    assert len(basic_equipment.enchantments) == 0
    assert basic_equipment.get_total_attack() == 10