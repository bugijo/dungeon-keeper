/**
 * Task CLI - Interface de Linha de Comando para o Sistema de Gerenciamento de Tarefas
 * Dungeon Kreeper
 * 
 * Este script fornece uma interface de linha de comando para interagir com o sistema
 * de gerenciamento de tarefas, permitindo visualizar, atualizar e acompanhar o progresso
 * das tarefas do projeto de forma automatizada.
 * 
 * Uso: node task-cli.js [comando]
 * Comandos disponíveis:
 *   - list: Lista todas as tarefas e seus status
 *   - start: Inicia o fluxo de trabalho com a próxima tarefa pendente
 *   - complete [id]: Marca uma tarefa como concluída e avança para a próxima
 *   - progress: Exibe o progresso geral do projeto
 *   - help: Exibe ajuda sobre os comandos disponíveis
 */

const fs = require('fs');
const path = require('path');
const taskTracker = require('./task-tracker');

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Exibe o cabeçalho do aplicativo
 */
function displayHeader() {
  console.log(`${colors.bright}${colors.cyan}==================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  DUNGEON KREEPER - SISTEMA DE CONTROLE DE TAREFAS  ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}==================================================${colors.reset}\n`);
}

/**
 * Lista todas as tarefas e seus status
 */
function listTasks() {
  displayHeader();
  console.log(`${colors.bright}LISTA DE TAREFAS:${colors.reset}\n`);
  
  // Agrupar tarefas por módulo
  const tasksByModule = {};
  taskTracker.tasks.forEach(task => {
    if (!tasksByModule[task.module]) {
      tasksByModule[task.module] = [];
    }
    tasksByModule[task.module].push(task);
  });
  
  // Exibir tarefas por módulo
  Object.entries(tasksByModule).forEach(([module, moduleTasks]) => {
    console.log(`${colors.bright}${colors.blue}${module}:${colors.reset}`);
    
    moduleTasks.forEach(task => {
      let statusColor;
      switch (task.status) {
        case 'Pendente':
          statusColor = colors.yellow;
          break;
        case 'Em Andamento':
          statusColor = colors.cyan;
          break;
        case 'Concluída':
          statusColor = colors.green;
          break;
        default:
          statusColor = colors.reset;
      }
      
      console.log(`  ${colors.bright}[${task.id}]${colors.reset} ${task.name}`);
      console.log(`    Prioridade: ${task.priority}`);
      console.log(`    Status: ${statusColor}${task.status}${colors.reset}`);
      console.log(`    Descrição: ${task.description}`);
      console.log(`    Arquivos: ${task.relatedFiles.join(', ')}`);
      console.log(`    Próxima Tarefa: ${task.nextTask}\n`);
    });
  });
}

/**
 * Inicia o fluxo de trabalho com a próxima tarefa pendente
 */
function startWorkflow() {
  displayHeader();
  const nextTask = taskTracker.startWorkflow();
  
  if (nextTask) {
    console.log(`${colors.bright}${colors.green}Iniciando trabalho na tarefa:${colors.reset}\n`);
    console.log(`  ${colors.bright}[${nextTask.id}]${colors.reset} ${nextTask.name}`);
    console.log(`    Módulo: ${nextTask.module}`);
    console.log(`    Descrição: ${nextTask.description}`);
    console.log(`    Arquivos Relacionados:`);
    nextTask.relatedFiles.forEach(file => {
      console.log(`      - ${file}`);
    });
    console.log(`\n${colors.bright}${colors.yellow}Boa codificação! Marque como concluída quando terminar.${colors.reset}`);
    console.log(`Use: ${colors.bright}node task-cli.js complete ${nextTask.id}${colors.reset}\n`);
  }
}

/**
 * Marca uma tarefa como concluída e avança para a próxima
 * @param {string} taskId - ID da tarefa a ser concluída
 */
function completeTask(taskId) {
  displayHeader();
  
  if (!taskId) {
    console.log(`${colors.red}Erro: ID da tarefa não fornecido.${colors.reset}`);
    console.log(`Uso: ${colors.bright}node task-cli.js complete [id]${colors.reset}\n`);
    return;
  }
  
  const task = taskTracker.tasks.find(t => t.id === taskId);
  
  if (!task) {
    console.log(`${colors.red}Erro: Tarefa ${taskId} não encontrada.${colors.reset}\n`);
    return;
  }
  
  console.log(`${colors.green}Concluindo a tarefa ${taskId}: ${task.name}...${colors.reset}\n`);
  
  // Atualizar o arquivo de plano de execução
  updateTaskInPlanFile(taskId);
  
  const nextTask = taskTracker.updateTaskStatus(taskId, 'Concluída');
  
  console.log(`${colors.green}Tarefa ${taskId} marcada como concluída!${colors.reset}\n`);
  
  // Exibir progresso
  displayProgress();
  
  if (nextTask) {
    console.log(`\n${colors.bright}${colors.yellow}Próxima tarefa:${colors.reset}`);
    console.log(`  ${colors.bright}[${nextTask.id}]${colors.reset} ${nextTask.name}`);
    console.log(`    Módulo: ${nextTask.module}`);
    console.log(`    Descrição: ${nextTask.description}`);
    console.log(`\n${colors.bright}${colors.yellow}Para iniciar esta tarefa, execute:${colors.reset}`);
    console.log(`  ${colors.bright}node task-cli.js start${colors.reset}\n`);
  } else {
    console.log(`\n${colors.bright}${colors.green}Parabéns! Todas as tarefas foram concluídas!${colors.reset}\n`);
  }
}

/**
 * Atualiza o arquivo de plano de execução quando uma tarefa é concluída
 * @param {string} taskId - ID da tarefa concluída
 */
function updateTaskInPlanFile(taskId) {
  const planFilePath = path.join(__dirname, 'plano-execucao-tarefas.md');
  
  try {
    if (fs.existsSync(planFilePath)) {
      let content = fs.readFileSync(planFilePath, 'utf8');
      
      // Atualizar o checkbox da tarefa
      const taskRegex = new RegExp(`- \\[ \\] \\*\\*${taskId}\\*\\*:`, 'g');
      content = content.replace(taskRegex, `- [x] **${taskId}**:`);
      
      // Atualizar a tabela de progresso
      const task = taskTracker.tasks.find(t => t.id === taskId);
      if (task) {
        const moduleStats = taskTracker.moduleStats[task.module];
        moduleStats.completed++;
        
        // Calcular novo progresso
        const progress = Math.round((moduleStats.completed / moduleStats.total) * 100);
        
        // Atualizar linha da tabela para o módulo
        const moduleRegex = new RegExp(`\\| ${task.module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| \\d+ \\| ${moduleStats.total} \\| \\d+% \\|`, 'g');
        content = content.replace(moduleRegex, `| ${task.module} | ${moduleStats.completed} | ${moduleStats.total} | ${progress}% |`);
        
        // Atualizar linha de total
        const stats = taskTracker.calculateProgress();
        const totalRegex = /\| \*\*TOTAL\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \| \*\*\d+%\*\* \|/g;
        content = content.replace(totalRegex, `| **TOTAL** | **${stats.overall.completed}** | **${stats.overall.total}** | **${stats.overall.percentage}%** |`);
        
        // Adicionar ao histórico de conclusões
        const completionDate = new Date().toISOString().split('T')[0];
        const historyRegex = /\| - \| - \| - \| - \|/;
        if (content.match(historyRegex)) {
          content = content.replace(historyRegex, `| ${taskId} | ${task.name} | ${completionDate} | Equipe Dungeon Kreeper |\n| - | - | - | - |`);
        }
      }
      
      // Atualizar a data da última atualização
      const currentDate = new Date().toISOString().split('T')[0];
      const dateRegex = /\*\*Última Atualização\*\*: \d{4}-\d{2}-\d{2}/;
      content = content.replace(dateRegex, `**Última Atualização**: ${currentDate}`);
      
      // Salvar as alterações
      fs.writeFileSync(planFilePath, content, 'utf8');
      console.log(`${colors.dim}Arquivo de plano de execução atualizado.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Erro ao atualizar o arquivo de plano: ${error.message}${colors.reset}`);
  }
}

/**
 * Exibe o progresso geral do projeto
 */
function displayProgress() {
  const stats = taskTracker.calculateProgress();
  
  console.log(`${colors.bright}PROGRESSO DO PROJETO:${colors.reset}\n`);
  console.log(`${colors.bright}Progresso Geral: ${colors.green}${stats.overall.percentage}%${colors.reset} (${stats.overall.completed}/${stats.overall.total} tarefas)\n`);
  
  console.log(`${colors.bright}Progresso por Módulo:${colors.reset}`);
  Object.entries(stats.byModule).forEach(([module, moduleStat]) => {
    const moduleProgress = moduleStat.total > 0 ? Math.round((moduleStat.completed / moduleStat.total) * 100) : 0;
    console.log(`  ${module}: ${colors.green}${moduleProgress}%${colors.reset} (${moduleStat.completed}/${moduleStat.total})`);
  });
  console.log();
}

/**
 * Exibe ajuda sobre os comandos disponíveis
 */
function displayHelp() {
  displayHeader();
  console.log(`${colors.bright}COMANDOS DISPONÍVEIS:${colors.reset}\n`);
  console.log(`  ${colors.bright}list${colors.reset}\t\tLista todas as tarefas e seus status`);
  console.log(`  ${colors.bright}start${colors.reset}\t\tInicia o fluxo de trabalho com a próxima tarefa pendente`);
  console.log(`  ${colors.bright}complete [id]${colors.reset}\tMarca uma tarefa como concluída e avança para a próxima`);
  console.log(`  ${colors.bright}progress${colors.reset}\tExibe o progresso geral do projeto`);
  console.log(`  ${colors.bright}help${colors.reset}\t\tExibe esta ajuda\n`);
  console.log(`${colors.bright}EXEMPLOS:${colors.reset}`);
  console.log(`  ${colors.dim}node task-cli.js list${colors.reset}`);
  console.log(`  ${colors.dim}node task-cli.js complete MT-01${colors.reset}\n`);
}

/**
 * Função principal que processa os argumentos da linha de comando
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'list':
      listTasks();
      break;
    case 'start':
      startWorkflow();
      break;
    case 'complete':
      completeTask(args[1]);
      break;
    case 'progress':
      displayHeader();
      displayProgress();
      break;
    case 'help':
    case undefined:
      displayHelp();
      break;
    default:
      console.log(`${colors.red}Comando desconhecido: ${command}${colors.reset}\n`);
      displayHelp();
  }
}

// Executar o programa
main();