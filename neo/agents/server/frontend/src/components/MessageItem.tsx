import type { AgentMessage } from '../types';

interface MessageItemProps {
  message: AgentMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[80%] rounded-lg px-4 py-2
          ${isUser
            ? 'bg-primary text-primary-foreground'
            : isAssistant
              ? 'bg-muted'
              : 'bg-orange-100 dark:bg-orange-900/30'
          }
        `}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : isAssistant ? (
          <div className="text-sm">
            {message.content ? (
              <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
            ) : (
              <span className="text-muted-foreground italic">等待回复...</span>
            )}
          </div>
        ) : (
          <div className="text-xs">
            <span className="font-medium text-orange-600 dark:text-orange-400">
              [{message.role}]
            </span>
            <pre className="whitespace-pre-wrap mt-1">{message.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
