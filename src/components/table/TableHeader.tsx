
import React from 'react';
import { Calendar, Users, Sword, MapPin, Clock, Book } from 'lucide-react';

interface TableHeaderProps {
  tableDetails: {
    name: string;
    campaign?: string;
    system?: string;
    weekday?: string;
    time?: string;
    meeting_url?: string;
    status?: string;
  };
}

export const TableHeader: React.FC<TableHeaderProps> = ({ tableDetails }) => {
  return (
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <div>
        <div className="flex items-center mb-2">
          <Book className="mr-2 text-fantasy-gold" />
          <span className="text-fantasy-stone">Campanha: {tableDetails.campaign || 'Não definida'}</span>
        </div>
        <div className="flex items-center mb-2">
          <Sword className="mr-2 text-fantasy-gold" />
          <span className="text-fantasy-stone">Sistema: {tableDetails.system || 'D&D 5e'}</span>
        </div>
        <div className="flex items-center mb-2">
          <Calendar className="mr-2 text-fantasy-gold" />
          <span className="text-fantasy-stone">
            {tableDetails.weekday || 'Dia não definido'} - {tableDetails.time || 'Horário não definido'}
          </span>
        </div>
      </div>
      <div>
        <div className="flex items-center mb-2">
          <MapPin className="mr-2 text-fantasy-gold" />
          <span className="text-fantasy-stone">{tableDetails.meeting_url || 'Local não definido'}</span>
        </div>
        <div className="flex items-center mb-2">
          <Clock className="mr-2 text-fantasy-gold" />
          <span className="text-fantasy-stone">Status: {tableDetails.status || 'aberto'}</span>
        </div>
      </div>
    </div>
  );
};
