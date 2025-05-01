
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InventoryItemData } from '@/components/game/inventory/DraggableInventoryItem';

interface UseInventorySyncOptions {
  characterId: string;
  isMaster?: boolean;
}

export function useInventorySync({ characterId, isMaster = false }: UseInventorySyncOptions) {
  const [inventory, setInventory] = useState<InventoryItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const [maxWeight, setMaxWeight] = useState(150); // Valor padrão, pode ser ajustado com base nos atributos

  // Calcula o status de sobrecarga
  const encumbranceStatus = () => {
    if (totalWeight <= maxWeight * 0.33) return 'light';
    if (totalWeight <= maxWeight * 0.66) return 'medium';
    if (totalWeight <= maxWeight) return 'heavy';
    return 'overencumbered';
  };

  // Carrega os itens do inventário do banco de dados
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        
        if (!characterId) return;
        
        const { data, error } = await supabase
          .from('character_inventory')
          .select('*')
          .eq('character_id', characterId);
          
        if (error) throw error;
        
        // Transform data to match the TypeScript interface
        const transformedData = data.map(item => ({
          ...item,
          imageUrl: item.image_url,
        })) as InventoryItemData[];
        
        setInventory(transformedData);
        
        // Calcula o peso total
        const total = data.reduce((sum, item) => {
          return sum + (Number(item.weight) * item.quantity);
        }, 0);
        
        setTotalWeight(total);
      } catch (err: any) {
        console.error("Error loading inventory:", err);
        setError(err.message);
        toast.error(`Erro ao carregar inventário: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (characterId) {
      loadInventory();
      
      // Configurar assinatura em tempo real para atualizações do inventário
      const channel = supabase
        .channel('character_inventory_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'character_inventory',
            filter: `character_id=eq.${characterId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newItem = {
                ...payload.new,
                imageUrl: payload.new.image_url,
              } as InventoryItemData;
              
              setInventory((current) => [...current, newItem]);
              setTotalWeight((current) => current + Number(payload.new.weight) * payload.new.quantity);
              toast.success(`Item adicionado: ${payload.new.name}`);
            } 
            else if (payload.eventType === 'UPDATE') {
              const updatedItem = {
                ...payload.new,
                imageUrl: payload.new.image_url,
              } as InventoryItemData;
              
              setInventory((current) => 
                current.map((item) => 
                  item.id === payload.new.id ? updatedItem : item
                )
              );
              
              // Recalcular peso total após atualização
              setInventory((current) => {
                const total = current.reduce((sum, item) => {
                  return sum + (Number(item.weight) * item.quantity);
                }, 0);
                
                setTotalWeight(total);
                return current;
              });
            } 
            else if (payload.eventType === 'DELETE') {
              setInventory((current) => 
                current.filter((item) => item.id !== payload.old.id)
              );
              setTotalWeight((current) => current - Number(payload.old.weight) * payload.old.quantity);
              toast.success(`Item removido: ${payload.old.name}`);
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [characterId]);

  // Adiciona um item ao inventário
  const addItem = async (item: Omit<InventoryItemData, 'id'>) => {
    try {
      // Convert the item to match the database schema
      const dbItem = {
        ...item,
        image_url: item.imageUrl
      };
      
      const { data, error } = await supabase
        .from('character_inventory')
        .insert({ ...dbItem })
        .select()
        .single();
        
      if (error) throw error;
      
      // Return the item transformed to match our UI format
      return {
        ...data,
        imageUrl: data.image_url
      } as InventoryItemData;
      
    } catch (err: any) {
      setError(err.message);
      toast.error(`Erro ao adicionar item: ${err.message}`);
      return null;
    }
  };

  // Remove um item do inventário
  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('character_inventory')
        .delete()
        .eq('id', itemId);
        
      if (error) throw error;
      
      return true;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Erro ao remover item: ${err.message}`);
      return false;
    }
  };

  // Atualiza a quantidade de um item
  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        return removeItem(itemId);
      }
      
      const { data, error } = await supabase
        .from('character_inventory')
        .update({ quantity: newQuantity })
        .eq('id', itemId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Transform to match our UI format
      return {
        ...data,
        imageUrl: data.image_url
      } as InventoryItemData;
      
    } catch (err: any) {
      setError(err.message);
      toast.error(`Erro ao atualizar quantidade: ${err.message}`);
      return null;
    }
  };

  // Alterna o status de equipado de um item
  const toggleEquipped = async (itemId: string) => {
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) throw new Error('Item não encontrado');
      
      const { data, error } = await supabase
        .from('character_inventory')
        .update({ equipped: !item.equipped })
        .eq('id', itemId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Transform to match our UI format
      return {
        ...data,
        imageUrl: data.image_url
      } as InventoryItemData;
      
    } catch (err: any) {
      setError(err.message);
      toast.error(`Erro ao atualizar status de equipamento: ${err.message}`);
      return null;
    }
  };

  // Transfere um item para outro personagem
  const transferItem = async (itemId: string, targetCharacterId: string) => {
    try {
      if (itemId === targetCharacterId) return null; // Evita transferir para o mesmo personagem
      
      const item = inventory.find(i => i.id === itemId);
      if (!item) throw new Error('Item não encontrado');
      
      // Transferir o item para o novo personagem
      const { data, error } = await supabase
        .from('character_inventory')
        .update({ character_id: targetCharacterId })
        .eq('id', itemId)
        .select();
        
      if (error) throw error;
      
      toast.success(`Item transferido com sucesso!`);
      
      // Transform to match our UI format
      return data.map(item => ({
        ...item,
        imageUrl: item.image_url
      })) as InventoryItemData[];
      
    } catch (err: any) {
      setError(err.message);
      toast.error(`Erro ao transferir item: ${err.message}`);
      return null;
    }
  };

  return {
    inventory,
    loading,
    error,
    totalWeight,
    maxWeight,
    encumbranceStatus: encumbranceStatus(),
    addItem,
    removeItem,
    updateItemQuantity,
    toggleEquipped,
    transferItem
  };
}
