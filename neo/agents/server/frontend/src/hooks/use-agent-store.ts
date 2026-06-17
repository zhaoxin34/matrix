import { create } from 'zustand';
import type { AgentState, AgentEvent, AgentMessage } from '../types';
import { getAgentClient } from '../lib/agent-client';

/**
 * Agent 状态管理 Store
 */
export const useAgentStore = create<AgentState>((set, get) => ({
  // Initial state
  connectionState: 'disconnected',
  endpoint: 'ws://localhost:8080',
  sessionId: null,
  sessionInfo: null,
  messages: [],
  isStreaming: false,
  currentMessage: '',
  steerQueue: [],
  followUpQueue: [],

  // Actions
  connect: async (endpoint: string) => {
    const client = getAgentClient();
    
    set({ 
      connectionState: 'connecting',
      endpoint 
    });

    try {
      await client.connect(endpoint);
      set({ connectionState: 'connected' });

      // Subscribe to events
      client.onEvent((event: AgentEvent) => {
        useAgentStore.getState().handleEvent(event);
      });

      // Auto-create session
      await get().createSession();
    } catch (error) {
      set({ connectionState: 'error' });
      throw error;
    }
  },

  disconnect: () => {
    const client = getAgentClient();
    client.disconnect();
    
    set({
      connectionState: 'disconnected',
      sessionId: null,
      sessionInfo: null,
      messages: [],
      isStreaming: false,
      currentMessage: '',
    });
  },

  createSession: async (params) => {
    const client = getAgentClient();
    
    const result = await client.call('session.create', params as Record<string, unknown>) as { 
      sessionId: string; 
      status: string; 
    };
    
    set({ 
      sessionId: result.sessionId,
      sessionInfo: {
        sessionId: result.sessionId,
        isStreaming: false,
        messageCount: 0,
        cwd: params?.cwd,
        thinkingLevel: params?.thinkingLevel,
        modelId: params?.modelId,
      },
    });
  },

  sendMessage: async (prompt: string) => {
    const client = getAgentClient();
    const { messages } = get();

    // Add user message
    const userMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
    };
    
    set({
      messages: [...messages, userMessage],
      isStreaming: true,
      currentMessage: '',
    });

    await client.call('session.send', { prompt });
  },

  steer: async (text: string) => {
    const client = getAgentClient();
    await client.call('session.steer', { text });
    
    set((state) => ({
      steerQueue: [...state.steerQueue, text],
    }));
  },

  followUp: async (text: string) => {
    const client = getAgentClient();
    await client.call('session.followUp', { text });
    
    set((state) => ({
      followUpQueue: [...state.followUpQueue, text],
    }));
  },

  abort: async () => {
    const client = getAgentClient();
    await client.call('session.abort', {});
  },

  destroySession: async () => {
    const client = getAgentClient();
    await client.call('session.destroy', {});
    
    set({
      sessionId: null,
      sessionInfo: null,
      messages: [],
      isStreaming: false,
      currentMessage: '',
    });
  },

  // Internal: Handle agent events
  handleEvent: (event: AgentEvent) => {
    const { messages } = get();

    switch (event.type) {
      case 'agent_start':
        set({ isStreaming: true });
        break;

      case 'message_start':
        // Start a new assistant message
        if (event.messageId) {
          const assistantMessage: AgentMessage = {
            id: event.messageId,
            role: 'assistant',
            content: '',
          };
          set({ messages: [...messages, assistantMessage] });
        }
        break;

      case 'message_delta':
        // Append delta to current message
        if (event.delta) {
          set((state) => {
            const updatedMessages = [...state.messages];
            const lastMsg = updatedMessages[updatedMessages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content += event.delta!;
            }
            return {
              messages: updatedMessages,
              currentMessage: lastMsg?.content || '',
            };
          });
        }
        break;

      case 'message_thinking':
        // Could handle thinking separately
        break;

      case 'message_end':
        set((state) => ({
          sessionInfo: state.sessionInfo 
            ? { ...state.sessionInfo, messageCount: state.messages.length }
            : null,
        }));
        break;

      case 'agent_end':
        set({ 
          isStreaming: false,
          currentMessage: '',
          messages: event.messages || messages,
        });
        break;

      case 'tool_start':
        // Handle tool start
        break;

      case 'tool_update':
        // Handle tool output
        break;

      case 'tool_end':
        // Handle tool end
        break;

      case 'queue_update':
        // Handle queue update
        break;
    }
  },
}));
