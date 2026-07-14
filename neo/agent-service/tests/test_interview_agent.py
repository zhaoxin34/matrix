"""Tests for Interview Agent - LangGraph state machine."""


class TestInterviewState:
    """Test cases for interview state definition."""

    def test_initial_state(self):
        """Test initial state structure."""
        from agent_service.agents.interview.state import InterviewState

        state: InterviewState = {
            "workspace_code": "crm",
            "expert_id": 1,
            "question_tree": {"questions": [{"id": "q1", "text": "问题1"}]},
            "questions": [{"id": "q1", "text": "问题1"}],
            "current_question_index": 0,
            "interview_id": None,
            "session_id": None,
            "turns": [],
            "current_question": None,
            "current_answer": None,
            "should_continue": True,
            "max_followup_depth": 5,
            "current_followup_depth": 0,
        }

        assert state["workspace_code"] == "crm"
        assert state["expert_id"] == 1
        assert state["current_question_index"] == 0
        assert len(state["questions"]) == 1

    def test_state_with_turns(self):
        """Test state with completed turns."""
        from agent_service.agents.interview.state import InterviewState, InterviewTurn

        turn = InterviewTurn(
            question_id="q1",
            question_text="问题1",
            answer_text="回答1",
            turn_type="initial",
        )

        state: InterviewState = {
            "workspace_code": "crm",
            "expert_id": 1,
            "question_tree": {"questions": []},
            "questions": [],
            "current_question_index": 0,
            "interview_id": None,
            "session_id": None,
            "turns": [turn],
            "current_question": None,
            "current_answer": None,
            "should_continue": True,
            "max_followup_depth": 5,
            "current_followup_depth": 0,
        }

        assert len(state["turns"]) == 1
        assert state["turns"][0].question_text == "问题1"


class TestInterviewGraph:
    """Test cases for interview LangGraph."""

    def test_graph_creation(self):
        """Test that interview graph can be created."""
        from agent_service.agents.interview.graph import create_interview_graph

        graph = create_interview_graph()
        assert graph is not None
        # Graph should have nodes
        assert hasattr(graph, "nodes")

    def test_graph_has_required_nodes(self):
        """Test that graph has all required nodes."""
        from agent_service.agents.interview.graph import create_interview_graph

        graph = create_interview_graph()
        node_names = list(graph.nodes.keys())

        # Should have these nodes
        required_nodes = ["start", "ask_question", "wait_answer", "decide_followup", "end"]
        for node in required_nodes:
            assert node in node_names, f"Missing node: {node}"

    def test_graph_compiles(self):
        """Test that graph compiles without error."""
        from agent_service.agents.interview.graph import create_interview_graph

        graph = create_interview_graph()
        # Should be able to get compiled graph
        compiled = graph.compile()
        assert compiled is not None


class TestLLMDispatcher:
    """Test cases for LLM dispatcher."""

    def test_dispatcher_initialization(self):
        """Test LLM dispatcher initialization."""
        from agent_service.agents.interview.llm_dispatcher import LLMDispatcher

        dispatcher = LLMDispatcher(
            base_url="https://api.openai.com/v1",
            api_key="test-key",
            model="gpt-4o",
        )

        assert dispatcher.base_url == "https://api.openai.com/v1"
        assert dispatcher.model == "gpt-4o"

    def test_build_messages_system_prompt(self):
        """Test building messages with system prompt."""
        from agent_service.agents.interview.llm_dispatcher import LLMDispatcher

        dispatcher = LLMDispatcher(
            base_url="https://api.openai.com/v1",
            api_key="test-key",
            model="gpt-4o",
        )

        system_prompt = "你是一个访谈助手"
        user_message = "请介绍一下你自己"

        messages = dispatcher.build_messages(system_prompt, user_message)

        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[0]["content"] == system_prompt
        assert messages[1]["role"] == "user"
        assert messages[1]["content"] == user_message

    def test_build_messages_with_history(self):
        """Test building messages with conversation history."""
        from agent_service.agents.interview.llm_dispatcher import LLMDispatcher

        dispatcher = LLMDispatcher(
            base_url="https://api.openai.com/v1",
            api_key="test-key",
            model="gpt-4o",
        )

        history = [
            {"role": "user", "content": "问题1"},
            {"role": "assistant", "content": "回答1"},
        ]

        messages = dispatcher.build_messages(
            system_prompt="你是一个访谈助手",
            user_message="问题2",
            history=history,
        )

        assert len(messages) == 4
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"
        assert messages[1]["content"] == "问题1"
        assert messages[2]["role"] == "assistant"
        assert messages[2]["content"] == "回答1"
