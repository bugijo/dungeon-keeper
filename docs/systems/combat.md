# Sistema de Combate

O sistema de combate do Dungeon Keeper é baseado em turnos e implementa mecânicas inspiradas em jogos de RPG clássicos.

## Componentes Principais

### Iniciativa (Initiative)
- Determina a ordem dos turnos em combate
- Baseada em rolagem de d20 + modificador de destreza
- Permite adicionar e remover participantes dinamicamente

### Condições (Conditions)
- Sistema de status effects que afetam personagens
- Inclui condições como:
  - Atordoado (Stunned)
  - Envenenado (Poisoned)
  - Paralisado (Paralyzed)
  - Cego (Blinded)
  - Enfeiticado (Charmed)
  - Amedrontado (Frightened)
  - Caído (Prone)
  - Restrito (Restrained)
  - Silenciado (Silenced)
  - Invisível (Invisible)

### Tipos de Dano (Damage Types)
- Sistema de dano com diferentes tipos:
  - Cortante (Slashing)
  - Perfurante (Piercing)
  - Contundente (Bludgeoning)
  - Fogo (Fire)
  - Gelo (Cold)
  - Elétrico (Lightning)
  - Ácido (Acid)
  - Veneno (Poison)
  - Necrótico (Necrotic)
  - Radiante (Radiant)
  - Força (Force)
  - Psíquico (Psychic)
- Sistema de resistências e vulnerabilidades

### Efeitos de Habilidades (Ability Effects)
- Sistema modular para criar efeitos de habilidades
- Tipos de efeitos:
  - Dano (Damage)
  - Cura (Heal)
  - Condição (Condition)
  - Buff
  - Debuff
  - Área (Area)
  - Movimento (Movement)
- Suporte para efeitos customizados

### Estado de Combate (Combat State)
- Gerencia o estado geral do combate
- Controla fases do combate:
  - Não Iniciado
  - Iniciativa
  - Combate
  - Finalizado
- Mantém histórico de ações

### Rodada de Combate (Combat Round)
- Gerencia ações durante uma rodada
- Tipos de ações:
  - Padrão (Standard)
  - Bônus (Bonus)
  - Reação (Reaction)
  - Movimento (Movement)
  - Livre (Free)
- Controle de uso de ações
- Sistema de oportunidades de reação

## Fluxo de Combate

1. **Início do Combate**
   - Rolar iniciativa para todos os participantes
   - Estabelecer ordem de turnos

2. **Rodada de Combate**
   - Cada personagem age em sua ordem de iniciativa
   - Pode realizar uma ação padrão, bônus e movimento
   - Pode usar reações quando disponível

3. **Ações**
   - Atacar
   - Usar habilidades
   - Mover
   - Interagir com objetos
   - Usar itens

4. **Reações**
   - Ataques de oportunidade
   - Habilidades reativas
   - Contra-ataques

5. **Fim do Combate**
   - Quando todos os inimigos são derrotados
   - Quando um lado se rende
   - Quando objetivos específicos são alcançados

## Exemplos de Uso

```python
# Iniciar combate
combat_state = CombatState()
combat_state.start_combat([player, enemy1, enemy2])

# Aplicar condição
condition = Condition(ConditionType.POISONED, duration=3)
condition_manager.add_condition(enemy1, condition)

# Causar dano
damage = damage_manager.calculate_damage(10, DamageType.FIRE, enemy1)
enemy1.take_damage(damage)

# Usar habilidade
effect = AbilityEffect(EffectType.DAMAGE, target=single_target, duration=instant)
effect.add_damage(DamageType.LIGHTNING, 15)
effect_manager.apply_effect(effect, enemy2)
```

## Considerações de Design

- **Modularidade**: Cada componente é independente e pode ser estendido
- **Flexibilidade**: Sistema de efeitos permite criar habilidades complexas
- **Manutenção**: Código organizado e bem documentado
- **Testabilidade**: Cobertura completa de testes

## Próximos Passos

1. Implementar sistema de cobertura (cover)
2. Adicionar sistema de terreno e obstáculos
3. Implementar sistema de grupos e formações
4. Adicionar efeitos de área mais complexos
5. Implementar sistema de combos e sinergias