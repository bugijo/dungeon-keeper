# Plano de Desenvolvimento: Keeper of Realms Forge

Este documento detalha o plano de desenvolvimento para a plataforma Keeper of Realms Forge, com foco inicial em enriquecer a experiência de jogos de RPG presenciais.

## Visão Geral da Plataforma

A Keeper of Realms Forge será uma plataforma web para auxiliar jogadores e mestres de RPG, oferecendo ferramentas para criação de conteúdo, gerenciamento de mesas de jogo, progressão de personagens e interação social. Inicialmente, o foco será em funcionalidades que suportem e melhorem jogos disputados fisicamente, utilizando a plataforma como um complemento digital para organização e imersão.

## Estrutura de Navegação Principal (Barra Inferior/Lateral)

1.  **Missões:** Acompanhamento de progresso e recompensas.
2.  **Criações:** Hub central para criar diversos elementos de RPG.
3.  **Mesas:** Gerenciamento e participação em jogos.
4.  **Inventário:** Acesso a todo o conteúdo criado pelo usuário.
5.  **Loja:** Aquisição de conteúdo adicional.
6.  **Social (Ícone de Notificações/Amigos):** Avisos, calendário, amigos, chat.

## Detalhamento das Funcionalidades

### 1. Missões

*   **Descrição:** Seção gamificada para engajar o usuário. As missões incentivarão o uso da plataforma e a participação em jogos.
*   **Funcionalidades:**
    *   Listagem de missões disponíveis (ex: "Crie seu primeiro personagem", "Participe de uma mesa", "Crie uma história completa").
    *   Barra de progresso individual para cada missão.
    *   Sistema de recompensas ao completar missões (ex: gemas, diamantes, itens cosméticos para o perfil).
    *   Botão para resgatar prêmios após a conclusão.
    *   Notificações sobre novas missões ou progresso.

### 2. Criações

*   **Descrição:** Portal para a criação de todos os elementos de RPG suportados pela plataforma. Esta será a página inicial ao clicar em "Criações" na barra de navegação.
*   **Layout (Conforme Imagem 1):**
    *   Cards distintos para cada tipo de criação:
        *   Criar Personagem
        *   Criar Item
        *   Criar Mapa
        *   Criar História
        *   Criar Monstro
        *   Criar NPC
    *   Cada card terá uma breve descrição e um botão "Criar [Tipo]".
*   **Páginas de Criação Específicas (Detalhes abaixo em "Páginas de Criação de Conteúdo")**

### 3. Mesas de Jogo

*   **Descrição:** Área para encontrar, criar e gerenciar mesas de RPG.
*   **Layout da Página Principal de Mesas (Conforme Imagem 2):**
    *   **Barra de Busca:** Filtrar mesas por nome, mestre, gênero, sistema.
    *   **Botão "+ Criar Mesa":** Redireciona para a página de criação de mesa.
    *   **Listagem de Mesas:**
        *   Cada mesa será um card contendo:
            *   Imagem representativa da mesa (upload pelo mestre).
            *   Nome da Mesa.
            *   Nome do Mestre (com link para o perfil, se aplicável).
            *   Breve descrição da história.
            *   Gênero (Fantasia, Horror, Sci-Fi, etc. - selecionável de uma lista pré-definida ou customizável).
            *   Sistema de Jogo (Inicialmente D&D 5e, com planos de expansão).
            *   Contador de Jogadores (ex: "3/5 Jogadores" - atualizado dinamicamente).
            *   Data e Horário do Jogo.
            *   ID Único da Mesa (gerado automaticamente).
            *   Botão "Ver Detalhes".
*   **Página de Detalhes da Mesa:**
    *   Acessada ao clicar em "Ver Detalhes".
    *   Todas as informações do card da mesa, mas de forma mais expandida.
    *   História completa da mesa.
    *   Lista de jogadores já aprovados (com nome e talvez link para perfil).
    *   Informações adicionais pertinentes (regras da casa, material necessário, etc.).
    *   Para usuários não participantes: Botão "Solicitar para Participar".
        *   Ao clicar, a solicitação fica pendente de aprovação do mestre.
        *   O mestre recebe uma notificação.
    *   Para jogadores participantes: Informações relevantes para o jogo.
    *   Para o mestre: Ferramentas de gerenciamento da mesa (aprovar/rejeitar jogadores, editar informações da mesa, etc.).
*   **Página de Criação de Mesa:**
    *   Formulário com campos para:
        *   Nome da Mesa.
        *   Imagem da Mesa (upload).
        *   Descrição breve.
        *   História completa (pode ser um campo de texto rico ou link para uma história do inventário do mestre).
        *   Gênero.
        *   Sistema de Jogo.
        *   Número máximo de jogadores.
        *   Data e Horário.
        *   Opção para o mestre selecionar uma de suas histórias salvas no inventário para vincular à mesa.
        *   Outras informações personalizáveis (ex: nível dos personagens, restrições de idade).
    *   Ao criar, um ID único é gerado e a mesa aparece na listagem principal.

### 4. Inventário

*   **Descrição:** Espaço pessoal do usuário para acessar e gerenciar todas as suas criações.
*   **Funcionalidades:**
    *   Seções/Abas distintas para cada tipo de criação:
        *   Personagens
        *   Itens
        *   Mapas
        *   Histórias
        *   Monstros
        *   NPCs
    *   Em cada seção, listagem das criações do usuário com opções de visualizar, editar e excluir.
    *   Filtros e ordenação dentro de cada seção.

### 5. Loja

*   **Descrição:** Marketplace para adquirir conteúdos prontos, criados pela plataforma ou por outros usuários (feature futura).
*   **Layout (Conforme Imagem 3):**
    *   Categorias de itens à venda (Histórias Prontas, Pacotes de Mapas, Personagens Únicos, Conjuntos de NPCs, etc.).
    *   Destaque para itens populares ou em promoção.
    *   Cada item com imagem, descrição, preço (em gemas/diamantes ou moeda real - a definir).
    *   Sistema de carrinho de compras e checkout.
    *   Itens comprados são adicionados ao inventário do usuário.

### 6. Páginas de Criação de Conteúdo

*   **Descrição:** Formulários e ferramentas dedicadas para que os usuários criem seus próprios elementos de RPG.
*   **Página de Criação de Personagem:** (Concluído)
    *   Campos para nome, raça, classe, atributos (adaptáveis ao sistema D&D 5e inicialmente).
    *   Espaço para background, história, aparência.
    *   Upload de imagem do personagem.
    *   Opção de ficha de personagem digital (simplificada para jogos presenciais).
*   **Página de Criação de Item:**
    *   Nome, tipo (arma, armadura, poção, etc.), descrição, raridade, efeitos mecânicos.
    *   Upload de imagem.
*   **Página de Criação de Mapa:**
    *   Ferramenta de upload de imagem para o mapa.
    *   Opção de adicionar marcadores/legendas (foco simples para início).
    *   Título e descrição do mapa.
*   **Página de Criação de História:**
    *   Título, sinopse, enredo principal, NPCs chave, locais importantes.
    *   Editor de texto rico para formatação.
    *   Opção de dividir em capítulos ou seções.
*   **Página de Criação de Monstro/NPC:**
    *   Nome, tipo, atributos/estatísticas (simplificado para D&D 5e).
    *   Habilidades especiais, comportamento, lore.
    *   Upload de imagem.

### 7. Funcionalidades Sociais e Utilitários

*   **Avisos e Notificações:**
    *   Sistema de notificações para: novas missões, recompensas, solicitações para mesas, aprovações em mesas, mensagens de amigos, jogos agendados, etc.
    *   Ícone de sino na barra de navegação com contador de notificações não lidas.
*   **Calendário de Jogos:**
    *   Visualização dos jogos que o usuário está participando ou mestrando.
    *   Integração com as datas definidas nas mesas.
    *   Lembretes de jogos.
*   **Sistema de Amigos:**
    *   Adicionar/remover amigos.
    *   Ver perfil de amigos (com suas criações públicas, mesas que participa, etc.).
*   **Chat:**
    *   Chat individual com amigos.
    *   Chat em grupo para mesas de jogo (para organização fora do horário do jogo presencial).
*   **Sistema de Presentes:**
    *   Possibilidade de presentear amigos com itens da loja (usando gemas/diamantes).

### 8. Mesa de Jogo (Visualizações Específicas)

*   **Foco Inicial (Jogo Presencial):** As ferramentas da mesa de jogo online serão simplificadas, servindo como apoio ao jogo físico.
*   **Tela do Mestre (Apoio ao Jogo Presencial):**
    *   Acesso rápido à história da mesa, NPCs, monstros planejados.
    *   Notas rápidas e rolador de dados digital (opcional).
    *   Controle de iniciativa simplificado.
    *   Ferramentas para exibir imagens (mapas, personagens, cenas) em uma tela secundária, se disponível, para os jogadores.
    *   Gerenciamento de música ambiente (links para playlists ou upload de faixas curtas).
*   **Tela do Jogador (Apoio ao Jogo Presencial):**
    *   Acesso à ficha simplificada do seu personagem.
    *   Visualização de mapas e imagens compartilhadas pelo mestre.
    *   Rolador de dados digital (opcional).
    *   Inventário do personagem.

## Progresso Geral do Projeto

**Concluído: 29%**

## Próximos Passos e Prioridades (Revisado)

**Fase 1: Melhorias Visuais e Funcionais da Interface Principal**

1.  **Atualização da Barra Superior (Header):**
    *   Aumentar altura.
    *   Aplicar tema medieval (texturas, cores da logo fornecida).
    *   Aumentar foto de perfil (lado esquerdo).
    *   Exibir nível e barra de XP detalhada (com números de avanço de XP).
    *   Aumentar ícones e valores de Gemas, Diamantes, Ouro.
    *   Adicionar ícones de Notificações e Configurações.
    *   Garantir responsividade mobile.
2.  **Criação da Janela Modal de Perfil:**
    *   Desenvolver o modal/pop-up que abre ao clicar na foto/nível.
    *   Conteúdo: nome do jogador, título/patente, atalhos (ex: "Minhas Criações", "Minhas Mesas", "Editar Perfil"), botão de logout.
    *   Design responsivo e temático.
3.  **Criação da Janela Modal de Notificações:**
    *   Desenvolver o modal/pop-up para o ícone de notificações.
    *   Implementar listagem de notificações (com título, breve descrição, tipo, data/hora).
    *   Funcionalidade para marcar notificações como lidas (individualmente ou todas).
    *   Link para a origem da notificação (ex: uma mesa, uma missão, um amigo).
    *   Design responsivo e temático.
4.  **Criação da Janela Modal de Configurações:**
    *   Desenvolver o modal/pop-up para o ícone de configurações.
    *   Seções: 
        *   **Conta:** Alterar email, alterar senha, gerenciar conta (ex: excluir conta).
        *   **Preferências:** Idioma, tema da interface (se houver mais de um), configurações de notificação (quais tipos receber).
        *   **Privacidade:** Gerenciar visibilidade do perfil, dados compartilhados.
        *   **Sobre:** Versão do aplicativo, links para termos de serviço e política de privacidade.
    *   Design responsivo e temático.
5.  **Implementação de Imagens e Placeholders:**
    *   Adicionar placeholders visuais temáticos (medievais/fantasia) onde imagens são esperadas (cards de criação, perfil do usuário, itens da loja, etc.).
    *   Implementar funcionalidade de upload de imagens onde necessário (ex: foto de perfil, imagem de personagem, mapa).
    *   Utilizar a logo fornecida como inspiração para elementos visuais e texturas.

**Fase 2: Conteúdo e Funcionalidades Essenciais (Páginas de Criação)**

6.  **Desenvolvimento das Páginas de Criação:**
    *   **Criar Personagem:** Formulário com campos para nome, raça, classe, atributos (adaptáveis ao sistema D&D 5e inicialmente), background, história, aparência, upload de imagem do personagem, opção de ficha de personagem digital simplificada.
    *   **Criar Monstro/NPC:** Formulário com nome, tipo, atributos/estatísticas (simplificado para D&D 5e), habilidades especiais, comportamento, lore, upload de imagem.
    *   **Criar Item:** Formulário com nome, tipo (arma, armadura, poção, etc.), descrição, raridade, efeitos mecânicos, upload de imagem.
    *   **Criar Mapa:** Ferramenta de upload de imagem para o mapa, opção de adicionar marcadores/legendas simples, título e descrição do mapa.
    *   **Criar História:** Título, sinopse, enredo principal, NPCs chave, locais importantes, editor de texto rico para formatação, opção de dividir em capítulos ou seções.
    *   Garantir design responsivo e temático para todas as páginas de criação.

**Fase 3: Backend, Autenticação e Integração com Supabase**

7.  **Estrutura Base e Autenticação com Supabase:**
    *   Configurar o backend e sistema de login/registro com Supabase.
    *   Revisar os arquivos de migração existentes (`20240825_notifications_table.sql`, `20230501000001_create_notifications_table.sql`, `create_profiles_table.sql`) e criar/atualizar tabelas no Supabase conforme necessário para: perfis de usuário (com XP, nível, gemas, diamantes, ouro), notificações, personagens, itens, mapas, histórias, monstros, NPCs, mesas de jogo, participantes de mesas, etc.
    *   Integrar as telas de login e cadastro com o Supabase.
    *   Implementar a lógica para atualização de XP, nível e moedas do usuário.
8.  **Navegação Principal:**
    *   Implementar/Revisar a barra de navegação inferior/lateral para acesso às seções principais: Missões, Criações, Mesas, Inventário, Loja, Social.
9.  **Seção de Criações (Hub):** (Concluído)
    *   Desenvolver a página principal de criações com os cards distintos para cada tipo de criação (Personagem, Item, Mapa, História, Monstro, NPC), conforme Imagem 1 mencionada no `tarefas.md` original.
10. **Seção de Inventário:** (Concluído)
    *   Listagem e visualização das criações do usuário, com filtros e opções de editar/excluir.
11. **Seção de Mesas de Jogo (Core):**
    *   Implementar a criação de mesas (Integrado com Supabase - Concluído), listagem (com filtros - Concluído), página de detalhes da mesa (Estrutura criada, carregamento de dados implementado, sistema de solicitação para participar concluído).

**Fase 4: Refinamento, Correções e Funcionalidades Adicionais**

12. **Correção de Bugs e Problemas de Linting:**
    *   Resolver os problemas de linting identificados (atualmente 471).
    *   Realizar testes abrangentes e corrigir bugs em todas as funcionalidades implementadas.
13. **Foco no Jogo Presencial (Utilitários):**
    *   Implementar utilitários simples para apoiar o jogo físico na tela do mestre (acesso rápido à história, NPCs, monstros, notas, rolador de dados, controle de iniciativa, exibição de imagens, gerenciamento de música) e do jogador (acesso à ficha, visualização de mapas/imagens, rolador de dados, inventário).
14. **Seção de Missões:**
    *   Implementar a listagem de missões, barra de progresso, sistema de recompensas e notificações relacionadas.
15. **Seção de Loja (Básica):**
    *   Estrutura inicial da loja com categorias e listagem de itens (sem funcionalidade de compra completa inicialmente, foco no layout).
16. **Funcionalidades Sociais (Básicas):**
    *   Estrutura inicial para Avisos/Notificações (integrado com modal da Fase 1), Calendário de Jogos, Sistema de Amigos e Chat (foco na interface, sem backend completo inicialmente).

**Fase 5: Documentação e Manutenção Contínua**

17. **Atualização do arquivo `ideia.md`:**
    *   Incorporar as novas funcionalidades, decisões de design e arquitetura do projeto. (Será feito quando as ferramentas de sistema de arquivos estiverem estáveis).
18. **Manutenção do arquivo `tarefas.md`:**
    *   Atualizar o progresso (porcentagem e status de cada tarefa) e reordenar/detalhar tarefas conforme o desenvolvimento avança.

## Considerações Adicionais

*   **Design Responsivo:** Garantir que a plataforma seja utilizável em desktops e dispositivos móveis em todas as fases.
*   **UI/UX:** Manter uma interface intuitiva e com a temática de RPG medieval/fantasia, inspirada na logo.
*   **Performance:** Otimizar o carregamento das páginas e interações.
*   **Segurança:** Proteger os dados dos usuários.

Este plano será revisado e atualizado conforme o desenvolvimento avança e novas ideias surgem.