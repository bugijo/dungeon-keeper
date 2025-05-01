
import { Link } from "react-router-dom";
import { User, Sword, MapPin, BookOpen, Skull, Users } from "lucide-react";

const creationCards = [
  {
    title: "Criar Personagem",
    description: "Crie heróis e personagens para suas aventuras",
    icon: User,
    path: "/creations/characters",
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80",
    category: "Personagens"
  },
  {
    title: "Criar Item",
    description: "Forje armas mágicas e itens lendários",
    icon: Sword,
    path: "/creations/items",
    imageUrl: "https://images.unsplash.com/photo-1599753894977-bc6c46401f15?auto=format&fit=crop&q=80",
    category: "Itens & Armas"
  },
  {
    title: "Criar Mapa",
    description: "Desenhe mapas de reinos e calabouços",
    icon: MapPin,
    path: "/creations/maps",
    imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80",
    category: "Mapas"
  },
  {
    title: "Criar História",
    description: "Escreva aventuras épicas e contos mágicos",
    icon: BookOpen,
    path: "/creations/stories",
    imageUrl: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&q=80",
    category: "Histórias"
  },
  {
    title: "Criar Monstro",
    description: "Crie criaturas terríveis para desafiar heróis",
    icon: Skull,
    path: "/creations/monsters",
    imageUrl: "https://images.unsplash.com/photo-1577493340887-b7bfff550145?auto=format&fit=crop&q=80",
    category: "Monstros"
  },
  {
    title: "Criar NPC",
    description: "Desenvolva personagens não jogáveis memoráveis",
    icon: Users,
    path: "/creations/npcs",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80",
    category: "NPCs"
  }
];

export const CreationSection = () => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-medievalsharp text-white mb-4">Criações</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {creationCards.map((card) => (
          <div key={card.title} className="fantasy-card overflow-hidden bg-fantasy-dark/60 border border-fantasy-purple/30">
            <div className="h-48 w-full overflow-hidden">
              <img 
                src={card.imageUrl} 
                alt={card.title}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
              />
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-fantasy-purple/20">
                  <card.icon className="w-6 h-6 text-fantasy-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-medievalsharp text-white">{card.title}</h3>
                  <p className="text-sm text-fantasy-stone">{card.category}</p>
                </div>
              </div>
              
              <p className="text-fantasy-stone mb-6">{card.description}</p>
              
              <Link 
                to={card.path}
                className="block w-full text-center py-3 px-4 bg-fantasy-purple hover:bg-fantasy-purple/80 
                         text-white rounded-lg font-medievalsharp transition-colors"
              >
                {card.title}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
