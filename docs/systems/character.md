# Sistema de Personagens

O sistema de personagens do Dungeon Keeper fornece uma base flexível e extensível para criar e gerenciar personagens no jogo.

## Características Principais

### Atributos Base
- Força (Strength)
- Destreza (Dexterity)
- Constituição (Constitution)
- Inteligência (Intelligence)
- Sabedoria (Wisdom)
- Carisma (Charisma)

### Recursos
- Pontos de Vida (HP)
- Pontos de Mana (MP)
- Classe de Armadura (AC)
- Bônus de Iniciativa

### Sistemas de Progresso
- Nível
- Experiência
- Sistema de level up automático

### Inventário e Equipamento
- Sistema de inventário flexível
- Slots de equipamento
- Gerenciamento de itens

### Habilidades e Status
- Sistema de habilidades
- Efeitos de status
- Modificadores temporários

## Implementação

### Classe Base de Personagem

```python
@dataclass
class Character:
    name: str
    stats: Dict[str, int]
    level: int
    experience: int
    inventory: Dict[str, Any]
    equipment: Dict[str, Any]
    abilities: Dict[str, Any]
    status_effects: Dict[str, Any]
```

### Funcionalidades Principais

1. **Gerenciamento de Stats**
   ```python
   def modify_stat(self, stat: str, amount: int) -> None
   def get_stat(self, stat: str) -> Optional[int]
   ```

2. **Sistema de Vida e Mana**
   ```python
   def heal(self, amount: int) -> None
   def take_damage(self, amount: int) -> None
   def restore_mana(self, amount: int) -> None
   def use_mana(self, amount: int) -> bool
   ```

3. **Progresso do Personagem**
   ```python
   def add_experience(self, amount: int) -> None
   def level_up(self) -> None
   ```

4. **Gerenciamento de Equipamento**
   ```python
   def equip_item(self, slot: str, item: Any) -> bool
   def unequip_item(self, slot: str) -> Optional[Any]
   ```

5. **Sistema de Inventário**
   ```python
   def add_to_inventory(self, item: Any) -> bool
   def remove_from_inventory(self, item_name: str) -> Optional[Any]
   def has_item(self, item_name: str) -> bool
   ```

6. **Habilidades e Efeitos**
   ```python
   def add_ability(self, ability_name: str, ability: Any) -> None
   def remove_ability(self, ability_name: str) -> Optional[Any]
   def add_status_effect(self, effect_name: str, effect: Any) -> None
   def remove_status_effect(self, effect_name: str) -> Optional[Any]
   ```

## Exemplos de Uso

### Criar um Personagem
```python
character = Character(
    name="Gandalf",
    stats={
        'strength': 10,
        'intelligence': 18,
        'wisdom': 16
    }
)
```

### Gerenciar Vida e Mana
```python
character.take_damage(15)  # Sofre dano
character.heal(10)         # Recupera vida
character.use_mana(20)     # Usa mana para magia
```

### Equipar Itens
```python
staff = MagicItem("Staff of Power")
character.equip_item("weapon", staff)
```

### Adicionar Experiência
```python
character.add_experience(1000)  # Pode causar level up
```

## Extensões Futuras

1. **Classes de Personagem**
   - Implementar sistema de classes
   - Adicionar habilidades específicas de classe
   - Sistema de multiclasse

2. **Raças**
   - Adicionar sistema de raças
   - Traços raciais
   - Bônus de atributos

3. **Antecedentes**
   - Sistema de background
   - Proficiências
   - Características de história

4. **Talentos**
   - Sistema de feats
   - Escolhas de desenvolvimento
   - Especializações

5. **Personalização**
   - Aparência
   - História
   - Alinhamento

## Considerações de Design

1. **Flexibilidade**
   - Sistema modular
   - Fácil de estender
   - Suporte a diferentes tipos de jogo

2. **Performance**
   - Operações eficientes
   - Baixo uso de memória
   - Cálculos otimizados

3. **Manutenção**
   - Código limpo
   - Bem documentado
   - Fácil de testar

4. **Integração**
   - Interface clara
   - Fácil de conectar com outros sistemas
   - Eventos e callbacks

## Próximos Passos

1. Implementar sistema de classes
2. Adicionar sistema de raças
3. Desenvolver sistema de talentos
4. Criar sistema de antecedentes
5. Melhorar sistema de equipamento
6. Adicionar sistema de proficiências
7. Implementar sistema de perícias
8. Desenvolver sistema de alinhamento