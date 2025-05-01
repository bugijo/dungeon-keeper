# Lista de Tarefas - Dungeon Kreeper (DK) v1.0

## Progresso Geral do Projeto

| Funcionalidade | Progresso |
|---------------|----------|
| Interface de Usuário | 60% |
| Criação de Personagens | 40% |
| Criação de Mesas e Aventuras | 70% |
| Sistema de Agendamento de Sessões | 85% |
| Funcionalidades de Jogo | 50% |
| Mapas Interativos | 45% |
| Sincronização em Tempo Real | 70% |
| **Progresso Total** | **60%** |

## Prioridades Imediatas

### Interface de Usuário
- [ ] Finalizar tela de login com opções de e-mail e nome de usuário
- [ ] Implementar opção "Jogar sem Conta" para facilitar acesso de novos jogadores
- [ ] Desenvolver tela inicial com visualização de mesas disponíveis
- [ ] Criar sistema de filtros para busca de mesas por tipo, sistema e número de jogadores
- [ ] Implementar interface para entrada em jogos em andamento

### Criação de Personagens
- [ ] Finalizar editor intuitivo de personagens com opções de classe, habilidades e atributos
- [ ] Implementar sistema de armazenamento e compartilhamento de personagens
- [ ] Integrar regras de D&D 5e para validação de personagens
- [ ] Adicionar opção de geração automática de personagens (versão básica)

### Criação de Mesas e Aventuras
- [ ] Desenvolver ferramentas para mestres criarem aventuras customizadas
- [ ] Implementar sistema de personalização de mesa (número de jogadores, configurações)
- [x] Criar sistema de agendamento de sessões
- [ ] Adicionar opções para mestres definirem regras específicas da mesa
- [x] **CONCLUÍDO**: Adicionar rota para o componente SessionScheduler no App.tsx (o botão em SessionsSection agora redireciona corretamente para "/session-scheduler")

### Funcionalidades de Jogo
- [ ] Implementar sistema de rolagem de dados digital (d4, d6, d8, d10, d12, d20)
- [ ] Desenvolver sistema de feedback em tempo real para rolagens
- [ ] Criar ferramenta básica para criação de mapas interativos
- [ ] Implementar sistema de chat de texto para comunicação durante o jogo
- [ ] Adicionar sistema básico de reações visuais (emoticons)

### Tutoriais
- [ ] Criar tutoriais básicos para novos jogadores
- [ ] Desenvolver guias sobre regras de D&D 5e
- [ ] Implementar dicas contextuais durante o jogo

## Prioridades Secundárias (ainda para v1.0)

### Mapas Interativos
- [ ] Aprimorar ferramentas de criação de mapas
- [ ] Implementar funcionalidades de zoom e navegação
- [ ] Adicionar sistema de movimento de personagens no mapa

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

## Adiado para v2.0

### Funcionalidades Online
- [ ] Implementar chat de voz e vídeo
- [x] Desenvolver sistema de sincronização em tempo real (implementado parcialmente com Supabase)
- [ ] Criar sistema de partidas online com múltiplos jogadores
- [ ] Melhorar sistema de notificações em tempo real para sessões agendadas

### Mercado de Itens
- [ ] Desenvolver sistema para mestres venderem conteúdo
- [ ] Implementar loja de itens e recursos

### IA Avançada
- [ ] Implementar IA para geração completa de aventuras
- [ ] Desenvolver sistema de sugestões de jogo baseadas em IA
- [ ] Criar simulações de jogo guiadas por IA