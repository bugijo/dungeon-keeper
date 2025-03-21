from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum, auto
from datetime import datetime

class FactionType(Enum):
    KINGDOM = auto()      # Reinos e nações
    GUILD = auto()        # Guildas profissionais
    RELIGION = auto()     # Organizações religiosas
    CRIMINAL = auto()     # Organizações criminosas
    MERCHANT = auto()     # Grupos comerciais
    MILITARY = auto()     # Organizações militares
    ARCANE = auto()       # Grupos mágicos
    TRIBAL = auto()       # Tribos e clãs
    POLITICAL = auto()    # Facções políticas
    MONSTER = auto()      # Grupos de monstros

class RelationType(Enum):
    ALLIED = auto()       # Aliados
    FRIENDLY = auto()     # Amigáveis
    NEUTRAL = auto()      # Neutros
    UNFRIENDLY = auto()   # Hostis
    HOSTILE = auto()      # Inimigos

class ReputationRank(Enum):
    HATED = -3           # Odiado
    HOSTILE = -2         # Hostil
    UNFRIENDLY = -1      # Não amigável
    NEUTRAL = 0          # Neutro
    FRIENDLY = 1         # Amigável
    HONORED = 2          # Honrado
    EXALTED = 3          # Exaltado

@dataclass
class FactionBenefit:
    """Benefício concedido por uma facção."""
    name: str
    description: str
    required_rank: ReputationRank
    is_active: bool = True
    unlock_requirements: Dict[str, int] = field(default_factory=dict)

@dataclass
class FactionQuest:
    """Quest específica de uma facção."""
    quest_id: str
    required_rank: ReputationRank
    reputation_reward: int
    is_repeatable: bool = False

@dataclass
class Faction:
    """Representa uma facção."""
    id: str
    name: str
    description: str
    faction_type: FactionType
    leader: Optional[str] = None  # ID do NPC líer
    headquarters: Optional[str] = None  # ID da localização
    benefits: Dict[str, FactionBenefit] = field(default_factory=dict)
    quests: Dict[str, FactionQuest] = field(default_factory=dict)
    relations: Dict[str, RelationType] = field(default_factory=dict)
    enemies: Set[str] = field(default_factory=set)
    allies: Set[str] = field(default_factory=set)
    is_joinable: bool = True
    join_requirements: Dict[str, int] = field(default_factory=dict)
    rank_thresholds: Dict[ReputationRank, int] = field(default_factory=dict)

@dataclass
class FactionSystem:
    """Sistema de gerenciamento de facções."""
    factions: Dict[str, Faction] = field(default_factory=dict)
    player_reputation: Dict[str, int] = field(default_factory=dict)
    player_ranks: Dict[str, ReputationRank] = field(default_factory=dict)
    active_benefits: Dict[str, Set[str]] = field(default_factory=dict)
    reputation_history: List[Tuple[str, int, datetime]] = field(default_factory=list)
    
    def __post_init__(self):
        self._initialize_default_factions()
    
    def _initialize_default_factions(self):
        """Inicializa facções padrão."""
        # Guilda dos Mercadores
        self.register_faction(
            "merchants_guild",
            "Guilda dos Mercadores",
            "Uma poderosa organização que controla o comércio na região.",
            FactionType.MERCHANT,
            rank_thresholds={
                ReputationRank.HATED: -3000,
                ReputationRank.HOSTILE: -1000,
                ReputationRank.UNFRIENDLY: -100,
                ReputationRank.NEUTRAL: 0,
                ReputationRank.FRIENDLY: 1000,
                ReputationRank.HONORED: 3000,
                ReputationRank.EXALTED: 6000
            }
        )
        
        # Adiciona benefícios
        self.add_faction_benefit(
            "merchants_guild",
            "desconto_basico",
            "10% de desconto em todas as lojas da guilda",
            ReputationRank.FRIENDLY
        )
        
        self.add_faction_benefit(
            "merchants_guild",
            "acesso_mercado",
            "Acesso ao mercado exclusivo da guilda",
            ReputationRank.HONORED
        )
        
        # Ordem dos Magos
        self.register_faction(
            "mages_order",
            "Ordem dos Magos",
            "Uma antiga ordem dedicada ao estudo da magia.",
            FactionType.ARCANE,
            rank_thresholds={
                ReputationRank.HATED: -3000,
                ReputationRank.HOSTILE: -1000,
                ReputationRank.UNFRIENDLY: -100,
                ReputationRank.NEUTRAL: 0,
                ReputationRank.FRIENDLY: 1000,
                ReputationRank.HONORED: 3000,
                ReputationRank.EXALTED: 6000
            }
        )
        
        # Adiciona benefícios
        self.add_faction_benefit(
            "mages_order",
            "treino_magico",
            "Acesso a treinamento mágico básico",
            ReputationRank.FRIENDLY
        )
        
        self.add_faction_benefit(
            "mages_order",
            "grimorio_raro",
            "Acesso a grimórios raros",
            ReputationRank.HONORED
        )
    
    def register_faction(self, faction_id: str, name: str,
                        description: str, faction_type: FactionType,
                        leader: Optional[str] = None,
                        headquarters: Optional[str] = None,
                        is_joinable: bool = True,
                        rank_thresholds: Dict[ReputationRank, int] = None) -> None:
        """Registra uma nova facção."""
        faction = Faction(
            id=faction_id,
            name=name,
            description=description,
            faction_type=faction_type,
            leader=leader,
            headquarters=headquarters,
            is_joinable=is_joinable,
            rank_thresholds=rank_thresholds or {}
        )
        self.factions[faction_id] = faction
        self.player_reputation[faction_id] = 0
        self.player_ranks[faction_id] = ReputationRank.NEUTRAL
    
    def add_faction_benefit(self, faction_id: str, benefit_id: str,
                           description: str, required_rank: ReputationRank,
                           unlock_requirements: Dict[str, int] = None) -> bool:
        """Adiciona um benefício a uma facção."""
        if faction_id not in self.factions:
            return False
        
        benefit = FactionBenefit(
            name=benefit_id,
            description=description,
            required_rank=required_rank,
            unlock_requirements=unlock_requirements or {}
        )
        
        self.factions[faction_id].benefits[benefit_id] = benefit
        return True
    
    def add_faction_quest(self, faction_id: str, quest_id: str,
                         required_rank: ReputationRank,
                         reputation_reward: int,
                         is_repeatable: bool = False) -> bool:
        """Adiciona uma quest a uma facção."""
        if faction_id not in self.factions:
            return False
        
        quest = FactionQuest(
            quest_id=quest_id,
            required_rank=required_rank,
            reputation_reward=reputation_reward,
            is_repeatable=is_repeatable
        )
        
        self.factions[faction_id].quests[quest_id] = quest
        return True
    
    def set_faction_relation(self, faction_id: str,
                            other_faction_id: str,
                            relation: RelationType) -> bool:
        """Define a relação entre duas facções."""
        if faction_id not in self.factions or \
           other_faction_id not in self.factions:
            return False
        
        faction = self.factions[faction_id]
        other_faction = self.factions[other_faction_id]
        
        # Atualiza relações
        faction.relations[other_faction_id] = relation
        other_faction.relations[faction_id] = relation
        
        # Atualiza aliados/inimigos
        if relation == RelationType.ALLIED:
            faction.allies.add(other_faction_id)
            other_faction.allies.add(faction_id)
            faction.enemies.discard(other_faction_id)
            other_faction.enemies.discard(faction_id)
        elif relation == RelationType.HOSTILE:
            faction.enemies.add(other_faction_id)
            other_faction.enemies.add(faction_id)
            faction.allies.discard(other_faction_id)
            other_faction.allies.discard(faction_id)
        
        return True
    
    def modify_reputation(self, faction_id: str, amount: int) -> bool:
        """Modifica a reputação do jogador com uma facção."""
        if faction_id not in self.factions:
            return False
        
        # Atualiza reputação
        self.player_reputation[faction_id] += amount
        
        # Registra no histórico
        self.reputation_history.append(
            (faction_id, amount, datetime.now())
        )
        
        # Atualiza rank
        self._update_player_rank(faction_id)
        
        # Atualiza benefícios ativos
        self._update_active_benefits(faction_id)
        
        return True
    
    def _update_player_rank(self, faction_id: str) -> None:
        """Atualiza o rank do jogador com uma facção."""
        faction = self.factions[faction_id]
        reputation = self.player_reputation[faction_id]
        
        # Encontra o rank apropriado
        current_rank = ReputationRank.NEUTRAL
        for rank, threshold in faction.rank_thresholds.items():
            if reputation >= threshold:
                current_rank = rank
        
        self.player_ranks[faction_id] = current_rank
    
    def _update_active_benefits(self, faction_id: str) -> None:
        """Atualiza os benefícios ativos do jogador com uma facção."""
        if faction_id not in self.active_benefits:
            self.active_benefits[faction_id] = set()
        
        faction = self.factions[faction_id]
        current_rank = self.player_ranks[faction_id]
        
        # Remove benefícios inativos
        self.active_benefits[faction_id].clear()
        
        # Adiciona benefícios ativos
        for benefit_id, benefit in faction.benefits.items():
            if current_rank.value >= benefit.required_rank.value and \
               benefit.is_active:
                self.active_benefits[faction_id].add(benefit_id)
    
    def get_available_quests(self, faction_id: str) -> List[FactionQuest]:
        """Retorna quests disponíveis de uma facção."""
        if faction_id not in self.factions:
            return []
        
        faction = self.factions[faction_id]
        current_rank = self.player_ranks[faction_id]
        
        return [
            quest for quest in faction.quests.values()
            if current_rank.value >= quest.required_rank.value
        ]
    
    def get_active_benefits(self, faction_id: str) -> List[FactionBenefit]:
        """Retorna benefícios ativos de uma facção."""
        if faction_id not in self.factions or \
           faction_id not in self.active_benefits:
            return []
        
        faction = self.factions[faction_id]
        return [
            faction.benefits[benefit_id]
            for benefit_id in self.active_benefits[faction_id]
        ]
    
    def get_faction_relations(self, faction_id: str) -> Dict[str, RelationType]:
        """Retorna as relações de uma facção com outras."""
        if faction_id not in self.factions:
            return {}
        
        return self.factions[faction_id].relations.copy()
    
    def can_join_faction(self, faction_id: str,
                         player_stats: Dict[str, int]) -> bool:
        """Verifica se o jogador pode se juntar a uma facção."""
        if faction_id not in self.factions:
            return False
        
        faction = self.factions[faction_id]
        
        # Verifica se é possível entrar
        if not faction.is_joinable:
            return False
        
        # Verifica requisitos
        for stat, required_value in faction.join_requirements.items():
            if stat not in player_stats or \
               player_stats[stat] < required_value:
                return False
        
        return True
    
    def get_reputation_history(self, faction_id: str,
                              limit: Optional[int] = None) -> List[Tuple[int, datetime]]:
        """Retorna histórico de mudanças de reputação."""
        history = [
            (amount, timestamp)
            for fid, amount, timestamp in self.reputation_history
            if fid == faction_id
        ]
        
        if limit:
            return history[-limit:]
        return history
    
    def export_to_markdown(self) -> str:
        """Exporta todas as facções em formato markdown."""
        output = ["# Facções\n\n"]
        
        # Organiza por tipo
        factions_by_type = {}
        for faction in self.factions.values():
            if faction.faction_type not in factions_by_type:
                factions_by_type[faction.faction_type] = []
            factions_by_type[faction.faction_type].append(faction)
        
        # Gera saída organizada
        for faction_type in FactionType:
            if faction_type in factions_by_type:
                output.append(f"## {faction_type.name}\n\n")
                for faction in factions_by_type[faction_type]:
                    output.extend([
                        f"### {faction.name}\n\n",
                        f"*{faction.description}*\n\n"
                    ])
                    
                    if faction.leader:
                        output.append(f"**Líder:** {faction.leader}\n\n")
                    
                    if faction.headquarters:
                        output.append(f"**Sede:** {faction.headquarters}\n\n")
                    
                    # Benefícios
                    if faction.benefits:
                        output.append("**Benefícios:**\n")
                        for benefit in faction.benefits.values():
                            output.append(f"- {benefit.description} ")
                            output.append(f"(Rank: {benefit.required_rank.name})\n")
                        output.append("\n")
                    
                    # Relações
                    if faction.relations:
                        output.append("**Relações:**\n")
                        for other_id, relation in faction.relations.items():
                            other = self.factions[other_id]
                            output.append(f"- {other.name}: {relation.name}\n")
                        output.append("\n")
        
        return "".join(output)