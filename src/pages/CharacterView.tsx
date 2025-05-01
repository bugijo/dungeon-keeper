
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft } from "lucide-react";
import CharacterHeader from '@/components/character/CharacterHeader';
import CharacterStats from '@/components/character/CharacterStats';
import CharacterSkills from '@/components/character/CharacterSkills';
import CharacterEquipment from '@/components/character/CharacterEquipment';
import CharacterSpells from '@/components/character/CharacterSpells';

// This would come from the database in a real app
const mockCharacter = {
  id: '1',
  name: 'Thorian Greystone',
  level: 5,
  class: 'Paladino',
  race: 'Anão',
  background: 'Ferreiro de Guildas',
  alignment: 'Leal e Bom',
  stats: {
    strength: 16,
    dexterity: 10,
    constitution: 18,
    intelligence: 12,
    wisdom: 14,
    charisma: 16
  },
  abilities: {
    hp: { current: 45, max: 45 },
    ac: 18,
    speed: 25,
    initiative: 0,
    proficiencyBonus: 3
  },
  skills: [
    { name: 'Atletismo', proficient: true, value: 6 },
    { name: 'Intimidação', proficient: true, value: 6 },
    { name: 'Religião', proficient: true, value: 4 },
    { name: 'Persuasão', proficient: true, value: 6 }
  ],
  equipment: [
    { name: 'Martelo de Guerra', type: 'weapon', damage: '1d8+3', properties: 'Versatile (1d10)' },
    { name: 'Escudo', type: 'shield', ac: '+2' },
    { name: 'Cota de Malha', type: 'armor', ac: '16' },
    { name: 'Símbolo Sagrado', type: 'item' }
  ],
  spells: [
    { name: 'Curar Ferimentos', level: 1, description: 'Cura 1d8 + modificador de habilidade de conjuração de pontos de vida.' },
    { name: 'Destruir Mortos-Vivos', level: 1, description: 'Mortos-vivos com menos de CR 1/2 devem passar em um teste de sabedoria ou são destruídos.' },
    { name: 'Sopro Curativo', level: 0, description: 'Estabiliza uma criatura com 0 pontos de vida.' }
  ]
};

const CharacterView = () => {
  const { id } = useParams();
  // In a real application, you would fetch the character data based on the ID
  const character = mockCharacter;
  
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
            name={character.name}
            level={character.level}
            race={character.race}
            characterClass={character.class}
            background={character.background}
            alignment={character.alignment}
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
