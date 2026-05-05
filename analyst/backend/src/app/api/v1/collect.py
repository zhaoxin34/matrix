"""Collect API endpoint for user event collection and page feedback."""

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.error_codes import ERROR_CODE_SESSION_NOT_FOUND
from app.database import get_db
from app.models.event import Event
from app.models.order import Order
from app.schemas.collect import CollectRequest, CollectResponse
from app.schemas.response import ApiResponse
from app.services.page_feedback import page_feedback_service
from app.services.session import UserState, session_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/collect", tags=["collect"])


def _map_action_to_state(action: str) -> UserState | None:
    """Map action string to UserState enum."""
    mapping = {
        "landing": UserState.LANDING,
        "login": UserState.LOGIN,
        "browse": UserState.BROWSE,
        "add_cart": UserState.CART,
        "cart": UserState.CART,
        "pay": UserState.PAY,
        "exit": UserState.EXIT,
    }
    return mapping.get(action)


@router.post("", response_model=ApiResponse[CollectResponse])
async def collect_event(
    request: CollectRequest,
    db: Session = Depends(get_db),
) -> ApiResponse[CollectResponse]:
    """Collect user event and return page state.

    This endpoint is called by sati/page_feedback.py instead of FakePageFeedback.
    It:
    1. Records the user event to dwd_fact_events
    2. Updates session state
    3. Calculates next PageState based on state machine
    4. If action is 'pay', creates order in dwd_fact_orders
    5. Returns PageState for sati to use

    Args:
        request: CollectRequest with session_id, user_id, action, current_state, etc.
        db: Database session

    Returns:
        ApiResponse containing PageState and session_id
    """
    now = datetime.now(timezone.utc)
    logger.info(f"Collect event: session={request.session_id}, action={request.action}, state={request.current_state}")

    # Validate action
    if request.action not in ("landing", "login", "browse", "add_cart", "cart", "pay", "exit"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action: {request.action}",
        )

    # Get or create session
    session = session_manager.get_or_create_session(request.session_id, request.user_id)

    # Record event to database
    event_record = Event(
        session_id=request.session_id,
        user_id=request.user_id,
        event_name=request.action,
        current_state=request.current_state,
        event_value=json.dumps(request.event_value) if request.event_value else None,
        ip_address=request.ip_address,
        user_agent=request.user_agent,
        event_time=now,
        etl_time=now,
    )
    db.add(event_record)

    # If action is 'pay', create order
    order_id = None
    if request.action == "pay":
        # Get amount from page_attributes in session or use default
        amount = session.current_page_attributes.amount or 100.0
        order_id = f"ORD_{datetime.now(timezone.utc).timestamp():.0f}"

        order = Order(
            original_order_id=order_id,
            user_id=request.user_id or "guest",
            session_id=request.session_id,
            order_status="paid",
            is_paid=1,
            is_completed=0,
            total_amount=amount,
            created_at=now,
            paid_at=now,
            etl_time=now,
        )
        db.add(order)
        logger.info(f"Order created: {order_id}, amount={amount}")

    db.commit()

    # Record event in session
    event_history = {
        "action": request.action,
        "current_state": request.current_state,
        "event_value": request.event_value,
        "timestamp": now.isoformat(),
    }
    session.action_history.append(event_history)
    session.last_action = request.action

    # Map action to new state
    new_state = _map_action_to_state(request.action)
    if new_state is None:
        new_state = UserState.EXIT

    # Get page state from service (pass db to load products if needed)
    page_state = page_feedback_service.get_page_state(session, request.action, db)

    # If this was a pay action, include order_id in response
    if order_id:
        page_state.page_attributes.order_id = order_id

    # Update session state
    session.update_state(
        new_state=new_state,
        page_subtype=page_state.page_subtype,
        page_attributes=page_state.page_attributes,
    )
    session_manager.update_session(session)

    response = CollectResponse(
        page_state=page_state,
        session_id=session.session_id,
    )

    logger.info(f"Response: page_type={page_state.page_type}, page_subtype={page_state.page_subtype}")

    return ApiResponse.success(data=response)


@router.get("/session/{session_id}", response_model=ApiResponse[dict])
async def get_session(session_id: str) -> ApiResponse[dict]:
    """Get session info by session_id.

    Args:
        session_id: User session ID

    Returns:
        ApiResponse containing session data
    """
    session = session_manager.get_session(session_id)
    if session is None:
        return ApiResponse.error(code=ERROR_CODE_SESSION_NOT_FOUND, message=f"Session not found: {session_id}")

    return ApiResponse.success(
        data={
            "session_id": session.session_id,
            "user_id": session.user_id,
            "current_state": session.current_state.value,
            "current_page_subtype": session.current_page_subtype,
            "last_action": session.last_action,
            "action_count": len(session.action_history),
        }
    )
