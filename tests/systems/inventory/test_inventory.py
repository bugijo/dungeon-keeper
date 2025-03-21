import pytest
from src.systems.inventory.inventory import Inventory, InventorySlot
from src.systems.inventory.item import Item, ItemType, ItemRarity
from src.systems.inventory.equipment import Equipment, EquipmentSlot

@pytest.fixture
def empty_inventory():
    return Inventory(max_slots=10, max_weight=50.0)

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
def heavy_item():
    return Item(
        name="Heavy Item",
        description="A heavy item",
        item_type=ItemType.MATERIAL,
        rarity=ItemRarity.COMMON,
        weight=30.0,
        value=100
    )

@pytest.fixture
def stackable_item():
    return Item(
        name="Stackable Item",
        description="A stackable item",
        item_type=ItemType.MATERIAL,
        rarity=ItemRarity.COMMON,
        weight=0.5,
        value=5,
        stackable=True,
        max_stack=10,
        current_stack=5
    )

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
        defense=0
    )

class MockCharacter:
    def __init__(self, level=10):
        self.level = level
        self.character_class = "Warrior"
        self.stats = {
            "attack": 5,
            "defense": 5,
            "magic_attack": 5,
            "magic_defense": 5
        }
    
    def modify_stat(self, stat, value):
        self.stats[stat] += value
    
    def get_stat(self, stat):
        return self.stats[stat]

def test_inventory_creation(empty_inventory):
    assert empty_inventory.max_slots == 10
    assert empty_inventory.max_weight == 50.0
    assert len(empty_inventory.slots) == 10
    assert empty_inventory.free_slots == 10
    assert empty_inventory.current_weight == 0.0

def test_add_item(empty_inventory, basic_item):
    assert empty_inventory.add_item(basic_item)
    assert empty_inventory.free_slots == 9
    assert empty_inventory.current_weight == 1.0

def test_weight_limit(empty_inventory, heavy_item):
    # Primeiro item pesado deve ser adicionado
    assert empty_inventory.add_item(heavy_item)
    
    # Segundo item pesado não deve ser adicionado (excederia o limite)
    assert not empty_inventory.add_item(heavy_item)

def test_stack_items(empty_inventory, stackable_item):
    # Adiciona primeiro item empilhável
    assert empty_inventory.add_item(stackable_item)
    
    # Cria e adiciona segundo item empilhável
    second_item = Item(
        name="Stackable Item",
        description="A stackable item",
        item_type=ItemType.MATERIAL,
        rarity=ItemRarity.COMMON,
        weight=0.5,
        value=5,
        stackable=True,
        max_stack=10,
        current_stack=3
    )
    
    assert empty_inventory.add_item(second_item)
    assert empty_inventory.free_slots == 9  # Apenas um slot usado
    assert empty_inventory.slots[0].item.current_stack == 8

def test_remove_item(empty_inventory, basic_item):
    empty_inventory.add_item(basic_item)
    removed_item = empty_inventory.remove_item(0)
    
    assert removed_item == basic_item
    assert empty_inventory.free_slots == 10
    assert empty_inventory.current_weight == 0.0

def test_equip_unequip(empty_inventory, basic_equipment):
    character = MockCharacter()
    
    # Adiciona e equipa o item
    empty_inventory.add_item(basic_equipment)
    assert empty_inventory.equip_item(0, character)
    
    # Verifica se o item está equipado
    assert empty_inventory.equipped_items[EquipmentSlot.MAIN_HAND] == basic_equipment
    assert character.stats["attack"] == 15  # 5 base + 10 do equipamento
    
    # Desequipa o item
    assert empty_inventory.unequip_item(EquipmentSlot.MAIN_HAND, character)
    assert empty_inventory.equipped_items[EquipmentSlot.MAIN_HAND] is None
    assert character.stats["attack"] == 5

def test_inventory_sort(empty_inventory):
    # Adiciona vários itens
    items = [
        Item("Z Item", "Test", ItemType.MATERIAL, ItemRarity.COMMON, 1.0, 10),
        Item("A Item", "Test", ItemType.MATERIAL, ItemRarity.COMMON, 1.0, 20),
        Item("M Item", "Test", ItemType.MATERIAL, ItemRarity.COMMON, 1.0, 30)
    ]
    
    for item in items:
        empty_inventory.add_item(item)
    
    # Ordena por nome
    empty_inventory.sort_inventory("name")
    assert empty_inventory.slots[0].item.name == "A Item"
    assert empty_inventory.slots[1].item.name == "M Item"
    assert empty_inventory.slots[2].item.name == "Z Item"
    
    # Ordena por valor
    empty_inventory.sort_inventory("value")
    assert empty_inventory.slots[0].item.value == 30
    assert empty_inventory.slots[1].item.value == 20
    assert empty_inventory.slots[2].item.value == 10

def test_gold_management(empty_inventory):
    empty_inventory.add_gold(100)
    assert empty_inventory.gold == 100
    
    assert empty_inventory.remove_gold(30)
    assert empty_inventory.gold == 70
    
    assert not empty_inventory.remove_gold(100)  # Não tem ouro suficiente
    assert empty_inventory.gold == 70

def test_slot_lock(empty_inventory, basic_item):
    # Trava o primeiro slot
    empty_inventory.lock_slot(0)
    
    # Tenta adicionar item no slot travado
    assert empty_inventory.add_item(basic_item)
    assert empty_inventory.slots[0].item is None  # Slot travado não deve receber item
    assert empty_inventory.slots[1].item == basic_item  # Item deve ir para próximo slot disponível
    
    # Destrava o slot
    empty_inventory.unlock_slot(0)
    assert not empty_inventory.slots[0].locked