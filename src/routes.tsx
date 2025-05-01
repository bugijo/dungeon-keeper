import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/SupabaseAuthContext';

// Páginas principais
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Tables from './pages/Tables';
import Character from './pages/Character';
import CharacterLibrary from './pages/CharacterLibrary';
import Creations from './pages/Creations';
import CreationsCollection from './pages/CreationsCollection';
import CreationRouter from './pages/CreationRouter';
import MapCollection from './pages/MapCollection';
import MapsView from './pages/MapsView';
import ItemsView from './pages/ItemsView';
import MonstersView from './pages/MonstersView';
import NpcsView from './pages/NpcsView';
import StoriesView from './pages/StoriesView';
import Shop from './pages/Shop';
import DiceRoller from './pages/DiceRoller';
import Inventory from './pages/Inventory';
import InventoryPage from './pages/InventoryPage';
import Missions from './pages/Missions';
import TacticalMapSystem from './pages/TacticalMapSystem';
import TacticalCombat from './pages/TacticalCombat';
import MapTacticalDemo from './pages/MapTacticalDemo';
import Session from './pages/Session';
import LiveSession from './pages/LiveSession';
import GameMasterView from './pages/GameMasterView';
import PlayerView from './pages/PlayerView';
import SessionScheduler from './pages/SessionScheduler';

// Componente de rota protegida
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Rotas protegidas */}
      <Route path="/tables" element={<ProtectedRoute><Tables /></ProtectedRoute>} />
      <Route path="/character/:id" element={<ProtectedRoute><Character /></ProtectedRoute>} />
      <Route path="/characters" element={<ProtectedRoute><CharacterLibrary /></ProtectedRoute>} />
      <Route path="/creations" element={<ProtectedRoute><Creations /></ProtectedRoute>} />
      <Route path="/creations/collection" element={<ProtectedRoute><CreationsCollection /></ProtectedRoute>} />
      <Route path="/creations/:type" element={<ProtectedRoute><CreationRouter /></ProtectedRoute>} />
      <Route path="/maps" element={<ProtectedRoute><MapCollection /></ProtectedRoute>} />
      <Route path="/maps/view" element={<ProtectedRoute><MapsView /></ProtectedRoute>} />
      <Route path="/items" element={<ProtectedRoute><ItemsView /></ProtectedRoute>} />
      <Route path="/monsters" element={<ProtectedRoute><MonstersView /></ProtectedRoute>} />
      <Route path="/npcs" element={<ProtectedRoute><NpcsView /></ProtectedRoute>} />
      <Route path="/stories" element={<ProtectedRoute><StoriesView /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
      <Route path="/dice" element={<ProtectedRoute><DiceRoller /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/inventory/:id" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
      <Route path="/missions" element={<ProtectedRoute><Missions /></ProtectedRoute>} />
      <Route path="/tactical-map" element={<ProtectedRoute><TacticalMapSystem /></ProtectedRoute>} />
      <Route path="/tactical-combat" element={<ProtectedRoute><TacticalCombat /></ProtectedRoute>} />
      <Route path="/map-demo" element={<ProtectedRoute><MapTacticalDemo /></ProtectedRoute>} />
      
      {/* Rotas de sessão */}
      <Route path="/session/:id" element={<ProtectedRoute><Session /></ProtectedRoute>} />
      <Route path="/live-session/:id" element={<ProtectedRoute><LiveSession /></ProtectedRoute>} />
      <Route path="/game-master/:id" element={<ProtectedRoute><GameMasterView /></ProtectedRoute>} />
      <Route path="/player/:id" element={<ProtectedRoute><PlayerView /></ProtectedRoute>} />
      <Route path="/session-scheduler" element={<ProtectedRoute><SessionScheduler /></ProtectedRoute>} />
      
      {/* Rota 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;