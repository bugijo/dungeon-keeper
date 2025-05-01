// Constantes para o sistema D&D 5e

// Classes do D&D 5e com descrições e habilidades principais
export const DND5E_CLASSES = [
  {
    id: 'barbarian',
    name: 'Bárbaro',
    description: 'Guerreiros ferozes que canalizam sua fúria interior para potencializar seus ataques.',
    primaryAbility: 'Força',
    hitDie: 'd12',
    savingThrows: ['Força', 'Constituição'],
    features: [
      { level: 1, name: 'Fúria', description: 'Entra em estado de fúria, ganhando vantagem em testes de Força e dano adicional.' },
      { level: 1, name: 'Defesa sem Armadura', description: 'Bônus de CA quando não usa armadura pesada.' },
      { level: 2, name: 'Ataque Descuidado', description: 'Pode atacar com vantagem, mas ataques contra você também têm vantagem.' },
      { level: 3, name: 'Caminho Primitivo', description: 'Escolha uma especialização: Berserker, Guerreiro Totêmico, etc.' }
    ]
  },
  {
    id: 'bard',
    name: 'Bardo',
    description: 'Artistas versáteis que usam música e histórias para inspirar aliados e enfraquecer inimigos.',
    primaryAbility: 'Carisma',
    hitDie: 'd8',
    savingThrows: ['Destreza', 'Carisma'],
    features: [
      { level: 1, name: 'Inspiração de Bardo', description: 'Concede dados de inspiração para aliados usarem em testes.' },
      { level: 1, name: 'Conjuração', description: 'Pode lançar magias de bardo.' },
      { level: 2, name: 'Versatilidade', description: 'Adiciona metade do bônus de proficiência em testes de habilidade sem proficiência.' },
      { level: 3, name: 'Colégio de Bardos', description: 'Escolha uma especialização: Conhecimento, Bravura, etc.' }
    ]
  },
  {
    id: 'cleric',
    name: 'Clérigo',
    description: 'Campeões divinos que canalizam o poder de sua divindade para curar e proteger.',
    primaryAbility: 'Sabedoria',
    hitDie: 'd8',
    savingThrows: ['Sabedoria', 'Carisma'],
    features: [
      { level: 1, name: 'Conjuração', description: 'Pode lançar magias de clérigo.' },
      { level: 1, name: 'Domínio Divino', description: 'Escolha um domínio que determina habilidades e magias adicionais.' },
      { level: 2, name: 'Canalizar Divindade', description: 'Canaliza energia divina para efeitos baseados no domínio escolhido.' },
      { level: 5, name: 'Destruir Mortos-Vivos', description: 'Pode usar Canalizar Divindade para destruir mortos-vivos.' }
    ]
  },
  {
    id: 'druid',
    name: 'Druida',
    description: 'Guardiões da natureza que podem se transformar em animais e controlar os elementos.',
    primaryAbility: 'Sabedoria',
    hitDie: 'd8',
    savingThrows: ['Inteligência', 'Sabedoria'],
    features: [
      { level: 1, name: 'Conjuração', description: 'Pode lançar magias de druida.' },
      { level: 1, name: 'Idioma Druídico', description: 'Conhece a linguagem secreta dos druidas.' },
      { level: 2, name: 'Forma Selvagem', description: 'Pode se transformar em animais.' },
      { level: 3, name: 'Círculo Druídico', description: 'Escolha uma especialização: Terra, Lua, etc.' }
    ]
  },
  {
    id: 'fighter',
    name: 'Guerreiro',
    description: 'Mestres do combate treinados em diversas armas e técnicas de batalha.',
    primaryAbility: 'Força ou Destreza',
    hitDie: 'd10',
    savingThrows: ['Força', 'Constituição'],
    features: [
      { level: 1, name: 'Estilo de Luta', description: 'Escolha um estilo de combate especializado.' },
      { level: 1, name: 'Retomar Fôlego', description: 'Recupera pontos de vida durante o combate.' },
      { level: 2, name: 'Surto de Ação', description: 'Pode realizar uma ação adicional em seu turno.' },
      { level: 3, name: 'Arquétipo Marcial', description: 'Escolha uma especialização: Campeão, Mestre de Batalha, etc.' }
    ]
  },
  {
    id: 'monk',
    name: 'Monge',
    description: 'Artistas marciais que aperfeiçoam o corpo como uma arma e canalizam energia mística.',
    primaryAbility: 'Destreza e Sabedoria',
    hitDie: 'd8',
    savingThrows: ['Força', 'Destreza'],
    features: [
      { level: 1, name: 'Artes Marciais', description: 'Usa Destreza para ataques desarmados e com armas de monge.' },
      { level: 1, name: 'Defesa sem Armadura', description: 'Adiciona bônus de Sabedoria à CA quando não usa armadura.' },
      { level: 2, name: 'Ki', description: 'Ganha pontos de ki para usar habilidades especiais.' },
      { level: 3, name: 'Tradição Monástica', description: 'Escolha uma especialização: Mão Aberta, Sombra, etc.' }
    ]
  },
  {
    id: 'paladin',
    name: 'Paladino',
    description: 'Cavaleiros sagrados que juram proteger a justiça e combater o mal.',
    primaryAbility: 'Força e Carisma',
    hitDie: 'd10',
    savingThrows: ['Sabedoria', 'Carisma'],
    features: [
      { level: 1, name: 'Sentido Divino', description: 'Detecta a presença de celestiais, corruptores ou mortos-vivos.' },
      { level: 1, name: 'Cura pelas Mãos', description: 'Restaura pontos de vida pelo toque.' },
      { level: 2, name: 'Estilo de Luta', description: 'Escolha um estilo de combate especializado.' },
      { level: 3, name: 'Juramento Sagrado', description: 'Escolha um juramento que define seus ideais: Devoção, Vingança, etc.' }
    ]
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Caçadores e rastreadores habilidosos que se especializam em combater ameaças específicas.',
    primaryAbility: 'Destreza e Sabedoria',
    hitDie: 'd10',
    savingThrows: ['Força', 'Destreza'],
    features: [
      { level: 1, name: 'Inimigo Favorito', description: 'Vantagem em rastrear e lembrar informações sobre tipos específicos de inimigos.' },
      { level: 1, name: 'Explorador Natural', description: 'Vantagem em terrenos específicos.' },
      { level: 2, name: 'Estilo de Luta', description: 'Escolha um estilo de combate especializado.' },
      { level: 3, name: 'Arquétipo de Ranger', description: 'Escolha uma especialização: Caçador, Mestre das Feras, etc.' }
    ]
  },
  {
    id: 'rogue',
    name: 'Ladino',
    description: 'Especialistas em furtividade, armadilhas e habilidades que requerem precisão.',
    primaryAbility: 'Destreza',
    hitDie: 'd8',
    savingThrows: ['Destreza', 'Inteligência'],
    features: [
      { level: 1, name: 'Especialidade', description: 'Dobra o bônus de proficiência em certas perícias.' },
      { level: 1, name: 'Ataque Furtivo', description: 'Causa dano extra ao atacar com vantagem ou quando um aliado está próximo.' },
      { level: 2, name: 'Ação Ardilosa', description: 'Pode usar ações bônus para Desengajar, Disparada ou Esconder.' },
      { level: 3, name: 'Arquétipo de Ladino', description: 'Escolha uma especialização: Assassino, Ladrão, etc.' }
    ]
  },
  {
    id: 'sorcerer',
    name: 'Feiticeiro',
    description: 'Conjuradores com poder mágico inato, frequentemente de linhagem mágica.',
    primaryAbility: 'Carisma',
    hitDie: 'd6',
    savingThrows: ['Constituição', 'Carisma'],
    features: [
      { level: 1, name: 'Conjuração', description: 'Pode lançar magias de feiticeiro.' },
      { level: 1, name: 'Origem de Feitiçaria', description: 'Fonte do seu poder mágico: Dracônica, Selvagem, etc.' },
      { level: 2, name: 'Pontos de Feitiçaria', description: 'Pontos para modificar magias e criar espaços de magia.' },
      { level: 3, name: 'Metamagia', description: 'Pode modificar suas magias com efeitos especiais.' }
    ]
  },
  {
    id: 'warlock',
    name: 'Bruxo',
    description: 'Conjuradores que fazem pactos com entidades poderosas em troca de magia.',
    primaryAbility: 'Carisma',
    hitDie: 'd8',
    savingThrows: ['Sabedoria', 'Carisma'],
    features: [
      { level: 1, name: 'Conjuração', description: 'Pode lançar magias de bruxo.' },
      { level: 1, name: 'Patrono Transcendental', description: 'Entidade com quem você fez um pacto: Arquifada, Corruptor, etc.' },
      { level: 2, name: 'Invocações Místicas', description: 'Habilidades mágicas especiais concedidas pelo seu patrono.' },
      { level: 3, name: 'Dádiva do Pacto', description: 'Benefício especial do seu pacto: Lâmina, Corrente, Tomo.' }
    ]
  },
  {
    id: 'wizard',
    name: 'Mago',
    description: 'Estudiosos da magia que aprendem feitiços através de estudo e prática.',
    primaryAbility: 'Inteligência',
    hitDie: 'd6',
    savingThrows: ['Inteligência', 'Sabedoria'],
    features: [
      { level: 1, name: 'Conjuração', description: 'Pode lançar magias de mago.' },
      { level: 1, name: 'Recuperação Arcana', description: 'Recupera espaços de magia durante um descanso curto.' },
      { level: 2, name: 'Tradição Arcana', description: 'Escola de magia especializada: Evocação, Abjuração, etc.' },
      { level: 3, name: 'Savante Arcano', description: 'Reduz tempo e ouro para copiar magias da sua escola.' }
    ]
  }
];

// Raças do D&D 5e com bônus de atributos e características
export const DND5E_RACES = [
  {
    id: 'human',
    name: 'Humano',
    abilityScoreIncrease: 'Todos os atributos +1',
    speed: 9,
    traits: [
      { name: 'Versátil', description: 'Humanos são adaptáveis e aprendem rapidamente.' }
    ]
  },
  {
    id: 'elf',
    name: 'Elfo',
    abilityScoreIncrease: 'Destreza +2',
    speed: 9,
    traits: [
      { name: 'Visão no Escuro', description: 'Pode ver na escuridão até 18 metros.' },
      { name: 'Sentidos Aguçados', description: 'Proficiência na perícia Percepção.' },
      { name: 'Ancestral Feérico', description: 'Vantagem contra ser enfeitiçado e imune a sono mágico.' },
      { name: 'Transe', description: 'Não precisa dormir, medita profundamente por 4 horas.' }
    ],
    subraces: [
      { name: 'Alto Elfo', abilityBonus: 'Inteligência +1' },
      { name: 'Elfo da Floresta', abilityBonus: 'Sabedoria +1' },
      { name: 'Elfo Negro (Drow)', abilityBonus: 'Carisma +1' }
    ]
  },
  {
    id: 'dwarf',
    name: 'Anão',
    abilityScoreIncrease: 'Constituição +2',
    speed: 7.5,
    traits: [
      { name: 'Visão no Escuro', description: 'Pode ver na escuridão até 18 metros.' },
      { name: 'Resiliência Anã', description: 'Vantagem contra venenos e resistência contra dano de veneno.' },
      { name: 'Treinamento em Combate Anão', description: 'Proficiência com machados de batalha, machadinhas, martelos leves e martelos de guerra.' },
      { name: 'Afinidade com a Pedra', description: 'Bônus em testes de História relacionados a trabalhos em pedra.' }
    ],
    subraces: [
      { name: 'Anão da Colina', abilityBonus: 'Sabedoria +1' },
      { name: 'Anão da Montanha', abilityBonus: 'Força +2' }
    ]
  },
  {
    id: 'halfling',
    name: 'Halfling',
    abilityScoreIncrease: 'Destreza +2',
    speed: 7.5,
    traits: [
      { name: 'Sortudo', description: 'Pode rolar novamente um d20 quando obtiver 1.' },
      { name: 'Bravura', description: 'Vantagem contra ser amedrontado.' },
      { name: 'Agilidade Halfling', description: 'Pode mover-se através do espaço de qualquer criatura maior que você.' }
    ],
    subraces: [
      { name: 'Pés-Leves', abilityBonus: 'Carisma +1' },
      { name: 'Robusto', abilityBonus: 'Constituição +1' }
    ]
  },
  {
    id: 'dragonborn',
    name: 'Draconato',
    abilityScoreIncrease: 'Força +2, Carisma +1',
    speed: 9,
    traits: [
      { name: 'Ancestral Dracônico', description: 'Escolha um tipo de dragão que determina seu sopro e resistência a dano.' },
      { name: 'Sopro Dracônico', description: 'Pode exalar energia destrutiva. O tipo de dano é determinado pelo seu ancestral dracônico.' },
      { name: 'Resistência a Dano', description: 'Resistência ao tipo de dano associado ao seu ancestral dracônico.' }
    ]
  },
  {
    id: 'gnome',
    name: 'Gnomo',
    abilityScoreIncrease: 'Inteligência +2',
    speed: 7.5,
    traits: [
      { name: 'Visão no Escuro', description: 'Pode ver na escuridão até 18 metros.' },
      { name: 'Esperteza Gnômica', description: 'Vantagem em todos os testes de resistência de Inteligência, Sabedoria e Carisma contra magia.' }
    ],
    subraces: [
      { name: 'Gnomo da Floresta', abilityBonus: 'Destreza +1' },
      { name: 'Gnomo das Rochas', abilityBonus: 'Constituição +1' }
    ]
  },
  {
    id: 'half-elf',
    name: 'Meio-Elfo',
    abilityScoreIncrease: 'Carisma +2, e outros dois atributos +1',
    speed: 9,
    traits: [
      { name: 'Visão no Escuro', description: 'Pode ver na escuridão até 18 metros.' },
      { name: 'Ancestral Feérico', description: 'Vantagem contra ser enfeitiçado e imune a sono mágico.' },
      { name: 'Versatilidade em Perícias', description: 'Proficiência em duas perícias à sua escolha.' }
    ]
  },
  {
    id: 'half-orc',
    name: 'Meio-Orc',
    abilityScoreIncrease: 'Força +2, Constituição +1',
    speed: 9,
    traits: [
      { name: 'Visão no Escuro', description: 'Pode ver na escuridão até 18 metros.' },
      { name: 'Ameaçador', description: 'Proficiência na perícia Intimidação.' },
      { name: 'Resistência Implacável', description: 'Quando reduzido a 0 pontos de vida, pode voltar a 1 ponto de vida uma vez por dia.' },
      { name: 'Ataques Selvagens', description: 'Rola um dado de dano adicional em acertos críticos com ataques corpo a corpo.' }
    ]
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    abilityScoreIncrease: 'Inteligência +1, Carisma +2',
    speed: 9,
    traits: [
      { name: 'Visão no Escuro', description: 'Pode ver na escuridão até 18 metros.' },
      { name: 'Resistência Infernal', description: 'Resistência a dano de fogo.' },
      { name: 'Legado Infernal', description: 'Conhece o truque Taumaturgia e pode lançar outras magias conforme sobe de nível.' }
    ]
  }
];

// Antecedentes do D&D 5e
export const DND5E_BACKGROUNDS = [
  {
    id: 'acolyte',
    name: 'Acólito',
    skillProficiencies: ['Intuição', 'Religião'],
    toolProficiencies: [],
    languages: 'Duas à sua escolha',
    equipment: 'Um símbolo sagrado, livro de preces, 5 varetas de incenso, vestes, conjunto de roupas comuns, e uma algibeira com 15 po',
    feature: 'Abrigo dos Fiéis',
    description: 'Você dedicou sua vida ao serviço de um templo de um deus específico ou panteão de deuses.'
  },
  {
    id: 'criminal',
    name: 'Criminoso',
    skillProficiencies: ['Enganação', 'Furtividade'],
    toolProficiencies: ['Kit de jogo', 'Ferramentas de ladrão'],
    languages: '',
    equipment: 'Um pé de cabra, conjunto de roupas escuras comuns com capuz, e uma algibeira com 15 po',
    feature: 'Contato Criminal',
    description: 'Você é um criminoso experiente com um histórico de quebrar a lei.'
  },
  {
    id: 'folk-hero',
    name: 'Herói do Povo',
    skillProficiencies: ['Adestrar Animais', 'Sobrevivência'],
    toolProficiencies: ['Um tipo de ferramenta de artesão', 'Veículos terrestres'],
    languages: '',
    equipment: 'Um conjunto de ferramentas de artesão, uma pá, um pote de ferro, conjunto de roupas comuns, e uma algibeira com 10 po',
    feature: 'Hospitalidade Rural',
    description: 'Você vem de uma origem humilde, mas está destinado a muito mais.'
  },
  {
    id: 'noble',
    name: 'Nobre',
    skillProficiencies: ['História', 'Persuasão'],
    toolProficiencies: ['Um tipo de kit de jogo'],
    languages: 'Uma à sua escolha',
    equipment: 'Um conjunto de roupas finas, um anel de sinete, um pergaminho de linhagem, e uma algibeira com 25 po',
    feature: 'Posição Privilegiada',
    description: 'Você entende a riqueza, o poder e os privilégios.'
  },
  {
    id: 'sage',
    name: 'Sábio',
    skillProficiencies: ['Arcanismo', 'História'],
    toolProficiencies: [],
    languages: 'Duas à sua escolha',
    equipment: 'Um vidro de tinta escura, uma pena, uma faca pequena, uma carta de um colega falecido, conjunto de roupas comuns, e uma algibeira com 10 po',
    feature: 'Pesquisador',
    description: 'Você passou anos aprendendo sobre o multiverso.'
  },
  {
    id: 'soldier',
    name: 'Soldado',
    skillProficiencies: ['Atletismo', 'Intimidação'],
    toolProficiencies: ['Um tipo de kit de jogo', 'Veículos terrestres'],
    languages: '',
    equipment: 'Uma insígnia de patente, um troféu de um inimigo, conjunto de dados de osso ou baralho, conjunto de roupas comuns, e uma algibeira com 10 po',
    feature: 'Patente Militar',
    description: 'Você treinou como soldado e ainda carrega as marcas desse passado.'
  }
];

// Alinhamentos do D&D 5e
export const DND5E_ALIGNMENTS = [
  { id: 'lawful-good', name: 'Leal e Bom', description: 'Segue as regras e códigos de conduta, e age com compaixão e honra.' },
  { id: 'neutral-good', name: 'Neutro e Bom', description: 'Age com bondade e benevolência, sem se prender a regras ou caos.' },
  { id: 'chaotic-good', name: 'Caótico e Bom', description: 'Age conforme sua consciência, com pouco respeito por regras e tradições.' },
  { id: 'lawful-neutral', name: 'Leal e Neutro', description: 'Age de acordo com a lei, tradição ou código pessoal, sem tendência para o bem ou mal.' },
  { id: 'true-neutral', name: 'Neutro', description: 'Age naturalmente sem preconceitos ou compulsões, evitando extremos.' },
  { id: 'chaotic-neutral', name: 'Caótico e Neutro', description: 'Segue seus caprichos, valorizando a liberdade acima de tudo.' },
  { id: 'lawful-evil', name: 'Leal e Mau', description: 'Age metodicamente, respeitando tradição, lealdade ou ordem, mas sem misericórdia.' },
  { id: 'neutral-evil', name: 'Neutro e Mau', description: 'Faz o que pode para conseguir o que quer, sem compaixão ou escrúpulos.' },
  { id: 'chaotic-evil', name: 'Caótico e Mau', description: 'Age com violência arbitrária, estimulado pela ganância, ódio ou sede de sangue.' }
];

// Perícias do D&D 5e com seus atributos associados
export const DND5E_SKILLS = [
  { id: 'acrobatics', name: 'Acrobacia', ability: 'Destreza' },
  { id: 'animal-handling', name: 'Adestrar Animais', ability: 'Sabedoria' },
  { id: 'arcana', name: 'Arcanismo', ability: 'Inteligência' },
  { id: 'athletics', name: 'Atletismo', ability: 'Força' },
  { id: 'deception', name: 'Enganação', ability: 'Carisma' },
  { id: 'history', name: 'História', ability: 'Inteligência' },
  { id: 'insight', name: 'Intuição', ability: 'Sabedoria' },
  { id: 'intimidation', name: 'Intimidação', ability: 'Carisma' },
  { id: 'investigation', name: 'Investigação', ability: 'Inteligência' },
  { id: 'medicine', name: 'Medicina', ability: 'Sabedoria' },
  { id: 'nature', name: 'Natureza', ability: 'Inteligência' },
  { id: 'perception', name: 'Percepção', ability: 'Sabedoria' },
  { id: 'performance', name: 'Atuação', ability: 'Carisma' },
  { id: 'persuasion', name: 'Persuasão', ability: 'Carisma' },
  { id: 'religion', name: 'Religião', ability: 'Inteligência' },
  { id: 'sleight-of-hand', name: 'Prestidigitação', ability: 'Destreza' },
  { id: 'stealth', name: 'Furtividade', ability: 'Destreza' },
  { id: 'survival', name: 'Sobrevivência', ability: 'Sabedoria' }
];

// Função para calcular o modificador de atributo
export const calculateAbilityModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

// Função para calcular o bônus de proficiência baseado no nível
export const calculateProficiencyBonus = (level: number): number => {
  return Math.floor((level - 1) / 4) + 2;
};