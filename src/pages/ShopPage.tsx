import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom'; // Se necessário para links internos
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
 import { useUserBalance } from '@/hooks/useUserBalance';
import { useInventorySync } from '@/hooks/useInventorySync';
import DraggableInventoryItem from '@/components/game/inventory/DraggableInventoryItem';
import { supabase } from '@/integrations/supabase/client'; // Importe o cliente Supabase configurado corretamente
// import './ShopPage.css'; // Para estilos específicos da página

// A interface ShopItem pode ser movida para um arquivo de tipos (ex: src/types.ts) se usada em múltiplos lugares
interface ShopItem {
  id: string; // Geralmente um UUID do Supabase
  name: string;
  description: string;
  price: number;
  currency: 'gold' | 'gem'; // Ou string se houver mais tipos
  image_url: string; // Nome da coluna no Supabase (geralmente snake_case)
  badge?: string;
  type: 'item' | 'service'; // Ou string
  // Adicione outros campos que existam na sua tabela 'shop_items'
  created_at?: string; // Exemplo de campo do Supabase
  stock?: number;
  rarity?: string;
  category?: string;
}

const ShopPage: React.FC = () => {
  const { user } = useAuth();
  const { coins: userGold, gems: userGems, loading: balanceLoading, refetch: refetchBalance } = useUserBalance();
  // Inventário do usuário (reativo)
  const { inventory, loading: inventoryLoading, error: inventoryError } = useInventorySync({ characterId: user?.id || '' });
  const [items, setItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filterType, setFilterType] = useState<'all' | 'item' | 'service'>('all');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name-asc'>('name-asc');

  // Atualiza saldo do usuário ao carregar a página e após compras
  const fetchUserBalance = async () => {
    if (!user) return { gold: 0, gems: 0 };
    const { data, error } = await supabase
      .from('user_balance')
      .select('coins, gems')
      .eq('user_id', user.id)
      .single();
    if (error || !data) return { gold: 0, gems: 0 };
    return { gold: data.coins, gems: data.gems };
  };

  useEffect(() => {
    const fetchShopItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: supabaseError } = await supabase
          .from('shop_items')
          .select('*');
        if (supabaseError) throw supabaseError;
        setItems(data as ShopItem[] || []);
      } catch (err: any) {
        setError(`Não foi possível carregar os itens da loja: ${err.message || 'Erro desconhecido'}. Tente novamente mais tarde.`);
      }
      setIsLoading(false);
    };
    if (user) {
      fetchShopItems();
      // Atualizar o saldo do usuário usando o hook
      refetchBalance();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Atualiza saldo após compra
  const refreshUserBalance = async () => {
    // Usar o hook para atualizar o saldo
    refetchBalance();
  };

  // Filtrar e ordenar itens com base nos critérios de busca e ordenação
  const filteredAndSortedItems = items
    .filter(item => {
      // Filtrar por termo de busca (nome ou descrição)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
        );
      }
      // Filtrar por tipo (item ou serviço)
      if (filterType !== 'all') {
        return item.type === filterType;
      }
      return true;
    })
    .sort((a, b) => {
      // Ordenar por critério selecionado
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  // Função utilitária para atualizar saldo do usuário
  const updateUserBalance = async (newGold: number, newGems: number) => {
    if (!user) return false;
    const { error } = await supabase
      .from('user_balance')
      .update({ coins: newGold, gems: newGems })
      .eq('user_id', user.id);
    return !error;
  };

  // Função utilitária para adicionar item ao inventário
  const addItemToInventory = async (itemId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from('user_inventory')
      .insert([{ user_id: user.id, item_id: itemId }]);
    return !error;
  };

  const handlePurchase = async (item: ShopItem) => {
    setIsPurchasing(true);
    setPurchaseMessage(null);
    try {
      if (!user) {
        setPurchaseMessage('Você precisa estar logado para comprar.');
        setIsPurchasing(false);
        return;
      }
      // Buscar saldo atualizado
      const { gold, gems } = await fetchUserBalance();
      const hasEnough = item.currency === 'gold' ? gold >= item.price : gems >= item.price;
      if (!hasEnough) {
        setPurchaseMessage('Saldo insuficiente para esta compra.');
        setIsPurchasing(false);
        return;
      }
      // Debitar saldo
      const newGold = item.currency === 'gold' ? gold - item.price : gold;
      const newGems = item.currency === 'gems' ? gems - item.price : gems;
      const balanceUpdated = await updateUserBalance(newGold, newGems);
      if (!balanceUpdated) {
        setPurchaseMessage('Erro ao debitar saldo. Tente novamente.');
        setIsPurchasing(false);
        return;
      }
      // Adicionar item ao inventário
      const inventoryUpdated = await addItemToInventory(item.id);
      if (!inventoryUpdated) {
        setPurchaseMessage('Erro ao adicionar item ao inventário. Seu saldo não foi debitado.');
        await updateUserBalance(gold, gems);
        setIsPurchasing(false);
        return;
      }
      setPurchaseMessage('Compra realizada com sucesso! Item adicionado ao seu inventário.');
      await refreshUserBalance(); // Atualiza saldo em tempo real
      // TODO: Atualizar inventário do usuário na interface, se necessário
    } catch (err: any) {
      setPurchaseMessage('Erro inesperado ao processar a compra.');
    }
    setIsPurchasing(false);
  };

  // Ajuste na altura para ocupar o espaço disponível menos header/footer
  const mainContentHeight = 'h-[calc(100vh-var(--header-height,80px)-var(--footer-height,60px))]';

  if (!user && !isLoading) { // Adicionado !isLoading para evitar piscar a tela de login antes de carregar
    return (
      <MainLayout>
        <div className={`flex flex-col items-center justify-center ${mainContentHeight} bg-gray-900 text-white p-8`}>
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">Acesso Restrito</h1>
          <p className="text-lg text-center mb-6">
            Você precisa estar logado para acessar a Loja Mística.
          </p>
          {/* Idealmente, um botão para ir para a página de login */}
          {/* <Link to="/login" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
            Ir para Login
          </Link> */}
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className={`container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-900 ${mainContentHeight} flex justify-center items-center`}>
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-yellow-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl text-yellow-400">Carregando tesouros da loja...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className={`container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-900 ${mainContentHeight} flex flex-col justify-center items-center text-center`}>
          <svg className="w-16 h-16 text-red-500 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h1 className="text-3xl font-bold text-red-500 mb-4">Oops! Algo deu errado</h1>
          <p className="text-lg text-gray-300 mb-6 px-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} // Simples recarregar a página
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            Tentar Novamente
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={`container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-900 min-h-[calc(100vh-var(--header-height,80px)-var(--footer-height,60px))]`}>
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400 tracking-wider">
            Loja Mística de Kaelar
          </h1>
          <p className="text-lg text-gray-300 mt-2">
            Os melhores artefatos e serviços para suas aventuras!
          </p>
        </header>

        <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
          <input 
            type="text" 
            placeholder="Buscar por nome ou descrição..." 
            className="p-3 rounded-lg bg-gray-700 text-white w-full sm:flex-grow border border-gray-600 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* TODO: Adicionar mais filtros (tipo, categoria, raridade) e select para ordenação (preço, nome) */}
          <p className="text-sm text-gray-400 hidden sm:block">Filtros avançados em breve!</p>
        </div>

        <div className="mb-8 p-4 bg-gradient-to-r from-purple-700 to-indigo-700 rounded-lg shadow-xl text-white flex flex-col sm:flex-row justify-around items-center gap-4">
          <div className='text-center sm:text-left'>
            <span className="block text-sm font-medium text-yellow-300">Seu Ouro</span>
            <span className="text-2xl font-bold">{userGold.toLocaleString()} G</span>
          </div>
          <div className='text-center sm:text-left'>
            <span className="block text-sm font-medium text-yellow-300">Suas Gemas</span>
            <span className="text-2xl font-bold">{userGems.toLocaleString()} ♦</span>
          </div>
        </div>

        {filteredAndSortedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredAndSortedItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 border border-gray-700 hover:border-yellow-400 flex flex-col"
              >
                <img 
                  src={item.image_url || 'https://via.placeholder.com/300x200/4A2E6A/FFFFFF?Text=Item+Misterioso'} // Usar item.image_url e um placeholder melhor
                  alt={item.name} 
                  className="w-full h-48 object-cover"
                />
                {item.badge && (
                  <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded ${item.badge === 'Popular' ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
                    {item.badge}
                  </span>
                )}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold text-yellow-400 mb-1 truncate" title={item.name}>{item.name}</h3>
                  <p className="text-sm text-gray-300 mb-3 h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 flex-grow">{item.description}</p>
                  <div className="flex justify-between items-center mt-auto mb-3 pt-2 border-t border-gray-700">
                    <p className="text-lg font-bold text-green-400">
                      {item.price.toLocaleString()} {item.currency === 'gold' ? 'G' : '♦'}
                    </p>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${item.type === 'item' ? 'bg-purple-600' : 'bg-teal-600'} text-white capitalize`}>
                      {item.type}
                    </span>
                  </div>
                  <button 
                    onClick={() => handlePurchase(item)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? 'Processando...' : 'Comprar'}
                  </button>
                  {purchaseMessage && (
                    <div className="mt-2 text-center text-sm font-semibold text-white bg-fantasy-secondary rounded p-2 animate-pulse">
                      {purchaseMessage}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
             <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-xl text-gray-400">
              {searchTerm ? 'Nenhum item encontrado com sua busca.' : 'A loja está vazia no momento. Volte mais tarde!'}
            </p>
          </div>
        )}

        {/* TODO: Paginação se houver muitos itens */}
        {/* <div className="mt-10 text-center">
          <p className="text-gray-500">Paginação em breve!</p>
        </div> */}

      </div>
    </MainLayout>
  );
};

export default ShopPage;