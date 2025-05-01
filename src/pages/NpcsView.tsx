import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface Npc {
  id: string;
  name: string;
  race: string;
  occupation: string | null;
  location: string | null;
  alignment: string | null;
  appearance: string | null;
  personality: string[];
  background: string | null;
  motivations: string | null;
  connections: string | null;
  voice: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const NpcsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [npc, setNpc] = useState<Npc | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNpc = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('npcs')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        setNpc(data as Npc);
      } catch (error: any) {
        toast.error('Erro ao carregar detalhes do NPC');
        console.error('Error fetching NPC:', error);
        navigate('/npcs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNpc();
  }, [id, user, navigate]);
  
  const handleDelete = async () => {
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
      
      toast.success('NPC excluído com sucesso!');
      navigate('/npcs');
    } catch (error: any) {
      toast.error(`Erro ao excluir NPC: ${error.message}`);
    }
  };
  
  const getAlignmentText = (code: string) => {
    const alignments = {
      'LG': 'Leal e Bom',
      'NG': 'Neutro e Bom',
      'CG': 'Caótico e Bom',
      'LN': 'Leal e Neutro',
      'N': 'Neutro',
      'CN': 'Caótico e Neutro',
      'LE': 'Leal e Mau',
      'NE': 'Neutro e Mau',
      'CE': 'Caótico e Mau'
    };
    return alignments[code as keyof typeof alignments] || code;
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/npcs" className="mr-4">
              <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
            </Link>
            <h1 className="text-3xl font-medievalsharp text-fantasy-gold">Detalhes do NPC</h1>
          </div>
          
          {!loading && npc && (
            <div className="flex gap-2">
              <Link to={`/creations/npcs/${id}`}>
                <button className="bg-fantasy-purple/80 text-white p-2 rounded hover:bg-fantasy-purple transition-colors">
                  <Edit size={18} />
                </button>
              </Link>
              <button 
                onClick={handleDelete} 
                className="bg-red-600/80 text-white p-2 rounded hover:bg-red-600 transition-colors"
              >
                <Trash size={18} />
              </button>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="fantasy-card p-6 text-center">
            <p className="text-fantasy-stone">Carregando detalhes do NPC...</p>
          </div>
        ) : npc ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="fantasy-card p-6">
                <div className="h-40 w-40 mx-auto rounded-full overflow-hidden border-4 border-fantasy-purple/30 mb-4 bg-fantasy-dark/50 flex items-center justify-center">
                  <div className="text-fantasy-purple text-7xl font-medievalsharp">
                    {npc.name.charAt(0)}
                  </div>
                </div>
                
                <h2 className="text-center text-2xl font-medievalsharp text-white mb-1">
                  {npc.name}
                </h2>
                <p className="text-center text-fantasy-stone mb-6">
                  {npc.race} • {npc.occupation}
                </p>
                
                <div className="space-y-3 mb-4">
                  {npc.location && (
                    <div className="flex justify-between">
                      <span className="text-fantasy-stone">Localização:</span>
                      <span className="text-white">{npc.location}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-fantasy-stone">Alinhamento:</span>
                    <span className="text-white">{getAlignmentText(npc.alignment)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-fantasy-stone">Criado em:</span>
                    <span className="text-white">{new Date(npc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {npc.personality && npc.personality.length > 0 && (
                  <div className="bg-fantasy-dark/30 p-3 rounded-lg">
                    <h5 className="text-sm font-medievalsharp text-fantasy-gold mb-2">Personalidade</h5>
                    <div className="flex flex-wrap gap-1">
                      {npc.personality.map((trait, idx) => (
                        <span key={idx} className="text-xs bg-fantasy-dark px-2 py-0.5 rounded text-fantasy-stone">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="fantasy-card p-6 space-y-6">
                {npc.appearance && (
                  <div>
                    <h3 className="text-xl font-medievalsharp text-fantasy-gold mb-2">Aparência</h3>
                    <p className="text-fantasy-stone leading-relaxed">{npc.appearance}</p>
                  </div>
                )}
                
                {npc.background && (
                  <div>
                    <h3 className="text-xl font-medievalsharp text-fantasy-gold mb-2">História de Fundo</h3>
                    <p className="text-fantasy-stone leading-relaxed whitespace-pre-line">{npc.background}</p>
                  </div>
                )}
                
                {npc.motivations && (
                  <div>
                    <h3 className="text-xl font-medievalsharp text-fantasy-gold mb-2">Motivações & Objetivos</h3>
                    <p className="text-fantasy-stone leading-relaxed whitespace-pre-line">{npc.motivations}</p>
                  </div>
                )}
                
                {npc.connections && (
                  <div>
                    <h3 className="text-xl font-medievalsharp text-fantasy-gold mb-2">Conexões & Relacionamentos</h3>
                    <p className="text-fantasy-stone leading-relaxed whitespace-pre-line">{npc.connections}</p>
                  </div>
                )}
                
                {npc.voice && (
                  <div>
                    <h3 className="text-xl font-medievalsharp text-fantasy-gold mb-2">Voz & Maneirismos</h3>
                    <p className="text-fantasy-stone leading-relaxed whitespace-pre-line">{npc.voice}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="fantasy-card p-6 text-center">
            <p className="text-fantasy-stone">NPC não encontrado ou você não tem permissão para vê-lo.</p>
            <Link to="/npcs" className="text-fantasy-gold hover:underline block mt-4">
              Voltar para a lista de NPCs
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default NpcsView;
