"""状态机 - 管理用户状态流转."""

import logging

from sati.config import STATES, TRANSITION_MATRIX
from sati.user import User

logger = logging.getLogger(__name__)


class StateMachine:
    """状态机类.

    管理用户在电商平台的浏览路径状态转换。根据预定义的状态转换矩阵，
    验证并执行合法的状态转移。

    State transition flow:
        landing -> login/browse/exit
        login -> browse/exit
        browse -> landing/browse/cart/exit
        cart -> landing/browse/pay/exit
        pay -> landing/exit
        exit -> (terminal)

    Attributes:
        transition_matrix: 状态转换矩阵，定义每个状态的合法下一状态
        states: 所有状态的列表
    """

    def __init__(self) -> None:
        """初始化状态机。

        从config模块加载状态转换矩阵和状态列表。
        """
        self.transition_matrix = TRANSITION_MATRIX
        self.states = STATES

    def get_allowed_states(self, current_state: str) -> list[str]:
        """获取当前状态允许转移的所有目标状态。

        Args:
            current_state: 用户当前的状态名称。

        Returns:
            list[str]: 允许转移的目标状态列表。如果状态不存在，返回空列表。
        """
        return self.transition_matrix.get(current_state, [])

    def is_valid_transition(self, from_state: str, to_state: str) -> bool:
        """检查从当前状态到目标状态的转换是否合法。

        Args:
            from_state: 转换起始状态。
            to_state: 转换目标状态。

        Returns:
            bool: 如果转换合法返回True，否则返回False。
        """
        allowed = self.get_allowed_states(from_state)
        return to_state in allowed

    def get_transition_weight(
        self,
        from_state: str,
        to_state: str,
        weight: float,
    ) -> float:
        """获取状态转移的权重值。

        如果转换非法，返回0.0；如果合法，返回原始权重值。
        权重计算由WeightCalculator完成，此方法仅验证转换合法性。

        Args:
            from_state: 转换起始状态。
            to_state: 转换目标状态。
            weight: 基础权重值，由WeightCalculator计算得出。

        Returns:
            float: 如果转换合法返回原始weight，否则返回0.0。
        """
        if not self.is_valid_transition(from_state, to_state):
            return 0.0
        return weight

    def transition(self, user: User, next_state: str) -> bool:
        """执行用户状态转移。

        将用户的当前状态转移到目标状态。只会转移至合法状态。

        Args:
            user: 用户对象，包含用户状态信息。
            next_state: 目标状态名称。

        Returns:
            bool: 转移成功返回True，非法转移返回False。
            如果转移成功，user.state.current_state会被更新。
            如果转移失败，user.state.current_state保持不变。
        """
        current = user.state.current_state
        if not self.is_valid_transition(current, next_state):
            logger.warning(f"非法转移: {current} -> {next_state}")
            return False

        user.state.current_state = next_state
        logger.debug(f"用户 {user.profile.user_id[:8]}: {current} -> {next_state}")
        return True
