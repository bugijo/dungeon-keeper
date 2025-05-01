
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ShopItem, { ShopItemProps } from '@/components/shop/ShopItem';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import { Sparkles, Package, Crown, Gem, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const sampleShopItems: ShopItemProps[] = [
  {
    id: '1',
    name: 'Tema Clássico de Fantasia',
    description: 'Um tema visual inspirado nos livros clássicos de fantasia medieval.',
    price: 250,
    currency: 'gems',
    imageUrl: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456',
    category: 'theme',
    popular: true
  },
  {
    id: '2',
    name: 'Tema Futurista',
    description: 'Um tema visual futurista para suas aventuras de ficção científica.',
    price: 300,
    discountPrice: 200,
    currency: 'gems',
    imageUrl: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f',
    category: 'theme',
    new: true
  },
  {
    id: '3',
    name: 'Pack de Mapas de Masmorras',
    description: 'Um conjunto de 10 mapas detalhados de masmorras para suas aventuras.',
    price: 500,
    currency: 'gems',
    imageUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d10',
    category: 'asset'
  },
  {
    id: '4',
    name: 'Pack de Mapas de Cidades',
    description: 'Um conjunto de 5 mapas detalhados de cidades medievais.',
    price: 450,
    currency: 'gems',
    imageUrl: 'https://images.unsplash.com/photo-1566533227298-6f945d6351f9',
    category: 'asset'
  },
  {
    id: '5',
    name: 'Pacote de Tokens de Monstros',
    description: 'Mais de 100 tokens de monstros para usar em combates.',
    price: 350,
    currency: 'gems',
    imageUrl: 'https://images.unsplash.com/photo-1577741314755-048d8525792e',
    category: 'asset'
  },
  {
    id: '6',
    name: 'Assinatura Premium - 1 Mês',
    description: 'Acesso a todas as funcionalidades premium por 1 mês.',
    price: 30, // Using integers for prices
    currency: 'real',
    imageUrl: 'https://images.unsplash.com/photo-1518364538800-6bae3c2ea0f2',
    category: 'premium',
    popular: true
  },
  {
    id: '7',
    name: 'Assinatura Premium - 6 Meses',
    description: 'Acesso a todas as funcionalidades premium por 6 meses.',
    price: 150, // Using integers for prices
    discountPrice: 130, // Using integers for prices
    currency: 'real',
    imageUrl: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13',
    category: 'premium'
  },
  {
    id: '8',
    name: '500 Gemas',
    description: 'Pacote com 500 gemas para comprar itens na loja.',
    price: 20, // Using integers for prices
    currency: 'real',
    imageUrl: 'https://images.unsplash.com/photo-1611689102192-1f6e0e52bf00',
    category: 'gem'
  },
  {
    id: '9',
    name: '1000 Gemas + 100 Bônus',
    description: 'Pacote com 1100 gemas pelo preço de 1000.',
    price: 40, // Using integers for prices
    currency: 'real',
    imageUrl: 'https://images.unsplash.com/photo-1567446100022-588d16803521',
    category: 'gem',
    popular: true
  },
  {
    id: '10',
    name: '3000 Gemas + 500 Bônus',
    description: 'Pacote com 3500 gemas pelo preço de 3000.',
    price: 100, // Using integers for prices
    currency: 'real',
    imageUrl: 'https://images.unsplash.com/photo-1623001468263-a075c782bfbf',
    category: 'gem',
    new: true
  }
];

const Shop = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredItems = sampleShopItems.filter(item => {
    if (activeTab !== 'all' && item.category !== activeTab) {
      return false;
    }
    
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-medievalsharp text-fantasy-gold">Loja</h1>
            <p className="text-fantasy-stone">Encontre itens, temas e recursos para suas aventuras</p>
          </div>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fantasy-stone" size={18} />
          <Input
            type="text"
            placeholder="Buscar na loja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-fantasy-dark/50 border-fantasy-purple/30"
          />
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="bg-fantasy-dark/70 border border-fantasy-purple/30 w-full grid grid-cols-5 h-auto">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-fantasy-purple/20 py-2"
            >
              <Package size={16} className="mr-2" />
              Todos
            </TabsTrigger>
            <TabsTrigger 
              value="theme"
              className="data-[state=active]:bg-fantasy-purple/20 py-2"
            >
              <Sparkles size={16} className="mr-2" />
              Temas
            </TabsTrigger>
            <TabsTrigger 
              value="asset"
              className="data-[state=active]:bg-fantasy-purple/20 py-2"
            >
              <Package size={16} className="mr-2" />
              Assets
            </TabsTrigger>
            <TabsTrigger 
              value="premium"
              className="data-[state=active]:bg-fantasy-purple/20 py-2"
            >
              <Crown size={16} className="mr-2" />
              Premium
            </TabsTrigger>
            <TabsTrigger 
              value="gem"
              className="data-[state=active]:bg-fantasy-purple/20 py-2"
            >
              <Gem size={16} className="mr-2" />
              Gemas
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <ShopItem 
                key={item.id} 
                {...item} 
              />
            ))}
          </div>
        ) : (
          <div className="fantasy-card py-12 text-center">
            <p className="text-fantasy-stone text-lg">Nenhum item encontrado para a sua busca.</p>
            <Button 
              className="mt-4 fantasy-button secondary"
              onClick={() => {
                setSearchTerm('');
                setActiveTab('all');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Shop;
