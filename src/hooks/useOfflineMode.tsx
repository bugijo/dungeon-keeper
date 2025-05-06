import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OfflineModeOptions {
  syncInterval?: number; // intervalo de sincronização em ms (padrão: 60000 = 1min)
  maxStorageSize?: number; // tamanho máximo de armazenamento em MB (padrão: 50MB)
  priorityTables?: string[]; // tabelas prioritárias para sincronização
  compressionEnabled?: boolean; // habilitar compressão de dados
  encryptionEnabled?: boolean; // habilitar criptografia de dados
  showNotifications?: boolean; // mostrar notificações de sincronização
  autoSync?: boolean; // sincronizar automaticamente quando online
}

interface SyncStatus {
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncInProgress: boolean;
  syncError: string | null;
  storageUsage: number; // em bytes
  tablesStatus: {
    [tableName: string]: {
      lastSyncTime: Date | null;
      pendingChanges: number;
      syncDirection: 'upload' | 'download' | 'bidirectional';
    };
  };
}

interface OfflineData {
  id: string;
  table: string;
  data: any;
  operation: 'insert' | 'update' | 'delete';
  timestamp: number;
  synced: boolean;
  conflicted: boolean;
}

const DEFAULT_OPTIONS: OfflineModeOptions = {
  syncInterval: 60000, // 1 minuto
  maxStorageSize: 50, // 50 MB
  priorityTables: ['games', 'maps', 'characters', 'map_fog_of_war', 'map_fog_memory'],
  compressionEnabled: true,
  encryptionEnabled: false,
  showNotifications: true,
  autoSync: true
};

export const useOfflineMode = (options: OfflineModeOptions = {}) => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [offlineEnabled, setOfflineEnabled] = useState<boolean>(true);
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    pendingChanges: 0,
    syncInProgress: false,
    syncError: null,
    storageUsage: 0,
    tablesStatus: {}
  });
  
  // Mesclar opções padrão com as fornecidas
  const offlineOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Referências para timers
  const syncIntervalRef = useRef<number | null>(null);
  
  // Inicializar o modo offline
  useEffect(() => {
    const initializeOfflineMode = async () => {
      // Carregar dados offline do armazenamento local
      const storedData = localStorage.getItem('dk_offline_data');
      const storedStatus = localStorage.getItem('dk_offline_status');
      const storedEnabled = localStorage.getItem('dk_offline_enabled');
      
      if (storedData) {
        try {
          setOfflineData(JSON.parse(storedData));
        } catch (error) {
          console.error('Erro ao carregar dados offline:', error);
          localStorage.removeItem('dk_offline_data');
        }
      }
      
      if (storedStatus) {
        try {
          const parsedStatus = JSON.parse(storedStatus);
          setSyncStatus({
            ...parsedStatus,
            lastSyncTime: parsedStatus.lastSyncTime ? new Date(parsedStatus.lastSyncTime) : null,
            tablesStatus: Object.entries(parsedStatus.tablesStatus || {}).reduce((acc, [key, value]: [string, any]) => {
              acc[key] = {
                ...value,
                lastSyncTime: value.lastSyncTime ? new Date(value.lastSyncTime) : null
              };
              return acc;
            }, {} as SyncStatus['tablesStatus'])
          });
        } catch (error) {
          console.error('Erro ao carregar status de sincronização:', error);
          localStorage.removeItem('dk_offline_status');
        }
      }
      
      if (storedEnabled !== null) {
        setOfflineEnabled(storedEnabled === 'true');
      }
      
      // Configurar listeners para status online/offline
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Iniciar intervalo de sincronização automática
      if (offlineOptions.syncInterval && offlineOptions.syncInterval > 0 && offlineOptions.autoSync) {
        syncIntervalRef.current = window.setInterval(synchronize, offlineOptions.syncInterval);
      }
      
      // Calcular uso de armazenamento
      calculateStorageUsage();
      
      setIsInitialized(true);
      
      // Sincronizar dados se estiver online e tiver sincronização automática
      if (navigator.onLine && offlineOptions.autoSync) {
        synchronize();
      }
    };
    
    initializeOfflineMode();
    
    // Limpeza ao desmontar
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);
  
  // Persistir dados offline quando alterados
  useEffect(() => {
    if (!isInitialized) return;
    
    localStorage.setItem('dk_offline_data', JSON.stringify(offlineData));
    localStorage.setItem('dk_offline_status', JSON.stringify({
      ...syncStatus,
      lastSyncTime: syncStatus.lastSyncTime?.toISOString(),
      tablesStatus: Object.entries(syncStatus.tablesStatus).reduce((acc, [key, value]) => {
        acc[key] = {
          ...value,
          lastSyncTime: value.lastSyncTime?.toISOString()
        };
        return acc;
      }, {} as SyncStatus['tablesStatus'])
    }));
    localStorage.setItem('dk_offline_enabled', String(offlineEnabled));
    
    // Atualizar contagem de alterações pendentes
    setSyncStatus(prev => ({
      ...prev,
      pendingChanges: offlineData.filter(item => !item.synced).length
    }));
  }, [offlineData, syncStatus.lastSyncTime, syncStatus.tablesStatus, offlineEnabled, isInitialized]);
  
  // Handlers para eventos online/offline
  const handleOnline = () => {
    setIsOffline(false);
    
    // Sincronizar dados automaticamente quando voltar a ficar online
    if (offlineEnabled && offlineOptions.autoSync) {
      synchronize();
    }
    
    if (offlineOptions.showNotifications) {
      toast.success('Conexão restaurada! Sincronizando dados...');
    }
  };
  
  const handleOffline = () => {
    setIsOffline(true);
    
    if (offlineOptions.showNotifications) {
      toast.warning('Você está offline. O modo offline foi ativado automaticamente.');
    }
  };
  
  // Calcular uso de armazenamento
  const calculateStorageUsage = () => {
    try {
      const offlineDataSize = new Blob([JSON.stringify(offlineData)]).size;
      const syncStatusSize = new Blob([JSON.stringify(syncStatus)]).size;
      
      setSyncStatus(prev => ({
        ...prev,
        storageUsage: offlineDataSize + syncStatusSize
      }));
    } catch (error) {
      console.error('Erro ao calcular uso de armazenamento:', error);
    }
  };
  
  // Adicionar dados offline
  const addOfflineData = (table: string, data: any, operation: 'insert' | 'update' | 'delete' = 'update') => {
    // Verificar se o modo offline está habilitado
    if (!offlineEnabled) return null;
    
    const dataId = `${table}-${data.id}-${Date.now()}`;
    
    setOfflineData(prev => [
      ...prev,
      {
        id: dataId,
        table,
        data,
        operation,
        timestamp: Date.now(),
        synced: false,
        conflicted: false
      }
    ]);
    
    // Atualizar status da tabela
    setSyncStatus(prev => ({
      ...prev,
      tablesStatus: {
        ...prev.tablesStatus,
        [table]: {
          lastSyncTime: prev.tablesStatus[table]?.lastSyncTime || null,
          pendingChanges: (prev.tablesStatus[table]?.pendingChanges || 0) + 1,
          syncDirection: 'upload'
        }
      }
    }));
    
    return dataId;
  };
  
  // Obter dados offline
  const getOfflineData = (table: string, id: string) => {
    // Verificar se o modo offline está habilitado
    if (!offlineEnabled) return null;
    
    // Buscar o item mais recente para esta tabela e ID
    const items = offlineData
      .filter(item => item.table === table && item.data.id === id)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return items.length > 0 ? items[0].data : null;
  };
  
  // Obter todos os dados offline de uma tabela
  const getAllOfflineData = (table: string) => {
    // Verificar se o modo offline está habilitado
    if (!offlineEnabled) return [];
    
    // Criar um mapa para armazenar o item mais recente para cada ID
    const latestItems = new Map();
    
    // Filtrar itens da tabela e ordenar por timestamp (mais recente primeiro)
    const items = offlineData
      .filter(item => item.table === table)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // Manter apenas o item mais recente para cada ID
    items.forEach(item => {
      if (!latestItems.has(item.data.id) || item.operation === 'delete') {
        latestItems.set(item.data.id, item);
      }
    });
    
    // Converter o mapa de volta para um array e filtrar itens excluídos
    return Array.from(latestItems.values())
      .filter(item => item.operation !== 'delete')
      .map(item => item.data);
  };
  
  // Sincronizar dados com o servidor
  const synchronize = async () => {
    // Verificar se o modo offline está habilitado e se está online
    if (!offlineEnabled || isOffline || syncStatus.syncInProgress) return;
    
    setSyncStatus(prev => ({
      ...prev,
      syncInProgress: true,
      syncError: null
    }));
    
    try {
      // Agrupar alterações por tabela
      const changesByTable = offlineData
        .filter(item => !item.synced)
        .reduce((acc, item) => {
          if (!acc[item.table]) {
            acc[item.table] = [];
          }
          acc[item.table].push(item);
          return acc;
        }, {} as { [key: string]: OfflineData[] });
      
      // Ordenar tabelas por prioridade
      const sortedTables = Object.keys(changesByTable).sort((a, b) => {
        const aPriority = offlineOptions.priorityTables?.indexOf(a) ?? -1;
        const bPriority = offlineOptions.priorityTables?.indexOf(b) ?? -1;
        
        if (aPriority === -1 && bPriority === -1) return 0;
        if (aPriority === -1) return 1;
        if (bPriority === -1) return -1;
        
        return aPriority - bPriority;
      });
      
      // Processar cada tabela
      for (const table of sortedTables) {
        const changes = changesByTable[table];
        
        // Agrupar por operação
        const inserts = changes.filter(item => item.operation === 'insert');
        const updates = changes.filter(item => item.operation === 'update');
        const deletes = changes.filter(item => item.operation === 'delete');
        
        // Processar inserções em lote
        if (inserts.length > 0) {
          const { error } = await supabase
            .from(table)
            .insert(inserts.map(item => item.data));
          
          if (error) throw new Error(`Erro ao inserir dados na tabela ${table}: ${error.message}`);
          
          // Marcar como sincronizados
          setOfflineData(prev => prev.map(item => {
            if (inserts.some(insert => insert.id === item.id)) {
              return { ...item, synced: true };
            }
            return item;
          }));
        }
        
        // Processar atualizações individualmente
        for (const update of updates) {
          const { error } = await supabase
            .from(table)
            .update(update.data)
            .eq('id', update.data.id);
          
          if (error) {
            // Marcar como conflitado
            setOfflineData(prev => prev.map(item => {
              if (item.id === update.id) {
                return { ...item, conflicted: true };
              }
              return item;
            }));
            
            continue;
          }
          
          // Marcar como sincronizado
          setOfflineData(prev => prev.map(item => {
            if (item.id === update.id) {
              return { ...item, synced: true };
            }
            return item;
          }));
        }
        
        // Processar exclusões individualmente
        for (const del of deletes) {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', del.data.id);
          
          if (error) {
            // Marcar como conflitado
            setOfflineData(prev => prev.map(item => {
              if (item.id === del.id) {
                return { ...item, conflicted: true };
              }
              return item;
            }));
            
            continue;
          }
          
          // Marcar como sincronizado
          setOfflineData(prev => prev.map(item => {
            if (item.id === del.id) {
              return { ...item, synced: true };
            }
            return item;
          }));
        }
        
        // Atualizar status da tabela
        setSyncStatus(prev => ({
          ...prev,
          tablesStatus: {
            ...prev.tablesStatus,
            [table]: {
              lastSyncTime: new Date(),
              pendingChanges: 0,
              syncDirection: 'bidirectional'
            }
          }
        }));
      }
      
      // Limpar dados sincronizados após um tempo
      setTimeout(() => {
        setOfflineData(prev => prev.filter(item => !item.synced));
      }, 60000); // 1 minuto
      
      // Atualizar status de sincronização
      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        syncInProgress: false,
        pendingChanges: offlineData.filter(item => !item.synced).length
      }));
      
      if (offlineOptions.showNotifications) {
        toast.success('Dados sincronizados com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        syncError: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      
      if (offlineOptions.showNotifications) {
        toast.error(`Erro ao sincronizar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  };
  
  // Resolver conflitos
  const resolveConflict = (dataId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any) => {
    const conflictedItem = offlineData.find(item => item.id === dataId && item.conflicted);
    
    if (!conflictedItem) return;
    
    if (resolution === 'local') {
      // Manter dados locais e tentar sincronizar novamente
      setOfflineData(prev => prev.map(item => {
        if (item.id === dataId) {
          return { ...item, conflicted: false };
        }
        return item;
      }));
    } else if (resolution === 'remote') {
      // Descartar dados locais
      setOfflineData(prev => prev.filter(item => item.id !== dataId));
    } else if (resolution === 'merge' && mergedData) {
      // Usar dados mesclados
      setOfflineData(prev => prev.map(item => {
        if (item.id === dataId) {
          return {
            ...item,
            data: mergedData,
            conflicted: false,
            synced: false
          };
        }
        return item;
      }));
    }
  };
  
  // Limpar todos os dados offline
  const clearOfflineData = () => {
    setOfflineData([]);
    
    setSyncStatus(prev => ({
      ...prev,
      pendingChanges: 0,
      tablesStatus: Object.keys(prev.tablesStatus).reduce((acc, key) => {
        acc[key] = {
          lastSyncTime: prev.tablesStatus[key].lastSyncTime,
          pendingChanges: 0,
          syncDirection: prev.tablesStatus[key].syncDirection
        };
        return acc;
      }, {} as SyncStatus['tablesStatus'])
    }));
    
    if (offlineOptions.showNotifications) {
      toast.info('Dados offline limpos com sucesso!');
    }
  };
  
  // Ativar/desativar modo offline
  const toggleOfflineMode = (enabled?: boolean) => {
    const newValue = enabled !== undefined ? enabled : !offlineEnabled;
    setOfflineEnabled(newValue);
    
    if (offlineOptions.showNotifications) {
      toast.info(`Modo offline ${newValue ? 'ativado' : 'desativado'}!`);
    }
    
    // Se estiver ativando e tiver dados pendentes, sincronizar
    if (newValue && !isOffline && syncStatus.pendingChanges > 0 && offlineOptions.autoSync) {
      synchronize();
    }
  };
  
  return {
    isOffline,
    offlineEnabled,
    syncStatus,
    addOfflineData,
    getOfflineData,
    getAllOfflineData,
    synchronize,
    resolveConflict,
    clearOfflineData,
    toggleOfflineMode
  };
};

export default useOfflineMode;