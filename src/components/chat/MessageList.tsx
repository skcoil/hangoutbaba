'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageData } from '@/types';
import { MessageItem } from './MessageItem';
import { Spinner } from '@/components/ui/Spinner';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: MessageData[];
  typingUsers: string[];
  currentSessionId: string;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onReport: (messageId: string, reason: string) => Promise<void>;
  onDelete: (messageId: string) => void;
}

export function MessageList({
  messages, typingUsers, currentSessionId, hasMore, loadingMore,
  onLoadMore, onReport, onDelete,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const prevMessageCount = useRef(messages.length);

  useEffect(() => {
    // Auto scroll if at bottom or new own message
    const list = listRef.current;
    if (!list) return;
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 100;
    if (atBottom || messages.length > prevMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  function handleScroll() {
    const list = listRef.current;
    if (!list) return;
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 100;
    setShowScrollBtn(!atBottom);

    // Load more when scrolled to top
    if (list.scrollTop < 100 && hasMore && !loadingMore) {
      onLoadMore();
    }
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBtn(false);
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto py-4"
      >
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}
        {hasMore && !loadingMore && (
          <button
            onClick={onLoadMore}
            className="w-full text-xs text-center text-accent-600 hover:text-accent-700 py-2 transition-colors"
          >
            Load older messages
          </button>
        )}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-3">
            <span className="text-4xl">👋</span>
            <p className="text-gray-500 font-medium">You&apos;re the first one here</p>
            <p className="text-gray-400 text-sm">Start the conversation.</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            currentSessionId={currentSessionId}
            onReport={onReport}
            onDelete={onDelete}
          />
        ))}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-white shadow-lg border border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-all animate-fade-in"
          aria-label="Scroll to bottom"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
