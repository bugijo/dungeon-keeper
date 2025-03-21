import pytest
from src.systems.combat.damage_type import (
    DamageType,
    ResistanceType,
    DamageTypeManager
)
from src.systems.character.character import Character

@pytest.fixture
def mock_character():
    return Character(name="Test Character", stats={"hp": 100})

@pytest.fixture
def damage_manager():
    return DamageTypeManager()

def test_set_resistance(damage_manager, mock_character):
    damage_manager.set_resistance(mock_character, DamageType.FIRE, ResistanceType.RESISTANT)
    resistance = damage_manager.get_resistance(mock_character, DamageType.FIRE)
    assert resistance == ResistanceType.RESISTANT

def test_calculate_damage_normal(damage_manager, mock_character):
    damage = damage_manager.calculate_damage(10, DamageType.SLASHING, mock_character)
    assert damage == 10

def test_calculate_damage_resistant(damage_manager, mock_character):
    damage_manager.add_resistance(mock_character, DamageType.FIRE)
    damage = damage_manager.calculate_damage(10, DamageType.FIRE, mock_character)
    assert damage == 5

def test_calculate_damage_vulnerable(damage_manager, mock_character):
    damage_manager.add_vulnerability(mock_character, DamageType.COLD)
    damage = damage_manager.calculate_damage(10, DamageType.COLD, mock_character)
    assert damage == 20

def test_calculate_damage_immune(damage_manager, mock_character):
    damage_manager.add_immunity(mock_character, DamageType.POISON)
    damage = damage_manager.calculate_damage(10, DamageType.POISON, mock_character)
    assert damage == 0

def test_remove_special_resistance(damage_manager, mock_character):
    damage_manager.add_immunity(mock_character, DamageType.ACID)
    damage_manager.remove_special_resistance(mock_character, DamageType.ACID)
    resistance = damage_manager.get_resistance(mock_character, DamageType.ACID)
    assert resistance == ResistanceType.NORMAL