import React from 'react';
import MainLayout from '@/components/layout/MainLayout';

const ProfilePage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 text-white">
        <header className="mb-8">
          <h1 className="text-4xl font-medievalsharp text-fantasy-gold">Perfil do Jogador</h1>
        </header>
        <section>
          <p className="text-fantasy-stone">
            Página de perfil em construção.
          </p>
          {/* Conteúdo do perfil virá aqui */}
        </section>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;