import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Importar o cliente Supabase
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
// Importar estilos, se necessário. Poderia ser um CSS module ou Tailwind.
// import './MissionsPage.css'; 

// Interfaces para os dados das missões (pode ser movido para um arquivo de tipos)
interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  completed: boolean;
  detailsLink?: string;
  rewards: {
    gold?: number;
    gems?: number;
    xp?: number;
    special?: string;
  };
}

// Dados mockados foram removidos, agora buscaremos do Supabase
const mockMissions: Mission[] = [
  {
    id: '1',
    title: 'Crie seu Primeiro Personagem',
    description: 'Crie um personagem completo com história, atributos e habilidades para iniciar sua jornada.',
    progress: 30,
    total: 100,
    completed: false,
    detailsLink: '/creations/characters', // Atualizado para rota React
    rewards: { gold: 100, gems: 5, xp: 200 },
  },
  {
    id: '2',
    title: 'Explore o Mapa Inicial',
    description: 'Visite todos os pontos de interesse no mapa inicial do Reino de Eldoria.',
    progress: 100,
    total: 100,
    completed: false, // Será true após resgatar
    rewards: { gold: 50, special: 'Troféu Explorador' },
  },
  {
    id: '3',
    title: 'Jogue sua Primeira Partida',
    description: 'Participe de uma sessão de jogo com outros jogadores ou com o mestre.',
    progress: 100,
    total: 100,
    completed: true,
    rewards: { gold: 200, gems: 10 },
  },
  {
    id: '4',
    title: 'Crie sua Primeira História',
    description: 'Escreva uma história ou lenda para enriquecer o mundo do seu personagem.',
    progress: 0,
    total: 100,
    completed: false,
    detailsLink: '/creations/stories', // Exemplo, ajustar se necessário
    rewards: { gold: 150, xp: 300 },
  },
];

const MissionsPage: React.FC = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showToast, setShowToast] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchMissions = async () => {
      setLoadingMissions(true);
      try {
        // TODO: Idealmente, filtrar missões ativas ou relevantes para o usuário
        // Por agora, vamos buscar todas as missões da tabela 'missions'
        // E assumir que a tabela 'user_missions_progress' guarda o progresso e status de conclusão
        const { data: missionsData, error: missionsError } = await supabase
          .from('missions') // Nome da tabela de missões
          .select(`
            id,
            title,
            description,
            total_steps, // Assumindo que 'total' na UI é 'total_steps' no DB
            reward_gold,
            reward_gems,
            reward_xp,
            reward_special,
            details_link
            // Para 'progress' e 'completed', precisaríamos de um JOIN com user_missions_progress
          `);

        if (missionsError) {
          console.error('Erro ao buscar missões:', missionsError);
          // Tratar erro, talvez com um toast
          return;
        }

        if (missionsData) {
          // Mapear dados do Supabase para a interface Mission
          // Por enquanto, progress e completed serão mockados ou virão de outra query
          const formattedMissions = missionsData.map(dbMission => ({
            id: dbMission.id,
            title: dbMission.title,
            description: dbMission.description,
            progress: 0, // Placeholder - buscar de user_missions_progress
            total: dbMission.total_steps || 100, // Usar total_steps ou um padrão
            completed: false, // Placeholder - buscar de user_missions_progress
            detailsLink: dbMission.details_link,
            rewards: {
              gold: dbMission.reward_gold,
              gems: dbMission.reward_gems,
              xp: dbMission.reward_xp,
              special: dbMission.reward_special,
            },
          }));
          setMissions(formattedMissions);
        }
      } catch (error) {
        console.error('Erro inesperado ao buscar missões:', error);
        // Tratar erro
      } finally {
        setLoadingMissions(false);
      }
    };

    fetchMissions();
    // Se as missões dependessem do usuário (ex: progresso específico), adicionar 'user' ao array de dependências
  }, []);

  const handleClaimReward = (missionId: string) => {
    setMissions(prevMissions =>
      prevMissions.map(mission =>
        mission.id === missionId ? { ...mission, completed: true } : mission
      )
    );
    setToastMessage('Recompensa resgatada com sucesso!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    // Adicionar lógica para registrar a recompensa no backend
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 text-white">
        <header className="mb-8">
          <h1 className="text-4xl font-medievalsharp text-fantasy-gold">Quadro de Missões</h1>
        </header>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-fantasy-secondary">Desafios do Reino</h2>
          <p className="mb-6 text-fantasy-stone">
            Encare desafios propostos pelos Guardiões e ganhe recompensas épicas!
          </p>

          {loadingMissions ? (
            <p className="text-center text-fantasy-stone">Carregando missões...</p>
          ) : missions.length === 0 ? (
            <p className="text-center text-fantasy-stone">Nenhuma missão disponível no momento. Volte mais tarde, aventureiro!</p>
          ) : (
            <div className="space-y-6">
            {missions.map(mission => (
              <div
                key={mission.id}
                className={`bg-fantasy-dark-gray p-6 rounded-lg shadow-lg border border-fantasy-purple/30 
                            ${mission.completed ? 'opacity-70' : ''}
                            ${!mission.completed && mission.progress >= mission.total ? 'border-fantasy-gold' : ''}`}
              >
                <h3 className="text-xl font-medievalsharp text-fantasy-gold mb-2">
                  <i className="fas fa-scroll mr-2"></i> {mission.title}
                </h3>
                <p className="text-fantasy-stone mb-3 text-sm">{mission.description}</p>
                
                {!mission.completed && (
                  <div className="mb-3">
                    <div className="h-4 bg-fantasy-dark rounded-full overflow-hidden border border-fantasy-purple/50">
                      <div
                        className="h-full bg-fantasy-secondary transition-all duration-500 ease-out"
                        style={{ width: `${(mission.progress / mission.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-fantasy-stone mt-1 block">
                      {mission.progress}/{mission.total}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm font-semibold text-fantasy-secondary mb-1">
                    <i className="fas fa-trophy mr-1"></i> Recompensas:
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-fantasy-stone">
                    {mission.rewards.gold && (
                      <span className="reward-item reward-gold"><i className="fas fa-coins mr-1"></i> {mission.rewards.gold} Ouro</span>
                    )}
                    {mission.rewards.gems && (
                      <span className="reward-item reward-gem"><i className="fas fa-gem mr-1"></i> {mission.rewards.gems} Gemas</span>
                    )}
                    {mission.rewards.xp && (
                      <span className="reward-item reward-xp"><i className="fas fa-star mr-1"></i> {mission.rewards.xp} XP</span>
                    )}
                    {mission.rewards.special && (
                      <span className="reward-item reward-item-special"><i className="fas fa-medal mr-1"></i> {mission.rewards.special}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {mission.completed ? (
                    <button className="btn-fantasy-disabled" disabled>
                      Concluída
                    </button>
                  ) : mission.progress >= mission.total ? (
                    <button
                      onClick={() => handleClaimReward(mission.id)}
                      className="btn-fantasy-primary"
                    >
                      Resgatar Recompensa
                    </button>
                  ) : mission.detailsLink ? (
                    <Link to={mission.detailsLink} className="btn-fantasy-secondary">
                      Ver Detalhes
                    </Link>
                  ) : (
                    <button className="btn-fantasy-secondary-disabled" disabled>
                      Ver Detalhes
                    </button>
                  )}
                </div>
              </div>
            ))}
            </div>
          )}
        </section>
      </div>
      {/* Adicionar Toast component aqui se necessário */}
    </MainLayout>
  );
};

export default MissionsPage;