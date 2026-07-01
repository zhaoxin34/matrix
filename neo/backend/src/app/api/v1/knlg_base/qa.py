"""QA Library API endpoints: QuestionTree, Question, InterviewSession, Interview, Turn, TurnRef."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.knlg_base import (
    InterviewCreate,
    InterviewEndResponse,
    InterviewResponse,
    InterviewSessionCreate,
    InterviewSessionResponse,
    InterviewSessionUpdate,
    InterviewTurnCreate,
    InterviewTurnReorderRequest,
    InterviewTurnResponse,
    InterviewTurnUpdate,
    QuestionCreate,
    QuestionImportRequest,
    QuestionImportResponse,
    QuestionListResponse,
    QuestionResponse,
    QuestionTreeCreate,
    QuestionTreeListResponse,
    QuestionTreeResponse,
    QuestionTreeUpdate,
    QuestionUpdate,
    StatsSummaryResponse,
    TurnRefCreate,
    TurnRefListResponse,
    TurnRefResponse,
)
from app.schemas.response import ApiResponse
from app.services.knlg_base.qa import (
    KnlgImportService,
    KnlgInterviewService,
    KnlgInterviewSessionService,
    KnlgInterviewTurnRefService,
    KnlgInterviewTurnService,
    KnlgQuestionService,
    KnlgQuestionTreeService,
    KnlgStatsService,
)

router = APIRouter(prefix="/qa", tags=["knlg-base.qa"])


def get_tree_service(db: Session = Depends(get_db)) -> KnlgQuestionTreeService:
    return KnlgQuestionTreeService(db)


def get_question_service(db: Session = Depends(get_db)) -> KnlgQuestionService:
    return KnlgQuestionService(db)


def get_session_service(db: Session = Depends(get_db)) -> KnlgInterviewSessionService:
    return KnlgInterviewSessionService(db)


def get_interview_service(db: Session = Depends(get_db)) -> KnlgInterviewService:
    return KnlgInterviewService(db)


def get_turn_service(db: Session = Depends(get_db)) -> KnlgInterviewTurnService:
    return KnlgInterviewTurnService(db)


def get_ref_service(db: Session = Depends(get_db)) -> KnlgInterviewTurnRefService:
    return KnlgInterviewTurnRefService(db)


def get_stats_service(db: Session = Depends(get_db)) -> KnlgStatsService:
    return KnlgStatsService(db)


def get_import_service(db: Session = Depends(get_db)) -> KnlgImportService:
    return KnlgImportService(db)


# ==================== Question Trees ====================


@router.get("/question-trees", response_model=ApiResponse[QuestionTreeListResponse])
def list_trees(
    workspace_code: str,
    page: int = 1,
    page_size: int = 20,
    domain: str | None = None,
    is_active: bool | None = None,
    service: KnlgQuestionTreeService = Depends(get_tree_service),
    current_user: User = Depends(get_current_user),
):
    items, total = service.list_trees(workspace_code, current_user, page, page_size, domain, is_active)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return ApiResponse.success(
        QuestionTreeListResponse(
            items=[QuestionTreeResponse.model_validate(t) for t in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.post("/question-trees", response_model=ApiResponse[QuestionTreeResponse])
def create_tree(
    workspace_code: str,
    data: QuestionTreeCreate,
    service: KnlgQuestionTreeService = Depends(get_tree_service),
    current_user: User = Depends(get_current_user),
):
    tree = service.create_tree(workspace_code, current_user, data.model_dump())
    return ApiResponse.success(QuestionTreeResponse.model_validate(tree))


@router.get("/question-trees/{tree_id}", response_model=ApiResponse[QuestionTreeResponse])
def get_tree(
    workspace_code: str,
    tree_id: int,
    service: KnlgQuestionTreeService = Depends(get_tree_service),
    current_user: User = Depends(get_current_user),
):
    tree = service.get_tree(workspace_code, current_user, tree_id)
    return ApiResponse.success(QuestionTreeResponse.model_validate(tree))


@router.post("/question-trees/{tree_id}/clone", response_model=ApiResponse[QuestionTreeResponse])
def clone_tree(
    workspace_code: str,
    tree_id: int,
    service: KnlgQuestionTreeService = Depends(get_tree_service),
    current_user: User = Depends(get_current_user),
):
    tree = service.clone_tree(workspace_code, current_user, tree_id)
    return ApiResponse.success(QuestionTreeResponse.model_validate(tree))


@router.put("/question-trees/{tree_id}", response_model=ApiResponse[QuestionTreeResponse])
def update_tree(
    workspace_code: str,
    tree_id: int,
    data: QuestionTreeUpdate,
    service: KnlgQuestionTreeService = Depends(get_tree_service),
    current_user: User = Depends(get_current_user),
):
    tree = service.update_tree(workspace_code, current_user, tree_id, data.model_dump(exclude_unset=True))
    return ApiResponse.success(QuestionTreeResponse.model_validate(tree))


@router.delete("/question-trees/{tree_id}")
def delete_tree(
    workspace_code: str,
    tree_id: int,
    service: KnlgQuestionTreeService = Depends(get_tree_service),
    current_user: User = Depends(get_current_user),
):
    service.delete_tree(workspace_code, current_user, tree_id)
    return ApiResponse.success(None)


# ==================== Questions ====================


@router.get("/questions", response_model=ApiResponse[QuestionListResponse])
def list_questions(
    workspace_code: str,
    page: int = 1,
    page_size: int = 20,
    domain: str | None = None,
    status: str | None = None,
    tags: str | None = None,
    keyword: str | None = None,
    tree_id: int | None = None,
    service: KnlgQuestionService = Depends(get_question_service),
    current_user: User = Depends(get_current_user),
):
    tag_list = [t.strip() for t in tags.split(",")] if tags else None
    items, total = service.list_questions(
        workspace_code,
        current_user,
        page,
        page_size,
        domain=domain,
        status=status,
        tags=tag_list,
        keyword=keyword,
        tree_id=tree_id,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return ApiResponse.success(
        QuestionListResponse(
            items=[QuestionResponse.model_validate(q) for q in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.post("/questions", response_model=ApiResponse[QuestionResponse])
def create_question(
    workspace_code: str,
    data: QuestionCreate,
    service: KnlgQuestionService = Depends(get_question_service),
    current_user: User = Depends(get_current_user),
):
    q = service.create_question(workspace_code, current_user, data.model_dump())
    return ApiResponse.success(QuestionResponse.model_validate(q))


@router.get("/questions/{question_id}", response_model=ApiResponse[QuestionResponse])
def get_question(
    workspace_code: str,
    question_id: int,
    service: KnlgQuestionService = Depends(get_question_service),
    current_user: User = Depends(get_current_user),
):
    q = service.get_question(workspace_code, current_user, question_id)
    return ApiResponse.success(QuestionResponse.model_validate(q))


@router.put("/questions/{question_id}", response_model=ApiResponse[QuestionResponse])
def update_question(
    workspace_code: str,
    question_id: int,
    data: QuestionUpdate,
    service: KnlgQuestionService = Depends(get_question_service),
    current_user: User = Depends(get_current_user),
):
    q = service.update_question(workspace_code, current_user, question_id, data.model_dump(exclude_unset=True))
    return ApiResponse.success(QuestionResponse.model_validate(q))


@router.patch("/questions/{question_id}/archive", response_model=ApiResponse[QuestionResponse])
def archive_question(
    workspace_code: str,
    question_id: int,
    service: KnlgQuestionService = Depends(get_question_service),
    current_user: User = Depends(get_current_user),
):
    q = service.archive_question(workspace_code, current_user, question_id)
    return ApiResponse.success(QuestionResponse.model_validate(q))


# ==================== Interview Sessions ====================


@router.get("/sessions", response_model=ApiResponse[list[InterviewSessionResponse]])
def list_sessions(
    workspace_code: str,
    page: int = 1,
    page_size: int = 20,
    expert_id: int | None = None,
    mode: str | None = None,
    service: KnlgInterviewSessionService = Depends(get_session_service),
    current_user: User = Depends(get_current_user),
):
    items, total = service.list_sessions(workspace_code, current_user, page, page_size, expert_id, mode)
    return ApiResponse.success([InterviewSessionResponse.model_validate(s) for s in items])


@router.post("/sessions", response_model=ApiResponse[InterviewSessionResponse])
def create_session(
    workspace_code: str,
    data: InterviewSessionCreate,
    service: KnlgInterviewSessionService = Depends(get_session_service),
    current_user: User = Depends(get_current_user),
):
    s = service.create_session(workspace_code, current_user, data.model_dump())
    return ApiResponse.success(InterviewSessionResponse.model_validate(s))


@router.get("/sessions/{session_id}", response_model=ApiResponse[InterviewSessionResponse])
def get_session(
    workspace_code: str,
    session_id: int,
    service: KnlgInterviewSessionService = Depends(get_session_service),
    current_user: User = Depends(get_current_user),
):
    s = service.get_session(workspace_code, current_user, session_id)
    return ApiResponse.success(InterviewSessionResponse.model_validate(s))


@router.put("/sessions/{session_id}", response_model=ApiResponse[InterviewSessionResponse])
def update_session(
    workspace_code: str,
    session_id: int,
    data: InterviewSessionUpdate,
    service: KnlgInterviewSessionService = Depends(get_session_service),
    current_user: User = Depends(get_current_user),
):
    s = service.update_session(workspace_code, current_user, session_id, data.model_dump(exclude_unset=True))
    return ApiResponse.success(InterviewSessionResponse.model_validate(s))


@router.post("/sessions/{session_id}/end")
def end_session(
    workspace_code: str,
    session_id: int,
    service: KnlgInterviewSessionService = Depends(get_session_service),
    current_user: User = Depends(get_current_user),
):
    s = service.end_session(workspace_code, current_user, session_id)
    return ApiResponse.success(InterviewSessionResponse.model_validate(s))


# ==================== Interviews ====================


@router.get("/interviews", response_model=ApiResponse[list[InterviewResponse]])
def list_interviews(
    workspace_code: str,
    page: int = 1,
    page_size: int = 20,
    session_id: int | None = None,
    question_id: int | None = None,
    expert_id: int | None = None,
    mode: str | None = None,
    service: KnlgInterviewService = Depends(get_interview_service),
    current_user: User = Depends(get_current_user),
):
    items, total = service.list_interviews(
        workspace_code,
        current_user,
        page,
        page_size,
        session_id,
        question_id,
        expert_id,
        mode,
    )
    return ApiResponse.success([InterviewResponse.model_validate(i) for i in items])


@router.post("/interviews", response_model=ApiResponse[InterviewResponse])
def create_interview(
    workspace_code: str,
    data: InterviewCreate,
    service: KnlgInterviewService = Depends(get_interview_service),
    current_user: User = Depends(get_current_user),
):
    i = service.create_interview(workspace_code, current_user, data.model_dump())
    return ApiResponse.success(InterviewResponse.model_validate(i))


@router.get("/interviews/{interview_id}", response_model=ApiResponse[InterviewResponse])
def get_interview(
    workspace_code: str,
    interview_id: int,
    service: KnlgInterviewService = Depends(get_interview_service),
    current_user: User = Depends(get_current_user),
):
    i = service.get_interview(workspace_code, current_user, interview_id)
    return ApiResponse.success(InterviewResponse.model_validate(i))


@router.post("/interviews/{interview_id}/end", response_model=ApiResponse[InterviewEndResponse])
def end_interview(
    workspace_code: str,
    interview_id: int,
    service: KnlgInterviewService = Depends(get_interview_service),
    current_user: User = Depends(get_current_user),
):
    i = service.end_interview(workspace_code, current_user, interview_id)
    return ApiResponse.success(InterviewEndResponse.model_validate(i))


# ==================== Interview Turns ====================


@router.get("/interviews/{interview_id}/turns", response_model=ApiResponse[list[InterviewTurnResponse]])
def list_turns(
    workspace_code: str,
    interview_id: int,
    service: KnlgInterviewTurnService = Depends(get_turn_service),
    current_user: User = Depends(get_current_user),
):
    turns = service.list_turns(workspace_code, current_user, interview_id)
    return ApiResponse.success([InterviewTurnResponse.model_validate(t) for t in turns])


@router.post("/interviews/{interview_id}/turns", response_model=ApiResponse[InterviewTurnResponse])
def add_turn(
    workspace_code: str,
    interview_id: int,
    data: InterviewTurnCreate,
    service: KnlgInterviewTurnService = Depends(get_turn_service),
    current_user: User = Depends(get_current_user),
):
    t = service.add_turn(workspace_code, current_user, interview_id, data.model_dump(exclude_unset=True))
    return ApiResponse.success(InterviewTurnResponse.model_validate(t))


@router.put("/interviews/{interview_id}/turns/{turn_id}", response_model=ApiResponse[InterviewTurnResponse])
def update_turn(
    workspace_code: str,
    interview_id: int,
    turn_id: int,
    data: InterviewTurnUpdate,
    service: KnlgInterviewTurnService = Depends(get_turn_service),
    current_user: User = Depends(get_current_user),
):
    t = service.update_turn(workspace_code, current_user, interview_id, turn_id, data.model_dump(exclude_unset=True))
    return ApiResponse.success(InterviewTurnResponse.model_validate(t))


@router.delete("/interviews/{interview_id}/turns/{turn_id}")
def delete_turn(
    workspace_code: str,
    interview_id: int,
    turn_id: int,
    service: KnlgInterviewTurnService = Depends(get_turn_service),
    current_user: User = Depends(get_current_user),
):
    service.delete_turn(workspace_code, current_user, interview_id, turn_id)
    return ApiResponse.success(None)


@router.put("/interviews/{interview_id}/turns/reorder")
def reorder_turns(
    workspace_code: str,
    interview_id: int,
    data: InterviewTurnReorderRequest,
    service: KnlgInterviewTurnService = Depends(get_turn_service),
    current_user: User = Depends(get_current_user),
):
    service.reorder_turns(workspace_code, current_user, interview_id, data.items)
    return ApiResponse.success(None)


# ==================== Turn References ====================


@router.get("/turns/{turn_id}/refs", response_model=ApiResponse[TurnRefListResponse])
def list_refs(
    workspace_code: str,
    turn_id: int,
    relation: str | None = None,
    service: KnlgInterviewTurnRefService = Depends(get_ref_service),
    current_user: User = Depends(get_current_user),
):
    refs = service.list_refs(workspace_code, current_user, turn_id, relation)
    total = len(refs)
    return ApiResponse.success(
        TurnRefListResponse(
            items=[TurnRefResponse.model_validate(r) for r in refs],
            total=total,
            page=1,
            page_size=total if total > 0 else 20,
            total_pages=1,
        )
    )


@router.post("/turn-refs", response_model=ApiResponse[TurnRefResponse])
def create_ref(
    workspace_code: str,
    data: TurnRefCreate,
    service: KnlgInterviewTurnRefService = Depends(get_ref_service),
    current_user: User = Depends(get_current_user),
):
    ref = service.create_ref(workspace_code, current_user, data.model_dump())
    return ApiResponse.success(TurnRefResponse.model_validate(ref))


@router.delete("/turn-refs/{ref_id}")
def delete_ref(
    workspace_code: str,
    ref_id: int,
    service: KnlgInterviewTurnRefService = Depends(get_ref_service),
    current_user: User = Depends(get_current_user),
):
    service.delete_ref(workspace_code, current_user, ref_id)
    return ApiResponse.success(None)


# ==================== Phase 2 W7: Stats + Import + Export ====================


@router.get("/stats/summary", response_model=ApiResponse[StatsSummaryResponse])
def get_stats(
    workspace_code: str,
    service: KnlgStatsService = Depends(get_stats_service),
    current_user: User = Depends(get_current_user),
):
    return ApiResponse.success(service.summary(workspace_code, current_user))


@router.post("/questions/import", response_model=ApiResponse[QuestionImportResponse])
def import_questions(
    data: QuestionImportRequest,
    service: KnlgImportService = Depends(get_import_service),
    current_user: User = Depends(get_current_user),
):
    """Bulk import questions (Phase 2 W7)."""
    items = [q.model_dump() for q in data.questions]
    result = service.import_questions(data.workspace_code, current_user, items)
    return ApiResponse.success(result)


@router.get("/questions/export")
def export_questions(
    workspace_code: str,
    domain: str | None = None,
    service: KnlgImportService = Depends(get_import_service),
    current_user: User = Depends(get_current_user),
):
    """Export questions as JSON (Phase 2 W7)."""
    items = service.export_questions(workspace_code, current_user, domain)
    return ApiResponse.success(items)
