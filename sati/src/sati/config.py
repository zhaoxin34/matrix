"""配置中心 - 管理所有可配置参数."""

import os
from pathlib import Path
from typing import Final

# 项目根目录
ROOT_DIR: Final[Path] = Path(__file__).parent.parent.parent

# 日志配置
LOG_DIR: Final[Path] = Path(os.getenv("LOG_DIR", ROOT_DIR / "logs"))
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE: Final[Path] = LOG_DIR / "sati.log"

# 热衰减模型参数
DECAY_LAMBDA: Final[float] = 0.01  # 衰减率

# 时段系数
TIME_MULTIPLIER_HIGH: Final[float] = 1.2  # 高峰时段
TIME_MULTIPLIER_NORMAL: Final[float] = 1.0  # 正常时段
TIME_MULTIPLIER_LOW: Final[float] = 0.3  # 低峰时段

# 职业基础活跃概率
BASE_PROB: Final[dict[int, float]] = {
    1: 0.8,  # 学生
    2: 0.7,  # 公务员
    3: 0.75,  # 企业职工
    4: 0.5,  # 自由职业
    5: 0.6,  # 个体户
    6: 0.4,  # 退休
}

# 状态定义
STATES: Final[list[str]] = ["landing", "login", "browse", "cart", "pay", "exit"]

# 转化矩阵: 当前状态 -> 允许的下一状态
TRANSITION_MATRIX: Final[dict[str, list[str]]] = {
    "landing": ["login", "browse", "exit"],
    "login": ["browse", "exit"],
    "browse": ["landing", "browse", "cart", "exit"],
    "cart": ["landing", "browse", "pay", "exit"],
    "pay": ["landing", "exit"],
    "exit": [],
}

# 权重配置
WEIGHT_CONFIG: Final[dict[str, float]] = {
    "login_base": 0.3,
    "browse_base": 0.5,
    "cart_base": 0.4,
    "pay_base": 0.6,
    "return_base": 0.3,
}
