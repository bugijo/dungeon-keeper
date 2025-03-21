from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto

class NoteType(Enum):
    MASTER = auto()      # Notas privadas do mestre
    PLAYER = auto()      # Notas de jogador
    PARTY = auto()       # Notas compartilhadas do grupo
    QUEST = auto()       # Notas de missões
    LOCATION = auto()    # Notas sobre lugares
    NPC = auto()         # Notas sobre NPCs
    LORE = auto()        # Notas sobre história do mundo
    SESSION = auto()     # Resumo de sessão

@dataclass
class Note:
    """Representa uma nota no jogo."""
    title: str
    content: str
    note_type: NoteType
    author: str
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    tags: List[str] = field(default_factory=list)
    related_notes: List[str] = field(default_factory=list)  # IDs de notas relacionadas
    is_private: bool = False
    
    def update_content(self, new_content: str) -> None:
        """Atualiza o conteúdo da nota."""
        self.content = new_content
        self.updated_at = datetime.now()
    
    def add_tag(self, tag: str) -> None:
        """Adiciona uma tag à nota."""
        if tag not in self.tags:
            self.tags.append(tag)
    
    def remove_tag(self, tag: str) -> None:
        """Remove uma tag da nota."""
        if tag in self.tags:
            self.tags.remove(tag)
    
    def add_related_note(self, note_id: str) -> None:
        """Adiciona uma referência a outra nota."""
        if note_id not in self.related_notes:
            self.related_notes.append(note_id)
    
    def remove_related_note(self, note_id: str) -> None:
        """Remove uma referência a outra nota."""
        if note_id in self.related_notes:
            self.related_notes.remove(note_id)

@dataclass
class NotebookSection:
    """Representa uma seção do caderno."""
    name: str
    description: str
    notes: Dict[str, Note] = field(default_factory=dict)
    subsections: Dict[str, 'NotebookSection'] = field(default_factory=dict)
    
    def add_note(self, note_id: str, note: Note) -> None:
        """Adiciona uma nota à seção."""
        self.notes[note_id] = note
    
    def remove_note(self, note_id: str) -> Optional[Note]:
        """Remove uma nota da seção."""
        return self.notes.pop(note_id, None)
    
    def add_subsection(self, name: str, description: str) -> None:
        """Adiciona uma subseção."""
        if name not in self.subsections:
            self.subsections[name] = NotebookSection(name, description)
    
    def remove_subsection(self, name: str) -> Optional['NotebookSection']:
        """Remove uma subseção."""
        return self.subsections.pop(name, None)
    
    def get_notes_by_type(self, note_type: NoteType) -> List[Note]:
        """Retorna todas as notas de um tipo específico."""
        return [note for note in self.notes.values() if note.note_type == note_type]
    
    def get_notes_by_tag(self, tag: str) -> List[Note]:
        """Retorna todas as notas com uma tag específica."""
        return [note for note in self.notes.values() if tag in note.tags]
    
    def search_notes(self, query: str) -> List[Note]:
        """Busca notas por texto."""
        query = query.lower()
        return [
            note for note in self.notes.values()
            if query in note.title.lower() or query in note.content.lower()
        ]

@dataclass
class CampaignNotebook:
    """Gerencia todas as notas da campanha."""
    sections: Dict[str, NotebookSection] = field(default_factory=dict)
    
    def __post_init__(self):
        # Cria seções padrão
        default_sections = {
            "master": "Notas privadas do mestre",
            "players": "Notas dos jogadores",
            "quests": "Registro de missões",
            "locations": "Informações sobre lugares",
            "npcs": "Informações sobre personagens",
            "lore": "História do mundo",
            "sessions": "Resumos de sessão"
        }
        
        for name, description in default_sections.items():
            self.add_section(name, description)
    
    def add_section(self, name: str, description: str) -> None:
        """Adiciona uma nova seção ao caderno."""
        if name not in self.sections:
            self.sections[name] = NotebookSection(name, description)
    
    def remove_section(self, name: str) -> Optional[NotebookSection]:
        """Remove uma seção do caderno."""
        return self.sections.pop(name, None)
    
    def add_note(self, section: str, note_id: str, note: Note) -> bool:
        """Adiciona uma nota a uma seção."""
        if section in self.sections:
            self.sections[section].add_note(note_id, note)
            return True
        return False
    
    def get_note(self, section: str, note_id: str) -> Optional[Note]:
        """Recupera uma nota específica."""
        if section in self.sections:
            return self.sections[section].notes.get(note_id)
        return None
    
    def update_note(self, section: str, note_id: str, new_content: str) -> bool:
        """Atualiza o conteúdo de uma nota."""
        note = self.get_note(section, note_id)
        if note:
            note.update_content(new_content)
            return True
        return False
    
    def search_all_notes(self, query: str) -> Dict[str, List[Note]]:
        """Busca notas em todas as seções."""
        results = {}
        for section_name, section in self.sections.items():
            found_notes = section.search_notes(query)
            if found_notes:
                results[section_name] = found_notes
        return results
    
    def get_recent_notes(self, limit: int = 10) -> List[tuple[str, Note]]:
        """Retorna as notas mais recentes."""
        all_notes = [
            (section_name, note)
            for section_name, section in self.sections.items()
            for note in section.notes.values()
        ]
        
        return sorted(
            all_notes,
            key=lambda x: x[1].updated_at,
            reverse=True
        )[:limit]
    
    def export_section(self, section: str, format: str = "markdown") -> str:
        """Exporta uma seção em um formato específico."""
        if section not in self.sections:
            return ""
            
        if format == "markdown":
            return self._export_markdown(self.sections[section])
        # Adicionar outros formatos conforme necessário
        return ""
    
    def _export_markdown(self, section: NotebookSection) -> str:
        """Exporta uma seção em formato markdown."""
        output = [f"# {section.name}\n", f"{section.description}\n\n"]
        
        # Exporta notas
        for note in sorted(section.notes.values(), key=lambda x: x.created_at):
            output.extend([
                f"## {note.title}\n",
                f"*{note.author} - {note.created_at.strftime('%Y-%m-%d %H:%M')}*\n\n",
                f"{note.content}\n\n",
                "Tags: " + ", ".join(note.tags) + "\n\n" if note.tags else "\n"
            ])
        
        # Exporta subseções recursivamente
        for subsection in section.subsections.values():
            output.append(self._export_markdown(subsection))
        
        return "".join(output)