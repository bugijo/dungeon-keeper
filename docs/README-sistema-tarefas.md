# Sistema Automatizado de Controle de Tarefas - Dungeon Kreeper

## Visão Geral

Este sistema foi desenvolvido para automatizar o fluxo de trabalho das tarefas pendentes do projeto Dungeon Kreeper, permitindo um desenvolvimento sequencial e organizado sem a necessidade de intervenção manual para avançar entre tarefas.

## Componentes do Sistema

O sistema é composto por três componentes principais:

1. **Plano de Execução** (`plano-execucao-tarefas.md`): Documento que lista todas as tarefas pendentes, organizadas por prioridade e módulo, com status e controle de progresso.

2. **Rastreador de Tarefas** (`task-tracker.js`): Módulo JavaScript que gerencia o estado das tarefas, calcula o progresso e controla o fluxo de trabalho.

3. **Interface de Linha de Comando** (`task-cli.js`): Ferramenta de linha de comando que permite interagir com o sistema, visualizar tarefas, marcar conclusões e acompanhar o progresso.

## Como Utilizar

### Pré-requisitos

- Node.js instalado no sistema

### Comandos Disponíveis

Abra um terminal na pasta `docs` do projeto e execute os seguintes comandos:

```bash
# Listar todas as tarefas e seus status
node task-cli.js list

# Iniciar o fluxo de trabalho com a próxima tarefa pendente
node task-cli.js start

# Marcar uma tarefa como concluída e avançar para a próxima
node task-cli.js complete [id-da-tarefa]

# Exibir o progresso geral do projeto
node task-cli.js progress

# Exibir ajuda sobre os comandos disponíveis
node task-cli.js help
```

### Fluxo de Trabalho Recomendado

1. Execute `node task-cli.js start` para iniciar o trabalho na próxima tarefa pendente de maior prioridade.

2. Implemente a funcionalidade conforme descrito na tarefa.

3. Após concluir a implementação, execute `node task-cli.js complete [id-da-tarefa]` para marcar a tarefa como concluída.

4. O sistema automaticamente atualizará o arquivo de plano de execução, calculará o novo progresso e indicará a próxima tarefa a ser implementada.

5. Repita o processo até que todas as tarefas estejam concluídas.

## Estrutura de Tarefas

Cada tarefa no sistema possui:

- **ID**: Identificador único da tarefa (ex: MT-01)
- **Nome**: Descrição curta da tarefa
- **Prioridade**: Nível de prioridade (1 = mais alta)
- **Módulo**: Categoria ou componente do sistema
- **Descrição**: Detalhamento da tarefa
- **Arquivos Relacionados**: Lista de arquivos que precisam ser modificados
- **Status**: Estado atual (Pendente, Em Andamento, Concluída)
- **Próxima Tarefa**: ID da tarefa que deve ser iniciada após a conclusão desta

## Personalização

Para adicionar novas tarefas ou modificar as existentes:

1. Edite o arquivo `task-tracker.js` para adicionar/modificar entradas no array `tasks`.

2. Atualize o objeto `moduleStats` para refletir as alterações nos totais por módulo.

3. Atualize o arquivo `plano-execucao-tarefas.md` para manter a consistência com as alterações.

## Benefícios

- **Desenvolvimento Sequencial**: Garante que as tarefas sejam implementadas na ordem correta de prioridade.
- **Rastreamento Automático**: Mantém o registro de progresso atualizado automaticamente.
- **Documentação Integrada**: O plano de execução serve como documentação viva do projeto.
- **Fluxo Contínuo**: Elimina a necessidade de intervenção manual para avançar entre tarefas.

---

**Versão do Sistema**: 1.0  
**Última Atualização**: 2024-08-30  
**Responsável**: Equipe Dungeon Kreeper