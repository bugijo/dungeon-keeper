# Implementação do Sistema de Desvanecimento Gradual Baseado no Tempo

Este documento detalha a implementação do sistema de desvanecimento gradual baseado no tempo para o Dungeon Kreeper, incluindo o sistema de temporização, algoritmo de desvanecimento e fatores de influência.

## Visão Geral

O sistema de desvanecimento gradual visa criar uma experiência mais realista e desafiadora, onde a memória dos jogadores sobre áreas exploradas se deteriora com o tempo. A implementação atual (30%) será expandida para incluir funcionalidades mais sofisticadas.

## Componentes Principais

### 1. Sistema de Temporização de Memória

#### Armazenamento de Timestamps
- Implementação de um sistema que armazena o momento exato em que cada célula do mapa foi vista
- Estrutura de dados otimizada para mapas grandes
- Sincronização eficiente com o Supabase

#### Cálculo de Idade da Memória
- Algoritmo para calcular quanto tempo se passou desde que uma área foi vista
- Consideração de diferentes escalas de tempo (tempo real vs. tempo de jogo)
- Sistema de eventos que podem afetar a percepção de tempo

### 2. Algoritmo de Desvanecimento Progressivo

#### Níveis de Detalhe
- Implementação de múltiplos níveis de detalhe para memória (ex: detalhado, parcial, básico, ausente)
- Transições suaves entre níveis para evitar mudanças abruptas
- Efeitos visuais distintos para cada nível

#### Curvas de Desvanecimento
- Desenvolvimento de curvas de desvanecimento não-lineares
- Parâmetros ajustáveis para diferentes tipos de ambientes
- Possibilidade de personalização pelo mestre

### 3. Sistema de Fatores de Influência

#### Fatores Ambientais
- Iluminação durante a exploração afeta a qualidade da memória
- Condições climáticas e ambientais como modificadores
- Eventos especiais que podem melhorar ou piorar a memória

#### Fatores de Personagem
- Integração com o sistema de atributos de personagem
- Habilidades especiais que afetam a memória
- Itens e equipamentos que podem melhorar a retenção

## Implementação Técnica

### Estruturas de Dados

```typescript
interface MemoryCell {
  position: Vector2;
  lastSeen: number; // timestamp
  initialDetail: number; // 0-1 representando o nível de detalhe inicial
  environmentFactors: {
    lighting: number; // 0-1
    complexity: number; // 0-1 (quão complexo é o ambiente)
    significance: number; // 0-1 (quão significativo é para a narrativa)
  };
}

interface MemoryMap {
  cells: Map<string, MemoryCell>; // chave: "x,y"
  globalFactors: {
    timeScale: number; // modificador de velocidade de desvanecimento
    baseRetention: number; // retenção base para todos os jogadores
  };
}
```

### Algoritmos Principais

#### Cálculo de Nível de Detalhe Atual

```typescript
function calculateCurrentDetailLevel(cell: MemoryCell, character: Character, currentTime: number): number {
  // Calcular tempo decorrido
  const elapsed = currentTime - cell.lastSeen;
  
  // Aplicar curva de desvanecimento
  let detailLevel = applyFadeCurve(cell.initialDetail, elapsed);
  
  // Aplicar fatores ambientais
  detailLevel *= calculateEnvironmentFactor(cell.environmentFactors);
  
  // Aplicar fatores de personagem
  detailLevel *= calculateCharacterFactor(character);
  
  return clamp(detailLevel, 0, 1);
}
```

#### Curva de Desvanecimento

```typescript
function applyFadeCurve(initialDetail: number, elapsed: number): number {
  // Implementação de uma curva não-linear
  // Por exemplo, uma função exponencial negativa
  const decayRate = 0.1; // Ajustável
  return initialDetail * Math.exp(-decayRate * elapsed);
}
```

#### Cálculo de Fatores de Influência

```typescript
function calculateEnvironmentFactor(factors: EnvironmentFactors): number {
  // Combinar fatores com pesos apropriados
  return (
    factors.lighting * 0.5 +
    factors.complexity * 0.3 +
    factors.significance * 0.2
  );
}

function calculateCharacterFactor(character: Character): number {
  // Considerar atributos, habilidades e itens
  let factor = 1.0;
  
  // Atributos base
  factor += (character.attributes.intelligence - 10) * 0.02;
  factor += (character.attributes.wisdom - 10) * 0.01;
  
  // Habilidades
  if (character.hasSkill('eidetic_memory')) factor += 0.2;
  if (character.hasSkill('cartographer')) factor += 0.15;
  
  // Itens
  if (character.hasItem('map_tool')) factor += 0.1;
  
  return Math.max(0.5, factor); // Mínimo de 0.5 para não ficar impossível
}
```

## Integração com Sistemas Existentes

### Fog of War
- O sistema de desvanecimento se integra com o Fog of War existente
- Áreas completamente desvanecidas voltam ao estado de "não exploradas"
- Visualização distinta para áreas atualmente visíveis, memória recente e memória antiga

### Sistema de Sombras
- Áreas exploradas com pouca iluminação são mais difíceis de memorizar
- Detalhes em áreas sombreadas desvanecem mais rapidamente
- Fontes de luz podem melhorar a qualidade da memória durante a exploração

### Interface do Usuário
- Indicadores visuais para a idade e qualidade da memória
- Controles para o mestre ajustar parâmetros globais
- Ferramentas para jogadores marcarem áreas importantes

## Cronograma de Implementação

### Fase 1: Fundação (Semanas 1-2)
- Implementar o sistema de temporização de memória
- Desenvolver estruturas de dados básicas
- Implementar armazenamento de timestamps para células do mapa

### Fase 2: Desenvolvimento Principal (Semanas 3-4)
- Desenvolver os níveis de detalhe para memória
- Implementar os efeitos visuais para cada nível
- Criar as curvas de desvanecimento básicas

### Fase 3: Finalização (Semanas 5-6)
- Desenvolver o sistema de fatores de influência
- Finalizar a integração com outros sistemas
- Implementar a interface de controle

## Métricas de Sucesso

### Performance
- Eficiência de armazenamento (menos de 100KB para mapas grandes)
- Impacto mínimo no FPS (menos de 5% de redução)
- Sincronização eficiente (menos de 10KB por minuto de jogo)

### Gameplay
- Desvanecimento realista que incentiva exploração repetida
- Diferenciação clara entre níveis de memória
- Integração natural com as mecânicas de jogo existentes

### Experiência do Usuário
- Feedback positivo sobre o realismo e desafio adicional
- Uso estratégico da mecânica pelos jogadores
- Facilidade de uso para mestres configurarem o sistema

---

**Última atualização:** 2024-09-16
**Responsável:** Equipe de Desenvolvimento Dungeon Kreeper