import React from 'react';

const GameTablesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 text-amber-50 font-serif">
      <h1 className="text-4xl font-bold text-center text-amber-400 mb-10 tracking-wider">Mesas de Jogo</h1>
      <p className="text-center text-amber-100 mb-12 text-lg max-w-3xl mx-auto">
        Encontre, crie e gerencie suas mesas de RPG aqui.
      </p>
      {/* TODO: Adicionar barra de busca e filtros */}
      {/* TODO: Adicionar botão para criar nova mesa */}
      {/* TODO: Adicionar listagem de mesas */}
    </div>
  );
};

export default GameTablesPage;