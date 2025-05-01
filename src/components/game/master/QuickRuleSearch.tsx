import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Book, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Tipo para as regras do jogo
interface GameRule {
  id: string;
  title: string;
  description: string;
  category: string;
  page?: number;
  book?: string;
  tags: string[];
}

// Dados de exemplo para regras (em produção, isso viria do banco de dados)
const RULES_DATA: GameRule[] = [
  {
    id: '1',
    title: 'Ataque de Oportunidade',
    description: 'Quando uma criatura hostil que você pode ver sai do seu alcance, você pode usar sua reação para fazer um ataque corpo-a-corpo contra essa criatura.',
    category: 'Combate',
    page: 195,
    book: 'Player\'s Handbook',
    tags: ['combate', 'reação', 'movimento']
  },
  {
    id: '2',
    title: 'Cobertura',
    description: 'Obstáculos como mobília, árvores e criaturas podem fornecer cobertura durante o combate, tornando um alvo mais difícil de prejudicar. Um alvo pode se beneficiar de cobertura apenas quando um ataque ou outro efeito se origina do lado oposto da cobertura.',
    category: 'Combate',
    page: 196,
    book: 'Player\'s Handbook',
    tags: ['combate', 'CA', 'proteção']
  },
  {
    id: '3',
    title: 'Condições',
    description: 'Condições alteram as capacidades de uma criatura de várias maneiras e surgem como resultado de uma habilidade especial, um feitiço ou outro efeito. Exemplos: Agarrado, Atordoado, Caído, Cego, Enfeitiçado, Envenenado, Exausto, Impedido, Inconsciente, Invisível, Paralisado, Petrificado, Surdo.',
    category: 'Efeitos',
    page: 290,
    book: 'Player\'s Handbook',
    tags: ['condição', 'status', 'efeitos']
  },
  {
    id: '4',
    title: 'Descanso Curto',
    description: 'Um descanso curto é um período de tempo de inatividade, de pelo menos 1 hora, durante o qual um personagem não faz nada mais extenuante do que comer, beber, ler e tratar ferimentos.',
    category: 'Descanso',
    page: 186,
    book: 'Player\'s Handbook',
    tags: ['descanso', 'cura', 'recuperação']
  },
  {
    id: '5',
    title: 'Descanso Longo',
    description: 'Um descanso longo é um período prolongado de inatividade, de pelo menos 8 horas, durante o qual um personagem dorme ou realiza atividade leve: leitura, conversa, alimentação ou vigilância por não mais que 2 horas.',
    category: 'Descanso',
    page: 186,
    book: 'Player\'s Handbook',
    tags: ['descanso', 'cura', 'recuperação']
  },
  {
    id: '6',
    title: 'Teste de Resistência',
    description: 'Um teste de resistência representa uma tentativa de resistir a um feitiço, armadilha, veneno, doença ou ameaça similar. Você não decide fazer um teste de resistência; você é forçado a fazer um porque seu personagem ou monstro está em risco de sofrer dano.',
    category: 'Testes',
    page: 179,
    book: 'Player\'s Handbook',
    tags: ['teste', 'resistência', 'atributo']
  },
  {
    id: '7',
    title: 'Flanquear',
    description: 'Quando você e pelo menos um aliado estão adjacentes a um inimigo e em lados opostos ou cantos do espaço do inimigo, você está flanqueando esse inimigo, e esse inimigo é flanqueado por você. Atacantes têm vantagem contra inimigos flanqueados.',
    category: 'Combate',
    page: 251,
    book: 'Dungeon Master\'s Guide',
    tags: ['combate', 'posicionamento', 'vantagem']
  },
  {
    id: '8',
    title: 'Terreno Difícil',
    description: 'Combater em uma floresta densa, pântano profundo ou escombros cheios de escombros dificulta o movimento. Cada pé de movimento em terreno difícil custa 1 pé extra. Esta regra é aplicada mesmo se múltiplas coisas no espaço contarem como terreno difícil.',
    category: 'Movimento',
    page: 190,
    book: 'Player\'s Handbook',
    tags: ['movimento', 'terreno', 'deslocamento']
  },
  {
    id: '9',
    title: 'Conjuração de Magia',
    description: 'Quando um personagem lança qualquer magia, as mesmas regras básicas são seguidas, independentemente da classe do personagem ou dos efeitos da magia. Cada descrição de magia começa com um bloco de informações, incluindo o nome da magia, nível, escola de magia, tempo de conjuração, alcance, componentes e duração.',
    category: 'Magia',
    page: 201,
    book: 'Player\'s Handbook',
    tags: ['magia', 'conjuração', 'feitiço']
  },
  {
    id: '10',
    title: 'Inspiração',
    description: 'A inspiração é uma regra que o Mestre pode usar para recompensar você por interpretar seu personagem de uma maneira que seja fiel à sua personalidade, ideal, vínculo e falha. Ao usar a Inspiração, você pode obter vantagem em uma jogada de ataque, teste de habilidade ou teste de resistência.',
    category: 'Mecânica',
    page: 125,
    book: 'Player\'s Handbook',
    tags: ['inspiração', 'vantagem', 'interpretação']
  }
];

interface QuickRuleSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickRuleSearch: React.FC<QuickRuleSearchProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GameRule[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Extrair categorias únicas para filtros
  const categories = Array.from(new Set(RULES_DATA.map(rule => rule.category)));
  
  // Focar no input de busca quando o modal abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  // Filtrar resultados com base no termo de busca e categorias selecionadas
  useEffect(() => {
    if (!searchTerm && selectedCategories.length === 0) {
      setSearchResults([]);
      return;
    }
    
    const results = RULES_DATA.filter(rule => {
      const matchesSearch = searchTerm === '' || 
        rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(rule.category);
      
      return matchesSearch && matchesCategory;
    });
    
    setSearchResults(results);
  }, [searchTerm, selectedCategories]);
  
  // Adicionar termo à lista de buscas recentes
  const addToRecentSearches = (term: string) => {
    if (term && !recentSearches.includes(term)) {
      const updated = [term, ...recentSearches].slice(0, 5); // Manter apenas as 5 mais recentes
      setRecentSearches(updated);
      // Em produção, salvar no localStorage ou no banco de dados do usuário
      localStorage.setItem('recentRuleSearches', JSON.stringify(updated));
    }
  };
  
  // Carregar buscas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentRuleSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar buscas recentes:', e);
      }
    }
  }, []);
  
  // Limpar busca e fechar modal
  const handleClose = () => {
    if (searchTerm) {
      addToRecentSearches(searchTerm);
    }
    setSearchTerm('');
    setSearchResults([]);
    onClose();
  };
  
  // Alternar categoria no filtro
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  // Usar uma busca recente
  const useRecentSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl bg-fantasy-paper border-fantasy-brown shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Book className="h-5 w-5 text-fantasy-purple" />
            <CardTitle className="text-xl font-medievalsharp text-fantasy-purple">Busca Rápida de Regras</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-fantasy-stone hover:text-fantasy-stone/80">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fantasy-stone/70" />
              <Input
                ref={searchInputRef}
                className="pl-10 bg-white/10 border-fantasy-stone/30 text-fantasy-stone placeholder:text-fantasy-stone/50"
                placeholder="Digite para buscar regras (ex: Ataque de Oportunidade, Flanquear, Condições...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-fantasy-stone/70"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Filtros de categoria */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Badge 
                  key={category}
                  variant={selectedCategories.includes(category) ? "default" : "outline"}
                  className={`cursor-pointer ${selectedCategories.includes(category) ? 'bg-fantasy-purple text-white' : 'text-fantasy-stone hover:bg-fantasy-purple/20'}`}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
            
            {/* Buscas recentes */}
            {recentSearches.length > 0 && searchTerm === '' && (
              <div className="pt-2">
                <h4 className="text-sm font-medium text-fantasy-stone/70 mb-2">Buscas recentes:</h4>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <Badge 
                      key={index}
                      variant="outline"
                      className="cursor-pointer text-fantasy-stone hover:bg-fantasy-purple/20"
                      onClick={() => useRecentSearch(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Resultados da busca */}
            {searchResults.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4 mt-2">
                <div className="space-y-3">
                  {searchResults.map((rule) => (
                    <div key={rule.id} className="p-3 bg-white/10 rounded-md border border-fantasy-stone/20 hover:border-fantasy-purple/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medievalsharp text-lg text-fantasy-purple">{rule.title}</h3>
                        <Badge variant="outline" className="text-xs">{rule.category}</Badge>
                      </div>
                      <p className="text-fantasy-stone mt-1">{rule.description}</p>
                      <div className="flex justify-between items-center mt-2 text-xs text-fantasy-stone/70">
                        <div className="flex gap-2">
                          {rule.tags.map((tag, idx) => (
                            <span key={idx} className="bg-fantasy-stone/10 px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                        {rule.book && (
                          <div className="flex items-center gap-1">
                            <ExternalLink size={12} />
                            <span>{rule.book}, p. {rule.page}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : searchTerm || selectedCategories.length > 0 ? (
              <div className="py-8 text-center">
                <p className="text-fantasy-stone">Nenhuma regra encontrada para os critérios selecionados.</p>
                <p className="text-fantasy-stone/70 text-sm mt-1">Tente termos diferentes ou remova alguns filtros.</p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-fantasy-stone">Digite para buscar regras do jogo</p>
                <p className="text-fantasy-stone/70 text-sm mt-1">Você pode buscar por nome, descrição ou tags</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickRuleSearch;