import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App'; 

// Importando componentes de página
import Home from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import CharacterCreation from './pages/creations/CharacterCreation';
import CreationsHubPage from './pages/CreationsHubPage'; // Importando a nova página
import InventoryPage from './pages/InventoryPage'; // Importando a página de Inventário
import GameTablesPage from './pages/GameTablesPage'; // Importando a página de Mesas de Jogo
import CreateGameTablePage from './pages/CreateGameTablePage'; // Importando a página de Criação de Mesa de Jogo
import GameTableDetailPage from './pages/GameTableDetailPage'; // Importando a página de Detalhes da Mesa de Jogo
// Adicione outras importações de página conforme necessário

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        {/* Rotas aninhadas que usarão o layout de App */}
        <Route index element={<Home />} /> {/* Rota padrão para '/' */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="creations" element={<CreationsHubPage />} /> {/* Nova rota para o Hub de Criações */}
        <Route path="inventory" element={<InventoryPage />} /> {/* Nova rota para o Inventário */}
        <Route path="tables" element={<GameTablesPage />} /> {/* Nova rota para Mesas de Jogo */}
        <Route path="tables/create" element={<CreateGameTablePage />} /> {/* Nova rota para Criação de Mesas de Jogo */}
        <Route path="tables/:id" element={<GameTableDetailPage />} /> {/* Nova rota para Detalhes da Mesa de Jogo */}
        <Route path="creations/characters" element={<CharacterCreation />} />
        {/* Adicione outras rotas aqui */}
        <Route path="*" element={<NotFound />} /> {/* Rota para páginas não encontradas */}]}}}

      </Route>
    </Routes>
  );
};

export default AppRoutes;