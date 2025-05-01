
import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useInventorySync } from '@/hooks/useInventorySync';
import DraggableInventoryItem, { InventoryItemData } from './DraggableInventoryItem';
import InventoryDropZone from './InventoryDropZone';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Package } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  user_id: string;
}

interface InventorySyncProps {
  sessionId: string;
  characterId: string;
  isGameMaster: boolean;
}

const InventorySync: React.FC<InventorySyncProps> = ({ sessionId, characterId, isGameMaster }) => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: 1,
    weight: 0.5,
    value: 0,
    type: 'item',
    rarity: 'common' as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  });

  const { 
    inventory, 
    loading, 
    totalWeight, 
    maxWeight, 
    encumbranceStatus, 
    addItem,
    transferItem
  } = useInventorySync({ 
    characterId, 
    isMaster: isGameMaster 
  });

  // Buscar personagens da sessão
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const { data, error } = await supabase
          .from('table_participants')
          .select(`
            character_id,
            characters:character_id (id, name, user_id)
          `)
          .eq('table_id', sessionId)
          .not('character_id', 'is', null);

        if (error) throw error;

        const charactersData = data
          .map(p => p.characters)
          .filter(c => c !== null) as Character[];

        setCharacters(charactersData);
      } catch (err) {
        console.error('Erro ao buscar personagens:', err);
        toast.error('Não foi possível carregar os personagens da sessão');
      }
    };

    if (sessionId) {
      fetchCharacters();
    }
  }, [sessionId]);

  const handleItemDrop = (item: InventoryItemData, targetCharacterId: string) => {
    if (item.character_id === targetCharacterId) return;

    // Verificar se o usuário é o dono do personagem ou o mestre
    const canTransfer = isGameMaster || (user?.id && characters.find(c => c.id === item.character_id)?.user_id === user.id);

    if (!canTransfer) {
      toast.error('Você não tem permissão para transferir este item');
      return;
    }

    transferItem(item.id, targetCharacterId);
  };

  const handleAddItem = async () => {
    if (!newItem.name) {
      toast.error('O nome do item é obrigatório');
      return;
    }

    const result = await addItem({
      ...newItem,
      character_id: characterId
    } as Omit<InventoryItemData, 'id'>);

    if (result) {
      setIsAddItemOpen(false);
      setNewItem({
        name: '',
        description: '',
        quantity: 1,
        weight: 0.5,
        value: 0,
        type: 'item',
        rarity: 'common' as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
      });
    }
  };

  const getEncumbranceColor = () => {
    switch (encumbranceStatus) {
      case 'light': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'heavy': return 'text-orange-500';
      case 'overencumbered': return 'text-red-500';
      default: return 'text-green-500';
    }
  };

  // Verifica se o usuário pode arrastar um item (é dono ou mestre)
  const canDragItem = (itemCharacterId: string): boolean => {
    if (isGameMaster) return true;
    if (!user?.id) return false;
    
    const character = characters.find(c => c.id === itemCharacterId);
    return character?.user_id === user.id;
  };

  if (loading) {
    return <div className="p-4 text-center text-fantasy-stone">Carregando inventário...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 bg-fantasy-dark/70 border border-fantasy-purple/30 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medievalsharp text-fantasy-gold">Inventário</h2>
          <div className="text-sm">
            <span className={getEncumbranceColor()}>
              Peso: {totalWeight.toFixed(1)} / {maxWeight} ({encumbranceStatus})
            </span>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button 
                className="fantasy-button primary"
                disabled={!characterId || (!isGameMaster && user?.id !== characters.find(c => c.id === characterId)?.user_id)}
              >
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-fantasy-dark border border-fantasy-purple/50">
              <DialogHeader>
                <DialogTitle className="text-fantasy-gold font-medievalsharp">Adicionar Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-fantasy-stone mb-1">Nome</label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="bg-fantasy-dark/50 border-fantasy-purple/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-fantasy-stone mb-1">Descrição</label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    className="bg-fantasy-dark/50 border-fantasy-purple/30 text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-fantasy-stone mb-1">Quantidade</label>
                    <Input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                      className="bg-fantasy-dark/50 border-fantasy-purple/30 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-fantasy-stone mb-1">Peso</label>
                    <Input
                      type="number"
                      value={newItem.weight}
                      onChange={(e) => setNewItem({...newItem, weight: parseFloat(e.target.value) || 0})}
                      className="bg-fantasy-dark/50 border-fantasy-purple/30 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-fantasy-stone mb-1">Valor</label>
                    <Input
                      type="number"
                      value={newItem.value}
                      onChange={(e) => setNewItem({...newItem, value: parseInt(e.target.value) || 0})}
                      className="bg-fantasy-dark/50 border-fantasy-purple/30 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-fantasy-stone mb-1">Tipo</label>
                  <select 
                    value={newItem.type}
                    onChange={(e) => setNewItem({...newItem, type: e.target.value})}
                    className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 text-white rounded p-2"
                  >
                    <option value="item">Item</option>
                    <option value="weapon">Arma</option>
                    <option value="armor">Armadura</option>
                    <option value="potion">Poção</option>
                    <option value="scroll">Pergaminho</option>
                    <option value="wondrous">Item Maravilhoso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-fantasy-stone mb-1">Raridade</label>
                  <select 
                    value={newItem.rarity}
                    onChange={(e) => setNewItem({...newItem, rarity: e.target.value as any})}
                    className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 text-white rounded p-2"
                  >
                    <option value="common">Comum</option>
                    <option value="uncommon">Incomum</option>
                    <option value="rare">Raro</option>
                    <option value="epic">Épico</option>
                    <option value="legendary">Lendário</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button 
                    className="fantasy-button primary" 
                    onClick={handleAddItem}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {inventory.length === 0 ? (
          <div className="text-center py-8 text-fantasy-stone">
            <Package size={40} className="mx-auto mb-2 text-fantasy-stone/60" />
            <p>Inventário vazio</p>
          </div>
        ) : (
          <InventoryDropZone characterId={characterId} onItemDrop={handleItemDrop}>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {inventory.map((item) => (
                <DraggableInventoryItem
                  key={item.id}
                  item={item}
                  canDrag={canDragItem(item.character_id)}
                />
              ))}
            </div>
          </InventoryDropZone>
        )}

        {isGameMaster && characters.length > 1 && (
          <div className="mt-6">
            <h3 className="text-white font-medievalsharp mb-2">Transferir para outro personagem:</h3>
            <div className="grid grid-cols-2 gap-4">
              {characters
                .filter(c => c.id !== characterId)
                .map(character => (
                  <InventoryDropZone
                    key={character.id}
                    characterId={character.id}
                    onItemDrop={handleItemDrop}
                  >
                    <div className="border border-dashed border-fantasy-purple/50 p-2 rounded text-center text-fantasy-stone hover:bg-fantasy-purple/10 transition-colors">
                      {character.name}
                    </div>
                  </InventoryDropZone>
                ))}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default InventorySync;
