import React from "react";

const MesasPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="main-content">
        <header className="main-header">
          <h1>Gerenciador de Mesas de RPG</h1>
        </header>
        <div className="mesas-controls-top">
          <div className="search-bar-container">
            <input type="text" id="searchMesas" placeholder="Buscar por nome, mestre, gênero..." />
            <button className="btn btn-search"><i className="fas fa-search"></i> Buscar</button>
          </div>
          <button className="btn btn-primary btn-criar-mesa-grande">
            <i className="fas fa-plus-circle"></i> Criar Nova Mesa
          </button>
        </div>
        <main className="dashboard">
          <div className="mesas-grid">
            {/* Exemplo de Card de Mesa */}
            <article className="mesa-card">
              <img src="https://picsum.photos/seed/mesa1/400/250" alt="Imagem da Mesa Aventura Épica" />
              <div className="mesa-card-content">
                <h3>Aventura Épica nas Montanhas Geladas</h3>
                <p className="mesa-meta"><strong>Mestre:</strong> João Mestre RPG</p>
                <p className="mesa-description">Uma jornada perigosa em busca de um artefato antigo, enfrentando feras e o clima implacável.</p>
                <div className="mesa-tags">
                  <span className="tag-genero">Fantasia</span>
                  <span className="tag-sistema">D&D 5e</span>
                </div>
                <div className="mesa-info">
                  <span><i className="fas fa-users"></i> 3/5 Jogadores</span>
                  <span><i className="fas fa-calendar-alt"></i> Sáb, 20:00</span>
                </div>
                <p className="mesa-id">ID: #MESA123</p>
                <button className="btn btn-secondary btn-detalhes">Ver Detalhes</button>
              </div>
            </article>
            <article className="mesa-card">
              <img src="https://picsum.photos/seed/mesa2/400/250" alt="Imagem da Mesa Cyberpunk Nights" />
              <div className="mesa-card-content">
                <h3>Cyberpunk Nights: Contrato Sombrio</h3>
                <p className="mesa-meta"><strong>Mestre:</strong> Maria Cyber</p>
                <p className="mesa-description">Nas ruas de neon de Neo-Kyoto, um contrato misterioso aguarda mercenários habilidosos.</p>
                <div className="mesa-tags">
                  <span className="tag-genero">Cyberpunk</span>
                  <span className="tag-sistema">Cyberpunk Red</span>
                </div>
                <div className="mesa-info">
                  <span><i className="fas fa-users"></i> 4/4 Jogadores (Cheia)</span>
                  <span><i className="fas fa-calendar-alt"></i> Sex, 21:00</span>
                </div>
                <p className="mesa-id">ID: #MESA456</p>
                <button className="btn btn-secondary btn-detalhes">Ver Detalhes</button>
              </div>
            </article>
            {/* Adicionar mais cards conforme necessário */}
          </div>
        </main>
      </div>
      {/* Barra de navegação inferior para Mobile */}
      <nav className="bottom-nav">
        <a href="/mesas" className="bottom-nav-item active">
          <i className="fas fa-table-cells"></i>
          <span>Mesas</span>
        </a>
        <a href="/missoes" className="bottom-nav-item">
          <i className="fas fa-tasks"></i>
          <span>Missões</span>
        </a>
        <a href="/inventario" className="bottom-nav-item">
          <i className="fas fa-briefcase"></i>
          <span>Inventário</span>
        </a>
        <a href="/loja" className="bottom-nav-item">
          <i className="fas fa-store"></i>
          <span>Loja</span>
        </a>
        <a href="/home" className="bottom-nav-item">
          <i className="fas fa-home"></i>
          <span>Home</span>
        </a>
      </nav>
    </div>
  );
};

export default MesasPage;