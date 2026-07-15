"""Tests for Backend API client."""

from unittest.mock import MagicMock, patch


class TestBackendClient:
    """Test cases for Backend API client."""

    def test_get_expert_interview_prototype(self):
        """Test getting expert_interview prototype."""
        from agent_service.clients.backend import BackendClient

        expected_data = {
            "code": 0,
            "data": {
                "items": [
                    {
                        "id": 1,
                        "name": "专家访谈 Agent",
                        "type": "expert_interview",
                        "model": "gpt-4o",
                        "prompts": {"system": "你是一个访谈助手"},
                        "config": {"temperature": 0.7},
                    }
                ],
                "total": 1,
            },
        }

        # Create a mock response with status_code
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = expected_data

        # Create mock client
        mock_client = MagicMock()
        mock_client.get.return_value = mock_response

        # Patch httpx.Client to return mock_client when called
        with patch("agent_service.clients.backend.httpx.Client") as mock_client_class:
            # When httpx.Client() is called, return mock_client
            instance = MagicMock()
            instance.__enter__ = MagicMock(return_value=mock_client)
            instance.__exit__ = MagicMock(return_value=None)
            mock_client_class.return_value = instance

            client = BackendClient(base_url="http://localhost:8000")
            response = client.get("/api/v1/agent_prototype", params={"type": "expert_interview"})

            assert response["code"] == 0
            assert response["data"]["total"] == 1
            assert response["data"]["items"][0]["type"] == "expert_interview"

    def test_create_interview_session(self):
        """Test creating an interview session."""
        from agent_service.clients.backend import BackendClient

        expected_data = {
            "code": 0,
            "data": {
                "id": 1,
                "expert_id": 1,
                "topic": "销售技巧访谈",
                "mode": "ai_agent",
            },
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = expected_data

        mock_client = MagicMock()
        mock_client.post.return_value = mock_response

        with patch("agent_service.clients.backend.httpx.Client") as mock_client_class:
            instance = MagicMock()
            instance.__enter__ = MagicMock(return_value=mock_client)
            instance.__exit__ = MagicMock(return_value=None)
            mock_client_class.return_value = instance

            client = BackendClient(base_url="http://localhost:8000")
            response = client.post(
                "/api/v1/qa/sessions",
                json={"expert_id": 1, "topic": "销售技巧访谈", "mode": "ai_agent"},
            )

            assert response["code"] == 0
            assert response["data"]["id"] == 1

    def test_add_interview_turn(self):
        """Test adding an interview turn."""
        from agent_service.clients.backend import BackendClient

        expected_data = {
            "code": 0,
            "data": {
                "id": 1,
                "interview_id": 1,
                "question": "客户的预算范围？",
                "answer": "大约 50 万左右",
                "type": "initial",
                "sequence": 1,
            },
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = expected_data

        mock_client = MagicMock()
        mock_client.post.return_value = mock_response

        with patch("agent_service.clients.backend.httpx.Client") as mock_client_class:
            instance = MagicMock()
            instance.__enter__ = MagicMock(return_value=mock_client)
            instance.__exit__ = MagicMock(return_value=None)
            mock_client_class.return_value = instance

            client = BackendClient(base_url="http://localhost:8000")
            response = client.post(
                "/api/v1/qa/interviews/1/turns",
                json={
                    "question": "客户的预算范围？",
                    "answer": "大约 50 万左右",
                    "type": "initial",
                },
            )

            assert response["code"] == 0
            assert response["data"]["sequence"] == 1


class TestBackendClientErrorHandling:
    """Test error handling in Backend client."""

    def test_handle_api_error(self):
        """Test handling API errors."""
        from agent_service.clients.backend import BackendAPIError

        error = BackendAPIError(status_code=401, message="Not authenticated")
        assert error.status_code == 401
        assert "Not authenticated" in str(error)


class TestInterviewBackendClient:
    """Test interview-specific backend client methods."""

    def test_get_agent_mapping(self):
        """Test getting agent mapping."""
        from agent_service.clients.backend import InterviewBackendClient

        expected_data = {
            "code": 0,
            "data": {
                "id": 7,
                "workspace_id": 2,
                "type": "expert_interview",
                "agent_id": 4,
            },
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = expected_data

        mock_client = MagicMock()
        mock_client.get.return_value = mock_response

        with patch("agent_service.clients.backend.httpx.Client") as mock_client_class:
            instance = MagicMock()
            instance.__enter__ = MagicMock(return_value=mock_client)
            instance.__exit__ = MagicMock(return_value=None)
            mock_client_class.return_value = instance

            client = InterviewBackendClient(base_url="http://localhost:8000")
            result = client.get_agent_mapping("crm", "expert_interview")

            assert result["agent_id"] == 4
            mock_client.get.assert_called_once()

    def test_get_agent(self):
        """Test getting agent details."""
        from agent_service.clients.backend import InterviewBackendClient

        expected_data = {
            "code": 0,
            "data": {
                "id": 4,
                "name": "CRM专家访谈助手",
                "prototype_id": 5,
                "model": "gpt-4o",
            },
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = expected_data

        mock_client = MagicMock()
        mock_client.get.return_value = mock_response

        with patch("agent_service.clients.backend.httpx.Client") as mock_client_class:
            instance = MagicMock()
            instance.__enter__ = MagicMock(return_value=mock_client)
            instance.__exit__ = MagicMock(return_value=None)
            mock_client_class.return_value = instance

            client = InterviewBackendClient(base_url="http://localhost:8000")
            result = client.get_agent("crm", 4)

            assert result["prototype_id"] == 5
            assert result["model"] == "gpt-4o"
