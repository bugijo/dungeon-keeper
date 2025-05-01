
import React from 'react';
import { useDrag } from 'react-dnd';
import { Package } from 'lucide-react';
import ImageLoader from '@/components/ImageLoader';

export type InventoryItemProps = {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  weight: number;
  value?: number;
  type: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  equipped?: boolean;
  imageUrl?: string;
  character_id: string;
  canDrag?: boolean;
  onToggleEquipped?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
};

const InventoryItem: React.FC<InventoryItemProps> = ({ 
  id, 
  name, 
  description, 
  quantity, 
  weight, 
  value, 
  type, 
  rarity, 
  equipped = false, 
  imageUrl,
  character_id,
  canDrag = true,
  onToggleEquipped,
  onRemove,
  onEdit
}) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'INVENTORY_ITEM',
    item: () => ({ 
      id, 
      name,
      description,
      quantity,
      weight,
      value,
      type,
      rarity,
      equipped,
      imageUrl,
      character_id
    }),
    canDrag: () => canDrag,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400/30 bg-gray-700/30';
      case 'uncommon': return 'border-green-400/30 bg-green-900/30';
      case 'rare': return 'border-blue-400/30 bg-blue-900/30';
      case 'epic': return 'border-purple-400/30 bg-purple-900/30';
      case 'legendary': return 'border-amber-400/30 bg-amber-900/30';
      default: return 'border-gray-400/30 bg-gray-700/30';
    }
  };
  
  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-200';
      case 'uncommon': return 'text-green-300';
      case 'rare': return 'text-blue-300';
      case 'epic': return 'text-purple-300';
      case 'legendary': return 'text-amber-300';
      default: return 'text-gray-200';
    }
  };

  return (
    <div 
      ref={dragRef}
      className={`px-4 py-3 mb-2 border rounded fantasy-card ${
        getRarityColor(rarity)} ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${canDrag ? 'cursor-move' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 rounded border ${getRarityColor(rarity)} flex items-center justify-center overflow-hidden`}>
          {imageUrl ? (
            <ImageLoader 
              src={imageUrl} 
              alt={name} 
              width={48}
              height={48}
              fallbackText={name}
            />
          ) : (
            <Package size={20} className="text-gray-400" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className={`font-medievalsharp ${getRarityTextColor(rarity)}`}>{name}</h3>
            {equipped && (
              <span className="text-xs bg-fantasy-purple/20 text-fantasy-purple rounded-full px-2 py-0.5">
                Equipado
              </span>
            )}
          </div>
          
          <div className="flex text-xs space-x-2 text-fantasy-stone">
            <span>Qtd: {quantity}</span>
            <span>• Peso: {weight}</span>
            {value !== undefined && <span>• Valor: {value}</span>}
          </div>
          
          {description && (
            <p className="text-xs mt-1 text-fantasy-stone line-clamp-2">{description}</p>
          )}
        </div>
      </div>
      
      {(onToggleEquipped || onRemove || onEdit) && (
        <div className="mt-2 pt-2 border-t border-fantasy-purple/20 flex justify-end gap-2">
          {onToggleEquipped && (
            <button 
              onClick={onToggleEquipped}
              className={`fantasy-button text-xs py-1 ${equipped ? 'secondary' : 'primary'}`}>
              {equipped ? 'Desequipar' : 'Equipar'}
            </button>
          )}
          
          {onEdit && (
            <button 
              onClick={onEdit}
              className="fantasy-button text-xs py-1 secondary">
              Editar
            </button>
          )}
          
          {onRemove && (
            <button 
              onClick={onRemove}
              className="fantasy-button text-xs py-1 danger">
              Remover
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryItem;
