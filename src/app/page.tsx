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
  { step: '2', text: 'Get an anonymous identity instantly' },
  { step: '3', text: 'Join a room or start 1-to-1 video' },
  { step: '4', text: 'Talk freely with real people' },
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
        <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-accent-50 text-accent-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-accent-200/50">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>
              {totalOnlineUsers > 0
                ? `${totalOnlineUsers.toLocaleString()} ${totalOnlineUsers === 1 ? 'person' : 'people'} online right now`
                : '100% Free Anonymous Video & Text Chat'}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Talk freely.
            <br />
            <span className="text-accent-600">Stay completely anonymous.</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
            Join group chatrooms or start <strong>random 1-to-1 video calls</strong> with strangers across the globe. No signup, no profile, zero trackers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/video" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-700 hover:to-indigo-700 shadow-md shadow-accent-600/20 flex items-center justify-center gap-2">
                <span>📹</span> Random Video Chat (New)
              </Button>
            </Link>
            <Link href="/chat" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-7 flex items-center justify-center gap-2">
                <span>💬</span> Browse Rooms
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto px-6 flex items-center justify-center gap-2 text-gray-600"
              onClick={() => setModalOpen(true)}
            >
              <span>✨</span> New Room
            </Button>
          </div>
          <p className="mt-6 text-xs text-gray-400">No account required • WebRTC encrypted video • Free forever</p>
        </section>

        {/* 📹 Video Chat Promo Card */}
        <section className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/20 border border-accent-400/30 text-accent-300 text-xs font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-ping" />
                Omegle-Style Stranger Video
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Live 1-to-1 Random Video Chat</h2>
              <p className="text-sm text-slate-300">
                Talk face-to-face with random people. Direct peer-to-peer WebRTC connection with built-in instant skip (ESC) and 1-to-1 live text chat.
              </p>
            </div>
            <Link href="/video" className="shrink-0 w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-950 font-bold px-8 shadow-lg">
                Try Video Chat Now →
              </Button>
            </Link>
          </div>
        </section>

        {/* 🔥 Trending Rooms based on active users */}
        <section className="max-w-4xl mx-auto px-4 py-10">
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
              No account required. Video calls are direct peer-to-peer WebRTC connections without intermediate video recording or storage.
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
