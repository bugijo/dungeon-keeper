
import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Trash } from 'lucide-react';

type Character = {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  imageUrl?: string;
};

interface CharacterGridProps {
  characters: Character[];
  onDelete?: (id: string) => void;
}

const CharacterGrid = ({ characters, onDelete }: CharacterGridProps) => {
  if (characters.length === 0) {
    return (
      <div className="text-center py-12 fantasy-card">
        <h3 className="text-xl font-medievalsharp text-fantasy-gold">Nenhum personagem encontrado</h3>
        <p className="text-fantasy-stone mt-2">Crie seu primeiro personagem para começar sua jornada!</p>
        <Link to="/creations/characters" className="fantasy-button primary mt-4 inline-block">
          Criar Personagem
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {characters.map((character) => (
        <div key={character.id} className="fantasy-card p-4 relative group">
          <div className="h-32 w-32 mx-auto rounded-full overflow-hidden border-4 border-fantasy-purple/30 mb-3">
            <img 
              src={character.imageUrl || "/lovable-uploads/6be414ac-e1d0-4348-8246-9fe914618c47.png"} 
              alt={character.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <h3 className="text-lg font-medievalsharp text-center text-white mb-1">{character.name}</h3>
          <p className="text-center text-fantasy-stone">
            Nível {character.level} {character.race} {character.class}
          </p>
          
          <div className="absolute inset-0 bg-fantasy-dark/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-opacity duration-200 rounded-lg">
            <Link to={`/character/view/${character.id}`} className="fantasy-button primary p-2">
              <Eye size={20} />
            </Link>
            <Link to={`/creations/characters/${character.id}`} className="fantasy-button secondary p-2">
              <Edit size={20} />
            </Link>
            {onDelete && (
              <button 
                onClick={() => onDelete(character.id)} 
                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-2 rounded-lg transition-colors"
              >
                <Trash size={20} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CharacterGrid;
