
import { motion } from "framer-motion";
import { TrophyIcon } from "lucide-react";
import { Link } from "react-router-dom";

const featuredQuests = [
  {
    title: "Participar de 1 Mesa",
    progress: 0,
    max: 1,
    rewards: { xp: 200, gems: 50 },
    type: "Iniciante",
    description: "Junte-se a sua primeira mesa de RPG!"
  },
  {
    title: "Criar um Personagem",
    progress: 0,
    max: 1,
    rewards: { xp: 100, gems: 20 },
    type: "Criativo",
    description: "Crie seu primeiro herói!"
  }
];

export const QuestsSection = () => {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medievalsharp text-white">Missões em Destaque</h2>
        <Link to="/missions" className="text-fantasy-purple hover:text-fantasy-purple/80 text-sm">
          Ver todas
        </Link>
      </div>
      
      <div className="grid gap-4">
        {featuredQuests.map((quest, index) => (
          <motion.div
            key={quest.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              transition: { delay: index * 0.2 }
            }}
            className="fantasy-card p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medievalsharp text-white">{quest.title}</h3>
              <span className="bg-fantasy-purple text-white text-xs px-3 py-1 rounded-full">
                {quest.type}
              </span>
            </div>
            
            <p className="text-sm text-fantasy-stone mb-3">{quest.description}</p>
            
            <div className="mb-2">
              <div className="w-full bg-fantasy-dark/70 h-3 rounded-full">
                <div 
                  className="bg-gradient-to-r from-fantasy-purple to-fantasy-accent h-full rounded-full"
                  style={{ width: `${(quest.progress / quest.max) * 100}%` }}
                />
              </div>
              <div className="text-center text-fantasy-gold/80 mt-1 text-sm">
                {quest.progress}/{quest.max}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-fantasy-stone">
              <TrophyIcon className="w-4 h-4 text-fantasy-gold" />
              <span>{quest.rewards.xp} XP</span>
              <span className="text-fantasy-gold">•</span>
              <span>{quest.rewards.gems} 💎</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
