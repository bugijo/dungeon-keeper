
import { CrownIcon } from "lucide-react";

type Stat = {
  name: string;
  value: number;
  max?: number;
};

type PlayerStatsProps = {
  character: {
    name: string;
    race: string;
    class: string;
    level: number;
    stats: Stat[];
  };
};

export const PlayerStats = ({ character }: PlayerStatsProps) => {
  return (
    <div className="fantasy-card p-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-medievalsharp text-fantasy-gold">{character.name}</h2>
            <p className="text-sm text-fantasy-stone">{character.race} • {character.class} • Nível {character.level}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="h-5 w-5 flex items-center justify-center bg-fantasy-purple/20 rounded-full border border-fantasy-purple/50">
                <CrownIcon size={12} className="text-fantasy-gold" />
              </span>
              <span className="text-sm font-medium">Level {character.level}</span>
            </div>
            <div className="h-6 w-[200px] xp-bar">
              <div className="xp-progress" style={{ width: '60%' }}></div>
            </div>
            <span className="text-xs text-muted-foreground">300/500 XP</span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Recursos (vida, mana, etc.) */}
          <div className="fantasy-border p-3">
            <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Recursos</h3>
            <div className="space-y-3">
              {character.stats.filter(stat => stat.max).map((stat, index) => (
                <div key={index}>
                  <div className="flex justify-between">
                    <span className="text-sm">{stat.name}</span>
                    <span className="text-sm font-medium">{stat.value}/{stat.max}</span>
                  </div>
                  <div className="h-2 bg-fantasy-dark/70 rounded-full mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-fantasy-purple to-fantasy-accent rounded-full" 
                      style={{ width: `${(stat.value / (stat.max || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Atributos principais */}
          <div className="fantasy-border p-3">
            <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Atributos Físicos</h3>
            <div className="grid grid-cols-3 gap-2">
              {character.stats.filter(stat => ['Força', 'Destreza', 'Constituição'].includes(stat.name)).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full border-2 border-fantasy-purple/50 bg-fantasy-dark/30 flex items-center justify-center">
                    <span className="text-xl font-medievalsharp text-fantasy-gold">{stat.value}</span>
                  </div>
                  <div className="mt-1 text-xs text-fantasy-stone">
                    {stat.name}
                    <div className="text-xxs">
                      {Math.floor((stat.value - 10) / 2) >= 0 ? '+' : ''}
                      {Math.floor((stat.value - 10) / 2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Atributos mentais */}
          <div className="fantasy-border p-3">
            <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Atributos Mentais</h3>
            <div className="grid grid-cols-3 gap-2">
              {character.stats.filter(stat => ['Inteligência', 'Sabedoria', 'Carisma'].includes(stat.name)).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full border-2 border-fantasy-purple/50 bg-fantasy-dark/30 flex items-center justify-center">
                    <span className="text-xl font-medievalsharp text-fantasy-gold">{stat.value}</span>
                  </div>
                  <div className="mt-1 text-xs text-fantasy-stone">
                    {stat.name}
                    <div className="text-xxs">
                      {Math.floor((stat.value - 10) / 2) >= 0 ? '+' : ''}
                      {Math.floor((stat.value - 10) / 2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
