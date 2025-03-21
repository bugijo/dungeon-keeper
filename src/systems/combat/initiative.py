from typing import List, Dict
from ..character.character import Character
import random

class Initiative:
    def __init__(self):
        self.order: Dict[Character, int] = {}
        self.current_index: int = 0
        
    def roll_initiative(self, participants: List[Character]) -> None:
        """Rola iniciativa para todos os participantes."""
        self.order.clear()
        for participant in participants:
            # Base da iniciativa: modificador de destreza + d20
            initiative_roll = random.randint(1, 20)
            self.order[participant] = initiative_roll
            
        # Ordena os participantes pela iniciativa
        self.order = dict(sorted(self.order.items(), key=lambda x: x[1], reverse=True))
        self.current_index = 0
        
    def get_current_character(self) -> Character:
        """Retorna o personagem atual na ordem de iniciativa."""
        if not self.order:
            return None
        return list(self.order.keys())[self.current_index]
        
    def next_turn(self) -> Character:
        """Avança para o próximo personagem na ordem de iniciativa."""
        if not self.order:
            return None
        self.current_index = (self.current_index + 1) % len(self.order)
        return self.get_current_character()
        
    def get_initiative_order(self) -> List[Character]:
        """Retorna a lista de personagens na ordem de iniciativa."""
        return list(self.order.keys())
        
    def add_participant(self, character: Character) -> None:
        """Adiciona um novo participante ao combate."""
        if character not in self.order:
            initiative_roll = random.randint(1, 20)
            self.order[character] = initiative_roll
            # Reordena a lista
            self.order = dict(sorted(self.order.items(), key=lambda x: x[1], reverse=True))
            
    def remove_participant(self, character: Character) -> None:
        """Remove um participante do combate."""
        if character in self.order:
            del self.order[character]
            # Ajusta o índice atual se necessário
            if self.current_index >= len(self.order):
                self.current_index = 0