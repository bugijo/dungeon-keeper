
import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from 'sonner';
import { useInventorySync } from '@/hooks/useInventorySync';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';
import InventoryItem from '@/components/game/inventory/InventoryItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useImageUpload } from '@/hooks/useImageUpload';

type RarityType = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const rarityOptions = [
  { value: 'common', label: 'Comum' },
  { value: 'uncommon', label: 'Incomum' },
  { value: 'rare', label: 'Raro' },
  { value: 'epic', label: 'Épico' },
  { value: 'legendary', label: 'Lendário' },
];

const typeOptions = [
  { value: 'weapon', label: 'Arma' },
  { value: 'armor', label: 'Armadura' },
  { value: 'potion', label: 'Poção' },
  { value: 'scroll', label: 'Pergaminho' },
  { value: 'wondrous', label: 'Item Maravilhoso' },
  { value: 'tool', label: 'Ferramenta' },
  { value: 'treasure', label: 'Tesouro' },
  { value: 'item', label: 'Item Geral' },
];

const InventoryPage = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form state para novo/edição de item
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    quantity: 1,
    weight: 0,
    value: 0,
    type: 'item',
    rarity: 'common' as RarityType,
    imageUrl: '',
  });

  const { uploadImage } = useImageUpload({
    bucketName: 'inventory-images',
    maxSizeInMB: 2,
  });
  
  // Hook de sincronização de inventário
  const {
    inventory,
    loading: inventoryLoading,
    totalWeight,
    encumbranceStatus,
    addItem,
    removeItem,
    updateItemQuantity,
    toggleEquipped
  } = useInventorySync({
    characterId: selectedCharacter || '',
    isMaster: true
  });

  useEffect(() => {
    const fetchCharacters = async () => {
      if (!user) return;

      try {
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
      } catch (error) {
        console.error('Erro ao buscar personagens:', error);
        toast.error('Erro ao buscar seus personagens');
      }
    };
    
    fetchCharacters();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setFormState(prev => ({ ...prev, imageUrl }));
    }
  };

  const resetForm = () => {
    setFormState({
      name: '',
      description: '',
      quantity: 1,
      weight: 0,
      value: 0,
      type: 'item',
      rarity: 'common',
      imageUrl: '',
    });
    setEditingItem(null);
  };

  const handleItemEdit = (item: any) => {
    setEditingItem(item);
    setFormState({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      weight: item.weight,
      value: item.value || 0,
      type: item.type,
      rarity: item.rarity as RarityType,
      imageUrl: item.imageUrl || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCharacter) {
      toast.error('Selecione um personagem primeiro');
      return;
    }

    try {
      if (editingItem) {
        // Atualizar item existente
        const { data, error } = await supabase
          .from('character_inventory')
          .update({
            name: formState.name,
            description: formState.description,
            quantity: formState.quantity,
            weight: formState.weight,
            value: formState.value,
            type: formState.type,
            rarity: formState.rarity,
            image_url: formState.imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id)
          .select();
          
        if (error) throw error;
        toast.success('Item atualizado com sucesso!');
      } else {
        // Adicionar novo item
        await addItem({
          character_id: selectedCharacter,
          name: formState.name,
          description: formState.description,
          quantity: formState.quantity,
          weight: formState.weight,
          value: formState.value,
          type: formState.type,
          rarity: formState.rarity,
          imageUrl: formState.imageUrl,
        });
        toast.success('Item adicionado com sucesso!');
      }
      
      resetForm();
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
      toast.error(`Erro ao salvar item: ${error.message}`);
    }
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

  if (inventoryLoading) {
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-medievalsharp text-white">Inventário</h1>
            <Button 
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="fantasy-button primary flex items-center gap-2"
            >
              <Plus size={16} />
              Adicionar Item
            </Button>
          </div>
          
          {characters.length === 0 ? (
            <div className="fantasy-card p-6 text-center">
              <p className="text-fantasy-stone mb-4">Você ainda não possui personagens criados.</p>
              <Button className="fantasy-button primary">Criar Personagem</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Seletor de Personagem */}
              <div className="fantasy-card p-4">
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
              <div className="fantasy-card p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medievalsharp text-fantasy-gold">
                    Inventário
                  </h2>
                  <div className={`font-medievalsharp ${getEncumbranceColor()}`}>
                    Peso: {totalWeight} / 150
                  </div>
                </div>
                
                <ScrollArea className="h-[500px] pr-4">
                  {inventory.length > 0 ? (
                    <div className="space-y-2">
                      {inventory.map((item) => (
                        <InventoryItem
                          key={item.id}
                          id={item.id}
                          name={item.name}
                          description={item.description}
                          quantity={item.quantity}
                          weight={item.weight}
                          value={item.value}
                          type={item.type}
                          rarity={item.rarity as RarityType}
                          equipped={item.equipped}
                          imageUrl={item.imageUrl}
                          character_id={item.character_id}
                          onToggleEquipped={() => toggleEquipped(item.id)}
                          onRemove={() => {
                            if (confirm(`Tem certeza que deseja remover ${item.name}?`)) {
                              removeItem(item.id);
                            }
                          }}
                          onEdit={() => handleItemEdit(item)}
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
              </div>
            </div>
          )}
          
          {/* Dialog para adicionar/editar item */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="bg-fantasy-dark border-fantasy-purple/30 text-white">
              <DialogHeader>
                <DialogTitle className="font-medievalsharp text-fantasy-gold">
                  {editingItem ? 'Editar Item' : 'Adicionar Item'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      id="name" 
                      value={formState.name}
                      onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="bg-fantasy-dark/50 border-fantasy-purple/30"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea 
                      id="description" 
                      value={formState.description}
                      onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="bg-fantasy-dark/50 border-fantasy-purple/30"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input 
                        id="quantity" 
                        type="number" 
                        min={1}
                        value={formState.quantity}
                        onChange={(e) => setFormState(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                        required
                        className="bg-fantasy-dark/50 border-fantasy-purple/30"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="weight">Peso</Label>
                      <Input 
                        id="weight" 
                        type="number" 
                        step="0.1" 
                        min={0}
                        value={formState.weight}
                        onChange={(e) => setFormState(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
                        required
                        className="bg-fantasy-dark/50 border-fantasy-purple/30"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="value">Valor</Label>
                      <Input 
                        id="value" 
                        type="number" 
                        min={0}
                        value={formState.value}
                        onChange={(e) => setFormState(prev => ({ ...prev, value: parseInt(e.target.value) }))}
                        className="bg-fantasy-dark/50 border-fantasy-purple/30"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="type">Tipo</Label>
                      <Select 
                        value={formState.type}
                        onValueChange={(value) => setFormState(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="bg-fantasy-dark/50 border-fantasy-purple/30">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-fantasy-dark border-fantasy-purple/30">
                          {typeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="rarity">Raridade</Label>
                    <Select 
                      value={formState.rarity}
                      onValueChange={(value: RarityType) => setFormState(prev => ({ ...prev, rarity: value }))}
                    >
                      <SelectTrigger className="bg-fantasy-dark/50 border-fantasy-purple/30">
                        <SelectValue placeholder="Selecione a raridade" />
                      </SelectTrigger>
                      <SelectContent className="bg-fantasy-dark border-fantasy-purple/30">
                        {rarityOptions.map(option => (
                          <SelectItem key={option.value} value={option.value as RarityType}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="image">Imagem</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="image" 
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="bg-fantasy-dark/50 border-fantasy-purple/30"
                      />
                      {formState.imageUrl && (
                        <img 
                          src={formState.imageUrl} 
                          alt="Preview" 
                          className="h-10 w-10 object-cover rounded"
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setDialogOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="fantasy-button primary">
                    {editingItem ? 'Salvar' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </DndProvider>
    </MainLayout>
  );
};

export default InventoryPage;
