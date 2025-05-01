
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Scroll, BookOpen, Dice1 } from "lucide-react";

const quickActions = [
  {
    title: "Encontrar Mesa",
    icon: Users,
    path: "/tables",
    description: "Encontre uma mesa para jogar"
  },
  {
    title: "Criar Personagem",
    icon: Scroll,
    path: "/character",
    description: "Crie seu próprio herói"
  },
  {
    title: "Tutorial",
    icon: BookOpen,
    path: "/tutorial",
    description: "Aprenda a jogar"
  },
  {
    title: "Rolar Dados",
    icon: Dice1,
    path: "/dice",
    description: "Teste sua sorte"
  }
];

export const QuickActions = () => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-medievalsharp text-white mb-4">Ações Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link 
            key={action.title} 
            to={action.path}
            className="fantasy-card p-4 hover:bg-fantasy-purple/10 transition-colors"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: index * 0.1 }
              }}
              className="flex flex-col items-center text-center"
            >
              <action.icon className="w-8 h-8 text-fantasy-gold mb-2" />
              <h3 className="font-medievalsharp text-white mb-1">{action.title}</h3>
              <p className="text-xs text-fantasy-stone">{action.description}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
};
