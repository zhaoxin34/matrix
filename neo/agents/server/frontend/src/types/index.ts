// JSON-RPC Types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id?: number | string;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: JsonRpcError;
  id?: number | string;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

// Agent Event Types
export type AgentEventType =
  | 'agent_start'
  | 'agent_end'
  | 'message_start'
  | 'message_delta'
  | 'message_thinking'
  | 'message_end'
  | 'tool_start'
  | 'tool_update'
  | 'tool_end'
  | 'queue_update';

export interface AgentEvent {
  type: AgentEventType;
  messageId?: string;
  delta?: string;
  output?: string;
  toolCallId?: string;
  name?: string;
  args?: Record<string, unknown>;
  isError?: boolean;
  steer?: string;
  followUp?: string;
  messages?: AgentMessage[];
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

// Session Types
export interface SessionInfo {
  sessionId: string;
  isStreaming: boolean;
  messageCount: number;
  cwd?: string;
  modelId?: string;
  thinkingLevel?: string;
}

export interface CreateSessionParams {
  cwd?: string;
  thinkingLevel?: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
  modelId?: string;
}

export interface SendMessageParams {
  prompt: string;
  images?: string[];
}

export interface SteerParams {
  text: string;
}

export interface FollowUpParams {
  text: string;
}

// Connection State
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Agent Store State
export interface AgentState {
  // Connection
  connectionState: ConnectionState;
  endpoint: string;

  // Session
  sessionId: string | null;
  sessionInfo: SessionInfo | null;

  // Messages
  messages: AgentMessage[];

  // Streaming
  isStreaming: boolean;
  currentMessage: string;

  // Queue (steer/followUp)
  steerQueue: string[];
  followUpQueue: string[];

  // Actions
  connect: (endpoint: string) => void;
  disconnect: () => void;
  createSession: (params?: CreateSessionParams) => Promise<void>;
  sendMessage: (prompt: string) => Promise<void>;
  steer: (text: string) => Promise<void>;
  followUp: (text: string) => Promise<void>;
  abort: () => Promise<void>;
  destroySession: () => Promise<void>;
  handleEvent: (event: AgentEvent) => void;
}
