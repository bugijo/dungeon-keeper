
import React from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, X, Info } from 'lucide-react';

// Create a simple component for the player's view in the game table
// This will be expanded later with more functionality
const TablePlayerView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [tableData, setTableData] = React.useState<TableDataType | null>(null);
  const [character, setCharacter] = React.useState<CharacterType | null>(null);
  const [otherPlayers, setOtherPlayers] = React.useState<PlayerType[]>([]);
  const [profiles, setProfiles] = React.useState<Record<string, ProfileType>>({});
  const [focusMode, setFocusMode] = React.useState(false);
  const [quickViewItem, setQuickViewItem] = React.useState<QuickViewItemType | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        // First fetch all profiles to have display names available
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name');
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          // Create a map of profiles by ID for easy lookup
          const profilesMap: Record<string, any> = {};
          profilesData?.forEach(profile => {
            profilesMap[profile.id] = profile;
          });
          setProfiles(profilesMap);
        }
        
        // Fetch table data
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', id)
          .single();
          
        if (tableError) throw tableError;
        setTableData(tableData);
        
        // Check if user is a participant
        const { data: participationData, error: participationError } = await supabase
          .from('table_participants')
          .select('*, characters:character_id(*)')
          .eq('table_id', id)
          .eq('user_id', user.id)
          .single();
          
        if (participationError) {
          if (participationError.code !== 'PGRST116') {
            throw participationError;
          }
          toast.error('Você não está participando desta mesa');
          return;
        }
        
        if (participationData?.characters) {
          setCharacter(participationData.characters);
        }
        
        // Get other players
        const { data: otherPlayersData, error: otherPlayersError } = await supabase
          .from('table_participants')
          .select(`
            id, 
            user_id,
            role,
            character_id,
            characters:character_id (id, name, class, race, level)
          `)
          .eq('table_id', id)
          .neq('user_id', user.id);
          
        if (otherPlayersError) throw otherPlayersError;
        
        setOtherPlayers(otherPlayersData || []);
        
      } catch (error) {
        console.error('Error fetching table data:', error);
        toast.error('Erro ao carregar dados da mesa');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user]);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="animate-pulse text-fantasy-purple">Carregando...</div>
        </div>
      </MainLayout>
    );
  }
  
  // Get display name for a user from our profiles map
  const getDisplayName = (userId: string) => {
    return profiles[userId]?.display_name || "Jogador";
  };
  
  // Função para alternar o modo de foco
  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    toast.info(focusMode ? 'Modo normal ativado' : 'Modo de foco ativado');
  };

  // Função para mostrar visualização rápida de um item
  const showQuickView = (item: QuickViewItemType) => {
    setQuickViewItem(item);
  };

  // Componente de visualização rápida
  const QuickViewModal = () => {
    if (!quickViewItem) return null;
    
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="fantasy-card p-6 max-w-md w-full relative">
          <button 
            onClick={() => setQuickViewItem(null)} 
            className="absolute top-2 right-2 text-fantasy-stone hover:text-white"
          >
            <X size={20} />
          </button>
          
          <h3 className="text-xl font-medievalsharp text-fantasy-purple mb-3">{quickViewItem.name}</h3>
          
          {quickViewItem.type === 'item' && (
            <div className="space-y-2">
              <p className="text-fantasy-stone"><span className="font-bold">Tipo:</span> {quickViewItem.itemType}</p>
              <p className="text-fantasy-stone"><span className="font-bold">Peso:</span> {quickViewItem.weight} lb</p>
              <p className="text-fantasy-stone"><span className="font-bold">Valor:</span> {quickViewItem.value} po</p>
              <p className="text-white mt-3">{quickViewItem.description}</p>
            </div>
          )}
          
          {quickViewItem.type === 'spell' && (
            <div className="space-y-2">
              <p className="text-fantasy-stone"><span className="font-bold">Nível:</span> {quickViewItem.level}</p>
              <p className="text-fantasy-stone"><span className="font-bold">Escola:</span> {quickViewItem.school}</p>
              <p className="text-fantasy-stone"><span className="font-bold">Tempo de Conjuração:</span> {quickViewItem.castingTime}</p>
              <p className="text-fantasy-stone"><span className="font-bold">Alcance:</span> {quickViewItem.range}</p>
              <p className="text-fantasy-stone"><span className="font-bold">Duração:</span> {quickViewItem.duration}</p>
              <p className="text-white mt-3">{quickViewItem.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 relative">
        {/* Botão de modo de foco */}
        <button 
          onClick={toggleFocusMode}
          className="absolute top-4 right-4 bg-fantasy-dark/60 p-2 rounded-full hover:bg-fantasy-dark transition-colors"
          title={focusMode ? "Desativar modo de foco" : "Ativar modo de foco"}
        >
          {focusMode ? <EyeOff size={20} className="text-fantasy-purple" /> : <Eye size={20} className="text-fantasy-purple" />}
        </button>
        
        <h1 className="text-3xl font-medievalsharp text-white mb-6">{tableData?.name || "Mesa de RPG"}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="fantasy-card p-4">
              <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4">Seu Personagem</h2>
              {character ? (
                <div>
                  <p className="text-lg font-medievalsharp">{character.name}</p>
                  <p className="text-fantasy-stone">{character.race} {character.class} (Nível {character.level})</p>
                  
                  {/* Exemplo de itens do personagem com visualização rápida */}
                  {!focusMode && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medievalsharp text-fantasy-stone mb-2">Itens Equipados</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div 
                          className="p-2 bg-fantasy-dark/40 rounded cursor-pointer hover:bg-fantasy-dark/60 transition-colors flex items-center"
                          onClick={() => showQuickView({
                            type: 'item',
                            name: 'Espada Longa',
                            itemType: 'Arma Corpo-a-Corpo',
                            weight: 3,
                            value: 15,
                            description: 'Uma espada longa de aço bem balanceada. Causa 1d8 de dano cortante.'
                          })}
                        >
                          <span className="flex-grow">Espada Longa</span>
                          <Info size={16} className="text-fantasy-stone" />
                        </div>
                        <div 
                          className="p-2 bg-fantasy-dark/40 rounded cursor-pointer hover:bg-fantasy-dark/60 transition-colors flex items-center"
                          onClick={() => showQuickView({
                            type: 'item',
                            name: 'Armadura de Couro',
                            itemType: 'Armadura Leve',
                            weight: 10,
                            value: 10,
                            description: 'Uma armadura feita de couro endurecido. Fornece CA base de 11 + mod de Destreza.'
                          })}
                        >
                          <span className="flex-grow">Armadura de Couro</span>
                          <Info size={16} className="text-fantasy-stone" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Exemplo de magias do personagem com visualização rápida */}
                  {!focusMode && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medievalsharp text-fantasy-stone mb-2">Magias Conhecidas</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div 
                          className="p-2 bg-fantasy-dark/40 rounded cursor-pointer hover:bg-fantasy-dark/60 transition-colors flex items-center"
                          onClick={() => showQuickView({
                            type: 'spell',
                            name: 'Mísseis Mágicos',
                            level: 1,
                            school: 'Evocação',
                            castingTime: '1 ação',
                            range: '120 pés',
                            duration: 'Instantânea',
                            description: 'Você cria três dardos brilhantes de força mágica. Cada dardo atinge uma criatura à sua escolha que você possa ver, dentro do alcance. Um dardo causa 1d4+1 de dano de força ao seu alvo.'
                          })}
                        >
                          <span className="flex-grow">Mísseis Mágicos</span>
                          <Info size={16} className="text-fantasy-stone" />
                        </div>
                        <div 
                          className="p-2 bg-fantasy-dark/40 rounded cursor-pointer hover:bg-fantasy-dark/60 transition-colors flex items-center"
                          onClick={() => showQuickView({
                            type: 'spell',
                            name: 'Escudo Arcano',
                            level: 1,
                            school: 'Abjuração',
                            castingTime: '1 reação',
                            range: 'Pessoal',
                            duration: '1 rodada',
                            description: 'Uma barreira invisível de força mágica aparece e protege você. Até o início do seu próximo turno, você recebe +5 de bônus na CA, incluindo contra o ataque que desencadeou a magia.'
                          })}
                        >
                          <span className="flex-grow">Escudo Arcano</span>
                          <Info size={16} className="text-fantasy-stone" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-fantasy-stone">Você não tem um personagem selecionado para esta mesa.</p>
              )}
            </div>
            
            {/* Grupo de Aventureiros - oculto no modo de foco */}
            {!focusMode && (
              <div className="fantasy-card p-4">
                <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4">Grupo de Aventureiros</h2>
                <div className="space-y-3">
                  {otherPlayers.map(player => (
                    <div key={player.id} className="p-3 bg-fantasy-dark/40 rounded-lg">
                      <p className="text-white">{getDisplayName(player.user_id)}</p>
                      {player.characters ? (
                        <p className="text-sm text-fantasy-stone">
                          {player.characters.name} - {player.characters.race} {player.characters.class} (Nível {player.characters.level})
                        </p>
                      ) : (
                        <p className="text-sm text-fantasy-stone">Sem personagem selecionado</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="fantasy-card p-4">
              <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4">Mapa da Aventura</h2>
              <div className="bg-fantasy-dark/30 h-64 rounded-lg flex items-center justify-center">
                <p className="text-fantasy-stone">O mestre ainda não compartilhou nenhum mapa.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Informações da Campanha - oculto no modo de foco */}
            {!focusMode && (
              <div className="fantasy-card p-4">
                <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4">Informações da Campanha</h2>
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm text-fantasy-stone">Sistema</h3>
                    <p className="text-white">{tableData?.system || "D&D 5e"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-fantasy-stone">Campanha</h3>
                    <p className="text-white">{tableData?.campaign || "Campanha sem nome"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-fantasy-stone">Mestre</h3>
                    <p className="text-white">
                      {otherPlayers.find(p => p.role === 'gm')
                        ? getDisplayName(otherPlayers.find(p => p.role === 'gm').user_id)
                        : "Não definido"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="fantasy-card p-4">
              <h2 className="text-xl font-medievalsharp text-fantasy-purple mb-4">Chat</h2>
              <div className="bg-fantasy-dark/30 h-48 rounded-lg p-3 mb-2">
                <p className="text-fantasy-stone text-center">Nenhuma mensagem ainda.</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  className="flex-grow bg-fantasy-dark/60 rounded p-2 text-white focus:outline-none focus:ring-1 focus:ring-fantasy-purple"
                  placeholder="Digite sua mensagem..."
                />
                <button className="fantasy-button primary">Enviar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de visualização rápida */}
      <QuickViewModal />
    </MainLayout>
  );
};

export default TablePlayerView;
