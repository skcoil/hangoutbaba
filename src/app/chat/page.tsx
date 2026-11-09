'use client';
import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRooms } from '@/hooks/useRooms';
import { RoomSidebar } from '@/components/chat/RoomSidebar';
import { CreateRoomModal } from '@/components/chat/CreateRoomModal';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function ChatPage() {
  const { session, loading: sessionLoading } = useSession();
  const { rooms, loading: roomsLoading, createRoom } = useRooms();
  const [modalOpen, setModalOpen] = useState(false);

  if (sessionLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-white">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-white overflow-hidden">
      {/* Top bar */}
      <header className="h-14 border-b border-gray-100 flex items-center justify-between px-3 sm:px-4 bg-white/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="font-bold text-accent-600 text-base sm:text-lg flex items-center gap-1.5 shrink-0">
            <span>💬</span> HangoutBaba
          </Link>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="hidden sm:inline text-xs sm:text-sm text-gray-500 truncate">Choose a room to start chatting</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/video">
            <Button size="sm" variant="secondary" className="flex items-center gap-1 text-xs px-2.5 py-1 sm:px-3 sm:py-1.5">
              <span>📹</span> <span className="hidden xs:inline">Video Chat</span>
            </Button>
          </Link>
          <Button size="sm" onClick={() => setModalOpen(true)} className="flex items-center gap-1 text-xs px-2.5 py-1 sm:px-3 sm:py-1.5">
            <span>+</span> <span>New Room</span>
          </Button>
        </div>
      </header>

      {/* Main Content: Full-width list on mobile, Two-column on desktop */}
      <div className="flex flex-1 overflow-hidden">
        {/* On mobile: full width room list */}
        <div className="w-full md:w-72 lg:w-80 h-full border-r border-gray-100 shrink-0 flex flex-col">
          <RoomSidebar
            rooms={rooms}
            loading={roomsLoading}
            className="w-full"
            onCreateRoom={createRoom}
          />
        </div>

        {/* Desktop Welcome screen */}
        <main className="hidden md:flex flex-1 flex-col items-center justify-center text-center px-6 lg:px-12 bg-gray-50/70">
          <div className="w-16 h-16 rounded-3xl bg-accent-100 text-accent-600 flex items-center justify-center text-3xl mb-4 shadow-sm">
            💬
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">
            Welcome, {session?.username || 'friend'}!
          </h2>
          <p className="text-gray-500 text-sm max-w-sm mb-6 leading-relaxed">
            Select any room from the list on the left to join live conversations, or create your own topic.
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 shadow-sm">
              <span>✨</span> Create New Chatroom
            </Button>
            <Link href="/video">
              <Button variant="secondary" className="flex items-center gap-1.5">
                <span>📹</span> Random Video Chat
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-xs text-gray-400">
            Your anonymous identity: <strong className="text-gray-700">{session?.username}</strong>
          </p>
        </main>
      </div>

      <CreateRoomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreateRoom={createRoom}
      />
    </div>
  );
}
