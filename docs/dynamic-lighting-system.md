# Sistema de Iluminação Dinâmica

## Visão Geral

O Sistema de Iluminação Dinâmica é um complemento ao sistema de Fog of War que adiciona fontes de luz interativas ao mapa tático. Este sistema permite que o mestre do jogo crie e gerencie diferentes fontes de luz como tochas, lanternas, feitiços mágicos e outros elementos que emitem luz no ambiente de jogo.

## Recursos Principais

- **Fontes de luz personalizáveis**: Raio, intensidade, cor e outros atributos ajustáveis
- **Efeito de oscilação**: Simula o movimento natural de chamas em tochas e fogueiras
- **Projeção de sombras**: As luzes projetam sombras realistas quando encontram obstáculos
- **Controle de luz ambiente**: Ajuste do nível de iluminação global do mapa
- **Presets de iluminação**: Salve e carregue configurações de iluminação para diferentes cenários
- **Integração com Fog of War**: As fontes de luz revelam áreas do mapa automaticamente

## Arquitetura do Sistema

### Componentes Principais

1. **lightingUtils.ts**: Utilitários para gerenciamento de fontes de luz e renderização
2. **DynamicLightingController.tsx**: Interface para o mestre controlar as fontes de luz
3. **IntegratedDynamicLighting.tsx**: Componente que integra o sistema de iluminação com o Fog of War
4. **DynamicLightingDemo.tsx**: Componente de demonstração para testar o sistema

### Banco de Dados

O sistema utiliza duas tabelas principais:

- **map_light_sources**: Armazena as fontes de luz de cada mapa
- **lighting_presets**: Armazena presets de iluminação para reutilização

## Como Usar

### Integração com Mapas Táticos

Para integrar o sistema de iluminação dinâmica em um mapa tático, utilize o componente `IntegratedFogOfWar` que já inclui o sistema de iluminação:

```tsx
<IntegratedFogOfWar
  mapId={mapId}
  gameId={gameId}
  userId={userId}
  isGameMaster={isGameMaster}
  width={width}
  height={height}
  gridSize={gridSize}
  obstacles={obstacles}
/>
```

### Controle de Fontes de Luz (Apenas Mestre)

O mestre do jogo terá acesso ao painel de controle de iluminação, onde poderá:

1. Adicionar novas fontes de luz
2. Ajustar propriedades (raio, intensidade, cor)
3. Ativar/desativar efeitos de oscilação
4. Controlar a projeção de sombras
5. Ajustar a luz ambiente global
6. Salvar e carregar presets de iluminação

### Demonstração

Uma página de demonstração está disponível em `/demo/dynamic-lighting` para testar todas as funcionalidades do sistema.

## Detalhes Técnicos

### Renderização

O sistema utiliza um canvas separado para renderizar as luzes, que é sobreposto ao mapa principal usando o modo de composição `multiply`. Isso permite que as luzes afetem visualmente o mapa sem interferir na interação do usuário.

### Desempenho

Para garantir bom desempenho, o sistema:

- Utiliza `requestAnimationFrame` para sincronizar a renderização com o navegador
- Limita a frequência de atualização das oscilações
- Implementa técnicas de shadow mapping otimizadas
- Usa cache para cálculos de visibilidade quando possível

### Sincronização em Tempo Real

O sistema utiliza canais do Supabase para sincronizar as fontes de luz entre todos os jogadores em tempo real:

- Canal `lighting-updates-{mapId}` para atualizações de fontes de luz
- Eventos `lighting-update` e `ambient-light-update` para diferentes tipos de mudanças

## Extensões Futuras

- Suporte para luzes coloridas com mistura de cores
- Efeitos especiais (pulsação, flash, degradê)
- Animação de movimento para fontes de luz móveis (como lanternas de personagens)
- Integração com eventos do jogo (explosões, feitiços)
- Editor visual para criação de presets de iluminação

## Solução de Problemas

### Problemas Comuns

1. **Fontes de luz não aparecem**: Verifique se o mapa tem obstáculos configurados corretamente
2. **Desempenho lento**: Reduza o número de fontes de luz ou desative a projeção de sombras
3. **Sombras incorretas**: Certifique-se de que os obstáculos têm a propriedade `blocks_vision` configurada

### Logs e Depuração

O sistema registra informações de depuração no console do navegador, que podem ser úteis para identificar problemas:

- Erros ao carregar fontes de luz do banco de dados
- Falhas na sincronização em tempo real
- Problemas de renderização