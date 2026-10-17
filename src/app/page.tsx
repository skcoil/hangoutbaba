import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

const SAMPLE_ROOMS = [
  { emoji: '💬', name: 'General', count: 128 },
  { emoji: '🎮', name: 'Gaming', count: 74 },
  { emoji: '💻', name: 'Technology', count: 52 },
  { emoji: '🎵', name: 'Music', count: 41 },
  { emoji: '❤️', name: 'Relationships', count: 38 },
  { emoji: '🧠', name: 'Study', count: 29 },
];

const HOW_IT_WORKS = [
  { step: '1', text: 'Open the site' },
  { step: '2', text: 'Get a random username automatically' },
  { step: '3', text: 'Join any chatroom' },
  { step: '4', text: 'Start talking instantly' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-accent-50 text-accent-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>1,200+ people chatting right now</span>
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
            <Link href="/chat">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8">
                Explore Rooms
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">No signup • No profile • Free forever</p>
        </section>

        {/* Popular Rooms */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Popular Rooms</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SAMPLE_ROOMS.map((room) => (
              <Link
                key={room.name}
                href={`/room/${room.name.toLowerCase()}`}
                className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-accent-200 hover:shadow-sm transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{room.emoji}</span>
                  <span className="font-medium text-gray-800 group-hover:text-accent-600 transition-colors">{room.name}</span>
                </div>
                <span className="text-sm text-gray-400">{room.count}</span>
              </Link>
            ))}
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
    </div>
  );
}
