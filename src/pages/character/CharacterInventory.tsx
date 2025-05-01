
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import CharacterGrid from '@/components/character/CharacterGrid';

const CharacterInventory = () => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchCharacters = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCharacters(data || []);
      } catch (error) {
        console.error('Error fetching characters:', error);
        toast.error('Erro ao carregar personagens');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [user]);

  const handleDeleteCharacter = async (id) => {
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCharacters((prev) => prev.filter(character => character.id !== id));
      toast.success('Personagem excluído com sucesso');
    } catch (error) {
      console.error('Error deleting character:', error);
      toast.error('Erro ao excluir personagem');
    }
  };

  const filteredCharacters = characters.filter(character => 
    character.name?.toLowerCase().includes(search.toLowerCase()) ||
    character.class?.toLowerCase().includes(search.toLowerCase()) ||
    character.race?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="container mx-auto pb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-medievalsharp text-white mb-1">Seus Personagens</h1>
            <p className="text-fantasy-stone">Gerencie todos os personagens que você criou</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fantasy-stone" size={18} />
              <input
                type="text"
                placeholder="Buscar personagens..."
                className="pl-10 pr-4 py-2 w-full bg-fantasy-dark/30 border border-fantasy-purple/20 rounded-lg text-white focus:outline-none focus:border-fantasy-purple/60"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Link 
              to="/creations/characters"
              className="fantasy-button primary flex items-center gap-2 justify-center px-4 whitespace-nowrap"
            >
              <Plus size={16} />
              Criar Personagem
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="fantasy-card p-4 h-64" />
            ))}
          </div>
        ) : (
          <CharacterGrid characters={filteredCharacters} onDelete={handleDeleteCharacter} />
        )}
      </div>
    </MainLayout>
  );
};

export default CharacterInventory;
