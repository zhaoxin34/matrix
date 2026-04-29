"""状态机 - 管理用户状态流转."""

import logging

from sati.config import STATES, TRANSITION_MATRIX
from sati.user import User

logger = logging.getLogger(__name__)


class StateMachine:
    """状态机."""

    def __init__(self) -> None:
        """初始化状态机."""
        self.transition_matrix = TRANSITION_MATRIX
        self.states = STATES

    def get_allowed_states(self, current_state: str) -> list[str]:
        """获取当前状态允许转移的目标状态."""
        return self.transition_matrix.get(current_state, [])

    def is_valid_transition(self, from_state: str, to_state: str) -> bool:
        """检查状态转移是否合法."""
        allowed = self.get_allowed_states(from_state)
        return to_state in allowed

    def get_transition_weight(self, from_state: str, to_state: str, weight: float) -> float:
        """获取状态转移的权重（乘以基础权重）.

        Args:
            from_state: 当前状态
            to_state: 目标状态
            weight: 基础权重（由权重计算器计算）
        """
        if not self.is_valid_transition(from_state, to_state):
            return 0.0
        return weight

    def transition(self, user: User, next_state: str) -> bool:
        """执行状态转移.

        Args:
            user: 用户
            next_state: 目标状态

        Returns:
            是否转移成功
        """
        current = user.state.current_state
        if not self.is_valid_transition(current, next_state):
            logger.warning(f"非法转移: {current} -> {next_state}")
            return False

        user.state.current_state = next_state
        logger.debug(f"用户 {user.profile.user_id[:8]}: {current} -> {next_state}")
        return True
