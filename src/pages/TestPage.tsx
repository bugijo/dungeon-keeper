import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';

const TestPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-fantasy-dark text-fantasy-paper p-4 sm:p-6 md:p-8">
        <div className="max-w-screen-xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-fantasy-gold tracking-wider">
              Página de Teste React
            </h1>
            <p className="mt-4 text-xl text-fantasy-paper">
              Esta página foi criada para testar se a aplicação React está funcionando corretamente.
            </p>
          </header>
          
          <div className="bg-fantasy-purple bg-opacity-30 p-6 rounded-lg shadow-xl border border-fantasy-accent mb-6">
            <h2 className="text-2xl font-semibold text-fantasy-gold mb-4">Instruções</h2>
            <p className="mb-4">
              Se você está vendo esta página, significa que a aplicação React está funcionando corretamente.
              O problema pode estar relacionado à forma como você está acessando a aplicação.
            </p>
            <p className="mb-4">
              Para acessar a aplicação React completa, você deve usar a URL base: <span className="text-fantasy-gold font-bold">http://localhost:3000/</span>
            </p>
            <p>
              Evite acessar diretamente os arquivos HTML na pasta public (como /home.html, /shop.html, etc.).
              Esses arquivos são estáticos e não fazem parte da aplicação React principal.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link to="/" className="block transform hover:scale-105 transition-transform duration-300">
              <div className="bg-fantasy-purple bg-opacity-30 hover:bg-opacity-50 p-6 rounded-lg shadow-xl border border-fantasy-accent h-full flex flex-col justify-between">
                <h2 className="text-2xl font-semibold text-fantasy-gold mb-2">Página Inicial</h2>
                <p className="text-fantasy-paper text-sm">Voltar para a página inicial da aplicação React</p>
              </div>
            </Link>
            
            <Link to="/shop" className="block transform hover:scale-105 transition-transform duration-300">
              <div className="bg-fantasy-purple bg-opacity-30 hover:bg-opacity-50 p-6 rounded-lg shadow-xl border border-fantasy-accent h-full flex flex-col justify-between">
                <h2 className="text-2xl font-semibold text-fantasy-gold mb-2">Loja</h2>
                <p className="text-fantasy-paper text-sm">Ir para a página da loja na aplicação React</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TestPage;