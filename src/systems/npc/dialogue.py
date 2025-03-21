from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum, auto

class DialogueType(Enum):
    NORMAL = auto()
    QUEST = auto()
    SHOP = auto()
    TRAINING = auto()
    GOSSIP = auto()
    LORE = auto()

class DialogueEmotion(Enum):
    NEUTRAL = auto()
    HAPPY = auto()
    SAD = auto()
    ANGRY = auto()
    AFRAID = auto()
    SURPRISED = auto()

@dataclass
class DialogueCondition:
    """Condição para uma opção de diálogo estar disponível."""
    type: str  # quest_flag, level, reputation, item, gold, etc.
    value: Any
    operator: str = "=="  # ==, !=, >, <, >=, <=
    
    def check(self, player: Any) -> bool:
        """Verifica se a condição é atendida."""
        if self.type == "quest_flag":
            return self._compare(player.has_quest_flag(self.value))
        elif self.type == "level":
            return self._compare(player.level)
        elif self.type == "reputation":
            faction, value = self.value
            return self._compare(player.get_reputation(faction), value)
        elif self.type == "item":
            item_name, quantity = self.value
            return self._compare(player.inventory.get_item_quantity(item_name), quantity)
        elif self.type == "gold":
            return self._compare(player.inventory.gold, self.value)
        elif self.type == "skill":
            skill, level = self.value
            return self._compare(player.get_skill_level(skill), level)
        return False
    
    def _compare(self, value1: Any, value2: Any = None) -> bool:
        """Compara valores usando o operador especificado."""
        if value2 is None:
            value2 = self.value
            
        if self.operator == "==":
            return value1 == value2
        elif self.operator == "!=":
            return value1 != value2
        elif self.operator == ">":
            return value1 > value2
        elif self.operator == "<":
            return value1 < value2
        elif self.operator == ">=":
            return value1 >= value2
        elif self.operator == "<=":
            return value1 <= value2
        return False

@dataclass
class DialogueAction:
    """Ação a ser executada quando uma opção de diálogo é escolhida."""
    type: str  # give_quest, complete_quest, give_item, take_item, modify_reputation, etc.
    value: Any
    
    def execute(self, player: Any, npc: Any) -> bool:
        """Executa a ação."""
        if self.type == "give_quest":
            return player.add_quest(self.value)
        elif self.type == "complete_quest":
            return player.complete_quest(self.value)
        elif self.type == "give_item":
            item_name, quantity = self.value
            return npc.give_item(player, item_name, quantity)
        elif self.type == "take_item":
            item_name, quantity = self.value
            return player.inventory.remove_item_by_name(item_name, quantity)
        elif self.type == "modify_reputation":
            faction, amount = self.value
            player.modify_reputation(faction, amount)
            return True
        elif self.type == "give_gold":
            player.inventory.add_gold(self.value)
            return True
        elif self.type == "take_gold":
            return player.inventory.remove_gold(self.value)
        elif self.type == "set_quest_flag":
            player.add_quest_flag(self.value)
            return True
        elif self.type == "teach_skill":
            skill, level = self.value
            return player.learn_skill(skill, level)
        return False

@dataclass
class DialogueOption:
    """Opção de resposta em um diálogo."""
    text: str
    next_node: str
    conditions: List[DialogueCondition] = field(default_factory=list)
    actions: List[DialogueAction] = field(default_factory=list)
    emotion: DialogueEmotion = DialogueEmotion.NEUTRAL
    
    def is_available(self, player: Any) -> bool:
        """Verifica se a opção está disponível."""
        return all(condition.check(player) for condition in self.conditions)
    
    def select(self, player: Any, npc: Any) -> bool:
        """Executa as ações da opção."""
        return all(action.execute(player, npc) for action in self.actions)

@dataclass
class DialogueNode:
    """Nó de diálogo contendo texto e opções."""
    text: str
    options: List[DialogueOption]
    type: DialogueType = DialogueType.NORMAL
    emotion: DialogueEmotion = DialogueEmotion.NEUTRAL
    conditions: List[DialogueCondition] = field(default_factory=list)
    actions: List[DialogueAction] = field(default_factory=list)
    
    def is_available(self, player: Any) -> bool:
        """Verifica se o nó está disponível."""
        return all(condition.check(player) for condition in self.conditions)
    
    def get_available_options(self, player: Any) -> List[DialogueOption]:
        """Retorna todas as opções disponíveis."""
        return [option for option in self.options if option.is_available(player)]
    
    def enter(self, player: Any, npc: Any) -> None:
        """Executa as ações ao entrar no nó."""
        for action in self.actions:
            action.execute(player, npc)

@dataclass
class DialogueTree:
    """Estrutura completa de um diálogo."""
    nodes: Dict[str, DialogueNode]
    start_node: str
    current_node: Optional[str] = None
    
    def start(self, player: Any, npc: Any) -> bool:
        """Inicia o diálogo."""
        if self.start_node in self.nodes and \
           self.nodes[self.start_node].is_available(player):
            self.current_node = self.start_node
            self.nodes[self.start_node].enter(player, npc)
            return True
        return False
    
    def select_option(self, option_index: int, player: Any, npc: Any) -> bool:
        """Seleciona uma opção do nó atual."""
        if not self.current_node:
            return False
            
        current = self.nodes[self.current_node]
        available_options = current.get_available_options(player)
        
        if 0 <= option_index < len(available_options):
            option = available_options[option_index]
            if option.select(player, npc):
                if option.next_node in self.nodes:
                    self.current_node = option.next_node
                    self.nodes[self.current_node].enter(player, npc)
                    return True
        return False
    
    def get_current_text(self) -> Optional[str]:
        """Retorna o texto do nó atual."""
        if self.current_node and self.current_node in self.nodes:
            return self.nodes[self.current_node].text
        return None
    
    def get_current_options(self, player: Any) -> List[str]:
        """Retorna os textos das opções disponíveis."""
        if self.current_node and self.current_node in self.nodes:
            options = self.nodes[self.current_node].get_available_options(player)
            return [option.text for option in options]
        return []
    
    def is_ended(self) -> bool:
        """Verifica se o diálogo terminou."""
        return self.current_node is None or \
               not self.nodes[self.current_node].options

@dataclass
class DialogueManager:
    """Gerencia todos os diálogos do jogo."""
    dialogues: Dict[str, DialogueTree] = field(default_factory=dict)
    active_dialogue: Optional[str] = None
    
    def add_dialogue(self, dialogue_id: str, dialogue: DialogueTree) -> None:
        """Adiciona um novo diálogo ao gerenciador."""
        self.dialogues[dialogue_id] = dialogue
    
    def start_dialogue(self, dialogue_id: str, player: Any, npc: Any) -> bool:
        """Inicia um diálogo específico."""
        if dialogue_id in self.dialogues:
            if self.dialogues[dialogue_id].start(player, npc):
                self.active_dialogue = dialogue_id
                return True
        return False
    
    def select_option(self, option_index: int, player: Any, npc: Any) -> bool:
        """Seleciona uma opção no diálogo atual."""
        if self.active_dialogue and self.active_dialogue in self.dialogues:
            return self.dialogues[self.active_dialogue].select_option(
                option_index, player, npc
            )
        return False
    
    def get_current_text(self) -> Optional[str]:
        """Retorna o texto atual do diálogo ativo."""
        if self.active_dialogue and self.active_dialogue in self.dialogues:
            return self.dialogues[self.active_dialogue].get_current_text()
        return None
    
    def get_current_options(self, player: Any) -> List[str]:
        """Retorna as opções atuais do diálogo ativo."""
        if self.active_dialogue and self.active_dialogue in self.dialogues:
            return self.dialogues[self.active_dialogue].get_current_options(player)
        return []
    
    def end_dialogue(self) -> None:
        """Encerra o diálogo atual."""
        self.active_dialogue = None
    
    def is_in_dialogue(self) -> bool:
        """Verifica se há um diálogo ativo."""
        return self.active_dialogue is not None