
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface CharacterHeaderProps {
  name: string;
  level: number;
  race: string;
  characterClass: string;
  background: string;
  alignment: string;
  imageUrl?: string;
  id?: string;
}

const CharacterHeader = ({ 
  id,
  name, 
  level, 
  race, 
  characterClass, 
  background, 
  alignment,
  imageUrl = "/lovable-uploads/6be414ac-e1d0-4348-8246-9fe914618c47.png"
}: CharacterHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleDelete = async () => {
    if (!id || !user) return;
    
    if (!window.confirm('Tem certeza que deseja excluir este personagem?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Personagem excluído com sucesso!');
      navigate('/character');
    } catch (error) {
      console.error('Error deleting character:', error);
      toast.error('Erro ao excluir personagem');
    }
  };
  
  return (
    <div className="fantasy-card p-6 md:col-span-1">
      <div className="h-40 w-40 mx-auto rounded-full overflow-hidden border-4 border-fantasy-purple/30 mb-4">
        <img 
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <h2 className="text-xl font-medievalsharp text-center text-white mb-1">{name}</h2>
      <p className="text-center text-fantasy-stone mb-4">
        Nível {level} {race} {characterClass}
      </p>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-fantasy-stone">Antecedente:</span>
          <span className="text-white">{background}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-fantasy-stone">Alinhamento:</span>
          <span className="text-white">{alignment}</span>
        </div>
      </div>
      
      <div className="flex gap-2 mt-6">
        {id && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/creations/characters/${id}`)}
              className="flex-1 bg-fantasy-purple text-white py-2 rounded-lg font-medievalsharp flex items-center justify-center gap-2"
            >
              <Edit size={16} />
              Editar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              className="bg-fantasy-dark/80 text-red-400 py-2 px-3 rounded-lg"
            >
              <Trash size={16} />
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
};

export default CharacterHeader;
