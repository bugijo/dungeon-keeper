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
import MissionsPage from './pages/MissionsPage'; // Importando a página de Missões
import ShopPage from './pages/ShopPage'; // Importando a página de Loja
import SettingsPage from './pages/SettingsPage'; // Importando a página de Configurações
import ProfilePage from './pages/ProfilePage'; // Importando a página de Perfil
import TestPage from './pages/TestPage'; // Importando a página de teste
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
        <Route path="missions" element={<MissionsPage />} /> {/* Nova rota para Missões */}
        <Route path="shop" element={<ShopPage />} /> {/* Nova rota para Loja */}
        <Route path="settings" element={<SettingsPage />} /> {/* Nova rota para Configurações */}
        <Route path="profile" element={<ProfilePage />} /> {/* Nova rota para Perfil */}
        <Route path="teste" element={<TestPage />} /> {/* Nova rota para a página de teste */}
        {/* Adicione outras rotas aqui */}
        <Route path="*" element={<NotFound />} /> {/* Rota para páginas não encontradas */}
      </Route>
    </Routes>
  );
};

export default AppRoutes;