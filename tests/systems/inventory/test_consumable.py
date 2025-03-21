import pytest
from src.systems.inventory.consumable import Consumable, ConsumableType, ConsumableEffect
from src.systems.inventory.item import ItemType, ItemRarity

@pytest.fixture
def health_potion():
    effect = ConsumableEffect(
        name="Heal",
        description="Restores health",
        instant_heal=50,
        duration=None
    )
    
    return Consumable(
        name="Health Potion",
        description="Restores 50 HP",
        item_type=ItemType.CONSUMABLE,
        rarity=ItemRarity.COMMON,
        weight=0.1,
        value=50,
        consumable_type=ConsumableType.POTION,
        stackable=True,
        max_stack=5,
        current_stack=3,
        effects=[effect]
    )

@pytest.fixture
def status_potion():
    effect = ConsumableEffect(
        name="Status Cure",
        description="Cures poison",
        status_cure=["poison"],
        duration=None
    )
    
    return Consumable(
        name="Antidote",
        description="Cures poison status",
        item_type=ItemType.CONSUMABLE,
        rarity=ItemRarity.COMMON,
        weight=0.1,
        value=30,
        consumable_type=ConsumableType.POTION,
        stackable=True,
        max_stack=5,
        current_stack=1,
        effects=[effect]
    )

class MockCharacter:
    def __init__(self):
        self.hp = 50
        self.max_hp = 100
        self.mp = 50
        self.max_mp = 100
        self.status_effects = ["poison"]
    
    def heal(self, amount):
        self.hp = min(self.hp + amount, self.max_hp)
    
    def restore_mana(self, amount):
        self.mp = min(self.mp + amount, self.max_mp)
    
    def remove_status_effect(self, effect):
        if effect in self.status_effects:
            self.status_effects.remove(effect)
    
    def add_status_effect(self, effect):
        if effect not in self.status_effects:
            self.status_effects.append(effect)

def test_consumable_creation(health_potion):
    assert health_potion.consumable_type == ConsumableType.POTION
    assert health_potion.item_type == ItemType.CONSUMABLE
    assert health_potion.current_stack == 3
    assert len(health_potion.effects) == 1

def test_health_potion_use(health_potion):
    character = MockCharacter()
    
    # Usa a poção
    assert health_potion.use(character)
    assert character.hp == 100  # 50 inicial + 50 da poção
    assert health_potion.current_stack == 2

def test_status_potion_use(status_potion):
    character = MockCharacter()
    assert "poison" in character.status_effects
    
    # Usa a poção
    assert status_potion.use(character)
    assert "poison" not in character.status_effects
    assert status_potion.current_stack == 0

def test_consumable_charges():
    effect = ConsumableEffect(
        name="Test",
        description="Test effect",
        instant_heal=10
    )
    
    item = Consumable(
        name="Limited Use Item",
        description="Has limited uses",
        item_type=ItemType.CONSUMABLE,
        rarity=ItemRarity.UNCOMMON,
        weight=1.0,
        value=100,
        consumable_type=ConsumableType.SCROLL,
        charges=3,
        effects=[effect]
    )
    
    character = MockCharacter()
    
    # Usa o item três vezes
    assert item.use(character)
    assert item.charges == 2
    
    assert item.use(character)
    assert item.charges == 1
    
    assert item.use(character)
    assert item.charges == 0
    
    # Tenta usar novamente
    assert not item.use(character)

def test_custom_use_effect():
    def custom_effect(character):
        character.hp += 100
        character.mp += 100
    
    item = Consumable(
        name="Custom Item",
        description="Has custom effect",
        item_type=ItemType.CONSUMABLE,
        rarity=ItemRarity.RARE,
        weight=1.0,
        value=200,
        consumable_type=ConsumableType.ELIXIR,
        custom_use_effect=custom_effect
    )
    
    character = MockCharacter()
    assert item.use(character)
    assert character.hp == 100
    assert character.mp == 100