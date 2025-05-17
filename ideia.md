# Ideias e Requisitos para Keeper of Realms Forge

Este documento consolida as ideias e requisitos para o desenvolvimento da plataforma Keeper of Realms Forge, com foco em aprimorar a experiência de RPG de mesa.

## 1. Melhorias na Interface do Usuário (UI)

### 1.1. Barra Superior (Header)

*   **Aparência Geral:**
    *   Aumentar a altura da barra superior para acomodar mais informações e melhorar a estética.
    *   Aplicar texturas e elementos visuais que remetam ao tema medieval/fantasia, utilizando a imagem fornecida como referência para a identidade visual (logo).
    *   Garantir responsividade para uma boa visualização em dispositivos móveis.
*   **Foto de Perfil e Nível (Lado Esquerdo):**
    *   Aumentar significativamente o tamanho da foto de perfil do usuário.
    *   Exibir o nível do jogador de forma proeminente próximo à foto.
    *   Implementar uma barra de XP (experiência) visualmente clara, mostrando o progresso para o próximo nível (ex: "XP: 1500/2000").
    *   Ao clicar na foto de perfil/nível, abrir uma pequena janela (modal/pop-up) com mais detalhes.
*   **Recursos do Jogador (Centro/Direita):**
    *   Aumentar o tamanho dos ícones e valores de Gemas, Diamantes e Ouro.
    *   Adicionar outros indicadores relevantes, se necessário, para preencher o espaço e fornecer informações úteis (a definir).
*   **Ícones de Ação (Lado Direito):**
    *   Ícone de Notificações: Deve ser claro e indicar novas notificações.
    *   Ícone de Configurações: Acesso às configurações da conta e da plataforma.

### 1.2. Janelas Interativas (Modals/Pop-ups)

*   **Janela de Perfil (Ao clicar na foto/nível):**
    *   **Conteúdo a ser definido**, mas pode incluir:
        *   Nome de usuário.
        *   Título ou status.
        *   Link para perfil completo.
        *   Atalhos para inventário ou missões.
        *   Opção de logout.
*   **Janela de Notificações (Ao clicar no ícone de sino):**
    *   Listagem de notificações recentes (novas missões, recompensas, convites para mesas, etc.).
    *   Opção de marcar como lida ou dispensar notificações.
    *   Link para uma página de histórico de notificações, se necessário.
*   **Janela de Configurações (Ao clicar no ícone de engrenagem):**
    *   **Conteúdo a ser definido**, mas pode incluir:
        *   Configurações de conta (email, senha, foto de perfil).
        *   Preferências da plataforma (tema, notificações, idioma).
        *   Configurações de privacidade.
        *   Links para suporte ou termos de uso.

### 1.3. Estilo Visual e Tema

*   **Texturas e Elementos Medievais:** Incorporar texturas de pedra, madeira, metal envelhecido, pergaminho, etc., nos componentes da UI.
*   **Paleta de Cores:** Utilizar cores que remetam à fantasia medieval, como tons terrosos, roxos profundos, dourados e prateados, inspirando-se na logo fornecida.
*   **Tipografia:** Escolher fontes que complementem o tema medieval, garantindo legibilidade.
*   **Ícones:** Utilizar ícones estilizados que se encaixem na temática.

### 1.4. Responsividade

*   Adaptar a barra superior e as janelas interativas para uma boa experiência em dispositivos móveis.
*   Considerar como os elementos serão reorganizados ou redimensionados em telas menores.

## 2. Funcionalidades Adicionais

### 2.1. Imagens no Sistema

*   Adicionar imagens em todas as seções onde são esperadas (cards de criação, itens de loja, perfis de mesa, etc.).
*   Permitir upload de imagens pelos usuários onde aplicável (foto de perfil, imagem de mesa, imagem de personagem).
*   Utilizar imagens de placeholder ou buscar imagens temáticas na internet para preencher lacunas iniciais.

### 2.2. Páginas de Criação

*   Desenvolver as páginas dedicadas para:
    *   Criar Personagem
    *   Criar Monstro
    *   Criar Item
    *   Criar Mapa
    *   Criar História
    *   Criar NPC
*   Cada página deve ter um formulário com os campos relevantes, conforme detalhado no arquivo `tarefas.md`.

## 3. Integração com Supabase

*   **Tabelas:**
    *   Revisar todas as tabelas necessárias para o projeto (usuários, personagens, itens, monstros, mapas, histórias, NPCs, mesas, etc.).
    *   Criar/atualizar os scripts de migração do Supabase para todas as tabelas.
*   **Autenticação:**
    *   Integrar o sistema de login e cadastro com o Supabase Auth.
*   **Operações CRUD:**
    *   Conectar todas as funcionalidades de criação, leitura, atualização e exclusão de dados ao backend do Supabase.

## 4. Correção de Bugs

*   Identificar e corrigir os problemas existentes no código (atualmente 471 problemas reportados pelo ESLint ou outras ferramentas).

## 5. Logo da Plataforma

*   A imagem fornecida (chave com dragão e portal) será utilizada como logo oficial da plataforma.
*   Elementos visuais e a paleta de cores da logo devem inspirar o design geral da interface.

## Considerações Gerais

*   Manter o foco na experiência do usuário, com uma interface intuitiva e agradável.
*   Priorizar a escalabilidade e manutenibilidade do código.
*   Seguir as diretrizes de desenvolvimento e comunicação estabelecidas.