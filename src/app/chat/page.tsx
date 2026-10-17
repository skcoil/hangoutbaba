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
      <div className="h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <header className="h-14 border-b border-gray-100 flex items-center px-4 gap-3 bg-white/90 backdrop-blur-sm">
        <Link href="/" className="font-bold text-accent-600 text-lg flex items-center gap-1.5">
          <span>💬</span> HangoutBaba
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">Choose a room to start chatting</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <RoomSidebar
          rooms={rooms}
          loading={roomsLoading}
          onCreateRoom={createRoom}
        />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-gray-50">
          <span className="text-5xl mb-4">💬</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome, {session?.username || 'friend'}!</h2>
          <p className="text-gray-500 max-w-sm mb-6">
            Select a room from the sidebar to join the conversation, or create your own topic room.
          </p>
          <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
            <span>✨</span> Create New Chatroom
          </Button>
          <p className="mt-8 text-xs text-gray-400">
            Your anonymous username: <strong className="text-gray-600">{session?.username}</strong>
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
