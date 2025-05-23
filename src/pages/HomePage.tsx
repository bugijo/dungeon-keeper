import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/SupabaseAuthContext"; // Importar o hook useAuth do SupabaseAuthContext
// import "../../public/home_static.css"; // TODO: Refatorar para usar Tailwind CSS ou estilos globais consistentes. Arquivo CSS não encontrado e removido.

const HomePage: React.FC = () => {
  const { user } = useAuth(); // Obter o usuário atual do SupabaseAuthContext

  return (
    <div className="min-h-screen bg-fantasy-dark text-fantasy-paper p-4 sm:p-6 md:p-8">
      <div className="max-w-screen-xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-fantasy-gold tracking-wider">
            {user && user.user_metadata?.name
              ? `Bem-vindo de volta, ${user.user_metadata.name}!`
              : "Bem-vindo ao Reino das Aventuras"}
          </h1>
        </header>
        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/tables" className="block transform hover:scale-105 transition-transform duration-300">
            <section className="bg-fantasy-purple bg-opacity-30 hover:bg-opacity-50 p-6 rounded-lg shadow-xl border border-fantasy-accent h-full flex flex-col justify-between">
              <h2 className="text-2xl font-semibold text-fantasy-gold mb-2">Mesas</h2>
              <p className="text-fantasy-paper text-sm">Gerencie e participe de mesas de RPG</p>
            </section>
          </Link>
          <Link to="/missions" className="block transform hover:scale-105 transition-transform duration-300">
            <section className="bg-fantasy-purple bg-opacity-30 hover:bg-opacity-50 p-6 rounded-lg shadow-xl border border-fantasy-accent h-full flex flex-col justify-between">
              <h2 className="text-2xl font-semibold text-fantasy-gold mb-2">Missões</h2>
              <p className="text-fantasy-paper text-sm">Complete missões e ganhe recompensas</p>
            </section>
          </Link>
          <Link to="/inventario" className="block transform hover:scale-105 transition-transform duration-300">
            <section className="bg-fantasy-purple bg-opacity-30 hover:bg-opacity-50 p-6 rounded-lg shadow-xl border border-fantasy-accent h-full flex flex-col justify-between">
              <h2 className="text-2xl font-semibold text-fantasy-gold mb-2">Inventário</h2>
              <p className="text-fantasy-paper text-sm">Veja e gerencie todos os seus itens</p>
            </section>
          </Link>
          <Link to="/shop" className="block transform hover:scale-105 transition-transform duration-300">
            <section className="bg-fantasy-purple bg-opacity-30 hover:bg-opacity-50 p-6 rounded-lg shadow-xl border border-fantasy-accent h-full flex flex-col justify-between">
              <h2 className="text-2xl font-semibold text-fantasy-gold mb-2">Loja</h2>
              <p className="text-fantasy-paper text-sm">Adquira itens e recursos para suas aventuras</p>
            </section>
          </Link>
          <Link to="/creations" className="block transform hover:scale-105 transition-transform duration-300 sm:col-span-2 lg:col-span-1">
            <section className="bg-fantasy-purple bg-opacity-30 hover:bg-opacity-50 p-6 rounded-lg shadow-xl border border-fantasy-accent h-full flex flex-col justify-between">
              <h2 className="text-2xl font-semibold text-fantasy-gold mb-2">Portal de Criações</h2>
              <p className="text-fantasy-paper text-sm">Crie personagens, itens, monstros e mais</p>
            </section>
          </Link>
        </main>
      </div>
      {/* A navegação inferior agora é tratada pelo MobileNavigation no MainLayout */}
    </div>
  );
};

export default HomePage;