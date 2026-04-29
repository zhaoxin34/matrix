"""Sati - 用户行为模拟系统 - CLI入口."""

import argparse
import logging
import sys
from datetime import datetime

from sati.calculator import WeightCalculator
from sati.config import LOG_FILE
from sati.engine import ActivityEngine
from sati.generator import UserGenerator
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


class Simulator:
    """模拟器."""

    def __init__(self) -> None:
        """初始化模拟器."""
        self.generator = UserGenerator(seed=42)
        self.state_machine = StateMachine()
        self.calculator = WeightCalculator()
        self.engine = ActivityEngine()

    def select_next_action(self, user: User, current_time: int) -> str | None:
        """选择下一个动作.

        公式: argmax [ Active(time, user) × W(current_state, action) ]
        """
        current_state = user.state.current_state
        allowed_states = self.state_machine.get_allowed_states(current_state)

        if not allowed_states:
            return None

        # 计算每个允许动作的得分
        scores: dict[str, float] = {}
        active_prob = self.engine.calc_activity_probability(user, current_time)
        for next_state in allowed_states:
            weight = self.calculator.get_weight(user, current_state, next_state)
            # 退出：活跃度越高越不可能退出
            if next_state == "exit":
                score = 1 - active_prob
            else:
                score = active_prob * weight
            scores[next_state] = score

        # 选取得分最高的动作
        if not scores:
            return None
        return max(scores, key=scores.get)  # type: ignore

    def step(self, user: User, current_time: int) -> str | None:
        """执行一步模拟.

        Returns:
            下一个状态，或None如果无法继续
        """
        next_state = self.select_next_action(user, current_time)
        if next_state is None:
            return None

        # 执行状态转移
        self.state_machine.transition(user, next_state)

        # 更新活跃时间
        if next_state != "exit":
            user.state.last_active_time = current_time
        else:
            user.state.last_exit_time = current_time
            user.state.session_count += 1

        return next_state

    def run_user(self, user: User, max_steps: int = 20) -> list[tuple[int, str]]:
        """运行单个用户的模拟.

        Returns:
            行为轨迹列表 [(时间戳, 状态), ...]
        """
        trajectory = [(int(datetime.now().timestamp()), user.state.current_state)]
        current_time = int(datetime.now().timestamp())

        for _ in range(max_steps):
            next_state = self.step(user, current_time)
            if next_state is None or next_state == "exit":
                break
            current_time += 60  # 假设每步1分钟
            trajectory.append((current_time, next_state))

        return trajectory

    def print_trajectory(self, user: User, trajectory: list[tuple[int, str]]) -> None:
        """打印行为轨迹."""
        print(f"\n{'=' * 60}")
        print(f"用户ID: {user.profile.user_id[:8]}...")
        print(f"职业: {user.profile.occupation_type}, 年龄: {user.profile.age}, 收入: {user.profile.income_monthly}")
        print(f"{'=' * 60}")
        print(f"{'时间':<12} {'状态':<10} {'说明'}")
        print("-" * 60)

        for ts, state in trajectory:
            dt = datetime.fromtimestamp(ts)
            state_names = {
                "landing": "落地页",
                "login": "登录",
                "browse": "浏览",
                "cart": "加购",
                "pay": "支付",
                "exit": "退出",
            }
            name = state_names.get(state, state)
            print(f"{dt.strftime('%H:%M:%S'):<12} {state:<10} {name}")

        print("-" * 60)


def main() -> None:
    """CLI入口."""
    parser = argparse.ArgumentParser(description="Sati 用户行为模拟器")
    parser.add_argument("-n", "--users", type=int, default=3, help="生成用户数量")
    parser.add_argument("-s", "--steps", type=int, default=20, help="最大模拟步数")
    args = parser.parse_args()

    logger.info(f"Sati 模拟器启动 - 生成 {args.users} 个用户")

    sim = Simulator()

    # 生成用户
    users = sim.generator.generate_users(args.users)

    # 运行模拟
    for user in users:
        trajectory = sim.run_user(user, max_steps=args.steps)
        sim.print_trajectory(user, trajectory)

    logger.info("模拟完成")


if __name__ == "__main__":
    main()
