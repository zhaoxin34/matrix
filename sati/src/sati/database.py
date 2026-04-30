"""数据库连接管理 - 使用 SQLAlchemy 连接 MySQL."""

import logging
import random
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from sati.config import DATABASE_URL, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER

logger = logging.getLogger(__name__)

# 创建数据库引擎
engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)

# 创建会话工厂
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy ORM 基类."""

    pass


class UserModel(Base):
    """User ORM 模型类.

    对应数据库中的 users 表，包含用户的23个特征字段。

    Attributes:
        id: 自增主键
        user_id: 用户唯一标识，UUID格式
        age: 年龄，范围18-65
        gender: 性别，0=女，1=男
        marital_status: 婚姻状态，0=未婚，1=已婚，2=离异，3=丧偶
        child_count: 子女数量
        child_age_group: 子女年龄段，0=无，1=婴幼儿，2=小学，3=中学，4=大学+
        has_house: 房产状况，0=无，1=有房贷，2=全款
        has_car: 车辆状况，0=无，1=有车贷，2=全款
        has_mortgage: 是否有房贷，0=无，1=有
        has_car_loan: 是否有车贷，0=无，1=有
        has_other_loan: 是否有其他贷款，0=无，1=有
        dependent_parents: 需赡养父母人数
        occupation_type: 职业类型，1=学生，2=公务员，3=企业职工，4=自由职业，5=个体户，6=退休
        employment_status: 就业状态，1=全职，2=兼职，3=自由，4=失业
        industry: 行业，1=互联网，2=金融，3=制造，4=零售，5=医疗，6=教育，7=其他
        work_experience: 工作年限
        education_level: 学历，1=初中，2=高中，3=大专，4=本科，5=硕士，6=博士
        income_monthly: 月收入（单位：元）
        income_stable: 收入稳定性，1=不稳定，2=基本稳定，3=非常稳定
        savings_level: 存款级别，1=<5万，2=5-20万，3=20-50万，4=50-100万，5=>100万
        has_investment: 是否有投资，0=无，1=有
        spending_style: 消费风格，1=节俭，2=稳健，3=冲动，4=享乐
        payment_preference: 支付偏好，1=信用卡，2=花呗，3=借呗，4=全额
        created_at: 记录创建时间
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    age: Mapped[int]
    gender: Mapped[int]
    marital_status: Mapped[int]
    child_count: Mapped[int]
    child_age_group: Mapped[int]
    has_house: Mapped[int]
    has_car: Mapped[int]
    has_mortgage: Mapped[int]
    has_car_loan: Mapped[int]
    has_other_loan: Mapped[int]
    dependent_parents: Mapped[int]
    occupation_type: Mapped[int]
    employment_status: Mapped[int]
    industry: Mapped[int]
    work_experience: Mapped[int]
    education_level: Mapped[int]
    income_monthly: Mapped[int]
    income_stable: Mapped[int]
    savings_level: Mapped[int]
    has_investment: Mapped[int]
    spending_style: Mapped[int]
    payment_preference: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)


class UserInfoModel(Base):
    """用户登录信息表.

    存储用户用于登录的用户名、邮箱、手机号和密码。

    Attributes:
        id: 自增主键，与 users.id 一一对应
        user_id: 用户唯一标识，UUID格式，外键
        username: 用户名，格式为 user_{id}
        email: 邮箱，格式为 user_{id}@sati-test.com
        phone: 手机号，格式为 138xxxxxxxx
        password: 密码（明文）
        created_at: 记录创建时间
    """

    __tablename__ = "user_info"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    password: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)


def generate_phone() -> str:
    """生成随机手机号.

    使用 138 号段生成11位手机号。

    Returns:
        str: 格式为 138xxxxxxxx 的手机号字符串。
    """
    return f"138{''.join([str(random.randint(0, 9)) for _ in range(8)])}"


def get_session() -> Session:
    """获取数据库会话.

    Returns:
        Session: SQLAlchemy 数据库会话对象。
    """
    return SessionLocal()


def init_database() -> None:
    """初始化数据库.

    创建 sati 数据库（如果不存在）、users 表和 user_info 表。
    """
    # 先连接 MySQL 服务器（不指定数据库），创建 sati 数据库
    temp_url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/"
    temp_engine = create_engine(temp_url, echo=False)

    with temp_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}"))
        conn.commit()

    logger.info(f"数据库 {DB_NAME} 已创建或已存在")

    # 切换到 sati 数据库，创建表
    with engine.connect() as conn:
        # 检查 users 表是否存在
        result = conn.execute(text("SHOW TABLES LIKE 'users'"))
        if not result.fetchone():
            Base.metadata.create_all(engine)
            logger.info("users 表已创建")
        else:
            logger.info("users 表已存在")

        # 检查 user_info 表是否存在
        result = conn.execute(text("SHOW TABLES LIKE 'user_info'"))
        if not result.fetchone():
            Base.metadata.create_all(engine)
            logger.info("user_info 表已创建")
        else:
            logger.info("user_info 表已存在")


def save_users(profiles: list) -> tuple[int, int]:
    """批量保存用户到数据库.

    遍历每个 UserProfile，先保存到 users 表获取自增 id，
    再根据 id 生成登录信息保存到 user_info 表。

    Args:
        profiles: UserProfile 对象列表。

    Returns:
        tuple[int, int]: (成功数量, 失败数量)。
    """
    success_count = 0
    fail_count = 0

    session = get_session()
    try:
        for profile in profiles:
            try:
                # 1. 创建并保存 UserModel
                user = UserModel(
                    user_id=profile.user_id,
                    age=profile.age,
                    gender=profile.gender,
                    marital_status=profile.marital_status,
                    child_count=profile.child_count,
                    child_age_group=profile.child_age_group,
                    has_house=profile.has_house,
                    has_car=profile.has_car,
                    has_mortgage=profile.has_mortgage,
                    has_car_loan=profile.has_car_loan,
                    has_other_loan=profile.has_other_loan,
                    dependent_parents=profile.dependent_parents,
                    occupation_type=profile.occupation_type,
                    employment_status=profile.employment_status,
                    industry=profile.industry,
                    work_experience=profile.work_experience,
                    education_level=profile.education_level,
                    income_monthly=profile.income_monthly,
                    income_stable=profile.income_stable,
                    savings_level=profile.savings_level,
                    has_investment=profile.has_investment,
                    spending_style=profile.spending_style,
                    payment_preference=profile.payment_preference,
                )
                session.add(user)
                session.flush()  # 获取自增 id

                # 2. 根据 user.id 生成登录信息
                user_info = UserInfoModel(
                    user_id=profile.user_id,
                    username=f"user_{user.id}",
                    email=f"user_{user.id}@sati-test.com",
                    phone=generate_phone(),
                    password="abcd1234",
                )
                session.add(user_info)

                success_count += 1
            except Exception as e:
                logger.error(f"处理用户 {profile.user_id} 失败: {e}")
                fail_count += 1

        session.commit()
    except Exception as e:
        logger.error(f"批量保存失败: {e}")
        session.rollback()
    finally:
        session.close()

    return success_count, fail_count


def count_users() -> int:
    """统计数据库中的用户数量.

    Returns:
        int: users 表中的记录总数。
    """
    session = get_session()
    try:
        result = session.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar()
        return count or 0
    finally:
        session.close()


def clear_users() -> int:
    """清除 users 和 user_info 表中的所有数据.

    由于 user_info 有外键约束，先删除 user_info 再删除 users。

    Returns:
        int: 删除的 users 记录数量。
    """
    session = get_session()
    try:
        # 先删除 user_info（外键约束）
        session.execute(text("DELETE FROM user_info"))
        # 再删除 users
        session.execute(text("DELETE FROM users"))
        session.commit()
        return 1
    except Exception as e:
        logger.error(f"清除用户数据失败: {e}")
        session.rollback()
        return 0
    finally:
        session.close()
