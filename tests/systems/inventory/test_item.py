import pytest
from src.systems.inventory.item import Item, ItemType, ItemRarity, ItemEffect

@pytest.fixture
def basic_item():
    return Item(
        name="Test Item",
        description="A test item",
        item_type=ItemType.MATERIAL,
        rarity=ItemRarity.COMMON,
        weight=1.0,
        value=10
    )

@pytest.fixture
def stackable_item():
    return Item(
        name="Stackable Item",
        description="A stackable test item",
        item_type=ItemType.MATERIAL,
        rarity=ItemRarity.COMMON,
        weight=0.1,
        value=5,
        stackable=True,
        max_stack=10,
        current_stack=5
    )

def test_item_creation(basic_item):
    assert basic_item.name == "Test Item"
    assert basic_item.item_type == ItemType.MATERIAL
    assert basic_item.rarity == ItemRarity.COMMON
    assert basic_item.weight == 1.0
    assert basic_item.value == 10
    assert not basic_item.stackable

def test_item_stacking(stackable_item):
    # Cria um item idêntico para empilhar
    other_item = Item(
        name="Stackable Item",
        description="A stackable test item",
        item_type=ItemType.MATERIAL,
        rarity=ItemRarity.COMMON,
        weight=0.1,
        value=5,
        stackable=True,
        max_stack=10,
        current_stack=3
    )
    
    assert stackable_item.can_stack_with(other_item)
    assert stackable_item.stack_with(other_item)
    assert stackable_item.current_stack == 8

def test_item_split_stack(stackable_item):
    split = stackable_item.split_stack(2)
    assert split is not None
    assert split.current_stack == 2
    assert stackable_item.current_stack == 3

def test_item_effects():
    effect = ItemEffect(
        name="Test Effect",
        description="A test effect",
        stat_modifiers={"strength": 5, "dexterity": 3},
        duration=None,
        is_permanent=True
    )
    
    item = Item(
        name="Effect Item",
        description="An item with effects",
        item_type=ItemType.ACCESSORY,
        rarity=ItemRarity.RARE,
        weight=0.5,
        value=100,
        effects=[effect]
    )
    
    # Mock character para testar efeitos
    class MockCharacter:
        def __init__(self):
            self.stats = {"strength": 10, "dexterity": 10}
        
        def modify_stat(self, stat, value):
            self.stats[stat] += value
        
        def get_stat(self, stat):
            return self.stats[stat]
    
    character = MockCharacter()
    
    # Aplica efeitos
    item.apply_effects(character)
    assert character.stats["strength"] == 15
    assert character.stats["dexterity"] == 13
    
    # Remove efeitos
    item.remove_effects(character)
    assert character.stats["strength"] == 10
    assert character.stats["dexterity"] == 10

def test_item_durability(basic_item):
    basic_item.durability = 10
    basic_item.max_durability = 10
    
    # Testa uso de durabilidade
    assert basic_item.use_durability()
    assert basic_item.durability == 9
    
    # Testa reparo
    basic_item.repair(5)
    assert basic_item.durability == 10  # Não deve exceder max_durability