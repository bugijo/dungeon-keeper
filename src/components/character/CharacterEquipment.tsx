
import React from 'react';

interface EquipmentItem {
  name: string;
  type: string;
  damage?: string;
  ac?: string;
  properties?: string;
}

interface CharacterEquipmentProps {
  equipment: EquipmentItem[];
}

const CharacterEquipment = ({ equipment }: CharacterEquipmentProps) => {
  return (
    <div className="fantasy-card p-6">
      <h3 className="text-xl font-medievalsharp text-white mb-4">Equipamentos</h3>
      
      <div className="space-y-3">
        {equipment.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-fantasy-dark/30">
            <div>
              <span className="text-white font-medievalsharp">{item.name}</span>
              <div className="text-xs text-fantasy-stone">
                {item.type === 'weapon' && `Dano: ${item.damage}`}
                {item.type === 'armor' && `CA: ${item.ac}`}
                {item.type === 'shield' && `CA: ${item.ac}`}
                {item.properties && ` | ${item.properties}`}
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-fantasy-purple/30 text-fantasy-purple">
              {item.type === 'weapon' ? 'Arma' : 
               item.type === 'armor' ? 'Armadura' : 
               item.type === 'shield' ? 'Escudo' : 'Item'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterEquipment;
