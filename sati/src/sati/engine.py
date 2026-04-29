"""活跃引擎 - 计算用户活跃概率（热衰减模型）."""

import logging
import math
from datetime import datetime
from typing import Final

from sati.config import BASE_PROB, DECAY_LAMBDA, TIME_MULTIPLIER_HIGH, TIME_MULTIPLIER_LOW, TIME_MULTIPLIER_NORMAL
from sati.user import User

logger = logging.getLogger(__name__)


class ActivityEngine:
    """活跃引擎 - 热衰减模型."""

    # 高峰时段定义（小时）
    HIGH_ACTIVE_HOURS: Final[dict[int, tuple[int, int]]] = {
        1: (14, 18),  # 学生: 下午
        2: (9, 11),  # 公务员: 上午
        3: (12, 13),  # 企业职工: 午休
        4: (10, 22),  # 自由职业: 不规律，覆盖较广
        5: (9, 18),  # 个体户: 白天
        6: (8, 11),  # 退休: 上午
    }

    def __init__(self, decay_lambda: float = DECAY_LAMBDA) -> None:
        """初始化活跃引擎.

        Args:
            decay_lambda: 热衰减系数，默认0.01
        """
        self.decay_lambda = decay_lambda
        self.base_prob = BASE_PROB
        self.high_multiplier = TIME_MULTIPLIER_HIGH
        self.normal_multiplier = TIME_MULTIPLIER_NORMAL
        self.low_multiplier = TIME_MULTIPLIER_LOW

    def get_time_multiplier(self, hour: int, occupation_type: int) -> float:
        """获取时段系数.

        Args:
            hour: 小时 (0-23)
            occupation_type: 职业类型

        Returns:
            时段系数
        """
        active_range = self.HIGH_ACTIVE_HOURS.get(occupation_type, (9, 22))
        if active_range[0] <= hour < active_range[1]:
            return self.high_multiplier
        # 判断是否为深夜/凌晨（低峰）
        if hour < 6 or hour >= 23:
            return self.low_multiplier
        return self.normal_multiplier

    def calc_decay(self, delta_minutes: int) -> float:
        """计算热衰减系数.

        公式: e^(-λ × Δt)

        Args:
            delta_minutes: 距上次退出的时间（分钟）

        Returns:
            衰减系数 (0-1)
        """
        if delta_minutes < 0:
            return 1.0  # 如果是未来时间，不衰减
        return math.exp(-self.decay_lambda * delta_minutes)

    def calc_base_prob(self, occupation_type: int) -> float:
        """获取职业基础活跃概率."""
        return self.base_prob.get(occupation_type, 0.5)

    def calc_activity_probability(
        self,
        user: User,
        current_time: int | None = None,
    ) -> float:
        """计算用户在当前时刻的活跃概率.

        公式: P_base(occupation, hour) × decay(Δt) × time_multiplier

        Args:
            user: 用户
            current_time: 当前时间戳（Unix），默认为now

        Returns:
            活跃概率 (0-1)
        """
        if current_time is None:
            current_time = int(datetime.now().timestamp())

        # 1. 获取职业基础概率
        base_prob = self.calc_base_prob(user.profile.occupation_type)

        # 2. 计算距上次退出的时间
        last_exit = user.state.last_exit_time
        if last_exit > 0:
            delta_minutes = (current_time - last_exit) // 60
        else:
            delta_minutes = 0  # 从未退出过（首次活跃），不衰减

        # 3. 计算热衰减
        decay = self.calc_decay(delta_minutes)

        # 4. 转换时间戳为小时
        dt = datetime.fromtimestamp(current_time)
        hour = dt.hour

        # 5. 获取时段系数
        time_mult = self.get_time_multiplier(hour, user.profile.occupation_type)

        # 6. 计算最终概率
        prob = base_prob * decay * time_mult
        return min(1.0, max(0.0, prob))

    def is_active(self, user: User, current_time: int | None = None) -> bool:
        """判断用户是否活跃.

        Args:
            user: 用户
            current_time: 当前时间戳

        Returns:
            True=活跃, False=不活跃
        """
        import random

        prob = self.calc_activity_probability(user, current_time)
        return random.random() < prob
