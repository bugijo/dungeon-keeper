import pytest
from src.systems.combat.combat_round import (
    CombatRound,
    ActionType,
    ActionUsage
)
from src.systems.combat.combat_state import CombatState, CombatAction
from src.systems.character.character import Character

@pytest.fixture
def mock_character():
    return Character(name="Test Character", stats={"hp": 100})

@pytest.fixture
def combat_state():
    return CombatState()

@pytest.fixture
def combat_round(combat_state):
    return CombatRound(combat_state)

def test_start_round(combat_round):
    combat_round.start_round()
    assert combat_round.round_number == 1

def test_can_take_action(combat_round, mock_character):
    assert combat_round.can_take_action(mock_character, ActionType.STANDARD)
    assert combat_round.can_take_action(mock_character, ActionType.BONUS)
    assert combat_round.can_take_action(mock_character, ActionType.REACTION)
    assert combat_round.can_take_action(mock_character, ActionType.MOVEMENT)

def test_use_action(combat_round, mock_character):
    # Usa ação padrão
    assert combat_round.use_action(mock_character, ActionType.STANDARD)
    assert not combat_round.can_take_action(mock_character, ActionType.STANDARD)
    
    # Tenta usar novamente
    assert not combat_round.use_action(mock_character, ActionType.STANDARD)

def test_reaction_opportunity(combat_round, mock_character):
    trigger = "attack_of_opportunity"
    combat_round.register_reaction_opportunity(mock_character, trigger)
    assert combat_round.can_react_to(mock_character, trigger)

def test_process_reaction(combat_round, mock_character):
    trigger = "attack_of_opportunity"
    combat_round.register_reaction_opportunity(mock_character, trigger)
    
    action = CombatAction(
        actor=mock_character,
        action_type="reaction_attack"
    )
    
    assert combat_round.process_reaction(mock_character, trigger, action)
    assert not combat_round.can_take_action(mock_character, ActionType.REACTION)

def test_get_available_actions(combat_round, mock_character):
    available = combat_round.get_available_actions(mock_character)
    assert ActionType.STANDARD in available
    assert ActionType.BONUS in available
    assert ActionType.REACTION in available
    assert ActionType.MOVEMENT in available
    
    # Usa uma ação
    combat_round.use_action(mock_character, ActionType.STANDARD)
    available = combat_round.get_available_actions(mock_character)
    assert ActionType.STANDARD not in available

def test_is_turn_complete(combat_round, mock_character):
    assert not combat_round.is_turn_complete(mock_character)
    
    combat_round.use_action(mock_character, ActionType.STANDARD)
    combat_round.use_action(mock_character, ActionType.MOVEMENT)
    
    assert combat_round.is_turn_complete(mock_character)