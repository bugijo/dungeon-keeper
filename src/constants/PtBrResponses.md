
# Configurações para Respostas em Português

Este documento estabelece as diretrizes para garantir que todas as interações com o usuário sejam realizadas em português brasileiro.

## Diretrizes

1. **Idioma Padrão**: Todas as mensagens, notificações e elementos de interface devem ser apresentados em português brasileiro.

2. **Tradução Automática**: O sistema deve detectar o idioma do usuário e, quando em português, responder automaticamente no mesmo idioma.

3. **Terminologia**: Utilizar terminologia específica para RPG em português, respeitando os termos já consolidados na comunidade brasileira.

4. **Comandos e Instruções**: Todas as instruções e comandos do sistema devem ser apresentados em português claro e conciso.

5. **Mensagens de Erro**: Sempre apresentar mensagens de erro em português, oferecendo orientações para resolução.

6. **Ajuda e Suporte**: Todo o conteúdo de ajuda, documentação e suporte deve estar disponível em português.

## Implementação

O sistema utiliza as funções de detecção de idioma presentes no arquivo `src/constants/Language.ts` e `src/utils/aiResponseLanguage.ts` para identificar quando o usuário está se comunicando em português e adaptar as respostas adequadamente.

As configurações de idioma são aplicadas em todos os componentes da aplicação, garantindo uma experiência consistente em português para usuários brasileiros.

