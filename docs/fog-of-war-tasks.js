/**
 * Fog of War Tasks - Sistema de Gerenciamento de Tarefas Paralelas
 * Dungeon Kreeper
 * 
 * Este script gerencia as 5 funcionalidades pendentes do sistema de Fog of War,
 * permitindo o desenvolvimento paralelo dessas funcionalidades.
 */

// Configuração das tarefas paralelas do sistema de Fog of War
const fogOfWarTasks = [
  {
    id: 'FOW-01',
    name: 'Sistema de linha de visão baseado em obstáculos',
    priority: 1,
    module: 'Fog of War',
    description: 'Implementar sistema que bloqueia a visão através de obstáculos definidos no mapa',
    relatedFiles: [
      'src/utils/fogOfWarUtils.ts',
      'src/components/MapComponents/EnhancedFogOfWar.tsx',
      'src/utils/lineIntersectsRectangle.ts'
    ],
    status: 'Em Andamento',
    assignedTo: 'Agente 1',
    percentComplete: 30,
    dependencies: []
  },
  {
    id: 'FOW-02',
    name: 'Áreas de visão dinâmicas com fontes de luz',
    priority: 2,
    module: 'Fog of War',
    description: 'Implementar sistema de iluminação dinâmica que afeta a visibilidade no mapa',
    relatedFiles: [
      'src/utils/lightingUtils.ts',
      'src/utils/saveLightSourcesLocally.ts',
      'src/components/MapComponents/LightSourceManager.tsx'
    ],
    status: 'Em Andamento',
    assignedTo: 'Agente 2',
    percentComplete: 25,
    dependencies: []
  },
  {
    id: 'FOW-03',
    name: 'Sistema de memória de áreas reveladas',
    priority: 3,
    module: 'Fog of War',
    description: 'Implementar sistema que permite aos jogadores lembrar áreas já visitadas',
    relatedFiles: [
      'src/utils/offlineStorageUtils.ts',
      'src/components/MapComponents/RevealedAreaMemory.tsx'
    ],
    status: 'Em Andamento',
    assignedTo: 'Agente 3',
    percentComplete: 20,
    dependencies: []
  },
  {
    id: 'FOW-04',
    name: 'Otimizações de performance',
    priority: 4,
    module: 'Fog of War',
    description: 'Implementar cache de mapas, auto-save contínuo e outras otimizações',
    relatedFiles: [
      'src/hooks/useMapCache.tsx',
      'src/hooks/useAutoSave.tsx',
      'src/utils/updateDynamicObstacles.ts'
    ],
    status: 'Em Andamento',
    assignedTo: 'Agente 4',
    percentComplete: 15,
    dependencies: []
  },
  {
    id: 'FOW-05',
    name: 'Ferramentas avançadas de narrativa',
    priority: 5,
    module: 'Fog of War',
    description: 'Implementar ferramentas para o mestre criar efeitos narrativos usando o sistema de Fog of War',
    relatedFiles: [
      'src/components/dm/NarrativeTools.tsx',
      'src/hooks/useEnvironmentControl.tsx'
    ],
    status: 'Em Andamento',
    assignedTo: 'Agente 5',
    percentComplete: 10,
    dependencies: []
  }
];

// Estatísticas de progresso
let moduleStats = {
  'Fog of War': { completed: 0, total: 5, percentComplete: 0 }
};

/**
 * Atualiza o status de uma tarefa
 * @param {string} taskId - ID da tarefa a ser atualizada
 * @param {string} newStatus - Novo status da tarefa ('Em Andamento', 'Em Revisão', 'Concluída')
 * @param {number} percentComplete - Porcentagem de conclusão (0-100)
 * @returns {object} - Tarefa atualizada
 */
function updateTaskStatus(taskId, newStatus, percentComplete) {
  const taskIndex = fogOfWarTasks.findIndex(task => task.id === taskId);
  
  if (taskIndex === -1) {
    console.error(`Tarefa ${taskId} não encontrada`);
    return null;
  }
  
  const task = fogOfWarTasks[taskIndex];
  task.status = newStatus;
  task.percentComplete = percentComplete;
  
  // Atualizar estatísticas se a tarefa foi concluída
  if (newStatus === 'Concluída') {
    moduleStats['Fog of War'].completed++;
  }
  
  // Recalcular progresso geral
  calculateProgress();
  
  return task;
}

/**
 * Calcula o progresso geral das tarefas de Fog of War
 * @returns {object} - Estatísticas de progresso
 */
function calculateProgress() {
  let totalPercent = 0;
  
  fogOfWarTasks.forEach(task => {
    totalPercent += task.percentComplete;
  });
  
  moduleStats['Fog of War'].percentComplete = Math.round(totalPercent / fogOfWarTasks.length);
  
  return {
    tasks: fogOfWarTasks.map(task => ({
      id: task.id,
      name: task.name,
      status: task.status,
      percentComplete: task.percentComplete,
      assignedTo: task.assignedTo
    })),
    overall: moduleStats['Fog of War']
  };
}

/**
 * Verifica dependências e determina se uma tarefa pode ser iniciada
 * @param {string} taskId - ID da tarefa a verificar
 * @returns {boolean} - True se a tarefa pode ser iniciada
 */
function canStartTask(taskId) {
  const task = fogOfWarTasks.find(t => t.id === taskId);
  
  if (!task) {
    return false;
  }
  
  // Verificar se todas as dependências estão concluídas
  if (task.dependencies && task.dependencies.length > 0) {
    return task.dependencies.every(depId => {
      const depTask = fogOfWarTasks.find(t => t.id === depId);
      return depTask && depTask.status === 'Concluída';
    });
  }
  
  return true;
}

/**
 * Atribui uma tarefa a um agente específico
 * @param {string} taskId - ID da tarefa a ser atribuída
 * @param {string} agentName - Nome do agente
 * @returns {object} - Tarefa atualizada
 */
function assignTask(taskId, agentName) {
  const task = fogOfWarTasks.find(t => t.id === taskId);
  
  if (!task) {
    console.error(`Tarefa ${taskId} não encontrada`);
    return null;
  }
  
  task.assignedTo = agentName;
  return task;
}

/**
 * Obtém o status atual de todas as tarefas
 * @returns {object} - Status das tarefas e progresso geral
 */
function getTasksStatus() {
  return {
    tasks: fogOfWarTasks,
    progress: calculateProgress()
  };
}

/**
 * Exporta as funções e dados para uso no projeto
 */
module.exports = {
  fogOfWarTasks,
  moduleStats,
  updateTaskStatus,
  calculateProgress,
  canStartTask,
  assignTask,
  getTasksStatus
};