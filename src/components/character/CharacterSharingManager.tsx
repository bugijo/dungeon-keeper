import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Share, Download, Copy, Save, Link, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Character, CharacterService } from '@/services/characterService';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Propriedades do componente
interface CharacterSharingManagerProps {
  characterId?: string;
  onSave?: (character: Character) => void;
  onLoad?: (characterId: string) => void;
}

const CharacterSharingManager: React.FC<CharacterSharingManagerProps> = ({
  characterId,
  onSave,
  onLoad
}) => {
  const [activeTab, setActiveTab] = useState('meus-personagens');
  const [myCharacters, setMyCharacters] = useState<Character[]>([]);
  const [publicCharacters, setPublicCharacters] = useState<Character[]>([]);
  const [sharedCharacters, setSharedCharacters] = useState<Character[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const userId = user?.id || 'user-1'; // Fallback para o exemplo

  // Carregar personagens do usuário
  useEffect(() => {
    const loadCharacters = async () => {
      setIsLoading(true);
      try {
        // Carregar personagens usando o serviço
        const myChars = await CharacterService.getUserCharacters(userId);
        const publicChars = await CharacterService.getPublicCharacters();
        const sharedChars = await CharacterService.getSharedCharacters(userId);
        
        setMyCharacters(myChars);
        setPublicCharacters(publicChars);
        setSharedCharacters(sharedChars);
      } catch (error) {
        console.error('Erro ao carregar personagens:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar seus personagens.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacters();
  }, [userId]);

  // Filtrar personagens com base no termo de pesquisa
  const filteredCharacters = (characters: Character[]) => {
    if (!searchTerm) return characters;
    
    return characters.filter(char => 
      char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.race.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Compartilhar personagem
  const handleShareCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setShareLink(CharacterService.getShareLink(character.id));
    setShareDialogOpen(true);
  };

  // Copiar link de compartilhamento
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
  };

  // Compartilhar por email
  const handleShareByEmail = async () => {
    if (!shareEmail || !selectedCharacter) {
      toast({
        title: 'Atenção',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await CharacterService.shareCharacterByEmail(selectedCharacter.id, shareEmail);
      toast({
        title: 'Personagem compartilhado!',
        description: `Um convite foi enviado para ${shareEmail}.`,
      });
      setShareEmail('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível compartilhar o personagem.',
        variant: 'destructive'
      });
    }
  };

  // Tornar personagem público/privado
  const togglePublicStatus = async (character: Character) => {
    try {
      // Usar o serviço para alterar a visibilidade
      const updatedCharacter = await CharacterService.toggleCharacterVisibility(character.id);
      
      // Atualizar a lista de personagens
      setMyCharacters(myCharacters.map(char => 
        char.id === character.id ? updatedCharacter : char
      ));

      toast({
        title: updatedCharacter.isPublic ? 'Personagem público' : 'Personagem privado',
        description: updatedCharacter.isPublic 
          ? 'Seu personagem agora está visível para todos os usuários.' 
          : 'Seu personagem agora está visível apenas para você.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a visibilidade do personagem.',
        variant: 'destructive'
      });
    }
  };

  // Carregar um personagem
  const handleLoadCharacter = (character: Character) => {
    if (onLoad) {
      onLoad(character.id);
      toast({
        title: 'Personagem carregado',
        description: `${character.name} foi carregado com sucesso.`,
      });
    }
  };

  // Salvar personagem atual
  const handleSaveCurrentCharacter = async () => {
    if (!characterId) {
      toast({
        title: 'Erro',
        description: 'Nenhum personagem selecionado para salvar.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Buscar o personagem atual
      const currentCharacter = await CharacterService.getCharacterById(characterId);
      
      if (currentCharacter) {
        // Salvar o personagem usando o serviço
        const savedCharacter = await CharacterService.saveCharacter(currentCharacter);
        
        // Atualizar a lista de personagens
        setMyCharacters(myCharacters.map(char => 
          char.id === characterId ? savedCharacter : char
        ));
        
        toast({
          title: 'Personagem salvo',
          description: 'Seu personagem foi salvo com sucesso.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o personagem.',
        variant: 'destructive'
      });
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Renderizar card de personagem
  const renderCharacterCard = (character: Character, showOwner: boolean = false) => (
    <div key={character.id} className="bg-card/30 p-4 rounded-lg border border-fantasy-gold/20 hover:border-fantasy-gold/40 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-medievalsharp text-fantasy-gold">{character.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{character.race}</span>
            <span>•</span>
            <span>{character.class} Nível {character.level}</span>
          </div>
          {showOwner && (
            <div className="text-xs text-muted-foreground mt-1">
              Criado por: {character.ownerName}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {character.isPublic && (
            <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-500/30">
              Público
            </Badge>
          )}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mb-3">
        <div>Antecedente: {character.background}</div>
        <div>Atualizado em: {formatDate(character.updatedAt)}</div>
      </div>
      
      <div className="flex justify-end gap-2 mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-2"
          onClick={() => handleLoadCharacter(character)}
        >
          <Download className="h-4 w-4 mr-1" />
          Carregar
        </Button>
        
        {character.ownerId === 'user-1' && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => togglePublicStatus(character)}
            >
              {character.isPublic ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Tornar Privado
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Tornar Público
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => handleShareCharacter(character)}
            >
              <Share className="h-4 w-4 mr-1" />
              Compartilhar
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border-fantasy-gold/30">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-fantasy-gold font-medievalsharp">Biblioteca de Personagens</CardTitle>
            <CardDescription>Gerencie, compartilhe e descubra personagens</CardDescription>
          </div>
          
          {characterId && (
            <Button 
              variant="default" 
              className="bg-fantasy-gold hover:bg-fantasy-gold/80 text-black"
              onClick={handleSaveCurrentCharacter}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Personagem Atual
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <Input 
            placeholder="Pesquisar personagens..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-card/30 border-fantasy-gold/20"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="meus-personagens">Meus Personagens</TabsTrigger>
            <TabsTrigger value="compartilhados">Compartilhados Comigo</TabsTrigger>
            <TabsTrigger value="biblioteca">Biblioteca Pública</TabsTrigger>
          </TabsList>
          
          <TabsContent value="meus-personagens" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando personagens...</div>
            ) : filteredCharacters(myCharacters).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCharacters(myCharacters).map(character => renderCharacterCard(character))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum personagem encontrado com esses termos.' : 'Você ainda não criou nenhum personagem.'}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="compartilhados" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando personagens...</div>
            ) : filteredCharacters(sharedCharacters).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCharacters(sharedCharacters).map(character => renderCharacterCard(character, true))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum personagem encontrado com esses termos.' : 'Nenhum personagem foi compartilhado com você ainda.'}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="biblioteca" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando personagens...</div>
            ) : filteredCharacters(publicCharacters).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCharacters(publicCharacters).map(character => renderCharacterCard(character, true))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum personagem encontrado com esses termos.' : 'Não há personagens públicos disponíveis no momento.'}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Diálogo de compartilhamento */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-card border-fantasy-gold/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-fantasy-gold font-medievalsharp">Compartilhar Personagem</DialogTitle>
            <DialogDescription>
              Compartilhe {selectedCharacter?.name} com outros jogadores
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Link de compartilhamento</h4>
              <div className="flex items-center space-x-2">
                <Input 
                  value={shareLink} 
                  readOnly 
                  className="bg-card/30 border-fantasy-gold/20"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleCopyLink}
                  className={linkCopied ? 'text-green-500 border-green-500' : ''}
                >
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Compartilhar por email</h4>
              <div className="flex items-center space-x-2">
                <Input 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="bg-card/30 border-fantasy-gold/20"
                />
                <Button 
                  variant="outline" 
                  onClick={handleShareByEmail}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CharacterSharingManager;