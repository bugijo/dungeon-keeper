
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, Shield, Sword } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface ItemDetails {
  id: string;
  name: string;
  type: string;
  rarity: string;
  description: string | null;
  properties: string[] | null;
  image_url: string | null;
  created_at: string;
}

const ItemView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        setItem(data);
      } catch (error) {
        console.error('Error fetching item details:', error);
        toast.error('Erro ao carregar detalhes do item');
      } finally {
        setLoading(false);
      }
    };
    
    fetchItemDetails();
  }, [id, user]);
  
  const getIconByType = (type: string) => {
    switch(type) {
      case 'weapon':
        return <Sword className="text-fantasy-gold" />;
      case 'shield':
      case 'armor':
        return <Shield className="text-fantasy-gold" />;
      default:
        return <Sword className="text-fantasy-gold" />;
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Link to="/items" className="mr-4">
              <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
            </Link>
            <h1 className="text-3xl font-medievalsharp text-white">Carregando...</h1>
          </div>
          
          <div className="fantasy-card p-6 animate-pulse">
            <div className="h-64 bg-fantasy-purple/30 rounded mb-4"></div>
            <div className="h-8 bg-fantasy-dark/50 rounded mb-2"></div>
            <div className="h-4 bg-fantasy-dark/30 rounded mb-2"></div>
            <div className="h-32 bg-fantasy-dark/20 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!item) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Link to="/items" className="mr-4">
              <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
            </Link>
            <h1 className="text-3xl font-medievalsharp text-white">Item não encontrado</h1>
          </div>
          
          <div className="fantasy-card p-6 text-center">
            <p className="text-fantasy-stone">
              O item que você está procurando não foi encontrado ou você não tem permissão para acessá-lo.
            </p>
            <Link to="/items" className="fantasy-button primary mt-4 inline-block">
              Voltar para Itens
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Link to="/items" className="mr-4">
            <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
          </Link>
          <h1 className="text-3xl font-medievalsharp text-white">{item.name}</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="fantasy-card p-0 overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img 
                  src={item.image_url || '/placeholder.svg'} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded-full bg-fantasy-purple/20">
                    {getIconByType(item.type)}
                  </div>
                  <span className="text-sm text-fantasy-stone">{item.type}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-fantasy-dark/70 text-fantasy-gold capitalize ml-auto">
                    {item.rarity}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.properties?.map((prop, idx) => (
                    <span key={idx} className="text-xs bg-fantasy-dark px-2 py-0.5 rounded text-fantasy-stone">
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="fantasy-card p-6">
              <h2 className="text-xl font-medievalsharp text-white mb-4 border-b border-fantasy-purple/20 pb-2">
                Descrição
              </h2>
              
              <p className="text-fantasy-stone whitespace-pre-wrap">
                {item.description || "Este item não possui uma descrição."}
              </p>
              
              <div className="mt-8 border-t border-fantasy-purple/20 pt-4">
                <h3 className="text-lg font-medievalsharp text-white mb-2">
                  Propriedades
                </h3>
                
                {item.properties && item.properties.length > 0 ? (
                  <ul className="list-disc pl-5 text-fantasy-stone">
                    {item.properties.map((prop, idx) => (
                      <li key={idx}>{prop}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-fantasy-stone italic">
                    Este item não possui propriedades específicas.
                  </p>
                )}
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <Link to={`/creations/items/${item.id}`} className="fantasy-button primary">
                  Editar Item
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ItemView;
