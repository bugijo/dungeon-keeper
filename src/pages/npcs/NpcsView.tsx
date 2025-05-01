
import React, { useState, useEffect } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { Search, Filter, Users, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface Npc {
  id: string;
  name: string;
  race: string;
  occupation: string | null;
  location: string | null;
  alignment: string | null;
  description?: string;
  traits?: string[];
}

const NpcsView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchNpcs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchNpcs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("Fetching NPCs for user:", user.id);
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      console.log("NPCs fetched:", data);
      setNpcs(data || []);
    } catch (error: any) {
      console.error('Error fetching NPCs:', error);
      toast.error('Erro ao carregar NPCs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este NPC?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('npcs')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNpcs(npcs.filter(npc => npc.id !== id));
      toast.success('NPC excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting NPC:', error);
      toast.error('Erro ao excluir NPC');
    }
  };

  // Filter NPCs based on search and filter settings
  const filteredNpcs = npcs.filter(npc => {
    if (searchTerm && !npc.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filter !== "all" && npc.location && !npc.location.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  return (
    <MainLayout>
      <div className="container mx-auto pb-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medievalsharp text-white">Seus NPCs</h1>
          
          <Link to="/creations/npcs">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="fantasy-button primary flex items-center gap-2"
            >
              <Plus size={18} />
              Criar Novo NPC
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
              placeholder="Buscar NPCs..."
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
                <option value="all">Todas as localizações</option>
                <option value="cidade">Cidade da Coroa</option>
                <option value="floresta">Floresta de Silverleaf</option>
                <option value="mercado">Mercado da Cidade</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* NPCs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="fantasy-card p-4 animate-pulse">
                <div className="h-12 w-12 bg-fantasy-purple/30 rounded-full mb-4"></div>
                <div className="h-6 bg-fantasy-dark/50 rounded mb-2"></div>
                <div className="h-4 bg-fantasy-dark/30 rounded mb-4"></div>
                <div className="h-10 bg-fantasy-dark/20 rounded"></div>
              </div>
            ))
          ) : filteredNpcs.length > 0 ? (
            filteredNpcs.map((npc) => (
              <div key={npc.id} className="fantasy-card p-4 overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medievalsharp text-white">{npc.name}</h3>
                  <div className="p-1 rounded-full bg-fantasy-purple/20">
                    <Users size={16} className="text-fantasy-gold" />
                  </div>
                </div>
                
                <div className="text-sm text-fantasy-stone mb-2">
                  <span className="font-medium">{npc.race} • {npc.occupation || 'Sem ocupação'}</span>
                </div>
                
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-fantasy-stone">Localização:</span>
                    <span className="text-white">{npc.location || 'Não especificada'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-fantasy-stone">Alinhamento:</span>
                    <span className="text-white">{npc.alignment || 'Não especificado'}</span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/npcs/view/${npc.id}`)}
                    className="p-2 bg-fantasy-purple/20 rounded-lg hover:bg-fantasy-purple/30 transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye size={16} className="text-fantasy-purple" />
                  </button>
                  
                  <button
                    onClick={() => navigate(`/creations/npcs/${npc.id}`)}
                    className="p-2 bg-fantasy-purple/20 rounded-lg hover:bg-fantasy-purple/30 transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} className="text-fantasy-purple" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(npc.id)}
                    className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full fantasy-card p-8 text-center">
              <Users className="mx-auto text-fantasy-purple/40 mb-4" size={48} />
              <h3 className="text-xl font-medievalsharp text-fantasy-purple mb-2">Nenhum NPC encontrado</h3>
              <p className="text-fantasy-stone mb-4">
                Não encontramos NPCs com os filtros atuais. Tente mudar os critérios de busca ou crie um novo NPC.
              </p>
              <Link to="/creations/npcs">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="fantasy-button primary mx-auto"
                >
                  Criar Novo NPC
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default NpcsView;
