import pytest
from src.systems.combat.initiative import Initiative
from src.systems.character.character import Character

@pytest.fixture
def mock_character():
    return Character(name="Test Character", stats={"dexterity": 14})

@pytest.fixture
def initiative():
    return Initiative()

def test_roll_initiative(initiative, mock_character):
    participants = [mock_character]
    initiative.roll_initiative(participants)
    assert len(initiative.order) == 1
    assert mock_character in initiative.order
    assert 1 <= initiative.order[mock_character] <= 20

def test_get_current_character(initiative, mock_character):
    participants = [mock_character]
    initiative.roll_initiative(participants)
    current = initiative.get_current_character()
    assert current == mock_character

def test_next_turn(initiative, mock_character):
    participants = [mock_character]
    initiative.roll_initiative(participants)
    next_char = initiative.next_turn()
    assert next_char == mock_character
    assert initiative.current_index == 0

def test_add_participant(initiative, mock_character):
    initiative.add_participant(mock_character)
    assert mock_character in initiative.order
    assert 1 <= initiative.order[mock_character] <= 20

def test_remove_participant(initiative, mock_character):
    initiative.add_participant(mock_character)
    initiative.remove_participant(mock_character)
    assert mock_character not in initiative.order