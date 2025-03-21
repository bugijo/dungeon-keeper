import pytest
from src.systems.combat.condition import (
    Condition,
    ConditionType,
    ConditionManager,
    ConditionEffect
)
from src.systems.character.character import Character

@pytest.fixture
def mock_character():
    return Character(name="Test Character", stats={"strength": 10, "dexterity": 10})

@pytest.fixture
def condition_manager():
    return ConditionManager()

def test_condition_creation():
    condition = Condition(ConditionType.STUNNED, duration=2)
    assert condition.type == ConditionType.STUNNED
    assert condition.duration == 2
    assert condition.effects is not None

def test_add_condition(condition_manager, mock_character):
    condition = Condition(ConditionType.POISONED)
    condition_manager.add_condition(mock_character, condition)
    conditions = condition_manager.get_conditions(mock_character)
    assert len(conditions) == 1
    assert conditions[0].type == ConditionType.POISONED

def test_remove_condition(condition_manager, mock_character):
    condition = Condition(ConditionType.STUNNED)
    condition_manager.add_condition(mock_character, condition)
    condition_manager.remove_condition(mock_character, ConditionType.STUNNED)
    conditions = condition_manager.get_conditions(mock_character)
    assert len(conditions) == 0

def test_update_conditions(condition_manager, mock_character):
    condition = Condition(ConditionType.PARALYZED, duration=2)
    condition_manager.add_condition(mock_character, condition)
    
    # Primeira atualização
    condition_manager.update_conditions(mock_character)
    conditions = condition_manager.get_conditions(mock_character)
    assert len(conditions) == 1
    assert conditions[0].duration == 1
    
    # Segunda atualização
    condition_manager.update_conditions(mock_character)
    conditions = condition_manager.get_conditions(mock_character)
    assert len(conditions) == 0