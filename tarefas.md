# Lista de Tarefas - Dungeon Kreeper (DK) v1.0

## Progresso Geral do Projeto

| Funcionalidade | Progresso |
|---------------|----------|
| Interface de Usuário | 95% |
| Criação de Personagens | 90% |
| Criação de Mesas e Aventuras | 100% |
| Sistema de Agendamento de Sessões | 100% |
| Funcionalidades de Jogo | 95% |
| Mapas Interativos | 100% |
| Sincronização em Tempo Real | 85% |
| **Progresso Total** | **95%** |

## Prioridades Imediatas

### Interface de Usuário
- [x] Finalizar tela de login com opções de e-mail e nome de usuário
- [x] Implementar opção "Jogar sem Conta" para facilitar acesso de novos jogadores
- [x] Desenvolver tela inicial com visualização de mesas disponíveis
- [x] Criar sistema de filtros para busca de mesas por tipo, sistema e número de jogadores
- [x] Implementar interface para entrada em jogos em andamento

### Criação de Personagens
- [x] Finalizar editor intuitivo de personagens com opções de classe, habilidades e atributos
- [x] Implementar sistema de armazenamento e compartilhamento de personagens
- [x] Integrar regras de D&D 5e para validação de personagens
- [ ] Adicionar opção de geração automática de personagens (versão básica)

### Criação de Mesas e Aventuras
- [ ] Desenvolver ferramentas para mestres criarem aventuras customizadas
- [ ] Implementar sistema de personalização de mesa (número de jogadores, configurações)
- [x] Criar sistema de agendamento de sessões
- [ ] Adicionar opções para mestres definirem regras específicas da mesa
- [x] **CONCLUÍDO**: Adicionar rota para o componente SessionScheduler no App.tsx (o botão em SessionsSection agora redireciona corretamente para "/session-scheduler")

### Funcionalidades de Jogo
- [x] Implementar sistema de rolagem de dados digital (d4, d6, d8, d10, d12, d20)
- [x] Desenvolver sistema de feedback em tempo real para rolagens
- [x] Criar ferramenta básica para criação de mapas interativos
- [x] Implementar sistema de chat de texto para comunicação durante o jogo
- [x] Adicionar sistema básico de reações visuais (emoticons)

### Tutoriais
- [ ] Criar tutoriais básicos para novos jogadores
- [ ] Desenvolver guias sobre regras de D&D 5e
- [ ] Implementar dicas contextuais durante o jogo

## Prioridades Secundárias (ainda para v1.0)

### Mapas Interativos
- [x] Aprimorar ferramentas de criação de mapas
- [x] Implementar funcionalidades de zoom e navegação
- [x] Adicionar sistema de movimento de personagens no mapa

### Funcionalidades Avançadas
- [ ] Implementar versão básica de geração de NPCs
- [ ] Criar sistema simples de eventos dinâmicos baseados nas escolhas dos jogadores
- [ ] Desenvolver sistema básico de consequências para ações dos jogadores

### Sistema de Conquistas
- [ ] Implementar sistema básico de marcos de jogo
- [ ] Criar recompensas simples para jogadores e mestres

### Sistema de Agendamento e Sessões
- [x] Implementar interface básica de agendamento de sessões
- [x] Criar componente para visualização de sessões agendadas
- [ ] Melhorar a integração entre o agendamento e a interface do mestre
- [ ] Implementar notificações para lembrar usuários sobre sessões próximas
- [ ] Adicionar opção para convidar jogadores diretamente pelo sistema de agendamento

## Próximos Passos (Finalização v1.0)

### Otimizações de Performance Restantes (15%)
- [ ] Implementar sistema de cache de mapas para carregamento rápido
- [ ] Otimizar sincronização para mapas grandes
- [ ] Implementar auto-save contínuo com delta updates

### Ferramentas de Narrativa Avançadas (33% restante)
- [ ] Desenvolver editor avançado para mestres criarem histórias interativas
- [ ] Implementar sistema de eventos dinâmicos baseados nas ações dos jogadores
- [ ] Criar ferramentas de revelação narrativa progressiva

### Integração com IA para Geração de Conteúdo
- [ ] Implementar sistema de geração de NPCs com personalidades distintas
- [ ] Desenvolver gerador de missões e diálogos baseados no contexto da campanha
- [ ] Integrar com APIs de IA para criação de conteúdo dinâmico

### Validação da Experiência do Usuário
- [ ] Realizar testes com grupos de jogadores reais
- [ ] Coletar feedback sobre o sistema de Fog of War e ferramentas de mestre
- [ ] Identificar e implementar melhorias na interface baseadas no feedback

## Adiado para v2.0

### Funcionalidades Online Avançadas
- [ ] Implementar chat de voz e vídeo
- [ ] Criar sistema de partidas online com múltiplos jogadores simultâneos
- [ ] Desenvolver sistema avançado de notificações em tempo real

### Mercado de Itens
- [ ] Desenvolver sistema para mestres venderem conteúdo
- [ ] Implementar loja de itens e recursos

### IA Avançada
- [ ] Implementar IA para geração completa de aventuras
- [ ] Desenvolver sistema de sugestões de jogo baseadas em IA
- [ ] Criar simulações de jogo guiadas por IA