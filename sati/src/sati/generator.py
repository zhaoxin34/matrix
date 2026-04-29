"""用户生成器 - 基于统计分布生成虚拟用户."""

import uuid
from typing import Final

import numpy as np

from sati.user import User, UserProfile, UserState

# 职业分布权重（企业职工占比更高，更符合现实）
OCCUPATION_WEIGHTS: Final[dict[int, float]] = {
    1: 0.10,  # 学生
    2: 0.08,  # 公务员
    3: 0.40,  # 企业职工（最多）
    4: 0.15,  # 自由职业
    5: 0.12,  # 个体户
    6: 0.15,  # 退休
}

# 行业分布权重
INDUSTRY_WEIGHTS: Final[dict[int, float]] = {
    1: 0.25,  # 互联网
    2: 0.12,  # 金融
    3: 0.15,  # 制造
    4: 0.18,  # 零售
    5: 0.08,  # 医疗
    6: 0.10,  # 教育
    7: 0.12,  # 其他
}


class UserGenerator:
    """用户生成器."""

    def __init__(self, seed: int | None = None) -> None:
        """初始化生成器.

        Args:
            seed: 随机种子，用于复现
        """
        self.rng = np.random.default_rng(seed)

    def generate_profile(self) -> UserProfile:
        """生成用户特征.

        分布策略:
        - age: 正态分布(均值30, 标准差10), 范围18-65
        - occupation: 加权均匀分布
        - income_monthly: 对数正态分布，按职业有不同均值
        - 其他: 均匀分布
        """
        # 基础属性
        age = int(self.rng.normal(30, 10))
        age = max(18, min(65, age))  # 限制范围

        gender = self.rng.integers(0, 2)

        # 婚姻状态（与年龄相关）
        if age < 25:
            marital_status = 0  # 未婚
        elif age < 35:
            marital_status = self.rng.choice([0, 1], p=[0.4, 0.6])
        else:
            marital_status = self.rng.choice([0, 1, 2, 3], p=[0.15, 0.65, 0.15, 0.05])

        # 子女数量（与婚姻状态相关）
        if marital_status == 0:
            child_count = 0
        elif marital_status == 1:
            child_count = self.rng.choice([0, 1, 2, 3], p=[0.2, 0.5, 0.25, 0.05])
        else:
            child_count = self.rng.choice([0, 1, 2], p=[0.3, 0.5, 0.2])

        child_age_group = int(self.rng.integers(0, 5)) if child_count > 0 else 0

        # 住房状况
        has_house = self.rng.integers(0, 3)
        has_mortgage = 1 if has_house == 1 else 0

        # 车辆状况
        has_car = self.rng.integers(0, 3)
        has_car_loan = 1 if has_car == 1 else 0

        # 其他贷款
        has_other_loan = self.rng.integers(0, 2)

        # 赡养父母
        dependent_parents = self.rng.integers(0, 5)

        # 职业（加权分布）
        occupations = list(OCCUPATION_WEIGHTS.keys())
        weights = list(OCCUPATION_WEIGHTS.values())
        occupation_type = int(self.rng.choice(occupations, p=weights))

        # 就业状态
        if occupation_type == 1:  # 学生
            employment_status = 4  # 失业/无收入
        elif occupation_type == 6:  # 退休
            employment_status = 4
        else:
            employment_status = self.rng.choice([1, 2, 3], p=[0.8, 0.1, 0.1])

        # 行业
        industries = list(INDUSTRY_WEIGHTS.keys())
        ind_weights = list(INDUSTRY_WEIGHTS.values())
        industry = int(self.rng.choice(industries, p=ind_weights))

        # 工作年限（与年龄相关）
        work_experience = max(0, age - 22)
        if occupation_type == 1 or occupation_type == 6:
            work_experience = 0

        # 学历（与年龄相关）
        if age < 22:
            education_level = self.rng.choice([1, 2, 3, 4], p=[0.2, 0.3, 0.3, 0.2])
        elif age < 28:
            education_level = self.rng.choice([2, 3, 4, 5], p=[0.1, 0.3, 0.4, 0.2])
        else:
            education_level = self.rng.choice([2, 3, 4, 5, 6], p=[0.05, 0.15, 0.45, 0.25, 0.1])

        # 月收入（对数正态分布，按职业）
        income_means: dict[int, float] = {
            1: 3000,  # 学生
            2: 12000,  # 公务员
            3: 15000,  # 企业职工
            4: 10000,  # 自由职业
            5: 8000,  # 个体户
            6: 4000,  # 退休
        }
        income_log_mean = np.log(income_means[occupation_type])
        income_log_std = 0.4
        income_monthly = int(np.exp(self.rng.normal(income_log_mean, income_log_std)))
        income_monthly = max(2000, min(100000, income_monthly))

        # 收入稳定性
        if occupation_type == 1 or occupation_type == 6:
            income_stable = 3 if occupation_type == 6 else 1
        elif employment_status == 1:  # 全职
            income_stable = self.rng.choice([1, 2, 3], p=[0.1, 0.5, 0.4])
        else:
            income_stable = self.rng.choice([1, 2], p=[0.6, 0.4])

        # 存款级别（与收入和工作年限相关）
        total_income = income_monthly * work_experience * 12 if work_experience > 0 else income_monthly * 12
        if total_income < 50000:
            savings_level = 1
        elif total_income < 200000:
            savings_level = 2
        elif total_income < 500000:
            savings_level = 3
        elif total_income < 1000000:
            savings_level = 4
        else:
            savings_level = 5

        # 是否有投资（与存款级别相关）
        has_investment = 1 if savings_level >= 3 and self.rng.random() > 0.3 else 0

        # 消费风格
        spending_style = self.rng.integers(1, 5)

        # 支付偏好
        payment_preference = self.rng.integers(1, 5)

        return UserProfile(
            user_id=str(uuid.uuid4()),
            age=int(age),
            gender=int(gender),
            marital_status=int(marital_status),
            child_count=int(child_count),
            child_age_group=int(child_age_group),
            has_house=int(has_house),
            has_car=int(has_car),
            has_mortgage=int(has_mortgage),
            has_car_loan=int(has_car_loan),
            has_other_loan=int(has_other_loan),
            dependent_parents=int(dependent_parents),
            occupation_type=int(occupation_type),
            employment_status=int(employment_status),
            industry=int(industry),
            work_experience=int(work_experience),
            education_level=int(education_level),
            income_monthly=int(income_monthly),
            income_stable=int(income_stable),
            savings_level=int(savings_level),
            has_investment=int(has_investment),
            spending_style=int(spending_style),
            payment_preference=int(payment_preference),
        )

    def generate_user(self) -> User:
        """生成完整用户（特征 + 初始状态）."""
        profile = self.generate_profile()
        state = UserState()
        return User(profile=profile, state=state)

    def generate_users(self, count: int) -> list[User]:
        """批量生成用户."""
        return [self.generate_user() for _ in range(count)]
