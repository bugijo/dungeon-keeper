
interface QuestCardProps {
  title: string;
  description: string;
  difficulty: number;
  rewards: {
    xp: number;
    gold: number;
    items?: string[];
  };
  progress?: number;
  imageUrl?: string;
}

const QuestCard = ({ title, description, difficulty, rewards, progress = 0, imageUrl }: QuestCardProps) => {
  return (
    <div className="fantasy-card">
      <div className="relative">
        {/* Card header with image */}
        <div className="h-32 overflow-hidden rounded-md mb-3">
          <img 
            src={imageUrl || "https://images.unsplash.com/photo-1469474968028-56623f02e42e"} 
            alt={title}
            className="w-full h-full object-cover transition-transform hover:scale-110 duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-fantasy-dark to-transparent opacity-80"></div>
          
          {/* Difficulty stars */}
          <div className="absolute bottom-2 left-2 flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < difficulty ? 'text-fantasy-gold' : 'text-gray-600'}`}>★</span>
            ))}
          </div>
        </div>
        
        {/* Card content */}
        <h3 className="text-lg font-medievalsharp text-white mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        
        {/* Progress bar if applicable */}
        {progress > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-fantasy-dark rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-fantasy-purple to-fantasy-accent rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Rewards section */}
        <div className="mt-3 pt-3 border-t border-fantasy-purple/20">
          <div className="text-xs text-muted-foreground mb-2">Rewards</div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <img src="/lovable-uploads/f6994451-b92c-48d9-be93-feaaf85bff8a.png" alt="Gold" className="h-4 w-4" />
              <span className="text-sm text-fantasy-gold">{rewards.gold}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-fantasy-purple">XP</span>
              <span className="text-sm text-white">{rewards.xp}</span>
            </div>
            {rewards.items && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-fantasy-purple">+</span>
                <span className="text-sm text-fantasy-rare">{rewards.items.length} item{rewards.items.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Card actions */}
      <div className="mt-4 flex justify-end">
        <button className="fantasy-button primary text-sm">Start Quest</button>
      </div>
    </div>
  );
};

export default QuestCard;
