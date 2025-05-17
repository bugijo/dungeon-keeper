import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Funções de exemplo para as ações
  const handleChangeEmail = () => console.log('Alterar Email Clicado');
  const handleChangePassword = () => console.log('Alterar Senha Clicado');
  const handleManageAccount = () => console.log('Gerenciar Conta Clicado');
  const handleDeleteAccount = () => console.log('Excluir Conta Clicado');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-stone-800 text-amber-50 p-6 rounded-xl shadow-2xl w-full max-w-2xl border-2 border-amber-700 transform transition-all duration-300 ease-out scale-100 flex flex-col font-serif" style={{ backgroundImage: "url('/textures/wood-pattern-dark.png')", maxHeight: '90vh' }}
        style={{ maxHeight: '90vh' }} // Limitar altura máxima
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-amber-300 tracking-wider">Configurações Arcanas</h2>
          <button 
            onClick={onClose} 
            className="text-amber-200 hover:text-amber-50 transition-colors duration-150 p-1 rounded-full hover:bg-white hover:bg-opacity-10"
            aria-label="Fechar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-grow pr-2 space-y-6">
          {/* Seção Conta */}
          <section>
            <h3 className="text-xl font-semibold text-amber-400 mb-4 border-b-2 border-amber-700 pb-2 tracking-wide">Pergaminhos da Conta</h3>
            <div className="space-y-3">
              <button onClick={handleChangeEmail} className="w-full text-left p-3 bg-stone-700 hover:bg-amber-700 hover:text-stone-900 rounded-md transition-colors duration-150 text-amber-100 text-lg">Alterar Email Arcano</button>
              <button onClick={handleChangePassword} className="w-full text-left p-3 bg-stone-700 hover:bg-amber-700 hover:text-stone-900 rounded-md transition-colors duration-150 text-amber-100 text-lg">Mudar Palavra Secreta</button>
              <button onClick={handleManageAccount} className="w-full text-left p-3 bg-stone-700 hover:bg-amber-700 hover:text-stone-900 rounded-md transition-colors duration-150 text-amber-100 text-lg">Administrar Domínio</button>
              <button onClick={handleDeleteAccount} className="w-full text-left p-3 text-red-400 bg-stone-700 hover:bg-red-800 hover:text-white rounded-md transition-colors duration-150 font-semibold text-lg">Banir Conta para o Vazio</button>
            </div>
          </section>

          {/* Seção Preferências */}
          <section>
            <h3 className="text-xl font-semibold text-amber-400 mb-4 border-b-2 border-amber-700 pb-2 tracking-wide">Editos Pessoais</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="language-select" className="block text-md mb-1 text-amber-200">Dialeto Preferido:</label>
                <select id="language-select" className="w-full p-3 bg-stone-700 border border-amber-600 rounded-md focus:ring-amber-500 focus:border-amber-500 text-amber-50 text-lg">
                  <option value="pt-br">Português (Brasil)</option>
                  <option value="en-us">English (US)</option>
                </select>
              </div>
              <div>
                <label htmlFor="theme-select" className="block text-md mb-1 text-amber-200">Aparência do Grimório:</label>
                <select id="theme-select" className="w-full p-3 bg-stone-700 border border-amber-600 rounded-md focus:ring-amber-500 focus:border-amber-500 text-amber-50 text-lg">
                  <option value="dark">Estilo Medieval Sombrio</option>
                  {/* <option value="light">Claro (Em breve)</option> */}
                </select>
              </div>
              <fieldset>
                <legend className="text-md mb-2 text-amber-200">Sinais e Presságios (Notificações):</legend>
                <div className="space-y-1 pl-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="form-checkbox bg-stone-600 border-amber-600 text-amber-500 h-5 w-5 focus:ring-amber-500 rounded" defaultChecked />
                    <span class="text-amber-100 text-lg">Novas Jornadas e Desafios</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="form-checkbox bg-stone-600 border-amber-600 text-amber-500 h-5 w-5 focus:ring-amber-500 rounded" defaultChecked />
                    <span class="text-amber-100 text-lg">Convocações para Aventuras</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="form-checkbox bg-stone-600 border-amber-600 text-amber-500 h-5 w-5 focus:ring-amber-500 rounded" />
                    <span class="text-amber-100 text-lg">Missivas de Companheiros</span>
                  </label>
                </div>
              </fieldset>
            </div>
          </section>

          {/* Seção Privacidade */}
          <section>
            <h3 className="text-xl font-semibold text-amber-400 mb-4 border-b-2 border-amber-700 pb-2 tracking-wide">Segredos e Sombras (Privacidade)</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-stone-700 hover:bg-stone-600 rounded-md cursor-pointer transition-colors duration-150">
                <span class="text-amber-100 text-lg">Exibir Perfil aos Reinos</span>
                <input type="checkbox" className="form-checkbox bg-stone-600 border-amber-600 text-amber-500 h-6 w-6 focus:ring-amber-500 rounded" defaultChecked />
              </label>
              <label className="flex items-center justify-between p-3 bg-stone-700 hover:bg-stone-600 rounded-md cursor-pointer transition-colors duration-150">
                <span class="text-amber-100 text-lg">Revelar Feitos aos Aliados</span>
                <input type="checkbox" className="form-checkbox bg-stone-600 border-amber-600 text-amber-500 h-6 w-6 focus:ring-amber-500 rounded" defaultChecked />
              </label>
            </div>
          </section>

          {/* Seção Sobre */}
          <section>
            <h3 className="text-xl font-semibold text-amber-400 mb-4 border-b-2 border-amber-700 pb-2 tracking-wide">Crônicas do Reino (Sobre)</h3>
            <div className="text-md text-amber-200 space-y-2 italic">
              <p>Edição do Tomo: 0.1.0 (Era das Descobertas)</p>
              <a href="#" className="block text-amber-300 hover:text-amber-100 hover:underline">Pactos e Juramentos (Termos)</a>
              <a href="#" className="block text-amber-300 hover:text-amber-100 hover:underline">Decretos de Sigilo (Privacidade)</a>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-amber-700">
          <button 
            onClick={onClose} 
            className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-700 text-stone-900 rounded-lg transition-all duration-200 font-bold text-xl shadow-md border border-amber-800 hover:shadow-lg transform hover:scale-105"
          >
            Selar os Encantamentos (Salvar)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;