# Implementação de Opções de Configuração por Personagem

Este documento detalha a implementação das opções de configuração por personagem para o Dungeon Kreeper, incluindo o sistema de atributos de memória, habilidades específicas e sistema de progressão.

## Visão Geral

O sistema de configuração por personagem visa criar uma experiência mais personalizada e estratégica, onde diferentes personagens têm capacidades distintas de percepção e memória. A implementação atual (25%) será expandida para incluir funcionalidades mais sofisticadas.

## Componentes Principais

### 1. Sistema de Atributos de Memória

#### Fórmulas Base
- Desenvolvimento de fórmulas que relacionam atributos básicos (como Inteligência e Sabedoria) com capacidades de memória
- Sistema de modificadores baseados em raça, classe e background
- Balanceamento para garantir que diferentes builds sejam viáveis

#### Integração com Sistema de Personagens
- Modificação do sistema de personagens existente para incluir atributos de memória
- Interface para visualização dos atributos e seus efeitos
- Sincronização eficiente com o Supabase

### 2. Habilidades Específicas de Memória

#### Sistema Modular
- Implementação de um sistema de habilidades modulares relacionadas à memória
- Diferentes categorias: percepção, retenção, análise, etc.
- Pré-requisitos e árvores de progressão

#### Exemplos de Habilidades
- **Memória Eidética**: Reduz significativamente a taxa de desvanecimento
- **Olho para Detalhes**: Melhora a qualidade inicial da memória em áreas exploradas
- **Cartógrafo**: Permite marcar e anotar o mapa com maior precisão
- **Sentidos Aguçados**: Melhora a percepção em condições de baixa iluminação
- **Orientação Natural**: Mantém a orientação mesmo em áreas complexas

### 3. Sistema de Progressão e Interface do Mestre

#### Progressão de Memória
- Sistema de experiência específico para habilidades de memória
- Desafios e conquistas que melhoram capacidades de memória
- Itens e equipamentos que podem aumentar temporariamente as capacidades

#### Interface do Mestre
- Ferramentas para o mestre ajustar dificuldade por personagem
- Visualização do estado atual de memória de cada jogador
- Opções para criar desafios específicos baseados em memória

## Implementação Técnica

### Estruturas de Dados

```typescript
interface MemoryAttributes {
  baseRetention: number; // 0-1, capacidade base de retenção
  detailPerception: number; // 0-1, capacidade de perceber detalhes
  spatialAwareness: number; // 0-1, capacidade de orientação espacial
  lightSensitivity: number; // 0-1, capacidade de ver em baixa luz
}

interface MemorySkill {
  id: string;
  name: string;
  description: string;
  level: number; // 1-5
  effects: {
    attribute: keyof MemoryAttributes;
    modifier: number;
  }[];
  prerequisites?: {
    skills?: string[];
    attributes?: Partial<Record<keyof MemoryAttributes, number>>;
  };
}

interface CharacterMemoryProfile {
  baseAttributes: MemoryAttributes;
  skills: MemorySkill[];
  items: {
    id: string;
    effects: {
      attribute: keyof MemoryAttributes;
      modifier: number;
      duration?: number; // em segundos, undefined para permanente
    }[];
  }[];
  experience: {
    total: number;
    available: number;
  };
}
```

### Algoritmos Principais

#### Cálculo de Atributos Efetivos

```typescript
function calculateEffectiveAttributes(character: Character): MemoryAttributes {
  // Começar com os atributos base
  const effective: MemoryAttributes = { ...character.memoryProfile.baseAttributes };
  
  // Aplicar modificadores de habilidades
  for (const skill of character.memoryProfile.skills) {
    for (const effect of skill.effects) {
      effective[effect.attribute] += effect.modifier * skill.level;
    }
  }
  
  // Aplicar modificadores de itens
  const currentTime = getCurrentTime();
  for (const item of character.memoryProfile.items) {
    for (const effect of item.effects) {
      if (!effect.duration || 
          (item.equippedTime && currentTime - item.equippedTime < effect.duration)) {
        effective[effect.attribute] += effect.modifier;
      }
    }
  }
  
  // Garantir que os valores estejam dentro dos limites
  for (const key in effective) {
    effective[key as keyof MemoryAttributes] = 
      clamp(effective[key as keyof MemoryAttributes], 0, 1);
  }
  
  return effective;
}
```

#### Sistema de Progressão

```typescript
function awardMemoryExperience(character: Character, amount: number): void {
  character.memoryProfile.experience.total += amount;
  character.memoryProfile.experience.available += amount;
  
  // Verificar se novas habilidades estão disponíveis
  checkNewSkillsAvailability(character);
  
  // Sincronizar com o servidor
  syncCharacterData(character);
}

function learnSkill(character: Character, skillId: string): boolean {
  const skill = AVAILABLE_MEMORY_SKILLS.find(s => s.id === skillId);
  if (!skill) return false;
  
  // Verificar pré-requisitos
  if (!checkSkillPrerequisites(character, skill)) return false;
  
  // Verificar experiência disponível
  const cost = calculateSkillCost(skill);
  if (character.memoryProfile.experience.available < cost) return false;
  
  // Adicionar habilidade e deduzir custo
  character.memoryProfile.skills.push({ ...skill, level: 1 });
  character.memoryProfile.experience.available -= cost;
  
  // Sincronizar com o servidor
  syncCharacterData(character);
  
  return true;
}
```

## Integração com Sistemas Existentes

### Sistema de Desvanecimento
- Os atributos e habilidades de memória afetam diretamente a taxa de desvanecimento
- Diferentes personagens podem ter diferentes níveis de detalhe para a mesma área
- Habilidades especiais podem revelar detalhes ocultos em memórias antigas

### Sistema de Sombras
- Personagens com alta sensibilidade à luz podem ver melhor em áreas sombreadas
- Habilidades específicas podem melhorar a percepção em diferentes condições de iluminação
- Itens como lanternas e tochas têm efeitos diferentes dependendo dos atributos do personagem

### Interface do Usuário
- Ficha de personagem expandida para mostrar atributos e habilidades de memória
- Indicadores visuais personalizados para cada jogador
- Painel do mestre para gerenciar configurações por personagem

## Cronograma de Implementação

### Fase 1: Fundação (Semanas 1-2)
- Desenvolver as fórmulas base para atributos de memória
- Integrar o sistema de atributos com o sistema de personagens existente
- Implementar estruturas de dados básicas

### Fase 2: Desenvolvimento Principal (Semanas 3-4)
- Criar o sistema de habilidades modulares de memória
- Desenvolver a interface de visualização de habilidades
- Implementar o sistema básico de progressão

### Fase 3: Finalização (Semanas 5-6)
- Implementar o sistema completo de progressão de memória
- Desenvolver a interface de configuração do mestre
- Finalizar a integração com outros sistemas

## Métricas de Sucesso

### Balanceamento
- Diferentes builds de personagem são viáveis e interessantes
- Progressão de habilidades é satisfatória e recompensadora
- Sistema não favorece excessivamente um tipo de personagem

### Gameplay
- Jogadores fazem escolhas estratégicas baseadas em suas habilidades de memória
- Cooperação entre personagens com diferentes habilidades é incentivada
- Desafios baseados em memória são divertidos e desafiadores

### Experiência do Usuário
- Interface clara e intuitiva para gerenciar habilidades
- Feedback visual efetivo sobre os efeitos das habilidades
- Facilidade para mestres configurarem o sistema

---

**Última atualização:** 2024-09-16
**Responsável:** Equipe de Desenvolvimento Dungeon Kreeper