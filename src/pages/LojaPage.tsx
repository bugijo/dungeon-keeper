import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../public/home_static.css";
import "../../public/loja_static.css";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "gold" | "gem";
  image: string;
  badge?: string;
  type?: string;
}

const initialGold = 500;
const initialGems = 20;

const items: ShopItem[] = [
  {
    id: "potion-life",
    name: "Poção de Vida",
    description: "Restaura uma pequena quantidade de pontos de vida.",
    price: 50,
    currency: "gold",
    image: "https://via.placeholder.com/150/6a4c93/ffd700?text=Poção+Vida",
    badge: "Popular",
  },
  {
    id: "sword-iron",
    name: "Espada de Ferro",
    description: "Uma espada básica, porém confiável, para aventureiros iniciantes.",
    price: 120,
    currency: "gold",
    image: "https://via.placeholder.com/150/b45dd9/ffffff?text=Espada+Ferro",
  },
  {
    id: "amulet-luck",
    name: "Amuleto da Sorte",
    description: "Dizem que este amuleto traz boa sorte ao seu portador.",
    price: 200,
    currency: "gold",
    image: "https://via.placeholder.com/150/ffd700/2b1b36?text=Amuleto+Sorte",
  },
  {
    id: "scroll-fireball",
    name: "Pergaminho: Bola de Fogo",
    description: "Um pergaminho mágico que ensina o feitiço Bola de Fogo.",
    price: 5,
    currency: "gem",
    image: "https://via.placeholder.com/150/ff4500/ffffff?text=Pergaminho",
    badge: "Premium",
  },
  {
    id: "armor-leather",
    name: "Armadura de Couro",
    description: "Oferece proteção básica sem comprometer a mobilidade.",
    price: 180,
    currency: "gold",
    image: "https://via.placeholder.com/150/8B4513/ffffff?text=Armadura",
  },
  {
    id: "map-treasure",
    name: "Mapa do Tesouro",
    description: "Revela a localização de um tesouro escondido nas Montanhas Sombrias.",
    price: 8,
    currency: "gem",
    image: "https://via.placeholder.com/150/C19A6B/000000?text=Mapa",
    badge: "Premium",
  },
];

const services: ShopItem[] = [
  {
    id: "service-blacksmith",
    name: "Ferreiro",
    description: "Melhora uma arma ou armadura existente, aumentando seus atributos.",
    price: 100,
    currency: "gold",
    image: "https://via.placeholder.com/150/CD7F32/000000?text=Ferreiro",
    type: "service",
  },
  {
    id: "service-enchanter",
    name: "Encantador",
    description: "Adiciona um efeito mágico a um item de sua escolha.",
    price: 10,
    currency: "gem",
    image: "https://via.placeholder.com/150/9370DB/ffffff?text=Encantador",
    badge: "Premium",
    type: "service",
  },
];

const LojaPage: React.FC = () => {
  const [gold, setGold] = useState(initialGold);
  const [gems, setGems] = useState(initialGems);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  const handleBuy = (item: ShopItem) => {
    if (item.currency === "gold" && gold >= item.price) {
      setGold(gold - item.price);
      setToast(`${item.name} adquirido com sucesso!`);
      setToastError(false);
    } else if (item.currency === "gem" && gems >= item.price) {
      setGems(gems - item.price);
      setToast(`${item.name} adquirido com sucesso!`);
      setToastError(false);
    } else {
      setToast(`Moedas insuficientes para comprar ${item.name}!`);
      setToastError(true);
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="page-container">
      <div className="main-content">
        <header className="main-header">
          <h1>Mercado do Aventureiro</h1>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: 8 }}>
            <span id="user-gold"><i className="fas fa-coins"></i> {gold} Ouro</span>
            <span id="user-gems"><i className="fas fa-gem"></i> {gems} Gemas</span>
          </div>
        </header>
        <main className="dashboard">
          <section className="dashboard-card">
            <h2>Itens à Venda</h2>
            <p>Adquira equipamentos, poções e artefatos para suas jornadas.</p>
            <div className="shop-items-grid">
              {items.map((item) => (
                <article key={item.id} className="shop-item-card" data-id={item.id} data-price={item.price} data-currency={item.currency}>
                  <div className="card-image-container-shop">
                    <img src={item.image} alt={item.name} className="item-image" />
                    {item.badge && <div className={`item-badge${item.badge === "Premium" ? " premium" : ""}`}>{item.badge}</div>}
                  </div>
                  <div className="card-content-shop">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>
                    <p className="item-price">
                      <i className={item.currency === "gold" ? "fas fa-coins" : "fas fa-gem"}></i> {item.price} {item.currency === "gold" ? "Ouro" : "Gemas"}
                    </p>
                    <button className="btn btn-primary btn-buy" onClick={() => handleBuy(item)}>Comprar</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="dashboard-card">
            <h2>Serviços</h2>
            <p>Contrate mercenários, ferreiros ou encantadores para auxiliar em suas aventuras.</p>
            <div className="shop-items-grid">
              {services.map((item) => (
                <article key={item.id} className="shop-item-card service-card" data-id={item.id} data-price={item.price} data-currency={item.currency}>
                  <div className="card-image-container-shop">
                    <img src={item.image} alt={item.name} className="item-image" />
                    {item.badge && <div className={`item-badge${item.badge === "Premium" ? " premium" : ""}`}>{item.badge}</div>}
                  </div>
                  <div className="card-content-shop">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>
                    <p className="item-price">
                      <i className={item.currency === "gold" ? "fas fa-coins" : "fas fa-gem"}></i> {item.price} {item.currency === "gold" ? "Ouro" : "Gemas"}
                    </p>
                    <button className="btn btn-primary btn-buy" onClick={() => handleBuy(item)}>Contratar</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
      <nav className="bottom-nav">
        <Link to="/" className="bottom-nav-item"><i className="fas fa-home"></i><span>Home</span></Link>
        <Link to="/mesas" className="bottom-nav-item"><i className="fas fa-table-cells"></i><span>Mesas</span></Link>
        <Link to="/missoes" className="bottom-nav-item"><i className="fas fa-tasks"></i><span>Missões</span></Link>
        <Link to="/inventario" className="bottom-nav-item"><i className="fas fa-briefcase"></i><span>Inventário</span></Link>
        <Link to="/loja" className="bottom-nav-item active"><i className="fas fa-store"></i><span>Loja</span></Link>
        <Link to="/criacoes" className="bottom-nav-item"><i className="fas fa-magic"></i><span>Criações</span></Link>
      </nav>
      {toast && (
        <div className={`purchase-notification show${toastError ? " error" : ""}`}>
          <i className={toastError ? "fas fa-times-circle" : "fas fa-check-circle"}></i>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default LojaPage;