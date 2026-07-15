"""Backend API client for agent-service."""

from typing import Any

import httpx


class BackendAPIError(Exception):
    """Exception for Backend API errors."""

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"[{status_code}] {message}")


class BackendClient:
    """Client for calling Backend API endpoints."""

    def __init__(self, base_url: str = "http://localhost:8000", api_key: str = ""):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def _handle_response(self, response: httpx.Response) -> dict[str, Any]:
        """Handle API response and raise on error."""
        if response.status_code >= 400:
            try:
                error_data = response.json()
                message = error_data.get("message", response.text)
            except Exception:
                message = response.text
            raise BackendAPIError(status_code=response.status_code, message=message)

        return response.json()

    def get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """GET request to Backend API."""
        with httpx.Client(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
            timeout=30.0,
        ) as client:
            response = client.get(path, params=params)
            return self._handle_response(response)

    def post(
        self, path: str, json: dict[str, Any] | None = None, params: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """POST request to Backend API."""
        with httpx.Client(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
            timeout=30.0,
        ) as client:
            response = client.post(path, json=json, params=params)
            return self._handle_response(response)

    def put(self, path: str, json: dict[str, Any] | None = None) -> dict[str, Any]:
        """PUT request to Backend API."""
        with httpx.Client(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
            timeout=30.0,
        ) as client:
            response = client.put(path, json=json)
            return self._handle_response(response)

    def delete(self, path: str) -> dict[str, Any]:
        """DELETE request to Backend API."""
        with httpx.Client(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
            timeout=30.0,
        ) as client:
            response = client.delete(path)
            return self._handle_response(response)


class InterviewBackendClient(BackendClient):
    """Backend client with interview-specific methods."""

    def get_agent_mapping(self, workspace_code: str, agent_type: str) -> dict[str, Any]:
        """Get agent mapping for a workspace and type.

        Args:
            workspace_code: Workspace code (e.g., 'crm')
            agent_type: Agent type (e.g., 'expert_interview', 'site_operation')

        Returns:
            Agent mapping data with agent_id
        """
        response = self.get(f"/api/v1/workspaces/{workspace_code}/agent-mappings/{agent_type}")
        return response.get("data", {})

    def get_agent(self, workspace_code: str, agent_id: int) -> dict[str, Any]:
        """Get agent by ID from workspace.

        Args:
            workspace_code: Workspace code
            agent_id: Agent ID

        Returns:
            Agent data including prototype info
        """
        response = self.get(f"/api/v1/workspaces/{workspace_code}/agents/{agent_id}")
        return response.get("data", {})

    def get_expert_interview_prototype(self) -> dict[str, Any]:
        """Get expert_interview type prototype."""
        response = self.get("/api/v1/agent_prototype", params={"type": "expert_interview", "status": "enabled"})
        items = response.get("data", {}).get("items", [])
        if not items:
            raise BackendAPIError(status_code=404, message="No expert_interview prototype found")
        return items[0]

    def get_question_tree(self, workspace_code: str, tree_id: int) -> dict[str, Any]:
        """Get question tree by ID."""
        response = self.get(f"/api/v1/workspaces/{workspace_code}/knlg-base/qa/question-trees/{tree_id}")
        return response.get("data", {})

    def create_interview_session(self, workspace_code: str, expert_id: int, topic: str) -> dict[str, Any]:
        """Create an interview session."""
        response = self.post(
            f"/api/v1/workspaces/{workspace_code}/knlg-base/qa/sessions",
            json={"expert_id": expert_id, "topic": topic},
        )
        return response.get("data", {})

    def create_interview(
        self, workspace_code: str, session_id: int, question_id: int, expert_id: int
    ) -> dict[str, Any]:
        """Create an interview."""
        response = self.post(
            f"/api/v1/workspaces/{workspace_code}/knlg-base/qa/interviews",
            json={"session_id": session_id, "question_id": question_id, "expert_id": expert_id},
        )
        return response.get("data", {})

    def add_interview_turn(
        self,
        workspace_code: str,
        interview_id: int,
        question: str,
        answer: str,
        turn_type: str = "initial",
        parent_turn_id: int | None = None,
        confidence: float = 0.5,
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        """Add an interview turn."""
        data = {
            "question": question,
            "answer": answer,
            "type": turn_type,
            "confidence": confidence,
        }
        if parent_turn_id:
            data["parent_turn_id"] = parent_turn_id
        if tags:
            data["tags"] = tags

        response = self.post(
            f"/api/v1/workspaces/{workspace_code}/knlg-base/qa/interviews/{interview_id}/turns",
            json=data,
        )
        return response.get("data", {})

    def end_interview(self, workspace_code: str, interview_id: int) -> dict[str, Any]:
        """End an interview."""
        response = self.post(f"/api/v1/workspaces/{workspace_code}/knlg-base/qa/interviews/{interview_id}/end")
        return response.get("data", {})

    def get_model_config(self, provider_id: int, model_id: int) -> dict[str, Any]:
        """Get model configuration."""
        response = self.get(f"/api/v1/model-providers/{provider_id}/models/{model_id}")
        return response.get("data", {})
