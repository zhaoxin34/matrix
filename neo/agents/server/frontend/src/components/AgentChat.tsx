import { useEffect } from 'react';
import { useAgentStore } from '../hooks/use-agent-store';
import { AgentStatus } from './AgentStatus';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface AgentChatProps {
  /** WebSocket endpoint, defaults to ws://localhost:8080 */
  endpoint?: string;
  /** CSS class name for the container */
  className?: string;
}

/**
 * Agent Chat - 主组件
 * 
 * @example
 * ```tsx
 * import { AgentChat } from '@neo/agent-ui';
 * 
 * function App() {
 *   return <AgentChat endpoint="ws://localhost:8080" />;
 * }
 * ```
 */
export function AgentChat({ endpoint = 'ws://localhost:8080', className = '' }: AgentChatProps) {
  const {
    connectionState,
    messages,
    isStreaming,
    sessionInfo,
    connect,
    disconnect,
    sendMessage,
    abort,
  } = useAgentStore();

  // Auto-connect on mount
  useEffect(() => {
    connect(endpoint);
    return () => {
      disconnect();
    };
  }, []);

  const handleSend = async (message: string) => {
    if (isStreaming) {
      // If streaming, treat as followUp or steer
      // For simplicity, we'll abort and start new
      await abort();
      setTimeout(() => sendMessage(message), 100);
    } else {
      await sendMessage(message);
    }
  };

  const handleAbort = async () => {
    await abort();
  };

  const handleReconnect = async () => {
    disconnect();
    setTimeout(() => connect(endpoint), 100);
  };

  return (
    <div className={`flex flex-col h-[600px] max-w-2xl mx-auto border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-medium">Agent Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <AgentStatus 
            state={connectionState} 
            messageCount={messages.length}
            sessionId={sessionInfo?.sessionId}
          />
          {connectionState === 'error' && (
            <button
              onClick={handleReconnect}
              className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded hover:bg-red-200"
            >
              重连
            </button>
          )}
          {isStreaming && (
            <button
              onClick={handleAbort}
              className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded hover:bg-yellow-200"
            >
              停止
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isStreaming={isStreaming} />

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <ChatInput 
          onSend={handleSend} 
          disabled={connectionState !== 'connected'}
          placeholder={
            connectionState === 'connected'
              ? '输入消息...'
              : connectionState === 'connecting'
                ? '连接中...'
                : '未连接'
          }
        />
      </div>
    </div>
  );
}
