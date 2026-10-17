'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { RoomData } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { CreateRoomModal } from '@/components/chat/CreateRoomModal';

const CATEGORY_EMOJIS: Record<string, string> = {
  general: '💬',
  tech: '💻',
  gaming: '🎮',
  entertainment: '🎵',
  social: '❤️',
  education: '🧠',
  lifestyle: '✈️',
  regional: '🌍',
  fun: '😂',
};

interface RoomSidebarProps {
  rooms: RoomData[];
  currentSlug?: string;
  loading?: boolean;
  onNewRoom?: () => void;
  onCreateRoom?: (name: string, category: string, description: string) => Promise<string | null>;
}

export function RoomSidebar({ rooms, currentSlug, loading, onNewRoom, onCreateRoom }: RoomSidebarProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return rooms;
    const q = search.toLowerCase();
    return rooms.filter((r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }, [rooms, search]);

  const defaultRooms = filtered.filter((r) => r.isDefault);
  const customRooms = filtered.filter((r) => !r.isDefault);

  function handlePlusClick() {
    if (onCreateRoom) {
      setModalOpen(true);
    } else if (onNewRoom) {
      onNewRoom();
    }
  }

  return (
    <>
      <aside className="flex flex-col h-full bg-white border-r border-gray-100 w-64">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-sm">Rooms</h2>
            {(onCreateRoom || onNewRoom) && (
              <button
                onClick={handlePlusClick}
                className="text-accent-600 hover:text-accent-700 p-1.5 rounded-lg hover:bg-accent-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Create New Room"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New</span>
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          />
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex justify-center p-6"><Spinner size="sm" /></div>
          ) : (
            <>
              {customRooms.length > 0 && (
                <div className="mb-3">
                  <p className="px-4 py-1.5 text-xs font-semibold text-accent-600 uppercase tracking-wide flex items-center gap-1">
                    <span>✨</span> Custom Rooms ({customRooms.length})
                  </p>
                  {customRooms.map((room) => <RoomItem key={room.id} room={room} isActive={room.slug === currentSlug} />)}
                </div>
              )}
              {defaultRooms.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Default Rooms
                  </p>
                  {defaultRooms.map((room) => <RoomItem key={room.id} room={room} isActive={room.slug === currentSlug} />)}
                </div>
              )}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-400 mb-3">No rooms found</p>
                  {onCreateRoom && (
                    <button
                      onClick={() => setModalOpen(true)}
                      className="text-xs text-accent-600 font-semibold hover:underline"
                    >
                      + Create this room
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Create Room Modal */}
      {onCreateRoom && (
        <CreateRoomModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreateRoom={onCreateRoom}
        />
      )}
    </>
  );
}

function RoomItem({ room, isActive }: { room: RoomData; isActive: boolean }) {
  const emoji = CATEGORY_EMOJIS[room.category] || '💬';
  return (
    <Link
      href={`/room/${room.slug}`}
      prefetch={false}
      className={`flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-accent-50 border-r-2 border-accent-600' : ''
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-base shrink-0">{emoji}</span>
        <span className={`text-sm truncate ${isActive ? 'text-accent-700 font-medium' : 'text-gray-700'}`}>
          {room.name}
        </span>
      </div>
      {room.activeUserCount > 0 ? (
        <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          {room.activeUserCount}
        </span>
      ) : null}
    </Link>
  );
}
