import React, { useState, useEffect } from 'react';
import { Star, Plus, X, Edit, Save, Dice, Sword, Shield, Wand, Heart, Zap, Move, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Action {
  id: string;
  name: string;
  type: 'attack' | 'spell' | 'ability' | 'item' | 'skill' | 'custom';
  description?: string;
  command?: string;
  icon: string;
  color: string;
}

interface FavoriteActionsProps {
  characterId?: string;
  onActionExecute?: (action: Action) => void;
}

const ICON_OPTIONS = [
  { name: 'Espada', value: 'sword', component: <Sword className="h-4 w-4" /> },
  { name: 'Escudo', value: 'shield', component: <Shield className="h-4 w-4" /> },
  { name: 'Varinha', value: 'wand', component: <Wand className="h-4 w-4" /> },
  { name: 'Dado', value: 'dice', component: <Dice className="h-4 w-4" /> },
  { name: 'Coração', value: 'heart', component: <Heart className="h-4 w-4" /> },
  { name: 'Raio', value: 'zap', component: <Zap className="h-4 w-4" /> },
  { name: 'Movimento', value: 'move', component: <Move className="h-4 w-4" /> },
  { name: 'Olho', value: 'eye', component: <Eye className="h-4 w-4" /> },
  { name: 'Estrela', value: 'star', component: <Star className="h-4 w-4" /> },
];

const COLOR_OPTIONS = [
  { name: 'Roxo', value: 'bg-fantasy-purple text-white' },
  { name: 'Azul', value: 'bg-blue-500 text-white' },
  { name: 'Verde', value: 'bg-green-500 text-white' },
  { name: 'Âmbar', value: 'bg-amber-500 text-white' },
  { name: 'Vermelho', value: 'bg-red-500 text-white' },
  { name: 'Cinza', value: 'bg-gray-500 text-white' },
];

// Exemplos de ações predefinidas
const PRESET_ACTIONS: Action[] = [
  {
    id: 'attack-1',
    name: 'Ataque com Espada',
    type: 'attack',
    description: 'Ataque corpo a corpo com espada longa',
    command: '/roll 1d20+5 Ataque com Espada',
    icon: 'sword',
    color: 'bg-red-500 text-white'
  },
  {
    id: 'spell-1',
    name: 'Mísseis Mágicos',
    type: 'spell',
    description: 'Conjura 3 dardos de energia mágica',
    command: '/roll 3d4+3 Mísseis Mágicos',
    icon: 'wand',
    color: 'bg-blue-500 text-white'
  },
  {
    id: 'ability-1',
    name: 'Fúria',
    type: 'ability',
    description: 'Entra em estado de fúria por 1 minuto',
    command: '/ability Fúria ativada',
    icon: 'zap',
    color: 'bg-amber-500 text-white'
  },
  {
    id: 'skill-1',
    name: 'Percepção',
    type: 'skill',
    description: 'Teste de Percepção (Sabedoria)',
    command: '/roll 1d20+3 Percepção',
    icon: 'eye',
    color: 'bg-green-500 text-white'
  },
];

const FavoriteActions: React.FC<FavoriteActionsProps> = ({ characterId, onActionExecute }) => {
  const [favoriteActions, setFavoriteActions] = useState<Action[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAction, setNewAction] = useState<Omit<Action, 'id'>>({ 
    name: '', 
    type: 'custom',
    description: '',
    command: '',
    icon: 'star',
    color: 'bg-fantasy-purple text-white'
  });
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  
  // Carregar ações favoritas do localStorage
  useEffect(() => {
    const storageKey = characterId ? `favoriteActions_${characterId}` : 'favoriteActions_default';
    const savedActions = localStorage.getItem(storageKey);
    
    if (savedActions) {
      try {
        setFavoriteActions(JSON.parse(savedActions));
      } catch (e) {
        console.error('Erro ao carregar ações favoritas:', e);
        // Se houver erro, inicializar com algumas ações predefinidas
        setFavoriteActions(PRESET_ACTIONS);
      }
    } else {
      // Se não houver ações salvas, inicializar com algumas ações predefinidas
      setFavoriteActions(PRESET_ACTIONS);
    }
  }, [characterId]);
  
  // Salvar ações favoritas no localStorage quando houver alterações
  useEffect(() => {
    if (favoriteActions.length > 0) {
      const storageKey = characterId ? `favoriteActions_${characterId}` : 'favoriteActions_default';
      localStorage.setItem(storageKey, JSON.stringify(favoriteActions));
    }
  }, [favoriteActions, characterId]);
  
  // Adicionar nova ação
  const handleAddAction = () => {
    if (!newAction.name.trim()) {
      toast.error('O nome da ação não pode estar vazio');
      return;
    }
    
    const action: Action = {
      ...newAction,
      id: editingActionId || Date.now().toString()
    };
    
    if (editingActionId) {
      // Atualizar ação existente
      setFavoriteActions(prev => prev.map(a => a.id === editingActionId ? action : a));
      toast.success('Ação atualizada com sucesso!');
    } else {
      // Adicionar nova ação
      setFavoriteActions(prev => [...prev, action]);
      toast.success('Ação adicionada com sucesso!');
    }
    
    // Resetar formulário
    setNewAction({ 
      name: '', 
      type: 'custom',
      description: '',
      command: '',
      icon: 'star',
      color: 'bg-fantasy-purple text-white'
    });
    setEditingActionId(null);
    setShowAddDialog(false);
  };
  
  // Remover ação
  const handleRemoveAction = (id: string) => {
    setFavoriteActions(prev => prev.filter(action => action.id !== id));
    toast.success('Ação removida com sucesso!');
  };
  
  // Editar ação
  const handleEditAction = (action: Action) => {
    setNewAction({
      name: action.name,
      type: action.type,
      description: action.description || '',
      command: action.command || '',
      icon: action.icon,
      color: action.color
    });
    setEditingActionId(action.id);
    setShowAddDialog(true);
  };
  
  // Executar ação
  const handleExecuteAction = (action: Action) => {
    if (onActionExecute) {
      onActionExecute(action);
    } else {
      // Comportamento padrão se não houver manipulador personalizado
      if (action.command) {
        toast.info(`Executando: ${action.name}`, {
          description: action.command
        });
        // Em produção, aqui seria integrado com o sistema de chat/dados
      }
    }
  };
  
  // Renderizar ícone com base no valor
  const renderIcon = (iconName: string) => {
    const icon = ICON_OPTIONS.find(opt => opt.value === iconName);
    return icon ? icon.component : <Star className="h-4 w-4" />;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-fantasy-purple" />
          <h2 className="text-xl font-medievalsharp text-fantasy-purple">Ações Favoritas</h2>
        </div>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <Button 
              variant="outline" 
              size="sm"
              className="bg-fantasy-paper border-fantasy-stone/30 hover:bg-fantasy-paper/80 hover:border-fantasy-purple/50"
              onClick={() => setIsEditing(false)}
            >
              <Save className="h-4 w-4 mr-1" />
              Concluir
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              className="bg-fantasy-paper border-fantasy-stone/30 hover:bg-fantasy-paper/80 hover:border-fantasy-purple/50"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            className="bg-fantasy-paper border-fantasy-stone/30 hover:bg-fantasy-paper/80 hover:border-fantasy-purple/50"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Ação
          </Button>
        </div>
      </div>
      
      {favoriteActions.length === 0 ? (
        <Card className="bg-fantasy-paper/50 border-fantasy-stone/20">
          <CardContent className="p-6 text-center">
            <p className="text-fantasy-stone/70">Nenhuma ação favorita adicionada.</p>
            <p className="text-fantasy-stone/50 text-sm mt-1">Clique em "Nova Ação" para adicionar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {favoriteActions.map((action) => (
            <Card 
              key={action.id} 
              className={`border transition-colors ${isEditing ? 'hover:border-fantasy-purple/70' : 'cursor-pointer hover:shadow-md'}`}
              onClick={() => !isEditing && handleExecuteAction(action)}
            >
              <CardContent className="p-3 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center mb-2`}>
                  {renderIcon(action.icon)}
                </div>
                <h3 className="font-medievalsharp text-fantasy-purple text-sm">{action.name}</h3>
                {action.description && (
                  <p className="text-xs text-fantasy-stone/70 mt-1 line-clamp-2">{action.description}</p>
                )}
                
                {isEditing && (
                  <div className="flex space-x-1 mt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-fantasy-stone/60 hover:text-fantasy-purple"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAction(action);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-fantasy-stone/60 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAction(action.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Diálogo para adicionar/editar ação */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-fantasy-paper border-fantasy-stone/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-medievalsharp text-fantasy-purple">
              {editingActionId ? 'Editar Ação' : 'Nova Ação Favorita'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-fantasy-stone">Nome da Ação</label>
              <Input
                placeholder="Ex: Ataque com Espada"
                value={newAction.name}
                onChange={(e) => setNewAction({...newAction, name: e.target.value})}
                className="bg-white/10 border-fantasy-stone/30"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-fantasy-stone">Tipo</label>
              <div className="grid grid-cols-3 gap-2">
                {['attack', 'spell', 'ability', 'item', 'skill', 'custom'].map((type) => (
                  <Button
                    key={type}
                    variant={newAction.type === type ? 'default' : 'outline'}
                    size="sm"
                    className={newAction.type === type ? 'bg-fantasy-purple' : ''}
                    onClick={() => setNewAction({...newAction, type: type as any})}
                  >
                    {type === 'attack' && 'Ataque'}
                    {type === 'spell' && 'Magia'}
                    {type === 'ability' && 'Habilidade'}
                    {type === 'item' && 'Item'}
                    {type === 'skill' && 'Perícia'}
                    {type === 'custom' && 'Personalizado'}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-fantasy-stone">Descrição (opcional)</label>
              <Input
                placeholder="Ex: Ataque corpo a corpo com espada longa"
                value={newAction.description}
                onChange={(e) => setNewAction({...newAction, description: e.target.value})}
                className="bg-white/10 border-fantasy-stone/30"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-fantasy-stone">Comando (opcional)</label>
              <Input
                placeholder="Ex: /roll 1d20+5 Ataque"
                value={newAction.command}
                onChange={(e) => setNewAction({...newAction, command: e.target.value})}
                className="bg-white/10 border-fantasy-stone/30"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-fantasy-stone">Ícone</label>
                <div className="grid grid-cols-3 gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <div 
                      key={icon.value}
                      className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center ${newAction.icon === icon.value ? 'bg-fantasy-purple text-white' : 'bg-white/10 text-fantasy-stone hover:bg-fantasy-purple/20'}`}
                      onClick={() => setNewAction({...newAction, icon: icon.value})}
                      title={icon.name}
                    >
                      {icon.component}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-fantasy-stone">Cor</label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <div 
                      key={color.value}
                      className={`w-8 h-8 rounded-full cursor-pointer ${color.value} flex items-center justify-center ${newAction.color === color.value ? 'ring-2 ring-fantasy-purple ring-offset-2' : ''}`}
                      onClick={() => setNewAction({...newAction, color: color.value})}
                      title={color.name}
                    >
                      {newAction.color === color.value && <Check className="h-3 w-3" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddDialog(false);
                setEditingActionId(null);
                setNewAction({ 
                  name: '', 
                  type: 'custom',
                  description: '',
                  command: '',
                  icon: 'star',
                  color: 'bg-fantasy-purple text-white'
                });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddAction}>
              {editingActionId ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FavoriteActions;