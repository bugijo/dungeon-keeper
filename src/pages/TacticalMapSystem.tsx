import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import EnhancedTacticalMap from '@/components/maps/EnhancedTacticalMap';
import TutorialSystem from '@/components/tutorial/TutorialSystem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Shield, Sword, HelpCircle, Save, Download, ArrowLeft, Share, Copy, Ruler, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { mapService, TacticalMap, MapToken, RevealedArea } from '@/services/mapService';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Dados de exemplo para demonstração
const demoMapUrl = '/lovable-uploads/03a33b04-e3b4-4b96-b0ab-e978d67fe3ee.png';

// Adaptação dos tokens para o formato do componente
const demoTokens = [
  { id: '1', x: 150, y: 150, size: 40, color: '#ff5500', label: 'P1', ownerId: 'current-user-id' },
  { id: '2', x: 250, y: 150, size: 40, color: '#0055ff', label: 'P2', ownerId: 'player-2' },
  { id: '3', x: 200, y: 250, size: 40, color: '#55ff00', label: 'P3', ownerId: 'player-3' },
  { id: '4', x: 350, y: 350, size: 50, color: '#ff0000', label: 'M1', ownerId: 'gm' },
];

const demoRevealedAreas = [
  { x: 150, y: 150, radius: 150 },
  { x: 350, y: 350, radius: 100 },
];

// Interface para mapas adaptada para o componente
interface ComponentMap {
  id: string;
  name: string;
  description: string;
  mapUrl: string;
  tokens: {
    id: string;
    x: number;
    y: number;
    size: number;
    color: string;
    label: string;
    ownerId: string;
  }[];
  revealedAreas: {
    x: number;
    y: number;
    radius: number;
  }[];
  createdAt: string;
  createdBy: string;
}

const TacticalMapSystem: React.FC = () => {
  const [isGM, setIsGM] = useState(false);
  const [showFog, setShowFog] = useState(true);
  const [tokens, setTokens] = useState(demoTokens);
  const [revealedAreas, setRevealedAreas] = useState(demoRevealedAreas);
  const [showTutorial, setShowTutorial] = useState(false);
  const [mapName, setMapName] = useState('Mapa Tático');
  const [mapDescription, setMapDescription] = useState('Mapa tático para sessão de RPG');
  const [savedMaps, setSavedMaps] = useState<ComponentMap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id || 'anonymous';
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  
  // Extrair o ID do mapa a ser carregado da URL
  const queryParams = new URLSearchParams(location.search);
  const loadMapId = queryParams.get('load');
  
  // Carregar mapas do usuário ao iniciar e verificar se há um mapa para carregar
  useEffect(() => {
    if (session?.user) {
      loadUserMaps();
    }
    
    // Carregar mapa específico se o ID estiver na URL ou nos parâmetros de consulta
    if (id) {
      loadMap(id);
      setCurrentMapId(id);
    } else if (loadMapId) {
      loadMap(loadMapId);
      setCurrentMapId(loadMapId);
    }
  }, [session, id, loadMapId]);
  
  // Função para carregar mapas do usuário
  const loadUserMaps = async () => {
    if (!session?.user) return;
    
    setIsLoading(true);
    try {
      const maps = await mapService.getUserMaps(session.user.id);
      
      // Converter do formato do banco para o formato do componente
      const componentMaps: ComponentMap[] = maps.map(map => ({
        id: map.id,
        name: map.name,
        description: map.description || '',
        mapUrl: map.image_url,
        tokens: [], // Será carregado sob demanda
        revealedAreas: [], // Será carregado sob demanda
        createdAt: map.created_at || new Date().toISOString(),
        createdBy: map.created_by
      }));
      
      setSavedMaps(componentMaps);
    } catch (error) {
      console.error('Erro ao carregar mapas:', error);
      toast({
        title: 'Erro ao carregar mapas',
        description: 'Não foi possível carregar seus mapas salvos.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para atualizar a posição de um token
  const handleTokenMove = (tokenId: string, x: number, y: number) => {
    setTokens(prev => 
      prev.map(token => 
        token.id === tokenId ? { ...token, x, y } : token
      )
    );
  };

  // Função para salvar o mapa atual no Supabase
  const saveMap = async () => {
    if (!session?.user) {
      toast({
        title: 'Login necessário',
        description: 'Você precisa estar logado para salvar mapas.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Verificar se estamos atualizando um mapa existente ou criando um novo
      const isUpdating = currentMapId !== null;
      
      // Converter tokens do formato do componente para o formato do banco
      const dbTokens = tokens.map(token => ({
        id: token.id,
        map_id: currentMapId || '', // Usar ID existente ou vazio para novo mapa
        x: token.x,
        y: token.y,
        size: token.size,
        color: token.color,
        label: token.label,
        owner_id: token.ownerId
      }));
      
      let savedMap;
      
      if (isUpdating) {
        // Atualizar mapa existente
        savedMap = await mapService.updateMap(currentMapId!, {
          name: mapName,
          description: mapDescription,
          // Outros campos que podem ser atualizados
        });
        
        // Remover tokens e áreas reveladas existentes
        await mapService.deleteMapTokens(currentMapId!);
        await mapService.deleteRevealedAreas(currentMapId!);
      } else {
        // Criar novo mapa
        savedMap = await mapService.createMap({
          name: mapName,
          description: mapDescription,
          image_url: demoMapUrl,
          grid_size: 50,
          unit_size: 5,
          unit_name: 'pés',
          width: 1000,
          height: 1000,
          created_by: session.user.id,
          is_public: false
        });
        
        // Atualizar o ID do mapa atual
        setCurrentMapId(savedMap.id);
      }
      
      // Adicionar tokens ao mapa
      for (const token of dbTokens) {
        await mapService.addToken({
          ...token,
          map_id: savedMap.id
        });
      }
      
      // Adicionar áreas reveladas
      for (const area of revealedAreas) {
        await mapService.addRevealedArea({
          map_id: savedMap.id,
          x: area.x,
          y: area.y,
          radius: area.radius
        });
      }
      
      toast({
        title: isUpdating ? 'Mapa atualizado com sucesso!' : 'Mapa salvo com sucesso!',
        description: `O mapa "${mapName}" foi ${isUpdating ? 'atualizado' : 'salvo'} e pode ser acessado na sua coleção.`,
      });
      
      // Recarregar a lista de mapas
      loadUserMaps();
    } catch (error) {
      console.error('Erro ao salvar mapa:', error);
      toast({
        title: 'Erro ao salvar mapa',
        description: 'Não foi possível salvar o mapa. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar um mapa salvo
  const loadMap = async (mapId: string) => {
    setIsLoading(true);
    try {
      // Carregar dados do mapa
      const map = await mapService.getMapById(mapId);
      if (!map) throw new Error('Mapa não encontrado');
      
      // Carregar tokens do mapa
      const mapTokens = await mapService.getMapTokens(mapId);
      
      // Carregar áreas reveladas
      const mapAreas = await mapService.getRevealedAreas(mapId);
      
      // Converter para o formato do componente
      const componentTokens = mapTokens.map(token => ({
        id: token.id,
        x: token.x,
        y: token.y,
        size: token.size,
        color: token.color,
        label: token.label,
        ownerId: token.owner_id
      }));
      
      const componentAreas = mapAreas.map(area => ({
        x: area.x,
        y: area.y,
        radius: area.radius
      }));
      
      // Atualizar estado
      setMapName(map.name);
      setMapDescription(map.description || '');
      setTokens(componentTokens);
      setRevealedAreas(componentAreas);
      setIsPublic(map.is_public);
      
      // Gerar link de compartilhamento
      const baseUrl = window.location.origin;
      setShareLink(`${baseUrl}/mapas-taticos/${map.id}`);
      
      toast({
        title: 'Mapa carregado!',
        description: `O mapa "${map.name}" foi carregado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao carregar mapa:', error);
      toast({
        title: 'Erro ao carregar mapa',
        description: 'Não foi possível carregar o mapa selecionado.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para adicionar um novo token
  const addToken = () => {
    const newToken = {
      id: `token-${Date.now()}`,
      x: 200,
      y: 200,
      size: 40,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      label: `T${tokens.length + 1}`,
      ownerId: isGM ? 'gm' : userId
    };
    
    setTokens(prev => [...prev, newToken]);
  };

  // Função para revelar uma nova área
  const revealArea = () => {
    const newArea = {
      x: 200,
      y: 200,
      radius: 100
    };
    
    setRevealedAreas(prev => [...prev, newArea]);
  };
  
  // Função para copiar o link de compartilhamento
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
  };
  
  // Função para alternar a visibilidade pública do mapa
  const handleTogglePublic = async (value: boolean) => {
    if (!currentMapId) return;
    
    setIsLoading(true);
    try {
      await mapService.updateMap(currentMapId, {
        is_public: value
      });
      
      setIsPublic(value);
      toast({
        title: value ? 'Mapa público' : 'Mapa privado',
        description: value 
          ? 'Seu mapa agora está visível para todos os usuários.' 
          : 'Seu mapa agora está visível apenas para você e pessoas com quem você compartilhar.'
      });
    } catch (error) {
      console.error('Erro ao alterar visibilidade do mapa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a visibilidade do mapa.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para compartilhar o mapa por e-mail
  const handleShareByEmail = async () => {
    if (!currentMapId || !shareEmail.trim()) return;
    
    setIsLoading(true);
    try {
      // Implementar a função de compartilhamento por e-mail no mapService
      await mapService.shareMapByEmail(currentMapId, shareEmail);
      
      toast({
        title: 'Mapa compartilhado!',
        description: `Um convite foi enviado para ${shareEmail}.`
      });
      
      setShareEmail('');
    } catch (error) {
      console.error('Erro ao compartilhar mapa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível compartilhar o mapa. Verifique o e-mail e tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {(id || loadMapId) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    asChild 
                    className="mr-2"
                  >
                    <Link to="/mapas">
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Voltar
                    </Link>
                  </Button>
                )}
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {currentMapId ? mapName : 'Sistema de Mapas Táticos'}
                </CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTutorial(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Tutorial
              </Button>
            </div>
            <CardDescription>
              {currentMapId 
                ? mapDescription 
                : 'Crie, gerencie e utilize mapas táticos para suas sessões de RPG. Alterne entre as visualizações de jogador e mestre.'}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Painel de controle */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Controles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Modo de Visualização</h3>
                <Tabs defaultValue="player" onValueChange={(value) => setIsGM(value === 'gm')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="player" className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> Jogador
                    </TabsTrigger>
                    <TabsTrigger value="gm" className="flex items-center gap-1">
                      <Shield className="h-4 w-4" /> Mestre
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {isGM && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Opções do Mestre</h3>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => setShowFog(!showFog)}
                    >
                      {showFog ? <><EyeOff className="h-4 w-4 mr-2" /> Desativar Névoa</> : <><Eye className="h-4 w-4 mr-2" /> Ativar Névoa</>}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={addToken}
                    >
                      <Users className="h-4 w-4 mr-2" /> Adicionar Token
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={revealArea}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Revelar Área
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => setIsMeasuring(!isMeasuring)}
                    >
                      <Ruler className="h-4 w-4 mr-2" /> {isMeasuring ? 'Desativar Medição' : 'Ativar Medição'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Salvar/Carregar</h3>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={saveMap}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {currentMapId ? 'Atualizar Mapa' : 'Salvar Mapa'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => navigate('/mapas')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Carregar Mapa
                  </Button>
                  {currentMapId && (
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => setShowShareDialog(true)}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Compartilhar Mapa
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Instruções</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Use a ferramenta de régua para medir distâncias</li>
                  <li>• Arraste o mapa para navegar</li>
                  <li>• Arraste tokens para movê-los</li>
                  <li>• Use os botões de zoom para ajustar a visualização</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Mapa Tático */}
          <Card className="lg:col-span-3">
            <CardContent className="p-4">
              <EnhancedTacticalMap
                mapUrl={demoMapUrl}
                tokens={tokens}
                isGameMaster={isGM}
                onTokenMove={handleTokenMove}
                fogOfWar={showFog}
                revealedAreas={revealedAreas}
                isMeasuring={isMeasuring}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sistema de Tutorial */}
        {showTutorial && (
          <TutorialSystem 
            initialCategory="mapas"
            onComplete={() => setShowTutorial(false)}
          />
        )}

        {/* Diálogo de Compartilhamento */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Compartilhar Mapa</DialogTitle>
              <DialogDescription>
                Compartilhe seu mapa tático com outros jogadores ou torne-o público para a comunidade.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center space-x-2 py-4">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <Input
                  id="link"
                  readOnly
                  value={shareLink}
                  className="w-full"
                />
              </div>
              <Button 
                type="submit" 
                size="sm" 
                className="px-3"
                onClick={handleCopyLink}
              >
                <span className="sr-only">Copiar</span>
                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="public-map">Tornar mapa público</Label>
                <Switch
                  id="public-map"
                  checked={isPublic}
                  onCheckedChange={handleTogglePublic}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {isPublic 
                  ? 'Seu mapa está visível para todos os usuários na seção de mapas públicos.' 
                  : 'Seu mapa está visível apenas para você e pessoas com quem você compartilhar.'}
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Compartilhar por e-mail</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  placeholder="email@exemplo.com"
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
                <Button onClick={handleShareByEmail} disabled={!shareEmail.trim()}>Enviar</Button>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowShareDialog(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default TacticalMapSystem;