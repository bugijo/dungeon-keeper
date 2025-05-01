
import React from 'react';
import { useDrag } from 'react-dnd';
import { Package } from 'lucide-react';

export type InventoryItemData = {
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
};

interface DraggableInventoryItemProps {
  item: InventoryItemData;
  canDrag: boolean;
}

const DraggableInventoryItem: React.FC<DraggableInventoryItemProps> = ({ item, canDrag }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'INVENTORY_ITEM',
    item: () => ({ ...item }),
    canDrag: () => canDrag,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-200 text-gray-800';
      case 'uncommon': return 'bg-green-200 text-green-800';
      case 'rare': return 'bg-blue-200 text-blue-800';
      case 'epic': return 'bg-purple-200 text-purple-800';
      case 'legendary': return 'bg-amber-200 text-amber-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div 
      ref={dragRef}
      className={`px-3 py-2 mb-1 border rounded flex items-center justify-between ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${getRarityColor(item.rarity)} ${canDrag ? 'cursor-move' : 'cursor-not-allowed'}`}
    >
      <div className="flex items-center">
        <div className="mr-2">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded" />
          ) : (
            <Package size={20} />
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium">{item.name}</h3>
          <div className="flex text-xs space-x-2">
            <span>Qtd: {item.quantity}</span>
            <span>• Peso: {item.weight}</span>
          </div>
        </div>
      </div>
      {item.equipped && (
        <span className="text-xs bg-gray-700 text-white px-1 rounded">Equipado</span>
      )}
    </div>
  );
};

export default DraggableInventoryItem;
