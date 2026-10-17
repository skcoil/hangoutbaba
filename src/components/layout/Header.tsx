'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
          <span className="text-2xl">💬</span>
          <span className="text-accent-600">HangoutBaba</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/chat" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Chat</Link>
          <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</Link>
          <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Privacy</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/chat">
            <Button size="sm">Start Chatting</Button>
          </Link>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-3 animate-fade-in">
          <Link href="/chat" className="text-sm text-gray-700 py-2" onClick={() => setMenuOpen(false)}>Chat</Link>
          <Link href="/about" className="text-sm text-gray-700 py-2" onClick={() => setMenuOpen(false)}>About</Link>
          <Link href="/privacy" className="text-sm text-gray-700 py-2" onClick={() => setMenuOpen(false)}>Privacy</Link>
        </div>
      )}
    </header>
  );
}
