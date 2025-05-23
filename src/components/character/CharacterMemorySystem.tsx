import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface CharacterMemorySystemProps {
  characterId: string;
  isGM: boolean;
  onUpdate?: (memoryAttributes: CharacterMemoryAttributes) => void;
}

export interface CharacterMemoryAttributes {
  intelligence: number; // 0-100, afeta a qualidade inicial da memória
  wisdom: number; // 0-100, afeta a duração da memória
  perception: number; // 0-100, afeta a capacidade de ver detalhes em baixa luz
  memoryQuality: number; // Qualidade geral da memória (calculada)
  memoryDuration: number; // Duração da memória (calculada)
  detailPerception: number; // Percepção de detalhes (calculada)
  modifiers: {
    race: number; // Modificador racial
    class: number; // Modificador de classe
    background: number; // Modificador de background
    items: number; // Modificador de itens equipados
    abilities: number[]; // Modificadores de habilidades especiais
  };
  specialAbilities: SpecialAbility[];
}

interface SpecialAbility {
  id: string;
  name: string;
  description: string;
  effect: {
    type: 'quality' | 'duration' | 'perception';
    value: number;
  };
  prerequisites?: {
    attribute: string;
    minValue: number;
  }[];
}

/**
 * Sistema de configuração de memória por personagem
 * Implementa as fórmulas base para cálculo de capacidades de memória
 */
const CharacterMemorySystem: React.FC<CharacterMemorySystemProps> = ({
  characterId,
  isGM,
  onUpdate
}) => {
  const [character, setCharacter] = useState<Record<string, any> | null>(null);
  const [memoryAttributes, setMemoryAttributes] = useState<CharacterMemoryAttributes>({
    intelligence: 50,
    wisdom: 50,
    perception: 50,
    memoryQuality: 0,
    memoryDuration: 0,
    detailPerception: 0,
    modifiers: {
      race: 0,
      class: 0,
      background: 0,
      items: 0,
      abilities: []
    },
    specialAbilities: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attributes');
  const [availableAbilities, setAvailableAbilities] = useState<SpecialAbility[]>([]);
  
  // Hook para salvamento automático
  const { saveData, loadData } = useAutoSave();
  
  // Carregar dados do personagem
  useEffect(() => {
    loadCharacterData();
    loadAvailableAbilities();
  }, [characterId]);
  
  // Recalcular atributos derivados quando os atributos base mudarem
  useEffect(() => {
    calculateDerivedAttributes();
  }, [
    memoryAttributes.intelligence,
    memoryAttributes.wisdom,
    memoryAttributes.perception,
    memoryAttributes.modifiers,
    memoryAttributes.specialAbilities
  ]);
  
  // Carregar dados do personagem
  const loadCharacterData = async () => {
    setIsLoading(true);
    
    try {
      // Carregar dados do personagem do Supabase
      const { data: characterData, error: characterError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();
      
      if (characterError) throw characterError;
      
      if (characterData) {
        setCharacter(characterData);
        
        // Carregar atributos de memória salvos
        const savedMemoryData = await loadData('character_memory', characterId);
        
        if (savedMemoryData) {
          setMemoryAttributes(savedMemoryData);
        } else {
          // Inicializar com valores padrão baseados nos atributos do personagem
          const baseAttributes = {
            intelligence: characterData.attributes?.intelligence || 50,
            wisdom: characterData.attributes?.wisdom || 50,
            perception: characterData.attributes?.perception || 50,
            memoryQuality: 0,
            memoryDuration: 0,
            detailPerception: 0,
            modifiers: {
              race: getRaceModifier(characterData.race),
              class: getClassModifier(characterData.class),
              background: getBackgroundModifier(characterData.background),
              items: calculateItemsModifier(characterData.items || []),
              abilities: []
            },
            specialAbilities: []
          };
          
          setMemoryAttributes(baseAttributes);
          calculateDerivedAttributes(baseAttributes);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do personagem:', error);
      toast.error('Erro ao carregar dados do personagem');
    }
    
    setIsLoading(false);
  };
  
  // Carregar habilidades disponíveis
  const loadAvailableAbilities = async () => {
    try {
      // Carregar habilidades de memória disponíveis do Supabase
      const { data, error } = await supabase
        .from('memory_abilities')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        setAvailableAbilities(data);
      }
    } catch (error) {
      console.error('Erro ao carregar habilidades disponíveis:', error);
    }
  };
  
  // Calcular atributos derivados
  const calculateDerivedAttributes = (attributes = memoryAttributes) => {
    // Fórmulas para cálculo dos atributos derivados
    
    // 1. Qualidade da Memória = Base + (Inteligência * 0.5) + Modificadores
    const baseQuality = 30; // Valor base
    let memoryQuality = baseQuality + (attributes.intelligence * 0.5);
    
    // 2. Duração da Memória = Base + (Sabedoria * 0.6) + Modificadores
    const baseDuration = 20; // Valor base
    let memoryDuration = baseDuration + (attributes.wisdom * 0.6);
    
    // 3. Percepção de Detalhes = Base + (Percepção * 0.5) + Modificadores
    const basePerception = 25; // Valor base
    let detailPerception = basePerception + (attributes.perception * 0.5);
    
    // Aplicar modificadores
    const modifiers = attributes.modifiers;
    
    // Modificadores raciais, de classe e background
    memoryQuality += modifiers.race;
    memoryDuration += modifiers.class;
    detailPerception += modifiers.background;
    
    // Modificador de itens (distribuído entre os três atributos)
    const itemModifier = modifiers.items / 3;
    memoryQuality += itemModifier;
    memoryDuration += itemModifier;
    detailPerception += itemModifier;
    
    // Aplicar efeitos de habilidades especiais
    attributes.specialAbilities.forEach(ability => {
      switch (ability.effect.type) {
        case 'quality':
          memoryQuality += ability.effect.value;
          break;
        case 'duration':
          memoryDuration += ability.effect.value;
          break;
        case 'perception':
          detailPerception += ability.effect.value;
          break;
      }
    });
    
    // Garantir que os valores estejam dentro dos limites (0-100)
    memoryQuality = Math.max(0, Math.min(100, memoryQuality));
    memoryDuration = Math.max(0, Math.min(100, memoryDuration));
    detailPerception = Math.max(0, Math.min(100, detailPerception));
    
    // Atualizar estado
    const updatedAttributes = {
      ...attributes,
      memoryQuality: Math.round(memoryQuality),
      memoryDuration: Math.round(memoryDuration),
      detailPerception: Math.round(detailPerception)
    };
    
    setMemoryAttributes(updatedAttributes);
    
    // Notificar sobre a atualização
    if (onUpdate) {
      onUpdate(updatedAttributes);
    }
    
    // Salvar dados atualizados
    saveMemoryAttributes(updatedAttributes);
  };
  
  // Salvar atributos de memória
  const saveMemoryAttributes = async (attributes = memoryAttributes) => {
    try {
      await saveData('character_memory', {
        id: characterId,
        data: attributes
      });
    } catch (error) {
      console.error('Erro ao salvar atributos de memória:', error);
    }
  };
  
  // Atualizar um atributo
  const updateAttribute = (attribute: keyof CharacterMemoryAttributes, value: string | number | boolean | null) => {
    setMemoryAttributes(prev => ({
      ...prev,
      [attribute]: value
    }));
  };
  
  // Adicionar uma habilidade especial
  const addSpecialAbility = (abilityId: string) => {
    const ability = availableAbilities.find(a => a.id === abilityId);
    if (!ability) return;
    
    // Verificar se o personagem já tem esta habilidade
    if (memoryAttributes.specialAbilities.some(a => a.id === abilityId)) {
      toast.error('O personagem já possui esta habilidade');
      return;
    }
    
    // Verificar pré-requisitos
    if (ability.prerequisites) {
      const meetsPrerequisites = ability.prerequisites.every(prereq => {
        const attributeValue = memoryAttributes[prereq.attribute as keyof CharacterMemoryAttributes];
        return typeof attributeValue === 'number' && attributeValue >= prereq.minValue;
      });
      
      if (!meetsPrerequisites) {
        toast.error('O personagem não atende aos pré-requisitos para esta habilidade');
        return;
      }
    }
    
    // Adicionar habilidade
    setMemoryAttributes(prev => ({
      ...prev,
      specialAbilities: [...prev.specialAbilities, ability]
    }));
    
    toast.success(`Habilidade ${ability.name} adicionada`);
  };
  
  // Remover uma habilidade especial
  const removeSpecialAbility = (abilityId: string) => {
    setMemoryAttributes(prev => ({
      ...prev,
      specialAbilities: prev.specialAbilities.filter(a => a.id !== abilityId)
    }));
  };
  
  // Utilitários para calcular modificadores
  const getRaceModifier = (race: string): number => {
    // Valores de exemplo para diferentes raças
    const raceModifiers: Record<string, number> = {
      'elf': 10, // Elfos têm melhor memória
      'dwarf': 5, // Anões têm boa memória para estruturas
      'human': 0, // Humanos são a base de comparação
      'halfling': 3, // Halflings têm boa percepção
      'gnome': 8, // Gnomos têm boa memória para detalhes
      'half-orc': -5, // Half-orcs têm memória um pouco pior
      'tiefling': 2, // Tieflings têm memória ligeiramente melhor
      'dragonborn': 0 // Dragonborn são neutros
    };
    
    return raceModifiers[race] || 0;
  };
  
  const getClassModifier = (characterClass: string): number => {
    // Valores de exemplo para diferentes classes
    const classModifiers: Record<string, number> = {
      'wizard': 15, // Magos têm excelente memória
      'rogue': 10, // Ladinos têm boa memória para detalhes
      'ranger': 8, // Rangers têm boa memória para terrenos
      'fighter': 0, // Guerreiros são a base de comparação
      'barbarian': -5, // Bárbaros têm memória um pouco pior
      'cleric': 5, // Clérigos têm boa memória
      'druid': 7, // Druidas têm boa memória para ambientes naturais
      'bard': 12, // Bardos têm excelente memória para histórias e detalhes
      'monk': 10, // Monges têm boa memória devido à meditação
      'paladin': 3, // Paladinos têm memória ligeiramente melhor
      'sorcerer': 5, // Feiticeiros têm memória razoável
      'warlock': 7 // Bruxos têm boa memória devido aos pactos
    };
    
    return classModifiers[characterClass] || 0;
  };
  
  const getBackgroundModifier = (background: string): number => {
    // Valores de exemplo para diferentes backgrounds
    const backgroundModifiers: Record<string, number> = {
      'sage': 15, // Sábios têm excelente memória
      'scholar': 12, // Estudiosos têm muito boa memória
      'criminal': 5, // Criminosos têm boa memória para detalhes
      'soldier': 0, // Soldados são a base de comparação
      'outlander': -3, // Forasteiros têm memória um pouco pior para ambientes urbanos
      'noble': 3, // Nobres têm memória ligeiramente melhor
      'acolyte': 7, // Acólitos têm boa memória para textos
      'guild_artisan': 5, // Artesãos têm boa memória para detalhes
      'hermit': 10, // Eremitas têm boa memória devido à contemplação
      'sailor': 2, // Marinheiros têm memória ligeiramente melhor
      'urchin': 3, // Órfãos têm memória ligeiramente melhor para sobrevivência
      'entertainer': 8 // Artistas têm boa memória para performances
    };
    
    return backgroundModifiers[background] || 0;
  };
  
  const calculateItemsModifier = (items: { effects?: { memory?: number } }[]): number => {
    if (!items || !Array.isArray(items)) return 0;
    
    // Calcular modificador com base nos itens equipados
    let totalModifier = 0;
    items.forEach(item => {
      // Verificar se o item afeta a memória
      if (item.effects?.memory) {
        totalModifier += item.effects.memory;
      }
    });
    
    return totalModifier;
  };
  
  if (isLoading) {
    return <div className="p-4">Carregando dados de memória do personagem...</div>;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sistema de Memória do Personagem</CardTitle>
        <CardDescription>
          Configure os atributos que afetam a memória do personagem e suas habilidades especiais.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attributes">Atributos</TabsTrigger>
            <TabsTrigger value="abilities">Habilidades</TabsTrigger>
            <TabsTrigger value="summary">Resumo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="attributes" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="intelligence">Inteligência ({memoryAttributes.intelligence})</Label>
                <Slider
                  id="intelligence"
                  min={0}
                  max={100}
                  step={1}
                  value={[memoryAttributes.intelligence]}
                  onValueChange={values => updateAttribute('intelligence', values[0])}
                  disabled={!isGM}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Afeta a qualidade inicial da memória
                </p>
              </div>
              
              <div>
                <Label htmlFor="wisdom">Sabedoria ({memoryAttributes.wisdom})</Label>
                <Slider
                  id="wisdom"
                  min={0}
                  max={100}
                  step={1}
                  value={[memoryAttributes.wisdom]}
                  onValueChange={values => updateAttribute('wisdom', values[0])}
                  disabled={!isGM}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Afeta a duração da memória
                </p>
              </div>
              
              <div>
                <Label htmlFor="perception">Percepção ({memoryAttributes.perception})</Label>
                <Slider
                  id="perception"
                  min={0}
                  max={100}
                  step={1}
                  value={[memoryAttributes.perception]}
                  onValueChange={values => updateAttribute('perception', values[0])}
                  disabled={!isGM}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Afeta a capacidade de ver detalhes em baixa luz
                </p>
              </div>
              
              {isGM && (
                <div className="pt-4">
                  <h3 className="text-lg font-medium">Modificadores</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="race-modifier">Modificador Racial</Label>
                      <Input
                        id="race-modifier"
                        type="number"
                        value={memoryAttributes.modifiers.race}
                        onChange={e => {
                          const value = parseInt(e.target.value) || 0;
                          setMemoryAttributes(prev => ({
                            ...prev,
                            modifiers: {
                              ...prev.modifiers,
                              race: value
                            }
                          }));
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="class-modifier">Modificador de Classe</Label>
                      <Input
                        id="class-modifier"
                        type="number"
                        value={memoryAttributes.modifiers.class}
                        onChange={e => {
                          const value = parseInt(e.target.value) || 0;
                          setMemoryAttributes(prev => ({
                            ...prev,
                            modifiers: {
                              ...prev.modifiers,
                              class: value
                            }
                          }));
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="background-modifier">Modificador de Background</Label>
                      <Input
                        id="background-modifier"
                        type="number"
                        value={memoryAttributes.modifiers.background}
                        onChange={e => {
                          const value = parseInt(e.target.value) || 0;
                          setMemoryAttributes(prev => ({
                            ...prev,
                            modifiers: {
                              ...prev.modifiers,
                              background: value
                            }
                          }));
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="items-modifier">Modificador de Itens</Label>
                      <Input
                        id="items-modifier"
                        type="number"
                        value={memoryAttributes.modifiers.items}
                        onChange={e => {
                          const value = parseInt(e.target.value) || 0;
                          setMemoryAttributes(prev => ({
                            ...prev,
                            modifiers: {
                              ...prev.modifiers,
                              items: value
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="abilities" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Habilidades Atuais</h3>
                {memoryAttributes.specialAbilities.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    O personagem não possui habilidades especiais de memória.
                  </p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {memoryAttributes.specialAbilities.map(ability => (
                      <Card key={ability.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{ability.name}</h4>
                            <p className="text-sm">{ability.description}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Efeito: {ability.effect.value > 0 ? '+' : ''}{ability.effect.value} em {{
                                quality: 'Qualidade da Memória',
                                duration: 'Duração da Memória',
                                perception: 'Percepção de Detalhes'
                              }[ability.effect.type]}
                            </p>
                          </div>
                          {isGM && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeSpecialAbility(ability.id)}
                            >
                              Remover
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              {isGM && (
                <div className="pt-4">
                  <h3 className="text-lg font-medium">Adicionar Habilidade</h3>
                  <div className="flex gap-2 mt-2">
                    <Select onValueChange={addSpecialAbility}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma habilidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAbilities
                          .filter(ability => !memoryAttributes.specialAbilities.some(a => a.id === ability.id))
                          .map(ability => (
                            <SelectItem key={ability.id} value={ability.id}>
                              {ability.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Atributos Derivados</h3>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <Card className="p-3">
                    <h4 className="font-medium">Qualidade da Memória</h4>
                    <div className="text-2xl font-bold">{memoryAttributes.memoryQuality}</div>
                    <p className="text-sm text-muted-foreground">
                      Determina o nível de detalhe inicial ao memorizar uma área
                    </p>
                  </Card>
                  
                  <Card className="p-3">
                    <h4 className="font-medium">Duração da Memória</h4>
                    <div className="text-2xl font-bold">{memoryAttributes.memoryDuration}</div>
                    <p className="text-sm text-muted-foreground">
                      Determina quanto tempo a memória permanece nítida
                    </p>
                  </Card>
                  
                  <Card className="p-3">
                    <h4 className="font-medium">Percepção de Detalhes</h4>
                    <div className="text-2xl font-bold">{memoryAttributes.detailPerception}</div>
                    <p className="text-sm text-muted-foreground">
                      Determina a capacidade de perceber detalhes em condições adversas
                    </p>
                  </Card>
                </div>
              </div>
              
              <div className="pt-4">
                <h3 className="text-lg font-medium">Efeitos no Jogo</h3>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>
                    <span className="font-medium">Taxa de Desvanecimento:</span> {100 - memoryAttributes.memoryDuration}% da taxa normal
                  </li>
                  <li>
                    <span className="font-medium">Qualidade Inicial da Memória:</span> {memoryAttributes.memoryQuality}% de detalhes preservados
                  </li>
                  <li>
                    <span className="font-medium">Visão em Baixa Luz:</span> Percebe detalhes com até {memoryAttributes.detailPerception}% de escuridão
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={loadCharacterData}>
          Recarregar
        </Button>
        <Button onClick={() => saveMemoryAttributes()}>
          Salvar Alterações
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CharacterMemorySystem;