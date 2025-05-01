
import React from 'react';

interface Skill {
  name: string;
  proficient: boolean;
  value: number;
}

interface CharacterSkillsProps {
  skills: Skill[];
}

const CharacterSkills = ({ skills }: CharacterSkillsProps) => {
  return (
    <div className="fantasy-card p-6">
      <h3 className="text-xl font-medievalsharp text-white mb-4">Perícias</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {skills.map((skill, index) => (
          <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-fantasy-dark/30">
            <span className="text-white">{skill.name}</span>
            <span className="text-fantasy-gold font-medievalsharp">
              +{skill.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterSkills;
