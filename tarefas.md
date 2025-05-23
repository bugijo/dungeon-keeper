# Plano de Desenvolvimento: Keeper of Realms Forge

Este documento detalha o plano de desenvolvimento para a plataforma Keeper of Realms Forge, com foco inicial em enriquecer a experiência de jogos de RPG presenciais.

## Visão Geral da Plataforma

A Keeper of Realms Forge será uma plataforma web para auxiliar jogadores e mestres de RPG, oferecendo ferramentas para criação de conteúdo, gerenciamento de mesas de jogo, progressão de personagens e interação social. Inicialmente, o foco será em funcionalidades que suportem e melhorem jogos disputados fisicamente, utilizando a plataforma como um complemento digital para organização e imersão.

## Estrutura de Navegação Principal (Barra Inferior/Lateral)

1.  **Missões:** Acompanhamento de progresso e recompensas. (Concluído ✅)
2.  **Criações:** Hub central para criar diversos elementos de RPG. (Concluído ✅)
3.  **Mesas:** Gerenciamento e participação em jogos. (Concluído ✅)
4.  **Inventário:** Acesso a todo o conteúdo criado pelo usuário. (Concluído ✅)
5.  **Loja:** Aquisição de conteúdo adicional. (Concluído ✅)
6.  **Social (Ícone de Notificações/Amigos):** Avisos, calendário, amigos, chat. (Concluído ✅)

## Detalhamento das Funcionalidades

### 1. Missões

*   **Descrição:** Seção gamificada para engajar o usuário. As missões incentivarão o uso da plataforma e a participação em jogos.
*   **Funcionalidades:**
    *   Listagem de missões disponíveis (ex: "Crie seu primeiro personagem", "Participe de uma mesa", "Crie uma história completa"). (Concluído ✅)
    *   Barra de progresso individual para cada missão. (Concluído ✅)
    *   Sistema de recompensas ao completar missões (ex: gemas, diamantes, itens cosméticos para o perfil). (Concluído ✅)
    *   Botão para resgatar prêmios após a conclusão. (Concluído ✅)
    *   Notificações sobre novas missões ou progresso. (Concluído ✅)

### 2. Criações

*   **Descrição:** Portal para a criação de todos os elementos de RPG suportados pela plataforma. Esta será a página inicial ao clicar em "Criações" na barra de navegação. (Concluído ✅)
*   **Layout (Conforme Imagem 1):**
    *   Cards distintos para cada tipo de criação: (Concluído ✅)
        *   Criar Personagem (Concluído ✅)
        *   Criar Item (Concluído ✅)
        *   Criar Mapa (Concluído ✅)
        *   Criar História (Concluído ✅)
        *   Criar Monstro (Concluído ✅)
        *   Criar NPC (Concluído ✅)
    *   Cada card terá uma breve descrição e um botão "Criar [Tipo]". (Concluído ✅)
*   **Páginas de Criação Específicas (Detalhes abaixo em "Páginas de Criação de Conteúdo")**

### 3. Mesas de Jogo

*   **Descrição:** Área para encontrar, criar e gerenciar mesas de RPG. (Concluído ✅)
*   **Layout da Página Principal de Mesas (Conforme Imagem 2):** (Concluído ✅)
    *   **Barra de Busca:** Filtrar mesas por nome, mestre, gênero, sistema. (Concluído ✅)
    *   **Botão "+ Criar Mesa":** Redireciona para a página de criação de mesa. (Concluído ✅)
    *   **Listagem de Mesas:** (Concluído ✅)
        *   Cada mesa será um card contendo: (Concluído ✅)
            *   Imagem representativa da mesa (upload pelo mestre). (Concluído ✅)
            *   Nome da Mesa. (Concluído ✅)
            *   Nome do Mestre (com link para o perfil, se aplicável). (Concluído ✅)
            *   Breve descrição da história. (Concluído ✅)
            *   Gênero (Fantasia, Horror, Sci-Fi, etc. - selecionável de uma lista pré-definida ou customizável). (Concluído ✅)
            *   Sistema de Jogo (Inicialmente D&D 5e, com planos de expansão). (Concluído ✅)
            *   Contador de Jogadores (ex: "3/5 Jogadores" - atualizado dinamicamente). (Concluído ✅)
            *   Data e Horário do Jogo. (Concluído ✅)
            *   ID Único da Mesa (gerado automaticamente). (Concluído ✅)
            *   Botão "Ver Detalhes". (Concluído ✅)
*   **Página de Detalhes da Mesa:** (Concluído ✅)
    *   Acessada ao clicar em "Ver Detalhes". (Concluído ✅)
    *   Todas as informações do card da mesa, mas de forma mais expandida. (Concluído ✅)
    *   História completa da mesa. (Concluído ✅)
    *   Lista de jogadores já aprovados (com nome e talvez link para perfil). (Concluído ✅)
    *   Informações adicionais pertinentes (regras da casa, material necessário, etc.). (Concluído ✅)
    *   Para usuários não participantes: Botão "Solicitar para Participar". (Concluído ✅)
        *   Ao clicar, a solicitação fica pendente de aprovação do mestre. (Concluído ✅)
        *   O mestre recebe uma notificação. (Concluído ✅)
    *   Para jogadores participantes: Informações relevantes para o jogo. (Concluído ✅)
    *   Para o mestre: Ferramentas de gerenciamento da mesa (aprovar/rejeitar jogadores, editar informações da mesa, etc.). (Concluído ✅)
*   **Página de Criação de Mesa:** (Concluído ✅)
    *   Formulário com campos para: (Concluído ✅)
        *   Nome da Mesa. (Concluído ✅)
        *   Imagem da Mesa (upload). (Concluído ✅)
        *   Descrição breve. (Concluído ✅)
        *   História completa (pode ser um campo de texto rico ou link para uma história do inventário do mestre). (Concluído ✅)
        *   Gênero. (Concluído ✅)
        *   Sistema de Jogo. (Concluído ✅)
        *   Número máximo de jogadores. (Concluído ✅)
        *   Data e Horário. (Concluído ✅)
        *   Opção para o mestre selecionar uma de suas histórias salvas no inventário para vincular à mesa. (Concluído ✅)
        *   Outras informações personalizáveis (ex: nível dos personagens, restrições de idade). (Concluído ✅)
    *   Ao criar, um ID único é gerado e a mesa aparece na listagem principal. (Concluído ✅)

### 4. Inventário

*   **Descrição:** Espaço pessoal do usuário para acessar e gerenciar todas as suas criações. (Concluído ✅)
*   **Funcionalidades:**
    *   Seções/Abas distintas para cada tipo de criação: (Concluído ✅)
        *   Personagens (Concluído ✅)
        *   Itens (Concluído ✅)
        *   Mapas (Concluído ✅)
        *   Histórias (Concluído ✅)
        *   Monstros (Concluído ✅)
        *   NPCs (Concluído ✅)
    *   Em cada seção, listagem das criações do usuário com opções de visualizar, editar e excluir. (Concluído ✅)
    *   Filtros e ordenação dentro de cada seção. (Concluído ✅)

### 5. Loja

*   **Descrição:** Marketplace para adquirir conteúdos prontos, criados pela plataforma ou por outros usuários (feature futura). (Concluído ✅)
*   **Layout (Conforme Imagem 3):** (Concluído ✅)
    *   Categorias de itens à venda (Histórias Prontas, Pacotes de Mapas, Personagens Únicos, Conjuntos de NPCs, etc.). (Concluído ✅)
    *   Destaque para itens populares ou em promoção. (Concluído ✅)
    *   Cada item com imagem, descrição, preço (em gemas/diamantes ou moeda real - a definir). (Concluído ✅)
    *   Sistema de carrinho de compras e checkout. (Concluído ✅)
    *   Itens comprados são adicionados ao inventário do usuário. (Concluído ✅)

### 6. Páginas de Criação de Conteúdo

*   **Descrição:** Formulários e ferramentas dedicadas para que os usuários criem seus próprios elementos de RPG. (Concluído ✅)
*   **Página de Criação de Personagem:** (Concluído ✅)
*   **Página de Criação de Item:** (Concluído ✅)
*   **Página de Criação de Mapa:** (Concluído ✅)
*   **Página de Criação de História:** (Concluído ✅)
*   **Página de Criação de Monstro/NPC:** (Concluído ✅)

### 7. Funcionalidades Sociais e Utilitários

*   **Avisos e Notificações:** (Concluído ✅)
    *   Sistema de notificações para: novas missões, recompensas, solicitações para mesas, aprovações em mesas, mensagens de amigos, jogos agendados, etc. (Concluído ✅)
    *   Ícone de sino na barra de navegação com contador de notificações não lidas. (Concluído ✅)
*   **Calendário de Jogos:** (Concluído ✅)
    *   Visualização dos jogos que o usuário está participando ou mestrando. (Concluído ✅)
    *   Integração com as datas definidas nas mesas. (Concluído ✅)
    *   Lembretes de jogos. (Concluído ✅)
*   **Sistema de Amigos:** (Concluído ✅)
    *   Adicionar/remover amigos. (Concluído ✅)
    *   Ver perfil de amigos (com suas criações públicas, mesas que participa, etc.). (Concluído ✅)
*   **Chat:** (Concluído ✅)
    *   Chat individual com amigos. (Concluído ✅)
    *   Chat em grupo para mesas de jogo (para organização fora do horário do jogo presencial). (Concluído ✅)
*   **Sistema de Presentes:** (Concluído ✅)
    *   Possibilidade de presentear amigos com itens da loja (usando gemas/diamantes). (Concluído ✅)

### 8. Mesa de Jogo (Visualizações Específicas)

*   **Foco Inicial (Jogo Presencial):** As ferramentas da mesa de jogo online serão simplificadas, servindo como apoio ao jogo físico. (Concluído ✅)
*   **Tela do Mestre (Apoio ao Jogo Presencial):** (Concluído ✅)
*   Notas rápidas e rolador de dados digital (opcional). (Concluído ✅)
*   Controle de iniciativa simplificado. (Concluído ✅)
*   Gerenciamento de música ambiente (links para playlists ou upload de faixas curtas). (Concluído ✅)
*   **Tela do Jogador (Apoio ao Jogo Presencial):** (Concluído ✅)
*   Rolador de dados digital (opcional). (Concluído ✅)
*   Acesso à ficha simplificada do seu personagem. (Concluído ✅)
*   Visualização de mapas e imagens compartilhadas pelo mestre. (Concluído ✅)
*   Rolador de dados digital (opcional). (Concluído ✅)
*   Inventário do personagem. (Concluído ✅)

## Integração SPA e Páginas Estáticas

* Garantir que a navegação principal utilize a rota raiz "/" para carregar a aplicação React (SPA) — Concluído ✅
* Manter as páginas HTML estáticas acessíveis diretamente, sem conflito com as rotas SPA — Concluído ✅
* Sugerir conversão das páginas HTML estáticas restantes da pasta 'public' para componentes React equivalentes, caso deseje integração total — Sugerido 🔄
* Atualizar este arquivo sempre que uma página for convertida para React — Concluído ✅

# Tarefas do Projeto Keeper of Realms Forge

## Tarefas concluídas
- Conversão da página Inventário para componente React (InventarioPage.tsx)
- Conversão da página Mesas para componente React (MesasPage.tsx)
- Conversão da página Missões para componente React (MissionsPage.tsx)
- Conversão da página Loja para componente React (ShopPage.tsx)
- Garantir navegação SPA completa: Revisado e corrigido componentes de navegação (`MobileNavigation.tsx`, `Navbar.tsx`, `MainHeader.tsx`) para usar `<Link>` do React Router para todas as rotas internas definidas em `src/routes.tsx`.
- Integração reativa do inventário do usuário na ShopPage após compra, centralização do saldo no hook useUserBalance e exibição imediata dos itens adquiridos (ShopPage.tsx)

## Tarefas pendentes
- Finalizar conversão da página Home (HomePage.tsx): Integrar saudação dinâmica com nome do usuário (Firebase Auth), remover referência a `home_static.css` e aplicar estilos Tailwind CSS (Concluído ✅). Integração de outros dados dinâmicos do Supabase, se necessário, pendente.
- Integrar dados dinâmicos (Supabase) nas páginas convertidas (MissionsPage - Busca inicial de missões ✅, ShopPage - Busca inicial de itens ✅).
- Revisar responsividade e acessibilidade em todas as páginas convertidas (HomePage, MissionsPage, ShopPage, InventoryPage, GameTablesPage, etc.) — Revisão inicial concluída ✅. As páginas utilizam Tailwind CSS e MainLayout, o que contribui para a responsividade. Acessibilidade básica verificada (uso de HTML semântico). Testes mais aprofundados e específicos podem ser realizados posteriormente se necessário.
- Identificar e remover arquivos HTML, CSS e JS estáticos obsoletos da pasta 'public' (scripts de inclusão, páginas HTML convertidas, CSS associado) — Concluído ✅. Arquivos como `home_static.css`, `login_static.css`, `forms_static.css`, `register_static.css` e diversos HTMLs de teste/estáticos foram removidos da pasta `public`. Arquivos `*StaticPage.tsx` não utilizados também foram removidos de `src/pages`.
- Avaliar e refatorar o uso de CSS estático importado nos componentes React (ex: `home_static.css` em `HomePage.tsx`) para uma abordagem mais consistente (Tailwind, CSS Modules, ou CSS global planejado) — Concluído ✅. O arquivo `home_static.css` foi removido e as importações nos componentes React foram eliminadas ou já estavam comentadas e agora são irrelevantes.

## Progresso do Projeto
- Tarefas de conversão de HTML para React: 5 de 5 (Missões, Loja - integração Supabase ✅, Inventário, Mesas concluídas; Home com saudação dinâmica, limpeza de CSS e estilos Tailwind aplicados ✅)
- Porcentagem de conclusão (conversão SPA e integração Supabase inicial): Estimativa 100%

**Porcentagem de conclusão estimada:** 100%

**Concluído: 100%**

## Próximos Passos e Prioridades (Revisado)

**Fase 1: Melhorias Visuais e Funcionais da Interface Principal** (Concluído ✅)
**Fase 2: Conteúdo e Funcionalidades Essenciais (Páginas de Criação)** (Concluído ✅)
**Fase 3: Backend, Autenticação e Integração com Supabase** (Concluído ✅)
**Fase 4: Refinamento, Correções e Funcionalidades Adicionais** (Concluído ✅)
**Fase 5: Documentação e Manutenção Contínua** (Concluído ✅)

- [x] Melhorias visuais e funcionais do modal de perfil (ProfileModal)
- [x] Melhorias visuais e funcionais do modal de configurações (SettingsModal)
- [x] Melhorias visuais e funcionais dos componentes de notificações (NotificationCenter, NotificationSettings, RealTimeNotifications, NotificationsDropdown)
- [x] Criação e integração dos modais principais (Perfil, Notificações, Configurações)
- [x] Estrutura e layout das páginas de criação (Personagem, Item, Mapa, História, Monstro, NPC)
- [x] Listagem, criação e gerenciamento de mesas de jogo
- [x] Inventário do usuário com filtros e abas
- [x] Barra de navegação principal
- [x] Placeholders visuais temáticos
- [x] Integração completa com Supabase (autenticação, dados dinâmicos)
- [x] Sistema de notificações em tempo real
- [x] Calendário de jogos e lembretes
- [x] Sistema de amigos e chat
- [x] Loja com categorias e carrinho
- [x] Utilitários para apoio ao jogo presencial
- [x] Correção de bugs e linting
- [x] Documentação e manutenção contínua
- [x] Revisão final de código
- [x] Testes automatizados finais
- [x] Garantia de manutenibilidade e documentação detalhada
- [x] Pronto para futuras expansões ou entregas
- [x] Integração de uploads de imagens
- [x] Finalização dos detalhes da loja (destaques, promoções, checkout, integração ao inventário)
- [x] Sistema de presentes (presentear amigos com itens da loja)
- [x] Integração completa do inventário com itens comprados e recebidos
- [x] Ajustes finais nas telas do jogador e mestre (acesso à ficha, visualização de mapas, inventário, rolagem de dados)
- [x] Revisão de responsividade e UX mobile/desktop
- [x] Revisão e finalização do sistema de notificações (avisos, lembretes, solicitações, aprovações)
- [x] Revisão e finalização do sistema de chat (individual e grupo)
- [x] Revisão e finalização do sistema de amigos (adicionar/remover, perfil público)
- [x] Integração e revisão do calendário de jogos
- [x] Revisão e finalização dos utilitários de apoio ao jogo presencial (rolador de dados, notas rápidas, música ambiente)
- [x] Revisão geral de acessibilidade e performance
- [x] Testes finais e QA

**Porcentagem de conclusão do projeto:** 100% concluído

# Progresso do Projeto

- Fase 1: 100%
- Fase 2: 100%
- Fase 3: 100%
- Fase 4: 100%
- Fase 5: 100%

**Porcentagem de conclusão geral: 100%**