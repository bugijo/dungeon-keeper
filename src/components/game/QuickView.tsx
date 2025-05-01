import React, { useState } from 'react';
import { X, Info, Shield, Sword, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemData {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'wand' | 'misc' | 'spell';
  rarity?: 'common' | 'uncommon' | 'rare' | 'very-rare' | 'legendary';
  properties?: string[];
  damage?: string;
  range?: string;
  weight?: number;
  value?: number;
  requiresAttunement?: boolean;
  spellLevel?: number;
  castingTime?: string;
  duration?: string;
  components?: string[];
  school?: string;
}

interface QuickViewProps {
  item?: ItemData;
  isOpen: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

/**
 * Componente de visualização rápida para itens e magias
 * Permite aos jogadores ver detalhes sem abrir menus completos
 */
export function QuickView({
  item,
  isOpen,
  onClose,
  position = 'bottom-right',
  className,
}: QuickViewProps) {
  if (!isOpen || !item) return null;

  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  const rarityColors = {
    common: 'text-gray-200',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    'very-rare': 'text-purple-400',
    legendary: 'text-amber-400',
  };

  const typeIcons = {
    weapon: <Sword className="h-5 w-5" />,
    armor: <Shield className="h-5 w-5" />,
    spell: <Wand2 className="h-5 w-5" />,
    misc: <Info className="h-5 w-5" />,
    potion: <Info className="h-5 w-5" />,
    scroll: <Info className="h-5 w-5" />,
    wand: <Wand2 className="h-5 w-5" />,
  };

  return (
    <div
      className={cn(
        'fixed z-50 w-72 rounded-lg border-2 border-amber-800/70 bg-amber-950/90 backdrop-blur-sm shadow-lg p-4',
        positionClasses[position],
        'font-medievalsharp',
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-500">
            {typeIcons[item.type]}
          </span>
          <h3 className={cn(
            'text-lg font-bold',
            item.rarity ? rarityColors[item.rarity] : 'text-white'
          )}>
            {item.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-amber-400 hover:text-amber-200 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2 text-amber-100/90 text-sm">
        {/* Descrição do item */}
        <p className="italic text-amber-200/80">{item.description}</p>

        {/* Detalhes específicos para armas */}
        {item.type === 'weapon' && (
          <div className="grid grid-cols-2 gap-1 mt-2">
            {item.damage && (
              <div>
                <span className="text-amber-500 text-xs">Dano:</span>
                <span className="ml-1">{item.damage}</span>
              </div>
            )}
            {item.range && (
              <div>
                <span className="text-amber-500 text-xs">Alcance:</span>
                <span className="ml-1">{item.range}</span>
              </div>
            )}
            {item.weight && (
              <div>
                <span className="text-amber-500 text-xs">Peso:</span>
                <span className="ml-1">{item.weight} lb</span>
              </div>
            )}
            {item.value && (
              <div>
                <span className="text-amber-500 text-xs">Valor:</span>
                <span className="ml-1">{item.value} po</span>
              </div>
            )}
          </div>
        )}

        {/* Detalhes específicos para magias */}
        {item.type === 'spell' && (
          <div className="space-y-1 mt-2">
            <div className="flex justify-between">
              <div>
                <span className="text-amber-500 text-xs">Nível:</span>
                <span className="ml-1">{item.spellLevel === 0 ? 'Truque' : item.spellLevel}</span>
              </div>
              {item.school && (
                <div>
                  <span className="text-amber-500 text-xs">Escola:</span>
                  <span className="ml-1">{item.school}</span>
                </div>
              )}
            </div>
            {item.castingTime && (
              <div>
                <span className="text-amber-500 text-xs">Tempo de Conjuração:</span>
                <span className="ml-1">{item.castingTime}</span>
              </div>
            )}
            {item.duration && (
              <div>
                <span className="text-amber-500 text-xs">Duração:</span>
                <span className="ml-1">{item.duration}</span>
              </div>
            )}
            {item.components && (
              <div>
                <span className="text-amber-500 text-xs">Componentes:</span>
                <span className="ml-1">{item.components.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Propriedades do item */}
        {item.properties && item.properties.length > 0 && (
          <div className="mt-2">
            <span className="text-amber-500 text-xs block mb-1">Propriedades:</span>
            <ul className="list-disc list-inside pl-2 space-y-1">
              {item.properties.map((prop, index) => (
                <li key={index} className="text-xs">{prop}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Indicador de sintonização */}
        {item.requiresAttunement && (
          <div className="mt-2 text-xs italic text-amber-400">
            Requer sintonização
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook para gerenciar o estado de visualização rápida
 */
export function useQuickView() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ItemData | undefined>(undefined);

  const openQuickView = (item: ItemData) => {
    setCurrentItem(item);
    setIsOpen(true);
  };

  const closeQuickView = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    currentItem,
    openQuickView,
    closeQuickView,
  };
}