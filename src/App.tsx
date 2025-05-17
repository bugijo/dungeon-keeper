import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/layout/Header'; // Importando o Header
import './App.css'; // Supondo que você tenha um App.css para estilos globais do App

function App() {
  return (
    <div className="App pt-24"> {/* Adicionado padding-top para compensar a altura do Header fixo (h-24) */}
      <Header /> {/* Renderizando o Header */}
      <main className="p-4"> {/* Adicionado padding para o conteúdo principal */}
        <Outlet /> {/* Componentes de rota serão renderizados aqui */}
      </main>
      {/* Elementos de layout globais como Footer podem vir aqui */}
    </div>
  );
}

export default App;