"""权重计算器 - 根据用户特征计算各动作权重."""

import logging
from typing import Callable, Final

from sati.config import WEIGHT_CONFIG
from sati.user import User

logger = logging.getLogger(__name__)


class WeightCalculator:
    """权重计算器."""

    def __init__(self) -> None:
        """初始化权重计算器."""
        self.config = WEIGHT_CONFIG

    def calc_login_weight(self, user: User) -> float:
        """计算登录意愿权重.

        公式: 0.3 + 0.2 × income_stable - 0.1 × has_other_loan
        """
        w_login = self.config["login_base"] + 0.2 * user.profile.income_stable - 0.1 * user.profile.has_other_loan
        return max(0.1, w_login)  # 最小值0.1

    def calc_browse_weight(self, user: User) -> float:
        """计算浏览深度权重.

        公式: 0.5 + 0.1 × (work_experience / 10) + 0.1 × education_level
        """
        w_browse = (
            self.config["browse_base"] + 0.1 * (user.profile.work_experience / 10) + 0.1 * user.profile.education_level
        )
        return max(0.1, w_browse)

    def calc_cart_weight(self, user: User) -> float:
        """计算加购倾向权重.

        公式: 0.4 × (income_monthly / 10000) × (1 + 0.2 × child_count)
        """
        w_cart = self.config["cart_base"] * (user.profile.income_monthly / 10000) * (1 + 0.2 * user.profile.child_count)
        return max(0.1, w_cart)

    def calc_pay_weight(self, user: User) -> float:
        """计算支付转化权重.

        公式: 0.6 × (savings_level / 5) × (1 / spending_style)
        """
        w_pay = self.config["pay_base"] * (user.profile.savings_level / 5) * (1 / user.profile.spending_style)
        return max(0.1, w_pay)

    def calc_return_weight(self, user: User) -> float:
        """计算复访频率权重.

        公式: 0.3 + 0.1 × (income_stable - 1) + 0.05 × (education_level - 1)
        """
        w_return = (
            self.config["return_base"]
            + 0.1 * (user.profile.income_stable - 1)
            + 0.05 * (user.profile.education_level - 1)
        )
        return max(0.1, w_return)

    def get_weight(self, user: User, from_state: str, to_state: str) -> float:
        """获取指定状态转移的权重.

        Args:
            user: 用户
            from_state: 当前状态
            to_state: 目标状态

        Returns:
            权重值
        """
        weights_map: Final[dict[tuple[str, str], Callable[[User], float]]] = {
            ("landing", "login"): self.calc_login_weight,
            ("landing", "browse"): self.calc_browse_weight,
            ("login", "browse"): self.calc_browse_weight,
            ("browse", "cart"): self.calc_cart_weight,
            ("cart", "browse"): self.calc_browse_weight,
            ("cart", "pay"): self.calc_pay_weight,
            ("pay", "landing"): self.calc_return_weight,
            ("browse", "landing"): lambda u: 0.5,
            ("cart", "landing"): lambda u: 0.5,
            ("pay", "exit"): lambda u: 1.0,
            ("landing", "exit"): lambda u: 1.0,
            ("login", "exit"): lambda u: 1.0,
            ("browse", "exit"): lambda u: 1.0,
            ("cart", "exit"): lambda u: 1.0,
            ("browse", "browse"): lambda u: 0.5,
            ("cart", "cart"): lambda u: 0.5,
        }

        key = (from_state, to_state)
        if key in weights_map:
            func: Callable[[User], float] = weights_map[key]
            return func(user)
        return 0.0
