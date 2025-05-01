
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Sword, BookOpen, Star, Heart, Zap, Award } from 'lucide-react';

type Stat = {
  name: string;
  value: number;
  max?: number;
};

type Skill = {
  name: string;
  value: number;
  proficient: boolean;
};

type Item = {
  name: string;
  type: string;
  description: string;
  quantity?: number;
  weight?: number;
};

type Spell = {
  name: string;
  level: number;
  description: string;
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
};

type Feature = {
  name: string;
  source: string;
  description: string;
};

type CharacterSheetProps = {
  character: {
    name: string;
    race: string;
    class: string;
    level: number;
    background: string;
    alignment: string;
    experiencePoints: number;
    nextLevelXP: number;
    stats: Stat[];
    skills: Skill[];
    savingThrows: Skill[];
    proficiencyBonus: number;
    armorClass: number;
    initiative: number;
    speed: number;
    hitPoints: { current: number; max: number; temporary: number };
    hitDice: { current: number; total: number; die: string };
    deathSaves: { successes: number; failures: number };
    inventory: Item[];
    spells: {
      slots: { level: number; used: number; total: number }[];
      known: Spell[];
    };
    features: Feature[];
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    appearance: string;
    backstory: string;
    notes: string;
    currency: {
      copper: number;
      silver: number;
      electrum: number;
      gold: number;
      platinum: number;
    };
  };
};

export const CharacterSheet = ({ character }: CharacterSheetProps) => {
  const [tempHitPoints, setTempHitPoints] = useState(character.hitPoints.temporary);
  const [currentHitPoints, setCurrentHitPoints] = useState(character.hitPoints.current);
  const [deathSaves, setDeathSaves] = useState(character.deathSaves);

  const getAbilityModifier = (value: number) => {
    const modifier = Math.floor((value - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : modifier;
  };

  const handleHitPointChange = (amount: number) => {
    // Lógica para gerenciar pontos de vida temporários e atuais
    if (amount > 0) {
      setCurrentHitPoints(prev => Math.min(prev + amount, character.hitPoints.max));
    } else {
      const absAmount = Math.abs(amount);
      if (tempHitPoints > 0) {
        if (tempHitPoints >= absAmount) {
          setTempHitPoints(prev => prev - absAmount);
        } else {
          const remaining = absAmount - tempHitPoints;
          setTempHitPoints(0);
          setCurrentHitPoints(prev => Math.max(0, prev - remaining));
        }
      } else {
        setCurrentHitPoints(prev => Math.max(0, prev - absAmount));
      }
    }
  };

  const handleDeathSave = (type: 'success' | 'failure', value: boolean) => {
    setDeathSaves(prev => {
      const newSaves = { ...prev };
      if (type === 'success') {
        newSaves.successes = value 
          ? Math.min(prev.successes + 1, 3) 
          : Math.max(prev.successes - 1, 0);
      } else {
        newSaves.failures = value 
          ? Math.min(prev.failures + 1, 3) 
          : Math.max(prev.failures - 1, 0);
      }
      return newSaves;
    });
  };

  return (
    <div className="fantasy-card p-4">
      <div className="flex flex-col space-y-4">
        {/* Cabeçalho do Personagem */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-medievalsharp text-fantasy-gold">{character.name}</h2>
            <p className="text-sm text-fantasy-stone">
              {character.race} • {character.class} • Nível {character.level} • {character.background}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="h-5 w-5 flex items-center justify-center bg-fantasy-purple/20 rounded-full border border-fantasy-purple/50">
                <Award size={12} className="text-fantasy-gold" />
              </span>
              <span className="text-sm font-medium">Nível {character.level}</span>
            </div>
            <div className="h-6 w-[200px] xp-bar bg-fantasy-dark/70 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-fantasy-purple to-fantasy-accent rounded-full" 
                style={{ width: `${(character.experiencePoints / character.nextLevelXP) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-muted-foreground">
              {character.experiencePoints}/{character.nextLevelXP} XP
            </span>
          </div>
        </div>
        
        {/* Abas da Ficha */}
        <Tabs defaultValue="attributes" className="w-full">
          <TabsList className="grid grid-cols-5 gap-2 mb-4">
            <TabsTrigger value="attributes" className="flex items-center gap-2">
              <Star size={16} />
              <span className="hidden sm:inline">Atributos</span>
            </TabsTrigger>
            <TabsTrigger value="combat" className="flex items-center gap-2">
              <Sword size={16} />
              <span className="hidden sm:inline">Combate</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Shield size={16} />
              <span className="hidden sm:inline">Inventário</span>
            </TabsTrigger>
            <TabsTrigger value="spells" className="flex items-center gap-2">
              <Zap size={16} />
              <span className="hidden sm:inline">Magias</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <BookOpen size={16} />
              <span className="hidden sm:inline">Características</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Atributos e Perícias */}
          <TabsContent value="attributes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Atributos Físicos */}
              <div className="fantasy-border p-3">
                <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Atributos Principais</h3>
                <div className="grid grid-cols-3 gap-2">
                  {character.stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="w-14 h-14 mx-auto rounded-full border-2 border-fantasy-purple/50 bg-fantasy-dark/30 flex items-center justify-center">
                        <span className="text-xl font-medievalsharp text-fantasy-gold">{stat.value}</span>
                      </div>
                      <div className="mt-1 text-xs text-fantasy-stone">
                        {stat.name}
                        <div className="text-xxs">
                          {getAbilityModifier(stat.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Perícias */}
              <div className="fantasy-border p-3 col-span-1 md:col-span-2">
                <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Perícias</h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {character.skills.map((skill, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${skill.proficient ? 'bg-fantasy-gold' : 'bg-fantasy-dark/50'}`}></div>
                          <span className="text-sm">{skill.name}</span>
                        </div>
                        <span className={`text-sm font-medium ${skill.proficient ? 'text-fantasy-gold' : 'text-fantasy-stone'}`}>
                          {skill.value >= 0 ? `+${skill.value}` : skill.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          
          {/* Combate */}
          <TabsContent value="combat">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status de Combate */}
              <div className="fantasy-border p-3">
                <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Status de Combate</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto rounded-full border-2 border-fantasy-purple/50 bg-fantasy-dark/30 flex items-center justify-center">
                      <span className="text-xl font-medievalsharp text-fantasy-gold">{character.armorClass}</span>
                    </div>
                    <div className="mt-1 text-xs text-fantasy-stone">Classe de Armadura</div>
                  </div>
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto rounded-full border-2 border-fantasy-purple/50 bg-fantasy-dark/30 flex items-center justify-center">
                      <span className="text-xl font-medievalsharp text-fantasy-gold">{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</span>
                    </div>
                    <div className="mt-1 text-xs text-fantasy-stone">Iniciativa</div>
                  </div>
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto rounded-full border-2 border-fantasy-purple/50 bg-fantasy-dark/30 flex items-center justify-center">
                      <span className="text-xl font-medievalsharp text-fantasy-gold">{character.speed}</span>
                    </div>
                    <div className="mt-1 text-xs text-fantasy-stone">Deslocamento</div>
                  </div>
                </div>
                
                {/* Pontos de Vida */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pontos de Vida</span>
                      <span className="text-sm font-medium">{currentHitPoints}/{character.hitPoints.max} {tempHitPoints > 0 ? `(+${tempHitPoints})` : ''}</span>
                    </div>
                    <div className="h-3 bg-fantasy-dark/70 rounded-full mt-1">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-700 rounded-full" 
                        style={{ width: `${(currentHitPoints / character.hitPoints.max) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Controles de Pontos de Vida */}
                  <div className="flex justify-between items-center gap-2">
                    <button 
                      onClick={() => handleHitPointChange(-1)}
                      className="flex-1 fantasy-button secondary text-sm py-1"
                    >
                      -1
                    </button>
                    <button 
                      onClick={() => handleHitPointChange(-5)}
                      className="flex-1 fantasy-button secondary text-sm py-1"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleHitPointChange(5)}
                      className="flex-1 fantasy-button primary text-sm py-1"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleHitPointChange(1)}
                      className="flex-1 fantasy-button primary text-sm py-1"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Dados de Vida e Resistências à Morte */}
              <div className="fantasy-border p-3">
                <div className="mb-4">
                  <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Dados de Vida</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dados: {character.hitDice.current}/{character.hitDice.total} {character.hitDice.die}</span>
                    <div className="flex gap-2">
                      <button className="fantasy-button secondary text-xs py-1 px-2">Usar</button>
                      <button className="fantasy-button primary text-xs py-1 px-2">Recuperar</button>
                    </div>
                  </div>
                </div>
                
                {/* Resistências à Morte */}
                {currentHitPoints === 0 && (
                  <div>
                    <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Resistências à Morte</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm mb-1">Sucessos</p>
                        <div className="flex gap-2">
                          {[1, 2, 3].map(i => (
                            <div 
                              key={`success-${i}`}
                              className={`w-6 h-6 rounded-full border border-green-500 cursor-pointer flex items-center justify-center
                              ${deathSaves.successes >= i ? 'bg-green-500 text-white' : 'bg-fantasy-dark/30'}`}
                              onClick={() => handleDeathSave('success', deathSaves.successes < i)}
                            >
                              ✓
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm mb-1">Falhas</p>
                        <div className="flex gap-2">
                          {[1, 2, 3].map(i => (
                            <div 
                              key={`failure-${i}`}
                              className={`w-6 h-6 rounded-full border border-red-500 cursor-pointer flex items-center justify-center
                              ${deathSaves.failures >= i ? 'bg-red-500 text-white' : 'bg-fantasy-dark/30'}`}
                              onClick={() => handleDeathSave('failure', deathSaves.failures < i)}
                            >
                              ✗
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Inventário */}
          <TabsContent value="inventory">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lista de Itens */}
              <div className="fantasy-border p-3 col-span-1 md:col-span-2">
                <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Itens</h3>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {character.inventory.map((item, index) => (
                      <div key={index} className="bg-fantasy-dark/30 p-2 rounded-md">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs bg-fantasy-purple/20 text-fantasy-purple px-2 py-0.5 rounded-full">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-fantasy-stone mt-1">{item.description}</p>
                        {(item.quantity || item.weight) && (
                          <div className="flex justify-between mt-1 text-xs">
                            {item.quantity && <span>Qtd: {item.quantity}</span>}
                            {item.weight && <span>Peso: {item.weight} kg</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Moedas */}
              <div className="fantasy-border p-3">
                <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Moedas</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-amber-300">Ouro</span>
                    <span>{character.currency.gold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prata</span>
                    <span>{character.currency.silver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">Cobre</span>
                    <span>{character.currency.copper}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Platina</span>
                    <span>{character.currency.platinum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300">Electrum</span>
                    <span>{character.currency.electrum}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Magias */}
          <TabsContent value="spells">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Espaços de Magia */}
              <div className="fantasy-border p-3">
                <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Espaços de Magia</h3>
                <div className="space-y-3">
                  {character.spells.slots.map((slot, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm">
                        <span>Nível {slot.level}</span>
                        <span>{slot.used}/{slot.total}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: slot.total }).map((_, i) => (
                          <div 
                            key={`slot-${index}-${i}`}
                            className={`w-5 h-5 rounded-full ${i < slot.used ? 'bg-fantasy-dark/70' : 'bg-fantasy-purple/30'} 
                            border border-fantasy-purple/50 cursor-pointer`}
                            onClick={() => {
                              // Lógica para usar/recuperar espaço de magia
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Lista de Magias */}
              <div className="fantasy-border p-3 col-span-1 md:col-span-3">
                <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Magias Conhecidas</h3>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    {character.spells.known.map((spell, index) => (
                      <div key={index} className="bg-fantasy-dark/30 p-2 rounded-md">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{spell.name}</span>
                          <span className="text-xs bg-fantasy-purple/20 text-fantasy-purple px-2 py-0.5 rounded-full">
                            Nível {spell.level === 0 ? 'Truque' : spell.level}
                          </span>
                        </div>
                        <p className="text-xs text-fantasy-stone mt-1">{spell.description}</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-xs">
                          {spell.castingTime && (
                            <div><span className="font-medium">Tempo:</span> {spell.castingTime}</div>
                          )}
                          {spell.range && (
                            <div><span className="font-medium">Alcance:</span> {spell.range}</div>
                          )}
                          {spell.components && (
                            <div><span className="font-medium">Componentes:</span> {spell.components}</div>
                          )}
                          {spell.duration && (
                            <div><span className="font-medium">Duração:</span> {spell.duration}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          
          {/* Características */}
          <TabsContent value="features">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Características e Traços */}
              <div className="fantasy-border p-3">
                <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Características e Traços</h3>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    {character.features.map((feature, index) => (
                      <div key={index} className="bg-fantasy-dark/30 p-2 rounded-md">
                        <div className="flex justify-between">
                          <span className="font-medium">{feature.name}</span>
                          <span className="text-xs bg-fantasy-purple/20 text-fantasy-purple px-2 py-0.5 rounded-full">
                            {feature.source}
                          </span>
                        </div>
                        <p className="text-xs text-fantasy-stone mt-1">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Traços de Personalidade */}
              <div className="fantasy-border p-3">
                <h3 className="text-center font-medievalsharp text-fantasy-purple mb-2">Personalidade</h3>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medievalsharp text-fantasy-gold">Traços</h4>
                      <p className="text-xs text-fantasy-stone mt-1">{character.personalityTraits}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medievalsharp text-fantasy-gold">Ideais</h4>
                      <p className="text-xs text-fantasy-stone mt-1">{character.ideals}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medievalsharp text-fantasy-gold">Vínculos</h4>
                      <p className="text-xs text-fantasy-stone mt-1">{character.bonds}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medievalsharp text-fantasy-gold">Fraquezas</h4>
                      <p className="text-xs text-fantasy-stone mt-1">{character.flaws}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medievalsharp text-fantasy-gold">Aparência</h4>
                      <p className="text-xs text-fantasy-stone mt-1">{character.appearance}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medievalsharp text-fantasy-gold">História</h4>
                      <p className="text-xs text-fantasy-stone mt-1">{character.backstory}</p>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CharacterSheet;
