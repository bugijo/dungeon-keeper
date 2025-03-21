# Sistema de Inventário

O sistema de inventário do Dungeon Keeper gerencia todos os aspectos relacionados a itens, equipamentos e recursos dos personagens.

## Componentes Principais

### Itens (Items)
- **Tipos de Itens**
  - Equipamentos (Equipment)
  - Consumibles (Consumables)
  - Recursos (Resources)
  - Quest Items
  - Tesouros (Treasures)

- **Propriedades**
  - Nome
  - Descrição
  - Peso
  - Valor
  - Raridade
  - Durabilidade
  - Requisitos de uso

### Equipamentos (Equipment)
- **Slots**
  - Cabeça (Head)
  - Torso (Chest)
  - Pernas (Legs)
  - Pés (Feet)
  - Mãos (Hands)
  - Arma Principal (Main Hand)
  - Arma Secundária (Off Hand)
  - Acessórios (Accessories)

- **Atributos**
  - Defesa
  - Ataque
  - Bônus de atributos
  - Efeitos especiais
  - Encantamentos

### Consumibles (Consumables)
- **Tipos**
  - Poções (Potions)
  - Comida (Food)
  - Pergaminhos (Scrolls)
  - Ingredientes (Ingredients)

- **Efeitos**
  - Cura
  - Buff temporário
  - Restauração de recursos
  - Efeitos especiais

### Sistema de Peso (Weight System)
- Limite de peso
- Penalidades por sobrecarga
- Cálculo de peso total
- Modificações de capacidade

## Implementação

### Classes Base

```python
@dataclass
class Item:
    name: str
    description: str
    weight: float
    value: int
    rarity: ItemRarity
    durability: Optional[int] = None
    requirements: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Equipment(Item):
    slot: EquipmentSlot
    defense: int = 0
    attack: int = 0
    stat_bonuses: Dict[str, int] = field(default_factory=dict)
    effects: List[ItemEffect] = field(default_factory=list)

@dataclass
class Consumable(Item):
    effect_type: ConsumableEffect
    power: int
    duration: Optional[int] = None
```

### Sistema de Inventário

```python
class Inventory:
    def __init__(self, capacity: float):
        self.items: Dict[str, Item] = {}
        self.capacity = capacity
        self.current_weight = 0.0

    def add_item(self, item: Item, quantity: int = 1) -> bool:
        # Verifica capacidade
        # Adiciona item
        pass

    def remove_item(self, item_name: str, quantity: int = 1) -> Optional[Item]:
        # Remove item
        # Atualiza peso
        pass

    def get_total_weight(self) -> float:
        # Calcula peso total
        pass

    def is_overloaded(self) -> bool:
        # Verifica sobrecarga
        pass
```

### Sistema de Equipamento

```python
class EquipmentManager:
    def __init__(self):
        self.equipped_items: Dict[EquipmentSlot, Equipment] = {}

    def equip_item(self, item: Equipment) -> Optional[Equipment]:
        # Verifica requisitos
        # Equipa item
        # Retorna item substituido
        pass

    def unequip_item(self, slot: EquipmentSlot) -> Optional[Equipment]:
        # Remove equipamento
        # Retorna item removido
        pass

    def get_total_defense(self) -> int:
        # Calcula defesa total
        pass

    def get_stat_bonuses(self) -> Dict[str, int]:
        # Calcula bônus totais
        pass
```

## Exemplos de Uso

### Criar e Gerenciar Itens
```python
# Criar item
sword = Equipment(
    name="Espada Longa",
    description="Uma espada bem balanceada",
    weight=3.0,
    value=50,
    rarity=ItemRarity.COMMON,
    slot=EquipmentSlot.MAIN_HAND,
    attack=5
)

# Adicionar ao inventário
inventory.add_item(sword)

# Equipar item
equipment_manager.equip_item(sword)
```

### Usar Consumibles
```python
health_potion = Consumable(
    name="Poção de Cura",
    effect_type=ConsumableEffect.HEAL,
    power=20
)

character.use_item(health_potion)
```

## Considerações de Design

1. **Escalabilidade**
   - Sistema modular
   - Fácil adicionar novos tipos
   - Suporte a expansões

2. **Balanceamento**
   - Limites de peso realistas
   - Valores de itens equilibrados
   - Efeitos balanceados

3. **Usabilidade**
   - Interface intuitiva
   - Fácil gerenciamento
   - Feedback claro

4. **Performance**
   - Operações eficientes
   - Baixo impacto na memória
   - Cálculos otimizados

## Próximos Passos

1. **Sistema de Craft**
   - Receitas
   - Materiais
   - Qualidade

2. **Economia**
   - Preços dinâmicos
   - Sistema de comércio
   - Raridade influenciando valor

3. **Encantamentos**
   - Sistema de encantamentos
   - Modificações de itens
   - Efeitos especiais

4. **Durabilidade**
   - Desgaste de equipamentos
   - Reparação
   - Manutenção

5. **Conjuntos**
   - Bônus de set
   - Combinações especiais
   - Sinergias

6. **Interface**
   - Visualização de inventário
   - Gerenciamento de equipamento
   - Informações detalhadas

## Integrações

1. **Sistema de Combate**
   - Uso de itens em combate
   - Equipamentos afetando stats
   - Consumibles táticos

2. **Sistema de Quest**
   - Itens de missão
   - Recompensas
   - Requisitos de itens

3. **Sistema de Magia**
   - Itens mágicos
   - Pergaminhos
   - Componentes de magia