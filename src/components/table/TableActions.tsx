
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface TableActionsProps {
  tableId: string;
  isTableFull: boolean;
  joinRequestStatus: string | null;
  isParticipant: boolean;
  userRole: string | null;
  tableStatus: string;
  onJoinRequest: () => void;
  userId?: string;
  tableOwnerId?: string;
}

export const TableActions: React.FC<TableActionsProps> = ({
  tableId,
  isTableFull,
  joinRequestStatus,
  isParticipant,
  userRole,
  tableStatus,
  onJoinRequest,
  userId,
  tableOwnerId
}) => {
  return (
    <>
      {tableStatus === 'open' && (
        <div className="flex justify-center">
          {isTableFull ? (
            <div className="text-red-500 font-bold">Mesa completa</div>
          ) : joinRequestStatus === 'approved' ? (
            <div className="text-green-500 font-bold">Você já é um participante desta mesa</div>
          ) : (
            <Button 
              onClick={onJoinRequest} 
              disabled={joinRequestStatus === 'pending'}
              className="fantasy-button primary"
            >
              {joinRequestStatus === 'pending' ? 'Solicitação Enviada' : 'Solicitar Participação'}
            </Button>
          )}
        </div>
      )}

      {(isParticipant || tableOwnerId === userId) && (
        <div className="flex justify-center mt-6">
          <Link 
            to={userRole === 'gm' ? `/gm/${tableId}` : `/table/player/${tableId}`}
            className="fantasy-button primary flex items-center gap-2"
          >
            <Eye size={16} />
            {userRole === 'gm' ? 'Ver Painel do Mestre' : 'Ver Mesa de Jogo'}
          </Link>
        </div>
      )}
      
      {(isParticipant || tableOwnerId === userId) && tableStatus === 'active' && (
        <div className="flex justify-center mt-3">
          <Link 
            to={`/session/${tableId}`}
            className="fantasy-button secondary flex items-center gap-2"
          >
            <Eye size={16} />
            Entrar na Sessão ao Vivo
          </Link>
        </div>
      )}
    </>
  );
};
