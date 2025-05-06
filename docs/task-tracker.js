/**
 * Task Tracker - Sistema Automatizado de Gerenciamento de Tarefas
 * Dungeon Kreeper
 * 
 * Este script permite o gerenciamento automatizado das tarefas pendentes do projeto,
 * facilitando o acompanhamento do progresso e a execução sequencial das atividades.
 */

// Configuração das tarefas baseada no plano de execução
const tasks = [
  {
    id: 'MT-01',
    name: 'Aprimorar sistema de Fog of War com controles mais precisos',
    priority: 2,
    module: 'Mapa Tático',
    description: 'Implementar controles mais precisos para o sistema de Fog of War no mapa tático',
    relatedFiles: [
      'src/components/MapComponents/FogOfWar.tsx',
      'src/components/MapComponents/MapControls.tsx'
    ],
    status: 'Pendente',
    nextTask: 'SA-01'
  },
  {
    id: 'SA-01',
    name: 'Implementar sistema de áudio para ambientação com playlists',
    priority: 3,
    module: 'Sistema de Áudio',
    description: 'Criar sistema de áudio que permita ao mestre configurar playlists para ambientação',
    relatedFiles: [
      'src/components/AudioPlayer/',
      'src/hooks/useAudio.ts'
    ],
    status: 'Pendente',
    nextTask: 'SAS-01'
  },
  {
    id: 'SAS-01',
    name: 'Melhorar a integração entre o agendamento e a interface do mestre',
    priority: 4,
    module: 'Sistema de Agendamento e Sessões',
    description: 'Integrar o sistema de agendamento com a interface do mestre para facilitar o gerenciamento de sessões',
    relatedFiles: [
      'src/components/SessionScheduler/',
      'src/pages/DmDashboard.tsx'
    ],
    status: 'Pendente',
    nextTask: 'SAS-02'
  },
  {
    id: 'SAS-02',
    name: 'Implementar notificações para lembrar usuários sobre sessões próximas',
    priority: 4,
    module: 'Sistema de Agendamento e Sessões',
    description: 'Criar sistema de notificações para lembrar usuários sobre sessões agendadas',
    relatedFiles: [
      'src/components/Notifications/',
      'src/hooks/useNotifications.ts'
    ],
    status: 'Pendente',
    nextTask: 'SAS-03'
  },
  {
    id: 'SAS-03',
    name: 'Adicionar opção para convidar jogadores diretamente pelo sistema de agendamento',
    priority: 4,
    module: 'Sistema de Agendamento e Sessões',
    description: 'Implementar funcionalidade para convidar jogadores para sessões através do sistema de agendamento',
    relatedFiles: [
      'src/components/SessionScheduler/InvitePlayer.tsx',
      'src/services/inviteService.ts'
    ],
    status: 'Pendente',
    nextTask: 'Concluído'
  }
];

// Estatísticas de progresso por módulo
const moduleStats = {
  'Mapa Tático': { completed: 0, total: 1 },
  'Sistema de Áudio': { completed: 0, total: 1 },
  'Sistema de Agendamento e Sessões': { completed: 0, total: 3 }
};

/**
 * Atualiza o status de uma tarefa e avança para a próxima
 * @param {string} taskId - ID da tarefa a ser atualizada
 * @param {string} newStatus - Novo status da tarefa ('Pendente', 'Em Andamento', 'Concluída')
 * @returns {object} - Próxima tarefa a ser executada
 */
function updateTaskStatus(taskId, newStatus) {
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex === -1) {
    console.error(`Tarefa ${taskId} não encontrada`);
    return null;
  }
  
  const task = tasks[taskIndex];
  const oldStatus = task.status;
  task.status = newStatus;
  
  // Atualizar estatísticas se a tarefa foi concluída
  if (newStatus === 'Concluída' && oldStatus !== 'Concluída') {
    moduleStats[task.module].completed++;
    
    // Registrar conclusão no histórico
    const completionDate = new Date().toISOString().split('T')[0];
    console.log(`Tarefa ${taskId} concluída em ${completionDate}`);
    
    // Determinar próxima tarefa
    if (task.nextTask && task.nextTask !== 'Concluído') {
      const nextTask = tasks.find(t => t.id === task.nextTask);
      if (nextTask) {
        nextTask.status = 'Em Andamento';
        return nextTask;
      }
    } else {
      console.log('Todas as tarefas foram concluídas!');
      return null;
    }
  }
  
  return task;
}

/**
 * Obtém a próxima tarefa pendente de maior prioridade
 * @returns {object|null} - Próxima tarefa ou null se não houver tarefas pendentes
 */
function getNextPendingTask() {
  return tasks
    .filter(task => task.status === 'Pendente')
    .sort((a, b) => a.priority - b.priority)[0] || null;
}

/**
 * Calcula e exibe o progresso geral do projeto
 * @returns {object} - Estatísticas de progresso
 */
function calculateProgress() {
  let totalCompleted = 0;
  let totalTasks = 0;
  
  Object.values(moduleStats).forEach(stat => {
    totalCompleted += stat.completed;
    totalTasks += stat.total;
  });
  
  const overallProgress = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;
  
  const stats = {
    byModule: moduleStats,
    overall: {
      completed: totalCompleted,
      total: totalTasks,
      percentage: Math.round(overallProgress)
    }
  };
  
  console.log('Progresso do Projeto:', stats);
  return stats;
}

/**
 * Inicia o fluxo de trabalho com a tarefa de maior prioridade
 * @returns {object} - Tarefa inicial
 */
function startWorkflow() {
  const nextTask = getNextPendingTask();
  
  if (nextTask) {
    nextTask.status = 'Em Andamento';
    console.log(`Iniciando trabalho na tarefa ${nextTask.id}: ${nextTask.name}`);
    return nextTask;
  } else {
    console.log('Não há tarefas pendentes.');
    return null;
  }
}

/**
 * Exporta as funções e dados para uso no projeto
 */
module.exports = {
  tasks,
  moduleStats,
  updateTaskStatus,
  getNextPendingTask,
  calculateProgress,
  startWorkflow
};