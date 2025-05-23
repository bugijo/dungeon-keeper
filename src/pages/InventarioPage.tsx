import React from "react";
import "../../public/inventario_static.css";
import "../../public/home_static.css";

const InventarioPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="main-content">
        <header className="main-header">
          <h1>Bolsa de Tesouros</h1>
        </header>
        <main className="inventory-container">
          <div className="inventory-section">
            <h2><i className="fas fa-dice-d20"></i> Meus Jogos</h2>
            <div className="inventory-grid">
              <div className="inventory-item">
                <img src="/images/placeholder.svg" alt="Capa do Jogo" />
                <h4>A Lenda do Herói Esquecido</h4>
                <p>Mestre: AventureiroMestre</p>
                <button className="btn btn-secondary">Acessar Jogo</button>
              </div>
            </div>
          </div>
          <div className="inventory-section">
            <h2><i className="fas fa-trophy"></i> Meus Troféus</h2>
            <div className="inventory-grid">
              <div className="inventory-item trophy-item">
                <i className="fas fa-shield-alt fa-3x"></i>
                <h4>Primeira Vitória</h4>
                <p>Conquistado em: 20/07/2024</p>
              </div>
            </div>
          </div>
          <div className="inventory-section">
            <h2><i className="fas fa-scroll"></i> Meus Itens Criados</h2>
            <div className="inventory-grid">
              <div className="inventory-item">
                <img src="/images/placeholder.svg" alt="Espada Lendária" />
                <h4>Espada Lendária da Aurora</h4>
                <p>Tipo: Arma</p>
              </div>
            </div>
          </div>
          <div className="inventory-section">
            <h2><i className="fas fa-users"></i> Meus NPCs Criados</h2>
            <div className="inventory-grid">
              <div className="inventory-item">
                <img src="/images/placeholder.svg" alt="Elara, a Sábia" />
                <h4>Elara, a Sábia</h4>
                <p>Raça: Elfa</p>
              </div>
            </div>
          </div>
          <div className="inventory-section">
            <h2><i className="fas fa-map-marked-alt"></i> Meus Mapas Criados</h2>
            <div className="inventory-grid">
              <div className="inventory-item">
                <img src="/images/placeholder.svg" alt="Floresta Sussurrante" />
                <h4>Floresta Sussurrante</h4>
                <p>Dimensões: 30x30</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <nav className="bottom-nav">
        <a href="/home_static.html" className="bottom-nav-item"><i className="fas fa-home"></i><span>Home</span></a>
        <a href="/mesas.html" className="bottom-nav-item"><i className="fas fa-table-cells"></i><span>Mesas</span></a>
        <a href="/missoes.html" className="bottom-nav-item"><i className="fas fa-tasks"></i><span>Missões</span></a>
        <a href="/inventario.html" className="bottom-nav-item active"><i className="fas fa-briefcase"></i><span>Inventário</span></a>
        <a href="/loja.html" className="bottom-nav-item"><i className="fas fa-store"></i><span>Loja</span></a>
        <a href="/creations_static.html" className="bottom-nav-item"><i className="fas fa-magic"></i><span>Criações</span></a>
      </nav>
    </div>
  );
};

export default InventarioPage;