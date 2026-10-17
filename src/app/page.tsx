'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useRooms } from '@/hooks/useRooms';
import { CreateRoomModal } from '@/components/chat/CreateRoomModal';
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

const HOW_IT_WORKS = [
  { step: '1', text: 'Open the site' },
  { step: '2', text: 'Get a random username automatically' },
  { step: '3', text: 'Join any chatroom' },
  { step: '4', text: 'Start talking instantly' },
];

export default function HomePage() {
  const { trendingRooms, totalOnlineUsers, loading, createRoom } = useRooms();
  const [modalOpen, setModalOpen] = useState(false);

  // Take top 6 trending rooms
  const topTrending = trendingRooms.slice(0, 6);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-accent-50 text-accent-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>
              {totalOnlineUsers > 0
                ? `${totalOnlineUsers.toLocaleString()} ${totalOnlineUsers === 1 ? 'person' : 'people'} chatting right now`
                : '100% Free Anonymous Chatrooms'}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Talk freely.
            <br />
            <span className="text-accent-600">Stay anonymous.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
            Join conversations with real people without creating an account.
            No signup. No profile. No personal information required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/chat">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Start Chatting →
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto px-8 flex items-center justify-center gap-2"
              onClick={() => setModalOpen(true)}
            >
              <span>✨</span> Create New Room
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-400">No signup • No profile • Free forever</p>
        </section>

        {/* 🔥 Trending Rooms based on active users */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>🔥</span> Trending Chatrooms
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Ranked live by active users in each room
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700 bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Room</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {topTrending.map((room) => {
                const emoji = CATEGORY_EMOJIS[room.category] || '💬';
                return (
                  <Link
                    key={room.slug}
                    href={`/room/${room.slug}`}
                    prefetch={false}
                    className="group flex flex-col justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-accent-300 hover:shadow-md transition-all duration-150 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl p-2 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">
                          {emoji}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-accent-600 transition-colors text-sm truncate">
                            {room.name}
                          </h3>
                          <span className="text-xs text-gray-400 capitalize">
                            {room.category}
                          </span>
                        </div>
                      </div>

                      {room.activeUserCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          {room.activeUserCount} online
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 shrink-0">
                          Open
                        </span>
                      )}
                    </div>

                    {room.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                        {room.description}
                      </p>
                    )}

                    <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-accent-600 font-medium">
                      <span>Join Room</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-6">
            <Link href="/chat">
              <Button variant="secondary" size="sm" className="px-6">
                View All Rooms ({trendingRooms.length}) →
              </Button>
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 bg-accent-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <p className="text-gray-600 text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy note */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <span className="text-3xl mb-4 block">🔒</span>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your Privacy Matters</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              No account required. Your identity is temporary and anonymous.
              We only process what&apos;s necessary to keep the service running safely.
            </p>
            <Link href="/privacy" className="inline-flex items-center gap-1 mt-4 text-sm text-accent-600 hover:text-accent-700 font-medium">
              Learn more →
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* Create Room Modal */}
      <CreateRoomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreateRoom={createRoom}
      />
    </div>
  );
}
