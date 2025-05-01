import React, { useState } from 'react';
import { Star, Plus, X, Sword, Shield, Wand2, Eye, Scroll, Dice5 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface Action {
  id: string;
  name: string;
  type: 'attack' | 'spell' | 'skill' | 'item' | 'custom';
  icon?: React.ReactNode;
  description?: string;
  modifier?: string;
  shortcut?: string;
}

interface FavoriteActionsProps {
  className?: string;
  initialActions?: Action[];
  onActionClick?: (action: Action) => void;
  onAddAction?: () => void;
  onRemoveAction?: (actionId: string) => void;
  editable?: boolean;
}

/**
 * Componente de Ações Favoritas para jogadores
 * Permite aos jogadores personalizar um menu de ações rápidas
 */
export function FavoriteActions({
  className,
  initialActions = [],
  onActionClick,
  onAddAction,
  onRemoveAction,
  editable = true,
}: FavoriteActionsProps) {
  const [actions, setActions] = useState<Action[]>(initialActions);
  const [isEditing, setIsEditing] = useState(false);

  // Ícones padrão para cada tipo de ação
  const getActionIcon = (type: Action['type'], customIcon?: React.ReactNode) => {
    if (customIcon) return customIcon;
    
    switch (type) {
      case 'attack':
        return <Sword className="h-4 w-4" />;
      case 'spell':
        return <Wand2 className="h-4 w-4" />;
      case 'skill':
        return <Eye className="h-4 w-4" />;
      case 'item':
        return <Scroll className="h-4 w-4" />;
      case 'custom':
        return <Dice5 className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const handleActionClick = (action: Action) => {
    if (isEditing) return;
    if (onActionClick) {
      onActionClick(action);
    }
  };

  const handleRemoveAction = (e: React.MouseEvent, actionId: string) => {
    e.stopPropagation();
    const updatedActions = actions.filter(action => action.id !== actionId);
    setActions(updatedActions);
    
    if (onRemoveAction) {
      onRemoveAction(actionId);
    }
  };

  const handleAddAction = () => {
    if (onAddAction) {
      onAddAction();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-amber-200 font-medievalsharp text-lg">Ações Favoritas</h3>
        {editable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs bg-amber-950/50 border-amber-800/70 hover:bg-amber-900/50 text-amber-200"
          >
            {isEditing ? 'Concluir' : 'Editar'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {actions.map((action) => (
          <div
            key={action.id}
            onClick={() => handleActionClick(action)}
            className={cn(
              'relative flex items-center gap-2 p-2 rounded-md border border-amber-800/50 bg-amber-950/50 hover:bg-amber-900/50 cursor-pointer transition-colors',
              isEditing && 'border-dashed'
            )}
          >
            <div className="flex-shrink-0 text-amber-500">
              {getActionIcon(action.type, action.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medievalsharp text-amber-200 truncate">{action.name}</p>
              {action.modifier && (
                <p className="text-xs text-amber-400">{action.modifier}</p>
              )}
            </div>
            {isEditing && (
              <button
                onClick={(e) => handleRemoveAction(e, action.id)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="Remover ação"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {editable && isEditing && (
          <button
            onClick={handleAddAction}
            className="flex flex-col items-center justify-center p-2 rounded-md border-2 border-dashed border-amber-800/30 bg-amber-950/30 hover:bg-amber-900/30 cursor-pointer transition-colors h-full min-h-[60px]"
          >
            <Plus className="h-5 w-5 text-amber-500" />
            <span className="text-xs text-amber-400 mt-1">Adicionar</span>
          </button>
        )}
      </div>

      {actions.length === 0 && !isEditing && (
        <div className="text-center p-4 border border-dashed border-amber-800/30 rounded-md">
          <p className="text-sm text-amber-200/70">Nenhuma ação favorita adicionada</p>
          {editable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="mt-2 text-xs bg-amber-950/50 border-amber-800/70 hover:bg-amber-900/50 text-amber-200"
            >
              Adicionar ações
            </Button>
          )}
        </div>
      )}
    </div>
  );
}