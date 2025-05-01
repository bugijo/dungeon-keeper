
# Arquitetura do Sistema - Keeper of Realms

## Visão Geral

O Keeper of Realms é uma aplicação web projetada para auxiliar jogadores e mestres de RPG, com foco inicial em D&D 5e. A aplicação segue uma arquitetura moderna, utilizando React no frontend e Supabase como backend.

## Stack Tecnológica

### Frontend
- **React**: Biblioteca para construção da interface do usuário
- **TypeScript**: Superset tipado de JavaScript para desenvolvimento mais seguro
- **Tailwind CSS**: Framework CSS utilitário para estilização
- **Shadcn/UI**: Componentes de UI reutilizáveis
- **Framer Motion**: Biblioteca para animações fluidas
- **React Router Dom**: Navegação entre páginas
- **React Query**: Gerenciamento de estado assíncrono e cache

### Backend
- **Supabase**: Plataforma de Backend-as-a-Service
  - **Banco de Dados PostgreSQL**: Armazenamento de dados
  - **Autenticação**: Sistema de autenticação e autorização
  - **Storage**: Armazenamento de arquivos (imagens, PDFs, etc.)
  - **Edge Functions**: Funções serverless para lógica de backend

## Estrutura de Diretórios

```
src/
├── components/       # Componentes reutilizáveis da UI
│   ├── auth/         # Componentes relacionados à autenticação
│   ├── character/    # Componentes da ficha de personagem
│   ├── dice/         # Componentes de rolagem de dados
│   ├── game/         # Componentes específicos do jogo
│   ├── layout/       # Componentes de layout (header, sidebar, etc.)
│   ├── mobile/       # Componentes otimizados para dispositivos móveis
│   ├── rpg/          # Componentes específicos de RPG
│   ├── shop/         # Componentes da loja
│   └── ui/           # Componentes básicos de UI (shadcn)
│
├── contexts/         # Contextos de React para gerenciamento de estado
│
├── docs/             # Documentação do projeto
│
├── hooks/            # Hooks personalizados
│
├── integrations/     # Integrações com serviços externos
│   └── supabase/     # Integração com Supabase
│
├── lib/              # Bibliotecas e utilidades
│
├── pages/            # Páginas da aplicação
│   ├── character/    # Páginas relacionadas a personagens
│   ├── creations/    # Páginas de criação (personagens, mapas, etc.)
│   ├── items/        # Páginas de gerenciamento de itens
│   ├── maps/         # Páginas de mapas
│   ├── monsters/     # Páginas de monstros
│   ├── npcs/         # Páginas de NPCs
│   ├── stories/      # Páginas de histórias
│   └── table/        # Páginas de mesas de jogo
│
├── styles/           # Estilos globais e variáveis CSS
│
├── tests/            # Testes automatizados
│
└── utils/            # Utilitários e funções auxiliares
```

## Fluxo de Dados

1. **Autenticação**:
   - O usuário se autentica através do Supabase Auth
   - O estado de autenticação é gerenciado pelo contexto AuthContext
   - As rotas protegidas verificam o estado de autenticação

2. **Gerenciamento de Estado**:
   - Estados locais com hooks useState para componentes individuais
   - Contextos React para estados globais (autenticação, temas, etc.)
   - React Query para dados da API e caching

3. **Comunicação com Backend**:
   - Client Supabase para comunicação com o banco de dados
   - Operações CRUD através da API do Supabase
   - Funções Edge para lógicas complexas de backend

## Modelos de Dados

### Perfil de Usuário
- UUID (chave primária, referencia auth.users)
- Nome de exibição
- Email
- Metadados personalizados (nível, XP, etc.)

### Personagens
- ID (chave primária)
- ID do usuário (chave estrangeira)
- Nome, raça, classe, etc.
- Atributos (JSON)
- Equipamentos (JSON)
- Magias (JSON)
- Proficiências (JSON)

### Mesa de Jogo
- ID (chave primária)
- ID do mestre (chave estrangeira)
- Nome, descrição, sistema (D&D 5e, etc.)
- Max jogadores, dia da semana, horário
- Campanha

### Participantes da Mesa
- ID (chave primária)
- ID da mesa (chave estrangeira)
- ID do usuário (chave estrangeira)
- ID do personagem (chave estrangeira, opcional)
- Função (jogador, mestre)

### Mapas
- ID (chave primária)
- ID do criador (chave estrangeira)
- Nome, descrição
- URL da imagem

### Histórias
- ID (chave primária)
- ID do criador (chave estrangeira)
- Título, conteúdo
- Tipo, tags

## Segurança

- **Autenticação**: Gerenciada pelo Supabase Auth
- **Autorização**: Row Level Security (RLS) no PostgreSQL
- **Validação**: Validação de dados com Zod
- **CORS**: Configurado para permitir apenas origens confiáveis

## Considerações de Performance

- **Lazy Loading**: Carregamento assíncrono de componentes não críticos
- **Memoização**: Uso de useCallback e useMemo para evitar re-renderizações desnecessárias
- **Code Splitting**: Divisão do código para carregamento mais rápido
- **Caching**: React Query para caching de dados e minimização de requests

## Deploy e CI/CD

- **Build**: Processo de build otimizado para produção
- **Testes**: Testes automatizados antes do deploy
- **Deploy**: Integração contínua e deploy automático

## Próximos Passos e Melhorias Futuras

1. **Integração com VTT**: Implementar um Virtual TableTop para jogos online
2. **API para Integrações**: Permitir integrações com outras ferramentas
3. **Sistema de Plugins**: Permitir extensões da comunidade
4. **Suporte para Outros Sistemas**: Adicionar suporte para outros sistemas de RPG
5. **Recursos de Acessibilidade**: Melhorar a acessibilidade da plataforma
