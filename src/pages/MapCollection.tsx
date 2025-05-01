import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { mapService, TacticalMap } from '@/services/mapService';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { MapPin, Plus, Trash, Eye, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MapCollection: React.FC = () => {
  const [userMaps, setUserMaps] = useState<TacticalMap[]>([]);
  const [publicMaps, setPublicMaps] = useState<TacticalMap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    loadMaps();
  }, [session]);

  const loadMaps = async () => {
    setIsLoading(true);
    try {
      // Carregar mapas públicos
      const publicMapData = await mapService.getPublicMaps();
      setPublicMaps(publicMapData);

      // Carregar mapas do usuário se estiver logado
      if (session?.user) {
        const userMapData = await mapService.getUserMaps(session.user.id);
        setUserMaps(userMapData);
      }
    } catch (error) {
      console.error('Erro ao carregar mapas:', error);
      toast({
        title: 'Erro ao carregar mapas',
        description: 'Não foi possível carregar os mapas. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMap = async (mapId: string) => {
    if (!confirm('Tem certeza que deseja excluir este mapa? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsLoading(true);
    try {
      await mapService.deleteMap(mapId);
      toast({
        title: 'Mapa excluído',
        description: 'O mapa foi excluído com sucesso.'
      });
      // Recarregar mapas
      loadMaps();
    } catch (error) {
      console.error('Erro ao excluir mapa:', error);
      toast({
        title: 'Erro ao excluir mapa',
        description: 'Não foi possível excluir o mapa. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewMap = (mapId: string) => {
    navigate(`/mapas-taticos/${mapId}`);
  };

  const loadMap = (mapId: string) => {
    navigate(`/mapas-taticos?load=${mapId}`);
  };

  const createNewMap = () => {
    navigate('/mapas-taticos');
  };

  const renderMapCard = (map: TacticalMap, isUserMap: boolean) => (
    <Card key={map.id} className="overflow-hidden">
      <div 
        className="h-40 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url(${map.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <CardHeader className="p-4">
        <CardTitle className="text-lg">{map.name}</CardTitle>
        <CardDescription>
          {map.description || 'Sem descrição'}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between p-4 pt-0">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => viewMap(map.id)}
          >
            <Eye className="h-4 w-4 mr-1" /> Visualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadMap(map.id)}
          >
            <Download className="h-4 w-4 mr-1" /> Carregar
          </Button>
        </div>
        {isUserMap && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => deleteMap(map.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-medievalsharp text-fantasy-gold flex items-center gap-2">
              <MapPin className="h-6 w-6" /> Coleção de Mapas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e explore mapas táticos para suas aventuras
            </p>
          </div>
          <Button onClick={createNewMap}>
            <Plus className="h-4 w-4 mr-2" /> Novo Mapa
          </Button>
        </div>

        <Tabs defaultValue="meus-mapas">
          <TabsList className="mb-4">
            <TabsTrigger value="meus-mapas">Meus Mapas</TabsTrigger>
            <TabsTrigger value="mapas-publicos">Mapas Públicos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="meus-mapas">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <p>Carregando mapas...</p>
              </div>
            ) : userMaps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userMaps.map(map => renderMapCard(map, true))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-4">Você ainda não tem mapas salvos</p>
                  <Button onClick={createNewMap}>
                    <Plus className="h-4 w-4 mr-2" /> Criar Meu Primeiro Mapa
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="mapas-publicos">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <p>Carregando mapas públicos...</p>
              </div>
            ) : publicMaps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicMaps.map(map => renderMapCard(map, false))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground">Não há mapas públicos disponíveis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default MapCollection;