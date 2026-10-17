'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useSocket } from '@/hooks/useSocket';
import { MessageData, RoomData } from '@/types';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { RoomSidebar } from '@/components/chat/RoomSidebar';
import { ConnectionStatus } from '@/components/chat/ConnectionStatus';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

export default function RoomPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { session, loading: sessionLoading } = useSession();
  const { socket, status, joinRoom, leaveRoom, sendMessage, deleteMessage, startTyping, stopTyping } = useSocket(session);

  const [room, setRoom] = useState<RoomData | null>(null);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentRoomRef = useRef(slug);

  useEffect(() => { currentRoomRef.current = slug; }, [slug]);

  // Fetch room info + messages
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setError('');
    Promise.all([
      fetch(`/api/rooms/${slug}`).then((r) => r.json()),
      fetch('/api/rooms').then((r) => r.json()),
    ]).then(([roomData, roomsList]) => {
      if (roomData.error) { setError(roomData.error); }
      else {
        setRoom(roomData);
        setOnlineCount(roomData.activeUserCount || 0);
      }
      setRooms(Array.isArray(roomsList) ? roomsList : []);
    }).catch(() => setError('Failed to load room')).finally(() => setLoading(false));
  }, [slug]);

  // Load messages
  useEffect(() => {
    if (!room) return;
    fetch(`/api/messages/${room.id}`)
      .then((r) => r.json())
      .then(({ messages: msgs, nextCursor: nc }) => {
        setMessages(msgs || []);
        setNextCursor(nc);
      });
  }, [room?.id]);

  // Socket events
  useEffect(() => {
    if (!socket || !session || !room) return;

    joinRoom(slug);

    socket.on('message:new', (msg) => {
      if (msg.roomId === room.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('message:deleted', (messageId) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socket.on('room:count-update', (count) => {
      setOnlineCount(Math.max(0, count));
    });

    socket.on('typing:start', (username) => {
      if (username !== session.username) {
        setTypingUsers((prev) => prev.includes(username) ? prev : [...prev, username]);
      }
    });

    socket.on('typing:stop', (username) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    });

    socket.on('session:banned', () => {
      setError('Your session has been banned.');
    });

    return () => {
      leaveRoom(slug);
      socket.off('message:new');
      socket.off('message:deleted');
      socket.off('room:count-update');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('session:banned');
    };
  }, [socket, session, room?.id, slug]);

  const handleSend = useCallback((content: string) => {
    sendMessage(slug, content);
  }, [slug, sendMessage]);

  const handleReport = useCallback(async (messageId: string, reason: string) => {
    if (!session) return;
    await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, reporterId: session.id, reason }),
    });
  }, [session]);

  const handleDelete = useCallback((messageId: string) => {
    deleteMessage(messageId);
  }, [deleteMessage]);

  const handleLoadMore = useCallback(async () => {
    if (!room || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/messages/${room.id}?cursor=${encodeURIComponent(nextCursor)}`);
      const { messages: older, nextCursor: nc } = await res.json();
      setMessages((prev) => [...(older || []), ...prev]);
      setNextCursor(nc);
    } finally {
      setLoadingMore(false);
    }
  }, [room?.id, nextCursor, loadingMore]);

  if (sessionLoading || loading) {
    return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <span className="text-4xl">😕</span>
        <p className="text-gray-600 font-medium">{error}</p>
        <Link href="/chat"><Button variant="secondary">Back to Rooms</Button></Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="h-14 border-b border-gray-100 flex items-center px-4 gap-3 bg-white z-10">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open rooms"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="hidden md:flex font-bold text-accent-600 text-base items-center gap-1.5">
          <span>💬</span> HangoutBaba
        </Link>
        <span className="hidden md:block text-gray-200">|</span>
        <h1 className="font-semibold text-gray-900 text-sm flex-1 truncate">{room?.name}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            {onlineCount} online
          </span>
          <ConnectionStatus status={status} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <div className="hidden md:block">
          <RoomSidebar rooms={rooms} currentSlug={slug} />
        </div>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl animate-fade-in">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-semibold text-gray-800">Rooms</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <RoomSidebar rooms={rooms} currentSlug={slug} />
            </div>
          </div>
        )}

        {/* Chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <MessageList
            messages={messages}
            typingUsers={typingUsers}
            currentSessionId={session?.id || ''}
            hasMore={!!nextCursor}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
            onReport={handleReport}
            onDelete={handleDelete}
          />
          <MessageInput
            onSend={handleSend}
            onTypingStart={() => startTyping(slug)}
            onTypingStop={() => stopTyping(slug)}
            disabled={status !== 'connected'}
          />
        </main>
      </div>
    </div>
  );
}
