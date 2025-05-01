import React, { useState, useEffect } from 'react';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Volume2, MessageSquare, Swords, Map, Scroll } from 'lucide-react';

interface NotificationPreferences {
  enableSounds: boolean;
  soundVolume: number;
  enableToasts: boolean;
  notificationTypes: {
    message: boolean;
    combat: boolean;
    quest: boolean;
    fog_update: boolean;
    system: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  enableSounds: true,
  soundVolume: 0.5,
  enableToasts: true,
  notificationTypes: {
    message: true,
    combat: true,
    quest: true,
    fog_update: true,
    system: true,
  },
};

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  
  // Carregar preferências do usuário
  useEffect(() => {
    if (!user) return;
    
    const loadPreferences = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('user_preferences')
          .select('notification_preferences')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
          throw error;
        }
        
        if (data?.notification_preferences) {
          setPreferences(data.notification_preferences as NotificationPreferences);
        }
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
        toast.error('Não foi possível carregar suas preferências de notificação');
      } finally {
        setLoading(false);
      }
    };
    
    loadPreferences();
  }, [user]);
  
  // Salvar preferências
  const savePreferences = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_preferences: preferences,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success('Preferências de notificação salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };
  
  // Testar som de notificação
  const playTestSound = (type: string) => {
    let soundUrl = '/sounds/notification-general.mp3';
    
    switch (type) {
      case 'combat':
        soundUrl = '/sounds/notification-combat.mp3';
        break;
      case 'message':
        soundUrl = '/sounds/notification-message.mp3';
        break;
      case 'quest':
        soundUrl = '/sounds/notification-quest.mp3';
        break;
      case 'fog_update':
        soundUrl = '/sounds/notification-map.mp3';
        break;
    }
    
    const audio = new Audio(soundUrl);
    audio.volume = preferences.soundVolume;
    audio.play().catch(e => console.error('Erro ao reproduzir som:', e));
  };
  
  // Atualizar uma preferência específica
  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Atualizar um tipo de notificação específico
  const updateNotificationType = (type: keyof NotificationPreferences['notificationTypes'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: value
      }
    }));
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fantasy-gold"></div>
      </div>
    );
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto bg-fantasy-dark border-fantasy-purple/30">
      <CardHeader>
        <CardTitle className="text-fantasy-gold font-medievalsharp">Configurações de Notificação</CardTitle>
        <CardDescription className="text-fantasy-stone/80">
          Personalize como você recebe notificações no Keeper of Realms
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="general" className="data-[state=active]:bg-fantasy-purple/20">
              <Bell className="mr-2 h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="sounds" className="data-[state=active]:bg-fantasy-purple/20">
              <Volume2 className="mr-2 h-4 w-4" />
              Sons
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-fantasy-gold">Notificações Toast</Label>
                  <p className="text-sm text-fantasy-stone/70">Mostrar notificações pop-up</p>
                </div>
                <Switch
                  checked={preferences.enableToasts}
                  onCheckedChange={(value) => updatePreference('enableToasts', value)}
                />
              </div>
              
              <div className="pt-4 border-t border-fantasy-purple/10">
                <h3 className="text-fantasy-gold mb-3">Tipos de Notificação</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 text-blue-400 mr-2" />
                      <Label className="text-fantasy-stone">Mensagens</Label>
                    </div>
                    <Switch
                      checked={preferences.notificationTypes.message}
                      onCheckedChange={(value) => updateNotificationType('message', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Swords className="h-5 w-5 text-red-400 mr-2" />
                      <Label className="text-fantasy-stone">Combate</Label>
                    </div>
                    <Switch
                      checked={preferences.notificationTypes.combat}
                      onCheckedChange={(value) => updateNotificationType('combat', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Scroll className="h-5 w-5 text-amber-400 mr-2" />
                      <Label className="text-fantasy-stone">Missões</Label>
                    </div>
                    <Switch
                      checked={preferences.notificationTypes.quest}
                      onCheckedChange={(value) => updateNotificationType('quest', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Map className="h-5 w-5 text-green-400 mr-2" />
                      <Label className="text-fantasy-stone">Atualizações de Mapa</Label>
                    </div>
                    <Switch
                      checked={preferences.notificationTypes.fog_update}
                      onCheckedChange={(value) => updateNotificationType('fog_update', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-gray-400 mr-2" />
                      <Label className="text-fantasy-stone">Sistema</Label>
                    </div>
                    <Switch
                      checked={preferences.notificationTypes.system}
                      onCheckedChange={(value) => updateNotificationType('system', value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sounds" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-fantasy-gold">Sons de Notificação</Label>
                  <p className="text-sm text-fantasy-stone/70">Reproduzir sons ao receber notificações</p>
                </div>
                <Switch
                  checked={preferences.enableSounds}
                  onCheckedChange={(value) => updatePreference('enableSounds', value)}
                />
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <Label className="text-fantasy-stone">Volume</Label>
                  <span className="text-sm text-fantasy-stone/70">
                    {Math.round(preferences.soundVolume * 100)}%
                  </span>
                </div>
                <Slider
                  disabled={!preferences.enableSounds}
                  value={[preferences.soundVolume * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => updatePreference('soundVolume', value[0] / 100)}
                  className="py-2"
                />
              </div>
              
              <div className="pt-4 border-t border-fantasy-purple/10">
                <h3 className="text-fantasy-gold mb-3">Testar Sons</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => playTestSound('message')}
                    disabled={!preferences.enableSounds}
                    className="border-fantasy-purple/30 text-fantasy-stone"
                  >
                    <MessageSquare className="h-4 w-4 mr-2 text-blue-400" />
                    Mensagem
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => playTestSound('combat')}
                    disabled={!preferences.enableSounds}
                    className="border-fantasy-purple/30 text-fantasy-stone"
                  >
                    <Swords className="h-4 w-4 mr-2 text-red-400" />
                    Combate
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => playTestSound('quest')}
                    disabled={!preferences.enableSounds}
                    className="border-fantasy-purple/30 text-fantasy-stone"
                  >
                    <Scroll className="h-4 w-4 mr-2 text-amber-400" />
                    Missão
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => playTestSound('fog_update')}
                    disabled={!preferences.enableSounds}
                    className="border-fantasy-purple/30 text-fantasy-stone"
                  >
                    <Map className="h-4 w-4 mr-2 text-green-400" />
                    Mapa
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => playTestSound('general')}
                    disabled={!preferences.enableSounds}
                    className="border-fantasy-purple/30 text-fantasy-stone col-span-2"
                  >
                    <Bell className="h-4 w-4 mr-2 text-gray-400" />
                    Geral
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2 border-t border-fantasy-purple/20 pt-4">
        <Button 
          variant="outline"
          onClick={() => setPreferences(defaultPreferences)}
          className="border-fantasy-purple/30 text-fantasy-stone"
        >
          Restaurar Padrões
        </Button>
        <Button 
          onClick={savePreferences} 
          disabled={saving}
          className="bg-fantasy-purple hover:bg-fantasy-purple/90 text-white"
        >
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default NotificationSettings;