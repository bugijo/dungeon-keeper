import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DND5E_CLASSES, DND5E_SKILLS } from '@/constants/DnD5eData';

interface CharacterClassEditorProps {
  selectedClass: string;
  level: number;
  onClassChange: (className: string) => void;
  onLevelChange: (level: number) => void;
  onFeatureSelect?: (feature: any) => void;
}

const CharacterClassEditor: React.FC<CharacterClassEditorProps> = ({
  selectedClass,
  level,
  onClassChange,
  onLevelChange,
  onFeatureSelect
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [classDetails, setClassDetails] = useState<any>(null);
  const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);

  // Encontrar a classe selecionada nos dados de D&D 5e
  useEffect(() => {
    const classData = DND5E_CLASSES.find(c => c.name === selectedClass);
    setClassDetails(classData || null);
    
    // Filtrar características disponíveis pelo nível atual
    if (classData) {
      const features = classData.features.filter(f => f.level <= level);
      setAvailableFeatures(features);
    } else {
      setAvailableFeatures([]);
    }
  }, [selectedClass, level]);

  const handleLevelChange = (newLevel: number) => {
    if (newLevel >= 1 && newLevel <= 20) {
      onLevelChange(newLevel);
    }
  };

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border-fantasy-gold/30">
      <CardHeader>
        <CardTitle className="text-fantasy-gold font-medievalsharp">Classe e Habilidades</CardTitle>
        <CardDescription>Escolha sua classe e veja suas habilidades especiais</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Classe</label>
            <Select value={selectedClass} onValueChange={onClassChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DND5E_CLASSES.map((classOption) => (
                    <SelectItem key={classOption.id} value={classOption.name}>
                      {classOption.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Nível</label>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleLevelChange(level - 1)}
                disabled={level <= 1}
              >
                -
              </Button>
              <span className="text-xl font-medievalsharp w-8 text-center">{level}</span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleLevelChange(level + 1)}
                disabled={level >= 20}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {classDetails && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="features">Características</TabsTrigger>
              <TabsTrigger value="proficiencies">Proficiências</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4">
              <div className="bg-card/30 p-4 rounded-md">
                <h3 className="text-lg font-medievalsharp text-fantasy-gold mb-2">{classDetails.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{classDetails.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Dado de Vida:</span> {classDetails.hitDie}
                  </div>
                  <div>
                    <span className="font-medium">Habilidade Principal:</span> {classDetails.primaryAbility}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="space-y-4">
              {availableFeatures.length > 0 ? (
                <div className="space-y-3">
                  {availableFeatures.map((feature, index) => (
                    <div 
                      key={index} 
                      className="bg-card/30 p-3 rounded-md hover:bg-card/50 transition-colors"
                      onClick={() => onFeatureSelect && onFeatureSelect(feature)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medievalsharp text-fantasy-gold">{feature.name}</h4>
                        <Badge variant="outline">Nível {feature.level}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Selecione uma classe para ver suas características</p>
              )}
            </TabsContent>
            
            <TabsContent value="proficiencies" className="space-y-4">
              {classDetails && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Testes de Resistência</h4>
                    <div className="flex flex-wrap gap-2">
                      {classDetails.savingThrows.map((save: string, index: number) => (
                        <Badge key={index} variant="secondary">{save}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Perícias Sugeridas</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {DND5E_SKILLS
                        .filter(skill => {
                          // Filtrar perícias relevantes para a classe
                          const primaryAbility = classDetails.primaryAbility;
                          if (primaryAbility.includes('ou')) {
                            const abilities = primaryAbility.split(' ou ');
                            return abilities.some(a => skill.ability === a.trim());
                          }
                          return skill.ability === primaryAbility;
                        })
                        .map(skill => (
                          <div key={skill.id} className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">{skill.ability}</Badge>
                            <span>{skill.name}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default CharacterClassEditor;