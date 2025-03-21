from typing import Dict, List, Optional, Set, Callable
from dataclasses import dataclass, field
from enum import Enum, auto
from datetime import datetime

class AchievementCategory(Enum):
    EXPLORATION = auto()   # Exploração do mundo
    COMBAT = auto()        # Combate e batalhas
    QUESTS = auto()        # Missões e história
    CRAFTING = auto()      # Criação de itens
    SOCIAL = auto()        # Interações sociais
    COLLECTION = auto()     # Coleção de itens
    PROGRESSION = auto()    # Progressão do personagem
    CHALLENGE = auto()      # Desafios especiais
    MASTERY = auto()        # Maestria em habilidades
    SECRET = auto()         # Conquistas secretas

class AchievementTier(Enum):
    BRONZE = auto()    # Conquistas básicas
    SILVER = auto()    # Conquistas intermediárias
    GOLD = auto()      # Conquistas avançadas
    PLATINUM = auto()  # Conquistas de mestre
    DIAMOND = auto()   # Conquistas lendárias

@dataclass
class AchievementReward:
    """Recompensa por completar uma conquista."""
    title: Optional[str] = None          # Título desbloqueado
    experience: int = 0                  # XP ganho
    gold: int = 0                        # Ouro ganho
    reputation: Dict[str, int] = field(default_factory=dict)  # Reputação com facções
    items: Dict[str, int] = field(default_factory=dict)      # Itens desbloqueados
    custom_rewards: List[str] = field(default_factory=list)  # Recompensas especiais

@dataclass
class AchievementProgress:
    """Progresso em uma conquista."""
    current_value: int = 0
    max_value: int = 1
    completed: bool = False
    completion_date: Optional[datetime] = None
    last_updated: datetime = field(default_factory=datetime.now)

@dataclass
class Achievement:
    """Representa uma conquista."""
    id: str
    name: str
    description: str
    category: AchievementCategory
    tier: AchievementTier
    points: int
    progress: AchievementProgress = field(default_factory=AchievementProgress)
    rewards: AchievementReward = field(default_factory=AchievementReward)
    hidden: bool = False
    parent_achievement: Optional[str] = None  # ID da conquista pai
    child_achievements: List[str] = field(default_factory=list)  # IDs das conquistas filhas
    tags: List[str] = field(default_factory=list)
    unlock_conditions: Dict[str, int] = field(default_factory=dict)
    on_complete: Optional[Callable] = None

@dataclass
class AchievementSystem:
    """Sistema de gerenciamento de conquistas."""
    achievements: Dict[str, Achievement] = field(default_factory=dict)
    total_points: int = 0
    points_by_category: Dict[AchievementCategory, int] = field(default_factory=dict)
    completed_achievements: Set[str] = field(default_factory=set)
    achievement_history: List[tuple] = field(default_factory=list)
    
    def __post_init__(self):
        self._initialize_default_achievements()
    
    def _initialize_default_achievements(self):
        """Inicializa conquistas padrão."""
        # Conquistas de Exploração
        self.register_achievement(
            "explorer_novice",
            "Explorador Iniciante",
            "Descubra 5 locais diferentes",
            AchievementCategory.EXPLORATION,
            AchievementTier.BRONZE,
            10,
            max_value=5,
            rewards=AchievementReward(experience=100)
        )
        
        self.register_achievement(
            "explorer_adept",
            "Explorador Experiente",
            "Descubra 25 locais diferentes",
            AchievementCategory.EXPLORATION,
            AchievementTier.SILVER,
            25,
            max_value=25,
            rewards=AchievementReward(experience=500),
            parent_achievement="explorer_novice"
        )
        
        # Conquistas de Combate
        self.register_achievement(
            "warrior_initiate",
            "Guerreiro Iniciante",
            "Derrote 10 inimigos",
            AchievementCategory.COMBAT,
            AchievementTier.BRONZE,
            10,
            max_value=10,
            rewards=AchievementReward(experience=100)
        )
        
        self.register_achievement(
            "warrior_veteran",
            "Guerreiro Veterano",
            "Derrote 100 inimigos",
            AchievementCategory.COMBAT,
            AchievementTier.SILVER,
            25,
            max_value=100,
            rewards=AchievementReward(experience=500),
            parent_achievement="warrior_initiate"
        )
    
    def register_achievement(self, achievement_id: str, name: str,
                            description: str, category: AchievementCategory,
                            tier: AchievementTier, points: int,
                            max_value: int = 1,
                            rewards: Optional[AchievementReward] = None,
                            hidden: bool = False,
                            parent_achievement: Optional[str] = None,
                            tags: List[str] = None) -> None:
        """Registra uma nova conquista."""
        achievement = Achievement(
            id=achievement_id,
            name=name,
            description=description,
            category=category,
            tier=tier,
            points=points,
            progress=AchievementProgress(max_value=max_value),
            rewards=rewards or AchievementReward(),
            hidden=hidden,
            parent_achievement=parent_achievement,
            tags=tags or []
        )
        
        self.achievements[achievement_id] = achievement
        
        # Atualiza relações pai/filho
        if parent_achievement and parent_achievement in self.achievements:
            self.achievements[parent_achievement].child_achievements.append(achievement_id)
    
    def update_progress(self, achievement_id: str, progress: int = 1) -> bool:
        """Atualiza o progresso de uma conquista."""
        if achievement_id not in self.achievements:
            return False
        
        achievement = self.achievements[achievement_id]
        
        # Verifica se já está completa
        if achievement.progress.completed:
            return False
        
        # Atualiza progresso
        achievement.progress.current_value += progress
        achievement.progress.last_updated = datetime.now()
        
        # Verifica conclusão
        if achievement.progress.current_value >= achievement.progress.max_value:
            self.complete_achievement(achievement_id)
        
        return True
    
    def complete_achievement(self, achievement_id: str) -> bool:
        """Completa uma conquista e concede recompensas."""
        if achievement_id not in self.achievements:
            return False
        
        achievement = self.achievements[achievement_id]
        
        # Verifica se já está completa
        if achievement.progress.completed:
            return False
        
        # Marca como completa
        achievement.progress.completed = True
        achievement.progress.completion_date = datetime.now()
        
        # Atualiza pontos
        self.total_points += achievement.points
        if achievement.category not in self.points_by_category:
            self.points_by_category[achievement.category] = 0
        self.points_by_category[achievement.category] += achievement.points
        
        # Adiciona ao conjunto de conquistas completas
        self.completed_achievements.add(achievement_id)
        
        # Registra no histórico
        self.achievement_history.append(
            (achievement_id, datetime.now())
        )
        
        # Executa callback de conclusão
        if achievement.on_complete:
            achievement.on_complete()
        
        return True
    
    def get_achievement_progress(self, achievement_id: str) -> Optional[float]:
        """Retorna o progresso percentual de uma conquista."""
        if achievement_id not in self.achievements:
            return None
        
        achievement = self.achievements[achievement_id]
        progress = achievement.progress
        
        if progress.max_value > 0:
            return (progress.current_value / progress.max_value) * 100
        return 0
    
    def get_achievements_by_category(self,
                                    category: AchievementCategory) -> List[Achievement]:
        """Retorna todas as conquistas de uma categoria."""
        return [achievement for achievement in self.achievements.values()
                if achievement.category == category]
    
    def get_achievements_by_tier(self,
                                tier: AchievementTier) -> List[Achievement]:
        """Retorna todas as conquistas de um tier."""
        return [achievement for achievement in self.achievements.values()
                if achievement.tier == tier]
    
    def get_completed_achievements(self) -> List[Achievement]:
        """Retorna todas as conquistas completas."""
        return [self.achievements[aid] for aid in self.completed_achievements]
    
    def get_available_achievements(self) -> List[Achievement]:
        """Retorna conquistas disponíveis para progresso."""
        available = []
        for achievement in self.achievements.values():
            if not achievement.progress.completed and \
               (not achievement.parent_achievement or \
                achievement.parent_achievement in self.completed_achievements):
                available.append(achievement)
        return available
    
    def get_next_tier_achievements(self,
                                  achievement_id: str) -> List[Achievement]:
        """Retorna conquistas do próximo tier relacionadas."""
        if achievement_id not in self.achievements:
            return []
        
        achievement = self.achievements[achievement_id]
        return [self.achievements[child_id]
                for child_id in achievement.child_achievements]
    
    def get_achievement_chain(self,
                             achievement_id: str) -> List[Achievement]:
        """Retorna a cadeia completa de conquistas relacionadas."""
        if achievement_id not in self.achievements:
            return []
        
        chain = []
        current = self.achievements[achievement_id]
        
        # Adiciona ancestrais
        while current.parent_achievement:
            parent_id = current.parent_achievement
            if parent_id in self.achievements:
                current = self.achievements[parent_id]
                chain.insert(0, current)
            else:
                break
        
        # Adiciona a conquista atual
        chain.append(self.achievements[achievement_id])
        
        # Adiciona descendentes
        current = self.achievements[achievement_id]
        to_process = current.child_achievements.copy()
        while to_process:
            child_id = to_process.pop(0)
            if child_id in self.achievements:
                child = self.achievements[child_id]
                chain.append(child)
                to_process.extend(child.child_achievements)
        
        return chain
    
    def get_achievement_stats(self) -> Dict[str, int]:
        """Retorna estatísticas gerais das conquistas."""
        stats = {
            "total_achievements": len(self.achievements),
            "completed_achievements": len(self.completed_achievements),
            "total_points": self.total_points
        }
        
        # Estatísticas por categoria
        for category in AchievementCategory:
            category_achievements = self.get_achievements_by_category(category)
            completed = len([a for a in category_achievements
                           if a.progress.completed])
            stats[f"{category.name.lower()}_total"] = len(category_achievements)
            stats[f"{category.name.lower()}_completed"] = completed
            stats[f"{category.name.lower()}_points"] = \
                self.points_by_category.get(category, 0)
        
        # Estatísticas por tier
        for tier in AchievementTier:
            tier_achievements = self.get_achievements_by_tier(tier)
            completed = len([a for a in tier_achievements
                           if a.progress.completed])
            stats[f"{tier.name.lower()}_total"] = len(tier_achievements)
            stats[f"{tier.name.lower()}_completed"] = completed
        
        return stats
    
    def export_to_markdown(self) -> str:
        """Exporta todas as conquistas em formato markdown."""
        output = ["# Conquistas\n\n"]
        
        # Estatísticas gerais
        stats = self.get_achievement_stats()
        output.extend([
            "## Estatísticas Gerais\n\n",
            f"Total de Conquistas: {stats['total_achievements']}\n",
            f"Conquistas Completadas: {stats['completed_achievements']}\n",
            f"Pontos Totais: {stats['total_points']}\n\n"
        ])
        
        # Organiza por categoria
        for category in AchievementCategory:
            achievements = self.get_achievements_by_category(category)
            if achievements:
                output.append(f"## {category.name}\n\n")
                
                # Organiza por tier dentro da categoria
                for tier in AchievementTier:
                    tier_achievements = [a for a in achievements
                                       if a.tier == tier]
                    if tier_achievements:
                        output.append(f"### {tier.name}\n\n")
                        for achievement in tier_achievements:
                            # Não mostra descrição de conquistas ocultas não completadas
                            if achievement.hidden and \
                               not achievement.progress.completed:
                                output.extend([
                                    f"#### ???\n\n",
                                    "*Conquista Oculta*\n\n"
                                ])
                            else:
                                output.extend([
                                    f"#### {achievement.name}\n\n",
                                    f"*{achievement.description}*\n\n",
                                    f"Pontos: {achievement.points}\n\n"
                                ])
                                
                                # Progresso
                                if achievement.progress.completed:
                                    output.append("**Completa!**\n\n")
                                else:
                                    progress = self.get_achievement_progress(
                                        achievement.id
                                    )
                                    output.append(
                                        f"Progresso: {progress:.1f}%\n\n"
                                    )
                                
                                # Recompensas
                                rewards = achievement.rewards
                                if any([rewards.experience, rewards.gold,
                                       rewards.reputation, rewards.items,
                                       rewards.title]):
                                    output.append("**Recompensas:**\n")
                                    if rewards.title:
                                        output.append(
                                            f"- Título: {rewards.title}\n"
                                        )
                                    if rewards.experience:
                                        output.append(
                                            f"- Experiência: {rewards.experience}\n"
                                        )
                                    if rewards.gold:
                                        output.append(
                                            f"- Ouro: {rewards.gold}\n"
                                        )
                                    if rewards.reputation:
                                        output.append("- Reputação:\n")
                                        for faction, value in rewards.reputation.items():
                                            output.append(
                                                f"  - {faction}: {value:+d}\n"
                                            )
                                    if rewards.items:
                                        output.append("- Itens:\n")
                                        for item, amount in rewards.items.items():
                                            output.append(
                                                f"  - {item}: {amount}\n"
                                            )
                                    output.append("\n")
        
        return "".join(output)