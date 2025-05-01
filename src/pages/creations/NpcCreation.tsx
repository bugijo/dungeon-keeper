import React, { useState, useEffect } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, Save, Users, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
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

const NpcCreation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [race, setRace] = useState('humano');
  const [occupation, setOccupation] = useState('');
  const [location, setLocation] = useState('');
  const [alignment, setAlignment] = useState('NG');
  const [appearance, setAppearance] = useState('');
  const [personality, setPersonality] = useState<string[]>([]);
  const [background, setBackground] = useState('');
  const [motivations, setMotivations] = useState('');
  const [connections, setConnections] = useState('');
  const [voice, setVoice] = useState('');
  const [newTrait, setNewTrait] = useState("");

  useEffect(() => {
    if (isEditing && user) {
      const fetchNpcDetails = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('npcs')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

          if (error) {
            toast.error('Erro ao carregar detalhes do NPC');
            navigate('/npcs');
            return;
          }

          if (data) {
            const npc = data as Npc;
            setName(npc.name);
            setRace(npc.race);
            setOccupation(npc.occupation || '');
            setLocation(npc.location || '');
            setAlignment(npc.alignment || 'NG');
            setAppearance(npc.appearance || '');
            setPersonality(npc.personality || []);
            setBackground(npc.background || '');
            setMotivations(npc.motivations || '');
            setConnections(npc.connections || '');
            setVoice(npc.voice || '');
          }
        } catch (error: any) {
          toast.error('Erro ao carregar NPC');
          navigate('/npcs');
        } finally {
          setIsLoading(false);
        }
      };

      fetchNpcDetails();
    }
  }, [id, isEditing, user, navigate]);
  
  const handleAddTrait = () => {
    if (newTrait.trim()) {
      setPersonality([...personality, newTrait.trim()]);
      setNewTrait("");
    }
  };
  
  const handleRemoveTrait = (index: number) => {
    setPersonality(personality.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Você precisa estar logado para criar um NPC');
      return;
    }

    if (!name || !race) {
      toast.error('Por favor, informe ao menos o nome e a raça do NPC');
      return;
    }

    setIsLoading(true);

    try {
      const npcData = {
        name,
        race,
        occupation,
        location,
        alignment,
        appearance,
        personality,
        background,
        motivations,
        connections,
        voice,
        user_id: user.id
      };

      let result;
      if (isEditing) {
        result = await supabase
          .from('npcs')
          .update(npcData)
          .eq('id', id)
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('npcs')
          .insert(npcData);
      }

      if (result.error) {
        throw result.error;
      }

      toast.success(`NPC "${name}" ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/npcs');
    } catch (error: any) {
      toast.error(`Erro ao ${isEditing ? 'editar' : 'criar'} NPC: ${error.message}`);
      console.error('Error saving NPC:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const suggestedTraits = [
    "Desconfiado", "Leal", "Ambicioso", "Orgulhoso", "Corajoso", 
    "Tímido", "Generoso", "Mesquinho", "Sábio", "Impulsivo"
  ];
  
  if (isLoading && isEditing) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 text-center">
          <p className="text-fantasy-stone">Carregando detalhes do NPC...</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto pb-16">
        <div className="flex items-center mb-6">
          <Link to="/npcs" className="mr-4">
            <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
          </Link>
          <h1 className="text-2xl font-medievalsharp text-white">{isEditing ? 'Editar NPC' : 'Criar Novo NPC'}</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="fantasy-card p-6">
              <h3 className="text-lg font-medievalsharp text-white mb-4">Pré-visualização</h3>
              
              <div className="h-40 w-40 mx-auto rounded-full overflow-hidden border-4 border-fantasy-purple/30 mb-4 bg-fantasy-dark/50 flex items-center justify-center">
                <Users className="text-fantasy-purple/40" size={32} />
              </div>
              
              <h4 className="text-center text-xl font-medievalsharp text-white mb-1">
                {name || 'Nome do NPC'}
              </h4>
              <p className="text-center text-fantasy-stone mb-3">
                {race || 'Raça'} • {occupation || 'Ocupação'}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-fantasy-stone">Localização:</span>
                  <span className="text-white">{location || 'Não especificada'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fantasy-stone">Alinhamento:</span>
                  <span className="text-white">{alignment === 'LG' ? 'Leal e Bom' : 
                                              alignment === 'NG' ? 'Neutro e Bom' :
                                              alignment === 'CG' ? 'Caótico e Bom' :
                                              alignment === 'LN' ? 'Leal e Neutro' :
                                              alignment === 'N' ? 'Neutro' :
                                              alignment === 'CN' ? 'Caótico e Neutro' :
                                              alignment === 'LE' ? 'Leal e Mau' :
                                              alignment === 'NE' ? 'Neutro e Mau' :
                                              alignment === 'CE' ? 'Caótico e Mau' : 'Desconhecido'}</span>
                </div>
              </div>
              
              <div className="bg-fantasy-dark/30 p-3 rounded-lg">
                <h5 className="text-sm font-medievalsharp text-fantasy-gold mb-2">Personalidade</h5>
                <div className="flex flex-wrap gap-1">
                  {personality.map((trait, idx) => (
                    <span key={idx} className="text-xs bg-fantasy-dark px-2 py-0.5 rounded text-fantasy-stone">
                      {trait}
                    </span>
                  ))}
                  {personality.length === 0 && (
                    <span className="text-xs text-fantasy-stone/50 italic">
                      Adicione traços de personalidade...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="fantasy-card p-6">
              <h3 className="text-lg font-medievalsharp text-white mb-4">Informações Básicas</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-fantasy-stone mb-1">Nome</label>
                  <input
                    type="text"
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                    placeholder="Digite o nome do NPC"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-fantasy-stone mb-1">Raça</label>
                    <select
                      className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                      value={race}
                      onChange={(e) => setRace(e.target.value)}
                    >
                      <option value="humano">Humano</option>
                      <option value="elfo">Elfo</option>
                      <option value="anao">Anão</option>
                      <option value="halfling">Halfling</option>
                      <option value="tiefling">Tiefling</option>
                      <option value="draconato">Draconato</option>
                      <option value="gnomo">Gnomo</option>
                      <option value="meio-elfo">Meio-Elfo</option>
                      <option value="meio-orc">Meio-Orc</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-fantasy-stone mb-1">Ocupação</label>
                    <input
                      type="text"
                      className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                      placeholder="Ex: Comerciante, Guarda, etc."
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-fantasy-stone mb-1">Localização</label>
                    <input
                      type="text"
                      className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                      placeholder="Onde este NPC pode ser encontrado"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-fantasy-stone mb-1">Alinhamento</label>
                    <select
                      className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2"
                      value={alignment}
                      onChange={(e) => setAlignment(e.target.value)}
                    >
                      <option value="LG">Leal e Bom</option>
                      <option value="NG">Neutro e Bom</option>
                      <option value="CG">Caótico e Bom</option>
                      <option value="LN">Leal e Neutro</option>
                      <option value="N">Neutro</option>
                      <option value="CN">Caótico e Neutro</option>
                      <option value="LE">Leal e Mau</option>
                      <option value="NE">Neutro e Mau</option>
                      <option value="CE">Caótico e Mau</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-fantasy-stone mb-1">Aparência</label>
                  <textarea
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2 min-h-[80px]"
                    placeholder="Descreva a aparência física do NPC..."
                    value={appearance}
                    onChange={(e) => setAppearance(e.target.value)}
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-fantasy-stone mb-1">Traços de Personalidade</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-l-lg p-2"
                      placeholder="Adicionar traço (ex: Leal, Desconfiado)"
                      value={newTrait}
                      onChange={(e) => setNewTrait(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTrait()}
                    />
                    <button 
                      className="bg-fantasy-purple text-white px-3 rounded-r-lg"
                      onClick={handleAddTrait}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {personality.map((trait, idx) => (
                      <div key={idx} className="bg-fantasy-dark flex items-center gap-1 px-2 py-1 rounded-full">
                        <span className="text-sm text-fantasy-stone">{trait}</span>
                        <button 
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleRemoveTrait(idx)}
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-fantasy-stone mb-2">Traços sugeridos:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestedTraits.map((trait) => (
                        <button
                          key={trait}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            personality.includes(trait) 
                              ? 'bg-fantasy-purple/50 text-white cursor-not-allowed' 
                              : 'bg-fantasy-dark/50 text-fantasy-stone hover:bg-fantasy-dark'
                          }`}
                          onClick={() => {
                            if (!personality.includes(trait)) {
                              setPersonality([...personality, trait]);
                            }
                          }}
                          disabled={personality.includes(trait)}
                          type="button"
                        >
                          {trait}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="fantasy-card p-6 mt-6">
              <h3 className="text-lg font-medievalsharp text-white mb-4">Detalhes Adicionais</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-fantasy-stone mb-1">História de Fundo</label>
                  <textarea
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2 min-h-[100px]"
                    placeholder="Descreva a história deste NPC..."
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-fantasy-stone mb-1">Motivações & Objetivos</label>
                  <textarea
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2 min-h-[100px]"
                    placeholder="O que este NPC deseja? Quais são seus objetivos?"
                    value={motivations}
                    onChange={(e) => setMotivations(e.target.value)}
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-fantasy-stone mb-1">Conexões & Relacionamentos</label>
                  <textarea
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2 min-h-[80px]"
                    placeholder="Quais são as relações deste NPC com outros personagens ou facções?"
                    value={connections}
                    onChange={(e) => setConnections(e.target.value)}
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-fantasy-stone mb-1">Voz & Maneirismos</label>
                  <textarea
                    className="w-full bg-fantasy-dark/80 border border-fantasy-purple/30 text-white rounded-lg p-2 min-h-[80px]"
                    placeholder="Como este NPC fala? Possui algum tique ou maneirismo característico?"
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Link to="/npcs">
                  <button className="bg-fantasy-dark text-fantasy-stone py-2 px-4 rounded-lg" type="button">
                    Cancelar
                  </button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-fantasy-gold text-fantasy-dark py-2 px-6 rounded-lg font-medievalsharp flex items-center gap-2"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  type="button"
                >
                  <Save size={18} />
                  {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar NPC' : 'Salvar NPC')}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NpcCreation;
