
import React, { useState, useEffect } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { Search, Filter, Map, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface Map {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

const MapsView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [maps, setMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchMaps();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMaps = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maps')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setMaps(data || []);
    } catch (error: any) {
      console.error('Error fetching maps:', error);
      toast.error('Erro ao carregar mapas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este mapa?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('maps')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setMaps(maps.filter(map => map.id !== id));
      toast.success('Mapa excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting map:', error);
      toast.error('Erro ao excluir mapa');
    }
  };

  const filteredMaps = maps.filter(map => {
    if (searchTerm && !map.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !map.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  return (
    <MainLayout>
      <div className="container mx-auto pb-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medievalsharp text-white">Seus Mapas</h1>
          
          <Link to="/creations/maps">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="fantasy-button primary flex items-center gap-2"
            >
              <Plus size={18} />
              Criar Novo Mapa
            </motion.button>
          </Link>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="text-muted-foreground" size={16} />
            </div>
            <input 
              type="text" 
              className="bg-fantasy-dark border border-fantasy-purple/30 text-white text-sm rounded-lg block w-full pl-10 p-2.5 focus:ring-fantasy-purple focus:border-fantasy-purple"
              placeholder="Buscar mapas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-fantasy-dark border border-fantasy-purple/30 rounded-lg p-2">
              <Filter className="text-muted-foreground" size={16} />
              <select 
                className="bg-transparent border-none text-sm focus:ring-0 text-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Todos os tipos</option>
                <option value="city">Cidades</option>
                <option value="dungeon">Masmorras</option>
                <option value="wilderness">Regiões Selvagens</option>
                <option value="world">Mapas de Mundo</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Maps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="fantasy-card p-4 animate-pulse">
                <div className="h-48 bg-fantasy-purple/30 rounded mb-4"></div>
                <div className="h-6 bg-fantasy-dark/50 rounded mb-2"></div>
                <div className="h-4 bg-fantasy-dark/30 rounded mb-4"></div>
                <div className="h-10 bg-fantasy-dark/20 rounded"></div>
              </div>
            ))
          ) : filteredMaps.length > 0 ? (
            filteredMaps.map((map) => (
              <div key={map.id} className="fantasy-card p-0 overflow-hidden">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={map.image_url || '/placeholder.svg'} 
                    alt={map.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-fantasy-dark to-transparent opacity-80"></div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medievalsharp text-white">{map.name}</h3>
                    <div className="p-1 rounded-full bg-fantasy-purple/20">
                      <Map size={16} className="text-fantasy-gold" />
                    </div>
                  </div>
                  
                  <p className="text-fantasy-stone text-sm mt-2 line-clamp-2">{map.description}</p>
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/maps/view/${map.id}`)}
                      className="p-2 bg-fantasy-purple/20 rounded-lg hover:bg-fantasy-purple/30 transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye size={16} className="text-fantasy-purple" />
                    </button>
                    
                    <button
                      onClick={() => navigate(`/creations/maps/${map.id}`)}
                      className="p-2 bg-fantasy-purple/20 rounded-lg hover:bg-fantasy-purple/30 transition-colors"
                      title="Editar"
                    >
                      <Edit size={16} className="text-fantasy-purple" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(map.id)}
                      className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full fantasy-card p-8 text-center">
              <Map className="mx-auto text-fantasy-purple/40 mb-4" size={48} />
              <h3 className="text-xl font-medievalsharp text-fantasy-purple mb-2">Nenhum mapa encontrado</h3>
              <p className="text-fantasy-stone mb-4">
                Não encontramos mapas com os filtros atuais. Tente mudar os critérios de busca ou crie um novo mapa.
              </p>
              <Link to="/creations/maps">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="fantasy-button primary mx-auto"
                >
                  Criar Novo Mapa
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MapsView;
