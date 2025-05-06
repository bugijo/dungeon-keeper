import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutoSaveOptions {
  interval?: number; // intervalo de salvamento em ms (padrão: 30000 = 30s)
  debounce?: number; // tempo de debounce em ms (padrão: 2000 = 2s)
  maxRetries?: number; // número máximo de tentativas em caso de falha
  saveOnUnload?: boolean; // salvar ao fechar a página
  saveOnBlur?: boolean; // salvar quando a janela perder o foco
  showNotifications?: boolean; // mostrar notificações de salvamento
  offlineSupport?: boolean; // suporte para salvamento offline
}

interface PendingChange {
  id: string;
  table: string;
  data: any;
  operation: 'insert' | 'update' | 'delete';
  timestamp: number;
  retryCount: number;
}

const DEFAULT_OPTIONS: AutoSaveOptions = {
  interval: 30000, // 30 segundos
  debounce: 2000, // 2 segundos
  maxRetries: 3,
  saveOnUnload: true,
  saveOnBlur: true,
  showNotifications: true,
  offlineSupport: true
};

export const useAutoSave = (options: AutoSaveOptions = {}) => {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Mesclar opções padrão com as fornecidas
  const saveOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Referências para timers
  const saveIntervalRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  
  // Inicializar o sistema de auto-save
  useEffect(() => {
    const initializeAutoSave = () => {
      // Carregar mudanças pendentes do armazenamento local
      if (saveOptions.offlineSupport) {
        const storedChanges = localStorage.getItem('dk_pending_changes');
        if (storedChanges) {
          try {
            setPendingChanges(JSON.parse(storedChanges));
          } catch (error) {
            console.error('Erro ao carregar mudanças pendentes:', error);
            localStorage.removeItem('dk_pending_changes');
          }
        }
      }
      
      // Configurar listeners para status online/offline
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Configurar listener para salvar ao fechar a página
      if (saveOptions.saveOnUnload) {
        window.addEventListener('beforeunload', handleBeforeUnload);
      }
      
      // Configurar listener para salvar quando a janela perder o foco
      if (saveOptions.saveOnBlur) {
        window.addEventListener('blur', handleWindowBlur);
      }
      
      // Iniciar intervalo de salvamento automático
      if (saveOptions.interval && saveOptions.interval > 0) {
        saveIntervalRef.current = window.setInterval(saveChanges, saveOptions.interval);
      }
      
      setIsInitialized(true);
    };
    
    initializeAutoSave();
    
    // Limpeza ao desmontar
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (saveOptions.saveOnUnload) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
      
      if (saveOptions.saveOnBlur) {
        window.removeEventListener('blur', handleWindowBlur);
      }
      
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Persistir mudanças pendentes quando alteradas
  useEffect(() => {
    if (!isInitialized || !saveOptions.offlineSupport) return;
    
    localStorage.setItem('dk_pending_changes', JSON.stringify(pendingChanges));
  }, [pendingChanges, isInitialized, saveOptions.offlineSupport]);
  
  // Handlers para eventos online/offline
  const handleOnline = () => {
    setIsOnline(true);
    
    // Tentar salvar mudanças pendentes quando voltar a ficar online
    if (pendingChanges.length > 0) {
      saveChanges();
    }
  };
  
  const handleOffline = () => {
    setIsOnline(false);
  };
  
  // Handler para evento beforeunload (fechar página)
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (pendingChanges.length > 0) {
      // Tentar salvar sincronamente antes de fechar
      saveChangesSynchronously();
      
      // Mostrar diálogo de confirmação se houver mudanças não salvas
      event.preventDefault();
      event.returnValue = 'Há alterações não salvas. Tem certeza que deseja sair?';
      return event.returnValue;
    }
  };
  
  // Handler para evento blur (perder foco)
  const handleWindowBlur = () => {
    if (pendingChanges.length > 0) {
      saveChanges();
    }
  };
  
  // Adicionar uma mudança à fila de pendentes
  const addChange = (table: string, data: any, operation: 'insert' | 'update' | 'delete' = 'update') => {
    const changeId = `${table}-${data.id}-${Date.now()}`;
    
    setPendingChanges(prev => [
      ...prev,
      {
        id: changeId,
        table,
        data,
        operation,
        timestamp: Date.now(),
        retryCount: 0
      }
    ]);
    
    // Iniciar timer de debounce para salvar após um período de inatividade
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = window.setTimeout(saveChanges, saveOptions.debounce);
    
    return changeId;
  };
  
  // Salvar mudanças pendentes
  const saveChanges = async () => {
    // Não fazer nada se não houver mudanças ou já estiver salvando
    if (pendingChanges.length === 0 || isSaving) return;
    
    // Não tentar salvar se estiver offline
    if (!isOnline && !saveOptions.offlineSupport) {
      if (saveOptions.showNotifications) {
        toast.warning('Você está offline. As alterações serão salvas quando a conexão for restaurada.');
      }
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Processar cada mudança pendente
      const changesToProcess = [...pendingChanges];
      const successfulChanges: string[] = [];
      const failedChanges: PendingChange[] = [];
      
      for (const change of changesToProcess) {
        try {
          let result;
          
          switch (change.operation) {
            case 'insert':
              result = await supabase
                .from(change.table)
                .insert(change.data)
                .select();
              break;
              
            case 'update':
              result = await supabase
                .from(change.table)
                .update(change.data)
                .eq('id', change.data.id);
              break;
              
            case 'delete':
              result = await supabase
                .from(change.table)
                .delete()
                .eq('id', change.data.id);
              break;
          }
          
          if (result.error) throw result.error;
          
          // Marcar como bem-sucedida
          successfulChanges.push(change.id);
        } catch (error) {
          console.error(`Erro ao salvar alteração ${change.id}:`, error);
          
          // Incrementar contador de tentativas
          const updatedChange = {
            ...change,
            retryCount: change.retryCount + 1
          };
          
          // Verificar se excedeu o número máximo de tentativas
          if (updatedChange.retryCount >= saveOptions.maxRetries!) {
            if (saveOptions.showNotifications) {
              toast.error(`Não foi possível salvar algumas alterações após ${saveOptions.maxRetries} tentativas.`);
            }
            // Descartar a mudança
            successfulChanges.push(change.id);
          } else {
            // Manter para tentar novamente
            failedChanges.push(updatedChange);
          }
        }
      }
      
      // Atualizar lista de mudanças pendentes
      setPendingChanges(prev => {
        // Manter apenas as mudanças que não foram processadas com sucesso
        const remainingChanges = prev.filter(change => !successfulChanges.includes(change.id));
        
        // Atualizar as mudanças que falharam
        const updatedChanges = remainingChanges.map(change => {
          const failedChange = failedChanges.find(fc => fc.id === change.id);
          return failedChange || change;
        });
        
        return updatedChanges;
      });
      
      // Atualizar timestamp do último salvamento
      if (successfulChanges.length > 0) {
        setLastSaved(new Date());
        
        if (saveOptions.showNotifications) {
          toast.success('Alterações salvas com sucesso!');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      
      if (saveOptions.showNotifications) {
        toast.error('Erro ao salvar alterações. Tentando novamente mais tarde.');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Salvar mudanças de forma síncrona (usado ao fechar a página)
  const saveChangesSynchronously = () => {
    if (pendingChanges.length === 0) return;
    
    try {
      // Usar localStorage para armazenar as mudanças pendentes
      localStorage.setItem('dk_pending_changes', JSON.stringify(pendingChanges));
      
      // Tentar enviar um beacon para o servidor (não bloqueia o fechamento da página)
      const pendingData = new Blob([JSON.stringify(pendingChanges)], { type: 'application/json' });
      navigator.sendBeacon('/api/auto-save', pendingData);
    } catch (error) {
      console.error('Erro ao salvar alterações sincronamente:', error);
    }
  };
  
  // Forçar salvamento imediato
  const forceSave = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    return saveChanges();
  };
  
  // Descartar todas as mudanças pendentes
  const discardChanges = () => {
    setPendingChanges([]);
    
    if (saveOptions.offlineSupport) {
      localStorage.removeItem('dk_pending_changes');
    }
    
    if (saveOptions.showNotifications) {
      toast.info('Alterações descartadas.');
    }
  };
  
  return {
    pendingChanges,
    isSaving,
    lastSaved,
    isOnline,
    addChange,
    saveChanges,
    forceSave,
    discardChanges
  };
};

export default useAutoSave;