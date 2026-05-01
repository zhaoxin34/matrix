"""配置中心 - 管理所有可配置参数."""

import os
import tomllib
from pathlib import Path

from dotenv import load_dotenv

# 项目根目录
ROOT_DIR: Path = Path(__file__).parent.parent.parent

# 加载 .env 文件
load_dotenv(ROOT_DIR / ".env")

# 加载 config.toml
CONFIG_FILE: Path = ROOT_DIR / "config.toml"
with open(CONFIG_FILE, "rb") as f:
    _config = tomllib.load(f)

# ============ 日志配置 ============
LOG_DIR: Path = Path(os.getenv("LOG_DIR", ROOT_DIR / "logs"))
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE: Path = LOG_DIR / "sati.log"

# ============ 热衰减模型参数 ============
DECAY_LAMBDA: float = _config["decay"]["lambda"]

# 时段系数
TIME_MULTIPLIER_HIGH: float = _config["time_multiplier"]["high"]
TIME_MULTIPLIER_NORMAL: float = _config["time_multiplier"]["normal"]
TIME_MULTIPLIER_LOW: float = _config["time_multiplier"]["low"]

# 职业基础活跃概率
BASE_PROB: dict[int, float] = {
    1: _config["base_prob"]["student"],
    2: _config["base_prob"]["civil_servant"],
    3: _config["base_prob"]["enterprise_employee"],
    4: _config["base_prob"]["freelancer"],
    5: _config["base_prob"]["_self_employed"],
    6: _config["base_prob"]["retiree"],
}

# ============ 状态定义 ============
STATES: list[str] = _config["states"]["list"]

# 转化矩阵: 当前状态 -> 允许的下一状态
TRANSITION_MATRIX: dict[str, list[str]] = _config["transition_matrix"]

# ============ 权重配置 ============
WEIGHT_CONFIG: dict[str, float] = _config["weight"]

# ============ 数据库配置 ============
DB_HOST: str = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
DB_USER: str = os.getenv("DB_USER", "root")
DB_PASSWORD: str = os.getenv("DB_PASSWORD", "root")
DB_NAME: str = os.getenv("DB_NAME", "sati")

# 数据库连接URL
DATABASE_URL: str = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
