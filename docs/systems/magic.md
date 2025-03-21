# Sistema de Magia

O sistema de magia do Dungeon Keeper oferece uma estrutura flexível e poderosa para implementar magias e efeitos mágicos no jogo.

## Componentes Principais

### Escolas de Magia
- **Evocação** (Evocation)
  - Magias de dano direto
  - Efeitos elementais

- **Alteração** (Alteration)
  - Modificação de objetos
  - Transformações

- **Ilusão** (Illusion)
  - Engano e disfarce
  - Controle mental

- **Restauração** (Restoration)
  - Cura e suporte
  - Remoção de status negativos

- **Destruição** (Destruction)
  - Dano elemental
  - Debuffs

- **Conjuração** (Conjuration)
  - Invocação de criaturas
  - Criação de itens

### Elementos
- Fogo (Fire)
- Gelo (Ice)
- Elétrico (Lightning)
- Terra (Earth)
- Ar (Air)
- Água (Water)
- Luz (Light)
- Trevas (Dark)

### Sistema de Magias

```python
@dataclass
class Spell:
    name: str
    school: MagicSchool
    element: Optional[Element]
    mana_cost: int
    cast_time: float
    cooldown: float
    range: float
    area_of_effect: Optional[float]
    effects: List[SpellEffect]
    requirements: Dict[str, Any]

@dataclass
class SpellEffect:
    effect_type: EffectType
    power: int
    duration: Optional[float]
    scaling: Dict[str, float]  # Scaling com atributos
```

### Sistema de Conjuração

```python
class SpellCaster:
    def __init__(self):
        self.known_spells: Dict[str, Spell] = {}
        self.cooldowns: Dict[str, float] = {}
        self.casting: Optional[Spell] = None
        self.cast_progress: float = 0.0

    def learn_spell(self, spell: Spell) -> bool:
        # Aprende nova magia
        pass

    def can_cast(self, spell: Spell) -> bool:
        # Verifica requisitos e cooldown
        pass

    def start_casting(self, spell: Spell) -> bool:
        # Inicia conjuração
        pass

    def update_casting(self, delta_time: float) -> None:
        # Atualiza progresso de conjuração
        pass

    def interrupt_casting(self) -> None:
        # Interrompe conjuração
        pass
```

### Sistema de Efeitos Mágicos

```python
class MagicEffectManager:
    def __init__(self):
        self.active_effects: Dict[str, List[SpellEffect]] = {}

    def apply_effect(self, target: Any, effect: SpellEffect) -> None:
        # Aplica efeito mágico
        pass

    def update_effects(self, delta_time: float) -> None:
        # Atualiza efeitos ativos
        pass

    def remove_effect(self, target: Any, effect_id: str) -> None:
        # Remove efeito
        pass
```

## Exemplos de Uso

### Criar uma Magia
```python
fireball = Spell(
    name="Bola de Fogo",
    school=MagicSchool.EVOCATION,
    element=Element.FIRE,
    mana_cost=30,
    cast_time=1.5,
    cooldown=3.0,
    range=20.0,
    area_of_effect=5.0,
    effects=[
        SpellEffect(
            effect_type=EffectType.DAMAGE,
            power=50,
            scaling={'intelligence': 1.5}
        ),
        SpellEffect(
            effect_type=EffectType.DOT,
            power=10,
            duration=3.0
        )
    ],
    requirements={'level': 5, 'intelligence': 12}
)
```

### Conjurar Magia
```python
if caster.can_cast(fireball):
    caster.start_casting(fireball)

# Em algum loop de update
while caster.casting:
    caster.update_casting(delta_time)
```

## Considerações de Design

1. **Flexibilidade**
   - Sistema modular
   - Fácil adicionar novas magias
   - Customização de efeitos

2. **Balanceamento**
   - Custos de mana apropriados
   - Cooldowns balanceados
   - Scaling adequado

3. **Performance**
   - Efeitos otimizados
   - Gerenciamento eficiente
   - Baixo impacto no sistema

4. **Feedback**
   - Efeitos visuais claros
   - Indicações de progresso
   - Resultados visíveis

## Próximos Passos

1. **Combos de Magia**
   - Interações entre elementos
   - Combinações de efeitos
   - Sinergias entre magias

2. **Ritual Magic**
   - Magias mais poderosas
   - Requisitos especiais
   - Efeitos únicos

3. **Encantamentos**
   - Melhorias permanentes
   - Modificação de itens
   - Runas e símbolos

4. **Progression System**
   - Árvore de talentos
   - Especializações
   - Desbloqueio de magias

5. **Environmental Magic**
   - Interação com ambiente
   - Clima mágico
   - Modificações de terreno

## Integrações

1. **Sistema de Combate**
   - Magias de combate
   - Interrupção de conjuração
   - Resistências mágicas

2. **Sistema de Itens**
   - Itens mágicos
   - Catalisadores
   - Pergaminhos e varinhas

3. **Sistema de Status**
   - Efeitos de status mágicos
   - Buffs e debuffs
   - Condições especiais