# Arquitetura do Dungeon Keeper

Este documento descreve a arquitetura geral do projeto Dungeon Keeper, detalhando seus principais componentes e como eles se relacionam.

## Visão Geral

```
dungeon-keeper/
├── src/
│   ├── systems/
│   │   ├── character/    # Sistema de personagens
│   │   ├── combat/       # Sistema de combate
│   │   ├── inventory/    # Sistema de inventário
│   │   └── magic/        # Sistema de magia
│   ├── core/          # Funcionalidades core
│   ├── utils/         # Utilitários
│   └── config/        # Configurações
├── tests/          # Testes
├── docs/           # Documentação
└── scripts/        # Scripts de utilidade
```

## Princípios de Design

1. **Modularidade**
   - Sistemas independentes
   - Baixo acoplamento
   - Alta coesão

2. **Extensibilidade**
   - Fácil adicionar novos recursos
   - Interfaces bem definidas
   - Padrões de design flexíveis

3. **Manutenção**
   - Código limpo
   - Documentação clara
   - Testes abrangentes

## Sistemas Principais

### Sistema de Personagens

```python
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class Character:
    name: str
    stats: Dict[str, int]
    # ...

class CharacterManager:
    def __init__(self):
        self.characters: Dict[str, Character] = {}
```

### Sistema de Combate

```python
class CombatState:
    def __init__(self):
        self.initiative = Initiative()
        self.condition_manager = ConditionManager()
        self.damage_manager = DamageTypeManager()
```

### Sistema de Inventário

```python
class Inventory:
    def __init__(self, capacity: float):
        self.items: Dict[str, Item] = {}
        self.capacity = capacity
```

### Sistema de Magia

```python
class SpellSystem:
    def __init__(self):
        self.spell_manager = SpellManager()
        self.effect_manager = MagicEffectManager()
```

## Padrões de Design

1. **Observer Pattern**
   ```python
   class EventManager:
       def __init__(self):
           self.listeners = {}

       def subscribe(self, event_type: str, listener: callable):
           if event_type not in self.listeners:
               self.listeners[event_type] = []
           self.listeners[event_type].append(listener)

       def emit(self, event_type: str, data: Any):
           if event_type in self.listeners:
               for listener in self.listeners[event_type]:
                   listener(data)
   ```

2. **Factory Pattern**
   ```python
   class ItemFactory:
       @staticmethod
       def create_item(item_type: str, **kwargs) -> Item:
           if item_type == "weapon":
               return Weapon(**kwargs)
           elif item_type == "armor":
               return Armor(**kwargs)
           # ...
   ```

3. **Strategy Pattern**
   ```python
   class DamageCalculator:
       def __init__(self, strategy: DamageStrategy):
           self.strategy = strategy

       def calculate(self, base_damage: int, attacker: Character, target: Character) -> int:
           return self.strategy.calculate(base_damage, attacker, target)
   ```

## Fluxo de Dados

1. **Game Loop**
   ```python
   class GameLoop:
       def __init__(self):
           self.systems = []
           self.running = False

       def update(self, delta_time: float):
           for system in self.systems:
               system.update(delta_time)

       def run(self):
           self.running = True
           while self.running:
               self.update(get_delta_time())
   ```

2. **Sistema de Eventos**
   ```python
   # Emitindo evento
   event_manager.emit("damage_dealt", {
       "source": attacker,
       "target": defender,
       "amount": damage
   })

   # Ouvindo evento
   event_manager.subscribe("damage_dealt", on_damage_dealt)
   ```

## Persistência de Dados

1. **Save System**
   ```python
   class GameSaver:
       def save_game(self, filename: str):
           data = {
               "characters": self.serialize_characters(),
               "inventory": self.serialize_inventory(),
               "world_state": self.serialize_world()
           }
           save_to_file(filename, data)

       def load_game(self, filename: str):
           data = load_from_file(filename)
           self.deserialize_characters(data["characters"])
           self.deserialize_inventory(data["inventory"])
           self.deserialize_world(data["world_state"])
   ```

## Gerenciamento de Recursos

1. **Resource Manager**
   ```python
   class ResourceManager:
       def __init__(self):
           self.resources = {}
           self.cache = {}

       def load_resource(self, resource_id: str) -> Any:
           if resource_id in self.cache:
               return self.cache[resource_id]
           # Load and cache resource
           return resource
   ```

## Considerações de Performance

1. **Otimizações**
   - Cache de recursos
   - Pool de objetos
   - Lazy loading

2. **Profiling**
   - Monitoramento de memória
   - Tracking de performance
   - Identificação de gargalos

## Próximos Passos

1. **Sistema de NPCs**
   - IA básica
   - Comportamentos
   - Diálogos

2. **Sistema de Quests**
   - Objetivos
   - Recompensas
   - Progressão

3. **Sistema de Mundo**
   - Geração de mapas
   - Clima
   - Ciclo dia/noite

4. **UI/UX**
   - Interface do usuário
   - Menus
   - HUD

## Guia de Contribuição

1. **Código**
   - Seguir style guide
   - Documentar funções
   - Escrever testes

2. **Testes**
   - Unit tests
   - Integration tests
   - Performance tests

3. **Documentação**
   - Manter atualizada
   - Clara e concisa
   - Exemplos práticos