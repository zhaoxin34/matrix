#!/usr/bin/env python3
"""Interview Agent CLI client."""

import asyncio
import json
import sys

import websockets


class InterviewCLI:
    """CLI client for Interview Agent."""

    def __init__(self, base_url: str = "ws://localhost:8001/ws/interview"):
        self.base_url = base_url
        self.ws = None
        self.interview_id = None
        self.workspace_code = None
        self.total_questions = 0

    async def connect(self):
        """Connect to the interview service."""
        print(f"Connecting to {self.base_url}...", file=sys.stderr)
        self.ws = await websockets.connect(self.base_url)
        print("Connected!", file=sys.stderr)

    async def start_interview(self, workspace_code: str, expert_id: int, question_tree_id: int):
        """Start a new interview."""
        self.workspace_code = workspace_code
        message = {
            "type": "start",
            "workspace_code": workspace_code,
            "expert_id": expert_id,
            "question_tree_id": question_tree_id,
        }
        await self.ws.send(json.dumps(message))

        # Wait for session_started
        response = await self.ws.recv()
        data = json.loads(response)

        if data.get("type") == "session_started":
            self.interview_id = data["interview_id"]
            self.total_questions = data.get("questions_count", 0)
            print("\n📋 Interview started!", file=sys.stderr)
            print(f"   Interview ID: {self.interview_id}", file=sys.stderr)
            print(f"   Questions: {self.total_questions}", file=sys.stderr)
        elif data.get("type") == "error":
            print(f"❌ Error: {data['message']}", file=sys.stderr)
            return None

        # Wait for first question
        response = await self.ws.recv()
        data = json.loads(response)

        if data.get("type") == "question":
            self._print_question(data)

        return self.interview_id

    def _print_question(self, data: dict):
        """Print a question."""
        idx = data.get("question_index", 0) + 1
        total = data.get("total_questions", self.total_questions)
        text = data.get("question_text", "")
        print(f"\n❓ Question {idx}/{total}:", file=sys.stderr)
        print(f"   {text}", file=sys.stderr)

    async def submit_answer(self, answer: str) -> bool:
        """Submit an answer and handle the response.

        Returns:
            True if interview is complete, False otherwise
        """
        if not self.interview_id:
            print("❌ No active interview", file=sys.stderr)
            return False

        message = {
            "type": "answer",
            "interview_id": self.interview_id,
            "answer": answer,
        }
        await self.ws.send(json.dumps(message))

        # Wait for answer_received
        response = await self.ws.recv()
        data = json.loads(response)
        msg_type = data.get("type")

        if msg_type == "answer_received":
            print(f"   ✓ Turn {data.get('turn_id')} recorded", file=sys.stderr)
        elif msg_type == "error":
            print(f"❌ Error: {data.get('message')}", file=sys.stderr)
            return False

        # Wait for next question or completion
        response = await self.ws.recv()
        data = json.loads(response)
        msg_type = data.get("type")

        if msg_type == "question":
            self._print_question(data)
            return False
        elif msg_type == "interview_complete":
            print("\n✅ Interview completed!", file=sys.stderr)
            print(f"   Total turns: {data.get('total_turns', 0)}", file=sys.stderr)
            if data.get("summary"):
                print(f"   Summary: {data.get('summary')}", file=sys.stderr)
            return True
        elif msg_type == "error":
            print(f"❌ Error: {data.get('message')}", file=sys.stderr)
            return False

        return False

    async def end_interview(self):
        """End the current interview."""
        if not self.interview_id:
            print("❌ No active interview", file=sys.stderr)
            return

        message = {
            "type": "end",
            "interview_id": self.interview_id,
        }
        await self.ws.send(json.dumps(message))

        response = await self.ws.recv()
        data = json.loads(response)

        if data.get("type") == "interview_complete":
            print("\n✅ Interview ended!", file=sys.stderr)
            print(f"   Total turns: {data.get('total_turns', 0)}", file=sys.stderr)
        elif data.get("type") == "error":
            print(f"❌ Error: {data.get('message')}", file=sys.stderr)

    async def close(self):
        """Close the connection."""
        if self.ws:
            await self.ws.close()


async def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Interview Agent CLI")
    parser.add_argument("--url", default="ws://localhost:8001/ws/interview", help="WebSocket URL")
    parser.add_argument("--workspace", default="crm", help="Workspace code")
    parser.add_argument("--expert-id", type=int, default=1, help="Expert ID")
    parser.add_argument("--question-tree-id", type=int, default=1, help="Question tree ID")

    args = parser.parse_args()

    cli = InterviewCLI(base_url=args.url)

    try:
        await cli.connect()
        interview_id = await cli.start_interview(
            workspace_code=args.workspace,
            expert_id=args.expert_id,
            question_tree_id=args.question_tree_id,
        )

        if not interview_id:
            return

        print("\n" + "=" * 50, file=sys.stderr)
        print("Enter your answers. Type 'quit' to exit, 'end' to finish interview.", file=sys.stderr)
        print("=" * 50, file=sys.stderr)

        while True:
            try:
                answer = input("\n📝 Your answer: ").strip()

                if answer.lower() == "quit":
                    break
                elif answer.lower() == "end":
                    await cli.end_interview()
                    break
                elif answer:
                    is_complete = await cli.submit_answer(answer)
                    if is_complete:
                        break

            except KeyboardInterrupt:
                print("\n\nInterrupted. Ending interview...", file=sys.stderr)
                await cli.end_interview()
                break

    finally:
        await cli.close()
        print("\n👋 Goodbye!", file=sys.stderr)


if __name__ == "__main__":
    asyncio.run(main())
