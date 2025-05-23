import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../public/home_static.css";
import "../../public/missoes_static.css";

interface Mission {
  id: string;
  icon: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  completed: boolean;
  rewards: { type: string; value: string }[];
  detailsLink?: string;
}

const initialMissions: Mission[] = [
  {
    id: "create-character",
    icon: "fas fa-scroll",
    title: "Crie seu Primeiro Personagem",
    description: "Crie um personagem completo com história, atributos e habilidades para iniciar sua jornada.",
    progress: 30,
    total: 100,
    completed: false,
    rewards: [
      { type: "gold", value: "100 Ouro" },
      { type: "gem", value: "5 Gemas" },
      { type: "xp", value: "200 XP" },
    ],
    detailsLink: "/criar-personagem",
  },
  {
    id: "explore-map",
    icon: "fas fa-map-marked-alt",
    title: "Explore o Mapa Inicial",
    description: "Visite todos os pontos de interesse no mapa inicial do Reino de Eldoria.",
    progress: 100,
    total: 100,
    completed: false,
    rewards: [
      { type: "gold", value: "50 Ouro" },
      { type: "item", value: "Troféu Explorador" },
    ],
  },
  {
    id: "first-game",
    icon: "fas fa-dice-d20",
    title: "Jogue sua Primeira Partida",
    description: "Participe de uma sessão de jogo com outros jogadores ou com o mestre.",
    progress: 100,
    total: 100,
    completed: true,
    rewards: [
      { type: "gold", value: "200 Ouro" },
      { type: "gem", value: "10 Diamantes" },
    ],
  },
  {
    id: "create-history",
    icon: "fas fa-book",
    title: "Crie sua Primeira História",
    description: "Escreva uma história ou lenda para enriquecer o mundo do seu personagem.",
    progress: 0,
    total: 100,
    completed: false,
    rewards: [
      { type: "gold", value: "150 Ouro" },
      { type: "xp", value: "300 XP" },
    ],
    detailsLink: "/criar-historia",
  },
];

const MissoesPage: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [toast, setToast] = useState<string | null>(null);

  const handleClaimReward = (index: number) => {
    setMissions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], completed: true };
      return updated;
    });
    setToast("Recompensa resgatada com sucesso!");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="page-container">
      <div className="main-content">
        <header className="main-header">
          <h1>Quadro de Missões</h1>
        </header>
        <main className="dashboard">
          <section className="dashboard-card">
            <h2>Desafios do Reino</h2>
            <p>Encare desafios propostos pelos Guardiões e ganhe recompensas épicas!</p>
            {missions.map((mission, idx) => {
              const percentage = Math.min((mission.progress / mission.total) * 100, 100);
              const readyToClaim = !mission.completed && mission.progress >= mission.total;
              return (
                <div
                  key={mission.id}
                  className={`mission-item${mission.completed ? " completed" : ""}${readyToClaim ? " ready-to-claim" : ""}`}
                  aria-label={mission.title}
                >
                  <h3><i className={mission.icon}></i> {mission.title}</h3>
                  <p className="mission-description">{mission.description}</p>
                  <div className="progress-bar-container">
                    <div className={`progress-bar${percentage === 100 ? " full" : ""}`} style={{ width: `${percentage}%` }}></div>
                    <span className="progress-text">{mission.progress}/{mission.total}</span>
                  </div>
                  <div className="mission-reward">
                    <i className="fas fa-trophy"></i> Recompensas:
                    {mission.rewards.map((r, i) => (
                      <span key={i} className={`reward-item reward-${r.type}`}><i className={r.type === "gold" ? "fas fa-coins" : r.type === "gem" ? "fas fa-gem" : r.type === "xp" ? "fas fa-star" : "fas fa-medal"}></i> {r.value}</span>
                    ))}
                  </div>
                  <div className="mission-actions">
                    {mission.completed ? (
                      <button className="btn btn-secondary btn-view-details" disabled>Concluída</button>
                    ) : readyToClaim ? (
                      <button className="btn btn-claim-reward" onClick={() => handleClaimReward(idx)}>Resgatar Recompensa</button>
                    ) : (
                      <>
                        <button className="btn btn-secondary btn-view-details" onClick={() => mission.detailsLink && window.location.assign(mission.detailsLink)}>Ver Detalhes</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </main>
      </div>
      <nav className="bottom-nav">
        <Link to="/" className="bottom-nav-item"><i className="fas fa-home"></i><span>Home</span></Link>
        <Link to="/mesas" className="bottom-nav-item"><i className="fas fa-table-cells"></i><span>Mesas</span></Link>
        <Link to="/missoes" className="bottom-nav-item active"><i className="fas fa-tasks"></i><span>Missões</span></Link>
        <Link to="/inventario" className="bottom-nav-item"><i className="fas fa-briefcase"></i><span>Inventário</span></Link>
        <Link to="/loja" className="bottom-nav-item"><i className="fas fa-store"></i><span>Loja</span></Link>
        <Link to="/criacoes" className="bottom-nav-item"><i className="fas fa-magic"></i><span>Criações</span></Link>
      </nav>
      {toast && (
        <div className="reward-toast show">
          <i className="fas fa-trophy"></i>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default MissoesPage;