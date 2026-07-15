"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface QuestionMessage {
  type: "question";
  question_id: string;
  question_text: string;
  question_index: number;
  total_questions: number;
  is_followup: boolean;
}

export interface SessionStartedMessage {
  type: "session_started";
  interview_id: number;
  session_id: number;
  agent_id: number;
  first_question: string;
  questions_count: number;
}

export interface AnswerReceivedMessage {
  type: "answer_received";
  turn_id: number;
}

export interface InterviewCompleteMessage {
  type: "interview_complete";
  interview_id: number;
  total_turns: number;
  summary: string;
}

export interface ErrorMessage {
  type: "error";
  code: number;
  message: string;
}

export type WSMessage =
  | SessionStartedMessage
  | QuestionMessage
  | AnswerReceivedMessage
  | InterviewCompleteMessage
  | ErrorMessage;

export interface InterviewMessage {
  id: string;
  role: "ai" | "expert" | "system";
  content: string;
  questionId?: string;
  questionIndex?: number;
  turnId?: number;
  timestamp: Date;
}

export interface UseAgentInterviewOptions {
  workspaceCode: string;
  expertId: number;
  questionTreeId: number;
  /** 自动连接，默认为 true */
  autoConnect?: boolean;
}

const AGENT_SERVICE_WS_URL =
  process.env.NEXT_PUBLIC_AGENT_SERVICE_WS_URL || "ws://localhost:8001/ws/interview";

/**
 * Hook for managing WebSocket connection to agent-service interview endpoint.
 */
export function useAgentInterview({
  workspaceCode,
  expertId,
  questionTreeId,
  autoConnect = true,
}: UseAgentInterviewOptions) {
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [interviewId, setInterviewId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interviewIdRef = useRef<number | null>(null);
  const handleMessageRef = useRef<((data: WSMessage) => void) | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    interviewIdRef.current = interviewId;
  }, [interviewId]);

  // Handle incoming message - stored in ref to avoid hoisting issues
  const handleMessage = useCallback((
    data: WSMessage,
  ) => {
    switch (data.type) {
      case "session_started":
        setInterviewId(data.interview_id);
        setSessionId(data.session_id);
        setAgentId(data.agent_id);
        setTotalQuestions(data.questions_count);
        setCurrentQuestionIndex(0);
        setIsComplete(false);
        setMessages([
          {
            id: `sys-${Date.now()}`,
            role: "system",
            content: `访谈已启动，共 ${data.questions_count} 个问题`,
            timestamp: new Date(),
          },
        ]);
        break;

      case "question":
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "ai",
            content: data.question_text,
            questionId: data.question_id,
            questionIndex: data.question_index,
            timestamp: new Date(),
          },
        ]);
        setCurrentQuestionIndex(data.question_index);
        break;

      case "answer_received":
        setMessages((prev) => {
          const updated = [...prev];
          const lastExpertIndex = updated.findLastIndex((m) => m.role === "expert");
          if (lastExpertIndex !== -1) {
            updated[lastExpertIndex] = {
              ...updated[lastExpertIndex],
              turnId: data.turn_id,
            };
          }
          return updated;
        });
        break;

      case "interview_complete":
        setIsComplete(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: "system",
            content: `访谈已完成${data.summary ? `：${data.summary}` : ""}`,
            timestamp: new Date(),
          },
        ]);
        break;

      case "error":
        setError(data.message);
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: "system",
            content: `错误：${data.message}`,
            timestamp: new Date(),
          },
        ]);
        break;
    }
  }, []);

  // Store handleMessage in ref
  useEffect(() => {
    handleMessageRef.current = handleMessage;
  }, [handleMessage]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ws = new WebSocket(AGENT_SERVICE_WS_URL);

      ws.onopen = () => {
        setConnected(true);
        setLoading(false);
        console.log("[AgentInterview] WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSMessage;
          handleMessageRef.current?.(data);
        } catch (e) {
          console.error("[AgentInterview] Failed to parse message:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("[AgentInterview] WebSocket error:", e);
        setError("连接错误");
        setLoading(false);
      };

      ws.onclose = () => {
        setConnected(false);
        setLoading(false);
        console.log("[AgentInterview] WebSocket closed");
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("[AgentInterview] Failed to connect:", e);
      setError("连接失败");
      setLoading(false);
    }
  }, []);

  // Start interview
  const startInterview = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
      // Wait for connection then start
      const checkAndStart = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "start",
              workspace_code: workspaceCode,
              expert_id: expertId,
              question_tree_id: questionTreeId,
            }),
          );
        } else {
          reconnectTimeoutRef.current = setTimeout(checkAndStart, 100);
        }
      };
      reconnectTimeoutRef.current = setTimeout(checkAndStart, 100);
    } else {
      wsRef.current.send(
        JSON.stringify({
          type: "start",
          workspace_code: workspaceCode,
          expert_id: expertId,
          question_tree_id: questionTreeId,
        }),
      );
    }
  }, [connect, workspaceCode, expertId, questionTreeId]);

  // Submit answer
  const submitAnswer = useCallback(
    (answer: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setError("未连接");
        return;
      }

      if (interviewIdRef.current === null) {
        setError("访谈未启动");
        return;
      }

      // Add expert message to UI immediately
      setMessages((prev) => [
        ...prev,
        {
          id: `expert-${Date.now()}`,
          role: "expert",
          content: answer,
          timestamp: new Date(),
        },
      ]);

      // Send to server
      wsRef.current.send(
        JSON.stringify({
          type: "answer",
          interview_id: interviewIdRef.current,
          answer,
        }),
      );
    },
    [],
  );

  // End interview
  const endInterview = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("未连接");
      return;
    }

    if (interviewIdRef.current === null) {
      setError("访谈未启动");
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "end",
        interview_id: interviewIdRef.current,
      }),
    );
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
    setInterviewId(null);
    setSessionId(null);
    setAgentId(null);
    setIsComplete(false);
    setError(null);
    setMessages([]);
  }, []);

  // Auto connect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get current question text
  const currentQuestion =
    messages.find(
      (m) =>
        m.role === "ai" && m.questionIndex === currentQuestionIndex,
    )?.content ?? "";

  return {
    // State
    messages,
    connected,
    interviewId,
    sessionId,
    agentId,
    currentQuestionIndex,
    totalQuestions,
    currentQuestion,
    isComplete,
    error,
    loading,

    // Actions
    startInterview,
    submitAnswer,
    endInterview,
    disconnect,
    reconnect: connect,
  };
}
