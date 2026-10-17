import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: September 2025</p>
        <div className="space-y-8 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">What We Collect</h2>
            <p>We collect minimal information necessary to run the service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
              <li><strong>Anonymous session ID:</strong> A randomly generated identifier for your session.</li>
              <li><strong>Random username:</strong> Auto-generated, not tied to your real identity.</li>
              <li><strong>Chat messages:</strong> Messages you send in chatrooms.</li>
              <li><strong>IP address (hashed):</strong> Used only for security and abuse prevention. Stored as a one-way hash.</li>
              <li><strong>Timestamps:</strong> When sessions are created and when users are active.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">What We Do Not Collect</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>No email address</li>
              <li>No phone number</li>
              <li>No real name</li>
              <li>No profile information</li>
              <li>No payment information</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Retention</h2>
            <p className="text-sm">Chat messages are retained for 7 days by default and then automatically deleted. Anonymous sessions expire after 60 minutes of inactivity. We do not create permanent accounts for anonymous users.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Security</h2>
            <p className="text-sm">IP addresses are stored as cryptographic hashes only, making them non-reversible. We use them solely for abuse prevention such as blocking spam or illegal content.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Moderation</h2>
            <p className="text-sm">We have a moderation system. Reports submitted by users are reviewed by administrators. Administrators have access to session activity and message content for moderation purposes.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact</h2>
            <p className="text-sm">For privacy concerns, please use the report system within the app.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
