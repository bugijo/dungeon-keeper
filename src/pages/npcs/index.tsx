import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NPCService, NPC } from '@/services/npcAiService';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';

const NPCsPage: React.FC = () => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedNpc, setEditedNpc] = useState<Partial<NPC>>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadNpcs();

    // Inscrever para atualizações em tempo real
    const subscription = NPCService.subscribeToUserNPCs(user.id, () => {
      loadNpcs();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, navigate]);

  const loadNpcs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userNpcs = await NPCService.getUserNPCs(user.id);
      setNpcs(userNpcs);
    } catch (error) {
      console.error('Erro ao carregar NPCs:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os NPCs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNPC = async () => {
    if (!user || !prompt.trim()) return;

    try {
      setGenerating(true);
      const npc = await NPCService.generateNpcWithAI(prompt, user.id);
      setNpcs([npc, ...npcs]);
      setPrompt('');
      toast({
        title: 'Sucesso!',
        description: `NPC ${npc.name} gerado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao gerar NPC:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o NPC',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectNpc = (npc: NPC) => {
    setSelectedNpc(npc);
    setEditMode(false);
  };

  const handleEditMode = () => {
    if (!selectedNpc) return;
    setEditMode(true);
    setEditedNpc({
      name: selectedNpc.name,
      description: selectedNpc.description,
      personality: selectedNpc.personality,
      appearance: selectedNpc.appearance,
      background: selectedNpc.background,
      goals: selectedNpc.goals,
      secrets: selectedNpc.secrets
    });
  };

  const handleUpdateNpc = async () => {
    if (!selectedNpc || !editedNpc.name) return;

    try {
      const updatedNpc = await NPCService.updateNPC(selectedNpc.id, editedNpc);
      setNpcs(npcs.map(npc => npc.id === updatedNpc.id ? updatedNpc : npc));
      setSelectedNpc(updatedNpc);
      setEditMode(false);
      toast({
        title: 'Sucesso!',
        description: `NPC ${updatedNpc.name} atualizado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao atualizar NPC:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o NPC',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteNpc = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este NPC?')) return;

    try {
      await NPCService.deleteNPC(id);
      setNpcs(npcs.filter(npc => npc.id !== id));
      if (selectedNpc?.id === id) {
        setSelectedNpc(null);
        setEditMode(false);
      }
      toast({
        title: 'Sucesso!',
        description: 'NPC excluído com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao excluir NPC:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o NPC',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedNpc(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gerador de NPCs com IA</h1>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="generate">Gerar NPC</TabsTrigger>
          <TabsTrigger value="collection">Minha Coleção</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Novo NPC</CardTitle>
              <CardDescription>
                Descreva o tipo de NPC que você deseja criar e a IA irá gerá-lo para você.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ex: Um mercador anão idoso com um passado misterioso e conexões com a nobreza local."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="mb-4"
              />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateNPC} 
                disabled={generating || !prompt.trim()}
                className="w-full"
              >
                {generating ? <Spinner /> : 'Gerar NPC'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="collection" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-4">
              <h2 className="text-xl font-semibold">Meus NPCs</h2>
              {loading ? (
                <div className="flex justify-center p-4">
                  <Spinner />
                </div>
              ) : npcs.length === 0 ? (
                <p className="text-muted-foreground">Você ainda não tem NPCs. Gere seu primeiro NPC!</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {npcs.map((npc) => (
                    <Card 
                      key={npc.id} 
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${selectedNpc?.id === npc.id ? 'border-primary' : ''}`}
                      onClick={() => handleSelectNpc(npc)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{npc.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {npc.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              {selectedNpc ? (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{editMode ? 'Editar NPC' : selectedNpc.name}</CardTitle>
                      {!editMode && (
                        <CardDescription>
                          Criado em {new Date(selectedNpc.created_at).toLocaleDateString()}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {editMode ? (
                        <>
                          <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                          <Button onClick={handleUpdateNpc}>Salvar</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" onClick={handleEditMode}>Editar</Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => handleDeleteNpc(selectedNpc.id)}
                          >
                            Excluir
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editMode ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Nome</label>
                          <Input 
                            name="name" 
                            value={editedNpc.name || ''} 
                            onChange={handleInputChange} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Descrição</label>
                          <Textarea 
                            name="description" 
                            value={editedNpc.description || ''} 
                            onChange={handleInputChange} 
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Personalidade</label>
                          <Textarea 
                            name="personality" 
                            value={editedNpc.personality || ''} 
                            onChange={handleInputChange} 
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Aparência</label>
                          <Textarea 
                            name="appearance" 
                            value={editedNpc.appearance || ''} 
                            onChange={handleInputChange} 
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">História</label>
                          <Textarea 
                            name="background" 
                            value={editedNpc.background || ''} 
                            onChange={handleInputChange} 
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Objetivos</label>
                          <Textarea 
                            name="goals" 
                            value={editedNpc.goals || ''} 
                            onChange={handleInputChange} 
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Segredos</label>
                          <Textarea 
                            name="secrets" 
                            value={editedNpc.secrets || ''} 
                            onChange={handleInputChange} 
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Descrição</h3>
                          <p className="text-sm">{selectedNpc.description}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Personalidade</h3>
                          <p className="text-sm">{selectedNpc.personality}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Aparência</h3>
                          <p className="text-sm">{selectedNpc.appearance}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">História</h3>
                          <p className="text-sm">{selectedNpc.background}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Objetivos</h3>
                          <p className="text-sm">{selectedNpc.goals}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Segredos</h3>
                          <p className="text-sm">{selectedNpc.secrets}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
                    <p className="text-muted-foreground mb-4">Selecione um NPC para visualizar seus detalhes ou gere um novo NPC.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => document.querySelector('[data-value="generate"]')?.click()}
                    >
                      Gerar Novo NPC
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NPCsPage;