
import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Trash, Map, Book, User, Sword, Skull, Users } from 'lucide-react';

type CreationType = 'map' | 'story' | 'character' | 'item' | 'monster' | 'npc';

type Creation = {
  id: string;
  title: string;
  type: CreationType;
  description?: string;
  imageUrl?: string;
  createdAt: string;
};

interface CreationGridProps {
  creations: Creation[];
  type: CreationType;
  onDelete?: (id: string) => void;
}

const CreationGrid = ({ creations, type, onDelete }: CreationGridProps) => {
  const getIcon = (type: CreationType) => {
    switch (type) {
      case 'map': return <Map className="text-fantasy-gold" />;
      case 'story': return <Book className="text-fantasy-gold" />;
      case 'character': return <User className="text-fantasy-gold" />;
      case 'item': return <Sword className="text-fantasy-gold" />;
      case 'monster': return <Skull className="text-fantasy-gold" />;
      case 'npc': return <Users className="text-fantasy-gold" />;
      default: return <Book className="text-fantasy-gold" />;
    }
  };

  const getViewPath = (type: CreationType, id: string) => {
    switch (type) {
      case 'map': return `/maps/${id}`;
      case 'story': return `/stories/${id}`;
      case 'character': return `/character/${id}`;
      case 'item': return `/items/view/${id}`;
      case 'monster': return `/monsters/${id}`;
      case 'npc': return `/npcs/${id}`;
      default: return `/`;
    }
  };

  const getEditPath = (type: CreationType, id: string) => {
    return `/creations/${type}s/${id}/edit`;
  };

  const getCreatePath = (type: CreationType) => {
    return `/creations/${type}s/new`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (creations.length === 0) {
    return (
      <div className="fantasy-card p-8 text-center">
        <p className="text-fantasy-stone mb-4">Nenhuma criação encontrada.</p>
        <Link to={getCreatePath(type)} className="text-fantasy-purple hover:text-fantasy-accent">
          Clique aqui para criar um novo {type === 'npc' ? 'NPC' : type}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {creations.map((creation) => (
        <div key={creation.id} className="fantasy-card p-4 flex flex-col">
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-lg bg-fantasy-dark/50 mr-3">
              {getIcon(creation.type)}
            </div>
            <div>
              <h3 className="font-medievalsharp text-white">{creation.title}</h3>
              <p className="text-xs text-fantasy-stone">Criado em {formatDate(creation.createdAt)}</p>
            </div>
          </div>
          
          {creation.description && (
            <p className="text-fantasy-stone text-sm mb-4 line-clamp-2">{creation.description}</p>
          )}
          
          <div className="flex justify-end gap-2 mt-auto">
            <Link 
              to={getViewPath(creation.type, creation.id)}
              className="p-2 bg-fantasy-dark/50 hover:bg-fantasy-dark rounded-lg text-fantasy-stone hover:text-white"
              title="Ver"
            >
              <Eye size={16} />
            </Link>
            <Link 
              to={getEditPath(creation.type, creation.id)}
              className="p-2 bg-fantasy-dark/50 hover:bg-fantasy-dark rounded-lg text-fantasy-stone hover:text-white"
              title="Editar"
            >
              <Edit size={16} />
            </Link>
            {onDelete && (
              <button 
                onClick={() => onDelete(creation.id)}
                className="p-2 bg-fantasy-dark/50 hover:bg-red-900/50 rounded-lg text-fantasy-stone hover:text-red-300"
                title="Excluir"
              >
                <Trash size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CreationGrid;
