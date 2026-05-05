"""Sati - 用户行为模拟系统 - CLI入口."""

import argparse
import logging
import sys
from datetime import datetime

from sati.calculator import WeightCalculator
from sati.config import LOG_FILE
from sati.engine import ActivityEngine
from sati.generator import UserGenerator
from sati.page_feedback import FakePageFeedback, RealPageFeedback
from sati.state import StateMachine
from sati.user import User

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ],
)

logger = logging.getLogger(__name__)

# 状态中文名称映射
STATE_NAMES: dict[str, str] = {
    "landing": "落地页",
    "login": "登录",
    "browse": "浏览",
    "cart": "加购",
    "pay": "支付",
    "exit": "退出",
    "none": "无动作",
}

# 页面子类型中文名称映射
PAGE_SUBTYPE_NAMES: dict[str, str] = {
    "homepage": "首页",
    "red_packet": "红包页",
    "coupon": "优惠券页",
    "product_list": "商品列表",
    "product_detail": "商品详情",
    "cart_page": "购物车",
    "payment_page": "支付页",
    "login_page": "登录页",
}


class Simulator:
    """模拟器类.

    整合用户生成器、状态机、权重计算器和活跃引擎，
    模拟用户在电商平台上的行为轨迹。

    核心算法：next_action = argmax [ Active(time, user) × W × W_page ]

    Attributes:
        generator: 用户生成器实例
        state_machine: 状态机实例
        calculator: 权重计算器实例
        engine: 活跃引擎实例
        page_feedback: 页面反馈器实例
    """

    def __init__(
        self,
        use_real_api: bool = True,
    ) -> None:
        """初始化模拟器.

        创建所有组件实例，使用默认配置。

        Args:
            use_real_api: 是否使用真实API调用，默认True。
                         False则使用FakePageFeedback模拟。
        """
        self.generator = UserGenerator(seed=42)
        self.state_machine = StateMachine()
        self.calculator = WeightCalculator()
        self.engine = ActivityEngine()
        self.page_feedback = RealPageFeedback() if use_real_api else FakePageFeedback()

    def select_next_action(self, user: User, current_time: int) -> str | None:
        """选择用户的下一个动作。

        根据活跃概率随机判断是否活跃：
        - 如果不活跃（random >= active_prob）：返回 "none"，用户无动作
        - 如果活跃：按权重选择合法动作

        核心公式：Score = Active × W × W_page
        其中 Active = random() < active_prob 时为 1，否则为 0

        Args:
            user: 用户对象，包含用户特征和当前状态。
            current_time: 当前时间戳（Unix秒）。

        Returns:
            str | None: 下一个状态名称，"none" 表示无动作，None 表示无法继续。
        """
        import random as _random

        current_state = user.state.current_state
        allowed_states = self.state_machine.get_allowed_states(current_state)

        if not allowed_states:
            return None

        # 计算活跃概率
        active_prob = self.engine.calc_activity_probability(user, current_time)

        # 随机判断是否活跃
        if _random.random() >= active_prob:
            return "none"  # 用户不活跃，无动作

        # 活跃时：计算每个允许动作的得分
        scores: dict[str, float] = {}
        page_state = user.state.current_page_state

        for next_state in allowed_states:
            weight = self.calculator.get_weight(user, current_state, next_state, page_state)
            score = active_prob * weight
            scores[next_state] = score

        # 选取得分最高的动作
        if not scores:
            return "none"  # 无合法动作也算作无动作
        return max(scores, key=scores.get)  # type: ignore

    def step(self, user: User, current_time: int) -> str | None:
        """执行一步模拟。

        选择并执行下一个动作，更新用户状态，并获取页面反馈。

        Args:
            user: 用户对象，包含用户特征和当前状态。
            current_time: 当前时间戳（Unix秒）。

        Returns:
            str | None: 执行后的状态名称，如果无法继续返回None。
                如果返回"exit"表示用户退出。
                如果返回None表示无合法动作可执行。
        """
        next_state = self.select_next_action(user, current_time)
        if next_state is None:
            return None

        # "none" 表示用户不活跃，不执行状态转移
        if next_state == "none":
            # 用户不活跃时也更新活跃时间（标记为最后活跃时间）
            user.state.last_active_time = current_time
            return "none"

        # 执行状态转移
        self.state_machine.transition(user, next_state)

        # 获取页面反馈
        user.state.current_page_state = self.page_feedback.get_page_state(user, next_state, user.state.current_state)

        # 更新活跃时间
        if next_state != "exit":
            user.state.last_active_time = current_time
        else:
            user.state.last_exit_time = current_time
            user.state.session_count += 1

        return next_state

    def run_user(self, user: User, max_steps: int = 20) -> list[tuple[int, str, str | None]]:
        """运行单个用户的模拟。

        持续执行模拟直到达到最大步数或用户退出。

        Args:
            user: 用户对象，包含用户特征和初始状态。
            max_steps: 最大模拟步数，默认20。超过此步数后强制结束模拟。

        Returns:
            list[tuple[int, str, str | None]]: 行为轨迹列表，
                每个元素为(时间戳, 状态, 页面子类型)的元组。
                第一个元素是初始状态，时间戳为当前时刻。
                后续每步间隔60秒。
        """
        init_state = user.state.current_state
        init_time = int(datetime.now().timestamp())
        trajectory: list[tuple[int, str, str | None]] = [(init_time, init_state, None)]
        current_time = init_time

        # 初始化第一页
        user.state.current_page_state = self.page_feedback.get_page_state(user, user.state.current_state, "")

        for _ in range(max_steps):
            next_state = self.step(user, current_time)
            if next_state is None or next_state == "exit":
                break
            current_time += 60  # 假设每步1分钟
            page_subtype = user.state.current_page_state.page_subtype if user.state.current_page_state else None
            trajectory.append((current_time, next_state, page_subtype))

        return trajectory

    def print_trajectory(self, user: User, trajectory: list[tuple[int, str, str | None]]) -> None:
        """打印用户行为轨迹。

        Args:
            user: 用户对象，用于显示用户基本信息。
            trajectory: 行为轨迹列表，每元素为(时间戳, 状态, 页面子类型)。
        """
        print(f"\n{'=' * 60}")
        print(f"用户ID: {user.profile.user_id[:8]}...")
        print(f"职业: {user.profile.occupation_type}, 年龄: {user.profile.age}, 收入: {user.profile.income_monthly}")
        print(f"{'=' * 60}")
        print(f"{'时间':<12} {'状态':<8} {'页面':<12} {'说明'}")
        print("-" * 60)

        for ts, state, page_subtype in trajectory:
            dt = datetime.fromtimestamp(ts)
            state_name = STATE_NAMES.get(state, state)
            page_name = PAGE_SUBTYPE_NAMES.get(page_subtype, page_subtype) if page_subtype else "-"
            print(f"{dt.strftime('%H:%M:%S'):<12} {state:<8} {page_name:<12} {state_name}")

        print("-" * 60)


def main() -> None:
    """CLI入口函数.

    解析命令行参数，生成用户并运行模拟。
    """
    parser = argparse.ArgumentParser(description="Sati 用户行为模拟器")
    parser.add_argument("-n", "--users", type=int, default=3, help="生成用户数量")
    parser.add_argument("-s", "--steps", type=int, default=20, help="最大模拟步数")
    parser.add_argument("--fake", action="store_true", help="使用模拟API而不是真实API")
    args = parser.parse_args()

    logger.info(f"Sati 模拟器启动 - 生成 {args.users} 个用户, fake={args.fake}")

    sim = Simulator(use_real_api=not args.fake)

    # 生成用户
    users = sim.generator.generate_users(args.users)

    # 运行模拟
    for user in users:
        trajectory = sim.run_user(user, max_steps=args.steps)
        sim.print_trajectory(user, trajectory)

    logger.info("模拟完成")


if __name__ == "__main__":
    main()
