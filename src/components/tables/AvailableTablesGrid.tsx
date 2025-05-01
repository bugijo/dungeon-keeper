import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Users, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Tipos para as mesas
interface TableData {
  id: string;
  name: string;
  description: string;
  system: string; // D&D 5e, Pathfinder, etc.
  master: string;
  players: {
    current: number;
    max: number;
  };
  tags: string[];
  nextSession?: string; // Data da próxima sessão
  imageUrl?: string;
  difficulty: 'iniciante' | 'intermediario' | 'avancado';
}

// Dados de exemplo para demonstração
const demoTables: TableData[] = [
  {
    id: '1',
    name: 'A Maldição de Strahd',
    description: 'Aventura gótica em Barovia, enfrentando o temível vampiro Conde Strahd.',
    system: 'D&D 5e',
    master: 'Mestre das Sombras',
    players: { current: 3, max: 5 },
    tags: ['horror', 'vampiros', 'medieval'],
    nextSession: '2024-05-15T19:00:00',
    imageUrl: '/placeholder.svg',
    difficulty: 'intermediario'
  },
  {
    id: '2',
    name: 'Iniciantes Bem-vindos',
    description: 'Mesa para jogadores novos aprenderem as regras básicas de D&D.',
    system: 'D&D 5e',
    master: 'Sábio Ancião',
    players: { current: 2, max: 6 },
    tags: ['iniciantes', 'tutorial', 'amigável'],
    nextSession: '2024-05-10T20:00:00',
    imageUrl: '/placeholder.svg',
    difficulty: 'iniciante'
  },
  {
    id: '3',
    name: 'Campanha de Eberron',
    description: 'Aventura em um mundo de magia e tecnologia, com intrigas políticas.',
    system: 'D&D 5e',
    master: 'Cronista Arcano',
    players: { current: 4, max: 4 },
    tags: ['steampunk', 'política', 'magia'],
    nextSession: '2024-05-12T18:30:00',
    imageUrl: '/placeholder.svg',
    difficulty: 'avancado'
  },
  {
    id: '4',
    name: 'Tesouro Perdido',
    description: 'Uma caçada ao tesouro pelos mares do mundo.',
    system: 'Pathfinder',
    master: 'Capitão Barba Ruiva',
    players: { current: 3, max: 5 },
    tags: ['piratas', 'aventura', 'tesouro'],
    nextSession: '2024-05-14T21:00:00',
    imageUrl: '/placeholder.svg',
    difficulty: 'intermediario'
  },
];

// Componente de filtros
interface FiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
}

interface FilterOptions {
  system: string;
  difficulty: string;
  playerCount: string;
  tags: string[];
}

function TableFilters({ onFilterChange }: FiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    system: '',
    difficulty: '',
    playerCount: '',
    tags: [],
  });

  const systems = ['Todos', 'D&D 5e', 'Pathfinder', 'Call of Cthulhu', 'Vampiro: A Máscara'];
  const difficulties = ['Todos', 'Iniciante', 'Intermediário', 'Avançado'];
  const playerCounts = ['Todos', '1-3', '4-5', '6+'];
  const commonTags = ['medieval', 'fantasia', 'horror', 'sci-fi', 'piratas', 'iniciantes'];

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    handleFilterChange('tags', newTags);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-fantasy-dark/50 border border-fantasy-purple/20 rounded-lg p-4 mb-6 space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medievalsharp text-fantasy-stone">Sistema</label>
          <select 
            className="w-full bg-fantasy-dark border border-fantasy-purple/30 rounded-md p-2 text-fantasy-stone"
            value={filters.system}
            onChange={(e) => handleFilterChange('system', e.target.value)}
          >
            {systems.map(system => (
              <option key={system} value={system === 'Todos' ? '' : system}>{system}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medievalsharp text-fantasy-stone">Dificuldade</label>
          <select 
            className="w-full bg-fantasy-dark border border-fantasy-purple/30 rounded-md p-2 text-fantasy-stone"
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty === 'Todos' ? '' : difficulty.toLowerCase()}>{difficulty}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medievalsharp text-fantasy-stone">Número de Jogadores</label>
          <select 
            className="w-full bg-fantasy-dark border border-fantasy-purple/30 rounded-md p-2 text-fantasy-stone"
            value={filters.playerCount}
            onChange={(e) => handleFilterChange('playerCount', e.target.value)}
          >
            {playerCounts.map(count => (
              <option key={count} value={count === 'Todos' ? '' : count}>{count}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medievalsharp text-fantasy-stone">Tags</label>
        <div className="flex flex-wrap gap-2">
          {commonTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${filters.tags.includes(tag) ? 'bg-fantasy-purple text-white' : 'bg-fantasy-dark border border-fantasy-purple/30 text-fantasy-stone/70'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Componente de card de mesa
interface TableCardProps {
  table: TableData;
}

function TableCard({ table }: TableCardProps) {
  const navigate = useNavigate();
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não agendada';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'iniciante': return 'bg-green-500/20 text-green-400';
      case 'intermediario': return 'bg-yellow-500/20 text-yellow-400';
      case 'avancado': return 'bg-red-500/20 text-red-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };
  
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'iniciante': return 'Iniciante';
      case 'intermediario': return 'Intermediário';
      case 'avancado': return 'Avançado';
      default: return 'Desconhecido';
    }
  };
  
  const handleJoinTable = () => {
    // Navegar para a página da mesa ou abrir modal de participação
    navigate(`/table/${table.id}`);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-fantasy-dark border border-fantasy-purple/30 rounded-lg overflow-hidden hover:border-fantasy-purple/60 transition-all duration-300 h-full flex flex-col"
    >
      <div className="relative h-40 overflow-hidden">
        <img 
          src={table.imageUrl || '/placeholder.svg'} 
          alt={table.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(table.difficulty)}`}>
            {getDifficultyText(table.difficulty)}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-medievalsharp text-fantasy-gold truncate">{table.name}</h3>
          <span className="text-sm text-fantasy-stone/70 whitespace-nowrap ml-2">{table.system}</span>
        </div>
        
        <p className="text-fantasy-stone/90 text-sm mb-4 line-clamp-2">{table.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-fantasy-stone/70">
            <Users className="w-4 h-4 mr-2" />
            <span>{table.players.current}/{table.players.max} jogadores</span>
          </div>
          
          <div className="flex items-center text-sm text-fantasy-stone/70">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Próxima sessão: {formatDate(table.nextSession)}</span>
          </div>
          
          <div className="flex items-center text-sm text-fantasy-stone/70">
            <BookOpen className="w-4 h-4 mr-2" />
            <span>Mestre: {table.master}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {table.tags.map(tag => (
            <span 
              key={tag} 
              className="px-2 py-0.5 bg-fantasy-purple/20 text-fantasy-purple text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-4 pt-0">
        <Button 
          onClick={handleJoinTable}
          className="w-full fantasy-button primary"
        >
          Participar
        </Button>
      </div>
    </motion.div>
  );
}

// Componente principal de grade de mesas
export function AvailableTablesGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<FilterOptions>({
    system: '',
    difficulty: '',
    playerCount: '',
    tags: [],
  });
  
  // Simulando carregamento de dados
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulando uma chamada de API
    const fetchTables = async () => {
      setLoading(true);
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTables(demoTables);
      setLoading(false);
    };
    
    fetchTables();
  }, []);
  
  // Filtrar mesas com base nos critérios
  const filteredTables = tables.filter(table => {
    // Filtro de pesquisa
    if (searchQuery && !table.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !table.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filtro de abas
    if (activeTab === 'upcoming' && !table.nextSession) return false;
    if (activeTab === 'available' && table.players.current >= table.players.max) return false;
    
    // Filtros avançados
    if (filters.system && table.system !== filters.system) return false;
    if (filters.difficulty && table.difficulty !== filters.difficulty) return false;
    
    // Filtro de número de jogadores
    if (filters.playerCount) {
      const [min, max] = filters.playerCount.split('-').map(Number);
      if (max) {
        if (table.players.max < min || table.players.max > max) return false;
      } else {
        // Caso seja "6+"
        if (table.players.max < min) return false;
      }
    }
    
    // Filtro de tags
    if (filters.tags.length > 0 && !filters.tags.some(tag => table.tags.includes(tag))) {
      return false;
    }
    
    return true;
  });
  
  // Renderização de estados de carregamento e vazio
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-fantasy-purple/30 border-t-fantasy-purple rounded-full animate-spin mb-4"></div>
          <p className="text-fantasy-stone/70">Buscando mesas disponíveis...</p>
        </div>
      );
    }
    
    if (filteredTables.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-fantasy-purple/20 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-fantasy-purple/70" />
          </div>
          <h3 className="text-xl font-medievalsharp text-fantasy-gold mb-2">Nenhuma mesa encontrada</h3>
          <p className="text-fantasy-stone/70 max-w-md">
            Não encontramos mesas que correspondam aos seus critérios. Tente ajustar os filtros ou criar sua própria mesa!
          </p>
          <Button className="fantasy-button primary mt-6">
            Criar Nova Mesa
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTables.map(table => (
          <TableCard key={table.id} table={table} />
        ))}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-medievalsharp text-fantasy-gold mb-4 md:mb-0">
          Mesas Disponíveis
        </h1>
        
        <Button className="fantasy-button secondary">
          Criar Nova Mesa
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fantasy-stone/50" />
            <Input
              type="text"
              placeholder="Buscar mesas por nome ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-fantasy-dark border-fantasy-purple/30 text-fantasy-stone w-full"
            />
          </div>
          
          <Button 
            onClick={() => setShowFilters(!showFilters)}
            className="fantasy-button outline flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
        </div>
      </div>
      
      {showFilters && (
        <TableFilters onFilterChange={setFilters} />
      )}
      
      <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="bg-fantasy-dark/50 border border-fantasy-purple/20">
          <TabsTrigger value="all" className="data-[state=active]:bg-fantasy-purple/20 data-[state=active]:text-fantasy-gold">
            Todas as Mesas
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-fantasy-purple/20 data-[state=active]:text-fantasy-gold">
            Próximas Sessões
          </TabsTrigger>
          <TabsTrigger value="available" className="data-[state=active]:bg-fantasy-purple/20 data-[state=active]:text-fantasy-gold">
            Vagas Disponíveis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-6">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="available" className="mt-6">
          {renderContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}