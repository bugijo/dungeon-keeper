
import React from 'react';
import { useDrop } from 'react-dnd';
import { InventoryItemData } from './DraggableInventoryItem';

interface InventoryDropZoneProps {
  characterId: string;
  onItemDrop: (item: InventoryItemData, targetCharacterId: string) => void;
  children: React.ReactNode;
}

const InventoryDropZone: React.FC<InventoryDropZoneProps> = ({ characterId, onItemDrop, children }) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: 'INVENTORY_ITEM',
    drop: (droppedItem: InventoryItemData) => {
      onItemDrop(droppedItem, characterId);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div 
      ref={dropRef}
      className={`inventory-drop-zone ${isOver ? 'bg-fantasy-purple/20' : ''} transition-colors duration-200`}
    >
      {children}
    </div>
  );
};

export default InventoryDropZone;
