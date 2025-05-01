import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import EnhancedDiceRoller from '@/components/dice/EnhancedDiceRoller';
import { Dices } from 'lucide-react';

const DiceRollerPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-medievalsharp text-white flex items-center">
            <Dices className="mr-3" />
            Rolador de Dados
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <EnhancedDiceRoller />
          </div>
          
          <div className="fantasy-card p-6">
            <h2 className="text-xl font-medievalsharp text-fantasy-gold mb-4">Como Usar</h2>
            
            <div className="space-y-4 text-fantasy-stone">
              <p>
                O rolador de dados permite que você faça rolagens virtuais para seus jogos de RPG.
                Você pode escolher entre diferentes tipos de dados (d4, d6, d8, d10, d12, d20, d100).
              </p>
              
              <div>
                <h3 className="text-lg font-medievalsharp text-fantasy-purple mb-2">Recursos</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Escolha entre vários tipos de dados</li>
                  <li>Adicione modificadores às suas rolagens</li>
                  <li>Role múltiplos dados de uma vez</li>
                  <li>Visualize o histórico de rolagens</li>
                  <li>Animações e feedback visual em tempo real</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medievalsharp text-fantasy-purple mb-2">Dicas</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Clique em um tipo de dado para selecioná-lo</li>
                  <li>Use os controles de quantidade para rolar vários dados de uma vez</li>
                  <li>Adicione modificadores positivos ou negativos às suas rolagens</li>
                  <li>Veja o histórico de rolagens anteriores clicando em "Mostrar"</li>
                  <li>Limpe o histórico com o botão de lixeira</li>
                </ul>
              </div>
              
              <p>
                Durante as sessões de jogo, você também terá acesso ao rolador de dados
                diretamente no chat, permitindo compartilhar os resultados com outros jogadores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DiceRollerPage;