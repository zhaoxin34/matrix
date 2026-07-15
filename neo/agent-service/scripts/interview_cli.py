#!/usr/bin/env python3
"""Interview Agent CLI client."""

import asyncio
import json

import websockets


class InterviewCLI:
    """CLI client for Interview Agent."""

    def __init__(self, base_url: str = "ws://localhost:8001/ws/interview"):
        self.base_url = base_url
        self.ws = None
        self.interview_id = None
        self.workspace_code = None

    async def connect(self):
        """Connect to the interview service."""
        print(f"Connecting to {self.base_url}...")
        self.ws = await websockets.connect(self.base_url)
        print("Connected!")

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
            print("\n📋 Interview started!")
            print(f"   Interview ID: {self.interview_id}")
            print(f"   Questions: {data['questions_count']}")
        elif data.get("type") == "error":
            print(f"❌ Error: {data['message']}")
            return None

        # Wait for first question
        response = await self.ws.recv()
        data = json.loads(response)

        if data.get("type") == "question":
            print(f"\n❓ Question {data['question_index'] + 1}/{data['total_questions']}:")
            print(f"   {data['question_text']}")

        return self.interview_id

    async def submit_answer(self, answer: str):
        """Submit an answer to the current question."""
        if not self.interview_id:
            print("❌ No active interview")
            return

        message = {
            "type": "answer",
            "interview_id": self.interview_id,
            "answer": answer,
        }
        await self.ws.send(json.dumps(message))

        # Wait for response
        while True:
            response = await self.ws.recv()
            data = json.loads(response)

            msg_type = data.get("type")

            if msg_type == "question":
                print(f"\n❓ Question {data['question_index'] + 1}/{data['total_questions']}:")
                print(f"   {data['question_text']}")
                break
            elif msg_type == "interview_complete":
                print("\n✅ Interview completed!")
                print(f"   Total turns: {data['total_turns']}")
                print(f"   Summary: {data.get('summary', '')}")
                return True
            elif msg_type == "error":
                print(f"❌ Error: {data['message']}")
                break
            elif msg_type == "ack":
                print("   ✓ Answer recorded, waiting for next question...")

        return False

    async def end_interview(self):
        """End the current interview."""
        if not self.interview_id:
            print("❌ No active interview")
            return

        message = {
            "type": "end",
            "interview_id": self.interview_id,
        }
        await self.ws.send(json.dumps(message))

        response = await self.ws.recv()
        data = json.loads(response)

        if data.get("type") == "interview_complete":
            print("\n✅ Interview ended!")
            print(f"   Total turns: {data['total_turns']}")
        elif data.get("type") == "error":
            print(f"❌ Error: {data['message']}")

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

        print("\n" + "=" * 50)
        print("Enter your answers. Type 'quit' to exit, 'end' to finish interview.")
        print("=" * 50)

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
                print("\n\nInterrupted. Ending interview...")
                await cli.end_interview()
                break

    finally:
        await cli.close()
        print("\n👋 Goodbye!")


if __name__ == "__main__":
    asyncio.run(main())
