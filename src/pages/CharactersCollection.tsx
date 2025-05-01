
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CharacterGrid from '@/components/character/CharacterGrid';
import { Search, Plus, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  imageUrl?: string;
}

const CharactersCollection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Fetch characters from database
  useEffect(() => {
    const fetchCharacters = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Transform database data to match Character interface
        const formattedCharacters: Character[] = (data || []).map(char => ({
          id: char.id,
          name: char.name,
          race: char.race || 'Desconhecido',
          class: char.class || 'Desconhecido',
          level: char.level || 1,
          // Use a default image if none is provided
          imageUrl: '/lovable-uploads/6be414ac-e1d0-4348-8246-9fe914618c47.png'
        }));
        
        setCharacters(formattedCharacters);
      } catch (err: any) {
        console.error('Error fetching characters:', err);
        toast.error('Erro ao carregar personagens');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCharacters();
  }, [user]);
  
  // Filter characters based on search term
  const filteredCharacters = characters.filter(character => 
    character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (character.race && character.race.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (character.class && character.class.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este personagem?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCharacters(prev => prev.filter(char => char.id !== id));
      toast.success('Personagem excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting character:', error);
      toast.error('Erro ao excluir personagem');
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-medievalsharp text-fantasy-gold">Meus Personagens</h1>
            <p className="text-fantasy-stone">Gerencie todos os personagens que você criou</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fantasy-stone" size={18} />
              <input
                type="text"
                placeholder="Buscar personagens..."
                className="pl-10 pr-4 py-2 w-full bg-fantasy-dark/30 border border-fantasy-purple/20 rounded-lg text-white focus:outline-none focus:border-fantasy-purple/60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Link to="/creations/characters" className="fantasy-button primary sm:w-auto w-full">
              <Plus size={18} className="mr-2" />
              Novo Personagem
            </Link>
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="fantasy-card p-4 animate-pulse">
                <div className="h-32 w-32 bg-fantasy-purple/30 rounded-full mb-4 mx-auto"></div>
                <div className="h-6 bg-fantasy-dark/50 rounded mb-2 mx-auto w-3/4"></div>
                <div className="h-4 bg-fantasy-dark/30 rounded mb-4 mx-auto w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6">
            <CharacterGrid 
              characters={filteredCharacters} 
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CharactersCollection;
