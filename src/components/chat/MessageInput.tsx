'use client';
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';

interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  maxLength?: number;
}

export function MessageInput({ onSend, onTypingStart, onTypingStop, disabled, maxLength = 500 }: MessageInputProps) {
  const [value, setValue] = useState('');
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);

    // Typing indicator
    if (!isTyping.current) {
      isTyping.current = true;
      onTypingStart();
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      onTypingStop();
    }, 1500);

    // Auto-resize
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  }

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (isTyping.current) {
      isTyping.current = false;
      onTypingStop();
    }
  }, [value, disabled, onSend, onTypingStop]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const remaining = maxLength - value.length;
  const nearLimit = remaining < 50;

  return (
    <div className="border-t border-gray-100 bg-white p-3">
      <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-200 focus-within:border-accent-300 focus-within:bg-white transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
          rows={1}
          maxLength={maxLength}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none min-h-[22px] max-h-[120px]"
          aria-label="Message input"
        />
        <div className="flex items-center gap-2 pb-0.5">
          {nearLimit && (
            <span className={`text-xs ${remaining < 20 ? 'text-red-500' : 'text-gray-400'}`}>{remaining}</span>
          )}
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="shrink-0 !px-3 !py-1.5"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
