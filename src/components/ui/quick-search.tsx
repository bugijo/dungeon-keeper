import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Search, X, Book } from 'lucide-react';

interface QuickSearchProps {
  placeholder?: string;
  onSearch?: (term: string) => void;
  className?: string;
  data?: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
  }>;
}

export function QuickSearch({
  placeholder = 'Buscar regras...',
  onSearch,
  className,
  data = [],
}: QuickSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredResults, setFilteredResults] = useState(data);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm.length > 1) {
      const results = data.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredResults(results);
      setIsOpen(true);
    } else {
      setFilteredResults([]);
      setIsOpen(false);
    }
  }, [searchTerm, data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div
      ref={searchRef}
      className={cn(
        'relative w-full max-w-md',
        className
      )}
    >
      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search size={18} />
        </div>
        <Input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder={placeholder}
          className="pl-10 pr-10 border-2 border-amber-800/50 bg-amber-950/20 text-amber-100 placeholder:text-amber-200/50 focus-visible:ring-amber-600 focus-visible:border-amber-700 font-medievalsharp"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && filteredResults.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border-2 border-amber-800/50 bg-card/95 shadow-md backdrop-blur-sm max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-800 scrollbar-track-amber-950/20">
          <div className="p-2 space-y-1">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="flex items-start gap-2 p-2 hover:bg-amber-950/40 rounded-md cursor-pointer transition-colors"
                onClick={() => {
                  // Implementar ação ao clicar no resultado
                  setIsOpen(false);
                }}
              >
                <div className="mt-0.5 text-amber-500">
                  <Book size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-medievalsharp text-amber-200">{result.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{result.description}</p>
                  <span className="text-xs text-amber-500/70 mt-1 inline-block">{result.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && searchTerm && filteredResults.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-card/95 p-4 shadow-md backdrop-blur-sm">
          <p className="text-center text-sm text-muted-foreground">Nenhum resultado encontrado</p>
        </div>
      )}
    </div>
  );
}