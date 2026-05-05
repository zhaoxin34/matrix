"""PageFeedback - 页面反馈器接口和模拟实现."""

from __future__ import annotations

import logging
import random
from typing import TYPE_CHECKING

import requests

from sati.config import ANALYST_API_URL

if TYPE_CHECKING:
    from sati.user import User

logger = logging.getLogger(__name__)


class PageState:
    """页面状态数据类.

    描述用户在执行某个动作后看到的页面信息。

    Attributes:
        page_type: 页面类型，对应用户动作：landing, browse, login, add_cart, payment, exit
        page_subtype: 页面子类型，如 homepage, red_packet, coupon, product_list, product_detail 等
        page_attributes: 页面属性字典，包含页面相关的具体信息
    """

    def __init__(
        self,
        page_type: str,
        page_subtype: str,
        page_attributes: dict | None = None,
    ) -> None:
        self.page_type = page_type
        self.page_subtype = page_subtype
        self.page_attributes = page_attributes or {}

    def to_dict(self) -> dict:
        return {
            "page_type": self.page_type,
            "page_subtype": self.page_subtype,
            "page_attributes": self.page_attributes,
        }

    def __repr__(self) -> str:
        return f"PageState({self.page_type}/{self.page_subtype}, attrs={self.page_attributes})"


class PageFeedback:
    """页面反馈器协议.

    根据用户动作返回对应的页面状态。未来可替换为调用真实接口的实现。
    """

    def get_page_state(self, user: User, action: str, current_state: str, session_id: str | None = None) -> PageState:
        """根据用户动作返回页面状态。

        Args:
            user: 用户对象
            action: 即将执行的动作（如 browse, login, cart 等）
            current_state: 当前用户状态
            session_id: 会话ID，用于API调用

        Returns:
            PageState: 动作执行后用户看到的页面状态
        """
        ...


class RealPageFeedback:
    """真实页面反馈器.

    调用 analyst 后端 API 获取页面状态，同时记录用户行为事件。

    Page subtypes:
        landing: homepage, red_packet, coupon
        browse: product_list, product_detail
        login: login_page
        cart: cart_page
        pay: payment_page
        exit: (empty)
    """

    def __init__(self, api_url: str | None = None) -> None:
        """初始化真实页面反馈器。

        Args:
            api_url: Analyst API 地址，默认使用配置中的地址。
        """
        self.api_url = api_url or ANALYST_API_URL

    def get_page_state(self, user: User, action: str, current_state: str) -> PageState:
        """调用 API 获取页面状态。

        Args:
            user: 用户对象
            action: 即将执行的动作
            current_state: 当前用户状态

        Returns:
            PageState: 从 API 获取的页面状态
        """
        # 每个用户使用独立的 session_id
        session_id = f"user-{user.profile.user_id}-session"

        try:
            response = requests.post(
                f"{self.api_url}/api/v1/collect",
                json={
                    "session_id": session_id,
                    "user_id": user.profile.user_id,
                    "action": action,
                    "current_state": current_state,
                },
                timeout=5,
            )
            response.raise_for_status()
            data = response.json()

            if data.get("code") == 0:
                page_state_data = data["data"]["page_state"]
                return PageState(
                    page_type=page_state_data["page_type"],
                    page_subtype=page_state_data["page_subtype"],
                    page_attributes=page_state_data.get("page_attributes", {}),
                )
            else:
                logger.warning(f"API returned error: {data.get('message')}")
                return self._get_fallback_page(action)

        except requests.RequestException as e:
            logger.warning(f"Failed to call analyst API: {e}, using fallback")
            return self._get_fallback_page(action)

    def _get_fallback_page(self, action: str) -> PageState:
        """当 API 调用失败时，返回默认页面状态。"""
        return FakePageFeedback().get_page_state(None, action, "")


class FakePageFeedback:
    """模拟页面反馈器.

    根据动作类型和状态，模拟返回假想的页面状态。
    实际项目中应替换为调用真实接口的实现。

    Page subtypes:
        landing: homepage, red_packet, coupon
        browse: product_list, product_detail
        login: login_page
        cart: cart_page
        pay: payment_page
        exit: (empty)
    """

    # 商品分类和品牌用于模拟详情页
    CATEGORIES = ["数码", "服装", "食品", "家居", "美妆", "运动", "图书"]
    BRANDS = ["Apple", "华为", "小米", "耐克", "阿迪", "优衣库", "蒙牛", "伊利"]

    def get_page_state(self, user: User | None, action: str, current_state: str) -> PageState:
        """根据用户动作返回模拟的页面状态。

        Args:
            user: 用户对象（可以为None，用于fallback）
            action: 即将执行的动作
            current_state: 当前用户状态

        Returns:
            PageState: 模拟的页面状态
        """
        # 落地页场景
        if action in ("landing", "browse") and current_state in ("landing", "pay"):
            return self._get_landing_page(user, action)
        # 浏览场景
        elif action == "browse" or current_state == "browse":
            return self._get_browse_page(user, action)
        # 加购场景
        elif action in ("cart", "add_cart") or current_state == "cart":
            return self._get_cart_page(user)
        # 登录场景
        elif action == "login" or current_state == "login":
            return PageState(page_type="login", page_subtype="login_page", page_attributes={})
        # 支付场景
        elif action == "pay" or current_state == "pay":
            return self._get_payment_page(user)
        # 退出场景
        else:
            return PageState(page_type="exit", page_subtype="", page_attributes={})

    def _get_landing_page(self, user: User | None, action: str) -> PageState:
        """生成落地页类型。

        根据用户特征和随机因素，决定是红包页、优惠券页还是首页。
        """
        # 模拟：年轻用户更容易收到红包/优惠券
        age = user.profile.age if user else 25
        if age < 30 and random.random() < 0.4:
            return PageState(
                page_type="landing",
                page_subtype="red_packet",
                page_attributes={
                    "amount": random.randint(5, 50),
                    "expire_hours": 24,
                    "min_amount": random.choice([100, 200, 500]),
                },
            )
        elif random.random() < 0.3:
            return PageState(
                page_type="landing",
                page_subtype="coupon",
                page_attributes={
                    "discount": random.choice([10, 20, 50, 100]),
                    "min_amount": random.choice([100, 200, 500]),
                    "category": random.choice(self.CATEGORIES),
                },
            )
        else:
            return PageState(
                page_type="landing",
                page_subtype="homepage",
                page_attributes={
                    "banner_count": random.randint(3, 5),
                    "featured_categories": random.sample(self.CATEGORIES, 4),
                },
            )

    def _get_browse_page(self, user: User | None, action: str) -> PageState:
        """生成浏览页类型。

        决定是列表页还是详情页。
        """
        # 模拟：用户从落地页进入时先看列表页，之后可能进入详情页
        if random.random() < 0.3:
            # 详情页
            price = random.randint(50, 5000)
            return PageState(
                page_type="browse",
                page_subtype="product_detail",
                page_attributes={
                    "product_id": f"PROD_{random.randint(10000, 99999)}",
                    "category": random.choice(self.CATEGORIES),
                    "brand": random.choice(self.BRANDS),
                    "price": price,
                    "original_price": int(price * random.uniform(1.2, 2.0)),
                    "discount": round(random.uniform(0.7, 0.95), 2),
                    "stock": random.randint(10, 100),
                },
            )
        else:
            # 列表页
            return PageState(
                page_type="browse",
                page_subtype="product_list",
                page_attributes={
                    "category": random.choice(self.CATEGORIES),
                    "count": random.randint(10, 50),
                    "sort_by": random.choice(["price_asc", "price_desc", "sales", "relevance"]),
                },
            )

    def _get_cart_page(self, user: User | None) -> PageState:
        """生成购物车页面。"""
        items_count = random.randint(1, 5)
        total_amount = random.randint(100, 2000)
        return PageState(
            page_type="add_cart",
            page_subtype="cart_page",
            page_attributes={
                "items_count": items_count,
                "total_amount": total_amount,
                "saved_amount": random.randint(10, 100),
            },
        )

    def _get_payment_page(self, user: User | None) -> PageState:
        """生成支付页面。"""
        amount = random.randint(100, 5000)
        return PageState(
            page_type="payment",
            page_subtype="payment_page",
            page_attributes={
                "order_id": f"ORD_{random.randint(100000, 999999)}",
                "amount": amount,
                "payment_methods": ["credit_card", "alipay", "wechat_pay", "bank_transfer"][: random.randint(2, 4)],
            },
        )
