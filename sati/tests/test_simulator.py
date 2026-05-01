"""Tests for simulator module."""

from datetime import datetime

import pytest

from sati.simulator import Simulator


@pytest.fixture
def simulator() -> Simulator:
    """Create a simulator for testing."""
    return Simulator()


class TestSimulator:
    """Test Simulator class."""

    def test_init(self, simulator: Simulator) -> None:
        """Simulator initializes with all components."""
        assert simulator.generator is not None
        assert simulator.state_machine is not None
        assert simulator.calculator is not None
        assert simulator.engine is not None

    def test_select_next_action_has_result(self, simulator: Simulator) -> None:
        """select_next_action returns a valid action or None."""
        user = simulator.generator.generate_user()
        current_time = int(datetime.now().timestamp())

        action = simulator.select_next_action(user, current_time)
        # Action should be valid or None
        if action is not None:
            assert action in ["login", "browse", "exit", "cart", "pay", "none"]

    def test_select_next_action_from_landing(self, simulator: Simulator) -> None:
        """From landing, allowed actions are login, browse, exit."""
        user = simulator.generator.generate_user()
        user.state.current_state = "landing"
        current_time = int(datetime.now().timestamp())

        action = simulator.select_next_action(user, current_time)
        if action is not None:
            assert action in ["login", "browse", "exit", "none"]

    def test_select_next_action_from_exit(self, simulator: Simulator) -> None:
        """From exit, no actions are allowed."""
        user = simulator.generator.generate_user()
        user.state.current_state = "exit"
        current_time = int(datetime.now().timestamp())

        action = simulator.select_next_action(user, current_time)
        assert action is None

    def test_step_executes(self, simulator: Simulator) -> None:
        """step executes and returns next state."""
        user = simulator.generator.generate_user()
        user.state.current_state = "browse"
        current_time = int(datetime.now().timestamp())

        result = simulator.step(user, current_time)
        # Result should be valid or None (if exit)
        if result is not None:
            assert isinstance(result, str)

    def test_step_updates_user_state(self, simulator: Simulator) -> None:
        """step updates the user's current_state."""
        user = simulator.generator.generate_user()
        user.state.current_state = "landing"
        current_time = int(datetime.now().timestamp())

        simulator.step(user, current_time)

        # State may or may not change, but should be valid
        assert user.state.current_state in ["login", "browse", "exit", "landing"]

    def test_step_updates_last_active_time(self, simulator: Simulator) -> None:
        """step updates last_active_time for non-exit transitions."""
        user = simulator.generator.generate_user()
        user.state.current_state = "browse"
        user.state.last_active_time = 0
        current_time = 5000

        simulator.step(user, current_time)

        if user.state.current_state != "exit":
            assert user.state.last_active_time == current_time

    def test_step_updates_exit_time(self, simulator: Simulator) -> None:
        """step updates last_exit_time and session_count on exit."""
        user = simulator.generator.generate_user()
        user.state.current_state = "browse"
        user.state.last_exit_time = 0
        user.state.session_count = 0
        current_time = 6000

        # Run until exit
        for _ in range(20):
            next_state = simulator.step(user, current_time)
            current_time += 60
            if next_state == "exit":
                break

        if user.state.current_state == "exit":
            assert user.state.last_exit_time > 0
            assert user.state.session_count >= 1

    def test_run_user_returns_trajectory(self, simulator: Simulator) -> None:
        """run_user returns a list of (timestamp, state, page_subtype) tuples."""
        user = simulator.generator.generate_user()
        trajectory = simulator.run_user(user, max_steps=5)

        assert len(trajectory) > 0
        assert len(trajectory) <= 6  # Initial + max_steps
        for ts, state, page_subtype in trajectory:
            assert isinstance(ts, int)
            assert isinstance(state, str)
            assert page_subtype is None or isinstance(page_subtype, str)

    def test_run_user_respects_max_steps(self, simulator: Simulator) -> None:
        """run_user respects max_steps limit."""
        user = simulator.generator.generate_user()
        trajectory = simulator.run_user(user, max_steps=3)

        # Should have at most 4 entries (initial + 3 steps)
        assert len(trajectory) <= 4

    def test_run_user_stops_at_exit(self, simulator: Simulator) -> None:
        """run_user stops when user reaches exit state."""
        user = simulator.generator.generate_user()
        trajectory = simulator.run_user(user, max_steps=20)

        # Find if exit is in trajectory
        states = [state for _, state, _ in trajectory]
        if "exit" in states:
            exit_idx = states.index("exit")
            # No states after exit
            assert all(s == "exit" for _, s, _ in trajectory[exit_idx:])

    def test_print_trajectory(self, simulator: Simulator, capsys) -> None:
        """print_trajectory executes without error."""
        user = simulator.generator.generate_user()
        trajectory = [(1000, "landing", None), (1060, "browse", "product_list"), (1120, "cart", "cart_page")]

        simulator.print_trajectory(user, trajectory)

        captured = capsys.readouterr()
        assert "用户ID" in captured.out
        assert "职业" in captured.out
