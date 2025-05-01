import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: React.ReactNode;
  image?: string;
  category: 'básico' | 'personagens' | 'combate' | 'mapas' | 'mestre';
}

interface TutorialSystemProps {
  onComplete?: () => void;
  initialCategory?: string;
  showOnFirstVisit?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  // Tutoriais Básicos
  {
    id: 'welcome',
    title: 'Bem-vindo ao Dungeon Kreeper',
    content: (
      <div>
        <p>Bem-vindo ao Dungeon Kreeper, seu assistente completo para gerenciar campanhas de RPG!</p>
        <p className="mt-2">Este tutorial irá guiá-lo pelos recursos básicos do sistema para que você possa começar a jogar rapidamente.</p>
      </div>
    ),
    category: 'básico'
  },
  {
    id: 'navigation',
    title: 'Navegação Básica',
    content: (
      <div>
        <p>A barra de navegação superior permite acessar todas as seções principais:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Início:</strong> Painel principal com acesso rápido</li>
          <li><strong>Mesas:</strong> Gerenciar e participar de jogos</li>
          <li><strong>Personagens:</strong> Criar e gerenciar seus personagens</li>
          <li><strong>Criações:</strong> Desenvolver mapas, histórias e mais</li>
        </ul>
      </div>
    ),
    category: 'básico'
  },
  
  // Tutoriais de Personagens
  {
    id: 'character-creation',
    title: 'Criação de Personagem',
    content: (
      <div>
        <p>Para criar um novo personagem:</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Acesse a seção <strong>Personagens</strong></li>
          <li>Clique em <strong>Criar Novo</strong></li>
          <li>Escolha raça, classe e distribua pontos de atributos</li>
          <li>Personalize aparência e história</li>
          <li>Salve seu personagem</li>
        </ol>
      </div>
    ),
    category: 'personagens'
  },
  {
    id: 'character-sheet',
    title: 'Ficha de Personagem',
    content: (
      <div>
        <p>A ficha de personagem contém todas as informações importantes:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Atributos:</strong> Força, Destreza, etc.</li>
          <li><strong>Habilidades:</strong> Perícias e talentos especiais</li>
          <li><strong>Equipamento:</strong> Itens, armas e armaduras</li>
          <li><strong>Magias:</strong> Lista de magias conhecidas (se aplicável)</li>
        </ul>
        <p className="mt-2">Clique em qualquer seção para ver mais detalhes ou fazer alterações.</p>
      </div>
    ),
    category: 'personagens'
  },
  
  // Tutoriais de Combate
  {
    id: 'combat-basics',
    title: 'Noções Básicas de Combate',
    content: (
      <div>
        <p>Durante o combate, cada personagem age em ordem de iniciativa:</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Role iniciativa no início do combate</li>
          <li>Na sua vez, você pode realizar uma ação, uma ação bônus e movimento</li>
          <li>Use o botão de rolagem para testes de ataque e dano</li>
          <li>O mestre controlará os inimigos e o ambiente</li>
        </ol>
      </div>
    ),
    category: 'combate'
  },
  {
    id: 'dice-rolling',
    title: 'Rolagem de Dados',
    content: (
      <div>
        <p>Para rolar dados no sistema:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Clique no ícone de dados na interface</li>
          <li>Selecione o tipo de dado (d20, d12, d10, d8, d6, d4)</li>
          <li>Adicione modificadores se necessário</li>
          <li>Clique em "Rolar" para ver o resultado</li>
        </ul>
        <p className="mt-2">Os resultados são visíveis para todos os jogadores da mesa, a menos que você escolha fazer uma rolagem privada.</p>
      </div>
    ),
    category: 'combate'
  },
  
  // Tutoriais de Mapas
  {
    id: 'tactical-maps',
    title: 'Mapas Táticos',
    content: (
      <div>
        <p>Os mapas táticos permitem visualizar o ambiente de jogo:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Movimente seu token arrastando-o pelo mapa</li>
          <li>Use a ferramenta de medição para calcular distâncias</li>
          <li>Áreas escurecidas representam locais que seu personagem não pode ver</li>
          <li>Interaja com objetos clicando neles</li>
        </ul>
      </div>
    ),
    category: 'mapas'
  },
  {
    id: 'map-tools',
    title: 'Ferramentas de Mapa',
    content: (
      <div>
        <p>Ferramentas disponíveis ao usar mapas:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Zoom:</strong> Use os botões + e - ou a roda do mouse</li>
          <li><strong>Medição:</strong> Clique no ícone de régua para medir distâncias</li>
          <li><strong>Marcadores:</strong> Adicione marcadores para pontos importantes</li>
          <li><strong>Anotações:</strong> Faça anotações sobre áreas específicas</li>
        </ul>
      </div>
    ),
    category: 'mapas'
  },
  
  // Tutoriais para Mestres
  {
    id: 'gm-basics',
    title: 'Noções Básicas para Mestres',
    content: (
      <div>
        <p>Como mestre, você tem acesso a ferramentas especiais:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Painel do Mestre para gerenciar a sessão</li>
          <li>Controle de visibilidade do mapa (névoa de guerra)</li>
          <li>Gerenciamento de NPCs e monstros</li>
          <li>Criação e compartilhamento de conteúdo</li>
        </ul>
      </div>
    ),
    category: 'mestre'
  },
  {
    id: 'session-management',
    title: 'Gerenciamento de Sessões',
    content: (
      <div>
        <p>Para gerenciar suas sessões de jogo:</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Crie uma nova mesa na seção "Mesas"</li>
          <li>Convide jogadores usando email ou nome de usuário</li>
          <li>Agende sessões no calendário</li>
          <li>Prepare mapas, NPCs e notas antes da sessão</li>
          <li>Use o painel do mestre durante o jogo para controlar todos os aspectos</li>
        </ol>
      </div>
    ),
    category: 'mestre'
  },
];

const TutorialSystem: React.FC<TutorialSystemProps> = ({
  onComplete,
  initialCategory = 'básico',
  showOnFirstVisit = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>(initialCategory);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Filtrar passos pelo categoria atual
  const filteredSteps = tutorialSteps.filter(step => step.category === currentCategory);
  const currentStep = filteredSteps[currentStepIndex];

  useEffect(() => {
    // Verificar se é a primeira visita
    const tutorialSeen = localStorage.getItem('dk_tutorial_seen');
    if (!tutorialSeen && showOnFirstVisit) {
      setIsOpen(true);
      localStorage.setItem('dk_tutorial_seen', 'true');
    }
    setHasSeenTutorial(!!tutorialSeen);
  }, [showOnFirstVisit]);

  useEffect(() => {
    // Resetar o índice quando mudar de categoria
    setCurrentStepIndex(0);
  }, [currentCategory]);

  const handleNext = () => {
    if (currentStepIndex < filteredSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Se estamos no último passo desta categoria
      const categories = ['básico', 'personagens', 'combate', 'mapas', 'mestre'];
      const currentCategoryIndex = categories.indexOf(currentCategory);
      
      if (currentCategoryIndex < categories.length - 1) {
        // Ir para a próxima categoria
        setCurrentCategory(categories[currentCategoryIndex + 1]);
        setCurrentStepIndex(0);
      } else {
        // Finalizar o tutorial
        handleClose();
        if (onComplete) onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      // Se estamos no primeiro passo desta categoria
      const categories = ['básico', 'personagens', 'combate', 'mapas', 'mestre'];
      const currentCategoryIndex = categories.indexOf(currentCategory);
      
      if (currentCategoryIndex > 0) {
        // Ir para a categoria anterior
        const previousCategory = categories[currentCategoryIndex - 1];
        setCurrentCategory(previousCategory);
        // Ir para o último passo da categoria anterior
        const previousCategorySteps = tutorialSteps.filter(step => step.category === previousCategory);
        setCurrentStepIndex(previousCategorySteps.length - 1);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const openTutorial = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* Botão flutuante para abrir o tutorial */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 z-50"
        onClick={openTutorial}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      {/* Modal de Tutorial */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Tutorial: {currentStep?.title}
              </span>
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={currentCategory} onValueChange={setCurrentCategory} className="mt-4">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="básico">Básico</TabsTrigger>
              <TabsTrigger value="personagens">Personagens</TabsTrigger>
              <TabsTrigger value="combate">Combate</TabsTrigger>
              <TabsTrigger value="mapas">Mapas</TabsTrigger>
              <TabsTrigger value="mestre">Mestre</TabsTrigger>
            </TabsList>

            {['básico', 'personagens', 'combate', 'mapas', 'mestre'].map((category) => (
              <TabsContent key={category} value={category} className="mt-0">
                <Card className="p-4">
                  {currentStep?.image && (
                    <div className="mb-4 rounded-md overflow-hidden">
                      <img 
                        src={currentStep.image} 
                        alt={currentStep.title} 
                        className="w-full object-cover h-48"
                      />
                    </div>
                  )}
                  <div className="prose prose-sm dark:prose-invert">
                    {currentStep?.content}
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <DialogFooter className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Passo {currentStepIndex + 1} de {filteredSteps.length}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0 && currentCategory === 'básico'}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button onClick={handleNext}>
                {currentStepIndex < filteredSteps.length - 1 || currentCategory !== 'mestre' ? (
                  <>
                    Próximo <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  'Concluir'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TutorialSystem;