
import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from 'sonner';
import { useInventorySync } from '@/hooks/useInventorySync';
import DraggableInventoryItem from '@/components/game/inventory/DraggableInventoryItem';
import InventoryDropZone from '@/components/game/inventory/InventoryDropZone';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

const Inventory = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [otherCharacters, setOtherCharacters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Usar o hook de sincronização de inventário
  const {
    inventory,
    loading: inventoryLoading,
    totalWeight,
    encumbranceStatus,
    transferItem
  } = useInventorySync({
    characterId: selectedCharacter || '',
    isMaster: true
  });

  useEffect(() => {
    const fetchCharacters = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Buscar os personagens do usuário
        const { data: userCharacters, error: userError } = await supabase
          .from('characters')
          .select('id, name, class, race, level')
          .eq('user_id', user.id);
          
        if (userError) throw userError;
        
        if (userCharacters && userCharacters.length > 0) {
          setCharacters(userCharacters);
          setSelectedCharacter(userCharacters[0].id);
        }
        
        // Buscar outros personagens para possibilitar transferências
        const { data: otherChars, error: otherError } = await supabase
          .from('characters')
          .select('id, name, class, race, level, user_id')
          .neq('user_id', user.id)
          .limit(10);
          
        if (otherError) throw otherError;
        
        if (otherChars) {
          setOtherCharacters(otherChars);
        }
      } catch (error) {
        console.error('Erro ao buscar personagens:', error);
        toast.error('Erro ao buscar seus personagens');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCharacters();
  }, [user]);
  
  const handleItemDrop = (item: any, targetCharacterId: string) => {
    if (!item.id || !targetCharacterId) return;
    
    // Verifica se é uma transferência válida (não para o mesmo personagem)
    if (item.character_id === targetCharacterId) {
      toast.error('Não é possível transferir para o mesmo personagem');
      return;
    }
    
    // Transfere o item usando o hook de sincronização
    transferItem(item.id, targetCharacterId)
      .then(() => {
        toast.success(`${item.name} transferido com sucesso`);
      })
      .catch((error) => {
        toast.error('Erro ao transferir item');
        console.error(error);
      });
  };

  const getEncumbranceColor = () => {
    switch (encumbranceStatus) {
      case 'light': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'heavy': return 'text-orange-400';
      case 'overencumbered': return 'text-red-400';
      default: return 'text-green-400';
    }
  };

  if (isLoading || inventoryLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse text-fantasy-purple text-center">Carregando inventário...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DndProvider backend={HTML5Backend}>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-medievalsharp text-white mb-6">Inventário</h1>
          
          {characters.length === 0 ? (
            <div className="fantasy-card p-6 text-center">
              <p className="text-fantasy-stone mb-4">Você ainda não possui personagens criados.</p>
              <Button className="fantasy-button primary">Criar Personagem</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Seletor de Personagem */}
              <div className="fantasy-card p-4 lg:col-span-3">
                <div className="flex flex-wrap gap-2">
                  {characters.map((char) => (
                    <Button
                      key={char.id}
                      onClick={() => setSelectedCharacter(char.id)}
                      variant={selectedCharacter === char.id ? "default" : "outline"}
                      className={selectedCharacter === char.id ? "fantasy-button primary" : ""}
                    >
                      {char.name} ({char.race} {char.class})
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Inventário do Personagem Selecionado */}
              <div className="lg:col-span-2">
                <div className="fantasy-card p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-medievalsharp text-fantasy-gold">
                      Inventário
                    </h2>
                    <div className={`font-medievalsharp ${getEncumbranceColor()}`}>
                      Peso: {totalWeight} / 150
                    </div>
                  </div>
                  
                  <InventoryDropZone characterId={selectedCharacter || ''} onItemDrop={handleItemDrop}>
                    <ScrollArea className="h-[400px] pr-4">
                      {inventory.length > 0 ? (
                        <div className="space-y-2">
                          {inventory.map((item) => (
                            <DraggableInventoryItem
                              key={item.id}
                              item={item}
                              canDrag={true}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-fantasy-stone">
                          <Package size={48} className="mx-auto mb-2 opacity-50" />
                          <p>Inventário vazio</p>
                        </div>
                      )}
                    </ScrollArea>
                  </InventoryDropZone>
                </div>
              </div>
              
              {/* Lista de outros personagens para transferências */}
              <div>
                <div className="fantasy-card p-4">
                  <h2 className="text-xl font-medievalsharp text-fantasy-gold mb-4">
                    Outros Personagens
                  </h2>
                  
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {otherCharacters.map((char) => (
                        <InventoryDropZone 
                          key={char.id}
                          characterId={char.id}
                          onItemDrop={handleItemDrop}
                        >
                          <div className="p-3 border rounded-md border-fantasy-purple/30 bg-fantasy-dark/50">
                            <h3 className="font-medievalsharp">{char.name}</h3>
                            <p className="text-sm text-fantasy-stone">{char.race} {char.class}</p>
                            <div className="mt-2 text-xs text-fantasy-stone/70">
                              Arraste itens para cá para transferir
                            </div>
                          </div>
                        </InventoryDropZone>
                      ))}
                      
                      {otherCharacters.length === 0 && (
                        <div className="text-center py-12 text-fantasy-stone">
                          <p>Nenhum outro personagem disponível</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </div>
      </DndProvider>
    </MainLayout>
  );
};

export default Inventory;
