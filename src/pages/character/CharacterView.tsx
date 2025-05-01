
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft } from "lucide-react";
import CharacterHeader from '@/components/character/CharacterHeader';
import CharacterStats from '@/components/character/CharacterStats';
import CharacterSkills from '@/components/character/CharacterSkills';
import CharacterEquipment from '@/components/character/CharacterEquipment';
import CharacterSpells from '@/components/character/CharacterSpells';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

const CharacterView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCharacter = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Make sure attributes is an object, not an array or other type
          const attributesObj = typeof data.attributes === 'object' && data.attributes !== null && !Array.isArray(data.attributes)
            ? data.attributes
            : {};
          
          // Safely access nested properties with type checking
          const hpObj = typeof attributesObj.hp === 'object' && attributesObj.hp !== null && !Array.isArray(attributesObj.hp)
            ? attributesObj.hp
            : { current: 10, max: 10 };
          
          // Format character data to display in the UI
          const formattedCharacter = {
            id: data.id,
            name: data.name,
            level: data.level || 1,
            class: data.class || 'Desconhecido',
            race: data.race || 'Desconhecido',
            background: data.background || 'Desconhecido',
            alignment: String(attributesObj.alignment || 'Neutro'),
            stats: {
              strength: Number(attributesObj.strength || 10),
              dexterity: Number(attributesObj.dexterity || 10),
              constitution: Number(attributesObj.constitution || 10),
              intelligence: Number(attributesObj.intelligence || 10),
              wisdom: Number(attributesObj.wisdom || 10),
              charisma: Number(attributesObj.charisma || 10)
            },
            abilities: {
              hp: { 
                current: Number(hpObj.current || 10), 
                max: Number(hpObj.max || 10)
              },
              ac: Number(attributesObj.ac || 10),
              speed: Number(attributesObj.speed || 30),
              initiative: Number(attributesObj.initiative || 0),
              proficiencyBonus: Math.ceil(data.level / 4) + 1
            },
            skills: Array.isArray(attributesObj.skills) ? attributesObj.skills : [
              { name: 'Atletismo', proficient: false, value: 0 }
            ],
            equipment: Array.isArray(data.equipment) ? data.equipment : [],
            spells: Array.isArray(data.spells) ? data.spells : [],
            imageUrl: String(attributesObj.imageUrl || '/lovable-uploads/6be414ac-e1d0-4348-8246-9fe914618c47.png')
          };
          
          setCharacter(formattedCharacter);
        }
      } catch (error) {
        console.error('Error fetching character:', error);
        toast.error('Erro ao carregar o personagem');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCharacter();
  }, [id, user]);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <p className="text-fantasy-stone">Carregando personagem...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!character) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h2 className="text-2xl font-medievalsharp text-fantasy-gold mb-4">Personagem não encontrado</h2>
            <Link to="/character" className="fantasy-button primary">
              Voltar para a lista de personagens
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto pb-16">
        <div className="flex items-center mb-6">
          <Link to="/character" className="mr-4">
            <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
          </Link>
          <h1 className="text-3xl font-medievalsharp text-white">{character.name}</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Character Info Card */}
          <CharacterHeader 
            id={character.id}
            name={character.name}
            level={character.level}
            race={character.race}
            characterClass={character.class}
            background={character.background}
            alignment={character.alignment}
            imageUrl={character.imageUrl}
          />
          
          <div className="md:col-span-2 space-y-6">
            {/* Abilities & Combat Stats */}
            <CharacterStats 
              stats={character.stats}
              abilities={character.abilities}
            />
            
            {/* Proficiencies & Skills */}
            <CharacterSkills skills={character.skills} />
            
            {/* Equipment */}
            <CharacterEquipment equipment={character.equipment} />
            
            {/* Spells */}
            <CharacterSpells spells={character.spells} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CharacterView;
