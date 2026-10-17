import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Community Guidelines</h1>
        <div className="space-y-8 text-gray-600">
          <p>HangoutBaba is an anonymous platform. With anonymity comes responsibility. Please follow these guidelines.</p>
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">✅ Allowed</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Friendly conversations on any topic</li>
              <li>Asking questions and sharing opinions</li>
              <li>Discussing hobbies, tech, entertainment, and daily life</li>
              <li>Being anonymous</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">❌ Not Allowed</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Harassment, threats, or personal attacks</li>
              <li>Sexual content, especially involving minors</li>
              <li>Hate speech based on race, religion, gender, or nationality</li>
              <li>Spam or flooding the chat</li>
              <li>Sharing private or personal information of others</li>
              <li>Illegal content of any kind</li>
              <li>Scams or phishing</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Reporting</h2>
            <p className="text-sm">If you see a message that violates these guidelines, click the flag icon on the message to report it. Our moderation team reviews all reports.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Enforcement</h2>
            <p className="text-sm">Violations may result in a temporary or permanent session ban. Serious violations such as illegal content may be reported to relevant authorities.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
