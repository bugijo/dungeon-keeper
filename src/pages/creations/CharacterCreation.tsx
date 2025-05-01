
// Since this file is very long, I'll only modify the relevant part with the type errors

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

const characterArchetypes = [
  { 
    name: 'Clérigo', 
    description: 'Portador de um cajado sagrado, dedicado a servir sua divindade',
    imageUrl: '/lovable-uploads/474a96aa-79a3-40c1-96e2-1d95a6be7b5e.png'
  },
  { 
    name: 'Mago', 
    description: 'Conjurador de magias, dominando as energias arcanas',
    imageUrl: '/lovable-uploads/474a96aa-79a3-40c1-96e2-1d95a6be7b5e.png'
  },
  { 
    name: 'Guerreiro', 
    description: 'Combatente habilidoso, maestro em armas e estratégia',
    imageUrl: '/lovable-uploads/474a96aa-79a3-40c1-96e2-1d95a6be7b5e.png'
  },
  { 
    name: 'Paladino', 
    description: 'Cavaleiro sagrado, justiceiro e protetor',
    imageUrl: '/lovable-uploads/474a96aa-79a3-40c1-96e2-1d95a6be7b5e.png'
  },
  { 
    name: 'Bárbaro', 
    description: 'Guerreiro selvagem, força bruta e resistência',
    imageUrl: '/lovable-uploads/474a96aa-79a3-40c1-96e2-1d95a6be7b5e.png'
  },
  { 
    name: 'Feiticeiro', 
    description: 'Manipulador de energia mística, com poderes inatos',
    imageUrl: '/lovable-uploads/474a96aa-79a3-40c1-96e2-1d95a6be7b5e.png'
  }
];

const classes = [
  'Bárbaro',
  'Bardo',
  'Clérigo',
  'Druida',
  'Guerreiro',
  'Mago',
  'Monge',
  'Paladino',
  'Ranger',
  'Ladino',
  'Feiticeiro',
  'Bruxo'
];

const races = [
  'Humano',
  'Elfo',
  'Anão',
  'Halfling',
  'Gnomo',
  'Meio-Elfo',
  'Meio-Orc',
  'Tiefling',
  'Draconato'
];

const CharacterCreation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    race: '',
    class: '',
    level: 1,
    background: '',
    alignment: '',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    appearance: '',
    backstory: '',
    imageUrl: '/lovable-uploads/6be414ac-e1d0-4348-8246-9fe914618c47.png',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (isEditing && id) {
      setIsLoading(true);
      const fetchCharacter = async () => {
        try {
          const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('id', id)
            .eq('user_id', user?.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            // Make sure attributes is an object, not an array or other type
            const attributesObj = typeof data.attributes === 'object' && data.attributes !== null && !Array.isArray(data.attributes)
              ? data.attributes
              : {};
              
            setFormData({
              name: data.name || '',
              race: data.race || '',
              class: data.class || '',
              level: data.level || 1,
              background: data.background || '',
              alignment: String(attributesObj.alignment || ''),
              strength: Number(attributesObj.strength || 10),
              dexterity: Number(attributesObj.dexterity || 10),
              constitution: Number(attributesObj.constitution || 10),
              intelligence: Number(attributesObj.intelligence || 10),
              wisdom: Number(attributesObj.wisdom || 10),
              charisma: Number(attributesObj.charisma || 10),
              appearance: String(attributesObj.appearance || ''),
              backstory: data.notes || '',
              imageUrl: String(attributesObj.imageUrl || '/lovable-uploads/6be414ac-e1d0-4348-8246-9fe914618c47.png'),
            });
          }
        } catch (error) {
          console.error('Error fetching character:', error);
          toast.error('Erro ao carregar o personagem');
        } finally {
          setIsLoading(false);
        }
      };
      
      if (user) {
        fetchCharacter();
      }
    }
  }, [id, isEditing, user]);

  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  const handleArchetypeSelect = (archetype: string) => {
    setSelectedArchetype(archetype);
    const selectedType = characterArchetypes.find(type => type.name === archetype);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        class: selectedType.name,
        imageUrl: selectedType.imageUrl
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatChange = (stat, value) => {
    const numValue = parseInt(value);
    if (numValue >= 3 && numValue <= 20) {
      setFormData(prev => ({ ...prev, [stat]: numValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para criar um personagem');
      return;
    }
    
    setIsLoading(true);

    try {
      const characterData = {
        name: formData.name,
        race: formData.race,
        class: formData.class,
        level: formData.level,
        background: formData.background,
        user_id: user.id,
        attributes: {
          strength: formData.strength,
          dexterity: formData.dexterity,
          constitution: formData.constitution,
          intelligence: formData.intelligence,
          wisdom: formData.wisdom,
          charisma: formData.charisma,
          alignment: formData.alignment,
          appearance: formData.appearance,
          imageUrl: formData.imageUrl,
          hp: { current: 10, max: 10 },
          ac: 10,
          speed: 30,
          initiative: 0,
          skills: [
            { name: 'Atletismo', proficient: false, value: 0 }
          ]
        },
        notes: formData.backstory
      };
      
      let result;
      
      if (isEditing) {
        result = await supabase
          .from('characters')
          .update(characterData)
          .eq('id', id)
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('characters')
          .insert(characterData);
      }
      
      if (result.error) throw result.error;
      
      toast.success(isEditing ? 'Personagem atualizado com sucesso!' : 'Personagem criado com sucesso!');
      navigate('/character');
    } catch (error) {
      console.error('Error saving character:', error);
      toast.error('Erro ao salvar personagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateModifier = (stat) => {
    return Math.floor((stat - 10) / 2);
  };

  const formatModifier = (mod) => {
    return mod >= 0 ? `+${mod}` : mod.toString();
  };

  if (isLoading && isEditing) {
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

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-medievalsharp text-fantasy-gold mb-6">
          {isEditing ? 'Editar Personagem' : 'Criar Novo Personagem'}
        </h1>

        <div className="mb-6">
          <h2 className="text-xl font-medievalsharp text-fantasy-stone mb-4">Escolha seu Arquétipo</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {characterArchetypes.map((archetype) => (
              <div 
                key={archetype.name}
                onClick={() => handleArchetypeSelect(archetype.name)}
                className={`
                  fantasy-card p-4 cursor-pointer transition-all 
                  ${selectedArchetype === archetype.name ? 'border-2 border-fantasy-purple' : ''}
                `}
              >
                <div className="flex items-center">
                  <img 
                    src={archetype.imageUrl} 
                    alt={archetype.name} 
                    className="w-16 h-16 object-cover mr-4 rounded-full"
                  />
                  <div>
                    <h3 className="font-medievalsharp text-white">{archetype.name}</h3>
                    <p className="text-sm text-fantasy-stone">{archetype.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedArchetype && (
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="stats">Atributos</TabsTrigger>
                <TabsTrigger value="description">Descrição</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="fantasy-card p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Nome do Personagem</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="level">Nível</Label>
                    <Input
                      id="level"
                      name="level"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="race">Raça</Label>
                    <Select
                      value={formData.race}
                      onValueChange={(value) => handleSelectChange('race', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione uma raça" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {races.map((race) => (
                            <SelectItem key={race} value={race}>
                              {race}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="class">Classe</Label>
                    <Select
                      value={formData.class}
                      onValueChange={(value) => handleSelectChange('class', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione uma classe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>
                              {cls}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="background">Antecedente</Label>
                    <Input
                      id="background"
                      name="background"
                      value={formData.background}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="alignment">Alinhamento</Label>
                    <Input
                      id="alignment"
                      name="alignment"
                      value={formData.alignment}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="fantasy-card p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((stat) => (
                    <div key={stat} className="text-center">
                      <Label htmlFor={stat} className="block mb-2 capitalize">
                        {stat === 'strength' && 'Força'}
                        {stat === 'dexterity' && 'Destreza'}
                        {stat === 'constitution' && 'Constituição'}
                        {stat === 'intelligence' && 'Inteligência'}
                        {stat === 'wisdom' && 'Sabedoria'}
                        {stat === 'charisma' && 'Carisma'}
                      </Label>
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatChange(stat, formData[stat] - 1)}
                          disabled={formData[stat] <= 3}
                          className="h-8 w-8 p-0"
                        >
                          -
                        </Button>
                        <Input
                          id={stat}
                          name={stat}
                          type="number"
                          min="3"
                          max="20"
                          value={formData[stat]}
                          onChange={(e) => handleStatChange(stat, e.target.value)}
                          className="mx-2 w-16 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatChange(stat, formData[stat] + 1)}
                          disabled={formData[stat] >= 20}
                          className="h-8 w-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                      <div className="mt-2 text-fantasy-gold font-medievalsharp">
                        {formatModifier(calculateModifier(formData[stat]))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="description" className="fantasy-card p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label htmlFor="appearance">Aparência</Label>
                    <Textarea
                      id="appearance"
                      name="appearance"
                      value={formData.appearance}
                      onChange={handleInputChange}
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="backstory">História de Fundo</Label>
                    <Textarea
                      id="backstory"
                      name="backstory"
                      value={formData.backstory}
                      onChange={handleInputChange}
                      className="mt-1"
                      rows={8}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mb-6">
              <Label>Imagem do Personagem</Label>
              <div className="flex items-center space-x-4">
                <img 
                  src={formData.imageUrl} 
                  alt="Personagem" 
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    toast.info('Funcionalidade de upload de imagem em desenvolvimento');
                  }}
                >
                  Alterar Imagem
                </Button>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/character')}
              >
                Cancelar
              </Button>
              
              <div className="flex gap-2">
                {activeTab !== 'basic' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab(activeTab === 'stats' ? 'basic' : 'stats')}
                  >
                    Anterior
                  </Button>
                )}
                
                {activeTab !== 'description' ? (
                  <Button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'basic' ? 'stats' : 'description')}
                    className="fantasy-button secondary"
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="fantasy-button primary"
                  >
                    {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Personagem' : 'Criar Personagem'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
};

export default CharacterCreation;
