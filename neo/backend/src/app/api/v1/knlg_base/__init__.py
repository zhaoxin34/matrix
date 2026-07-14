"""knlg-base API routers package."""

from fastapi import APIRouter

from app.api.v1.knlg_base.import_ import router as import_router
from app.api.v1.knlg_base.knowledge import router as knowledge_router
from app.api.v1.knlg_base.qa import router as qa_router
from app.api.v1.knlg_base.rule import router as rule_router


def get_knlg_base_router() -> APIRouter:
    """Aggregate router for all knlg-base sub-modules."""
    router = APIRouter()
    router.include_router(knowledge_router)
    router.include_router(qa_router)
    router.include_router(rule_router)
    router.include_router(import_router)

    return router


__all__ = ["get_knlg_base_router"]
