"""用户模型 - 用户特征和状态定义."""

from dataclasses import dataclass, field
from typing import Final

# 用户特征枚举值定义
GENDER: Final[dict[int, str]] = {0: "女", 1: "男"}
MARITAL_STATUS: Final[dict[int, str]] = {0: "未婚", 1: "已婚", 2: "离异", 3: "丧偶"}
CHILD_AGE_GROUP: Final[dict[int, str]] = {0: "无", 1: "婴幼儿", 2: "小学", 3: "中学", 4: "大学+"}
HAS_HOUSE: Final[dict[int, str]] = {0: "无", 1: "有房贷", 2: "全款"}
HAS_CAR: Final[dict[int, str]] = {0: "无", 1: "有车贷", 2: "全款"}
OCCUPATION_TYPE: Final[dict[int, str]] = {1: "学生", 2: "公务员", 3: "企业职工", 4: "自由职业", 5: "个体户", 6: "退休"}
EMPLOYMENT_STATUS: Final[dict[int, str]] = {1: "全职", 2: "兼职", 3: "自由", 4: "失业"}
INDUSTRY: Final[dict[int, str]] = {1: "互联网", 2: "金融", 3: "制造", 4: "零售", 5: "医疗", 6: "教育", 7: "其他"}
EDUCATION_LEVEL: Final[dict[int, str]] = {1: "初中", 2: "高中", 3: "大专", 4: "本科", 5: "硕士", 6: "博士"}
INCOME_STABLE: Final[dict[int, str]] = {1: "不稳定", 2: "基本稳定", 3: "非常稳定"}
SAVINGS_LEVEL: Final[dict[int, str]] = {1: "<5万", 2: "5-20万", 3: "20-50万", 4: "50-100万", 5: ">100万"}
SPENDING_STYLE: Final[dict[int, str]] = {1: "节俭", 2: "稳健", 3: "冲动", 4: "享乐"}
PAYMENT_PREFERENCE: Final[dict[int, str]] = {1: "信用卡", 2: "花呗", 3: "借呗", 4: "全额"}


@dataclass
class UserProfile:
    """用户特征（17个字段）."""

    user_id: str
    age: int
    gender: int  # 0女/1男
    marital_status: int
    child_count: int
    child_age_group: int
    has_house: int
    has_car: int
    has_mortgage: int
    has_car_loan: int
    has_other_loan: int
    dependent_parents: int
    occupation_type: int
    employment_status: int
    industry: int
    work_experience: int
    education_level: int
    income_monthly: int
    income_stable: int
    savings_level: int
    has_investment: int
    spending_style: int
    payment_preference: int

    def to_dict(self) -> dict:
        """转换为字典."""
        return {
            "user_id": self.user_id,
            "age": self.age,
            "gender": self.gender,
            "marital_status": self.marital_status,
            "child_count": self.child_count,
            "child_age_group": self.child_age_group,
            "has_house": self.has_house,
            "has_car": self.has_car,
            "has_mortgage": self.has_mortgage,
            "has_car_loan": self.has_car_loan,
            "has_other_loan": self.has_other_loan,
            "dependent_parents": self.dependent_parents,
            "occupation_type": self.occupation_type,
            "employment_status": self.employment_status,
            "industry": self.industry,
            "work_experience": self.work_experience,
            "education_level": self.education_level,
            "income_monthly": self.income_monthly,
            "income_stable": self.income_stable,
            "savings_level": self.savings_level,
            "has_investment": self.has_investment,
            "spending_style": self.spending_style,
            "payment_preference": self.payment_preference,
        }


@dataclass
class UserState:
    """用户状态（4个字段）."""

    last_active_time: int = 0  # Unix 时间戳
    last_exit_time: int = 0
    session_count: int = 0
    current_state: str = "landing"  # 落地页/登录/浏览/加购/支付/退出

    def to_dict(self) -> dict:
        """转换为字典."""
        return {
            "last_active_time": self.last_active_time,
            "last_exit_time": self.last_exit_time,
            "session_count": self.session_count,
            "current_state": self.current_state,
        }


@dataclass
class User:
    """用户（特征 + 状态）."""

    profile: UserProfile
    state: UserState = field(default_factory=UserState)

    def to_dict(self) -> dict:
        """转换为字典."""
        return {
            "profile": self.profile.to_dict(),
            "state": self.state.to_dict(),
        }
