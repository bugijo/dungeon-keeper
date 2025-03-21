from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum, auto

class NPCType(Enum):
    MERCHANT = auto()
    QUEST_GIVER = auto()
    TRAINER = auto()
    GUARD = auto()
    CIVILIAN = auto()
    ENEMY = auto()
    BOSS = auto()

class NPCState(Enum):
    IDLE = auto()
    WALKING = auto()
    TALKING = auto()
    WORKING = auto()
    FIGHTING = auto()
    FLEEING = auto()
    DEAD = auto()

class NPCAttitude(Enum):
    FRIENDLY = auto()
    NEUTRAL = auto()
    SUSPICIOUS = auto()
    HOSTILE = auto()

@dataclass
class NPCStats:
    """Estatísticas básicas de um NPC."""
    level: int = 1
    health: int = 100
    max_health: int = 100
    mana: int = 0
    max_mana: int = 0
    strength: int = 10
    dexterity: int = 10
    intelligence: int = 10
    charisma: int = 10
    armor: int = 0
    magic_resist: int = 0
    movement_speed: float = 1.0

@dataclass
class NPCSchedule:
    """Representa a rotina diária de um NPC."""
    location: str
    start_time: int  # Hora do dia (0-23)
    end_time: int
    activity: str
    priority: int = 1

@dataclass
class NPCDialogue:
    """Representa uma opção de diálogo."""
    text: str
    responses: List[str]
    conditions: Dict[str, Any]
    actions: List[Callable[[Any], None]]
    next_dialogue: Optional[str] = None

@dataclass
class NPC:
    """Classe base para todos os NPCs do jogo."""
    name: str
    npc_type: NPCType
    level: int
    faction: str
    stats: NPCStats = field(default_factory=NPCStats)
    state: NPCState = NPCState.IDLE
    attitude: NPCAttitude = NPCAttitude.NEUTRAL
    position: tuple[float, float, float] = (0.0, 0.0, 0.0)
    rotation: float = 0.0
    schedule: List[NPCSchedule] = field(default_factory=list)
    dialogues: Dict[str, NPCDialogue] = field(default_factory=dict)
    inventory: Any = None  # Referência ao sistema de inventário
    current_dialogue: Optional[str] = None
    ai_behavior: Any = None  # Referência ao sistema de IA
    quest_flags: Dict[str, bool] = field(default_factory=dict)
    relationships: Dict[str, int] = field(default_factory=dict)
    skills: Dict[str, int] = field(default_factory=dict)
    daily_budget: int = 100
    current_task: Optional[str] = None
    
    def update(self, delta_time: float) -> None:
        """Atualiza o estado do NPC."""
        if self.state != NPCState.DEAD:
            self._update_schedule()
            self._update_behavior(delta_time)
            self._update_stats(delta_time)
    
    def interact(self, player: Any) -> bool:
        """Inicia uma interação com o jogador."""
        if self.state == NPCState.DEAD:
            return False
            
        # Verifica atitude em relação ao jogador
        if self.attitude == NPCAttitude.HOSTILE:
            self._initiate_combat(player)
            return True
            
        # Inicia diálogo se disponível
        if self.dialogues:
            self._start_dialogue(player)
            return True
            
        return False
    
    def take_damage(self, amount: int, damage_type: str) -> int:
        """Recebe dano e retorna o dano real causado."""
        if self.state == NPCState.DEAD:
            return 0
            
        # Aplica resistências
        if damage_type == "physical":
            amount = max(1, amount - self.stats.armor)
        elif damage_type == "magic":
            reduction = self.stats.magic_resist / 100
            amount = max(1, int(amount * (1 - reduction)))
        
        self.stats.health = max(0, self.stats.health - amount)
        
        if self.stats.health == 0:
            self._die()
        elif self.attitude != NPCAttitude.HOSTILE:
            self._become_hostile()
        
        return amount
    
    def heal(self, amount: int) -> int:
        """Recupera vida e retorna a quantidade real curada."""
        if self.state == NPCState.DEAD:
            return 0
            
        old_health = self.stats.health
        self.stats.health = min(self.stats.health + amount, self.stats.max_health)
        return self.stats.health - old_health
    
    def move_to(self, position: tuple[float, float, float], speed_multiplier: float = 1.0) -> None:
        """Move o NPC para uma nova posição."""
        if self.state not in [NPCState.DEAD, NPCState.TALKING]:
            self.state = NPCState.WALKING
            self.position = position  # Simplificado - na prática usaria pathfinding
    
    def say(self, text: str, duration: float = 3.0) -> None:
        """Faz o NPC dizer algo."""
        if self.state != NPCState.DEAD:
            # Aqui seria integrado com o sistema de UI/diálogo
            pass
    
    def give_item(self, player: Any, item: Any) -> bool:
        """Dá um item para o jogador."""
        if self.inventory and self.inventory.has_item(item):
            if player.inventory.can_add_item(item):
                self.inventory.remove_item(item)
                player.inventory.add_item(item)
                return True
        return False
    
    def modify_relationship(self, faction: str, amount: int) -> None:
        """Modifica o relacionamento com uma facção."""
        if faction not in self.relationships:
            self.relationships[faction] = 0
        self.relationships[faction] = max(-100, min(100, self.relationships[faction] + amount))
        
        # Atualiza atitude baseado no relacionamento
        self._update_attitude(faction)
    
    def add_quest_flag(self, flag: str) -> None:
        """Adiciona uma flag de quest ao NPC."""
        self.quest_flags[flag] = True
    
    def has_quest_flag(self, flag: str) -> bool:
        """Verifica se o NPC tem uma flag de quest."""
        return self.quest_flags.get(flag, False)
    
    def _update_schedule(self) -> None:
        """Atualiza o comportamento baseado na programação diária."""
        if not self.schedule:
            return
            
        current_hour = self._get_current_hour()
        
        for schedule in sorted(self.schedule, key=lambda x: x.priority, reverse=True):
            if schedule.start_time <= current_hour < schedule.end_time:
                if self.current_task != schedule.activity:
                    self.current_task = schedule.activity
                    self.move_to(self._get_location_position(schedule.location))
                break
    
    def _update_behavior(self, delta_time: float) -> None:
        """Atualiza o comportamento do NPC."""
        if self.ai_behavior:
            self.ai_behavior.update(self, delta_time)
    
    def _update_stats(self, delta_time: float) -> None:
        """Atualiza as estatísticas do NPC."""
        # Regeneração natural de vida e mana
        if self.stats.health < self.stats.max_health:
            self.stats.health = min(
                self.stats.health + 1,
                self.stats.max_health
            )
        
        if self.stats.mana < self.stats.max_mana:
            self.stats.mana = min(
                self.stats.mana + 1,
                self.stats.max_mana
            )
    
    def _start_dialogue(self, player: Any) -> None:
        """Inicia um diálogo com o jogador."""
        self.state = NPCState.TALKING
        self.current_dialogue = next(iter(self.dialogues))  # Pega o primeiro diálogo
        # Aqui seria integrado com o sistema de diálogo
    
    def _initiate_combat(self, target: Any) -> None:
        """Inicia combate com um alvo."""
        self.state = NPCState.FIGHTING
        # Aqui seria integrado com o sistema de combate
    
    def _die(self) -> None:
        """Processa a morte do NPC."""
        self.state = NPCState.DEAD
        # Aqui seria processado drop de itens, experiência, etc.
    
    def _become_hostile(self) -> None:
        """Torna o NPC hostil."""
        self.attitude = NPCAttitude.HOSTILE
        self.state = NPCState.FIGHTING
    
    def _update_attitude(self, faction: str) -> None:
        """Atualiza a atitude baseado no relacionamento."""
        relationship = self.relationships.get(faction, 0)
        
        if relationship >= 50:
            self.attitude = NPCAttitude.FRIENDLY
        elif relationship >= 0:
            self.attitude = NPCAttitude.NEUTRAL
        elif relationship >= -50:
            self.attitude = NPCAttitude.SUSPICIOUS
        else:
            self.attitude = NPCAttitude.HOSTILE
    
    def _get_current_hour(self) -> int:
        """Retorna a hora atual do dia (0-23)."""
        # Aqui seria integrado com o sistema de tempo do jogo
        return 0
    
    def _get_location_position(self, location: str) -> tuple[float, float, float]:
        """Retorna a posição de uma localização."""
        # Aqui seria integrado com o sistema de mapa
        return (0.0, 0.0, 0.0)