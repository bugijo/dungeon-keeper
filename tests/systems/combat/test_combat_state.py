import pytest
from src.systems.combat.combat_state import (
    CombatState,
    CombatPhase,
    CombatAction
)
from src.systems.character.character import Character

@pytest.fixture
def mock_characters():
    return [
        Character(name="Character 1", stats={"hp": 100}),
        Character(name="Character 2", stats={"hp": 100})
    ]

@pytest.fixture
def combat_state():
    return CombatState()

def test_start_combat(combat_state, mock_characters):
    combat_state.start_combat(mock_characters)
    assert combat_state.phase == CombatPhase.COMBAT
    assert combat_state.round_number == 1
    assert len(combat_state.participants) == 2

def test_end_combat(combat_state, mock_characters):
    combat_state.start_combat(mock_characters)
    combat_state.end_combat()
    assert combat_state.phase == CombatPhase.ENDED
    assert len(combat_state.participants) == 0
    assert len(combat_state.action_history) == 0

def test_next_turn(combat_state, mock_characters):
    combat_state.start_combat(mock_characters)
    current = combat_state.next_turn()
    assert current in mock_characters

def test_record_action(combat_state, mock_characters):
    action = CombatAction(
        actor=mock_characters[0],
        target=mock_characters[1],
        action_type="attack",
        damage_amount=10
    )
    combat_state.record_action(action)
    history = combat_state.get_action_history()
    assert len(history) == 1
    assert history[0] == action

def test_add_remove_participant(combat_state, mock_characters):
    new_character = Character(name="New Character", stats={"hp": 100})
    combat_state.start_combat(mock_characters)
    
    # Adiciona novo participante
    combat_state.add_participant(new_character)
    assert new_character in combat_state.participants
    
    # Remove participante
    combat_state.remove_participant(new_character)
    assert new_character not in combat_state.participants