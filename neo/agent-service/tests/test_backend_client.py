"""Tests for Backend API client."""

from unittest.mock import MagicMock, patch


class TestBackendClient:
    """Test cases for Backend API client."""

    def test_get_expert_interview_prototype(self):
        """Test getting expert_interview prototype."""
        from agent_service.clients.backend import BackendClient

        # Create mock response
        mock_response = MagicMock()
        mock_response.status_code = 200

        # Create the expected response data
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
        mock_response.json.return_value = expected_data

        # Mock the httpx Client
        mock_client_instance = MagicMock()
        mock_client_instance.get.return_value = mock_response
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None

        with patch("agent_service.clients.backend.httpx.Client", return_value=mock_client_instance):
            client = BackendClient(base_url="http://localhost:8000")
            response = client.get("/api/v1/agent_prototype", params={"type": "expert_interview"})

            assert response["code"] == 0
            assert response["data"]["total"] == 1
            assert response["data"]["items"][0]["type"] == "expert_interview"

    def test_create_interview_session(self):
        """Test creating an interview session."""
        from agent_service.clients.backend import BackendClient

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "code": 0,
            "data": {
                "id": 1,
                "expert_id": 1,
                "topic": "销售技巧访谈",
                "mode": "ai_agent",
            },
        }

        mock_client_instance = MagicMock()
        mock_client_instance.post.return_value = mock_response
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None

        with patch("agent_service.clients.backend.httpx.Client", return_value=mock_client_instance):
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

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
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

        mock_client_instance = MagicMock()
        mock_client_instance.post.return_value = mock_response
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None

        with patch("agent_service.clients.backend.httpx.Client", return_value=mock_client_instance):
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
