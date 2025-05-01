
import React from 'react';
import { Dices } from "lucide-react";
import { motion } from "framer-motion";

interface Stat {
  name: string;
  value: number;
}

interface CharacterStatsProps {
  stats: Record<string, number>;
  abilities: {
    hp: { current: number; max: number };
    ac: number;
    speed: number;
    initiative: number;
    proficiencyBonus: number;
  };
}

const CharacterStats = ({ stats, abilities }: CharacterStatsProps) => {
  return (
    <div className="fantasy-card p-6">
      <h3 className="text-xl font-medievalsharp text-white mb-4">Atributos & Combate</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {Object.entries(stats).map(([stat, value]) => (
          <div key={stat} className="bg-fantasy-dark/30 p-3 rounded-lg text-center">
            <div className="text-xs text-fantasy-stone uppercase mb-1">{stat}</div>
            <div className="text-2xl font-medievalsharp text-white">{value}</div>
            <div className="text-sm text-fantasy-gold mt-1">
              {Math.floor((value - 10) / 2) >= 0 ? '+' : ''}{Math.floor((value - 10) / 2)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-red-900/40 to-red-600/20 p-3 rounded-lg text-center">
          <div className="text-xs text-fantasy-stone uppercase mb-1">Pontos de Vida</div>
          <div className="text-xl font-medievalsharp text-white">
            {abilities.hp.current}/{abilities.hp.max}
          </div>
        </div>
        <div className="bg-fantasy-dark/30 p-3 rounded-lg text-center">
          <div className="text-xs text-fantasy-stone uppercase mb-1">Classe de Armadura</div>
          <div className="text-xl font-medievalsharp text-white">{abilities.ac}</div>
        </div>
        <div className="bg-fantasy-dark/30 p-3 rounded-lg text-center">
          <div className="text-xs text-fantasy-stone uppercase mb-1">Iniciativa</div>
          <div className="text-xl font-medievalsharp text-white">
            {abilities.initiative >= 0 ? '+' : ''}{abilities.initiative}
          </div>
        </div>
        <div className="bg-fantasy-dark/30 p-3 rounded-lg text-center">
          <div className="text-xs text-fantasy-stone uppercase mb-1">Deslocamento</div>
          <div className="text-xl font-medievalsharp text-white">{abilities.speed}ft</div>
        </div>
        <div className="bg-fantasy-dark/30 p-3 rounded-lg text-center">
          <div className="text-xs text-fantasy-stone uppercase mb-1">Bônus de Prof.</div>
          <div className="text-xl font-medievalsharp text-white">
            +{abilities.proficiencyBonus}
          </div>
        </div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-4 flex items-center justify-center gap-2 bg-fantasy-gold/20 hover:bg-fantasy-gold/30 text-fantasy-gold px-4 py-2 rounded-lg font-medievalsharp w-full"
      >
        <Dices size={16} />
        Rolar Dados
      </motion.button>
    </div>
  );
};

export default CharacterStats;
