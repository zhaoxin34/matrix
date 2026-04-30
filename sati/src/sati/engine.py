"""活跃引擎 - 计算用户活跃概率（热衰减模型）."""

import logging
import math
from datetime import datetime
from typing import Final

from sati.config import BASE_PROB, DECAY_LAMBDA, TIME_MULTIPLIER_HIGH, TIME_MULTIPLIER_LOW, TIME_MULTIPLIER_NORMAL
from sati.user import User

logger = logging.getLogger(__name__)


class ActivityEngine:
    """活跃引擎类 - 基于热衰减模型计算用户活跃概率.

    热衰减模型考虑三个因素：
    1. 职业基础活跃概率（不同职业有不同的上网活跃度）
    2. 时间衰减（距上次退出的时间越长，活跃概率越低）
    3. 时段系数（高峰期活跃概率更高）

    公式: P_active = P_base(occupation, hour) × decay(Δt) × time_multiplier

    Attributes:
        decay_lambda: 热衰减系数，控制时间衰减速度
        base_prob: 职业基础活跃概率字典
        high_multiplier: 高峰时段系数
        normal_multiplier: 正常时段系数
        low_multiplier: 低峰时段系数
        HIGH_ACTIVE_HOURS: 各职业的高峰时段定义
    """

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
        """初始化活跃引擎。

        Args:
            decay_lambda: 热衰减系数，默认值为DECAY_LAMBDA=0.01。
                值越大，时间衰减越快。
        """
        self.decay_lambda = decay_lambda
        self.base_prob = BASE_PROB
        self.high_multiplier = TIME_MULTIPLIER_HIGH
        self.normal_multiplier = TIME_MULTIPLIER_NORMAL
        self.low_multiplier = TIME_MULTIPLIER_LOW

    def get_time_multiplier(self, hour: int, occupation_type: int) -> float:
        """获取指定时段系数。

        根据当前小时和职业类型，返回时段活跃系数。

        Args:
            hour: 当前小时，范围0-23。
            occupation_type: 职业类型，1-6。

        Returns:
            float: 时段系数。高峰时段返回TIME_MULTIPLIER_HIGH（1.2），
                低峰时段（<6点或>=23点）返回TIME_MULTIPLIER_LOW（0.3），
                其他时段返回TIME_MULTIPLIER_NORMAL（1.0）。
        """
        active_range = self.HIGH_ACTIVE_HOURS.get(occupation_type, (9, 22))
        if active_range[0] <= hour < active_range[1]:
            return self.high_multiplier
        # 判断是否为深夜/凌晨（低峰）
        if hour < 6 or hour >= 23:
            return self.low_multiplier
        return self.normal_multiplier

    def calc_decay(self, delta_minutes: int) -> float:
        """计算热衰减系数。

        使用指数衰减模型：decay = e^(-λ × Δt)

        Args:
            delta_minutes: 距上次退出的时间（分钟）。如果是负数（未来时间），
                返回1.0表示不衰减。

        Returns:
            float: 衰减系数，范围0-1。
                0表示完全衰减（长时间未活跃）
                1表示无衰减（刚退出或未来时间）
        """
        if delta_minutes < 0:
            return 1.0  # 如果是未来时间，不衰减
        return math.exp(-self.decay_lambda * delta_minutes)

    def calc_base_prob(self, occupation_type: int) -> float:
        """获取职业基础活跃概率。

        Args:
            occupation_type: 职业类型，1-6。

        Returns:
            float: 基础活跃概率，范围0-1。
                如果职业类型未知，返回默认值0.5。
        """
        return self.base_prob.get(occupation_type, 0.5)

    def calc_activity_probability(
        self,
        user: User,
        current_time: int | None = None,
    ) -> float:
        """计算用户在当前时刻的活跃概率。

        综合考虑职业基础概率、时间衰减和时段系数。

        Args:
            user: 用户对象，包含用户特征和状态。
            current_time: 当前时间戳（Unix秒）。如果为None，使用系统当前时间。

        Returns:
            float: 活跃概率，范围0-1。被限制在[0, 1]区间内。

        Raises:
            ValueError: 如果current_time为负数。
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
        """判断用户在当前时刻是否活跃。

        基于活跃概率进行随机判定。

        Args:
            user: 用户对象，包含用户特征和状态。
            current_time: 当前时间戳（Unix秒）。如果为None，使用系统当前时间。

        Returns:
            bool: True表示活跃，False表示不活跃。
                判定规则：生成[0,1)随机数，如果小于活跃概率则判定为活跃。
        """
        import random

        prob = self.calc_activity_probability(user, current_time)
        return random.random() < prob
