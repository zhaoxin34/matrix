"""Interview Agent LangGraph definition."""

from langgraph.graph import END, StateGraph

from agent_service.agents.interview.state import InterviewState


def create_interview_graph() -> StateGraph:
    """Create the interview agent state machine."""

    # Create the graph
    graph = StateGraph(InterviewState)

    # Add nodes
    graph.add_node("start", start_node)
    graph.add_node("ask_question", ask_question_node)
    graph.add_node("wait_answer", wait_answer_node)
    graph.add_node("decide_followup", decide_followup_node)
    graph.add_node("save_turn", save_turn_node)
    graph.add_node("generate_followup", generate_followup_node)
    graph.add_node("end", end_node)

    # Define edges
    graph.add_edge("start", "ask_question")
    graph.add_edge("ask_question", "wait_answer")
    graph.add_edge("wait_answer", "decide_followup")
    graph.add_edge("decide_followup", "save_turn")
    graph.add_edge("save_turn", "ask_question")
    graph.add_edge("generate_followup", "wait_answer")

    # Conditional edges
    graph.add_conditional_edges(
        "decide_followup",
        should_continue,
        {
            "continue": "save_turn",
            "followup": "generate_followup",
            "end": "end",
        },
    )

    # Set entry point
    graph.set_entry_point("start")

    # Set end point
    graph.add_edge("end", END)

    return graph


def start_node(state: InterviewState) -> InterviewState:
    """Initialize interview session."""
    # Parse questions from question tree
    question_tree = state.get("question_tree", {})
    questions = question_tree.get("questions", [])

    return {
        **state,
        "questions": questions,
        "current_question_index": 0,
        "turns": [],
        "should_continue": True,
        "current_followup_depth": 0,
    }


def ask_question_node(state: InterviewState) -> InterviewState:
    """Ask the current question to the expert."""
    questions = state.get("questions", [])
    current_index = state.get("current_question_index", 0)

    if current_index >= len(questions):
        return {**state, "should_continue": False}

    current_question = questions[current_index]
    question_text = current_question.get("text", "")

    return {
        **state,
        "current_question": question_text,
        "current_answer": None,
    }


def wait_answer_node(state: InterviewState) -> InterviewState:
    """Wait for expert's answer.

    In synchronous mode, answer is provided externally.
    In async mode, this would be a checkpoint.
    """
    # The answer is set externally
    return state


def decide_followup_node(state: InterviewState) -> str:
    """Decide whether to ask follow-up questions or continue."""
    current_index = state.get("current_question_index", 0)
    questions = state.get("questions", [])
    current_followup_depth = state.get("current_followup_depth", 0)
    max_followup_depth = state.get("max_followup_depth", 5)
    current_answer = state.get("current_answer")

    # Check if current question has followups configured
    if current_index < len(questions):
        current_question = questions[current_index]
        configured_followups = current_question.get("followups", [])

        # If has configured followups and not exhausted
        if configured_followups and current_followup_depth < len(configured_followups):
            return "followup"

    # Check if we should generate dynamic followup (if answer is informative)
    if current_answer and len(current_answer) > 20 and current_followup_depth < max_followup_depth:
        # Could decide to generate followup based on content
        return "followup"

    # Check if more questions remain
    if current_index < len(questions) - 1:
        return "continue"

    return "end"


def save_turn_node(state: InterviewState) -> InterviewState:
    """Save the current turn to state."""
    from agent_service.agents.interview.state import InterviewTurn

    current_question = state.get("current_question", "")
    current_answer = state.get("current_answer", "")

    if not current_question:
        return state

    questions = state.get("questions", [])
    current_index = state.get("current_question_index", 0)

    turn = InterviewTurn(
        question_id=f"q{current_index + 1}",
        question_text=current_question,
        answer_text=current_answer or "",
        turn_type="followup" if state.get("current_followup_depth", 0) > 0 else "initial",
    )

    turns = state.get("turns", [])
    turns.append(turn)

    return {
        **state,
        "turns": turns,
    }


def generate_followup_node(state: InterviewState) -> InterviewState:
    """Generate and set follow-up question."""
    questions = state.get("questions", [])
    current_index = state.get("current_question_index", 0)
    current_followup_depth = state.get("current_followup_depth", 0)

    followup_text = ""

    # Check for configured followups
    if current_index < len(questions):
        current_question = questions[current_index]
        configured_followups = current_question.get("followups", [])

        if configured_followups and current_followup_depth < len(configured_followups):
            followup_text = configured_followups[current_followup_depth]

    # If no configured followup, the text will be generated by LLM
    # This would be called by the agent's run method

    return {
        **state,
        "current_question": followup_text,
        "current_followup_depth": current_followup_depth + 1,
    }


def end_node(state: InterviewState) -> InterviewState:
    """End the interview session."""
    return {**state, "should_continue": False}


def should_continue(state: InterviewState) -> str:
    """Determine next step based on state."""
    return state.get("next_action", "end")
