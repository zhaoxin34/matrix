import { useState, useRef, useEffect, type FormEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || '输入消息... (Enter 发送, Shift+Enter 换行)'}
        disabled={disabled}
        rows={1}
        className="
          flex-1
          min-h-[44px] max-h-[150px]
          px-4 py-3
          rounded-lg
          border border-input
          bg-background
          text-sm
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
          overflow-y-auto
        "
      />
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="
          h-[44px] px-4
          rounded-lg
          bg-primary text-primary-foreground
          font-medium text-sm
          hover:opacity-90
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-opacity
        "
      >
        发送
      </button>
    </form>
  );
}
