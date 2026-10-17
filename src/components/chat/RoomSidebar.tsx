'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { RoomData } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

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
}

export function RoomSidebar({ rooms, currentSlug, loading, onNewRoom }: RoomSidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return rooms;
    const q = search.toLowerCase();
    return rooms.filter((r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }, [rooms, search]);

  const defaultRooms = filtered.filter((r) => r.isDefault);
  const customRooms = filtered.filter((r) => !r.isDefault);

  return (
    <aside className="flex flex-col h-full bg-white border-r border-gray-100 w-64">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 text-sm">Rooms</h2>
          {onNewRoom && (
            <button
              onClick={onNewRoom}
              className="text-accent-600 hover:text-accent-700 p-1 rounded-lg hover:bg-accent-50 transition-colors"
              title="New Chat"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
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
            {defaultRooms.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Default</p>
                {defaultRooms.map((room) => <RoomItem key={room.id} room={room} isActive={room.slug === currentSlug} />)}
              </div>
            )}
            {customRooms.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Chats</p>
                {customRooms.map((room) => <RoomItem key={room.id} room={room} isActive={room.slug === currentSlug} />)}
              </div>
            )}
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No rooms found</p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function RoomItem({ room, isActive }: { room: RoomData; isActive: boolean }) {
  const emoji = CATEGORY_EMOJIS[room.category] || '💬';
  return (
    <Link
      href={`/room/${room.slug}`}
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
      {room.activeUserCount > 0 && (
        <span className="text-xs text-gray-400 shrink-0 ml-2">{room.activeUserCount}</span>
      )}
    </Link>
  );
}
