"""PageWeightCalculator - 根据页面状态计算权重因子."""

from typing import Final

from sati.page_feedback import PageState

# page_subtype -> action -> base_factor
PAGE_WEIGHT_MAP: Final[dict[str, dict[str, float]]] = {
    "homepage": {"browse": 1.0},
    "red_packet": {"browse": 1.2},
    "coupon": {"browse": 1.1},
    "product_list": {"browse": 1.0},
    "product_detail": {"add_cart": 1.5, "browse": 0.8},
    "cart_page": {"payment": 1.3, "exit": 1.2},  # 购物车增加退出权重
    "payment_page": {"exit": 1.2},
    "login_page": {"browse": 0.5},
}


class PageWeightCalculator:
    """页面状态权重计算器.

    根据当前页面状态和目标动作，计算页面影响因子 W_page。

    W_page 因子表：
    | 当前页面    | action   | base_factor | 说明                    |
    |------------|----------|-------------|------------------------|
    | homepage   | browse   | 1.0         | 默认                    |
    | red_packet | browse   | 1.2         | 红包吸引更容易浏览      |
    | coupon     | browse   | 1.1         | 优惠券吸引浏览          |
    | product_list | browse | 1.0         | 默认                    |
    | product_detail | add_cart | 1.5      | 详情页更容易加购        |
    | product_detail | browse | 0.8        | 详情页深度浏览后可能返回 |
    | cart_page  | payment  | 1.3         | 购物车结算意愿更强      |
    | payment_page | exit   | 1.2         | 支付页更可能直接退出   |
    | login_page | browse   | 0.5         | 登录页可能放弃          |
    """

    def get_weight(self, page_state: PageState | None, action: str) -> float:
        """获取页面状态对动作的权重因子。

        Args:
            page_state: 当前页面状态
            action: 目标动作

        Returns:
            float: W_page 权重因子，默认 1.0
        """
        if page_state is None:
            return 1.0

        page_subtype = page_state.page_subtype
        if page_subtype not in PAGE_WEIGHT_MAP:
            return 1.0

        action_weights = PAGE_WEIGHT_MAP[page_subtype]
        if action not in action_weights:
            return 1.0

        base_factor = action_weights[action]

        # 根据页面属性调整因子
        attrs = page_state.page_attributes
        influence_factor = self._calc_influence_factor(page_state, action, attrs)

        return base_factor * (1 + influence_factor)

    def _calc_influence_factor(
        self,
        page_state: PageState,
        action: str,
        attrs: dict,
    ) -> float:
        """根据页面属性计算影响因素。

        目前考虑：
        - product_detail 的价格：价格越高，add_cart 意愿越低
        """
        if page_state.page_subtype == "product_detail" and action == "add_cart":
            price = attrs.get("price", 0)
            if price > 3000:
                return -0.2  # 高价商品降低加购意愿
            elif price < 200:
                return 0.1  # 低价商品略微提升加购意愿

        return 0.0
