from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum, auto
import random

class ReferenceType(Enum):
    RULE = auto()        # Regras básicas
    COMBAT = auto()      # Regras de combate
    MAGIC = auto()       # Regras de magia
    ENVIRONMENT = auto() # Regras de ambiente
    CONDITION = auto()   # Condições e estados
    TABLE = auto()       # Tabelas diversas
    GENERATOR = auto()   # Geradores de conteúdo

@dataclass
class ReferenceEntry:
    """Representa uma entrada na referência rápida."""
    title: str
    content: str
    reference_type: ReferenceType
    tags: List[str] = field(default_factory=list)
    examples: List[str] = field(default_factory=list)
    page_number: Optional[int] = None  # Referência ao livro de regras

@dataclass
class ReferenceTable:
    """Representa uma tabela de referência."""
    name: str
    description: str
    entries: List[str]
    weights: Optional[List[float]] = None  # Para tabelas com probabilidades diferentes
    
    def roll(self) -> str:
        """Retorna uma entrada aleatória da tabela."""
        if self.weights:
            return random.choices(self.entries, weights=self.weights, k=1)[0]
        return random.choice(self.entries)
    
    def roll_multiple(self, count: int) -> List[str]:
        """Retorna múltiplas entradas aleatórias da tabela."""
        if self.weights:
            return random.choices(self.entries, weights=self.weights, k=count)
        return random.sample(self.entries, min(count, len(self.entries)))

@dataclass
class ContentGenerator:
    """Gerador de conteúdo para o mestre."""
    name: str
    description: str
    tables: Dict[str, ReferenceTable]
    
    def generate(self) -> Dict[str, str]:
        """Gera uma combinação de elementos das tabelas."""
        return {name: table.roll() for name, table in self.tables.items()}

@dataclass
class QuickReference:
    """Sistema de referência rápida para regras e tabelas."""
    entries: Dict[str, ReferenceEntry] = field(default_factory=dict)
    tables: Dict[str, ReferenceTable] = field(default_factory=dict)
    generators: Dict[str, ContentGenerator] = field(default_factory=dict)
    
    def __post_init__(self):
        self._initialize_default_content()
    
    def _initialize_default_content(self):
        """Inicializa o conteúdo padrão do sistema."""
        # Tabelas de nomes
        self.add_table(
            "nomes_masculinos",
            "Nomes masculinos comuns",
            ["Arthur", "Bernardo", "Carlos", "Daniel", "Eduardo", "Fernando", "Gabriel", "Henrique"]
        )
        
        self.add_table(
            "nomes_femininos",
            "Nomes femininos comuns",
            ["Ana", "Beatriz", "Clara", "Diana", "Elena", "Flávia", "Gabriela", "Helena"]
        )
        
        # Tabela de traços de personalidade
        self.add_table(
            "tracos_personalidade",
            "Traços de personalidade para NPCs",
            [
                "Amigável e acolhedor",
                "Desconfiado e cauteloso",
                "Arrogante e orgulhoso",
                "Tímido e reservado",
                "Brincalhão e espirituoso",
                "Sério e formal",
                "Misterioso e enigmático",
                "Honesto e direto"
            ]
        )
        
        # Tabela de climas
        self.add_table(
            "clima",
            "Condições climáticas",
            [
                "Ensolarado e claro",
                "Nublado e ameno",
                "Chuva leve",
                "Tempestade forte",
                "Neblina densa",
                "Vento forte",
                "Neve leve",
                "Tempestade de neve"
            ]
        )
        
        # Gerador de NPCs
        self.add_generator(
            "npc_simples",
            "Gerador de NPCs simples",
            {
                "nome_masculino": self.tables["nomes_masculinos"],
                "nome_feminino": self.tables["nomes_femininos"],
                "personalidade": self.tables["tracos_personalidade"]
            }
        )
        
        # Regras comuns
        self.add_entry(
            "teste_habilidade",
            "Como realizar testes de habilidade",
            "Role 1d20 e adicione o modificador de habilidade. Compare com a CD do teste.",
            ReferenceType.RULE,
            ["Força", "Destreza", "Teste"],
            ["CD 15: Escalar uma parede íngreme", "CD 10: Equilibrar-se em uma superfície estreita"]
        )
        
        self.add_entry(
            "vantagem_desvantagem",
            "Vantagem e Desvantagem",
            "Com vantagem, role dois d20 e use o maior. Com desvantagem, use o menor.",
            ReferenceType.RULE,
            ["Vantagem", "Desvantagem", "Dados"],
            ["Atacar um alvo invisível: desvantagem", "Atacar um alvo caído: vantagem"]
        )
    
    def add_entry(self, key: str, title: str, content: str, ref_type: ReferenceType,
                  tags: List[str] = None, examples: List[str] = None,
                  page_number: Optional[int] = None) -> None:
        """Adiciona uma nova entrada de referência."""
        self.entries[key] = ReferenceEntry(
            title=title,
            content=content,
            reference_type=ref_type,
            tags=tags or [],
            examples=examples or [],
            page_number=page_number
        )
    
    def add_table(self, name: str, description: str, entries: List[str],
                  weights: Optional[List[float]] = None) -> None:
        """Adiciona uma nova tabela de referência."""
        self.tables[name] = ReferenceTable(
            name=name,
            description=description,
            entries=entries,
            weights=weights
        )
    
    def add_generator(self, name: str, description: str,
                      tables: Dict[str, ReferenceTable]) -> None:
        """Adiciona um novo gerador de conteúdo."""
        self.generators[name] = ContentGenerator(
            name=name,
            description=description,
            tables=tables
        )
    
    def get_entry(self, key: str) -> Optional[ReferenceEntry]:
        """Recupera uma entrada de referência."""
        return self.entries.get(key)
    
    def get_entries_by_type(self, ref_type: ReferenceType) -> List[ReferenceEntry]:
        """Retorna todas as entradas de um tipo específico."""
        return [entry for entry in self.entries.values()
                if entry.reference_type == ref_type]
    
    def search_entries(self, query: str) -> List[ReferenceEntry]:
        """Busca entradas por texto."""
        query = query.lower()
        return [
            entry for entry in self.entries.values()
            if query in entry.title.lower() or
               query in entry.content.lower() or
               any(query in tag.lower() for tag in entry.tags)
        ]
    
    def roll_table(self, table_name: str) -> Optional[str]:
        """Rola em uma tabela específica."""
        table = self.tables.get(table_name)
        if table:
            return table.roll()
        return None
    
    def generate_content(self, generator_name: str) -> Optional[Dict[str, str]]:
        """Gera conteúdo usando um gerador específico."""
        generator = self.generators.get(generator_name)
        if generator:
            return generator.generate()
        return None
    
    def export_all_entries(self, format: str = "markdown") -> str:
        """Exporta todas as entradas em um formato específico."""
        if format == "markdown":
            return self._export_markdown()
        return ""
    
    def _export_markdown(self) -> str:
        """Exporta todas as entradas em formato markdown."""
        output = ["# Referência Rápida\n\n"]
        
        # Organiza entradas por tipo
        entries_by_type = {}
        for entry in self.entries.values():
            if entry.reference_type not in entries_by_type:
                entries_by_type[entry.reference_type] = []
            entries_by_type[entry.reference_type].append(entry)
        
        # Gera saída organizada
        for ref_type in ReferenceType:
            if ref_type in entries_by_type:
                output.append(f"## {ref_type.name}\n\n")
                for entry in entries_by_type[ref_type]:
                    output.extend([
                        f"### {entry.title}\n\n",
                        f"{entry.content}\n\n"
                    ])
                    
                    if entry.examples:
                        output.append("**Exemplos:**\n")
                        for example in entry.examples:
                            output.append(f"- {example}\n")
                        output.append("\n")
                    
                    if entry.page_number:
                        output.append(f"*Página: {entry.page_number}*\n\n")
        
        return "".join(output)