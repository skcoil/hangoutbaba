import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-lg">💬</span>
          <span className="font-medium text-gray-700">HangoutBaba</span>
          <span>— Anonymous chat for everyone</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
          <Link href="/community-guidelines" className="hover:text-gray-700 transition-colors">Guidelines</Link>
          <Link href="/about" className="hover:text-gray-700 transition-colors">About</Link>
        </nav>
      </div>
    </footer>
  );
}
