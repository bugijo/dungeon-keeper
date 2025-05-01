
import React, { useState, useEffect } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { Search, Filter, Sword, Shield, Eye, Edit, Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface Monster {
  id: string;
  user_id: string;
  name: string;
  type: string;
  challenge: number;
  size: string;
  alignment: string;
  hp: number;
  ac: number;
  created_at: string;
  updated_at: string;
}

const MonstersView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchMonsters();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMonsters = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('monsters')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setMonsters(data || []);
    } catch (error: any) {
      console.error('Error fetching monsters:', error);
      toast.error('Erro ao carregar monstros');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este monstro?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('monsters')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setMonsters(monsters.filter(monster => monster.id !== id));
      toast.success('Monstro excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting monster:', error);
      toast.error('Erro ao excluir monstro');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto pb-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medievalsharp text-white">Seus Monstros</h1>
          
          <Link to="/creations/monsters">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="fantasy-button primary flex items-center gap-2"
            >
              <Plus size={18} />
              Criar Novo Monstro
            </motion.button>
          </Link>
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="text-muted-foreground" size={16} />
            </div>
            <input 
              type="text" 
              className="bg-fantasy-dark border border-fantasy-purple/30 text-white text-sm rounded-lg block w-full pl-10 p-2.5 focus:ring-fantasy-purple focus:border-fantasy-purple"
              placeholder="Buscar monstros..."
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
                <option value="humanoid">Humanoide</option>
                <option value="giant">Gigante</option>
                <option value="undead">Morto-vivo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="fantasy-card p-4 animate-pulse">
                <div className="h-6 bg-fantasy-dark/50 rounded mb-2"></div>
                <div className="h-4 bg-fantasy-dark/30 rounded mb-4"></div>
                <div className="h-10 bg-fantasy-dark/20 rounded"></div>
              </div>
            ))
          ) : monsters.length > 0 ? (
            monsters.map((monster) => (
              <div key={monster.id} className="fantasy-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medievalsharp text-white">{monster.name}</h3>
                  <span className="text-xs px-2 py-1 rounded bg-fantasy-purple/30 text-fantasy-purple">
                    ND {monster.challenge}
                  </span>
                </div>
                
                <div className="text-sm text-fantasy-stone mb-3">
                  {monster.size} {monster.type}, {monster.alignment}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 bg-fantasy-dark/30 p-2 rounded-lg">
                    <Shield size={16} className="text-fantasy-stone" />
                    <div>
                      <div className="text-xs text-fantasy-stone">CA</div>
                      <div className="text-white">{monster.ac}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-fantasy-dark/30 p-2 rounded-lg">
                    <Sword size={16} className="text-fantasy-stone" />
                    <div>
                      <div className="text-xs text-fantasy-stone">HP</div>
                      <div className="text-white">{monster.hp}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => navigate(`/monsters/view/${monster.id}`)}
                    className="p-2 bg-fantasy-purple/20 rounded-lg hover:bg-fantasy-purple/30 transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye size={16} className="text-fantasy-purple" />
                  </button>
                  
                  <button
                    onClick={() => navigate(`/creations/monsters/${monster.id}`)}
                    className="p-2 bg-fantasy-purple/20 rounded-lg hover:bg-fantasy-purple/30 transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} className="text-fantasy-purple" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(monster.id)}
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
              <Sword className="mx-auto text-fantasy-purple/40 mb-4" size={48} />
              <h3 className="text-xl font-medievalsharp text-fantasy-purple mb-2">Nenhum monstro encontrado</h3>
              <p className="text-fantasy-stone mb-4">
                Não encontramos monstros com os filtros atuais. Tente mudar os critérios de busca ou crie um novo monstro.
              </p>
              <Link to="/creations/monsters">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="fantasy-button primary mx-auto"
                >
                  Criar Novo Monstro
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MonstersView;
