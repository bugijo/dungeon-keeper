from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field
from enum import Enum, auto
import random

class NarrativeElementType(Enum):
    PLOT_HOOK = auto()      # Ganchos de história
    ENVIRONMENT = auto()     # Descrições de ambiente
    CONSEQUENCE = auto()     # Consequências de ações
    SCENE_MOOD = auto()      # Clima da cena
    DRAMATIC_EVENT = auto()   # Eventos dramáticos

@dataclass
class NarrativeElement:
    """Elemento narrativo base."""
    content: str
    element_type: NarrativeElementType
    tags: Set[str] = field(default_factory=set)
    context: Optional[str] = None
    variations: List[str] = field(default_factory=list)

@dataclass
class PlotHook(NarrativeElement):
    """Gancho de história para iniciar aventuras ou subtramas."""
    urgency: int = 1  # 1-5, onde 5 é mais urgente
    complexity: int = 1  # 1-5, onde 5 é mais complexo
    possible_outcomes: List[str] = field(default_factory=list)

@dataclass
class EnvironmentDescription(NarrativeElement):
    """Descrição detalhada de ambiente."""
    sensory_details: Dict[str, List[str]] = field(default_factory=lambda: {
        "visual": [],
        "sound": [],
        "smell": [],
        "touch": [],
        "taste": []
    })
    time_of_day: Optional[str] = None
    weather: Optional[str] = None

@dataclass
class ActionConsequence(NarrativeElement):
    """Consequências possíveis para ações dos jogadores."""
    severity: int = 1  # 1-5, onde 5 é mais severo
    timeframe: str = "imediato"  # imediato, curto prazo, longo prazo
    affected_aspects: List[str] = field(default_factory=list)

@dataclass
class NarrativeAid:
    """Sistema de auxílio narrativo para o mestre."""
    plot_hooks: List[PlotHook] = field(default_factory=list)
    environment_descriptions: List[EnvironmentDescription] = field(default_factory=list)
    consequences: List[ActionConsequence] = field(default_factory=list)
    
    def __post_init__(self):
        self._initialize_default_content()
    
    def _initialize_default_content(self):
        """Inicializa o conteúdo padrão do sistema."""
        # Ganchos de história
        self.add_plot_hook(
            "Desaparecimentos Misteriosos",
            "Moradores locais começam a desaparecer sem deixar rastros.",
            urgency=4,
            complexity=3,
            tags={"mistério", "cidade", "investigação"},
            possible_outcomes=[
                "Culto secreto sequestra pessoas para ritual",
                "Portal dimensional instavel absorve pessoas",
                "Criatura antiga desperta e caça durante a noite"
            ]
        )
        
        # Descrições de ambiente
        self.add_environment_description(
            "Taverna Acolhedora",
            "Um ambiente aconchegante iluminado por lareiras.",
            sensory_details={
                "visual": ["Chamas dançantes nas lareiras", "Mesas de madeira polida"],
                "sound": ["Conversas animadas", "Música suave de alaude"],
                "smell": ["Aroma de pão fresco", "Cerveja receém servida"],
                "touch": ["Calor das lareiras", "Bancos confortáveis"],
                "taste": ["Cerveja artesanal", "Ensopado temperado"]
            },
            tags={"taverna", "cidade", "social"}
        )
        
        # Consequências de ações
        self.add_consequence(
            "Insulto a Nobre",
            "O personagem insultou publicamente um nobre local.",
            severity=3,
            timeframe="curto prazo",
            affected_aspects=["reputação", "relações sociais", "oportunidades"],
            tags={"social", "nobreza", "conflito"}
        )
    
    def add_plot_hook(self, title: str, content: str, urgency: int = 1,
                      complexity: int = 1, tags: Set[str] = None,
                      possible_outcomes: List[str] = None) -> None:
        """Adiciona um novo gancho de história."""
        hook = PlotHook(
            content=content,
            element_type=NarrativeElementType.PLOT_HOOK,
            tags=tags or set(),
            urgency=urgency,
            complexity=complexity,
            possible_outcomes=possible_outcomes or []
        )
        self.plot_hooks.append(hook)
    
    def add_environment_description(self, title: str, content: str,
                                   sensory_details: Dict[str, List[str]] = None,
                                   tags: Set[str] = None,
                                   time_of_day: Optional[str] = None,
                                   weather: Optional[str] = None) -> None:
        """Adiciona uma nova descrição de ambiente."""
        desc = EnvironmentDescription(
            content=content,
            element_type=NarrativeElementType.ENVIRONMENT,
            tags=tags or set(),
            sensory_details=sensory_details or {},
            time_of_day=time_of_day,
            weather=weather
        )
        self.environment_descriptions.append(desc)
    
    def add_consequence(self, title: str, content: str, severity: int = 1,
                        timeframe: str = "imediato",
                        affected_aspects: List[str] = None,
                        tags: Set[str] = None) -> None:
        """Adiciona uma nova consequência de ação."""
        consequence = ActionConsequence(
            content=content,
            element_type=NarrativeElementType.CONSEQUENCE,
            tags=tags or set(),
            severity=severity,
            timeframe=timeframe,
            affected_aspects=affected_aspects or []
        )
        self.consequences.append(consequence)
    
    def get_random_plot_hook(self, tags: Set[str] = None,
                            min_urgency: int = 1,
                            max_complexity: int = 5) -> Optional[PlotHook]:
        """Retorna um gancho de história aleatório com filtros."""
        suitable_hooks = [
            hook for hook in self.plot_hooks
            if (not tags or any(tag in hook.tags for tag in tags)) and
               hook.urgency >= min_urgency and
               hook.complexity <= max_complexity
        ]
        return random.choice(suitable_hooks) if suitable_hooks else None
    
    def get_environment_description(self, tags: Set[str] = None,
                                   time_of_day: Optional[str] = None,
                                   weather: Optional[str] = None) -> Optional[EnvironmentDescription]:
        """Retorna uma descrição de ambiente com filtros."""
        suitable_descs = [
            desc for desc in self.environment_descriptions
            if (not tags or any(tag in desc.tags for tag in tags)) and
               (not time_of_day or desc.time_of_day == time_of_day) and
               (not weather or desc.weather == weather)
        ]
        return random.choice(suitable_descs) if suitable_descs else None
    
    def get_consequence(self, tags: Set[str] = None,
                        min_severity: int = 1,
                        timeframe: Optional[str] = None) -> Optional[ActionConsequence]:
        """Retorna uma consequência com filtros."""
        suitable_consequences = [
            cons for cons in self.consequences
            if (not tags or any(tag in cons.tags for tag in tags)) and
               cons.severity >= min_severity and
               (not timeframe or cons.timeframe == timeframe)
        ]
        return random.choice(suitable_consequences) if suitable_consequences else None
    
    def search_elements(self, query: str,
                        element_type: Optional[NarrativeElementType] = None) -> List[NarrativeElement]:
        """Busca elementos narrativos por texto."""
        query = query.lower()
        results = []
        
        # Busca em ganchos de história
        if not element_type or element_type == NarrativeElementType.PLOT_HOOK:
            results.extend(
                hook for hook in self.plot_hooks
                if query in hook.content.lower() or
                   any(query in tag.lower() for tag in hook.tags)
            )
        
        # Busca em descrições de ambiente
        if not element_type or element_type == NarrativeElementType.ENVIRONMENT:
            results.extend(
                desc for desc in self.environment_descriptions
                if query in desc.content.lower() or
                   any(query in tag.lower() for tag in desc.tags)
            )
        
        # Busca em consequências
        if not element_type or element_type == NarrativeElementType.CONSEQUENCE:
            results.extend(
                cons for cons in self.consequences
                if query in cons.content.lower() or
                   any(query in tag.lower() for tag in cons.tags)
            )
        
        return results
    
    def export_to_markdown(self) -> str:
        """Exporta todo o conteúdo narrativo em formato markdown."""
        output = ["# Auxílio Narrativo\n\n"]
        
        # Ganchos de história
        output.append("## Ganchos de História\n\n")
        for hook in self.plot_hooks:
            output.extend([
                f"### {hook.content}\n\n",
                f"**Urgência:** {'!' * hook.urgency}\n\n",
                f"**Complexidade:** {'*' * hook.complexity}\n\n"
            ])
            if hook.possible_outcomes:
                output.append("**Possíveis Desfechos:**\n")
                for outcome in hook.possible_outcomes:
                    output.append(f"- {outcome}\n")
                output.append("\n")
        
        # Descrições de ambiente
        output.append("## Descrições de Ambiente\n\n")
        for desc in self.environment_descriptions:
            output.extend([
                f"### {desc.content}\n\n"
            ])
            if desc.sensory_details:
                output.append("**Detalhes Sensoriais:**\n")
                for sense, details in desc.sensory_details.items():
                    if details:
                        output.append(f"*{sense.title()}:*\n")
                        for detail in details:
                            output.append(f"- {detail}\n")
                output.append("\n")
        
        # Consequências
        output.append("## Consequências de Ações\n\n")
        for cons in self.consequences:
            output.extend([
                f"### {cons.content}\n\n",
                f"**Severidade:** {'!' * cons.severity}\n\n",
                f"**Prazo:** {cons.timeframe}\n\n"
            ])
            if cons.affected_aspects:
                output.append("**Aspectos Afetados:**\n")
                for aspect in cons.affected_aspects:
                    output.append(f"- {aspect}\n")
                output.append("\n")
        
        return "".join(output)