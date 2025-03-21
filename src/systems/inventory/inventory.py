from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from .item import Item, ItemType, EquipmentSlot
from .equipment import Equipment

@dataclass
class InventorySlot:
    """Representa um slot no inventário."""
    item: Optional[Item] = None
    locked: bool = False

@dataclass
class Inventory:
    """Gerencia o inventário do personagem."""
    max_slots: int
    max_weight: float
    slots: List[InventorySlot] = field(default_factory=list)
    equipped_items: Dict[EquipmentSlot, Optional[Equipment]] = field(default_factory=dict)
    gold: int = 0
    
    def __post_init__(self):
        # Inicializa slots vazios
        self.slots = [InventorySlot() for _ in range(self.max_slots)]
        
        # Inicializa slots de equipamento
        for slot in EquipmentSlot:
            self.equipped_items[slot] = None
    
    @property
    def current_weight(self) -> float:
        """Calcula o peso total dos itens no inventário."""
        total = 0.0
        for slot in self.slots:
            if slot.item:
                total += slot.item.weight * slot.item.current_stack
        return total
    
    @property
    def free_slots(self) -> int:
        """Retorna o número de slots livres."""
        return sum(1 for slot in self.slots if not slot.item and not slot.locked)
    
    def get_items_by_type(self, item_type: ItemType) -> List[Item]:
        """Retorna todos os itens de um tipo específico."""
        return [slot.item for slot in self.slots 
                if slot.item and slot.item.item_type == item_type]
    
    def find_item(self, item_name: str) -> List[Tuple[int, Item]]:
        """Encontra todos os slots que contém um item com o nome especificado."""
        return [(i, slot.item) for i, slot in enumerate(self.slots)
                if slot.item and slot.item.name == item_name]
    
    def has_space_for(self, item: Item) -> bool:
        """Verifica se há espaço para adicionar um item."""
        # Verifica peso
        if self.current_weight + (item.weight * item.current_stack) > self.max_weight:
            return False
        
        # Se o item é empilhável, procura pilhas existentes
        if item.stackable:
            for slot in self.slots:
                if slot.item and slot.item.can_stack_with(item):
                    if slot.item.current_stack + item.current_stack <= slot.item.max_stack:
                        return True
        
        # Procura slot vazio
        return self.free_slots > 0
    
    def add_item(self, item: Item) -> bool:
        """Adiciona um item ao inventário."""
        if not self.has_space_for(item):
            return False
        
        # Tenta empilhar com itens existentes
        if item.stackable:
            for slot in self.slots:
                if slot.item and slot.item.can_stack_with(item):
                    if slot.item.stack_with(item):
                        return True
        
        # Procura slot vazio
        for slot in self.slots:
            if not slot.item and not slot.locked:
                slot.item = item
                return True
        
        return False
    
    def remove_item(self, slot_index: int, amount: int = 1) -> Optional[Item]:
        """Remove um item de um slot específico."""
        if slot_index < 0 or slot_index >= len(self.slots):
            return None
            
        slot = self.slots[slot_index]
        if not slot.item or slot.locked:
            return None
        
        if slot.item.stackable and amount < slot.item.current_stack:
            return slot.item.split_stack(amount)
        else:
            item = slot.item
            slot.item = None
            return item
    
    def equip_item(self, slot_index: int, character: Any) -> bool:
        """Equipa um item de um slot específico."""
        if slot_index < 0 or slot_index >= len(self.slots):
            return False
            
        slot = self.slots[slot_index]
        if not slot.item or not isinstance(slot.item, Equipment):
            return False
            
        equipment = slot.item
        if not equipment.can_be_equipped_by(character):
            return False
        
        # Se já houver um item equipado neste slot, desequipa primeiro
        current_equipped = self.equipped_items[equipment.slot]
        if current_equipped:
            self.unequip_item(equipment.slot, character)
        
        # Equipa o novo item
        self.equipped_items[equipment.slot] = equipment
        equipment.on_equip(character)
        slot.item = None
        
        return True
    
    def unequip_item(self, slot: EquipmentSlot, character: Any) -> bool:
        """Desequipa um item de um slot de equipamento."""
        equipment = self.equipped_items[slot]
        if not equipment:
            return False
        
        # Verifica se há espaço no inventário
        if not self.has_space_for(equipment):
            return False
        
        # Remove o item do slot de equipamento
        self.equipped_items[slot] = None
        equipment.on_unequip(character)
        
        # Adiciona o item ao inventário
        self.add_item(equipment)
        
        return True
    
    def use_item(self, slot_index: int, character: Any) -> bool:
        """Usa um item de um slot específico."""
        if slot_index < 0 or slot_index >= len(self.slots):
            return False
            
        slot = self.slots[slot_index]
        if not slot.item or slot.locked:
            return False
        
        # Tenta usar o item
        if hasattr(slot.item, 'use') and slot.item.use(character):
            # Remove o item se foi totalmente consumido
            if slot.item.current_stack <= 0:
                slot.item = None
            return True
        
        return False
    
    def sort_inventory(self, sort_key: str = 'name') -> None:
        """Organiza o inventário baseado em um critério."""
        # Coleta todos os itens não nulos
        items = [(i, slot.item) for i, slot in enumerate(self.slots) if slot.item]
        
        # Ordena baseado no critério
        if sort_key == 'name':
            items.sort(key=lambda x: x[1].name)
        elif sort_key == 'type':
            items.sort(key=lambda x: x[1].item_type.name)
        elif sort_key == 'value':
            items.sort(key=lambda x: x[1].value, reverse=True)
        elif sort_key == 'weight':
            items.sort(key=lambda x: x[1].weight)
        
        # Limpa todos os slots
        for slot in self.slots:
            if not slot.locked:
                slot.item = None
        
        # Recoloca os itens em ordem
        for i, (_, item) in enumerate(items):
            self.slots[i].item = item
    
    def lock_slot(self, slot_index: int) -> bool:
        """Trava um slot para que não possa ser usado."""
        if slot_index < 0 or slot_index >= len(self.slots):
            return False
            
        self.slots[slot_index].locked = True
        return True
    
    def unlock_slot(self, slot_index: int) -> bool:
        """Destrava um slot."""
        if slot_index < 0 or slot_index >= len(self.slots):
            return False
            
        self.slots[slot_index].locked = False
        return True
    
    def add_gold(self, amount: int) -> None:
        """Adiciona ouro ao inventário."""
        self.gold += amount
    
    def remove_gold(self, amount: int) -> bool:
        """Remove ouro do inventário."""
        if amount > self.gold:
            return False
            
        self.gold -= amount
        return True
    
    def get_total_value(self) -> int:
        """Calcula o valor total de todos os itens no inventário."""
        total = self.gold
        for slot in self.slots:
            if slot.item:
                total += slot.item.value * slot.item.current_stack
        return total