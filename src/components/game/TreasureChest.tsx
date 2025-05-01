
interface TreasureChestProps {
  type: 'common' | 'rare' | 'epic' | 'legendary';
  contents: string;
  cost?: {
    type: 'gold' | 'gems';
    amount: number;
  };
  imageUrl?: string;
  unlockTime?: string;
}

const TreasureChest = ({ type, contents, cost, imageUrl, unlockTime }: TreasureChestProps) => {
  const typeClasses = {
    common: 'bg-gray-700/50 border-gray-500/50 text-gray-200',
    rare: 'bg-blue-900/50 border-blue-500/50 text-blue-300',
    epic: 'bg-purple-900/50 border-purple-500/50 text-purple-300',
    legendary: 'bg-amber-900/50 border-amber-500/50 text-amber-300'
  };
  
  const bgGradients = {
    common: 'from-gray-800/80 to-gray-900/80',
    rare: 'from-blue-900/80 to-blue-950/80',
    epic: 'from-purple-900/80 to-purple-950/80',
    legendary: 'from-amber-800/80 to-amber-950/80'
  };
  
  const capType = type.charAt(0).toUpperCase() + type.slice(1);
  
  return (
    <div className={`fantasy-card border-2 ${typeClasses[type]}`}>
      <div className={`absolute inset-0 bg-gradient-to-b ${bgGradients[type]} pointer-events-none`}></div>
      
      <div className="relative z-10">
        {/* Chest image */}
        <div className="flex justify-center mb-3">
          <div className="h-24 w-24 relative animate-pulse-glow">
            <img 
              src={imageUrl || "/lovable-uploads/eff6f3ed-69ac-47c8-ada2-50d0852653dc.png"} 
              alt={`${type} chest`}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        
        {/* Chest info */}
        <div className="text-center mb-3">
          <h3 className="font-medievalsharp text-lg">{capType} Chest</h3>
          <p className="text-sm text-muted-foreground">Contains: {contents}</p>
          
          {unlockTime && (
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">Unlocks in: </span>
              <span>{unlockTime}</span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-center">
          {cost ? (
            <button className="fantasy-button secondary flex items-center gap-2">
              <span>Open for</span>
              <div className="flex items-center gap-1">
                <img 
                  src={cost.type === 'gold' 
                    ? "/lovable-uploads/f6994451-b92c-48d9-be93-feaaf85bff8a.png" 
                    : "/lovable-uploads/c0ce5755-bcb5-423a-baec-11074d96c6cd.png"} 
                  alt={cost.type} 
                  className="h-4 w-4" 
                />
                <span>{cost.amount}</span>
              </div>
            </button>
          ) : (
            <button className="fantasy-button primary">Open Now</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreasureChest;
