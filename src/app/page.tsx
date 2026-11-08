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

export default function HomePage() {
  const { trendingRooms, totalOnlineUsers, loading, createRoom } = useRooms();
  const [modalOpen, setModalOpen] = useState(false);

  // Take top 6 trending rooms
  const topTrending = trendingRooms.slice(0, 6);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-accent-100 selection:text-accent-900">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-10 pb-8 sm:pt-14 sm:pb-10 bg-gradient-to-b from-slate-50/80 via-white to-white border-b border-slate-100/80">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-r from-accent-400/10 via-indigo-400/15 to-purple-400/10 blur-3xl pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto px-4 text-center">
            {/* Live Online Badge */}
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium px-3.5 py-1.5 rounded-full mb-5 border border-slate-200/80 shadow-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>
                {totalOnlineUsers > 0
                  ? `${totalOnlineUsers.toLocaleString()} ${totalOnlineUsers === 1 ? 'person' : 'people'} online now`
                  : '100% Free & Anonymous'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">No Signup Required</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-4 leading-[1.15]">
              Talk Freely.{' '}
              <span className="bg-gradient-to-r from-accent-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Stay Anonymous.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
              Instant 1-to-1 video calls with random strangers or join active topic chatrooms. Encrypted peer-to-peer, zero profile, zero tracking.
            </p>

            {/* Dual Launch Cards (Short & Attractive Showcase) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              
              {/* Card 1: 📹 1-to-1 Random Video Chat */}
              <div className="relative group overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl hover:border-accent-500/60 hover:shadow-accent-500/10 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl p-2 bg-white/10 rounded-xl">📹</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Random Video Chat</h3>
                  <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                    Face-to-face peer-to-peer WebRTC video with strangers. Instant skip with ESC key & in-call text chat.
                  </p>
                </div>
                <Link href="/video" className="block">
                  <Button size="md" className="w-full bg-accent-600 hover:bg-accent-500 text-white font-semibold text-xs sm:text-sm py-2.5 shadow-md shadow-accent-600/30 flex items-center justify-center gap-2">
                    <span>Start Video Chat</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Button>
                </Link>
              </div>

              {/* Card 2: 💬 Topic Chatrooms */}
              <div className="relative group overflow-hidden bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-md hover:border-accent-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl p-2 bg-accent-50 rounded-xl">💬</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200/60">
                      {trendingRooms.length} Active Rooms
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Topic Chatrooms</h3>
                  <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                    Join live discussions on tech, gaming, fun, or create your own instant chatroom in seconds.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/chat" className="flex-1">
                    <Button size="md" variant="secondary" className="w-full text-xs sm:text-sm py-2.5 flex items-center justify-center gap-1.5 font-semibold">
                      <span>Explore Rooms</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </Button>
                  </Link>
                  <Button
                    size="md"
                    variant="ghost"
                    className="px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                    onClick={() => setModalOpen(true)}
                    title="Create a new chatroom"
                  >
                    + New
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 🔥 Trending Chatrooms Section */}
        <section className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span>🔥</span> Trending Chatrooms
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active community rooms sorted live by current online users
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700 bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
            >
              <span>+ Create Room</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {topTrending.map((room) => {
                const emoji = CATEGORY_EMOJIS[room.category] || '💬';
                return (
                  <Link
                    key={room.slug}
                    href={`/room/${room.slug}`}
                    prefetch={false}
                    className="group flex flex-col justify-between p-3.5 bg-white border border-slate-100 rounded-xl hover:border-accent-300 hover:shadow-md transition-all duration-150 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl p-1.5 bg-slate-50 rounded-lg group-hover:scale-110 transition-transform">
                          {emoji}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 group-hover:text-accent-600 transition-colors text-xs sm:text-sm truncate">
                            {room.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {room.category}
                          </span>
                        </div>
                      </div>

                      {room.activeUserCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          {room.activeUserCount}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 shrink-0">Open</span>
                      )}
                    </div>

                    {room.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                        {room.description}
                      </p>
                    )}

                    <div className="mt-auto pt-1.5 border-t border-slate-50 flex items-center justify-between text-[11px] text-accent-600 font-medium">
                      <span>Join Room</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-5">
            <Link href="/chat">
              <Button variant="secondary" size="sm" className="px-5 text-xs font-semibold text-slate-700">
                Browse All Rooms ({trendingRooms.length}) →
              </Button>
            </Link>
          </div>
        </section>

        {/* 🔒 Quick Trust & Privacy Strip (Clean, Short 3-Point Bar) */}
        <section className="border-t border-slate-100 bg-slate-50/70 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
              
              <div className="flex items-center sm:items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                <span className="text-2xl p-2 bg-accent-50 rounded-lg shrink-0">⚡</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Zero Signup</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    No email, password, or profile. Instant anonymous identity on every visit.
                  </p>
                </div>
              </div>

              <div className="flex items-center sm:items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                <span className="text-2xl p-2 bg-emerald-50 rounded-lg shrink-0">🔒</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">P2P Encrypted</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Direct browser-to-browser WebRTC video calls with zero server recordings.
                  </p>
                </div>
              </div>

              <div className="flex items-center sm:items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                <span className="text-2xl p-2 bg-purple-50 rounded-lg shrink-0">🛡️</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Safe & Free</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Instant user skip, mute, reporting, and 100% free anonymous communication.
                  </p>
                </div>
              </div>

            </div>
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
