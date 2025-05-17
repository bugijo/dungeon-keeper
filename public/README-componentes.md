# Documentação dos Componentes de Interface

## Visão Geral

Este documento descreve os componentes de interface implementados no projeto Keeper of Realms Forge, especificamente a barra superior fixa (topbar) e a barra lateral (sidebar) que foram implementadas para manter um layout consistente em todas as páginas do projeto.

## Componentes Implementados

### 1. Barra Superior (Topbar)

A barra superior é um componente fixo que aparece no topo de todas as páginas. Ela contém:

- Foto de perfil do jogador
- Nome e ID do jogador
- Nível com barra de experiência
- Recursos (ouro, diamante, gema)
- Botões de notificação e configurações
- Botão de menu hamburger para dispositivos móveis

### 2. Barra Lateral (Sidebar)

A barra lateral é um componente de navegação que aparece no lado esquerdo das páginas de navegação, exceto na página inicial. Ela contém:

- Logo/título do sistema
- Links de navegação para as principais seções do sistema
- Ícones visuais para cada opção de menu

## Como Usar

Para incluir ambos os componentes em qualquer página HTML do projeto, basta adicionar a seguinte linha no cabeçalho da página:

```html
<script src="./include-all-components.js"></script>
```

Este script carregará automaticamente:

1. A barra superior (topbar) em todas as páginas
2. A barra lateral (sidebar) em todas as páginas, exceto na página inicial
3. Os estilos CSS necessários
4. O gerenciador de layout para interações entre os componentes

## Arquivos Relacionados

- `topbar.html` - Estrutura HTML da barra superior
- `topbar.css` - Estilos da barra superior
- `sidebar_static.css` - Estilos da barra lateral
- `layout-adjustments.css` - Ajustes de layout para quando ambos os componentes estão presentes
- `layout-manager.js` - Gerenciador de interações entre os componentes
- `include-all-components.js` - Script principal para incluir todos os componentes

## Responsividade

Os componentes são totalmente responsivos:

- Em telas grandes, a barra lateral fica visível permanentemente
- Em telas pequenas (mobile), a barra lateral fica oculta e pode ser acessada através do botão de menu hamburger na barra superior
- A barra superior se adapta para mostrar apenas informações essenciais em telas pequenas

## Animações e Feedback Visual

Os componentes incluem diversas animações e feedback visual:

- Animação da barra de experiência ao ganhar XP
- Efeito de pulsação nas notificações
- Feedback visual ao passar o mouse sobre os botões
- Transições suaves ao mostrar/esconder a barra lateral em dispositivos móveis

## Personalização

Para personalizar os componentes, você pode editar os seguintes arquivos:

- `topbar.html` - Para alterar a estrutura da barra superior
- `topbar.css` - Para alterar os estilos da barra superior
- `include-sidebar.js` - Para alterar a estrutura da barra lateral
- `sidebar_static.css` - Para alterar os estilos da barra lateral