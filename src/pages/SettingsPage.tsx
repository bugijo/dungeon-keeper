import React from 'react';
import MainLayout from '@/components/layout/MainLayout';

const SettingsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 text-white">
        <header className="mb-8">
          <h1 className="text-4xl font-medievalsharp text-fantasy-gold">Configurações</h1>
        </header>
        <section>
          <p className="text-fantasy-stone">
            Página de configurações em construção.
          </p>
          {/* Conteúdo das configurações virá aqui */}
        </section>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;