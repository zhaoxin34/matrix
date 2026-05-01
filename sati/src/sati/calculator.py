"""权重计算器 - 根据用户特征和页面状态计算各动作权重."""

import logging
from typing import Callable, Final

from sati.config import WEIGHT_CONFIG
from sati.page_feedback import PageState
from sati.page_weight import PageWeightCalculator
from sati.user import User

logger = logging.getLogger(__name__)


class WeightCalculator:
    """权重计算器类.

    根据用户的统计特征和页面状态，计算用户执行各状态转换的倾向权重。
    权重越高，用户越可能选择该转换。

    核心公式：Score = W(当前状态, 下一状态) × W_page(page_state, action)

    各动作权重计算公式：
    - login: 0.3 + 0.2 × income_stable - 0.1 × has_other_loan
    - browse: 0.5 + 0.1 × (work_experience / 10) + 0.1 × education_level
    - cart: 0.4 × (income_monthly / 10000) × (1 + 0.2 × child_count)
    - pay: 0.6 × (savings_level / 5) × (1 / spending_style)
    - return: 0.3 + 0.1 × (income_stable - 1) + 0.05 × (education_level - 1)

    Attributes:
        config: 权重基础配置字典
        page_weight_calc: 页面权重计算器
    """

    def __init__(self) -> None:
        """初始化权重计算器。

        从WEIGHT_CONFIG加载基础权重配置。
        """
        self.config = WEIGHT_CONFIG
        self.page_weight_calc = PageWeightCalculator()

    def calc_login_weight(self, user: User) -> float:
        """计算用户登录意愿权重。

        收入稳定且无其他贷款的用户更倾向于登录。

        Args:
            user: 用户对象，包含用户特征。

        Returns:
            float: 登录权重值，最小为0.1。
        """
        w_login = self.config["login_base"] + 0.2 * user.profile.income_stable - 0.1 * user.profile.has_other_loan
        return max(0.1, w_login)  # 最小值0.1

    def calc_browse_weight(self, user: User) -> float:
        """计算用户浏览深度权重。

        工作经验丰富和学历高的用户更倾向于深度浏览。

        Args:
            user: 用户对象，包含用户特征。

        Returns:
            float: 浏览权重值，最小为0.1。
        """
        w_browse = (
            self.config["browse_base"] + 0.1 * (user.profile.work_experience / 10) + 0.1 * user.profile.education_level
        )
        return max(0.1, w_browse)

    def calc_cart_weight(self, user: User) -> float:
        """计算用户加购倾向权重。

        收入高且有子女的用户更倾向于加购。

        Args:
            user: 用户对象，包含用户特征。

        Returns:
            float: 加购权重值，最小为0.1。
        """
        w_cart = self.config["cart_base"] * (user.profile.income_monthly / 10000) * (1 + 0.2 * user.profile.child_count)
        return max(0.1, w_cart)

    def calc_pay_weight(self, user: User) -> float:
        """计算用户支付转化权重。

        存款级别高且消费节俭的用户更倾向于完成支付。

        Args:
            user: 用户对象，包含用户特征。

        Returns:
            float: 支付权重值，最小为0.1。
        """
        w_pay = self.config["pay_base"] * (user.profile.savings_level / 5) * (1 / user.profile.spending_style)
        return max(0.1, w_pay)

    def calc_return_weight(self, user: User) -> float:
        """计算用户复访频率权重。

        收入稳定且学历高的用户更可能回访。

        Args:
            user: 用户对象，包含用户特征。

        Returns:
            float: 复访权重值，最小为0.1。
        """
        w_return = (
            self.config["return_base"]
            + 0.1 * (user.profile.income_stable - 1)
            + 0.05 * (user.profile.education_level - 1)
        )
        return max(0.1, w_return)

    def get_weight(
        self,
        user: User,
        from_state: str,
        to_state: str,
        page_state: PageState | None = None,
    ) -> float:
        """获取指定状态转移的权重值。

        根据起始状态和目标状态，选择对应的权重计算方法，
        并考虑页面状态的影响。

        Args:
            user: 用户对象，包含用户特征。
            from_state: 当前状态。
            to_state: 目标状态。
            page_state: 当前页面状态，用于计算 W_page。

        Returns:
            float: 状态转移权重值。如果状态转移无效，返回0.0。
        """
        weights_map: Final[dict[tuple[str, str], Callable[[User], float]]] = {
            ("landing", "login"): self.calc_login_weight,
            ("landing", "browse"): self.calc_browse_weight,
            ("login", "browse"): self.calc_browse_weight,
            ("browse", "cart"): self.calc_cart_weight,
            ("cart", "browse"): self.calc_browse_weight,
            ("cart", "pay"): self.calc_pay_weight,
            ("pay", "landing"): self.calc_return_weight,
            ("browse", "landing"): lambda u: 0.3,
            ("cart", "landing"): lambda u: 0.3,
            ("pay", "exit"): lambda u: 1.2,
            ("landing", "exit"): lambda u: 0.6,
            ("login", "exit"): lambda u: 0.6,
            ("browse", "exit"): lambda u: 0.4,  # 降低退出权重
            ("cart", "exit"): lambda u: 0.5,  # 降低退出权重
            ("browse", "browse"): self.calc_browse_weight,  # 使用完整计算
            ("cart", "cart"): lambda u: 0.3,
        }

        key = (from_state, to_state)
        if key not in weights_map:
            return 0.0

        # 计算基础权重
        func: Callable[[User], float] = weights_map[key]
        base_weight = func(user)

        # 计算页面状态权重
        w_page = self.page_weight_calc.get_weight(page_state, to_state)

        return base_weight * w_page
