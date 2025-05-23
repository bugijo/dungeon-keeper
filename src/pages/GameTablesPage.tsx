import React from 'react';
import { AvailableTablesGrid } from '@/components/tables/AvailableTablesGrid';

const GameTablesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 text-amber-50 font-serif">
      <h1 className="text-4xl font-bold text-center text-amber-400 mb-10 tracking-wider">Mesas de Jogo</h1>
      <p className="text-center text-amber-100 mb-12 text-lg max-w-3xl mx-auto">
        Encontre, crie e gerencie suas mesas de RPG aqui.
      </p>
      
      {/* Componente de grade de mesas disponíveis com barra de busca, filtros e botão de criação */}
      <AvailableTablesGrid />
    </div>
  );
};

export default GameTablesPage;