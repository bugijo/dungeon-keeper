
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Gift, Gem, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserBalance } from '@/hooks/useUserBalance';

export type ItemCategory = 'theme' | 'asset' | 'premium' | 'gem';

export interface ShopItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  currency: 'gems' | 'real';
  imageUrl: string;
  category: ItemCategory;
  popular?: boolean;
  new?: boolean;
}

export const ShopItem = ({
  id,
  name,
  description,
  price,
  discountPrice,
  currency,
  imageUrl,
  category,
  popular = false,
  new: isNew = false,
}: ShopItemProps) => {
  const { user } = useAuth();
  const { gems, coins, refetch } = useUserBalance();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const finalPrice = discountPrice || price;

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer compras!");
      return;
    }

    if (purchasing) return;

    try {
      setPurchasing(true);

      if (currency === 'gems') {
        if (gems < finalPrice) {
          toast.error("Saldo de gemas insuficiente!");
          return;
        }

        // Ensure we're using integers for the transaction amount
        const transactionAmount = Math.round(finalPrice);

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            item_id: id,
            item_name: name,
            amount: transactionAmount,
            currency: 'gems',
            status: 'completed'
          });

        if (transactionError) throw transactionError;

        const { error: updateError } = await supabase
          .from('user_balance')
          .update({ gems: gems - transactionAmount })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        await refetch();
        toast.success(`Item "${name}" comprado com sucesso!`);
        setIsDialogOpen(false);
      } else {
        // For real currency purchases, ensure we're using integers (cents)
        const transactionAmount = Math.round(finalPrice * 100);
        
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            item_id: id,
            item_name: name,
            amount: transactionAmount, // Store amount in cents for real currency
            currency: 'real',
            status: 'pending'
          });

        if (transactionError) throw transactionError;

        toast.info("Redirecionando para o pagamento...");
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Erro na compra:', error);
      toast.error("Erro ao processar a compra. Tente novamente.");
    } finally {
      setPurchasing(false);
    }
  };

  const getCategoryIcon = (category: ItemCategory) => {
    switch (category) {
      case 'theme':
        return <Sparkles size={14} />;
      case 'asset':
        return <Gift size={14} />;
      case 'premium':
        return <Sparkles size={14} />;
      case 'gem':
        return <Gem size={14} />;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: ItemCategory) => {
    switch (category) {
      case 'theme':
        return 'Tema';
      case 'asset':
        return 'Asset';
      case 'premium':
        return 'Premium';
      case 'gem':
        return 'Gemas';
      default:
        return '';
    }
  };

  const formatPrice = (value: number) => {
    if (currency === 'gems') {
      return `${value} gemas`;
    }
    return `R$ ${value.toFixed(2)}`;
  };

  const getDiscountPercentage = () => {
    if (discountPrice && price > 0) {
      const discount = Math.round(((price - discountPrice) / price) * 100);
      return discount > 0 ? `-${discount}%` : '';
    }
    return '';
  };

  return (
    <div className="fantasy-card p-0 overflow-hidden">
      <div className="relative">
        <div className="h-40 bg-gray-700 relative">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-fantasy-dark to-transparent opacity-80"></div>
        </div>

        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="outline" className="bg-fantasy-dark/80 text-xs font-normal px-2 py-0.5 flex gap-1 items-center">
            {getCategoryIcon(category)}
            {getCategoryLabel(category)}
          </Badge>
          
          {isNew && (
            <Badge className="bg-green-600 text-white border-none text-xs font-normal">Novo</Badge>
          )}
          
          {popular && (
            <Badge className="bg-amber-500 text-white border-none text-xs font-normal">Popular</Badge>
          )}
        </div>

        {discountPrice && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-red-500 text-white border-none">
              {getDiscountPercentage()}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-lg font-medievalsharp text-fantasy-gold">{name}</h3>
        <p className="text-xs text-fantasy-stone mt-1 line-clamp-2">{description}</p>
        
        <div className="mt-3 flex justify-between items-center">
          <div>
            {discountPrice ? (
              <div className="flex items-center gap-2">
                <span className="text-xs line-through text-fantasy-stone/70">
                  {formatPrice(price)}
                </span>
                <span className="text-sm font-medium text-fantasy-gold">
                  {formatPrice(discountPrice)}
                </span>
              </div>
            ) : (
              <span className="text-sm font-medium text-fantasy-gold">
                {formatPrice(price)}
              </span>
            )}
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="fantasy-button primary h-8 px-3 py-1 text-xs"
                disabled={purchasing}
              >
                <ShoppingCart size={14} className="mr-1" />
                Comprar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-fantasy-dark border-fantasy-purple/30">
              <DialogHeader>
                <DialogTitle className="text-fantasy-gold font-medievalsharp">Confirmar Compra</DialogTitle>
                <DialogDescription>
                  Você deseja comprar "{name}" por {formatPrice(finalPrice)}?
                  
                  {currency === 'gems' && (
                    <div className="mt-2">
                      <p className="text-sm">Seu saldo: <span className="text-fantasy-gold">{gems} gemas</span></p>
                      <p className="text-sm">Após a compra: <span className="text-fantasy-gold">{gems - finalPrice} gemas</span></p>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-transparent border-fantasy-purple/50 text-fantasy-stone hover:bg-fantasy-purple/10"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handlePurchase}
                  className="fantasy-button primary"
                  disabled={currency === 'gems' && gems < finalPrice || purchasing}
                >
                  {purchasing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-fantasy-gold border-t-transparent rounded-full"></span>
                      Processando...
                    </span>
                  ) : "Confirmar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ShopItem;
