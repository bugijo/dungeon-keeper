import React from 'react';
import { Link } from 'react-router-dom';

interface CreationCardProps {
  title: string;
  description: string;
  linkTo: string;
  imagePlaceholder: string; // Caminho para a imagem de placeholder
}

const CreationCard: React.FC<CreationCardProps> = ({ title, description, linkTo, imagePlaceholder }) => {
  return (
    <div className="bg-stone-700 border-2 border-amber-600 rounded-lg shadow-lg p-6 hover:shadow-amber-500/30 transition-all duration-300 transform hover:scale-105 flex flex-col items-center text-center">
      <img src={imagePlaceholder} alt={`${title} placeholder`} className="w-32 h-32 object-cover mb-4 rounded-md border border-amber-500" />
      <h3 className="text-2xl font-bold text-amber-300 mb-2 font-serif tracking-wider">{title}</h3>
      <p className="text-amber-100 mb-4 text-sm h-20 overflow-hidden">{description}</p>
      <Link 
        to={linkTo}
        className="mt-auto bg-amber-600 hover:bg-amber-700 text-stone-900 font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        Criar {title.split(' ')[1] || title}
      </Link>
    </div>
  );
};

const CreationsHubPage: React.FC = () => {
  const creationOptions = [
    {
      title: "Criar Personagem",
      description: "Dê vida a heróis e vilões com personalidades, habilidades e histórias únicas.",
      linkTo: "/creations/characters", // Atualizado para corresponder à rota existente
      imagePlaceholder: "/placeholders/creation-character-placeholder.png"
    },
    {
      title: "Criar Item",
      description: "Forje artefatos mágicos, armas lendárias ou poções misteriosas para suas aventuras.",
      linkTo: "/creations/items",
      imagePlaceholder: "/placeholders/creation-item-placeholder.png"
    },
    {
      title: "Criar Mapa",
      description: "Desenhe mundos vastos, masmorras perigosas ou cidades vibrantes para explorar.",
      linkTo: "/creations/maps",
      imagePlaceholder: "/placeholders/creation-map-placeholder.png"
    },
    {
      title: "Criar História",
      description: "Construa narrativas épicas, missões envolventes e segredos profundos para suas campanhas.",
      linkTo: "/creations/stories",
      imagePlaceholder: "/placeholders/creation-story-placeholder.png"
    },
    {
      title: "Criar Monstro",
      description: "Popule seus reinos com criaturas aterrorizantes, bestas astutas e desafios mortais.",
      linkTo: "/creations/monsters",
      imagePlaceholder: "/placeholders/creation-monster-placeholder.png"
    },
    {
      title: "Criar NPC",
      description: "Crie personagens não-jogadores memoráveis, com motivações e papéis cruciais na trama.",
      linkTo: "/creations/npcs",
      imagePlaceholder: "/placeholders/creation-npc-placeholder.png"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 text-amber-50 font-serif">
      <h1 className="text-4xl font-bold text-center text-amber-400 mb-10 tracking-wider">Portal de Criações</h1>
      <p className="text-center text-amber-100 mb-12 text-lg max-w-3xl mx-auto">
        Bem-vindo ao coração da Forja de Reinos! Aqui você pode moldar todos os elementos das suas aventuras de RPG. Escolha uma categoria abaixo para começar a criar e dar vida aos seus mundos.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {creationOptions.map(option => (
          <CreationCard 
            key={option.title}
            title={option.title}
            description={option.description}
            linkTo={option.linkTo}
            imagePlaceholder={option.imagePlaceholder}
          />
        ))}
      </div>
    </div>
  );
};

export default CreationsHubPage;