
interface InventoryItemProps {
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: string;
  stats?: {
    [key: string]: number;
  };
  imageUrl?: string;
  equipped?: boolean;
}

const InventoryItem = ({ 
  name, 
  description, 
  rarity, 
  type, 
  stats, 
  imageUrl,
  equipped = false
}: InventoryItemProps) => {
  
  const rarityClasses = {
    common: 'rarity-common border-gray-400/30 bg-gray-700/30',
    rare: 'rarity-rare border-fantasy-rare/30 bg-blue-900/30',
    epic: 'rarity-epic border-fantasy-gem/30 bg-purple-900/30',
    legendary: 'rarity-legendary border-fantasy-legendary/30 bg-amber-900/30'
  };
  
  return (
    <div className={`fantasy-card ${rarityClasses[rarity]}`}>
      <div className="flex gap-3">
        {/* Item image */}
        <div className={`h-16 w-16 rounded border-2 ${rarityClasses[rarity]} flex items-center justify-center overflow-hidden`}>
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-contain" />
          ) : (
            <div className="text-xl font-medievalsharp">?</div>
          )}
        </div>
        
        {/* Item details */}
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className={`font-medievalsharp ${rarity === 'legendary' ? 'text-fantasy-legendary' : ''}`}>{name}</h3>
            {equipped && (
              <span className="text-xs bg-fantasy-purple/20 text-fantasy-purple rounded-full px-2 py-0.5">
                Equipped
              </span>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">{type}</div>
          <p className="text-xs mt-1 text-muted-foreground">{description}</p>
          
          {/* Stats if available */}
          {stats && (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(stats).map(([stat, value]) => (
                <div key={stat} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize">{stat}</span>
                  <span className={`text-xs ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {value > 0 ? '+' : ''}{value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-fantasy-purple/20 flex justify-end gap-2">
        {equipped ? (
          <button className="fantasy-button text-xs py-1 bg-gray-700 hover:bg-gray-600">Unequip</button>
        ) : (
          <button className="fantasy-button text-xs py-1 primary">Equip</button>
        )}
        <button className="fantasy-button text-xs py-1 secondary">Details</button>
      </div>
    </div>
  );
};

export default InventoryItem;
