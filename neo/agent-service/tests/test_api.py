"""Tests for Interview Agent API endpoints."""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def mock_backend_client():
    """Mock backend client for API tests."""
    with patch("agent_service.api.interviews.get_backend_client") as mock:
        client_instance = MagicMock()
        mock.return_value = client_instance
        yield client_instance


class TestStartInterview:
    """Test cases for starting an interview."""

    def test_start_interview_success(self, mock_backend_client):
        """Test successful interview start."""
        from agent_service.main import app

        # Mock responses
        mock_backend_client.get_expert_interview_prototype.return_value = {
            "id": 1,
            "name": "专家访谈 Agent",
            "model": "gpt-4o",
            "prompts": {"system": "你是访谈助手"},
            "config": {"temperature": 0.7},
        }
        mock_backend_client.get_question_tree.return_value = {
            "id": 1,
            "name": "销售访谈模板",
            "questions": [
                {"id": "q1", "text": "您的销售经验？"},
                {"id": "q2", "text": "成功案例？"},
            ],
        }
        mock_backend_client.create_interview_session.return_value = {
            "id": 1,
            "expert_id": 1,
        }
        mock_backend_client.create_interview.return_value = {
            "id": 1,
            "session_id": 1,
        }

        with TestClient(app) as client:
            response = client.post(
                "/api/v1/interviews/start",
                json={
                    "workspace_code": "crm",
                    "expert_id": 1,
                    "question_tree_id": 1,
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert "interview_id" in data["data"]


class TestSubmitAnswer:
    """Test cases for submitting an answer."""

    def test_submit_answer_success(self, mock_backend_client):
        """Test successful answer submission."""
        from agent_service.main import app

        mock_backend_client.add_interview_turn.return_value = {
            "id": 1,
            "question": "问题1",
            "answer": "回答1",
            "sequence": 1,
        }

        with TestClient(app) as client:
            response = client.post(
                "/api/v1/interviews/1/answer",
                json={
                    "workspace_code": "crm",
                    "answer": "这是我的回答",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0


class TestGetInterviewStatus:
    """Test cases for getting interview status."""

    def test_get_status_success(self, mock_backend_client):
        """Test getting interview status."""
        from agent_service.main import app

        mock_backend_client.get_interview.return_value = {
            "id": 1,
            "session_id": 1,
            "status": "in_progress",
            "turns": [
                {"id": 1, "question": "Q1", "answer": "A1"},
            ],
        }

        with TestClient(app) as client:
            response = client.get("/api/v1/interviews/1/status?workspace_code=crm")

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["status"] == "in_progress"


class TestEndInterview:
    """Test cases for ending an interview."""

    def test_end_interview_success(self, mock_backend_client):
        """Test ending an interview."""
        from agent_service.main import app

        mock_backend_client.end_interview.return_value = {
            "id": 1,
            "ended_at": "2026-07-15T10:00:00",
        }

        with TestClient(app) as client:
            response = client.post("/api/v1/interviews/1/end?workspace_code=crm")

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
