# Implementação do Supabase no Dungeon Kreeper

## Tabelas Implementadas

### Tabela de NPCs

A tabela `npcs` foi implementada para armazenar os NPCs gerados pelos usuários. Ela possui as seguintes colunas:

- `id`: UUID, chave primária
- `name`: TEXT, nome do NPC (obrigatório)
- `description`: TEXT, descrição geral do NPC
- `personality`: TEXT, personalidade do NPC
- `appearance`: TEXT, aparência física do NPC
- `background`: TEXT, história de fundo do NPC
- `goals`: TEXT, objetivos e motivações do NPC
- `secrets`: TEXT, segredos que o NPC guarda
- `user_id`: UUID, referência ao usuário que criou o NPC (obrigatório)
- `created_at`: TIMESTAMP, data de criação do registro
- `updated_at`: TIMESTAMP, data da última atualização do registro

### Políticas de Segurança (RLS)

As seguintes políticas de Row Level Security (RLS) foram implementadas para a tabela `npcs`:

1. **Política de leitura**: Usuários só podem ler seus próprios NPCs
2. **Política de inserção**: Usuários só podem inserir NPCs com seu próprio user_id
3. **Política de atualização**: Usuários só podem atualizar seus próprios NPCs
4. **Política de exclusão**: Usuários só podem excluir seus próprios NPCs

## Como Aplicar as Migrações

Para aplicar as migrações e criar as tabelas no seu projeto Supabase:

1. Acesse o painel de controle do Supabase
2. Vá para a seção SQL Editor
3. Copie e cole o conteúdo do arquivo `migrations/20230501000000_create_npcs_table.sql`
4. Execute o script

Alternativamente, se você estiver usando a CLI do Supabase:

```bash
supabase db push
```

## Uso do Serviço de NPCs

O serviço `npcAiService.ts` fornece as seguintes funcionalidades:

- `generateNpcWithAI(prompt, user_id)`: Gera um NPC usando IA com base no prompt fornecido
- `getUserNPCs(user_id)`: Busca todos os NPCs de um usuário
- `getNPCById(id)`: Busca um NPC específico pelo ID
- `updateNPC(id, npcData)`: Atualiza um NPC existente
- `deleteNPC(id)`: Exclui um NPC
- `subscribeToUserNPCs(user_id, callback)`: Assina atualizações em tempo real para NPCs de um usuário

## Integração com a Interface

O componente `NpcsView.tsx` foi consolidado para evitar duplicação. Agora ele está disponível na rota `/npcs` e utiliza o componente `NPCsPage` de `src/pages/npcs/index.tsx` para renderizar a interface de usuário.

A interface permite:

- Gerar novos NPCs com IA
- Visualizar a coleção de NPCs do usuário
- Editar NPCs existentes
- Excluir NPCs

## Configuração da OpenAI

Para que a geração de NPCs com IA funcione, é necessário configurar a chave da API da OpenAI no arquivo `.env`:

```
VITE_OPENAI_API_KEY=sua_chave_da_api_aqui
```