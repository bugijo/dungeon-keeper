import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SessionScheduler from './SessionScheduler';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { TableService } from '@/services/tableService';

interface SessionsTabProps {
  tableId: string;
}

const SessionsTab: React.FC<SessionsTabProps> = ({ tableId }) => {
  const { user } = useAuth();
  const [isGameMaster, setIsGameMaster] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkGameMasterStatus = async () => {
      if (!user || !tableId) return;
      
      try {
        setLoading(true);
        const isMaster = await TableService.isGameMaster(tableId, user.id);
        setIsGameMaster(isMaster);
      } catch (error) {
        console.error('Erro ao verificar status de mestre:', error);
      } finally {
        setLoading(false);
      }
    };

    checkGameMasterStatus();
  }, [tableId, user]);

  return (
    <Card className="border-fantasy-stone/20 bg-fantasy-stone/5">
      <CardHeader>
        <CardTitle className="text-fantasy-gold font-medievalsharp">Sessões</CardTitle>
        <CardDescription>
          Gerencie o agendamento de sessões para esta mesa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <p className="text-fantasy-stone/70">Carregando...</p>
          </div>
        ) : (
          <SessionScheduler 
            tableId={tableId} 
            isGameMaster={isGameMaster} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SessionsTab;