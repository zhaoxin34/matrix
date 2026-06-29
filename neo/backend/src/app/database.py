"""Database connection and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Initialize database by creating all tables."""
    # Import all models to ensure they are registered with Base
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency to get database session.

    注意：service 中建议显式 self.db.commit() 避免 race condition
    （yield 之后才 commit 会导致 FastAPI 返回 response 后前端立即调 GET 查不到新数据）。
    这里保留 yield-after-commit 作为兑底,显式 commit 是幂等的。
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
