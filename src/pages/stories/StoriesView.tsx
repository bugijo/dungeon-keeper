
import React, { useState, useEffect } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { Search, Filter, BookOpen, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface Story {
  id: string;
  title: string;
  content: string | null;
  type: string | null;
  tags: string[];
  created_at: string;
}

const StoriesView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchStories();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStories = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setStories(data || []);
    } catch (error: any) {
      console.error('Error fetching stories:', error);
      toast.error('Erro ao carregar histórias');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta história?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setStories(stories.filter(story => story.id !== id));
      toast.success('História excluída com sucesso!');
    } catch (error: any) {
      console.error('Error deleting story:', error);
      toast.error('Erro ao excluir história');
    }
  };

  const filteredStories = stories.filter(story => {
    if (searchTerm && !story.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filter !== "all" && story.type !== filter) {
      return false;
    }
    return true;
  });

  return (
    <MainLayout>
      <div className="container mx-auto pb-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medievalsharp text-white">Suas Histórias</h1>
          
          <Link to="/creations/stories">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="fantasy-button primary flex items-center gap-2"
            >
              <Plus size={18} />
              Criar Nova História
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
              placeholder="Buscar histórias..."
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
                <option value="campaign">Campanhas</option>
                <option value="oneshot">One-Shots</option>
                <option value="sidequest">Missões Secundárias</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="fantasy-card p-4 animate-pulse">
                <div className="h-6 bg-fantasy-dark/50 rounded mb-2"></div>
                <div className="h-4 bg-fantasy-dark/30 rounded mb-4"></div>
                <div className="h-10 bg-fantasy-dark/20 rounded"></div>
              </div>
            ))
          ) : filteredStories.length > 0 ? (
            filteredStories.map((story) => (
              <div key={story.id} className="fantasy-card p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medievalsharp text-white">{story.title}</h3>
                  <div className="p-1 rounded-full bg-fantasy-purple/20">
                    <BookOpen size={16} className="text-fantasy-gold" />
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-fantasy-stone">
                  {new Date(story.created_at).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {story.tags?.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-fantasy-dark px-2 py-0.5 rounded text-fantasy-stone">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/stories/view/${story.id}`)}
                    className="p-2 bg-fantasy-purple/20 rounded-lg hover:bg-fantasy-purple/30 transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye size={16} className="text-fantasy-purple" />
                  </button>
                  
                  <button
                    onClick={() => navigate(`/creations/stories/${story.id}`)}
                    className="p-2 bg-fantasy-purple/20 rounded-lg hover:bg-fantasy-purple/30 transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} className="text-fantasy-purple" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(story.id)}
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
              <BookOpen className="mx-auto text-fantasy-purple/40 mb-4" size={48} />
              <h3 className="text-xl font-medievalsharp text-fantasy-purple mb-2">Nenhuma história encontrada</h3>
              <p className="text-fantasy-stone mb-4">
                Não encontramos histórias com os filtros atuais. Tente mudar os critérios de busca ou crie uma nova história.
              </p>
              <Link to="/creations/stories">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="fantasy-button primary mx-auto"
                >
                  Criar Nova História
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default StoriesView;
