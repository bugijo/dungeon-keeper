# Plano de Desenvolvimento Paralelo - Dungeon Kreeper

## Visão Geral

Este documento descreve o plano de desenvolvimento paralelo para implementar as cinco funcionalidades pendentes do sistema Fog of War no projeto Dungeon Kreeper. Cada funcionalidade será desenvolvida por um agente diferente, trabalhando simultaneamente para maximizar a eficiência.

## Funcionalidades Pendentes e Atribuições

### 1. Sistema de Linha de Visão Baseado em Obstáculos (Agente 1)
**Progresso Atual:** 30%

**Arquivos Relacionados:**
- `src/utils/fogOfWarUtils.ts`
- `src/components/MapComponents/EnhancedFogOfWar.tsx`
- `src/utils/lineIntersectsRectangle.ts`

**Tarefas Pendentes:**
- Completar a implementação da função `calculateVisibleArea` para considerar obstáculos dinâmicos
- Implementar algoritmo de projeção de sombras
- Otimizar cálculos para mapas grandes
- Integrar com o sistema de grid existente
- Adicionar controles para o mestre ajustar a visibilidade

**Dependências de Supabase:**
- Sincronização em tempo real dos obstáculos entre jogadores
- Armazenamento de configurações de visibilidade por sessão

### 2. Áreas de Visão Dinâmicas com Fontes de Luz (Agente 2)
**Progresso Atual:** 25%

**Arquivos Relacionados:**
- `src/utils/lightingUtils.ts`
- `src/utils/saveLightSourcesLocally.ts`
- `src/components/MapComponents/LightSourceManager.tsx`

**Tarefas Pendentes:**
- Completar a implementação de propagação de luz através de obstáculos
- Implementar efeitos de sombra avançados
- Adicionar suporte para diferentes tipos de fontes de luz (tocha, lanterna, luz do dia)
- Integrar com sistema de tempo (dia/noite)
- Implementar controles para o mestre gerenciar fontes de luz

**Dependências de Supabase:**
- Sincronização em tempo real das fontes de luz entre jogadores
- Armazenamento de configurações de iluminação por sessão

### 3. Sistema de Memória de Áreas Reveladas (Agente 3)
**Progresso Atual:** 20%

**Arquivos Relacionados:**
- `src/utils/offlineStorageUtils.ts`
- `src/components/MapComponents/RevealedAreaMemory.tsx`

**Tarefas Pendentes:**
- Implementar sistema de armazenamento de áreas visitadas por jogador
- Adicionar níveis de visibilidade para áreas memorizadas
- Implementar sistema de desvanecimento gradual baseado no tempo
- Criar controles para o mestre gerenciar a memória dos jogadores
- Adicionar opções de configuração por personagem (baseado em atributos)

**Dependências de Supabase:**
- Armazenamento persistente de áreas reveladas por jogador
- Sincronização entre dispositivos do mesmo jogador

### 4. Otimizações de Performance (Agente 4)
**Progresso Atual:** 15%

**Arquivos Relacionados:**
- `src/hooks/useMapCache.tsx`
- `src/hooks/useAutoSave.tsx`
- `src/utils/updateDynamicObstacles.ts`

**Tarefas Pendentes:**
- Implementar sistema de cache para cálculos de visibilidade
- Otimizar renderização de áreas grandes
- Implementar auto-save contínuo com throttling
- Adicionar suporte para carregamento progressivo de mapas
- Implementar sistema de priorização de atualizações visuais

**Dependências de Supabase:**
- Otimização de consultas para reduzir tráfego de rede
- Implementação de sistema de cache local-primeiro

### 5. Ferramentas Avançadas de Narrativa (Agente 5)
**Progresso Atual:** 10%

**Arquivos Relacionados:**
- `src/components/dm/NarrativeTools.tsx`
- `src/hooks/useEnvironmentControl.tsx`

**Tarefas Pendentes:**
- Implementar sistema de revelação progressiva para o mestre
- Adicionar efeitos especiais de iluminação para momentos narrativos
- Criar sistema de gatilhos baseados em posição dos jogadores
- Implementar sistema de notas vinculadas a áreas do mapa
- Adicionar controles para alternar rapidamente entre configurações de visibilidade

**Dependências de Supabase:**
- Armazenamento de configurações narrativas por campanha
- Sincronização em tempo real de eventos narrativos

## Plano de Integração

### Fase 1: Desenvolvimento Paralelo (Semana 1-2)
- Cada agente trabalha em sua funcionalidade designada
- Reuniões diárias para sincronização de progresso
- Foco em manter interfaces consistentes entre os módulos

### Fase 2: Integração Inicial (Semana 3)
- Integração das funcionalidades 1 e 2 (Linha de Visão + Fontes de Luz)
- Testes de integração e correção de conflitos
- Ajustes de performance iniciais

### Fase 3: Integração Completa (Semana 4)
- Integração de todas as funcionalidades
- Testes de sistema completo
- Otimizações finais

### Fase 4: Polimento e Lançamento (Semana 5)
- Correção de bugs
- Documentação
- Preparação para lançamento

## Configuração do Supabase

Para suportar o desenvolvimento paralelo, utilizaremos o Supabase para sincronização em tempo real dos dados entre os jogadores. As seguintes tabelas serão necessárias:

### Tabelas do Supabase

1. **fog_of_war_settings**
   - Configurações gerais do sistema de Fog of War por sessão

2. **light_sources**
   - Fontes de luz colocadas no mapa
   - Sincronização em tempo real

3. **obstacles**
   - Obstáculos que bloqueiam visão e movimento
   - Suporte para obstáculos dinâmicos

4. **revealed_areas**
   - Áreas do mapa que foram reveladas aos jogadores
   - Vinculadas a jogadores específicos

5. **player_memory**
   - Áreas que cada jogador memorizou
   - Níveis de visibilidade por área

6. **narrative_triggers**
   - Gatilhos narrativos colocados pelo mestre
   - Condições de ativação

## Métricas de Progresso

Para acompanhar o progresso do desenvolvimento paralelo, utilizaremos as seguintes métricas:

1. **Porcentagem de Conclusão por Funcionalidade**
   - Atualizada diariamente por cada agente

2. **Número de Integrações Bem-sucedidas**
   - Contagem de funcionalidades integradas sem conflitos

3. **Performance do Sistema**
   - Tempo de renderização
   - Uso de memória
   - Tráfego de rede

4. **Cobertura de Testes**
   - Porcentagem de código coberto por testes automatizados

## Próximos Passos

1. Configurar ambiente de desenvolvimento para cada agente
2. Criar branches de desenvolvimento para cada funcionalidade
3. Implementar sistema de integração contínua
4. Iniciar desenvolvimento paralelo conforme plano