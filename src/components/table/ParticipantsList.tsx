
import React from 'react';

interface ParticipantsListProps {
  participants: Array<{
    id: string;
    profiles?: {
      display_name?: string;
    };
  }>;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({ participants }) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-medievalsharp text-fantasy-stone mb-2">
        Participantes Confirmados ({participants.length})
      </h2>
      {participants.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {participants.map((participant) => (
            <div 
              key={participant.id} 
              className="bg-fantasy-dark/50 px-3 py-1 rounded-full text-fantasy-stone"
            >
              {participant.profiles?.display_name || 'Jogador'}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-fantasy-stone italic">Nenhum participante confirmado ainda</p>
      )}
    </div>
  );
};
