"""Tests for config module."""

from sati.config import (
    BASE_PROB,
    DECAY_LAMBDA,
    STATES,
    TIME_MULTIPLIER_HIGH,
    TIME_MULTIPLIER_LOW,
    TIME_MULTIPLIER_NORMAL,
    TRANSITION_MATRIX,
    WEIGHT_CONFIG,
)


class TestConfig:
    """Test configuration values."""

    def test_decay_lambda_is_positive(self) -> None:
        """Decay lambda should be positive."""
        assert DECAY_LAMBDA > 0

    def test_time_multipliers_hierarchy(self) -> None:
        """High > Normal > Low multiplier."""
        assert TIME_MULTIPLIER_HIGH > TIME_MULTIPLIER_NORMAL
        assert TIME_MULTIPLIER_NORMAL > TIME_MULTIPLIER_LOW

    def test_states_defined(self) -> None:
        """All states should be defined."""
        expected_states = ["landing", "login", "browse", "cart", "pay", "exit"]
        assert STATES == expected_states

    def test_transition_matrix_complete(self) -> None:
        """Transition matrix should cover all states."""
        for state in STATES:
            assert state in TRANSITION_MATRIX

    def test_exit_state_has_no_transitions(self) -> None:
        """Exit state should have no allowed transitions."""
        assert TRANSITION_MATRIX["exit"] == []

    def test_base_prob_values(self) -> None:
        """Base probability values should be in range (0, 1)."""
        for occupation, prob in BASE_PROB.items():
            assert 0 < prob <= 1
            assert 1 <= occupation <= 6

    def test_weight_config_keys(self) -> None:
        """Weight config should have expected keys."""
        expected_keys = ["login_base", "browse_base", "cart_base", "pay_base", "return_base"]
        for key in expected_keys:
            assert key in WEIGHT_CONFIG

    def test_landing_transitions(self) -> None:
        """Landing state can transition to login, browse, or exit."""
        assert set(TRANSITION_MATRIX["landing"]) == {"login", "browse", "exit"}

    def test_browse_can_return_to_browse(self) -> None:
        """Browse state can transition to itself (deep browsing)."""
        assert "browse" in TRANSITION_MATRIX["browse"]

    def test_pay_only_returns_to_landing_or_exit(self) -> None:
        """Pay state can only go to landing or exit."""
        assert set(TRANSITION_MATRIX["pay"]) == {"landing", "exit"}
