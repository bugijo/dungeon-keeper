from typing import Dict, List, Optional, Set, Callable
from dataclasses import dataclass, field
from enum import Enum, auto
from datetime import datetime
from ..inventory.item import Item

class QuestType(Enum):
    MAIN = auto()        # Quest principal da história
    SIDE = auto()        # Quest secundária
    DAILY = auto()       # Quest diária
    REPEATABLE = auto()  # Quest repetível
    EVENT = auto()       # Quest de evento especial

class QuestStatus(Enum):
    UNAVAILABLE = auto()  # Quest não disponível
    AVAILABLE = auto()    # Quest disponível para aceitar
    ACTIVE = auto()       # Quest em andamento
    COMPLETED = auto()    # Quest concluída
    FAILED = auto()       # Quest falhou
    EXPIRED = auto()      # Quest expirou

class ObjectiveType(Enum):
    KILL = auto()         # Derrotar inimigos
    COLLECT = auto()      # Coletar itens
    DELIVER = auto()      # Entregar itens
    TALK = auto()         # Conversar com NPC
    EXPLORE = auto()      # Explorar área
    PROTECT = auto()      # Proteger alvo
    ESCORT = auto()       # Escoltar NPC
    CRAFT = auto()        # Criar item
    USE_ABILITY = auto()  # Usar habilidade
    CUSTOM = auto()       # Objetivo personalizado

@dataclass
class QuestObjective:
    """Objetivo de uma quest."""
    description: str
    objective_type: ObjectiveType
    required_amount: int = 1
    current_amount: int = 0
    target_ids: List[str] = field(default_factory=list)  # IDs de alvos específicos
    is_optional: bool = False
    is_hidden: bool = False
    completion_trigger: Optional[Callable] = None
    
    @property
    def is_completed(self) -> bool:
        return self.current_amount >= self.required_amount

@dataclass
class QuestReward:
    """Recompensa de uma quest."""
    experience: int = 0
    gold: int = 0
    items: Dict[Item, int] = field(default_factory=dict)  # Item e quantidade
    reputation: Dict[str, int] = field(default_factory=dict)  # Facção e valor
    custom_rewards: List[str] = field(default_factory=list)

@dataclass
class QuestPrerequisite:
    """Pré-requisitos para uma quest."""
    min_level: int = 1
    required_quests: List[str] = field(default_factory=list)
    required_reputation: Dict[str, int] = field(default_factory=dict)
    required_items: Dict[Item, int] = field(default_factory=dict)
    custom_requirements: List[str] = field(default_factory=list)

@dataclass
class Quest:
    """Representa uma quest."""
    id: str
    title: str
    description: str
    quest_type: QuestType
    objectives: List[QuestObjective]
    rewards: QuestReward
    prerequisites: QuestPrerequisite
    status: QuestStatus = QuestStatus.UNAVAILABLE
    level: int = 1
    time_limit: Optional[int] = None  # Em minutos
    start_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    is_tracked: bool = False
    is_repeatable: bool = False
    cooldown: Optional[int] = None  # Em minutos
    last_completion: Optional[datetime] = None
    tags: List[str] = field(default_factory=list)

@dataclass
class QuestSystem:
    """Sistema de gerenciamento de quests."""
    quests: Dict[str, Quest] = field(default_factory=dict)
    active_quests: Dict[str, Quest] = field(default_factory=dict)
    completed_quests: Dict[str, Quest] = field(default_factory=dict)
    failed_quests: Dict[str, Quest] = field(default_factory=dict)
    quest_history: List[Quest] = field(default_factory=list)
    
    def __post_init__(self):
        self._initialize_default_quests()
    
    def _initialize_default_quests(self):
        """Inicializa quests padrão."""
        # Quest principal de exemplo
        self.register_quest(
            "main_01",
            "O Início da Jornada",
            "Descubra o mistério por trás dos desaparecimentos na cidade.",
            QuestType.MAIN,
            [
                QuestObjective(
                    "Fale com o guarda da cidade",
                    ObjectiveType.TALK,
                    target_ids=["guard_01"]
                ),
                QuestObjective(
                    "Investigue a taverna",
                    ObjectiveType.EXPLORE,
                    target_ids=["tavern_01"]
                ),
                QuestObjective(
                    "Colete pistas",
                    ObjectiveType.COLLECT,
                    required_amount=3,
                    target_ids=["clue_01", "clue_02", "clue_03"]
                )
            ],
            QuestReward(
                experience=100,
                gold=50,
                items={"anel_investigador": 1},
                reputation={"guarda_cidade": 10}
            ),
            QuestPrerequisite(min_level=1)
        )
        
        # Quest secundária de exemplo
        self.register_quest(
            "side_01",
            "Ervas Medicinais",
            "Colete ervas medicinais para o curandeiro local.",
            QuestType.SIDE,
            [
                QuestObjective(
                    "Colete ervas medicinais",
                    ObjectiveType.COLLECT,
                    required_amount=5,
                    target_ids=["herb_01"]
                ),
                QuestObjective(
                    "Entregue as ervas ao curandeiro",
                    ObjectiveType.DELIVER,
                    target_ids=["healer_01"]
                )
            ],
            QuestReward(
                experience=50,
                gold=25,
                items={"poção_cura": 2}
            ),
            QuestPrerequisite()
        )
    
    def register_quest(self, quest_id: str, title: str, description: str,
                       quest_type: QuestType, objectives: List[QuestObjective],
                       rewards: QuestReward, prerequisites: QuestPrerequisite,
                       level: int = 1, time_limit: Optional[int] = None,
                       is_repeatable: bool = False,
                       cooldown: Optional[int] = None) -> None:
        """Registra uma nova quest."""
        quest = Quest(
            id=quest_id,
            title=title,
            description=description,
            quest_type=quest_type,
            objectives=objectives,
            rewards=rewards,
            prerequisites=prerequisites,
            level=level,
            time_limit=time_limit,
            is_repeatable=is_repeatable,
            cooldown=cooldown
        )
        self.quests[quest_id] = quest
    
    def check_prerequisites(self, quest_id: str,
                           character_level: int,
                           completed_quests: Set[str],
                           reputation: Dict[str, int],
                           inventory: Dict[Item, int]) -> bool:
        """Verifica se os pré-requisitos de uma quest foram atendidos."""
        if quest_id not in self.quests:
            return False
        
        quest = self.quests[quest_id]
        prereq = quest.prerequisites
        
        # Verifica nível
        if character_level < prereq.min_level:
            return False
        
        # Verifica quests completadas
        if not all(q in completed_quests for q in prereq.required_quests):
            return False
        
        # Verifica reputação
        for faction, required_rep in prereq.required_reputation.items():
            if faction not in reputation or reputation[faction] < required_rep:
                return False
        
        # Verifica itens
        for item, required_amount in prereq.required_items.items():
            if item not in inventory or inventory[item] < required_amount:
                return False
        
        return True
    
    def accept_quest(self, quest_id: str) -> bool:
        """Aceita uma quest disponível."""
        if quest_id not in self.quests:
            return False
        
        quest = self.quests[quest_id]
        if quest.status != QuestStatus.AVAILABLE:
            return False
        
        quest.status = QuestStatus.ACTIVE
        quest.start_time = datetime.now()
        self.active_quests[quest_id] = quest
        
        return True
    
    def update_objective(self, quest_id: str, objective_index: int,
                         progress: int = 1) -> bool:
        """Atualiza o progresso de um objetivo."""
        if quest_id not in self.active_quests:
            return False
        
        quest = self.active_quests[quest_id]
        if objective_index >= len(quest.objectives):
            return False
        
        objective = quest.objectives[objective_index]
        objective.current_amount += progress
        
        # Verifica conclusão do objetivo
        if objective.completion_trigger and objective.is_completed:
            objective.completion_trigger()
        
        # Verifica conclusão da quest
        if self.check_quest_completion(quest_id):
            self.complete_quest(quest_id)
        
        return True
    
    def check_quest_completion(self, quest_id: str) -> bool:
        """Verifica se todos os objetivos obrigatórios foram concluídos."""
        if quest_id not in self.active_quests:
            return False
        
        quest = self.active_quests[quest_id]
        return all(obj.is_completed or obj.is_optional
                  for obj in quest.objectives)
    
    def complete_quest(self, quest_id: str) -> bool:
        """Completa uma quest e concede recompensas."""
        if quest_id not in self.active_quests:
            return False
        
        quest = self.active_quests[quest_id]
        quest.status = QuestStatus.COMPLETED
        quest.completion_time = datetime.now()
        quest.last_completion = datetime.now()
        
        # Move para quests completadas
        del self.active_quests[quest_id]
        self.completed_quests[quest_id] = quest
        self.quest_history.append(quest)
        
        # Se for repetível, reseta para disponível após cooldown
        if quest.is_repeatable and quest.cooldown:
            self.schedule_quest_reset(quest_id, quest.cooldown)
        
        return True
    
    def fail_quest(self, quest_id: str) -> bool:
        """Marca uma quest como falha."""
        if quest_id not in self.active_quests:
            return False
        
        quest = self.active_quests[quest_id]
        quest.status = QuestStatus.FAILED
        
        # Move para quests falhas
        del self.active_quests[quest_id]
        self.failed_quests[quest_id] = quest
        self.quest_history.append(quest)
        
        return True
    
    def abandon_quest(self, quest_id: str) -> bool:
        """Abandona uma quest ativa."""
        if quest_id not in self.active_quests:
            return False
        
        quest = self.active_quests[quest_id]
        quest.status = QuestStatus.AVAILABLE
        
        # Remove dos ativos e reseta progresso
        del self.active_quests[quest_id]
        for objective in quest.objectives:
            objective.current_amount = 0
        
        return True
    
    def get_available_quests(self, character_level: int,
                            completed_quests: Set[str],
                            reputation: Dict[str, int],
                            inventory: Dict[Item, int]) -> List[Quest]:
        """Retorna todas as quests disponíveis para o personagem."""
        available = []
        for quest_id, quest in self.quests.items():
            if quest.status == QuestStatus.AVAILABLE and \
               self.check_prerequisites(quest_id, character_level,
                                      completed_quests, reputation,
                                      inventory):
                available.append(quest)
        return available
    
    def get_tracked_quests(self) -> List[Quest]:
        """Retorna lista de quests sendo rastreadas."""
        return [quest for quest in self.active_quests.values()
                if quest.is_tracked]
    
    def toggle_quest_tracking(self, quest_id: str) -> bool:
        """Alterna o rastreamento de uma quest."""
        if quest_id not in self.active_quests:
            return False
        
        quest = self.active_quests[quest_id]
        quest.is_tracked = not quest.is_tracked
        return True
    
    def get_quest_progress(self, quest_id: str) -> Optional[Dict[str, float]]:
        """Retorna o progresso percentual de cada objetivo da quest."""
        if quest_id not in self.active_quests:
            return None
        
        quest = self.active_quests[quest_id]
        progress = {}
        for i, objective in enumerate(quest.objectives):
            if objective.required_amount > 0:
                percentage = (objective.current_amount / objective.required_amount) * 100
            else:
                percentage = 100 if objective.is_completed else 0
            progress[f"objective_{i}"] = percentage
        
        return progress
    
    def get_quest_history_by_type(self, quest_type: QuestType) -> List[Quest]:
        """Retorna histórico de quests de um tipo específico."""
        return [quest for quest in self.quest_history
                if quest.quest_type == quest_type]
    
    def schedule_quest_reset(self, quest_id: str, delay_minutes: int) -> None:
        """Agenda o reset de uma quest repetível."""
        if quest_id in self.completed_quests:
            quest = self.completed_quests[quest_id]
            quest.status = QuestStatus.AVAILABLE
            for objective in quest.objectives:
                objective.current_amount = 0
    
    def export_to_markdown(self) -> str:
        """Exporta todas as quests em formato markdown."""
        output = ["# Registro de Quests\n\n"]
        
        # Organiza por tipo
        quests_by_type = {}
        for quest in self.quests.values():
            if quest.quest_type not in quests_by_type:
                quests_by_type[quest.quest_type] = []
            quests_by_type[quest.quest_type].append(quest)
        
        # Gera saída organizada
        for quest_type in QuestType:
            if quest_type in quests_by_type:
                output.append(f"## {quest_type.name}\n\n")
                for quest in quests_by_type[quest_type]:
                    output.extend([
                        f"### {quest.title}\n\n",
                        f"*{quest.description}*\n\n",
                        f"**Nível:** {quest.level}\n\n"
                    ])
                    
                    # Objetivos
                    output.append("**Objetivos:**\n")
                    for obj in quest.objectives:
                        status = "(Opcional)" if obj.is_optional else ""
                        output.append(f"- {obj.description} {status}\n")
                    output.append("\n")
                    
                    # Recompensas
                    output.append("**Recompensas:**\n")
                    rewards = quest.rewards
                    if rewards.experience:
                        output.append(f"- Experiência: {rewards.experience}\n")
                    if rewards.gold:
                        output.append(f"- Ouro: {rewards.gold}\n")
                    if rewards.items:
                        output.append("- Itens:\n")
                        for item, amount in rewards.items.items():
                            output.append(f"  - {item}: {amount}\n")
                    if rewards.reputation:
                        output.append("- Reputação:\n")
                        for faction, value in rewards.reputation.items():
                            output.append(f"  - {faction}: {value:+d}\n")
                    output.append("\n")
        
        return "".join(output)