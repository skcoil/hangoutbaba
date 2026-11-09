'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useSocket } from '@/hooks/useSocket';
import { useRooms } from '@/hooks/useRooms';
import { RoomData } from '@/types';
import { getRoomBySlug } from '@/lib/defaultRooms';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { RoomSidebar } from '@/components/chat/RoomSidebar';
import { ConnectionStatus } from '@/components/chat/ConnectionStatus';
import { Spinner } from '@/components/ui/Spinner';

function getPathSlug(fallback?: string): string {
  if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last !== 'room' && last !== 'chat') {
      return decodeURIComponent(last).toLowerCase();
    }
  }
  return (fallback || 'general').toLowerCase();
}

export default function RoomClient() {
  const params = useParams();
  const paramsSlug = params?.slug as string;

  // Accurately resolve slug from URL pathname (essential for static export dynamic rewrites)
  const [slug, setSlug] = useState<string>(() => getPathSlug(paramsSlug));

  useEffect(() => {
    const actual = getPathSlug(paramsSlug);
    if (actual && actual !== slug) {
      setSlug(actual);
    }
  }, [paramsSlug, slug]);

  useEffect(() => {
    const handlePopState = () => {
      setSlug(getPathSlug());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const { session, loading: sessionLoading } = useSession();
  const { rooms, loading: roomsLoading, createRoom } = useRooms();
  const {
    status,
    messages,
    typingUsers,
    onlineCount,
    joinRoom,
    leaveRoom,
    sendMessage,
    deleteMessage,
    startTyping,
    stopTyping,
  } = useSocket(session);

  const [room, setRoom] = useState<RoomData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentRoomRef = useRef(slug);

  useEffect(() => {
    currentRoomRef.current = slug;
  }, [slug]);

  // Determine current room metadata
  useEffect(() => {
    if (!slug) return;
    const foundInDefault = getRoomBySlug(slug);
    if (foundInDefault) {
      setRoom(foundInDefault);
      return;
    }

    const foundInRooms = rooms.find((r) => r.slug === slug);
    if (foundInRooms) {
      setRoom(foundInRooms);
      return;
    }

    setRoom({
      id: slug,
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
      category: 'general',
      description: 'Public chat room',
      isDefault: false,
      activeUserCount: 1,
      createdAt: new Date().toISOString(),
    });
  }, [slug, rooms]);

  // Join room in Firebase
  useEffect(() => {
    if (!session || !slug) return;
    const cleanup = joinRoom(slug);
    return () => {
      cleanup?.();
      leaveRoom(slug);
    };
  }, [session, slug, joinRoom, leaveRoom]);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(slug, content);
    },
    [slug, sendMessage]
  );

  const handleReport = useCallback(
    async (messageId: string, reason: string) => {
      if (!session) return;
      if (isFirebaseConfigured) {
        try {
          await addDoc(collection(db, 'reports'), {
            messageId,
            reporterId: session.id,
            reason,
            roomSlug: slug,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('[RoomClient] Report submit error:', err);
        }
      }
    },
    [session, slug]
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      deleteMessage(messageId);
    },
    [deleteMessage]
  );

  if (sessionLoading || !room) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-white">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-gray-100 flex items-center justify-between px-3 sm:px-4 gap-2 bg-white z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile Back to Rooms */}
          <Link
            href="/chat"
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="Back to rooms"
            title="All Rooms"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Desktop Logo */}
          <Link href="/" className="hidden md:flex font-bold text-accent-600 text-base items-center gap-1.5 shrink-0">
            <span>💬</span> HangoutBaba
          </Link>

          <span className="hidden md:block text-gray-200 shrink-0">|</span>

          {/* Room Name & Category */}
          <div className="min-w-0 flex items-center gap-1.5">
            <h1 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
              {room?.name}
            </h1>
            <span className="hidden sm:inline-block text-[11px] text-gray-400 capitalize bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
              {room?.category}
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/video" className="hidden sm:inline-block">
            <span className="text-xs font-semibold text-accent-600 hover:text-accent-700 bg-accent-50 border border-accent-200/60 px-2 py-1 rounded-full flex items-center gap-1">
              <span>📹</span> Video
            </span>
          </Link>

          <span className="text-[11px] sm:text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <strong className="text-gray-700 font-semibold">{onlineCount}</strong> online
          </span>

          <ConnectionStatus status={status} />

          {/* Mobile Drawer Toggle */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            onClick={() => setSidebarOpen(true)}
            aria-label="Browse rooms"
            title="Browse rooms"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <div className="hidden md:block w-64 lg:w-72 shrink-0 h-full border-r border-gray-100">
          <RoomSidebar rooms={rooms} currentSlug={slug} loading={roomsLoading} className="w-full" onCreateRoom={createRoom} />
        </div>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col animate-fade-in">
              <div className="flex items-center justify-between p-3.5 border-b border-gray-100">
                <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <span>💬</span> All Chatrooms
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden" onClick={() => setSidebarOpen(false)}>
                <RoomSidebar rooms={rooms} currentSlug={slug} loading={roomsLoading} className="w-full" onCreateRoom={createRoom} />
              </div>
            </div>
          </div>
        )}

        {/* Chat area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <MessageList
            messages={messages}
            typingUsers={typingUsers}
            currentSessionId={session?.id || ''}
            hasMore={false}
            loadingMore={false}
            onLoadMore={() => {}}
            onReport={handleReport}
            onDelete={handleDelete}
          />
          <MessageInput
            onSend={handleSend}
            onTypingStart={() => startTyping(slug)}
            onTypingStop={() => stopTyping(slug)}
            disabled={status === 'disconnected'}
          />
        </main>
      </div>
    </div>
  );
}
