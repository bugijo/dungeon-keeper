
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CreationGrid from '@/components/creations/CreationGrid';
import { Search, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

type CreationType = 'map' | 'story' | 'character' | 'item' | 'monster' | 'npc';

const getPageTitle = (type: CreationType) => {
  const titles = {
    map: 'Mapas',
    story: 'Histórias',
    character: 'Personagens',
    item: 'Itens & Armas',
    monster: 'Monstros',
    npc: 'NPCs'
  };
  return titles[type] || 'Coleção';
};

const getCreationType = (path: string): CreationType => {
  if (path.includes('maps')) return 'map';
  if (path.includes('stories')) return 'story';
  if (path.includes('characters')) return 'character';
  if (path.includes('items')) return 'item';
  if (path.includes('monsters')) return 'monster';
  if (path.includes('npcs')) return 'npc';
  return 'character';
};

const CreationsCollection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const type = getCreationType(location.pathname);
  
  // Determine correct path for the "New" button
  const getCreationPath = (type: CreationType) => {
    return `/creations/${type}s/new`;
  };
  
  // Mock data - replace with API call
  const mockCreations = [
    {
      id: '1',
      title: 'Sample ' + type,
      type: type,
      description: 'This is a sample ' + type,
      createdAt: new Date().toISOString()
    }
  ];
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-medievalsharp text-fantasy-gold">{getPageTitle(type)}</h1>
            <p className="text-fantasy-stone">Gerencie todas as suas criações</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fantasy-stone" size={18} />
              <input
                type="text"
                placeholder={`Buscar ${getPageTitle(type).toLowerCase()}...`}
                className="pl-10 pr-4 py-2 w-full bg-fantasy-dark/30 border border-fantasy-purple/20 rounded-lg text-white focus:outline-none focus:border-fantasy-purple/60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Link to={getCreationPath(type)} className="fantasy-button primary sm:w-auto w-full">
              <Plus size={18} className="mr-2" />
              Novo {type === 'npc' ? 'NPC' : getPageTitle(type).slice(0, -1)}
            </Link>
          </div>
        </div>
        
        <CreationGrid 
          creations={mockCreations} 
          type={type}
          onDelete={(id) => console.log('Delete', id)}
        />
      </div>
    </MainLayout>
  );
};

export default CreationsCollection;
