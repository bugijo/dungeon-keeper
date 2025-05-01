
import React from 'react';

interface Stat {
  name: string;
  value: number;
  max?: number;
}

interface CharacterCardProps {
  name: string;
  level: number;
  class: string;
  race: string;
  stats: Stat[];
  imageUrl?: string;
}

export const CharacterCard = ({ 
  name, 
  level, 
  class: characterClass, 
  race, 
  stats, 
  imageUrl = "/lovable-uploads/6be414ac-e1d0-4348-8246-9fe914618c47.png"
}: CharacterCardProps) => {
  return (
    <div className="fantasy-card">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Character portrait */}
        <div className="md:w-1/3">
          <div className="h-48 w-full md:h-full rounded-lg overflow-hidden border-2 border-fantasy-purple/30 relative">
            <img 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-fantasy-dark to-transparent opacity-70"></div>
            <div className="absolute bottom-2 left-2 right-2">
              <div className="text-lg font-medievalsharp text-white">{name}</div>
              <div className="flex justify-between text-sm">
                <span>Level {level} {characterClass}</span>
                <span>{race}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Character stats */}
        <div className="md:w-2/3">
          <h3 className="text-xl font-medievalsharp mb-3">Character Stats</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div key={stat.name} className="fantasy-border p-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medievalsharp">{stat.name}</span>
                  <span className="text-sm font-medium">
                    {stat.max ? `${stat.value}/${stat.max}` : stat.value}
                  </span>
                </div>
                
                {stat.max && (
                  <div className="h-1.5 bg-fantasy-dark rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-fantasy-purple to-fantasy-accent rounded-full" 
                      style={{ width: `${(stat.value / stat.max) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button className="fantasy-button primary">Upgrade Character</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
