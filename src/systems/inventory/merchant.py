from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum, auto
from .item import Item, ItemType, ItemRarity

class MerchantType(Enum):
    GENERAL = auto()      # Itens gerais
    BLACKSMITH = auto()   # Armas e armaduras
    ALCHEMIST = auto()    # Poções e ingredientes
    ENCHANTER = auto()    # Itens mágicos
    JEWELER = auto()      # Jóias e acessórios
    TAILOR = auto()       # Roupas e tecidos
    CARPENTER = auto()    # Itens de madeira
    EXOTIC = auto()       # Itens raros

class ReputationLevel(Enum):
    HOSTILE = (-100, 0.0, 2.0)      # (limite, desconto, markup)
    UNFRIENDLY = (0, 0.0, 1.5)
    NEUTRAL = (1000, 0.0, 1.2)
    FRIENDLY = (2500, 0.1, 1.1)
    HONORED = (5000, 0.15, 1.0)
    EXALTED = (10000, 0.25, 0.9)
    
    def __init__(self, threshold: int, discount: float, markup: float):
        self.threshold = threshold
        self.discount = discount
        self.markup = markup

@dataclass
class MerchantStock:
    """Representa o estoque de um item."""
    item: Item
    base_price: int
    quantity: int
    restock_rate: int = 1     # Quantidade por restock
    restock_time: float = 3600 # Tempo em segundos (1 hora)
    last_restock: float = 0
    max_quantity: int = 10
    min_reputation: ReputationLevel = ReputationLevel.NEUTRAL

@dataclass
class Merchant:
    """Representa um comerciante no jogo."""
    name: str
    merchant_type: MerchantType
    stock: Dict[str, MerchantStock] = field(default_factory=dict)
    reputation: Dict[str, int] = field(default_factory=dict)  # Por facção
    gold: int = 1000
    max_gold: int = 10000
    gold_regen_rate: int = 100  # Por hora
    last_gold_regen: float = 0
    buy_markup: float = 1.2     # 20% acima do valor base
    sell_markup: float = 0.8     # 20% abaixo do valor base
    specialties: List[ItemType] = field(default_factory=list)
    
    def add_item(self, item: Item, quantity: int, base_price: int) -> None:
        """Adiciona um item ao estoque do comerciante."""
        if item.name not in self.stock:
            self.stock[item.name] = MerchantStock(
                item=item,
                base_price=base_price,
                quantity=quantity
            )
        else:
            self.stock[item.name].quantity = min(
                self.stock[item.name].quantity + quantity,
                self.stock[item.name].max_quantity
            )
    
    def remove_item(self, item_name: str, quantity: int = 1) -> Optional[Item]:
        """Remove um item do estoque."""
        if item_name in self.stock and self.stock[item_name].quantity >= quantity:
            self.stock[item_name].quantity -= quantity
            return self.stock[item_name].item
        return None
    
    def get_buy_price(self, item: Item, faction: str) -> int:
        """Calcula o preço de compra de um item (quanto o comerciante paga)."""
        base_price = item.value
        
        # Aplica modificador de especialidade
        if item.item_type in self.specialties:
            base_price *= 1.1  # 10% a mais para itens de especialidade
        
        # Aplica modificador de reputação
        rep_level = self.get_reputation_level(faction)
        price = base_price * (1 - rep_level.discount) * self.sell_markup
        
        return int(price)
    
    def get_sell_price(self, item_name: str, faction: str) -> int:
        """Calcula o preço de venda de um item (quanto o jogador paga)."""
        if item_name not in self.stock:
            return 0
            
        stock_item = self.stock[item_name]
        base_price = stock_item.base_price
        
        # Aplica modificador de reputação
        rep_level = self.get_reputation_level(faction)
        price = base_price * rep_level.markup * self.buy_markup
        
        return int(price)
    
    def can_buy(self, item: Item, quantity: int = 1) -> bool:
        """Verifica se o comerciante pode comprar um item."""
        buy_price = self.get_buy_price(item, "neutral") * quantity
        return self.gold >= buy_price
    
    def can_sell(self, item_name: str, quantity: int = 1) -> bool:
        """Verifica se o comerciante pode vender um item."""
        return (
            item_name in self.stock and
            self.stock[item_name].quantity >= quantity
        )
    
    def buy_from_player(self, item: Item, quantity: int, faction: str) -> int:
        """Compra itens do jogador."""
        if not self.can_buy(item, quantity):
            return 0
            
        total_price = self.get_buy_price(item, faction) * quantity
        self.gold -= total_price
        self.add_item(item, quantity, item.value)
        
        return total_price
    
    def sell_to_player(self, item_name: str, quantity: int, faction: str) -> Optional[tuple[Item, int]]:
        """Vende itens para o jogador."""
        if not self.can_sell(item_name, quantity):
            return None
            
        item = self.remove_item(item_name, quantity)
        if item:
            total_price = self.get_sell_price(item_name, faction) * quantity
            self.gold += total_price
            return (item, total_price)
        
        return None
    
    def update_stock(self, current_time: float) -> None:
        """Atualiza o estoque do comerciante."""
        for stock in self.stock.values():
            if current_time - stock.last_restock >= stock.restock_time:
                restock_amount = stock.restock_rate * int(
                    (current_time - stock.last_restock) / stock.restock_time
                )
                stock.quantity = min(
                    stock.quantity + restock_amount,
                    stock.max_quantity
                )
                stock.last_restock = current_time
    
    def update_gold(self, current_time: float) -> None:
        """Atualiza o ouro do comerciante."""
        if current_time - self.last_gold_regen >= 3600:  # 1 hora
            regen_amount = self.gold_regen_rate * int(
                (current_time - self.last_gold_regen) / 3600
            )
            self.gold = min(self.gold + regen_amount, self.max_gold)
            self.last_gold_regen = current_time
    
    def modify_reputation(self, faction: str, amount: int) -> None:
        """Modifica a reputação com uma facção."""
        if faction not in self.reputation:
            self.reputation[faction] = 0
        self.reputation[faction] = max(-10000, min(10000, self.reputation[faction] + amount))
    
    def get_reputation_level(self, faction: str) -> ReputationLevel:
        """Retorna o nível de reputação atual com uma facção."""
        rep = self.reputation.get(faction, 0)
        
        for level in reversed(list(ReputationLevel)):
            if rep >= level.threshold:
                return level
        
        return ReputationLevel.HOSTILE
    
    def get_available_items(self, faction: str) -> List[tuple[Item, int, int]]:
        """Retorna lista de itens disponíveis com preços."""
        rep_level = self.get_reputation_level(faction)
        available = []
        
        for name, stock in self.stock.items():
            if stock.quantity > 0 and rep_level.value >= stock.min_reputation.value:
                price = self.get_sell_price(name, faction)
                available.append((stock.item, stock.quantity, price))
        
        return available