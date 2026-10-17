import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About HangoutBaba</h1>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <p>HangoutBaba is a free, anonymous real-time chat platform. Talk to real people without creating an account, sharing your email, or providing any personal information.</p>
          <h2 className="text-xl font-semibold text-gray-800">Our Mission</h2>
          <p>We believe conversations should be easy and private. Most chat platforms require you to create an account, verify your phone, set up a profile, and hand over personal data before you can say a single word. We think that&apos;s backwards.</p>
          <p>With HangoutBaba, you open the site and start talking. That&apos;s it.</p>
          <h2 className="text-xl font-semibold text-gray-800">How It Works</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You receive a random anonymous username automatically.</li>
            <li>You can join any public chatroom instantly.</li>
            <li>Your session is temporary. When you leave, your identity doesn&apos;t persist.</li>
            <li>You can change your username at any time during your session.</li>
          </ul>
          <h2 className="text-xl font-semibold text-gray-800">Community</h2>
          <p>We have moderation tools to keep conversations safe. You can report messages that violate our <Link href="/community-guidelines" className="text-accent-600 hover:underline">Community Guidelines</Link>.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
