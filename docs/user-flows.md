
# Fluxos de Usuário - Keeper of Realms

Este documento descreve os principais fluxos de interação no Keeper of Realms, fornecendo um guia detalhado sobre como os usuários navegam e utilizam o sistema.

## 1. Registro e Onboarding

```
Início → Página Inicial → Botão "Registrar" → Formulário de Registro →
Verificação de Email → Primeira Entrada → Tutorial Básico → Perfil Completo
```

### Detalhes do Fluxo
1. **Página Inicial**: Usuário visualiza informações sobre o sistema e opções de login/registro
2. **Formulário de Registro**: Preenchimento de email, senha e informações básicas
3. **Verificação**: Confirmação através do email (opcional, configurável no Supabase)
4. **Primeira Entrada**: Tela de boas-vindas com visão geral do sistema
5. **Tutorial**: Introdução guiada às principais funcionalidades
6. **Perfil**: Completar informações de perfil e preferências

## 2. Criação de Mesa (Mestre)

```
Dashboard → "Nova Mesa" → Formulário de Criação → Configurações Adicionais →
Mesa Criada → Compartilhamento de Convites → Visualização de Solicitações →
Aprovar Jogadores → Configurar Sessão
```

### Detalhes do Fluxo
1. **Dashboard**: Visão geral das mesas existentes e opção de criar nova
2. **Formulário de Criação**: Nome, descrição, sistema, limite de jogadores, etc.
3. **Mesa Criada**: Confirmação e acesso aos detalhes da mesa
4. **Convites**: Compartilhamento de link ou convite direto a jogadores
5. **Solicitações**: Visualização e gestão de pedidos de participação
6. **Aprovação**: Seleção dos jogadores que participarão da mesa
7. **Configuração**: Preparação da primeira sessão e detalhes adicionais

## 3. Participação em Mesa (Jogador)

```
Dashboard → Descobrir Mesas → Filtragem por Preferências → Visualizar Detalhes →
Solicitar Participação → Aguardar Aprovação → Notificação de Aprovação →
Criar/Selecionar Personagem → Juntar-se à Sessão
```

### Detalhes do Fluxo
1. **Dashboard**: Acesso à lista de mesas disponíveis
2. **Descoberta**: Busca e filtragem de mesas por sistema, horário, etc.
3. **Detalhes**: Visualização completa das informações da mesa
4. **Solicitação**: Pedido para participar da mesa selecionada
5. **Aguardo**: Espera pela decisão do mestre (com indicador de status)
6. **Aprovação**: Notificação de aceitação na mesa
7. **Personagem**: Criação de novo personagem ou seleção de existente
8. **Sessão**: Acesso à interface de jogo quando a sessão iniciar

## 4. Preparação para Sessão (Mestre)

```
Lista de Mesas → Selecionar Mesa → Painel do Mestre → Preparar Conteúdo →
Carregar Mapas → Configurar NPCs/Monstros → Revisar Notas → 
Notificar Jogadores → Iniciar Sessão
```

### Detalhes do Fluxo
1. **Lista de Mesas**: Acesso às mesas criadas pelo usuário
2. **Painel do Mestre**: Dashboard com ferramentas e opções
3. **Preparação**: Criação e organização de conteúdo para a sessão
4. **Mapas**: Upload ou seleção de mapas para encontros
5. **NPCs/Monstros**: Configuração de personagens não-jogáveis
6. **Notas**: Revisão do material preparado para a sessão
7. **Notificação**: Alerta aos jogadores sobre a sessão iminente
8. **Início**: Abertura da sala de jogo e início da narrativa

## 5. Participação em Sessão (Jogador)

```
Dashboard → Mesas Participando → Selecionar Mesa → Notificação de Sessão →
Revisar Personagem → Juntar-se à Sessão → Interagir na Partida → 
Atualizar Personagem → Encerramento
```

### Detalhes do Fluxo
1. **Dashboard**: Visão geral das mesas em que participa
2. **Seleção**: Acesso à mesa agendada para a sessão
3. **Notificação**: Recebimento de alerta sobre início da sessão
4. **Revisão**: Verificação da ficha e recursos do personagem
5. **Entrada**: Ingresso na sala de jogo virtual
6. **Interação**: Participação na narrativa, combates e rolagens
7. **Atualização**: Registro de mudanças no personagem durante a sessão
8. **Encerramento**: Finalização da sessão e salvamento do progresso

## 6. Gerenciamento de Personagens

```
Perfil → Meus Personagens → Criar Novo/Selecionar Existente → 
Editor de Personagem → Atributos → Equipamentos → Habilidades → 
Histórico → Salvar → Associar à Mesa
```

### Detalhes do Fluxo
1. **Perfil**: Acesso à área pessoal do usuário
2. **Personagens**: Lista de personagens criados pelo usuário
3. **Criação/Seleção**: Início de novo personagem ou edição de existente
4. **Editor**: Interface completa para configuração do personagem
5. **Configuração**: Definição de atributos, equipamentos e habilidades
6. **Histórico**: Adição de background e detalhes narrativos
7. **Salvamento**: Confirmação das alterações realizadas
8. **Associação**: Vinculação do personagem a uma mesa específica

## 7. Administração de Mesa (Mestre)

```
Minhas Mesas → Selecionar Mesa → Painel de Administração → 
Gerenciar Jogadores → Editar Detalhes → Configurar Sessões → 
Gerenciar Conteúdo → Histórico de Sessões
```

### Detalhes do Fluxo
1. **Minhas Mesas**: Acesso às mesas criadas pelo usuário
2. **Seleção**: Escolha da mesa para administrar
3. **Painel**: Interface de controle para diversas funções
4. **Jogadores**: Gerenciamento de participantes e solicitações
5. **Edição**: Atualização de informações e configurações da mesa
6. **Sessões**: Agendamento e organização de encontros
7. **Conteúdo**: Gerenciamento de recursos da campanha
8. **Histórico**: Visualização e registro de sessões anteriores

## 8. Criação de Conteúdo

```
Dashboard → Seção de Criações → Selecionar Tipo (Mapa/Item/NPC/História) →
Editor Específico → Configurar Detalhes → Visualizar Prévia → 
Salvar → Compartilhar/Usar nas Mesas
```

### Detalhes do Fluxo
1. **Dashboard**: Acesso à área de criação de conteúdo
2. **Tipo**: Seleção do tipo de conteúdo a ser criado
3. **Editor**: Interface especializada para o tipo selecionado
4. **Configuração**: Definição de atributos e características
5. **Prévia**: Visualização do resultado antes de finalizar
6. **Salvamento**: Armazenamento do conteúdo criado
7. **Uso**: Aplicação do conteúdo em mesas ou compartilhamento

## 9. Sistema de Chat e Comunicação

```
Interface de Jogo → Painel de Chat → Selecionar Canal → 
Enviar Mensagem → Rolagem de Dados via Chat → 
Compartilhar Recursos → Comunicação Privada
```

### Detalhes do Fluxo
1. **Interface**: Acesso ao componente de chat dentro da mesa
2. **Canal**: Seleção entre diferentes canais de comunicação
3. **Mensagens**: Envio de texto e comandos para o grupo
4. **Dados**: Uso de comandos especiais para rolagens
5. **Recursos**: Compartilhamento de links, imagens e arquivos
6. **Privado**: Comunicação direta com jogadores específicos

## 10. Encerramento e Feedback de Sessão

```
Fim da Sessão → Resumo Automático → Registro de Eventos Importantes →
Atualização de Personagens → Feedback dos Jogadores → 
Planejamento da Próxima Sessão
```

### Detalhes do Fluxo
1. **Encerramento**: Finalização oficial da sessão pelo mestre
2. **Resumo**: Geração automática de síntese dos eventos
3. **Registro**: Salvamento de momentos importantes e decisões
4. **Atualização**: Confirmação de mudanças nos personagens
5. **Feedback**: Coleta de impressões e sugestões dos jogadores
6. **Planejamento**: Configuração preliminar da próxima sessão

---

Estes fluxos servem como guias gerais para o desenvolvimento da interface e experiência do usuário, assegurando que todas as funcionalidades sejam acessíveis de maneira intuitiva e eficiente.
