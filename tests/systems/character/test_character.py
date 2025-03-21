import pytest
from src.systems.character.character import Character

@pytest.fixture
def character():
    return Character(name="Test Character")

@pytest.fixture
def item():
    class Item:
        def __init__(self, name):
            self.name = name
    return Item("Test Item")

@pytest.fixture
def ability():
    class Ability:
        def __init__(self, name):
            self.name = name
    return Ability("Test Ability")

def test_character_creation():
    char = Character(name="Test")
    assert char.name == "Test"
    assert char.level == 1
    assert char.experience == 0
    
    # Verifica stats padrão
    assert char.stats['strength'] == 10
    assert char.stats['dexterity'] == 10
    assert char.stats['constitution'] == 10
    assert char.stats['intelligence'] == 10
    assert char.stats['wisdom'] == 10
    assert char.stats['charisma'] == 10
    assert char.stats['hp'] == 10
    assert char.stats['max_hp'] == 10
    assert char.stats['mp'] == 10
    assert char.stats['max_mp'] == 10

def test_modify_stat(character):
    character.modify_stat('strength', 2)
    assert character.stats['strength'] == 12
    
    character.modify_stat('strength', -1)
    assert character.stats['strength'] == 11

def test_get_stat(character):
    assert character.get_stat('strength') == 10
    assert character.get_stat('nonexistent') is None

def test_is_alive(character):
    assert character.is_alive()
    character.stats['hp'] = 0
    assert not character.is_alive()

def test_heal(character):
    character.stats['hp'] = 5
    character.heal(3)
    assert character.stats['hp'] == 8
    
    # Teste de cura acima do máximo
    character.heal(10)
    assert character.stats['hp'] == character.stats['max_hp']

def test_take_damage(character):
    character.take_damage(5)
    assert character.stats['hp'] == 5
    
    # Teste de dano fatal
    character.take_damage(10)
    assert character.stats['hp'] == 0

def test_mana_management(character):
    # Teste de uso de mana
    assert character.use_mana(5)
    assert character.stats['mp'] == 5
    
    # Teste de uso de mana insuficiente
    assert not character.use_mana(10)
    assert character.stats['mp'] == 5
    
    # Teste de restauração de mana
    character.restore_mana(3)
    assert character.stats['mp'] == 8
    
    # Teste de restauração acima do máximo
    character.restore_mana(10)
    assert character.stats['mp'] == character.stats['max_mp']

def test_experience_and_leveling(character):
    # Adiciona experiência insuficiente para level up
    character.add_experience(500)
    assert character.level == 1
    assert character.experience == 500
    
    # Adiciona experiência suficiente para level up
    character.add_experience(500)
    assert character.level == 2
    assert character.experience == 1000
    
    # Verifica aumento de stats no level up
    assert character.stats['max_hp'] == 15  # 10 + 5
    assert character.stats['max_mp'] == 13  # 10 + 3

def test_inventory_management(character, item):
    # Adiciona item
    assert character.add_to_inventory(item)
    assert character.has_item("Test Item")
    
    # Remove item
    removed_item = character.remove_from_inventory("Test Item")
    assert removed_item == item
    assert not character.has_item("Test Item")
    
    # Tenta remover item inexistente
    assert character.remove_from_inventory("Nonexistent") is None

def test_equipment_management(character, item):
    # Equipa item
    assert character.equip_item("weapon", item)
    assert character.equipment["weapon"] == item
    
    # Desequipa item
    unequipped = character.unequip_item("weapon")
    assert unequipped == item
    assert "weapon" not in character.equipment
    assert character.has_item("Test Item")
    
    # Tenta desequipar slot vazio
    assert character.unequip_item("empty") is None

def test_ability_management(character, ability):
    # Adiciona habilidade
    character.add_ability("Test Ability", ability)
    assert character.has_ability("Test Ability")
    
    # Remove habilidade
    removed = character.remove_ability("Test Ability")
    assert removed == ability
    assert not character.has_ability("Test Ability")
    
    # Tenta remover habilidade inexistente
    assert character.remove_ability("Nonexistent") is None

def test_status_effect_management(character):
    effect = {"duration": 3, "power": 5}
    
    # Adiciona efeito
    character.add_status_effect("poison", effect)
    assert character.has_status_effect("poison")
    
    # Remove efeito
    removed = character.remove_status_effect("poison")
    assert removed == effect
    assert not character.has_status_effect("poison")
    
    # Tenta remover efeito inexistente
    assert character.remove_status_effect("nonexistent") is None