import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HangoutBaba — Anonymous Chat',
  description: 'Chat with people anonymously. No signup, no login, no profile. Just choose a room and start talking.',
  keywords: ['anonymous chat', 'random chat', 'chat rooms', 'no signup chat'],
  openGraph: {
    title: 'HangoutBaba — Anonymous Chat',
    description: 'Chat with people anonymously. No signup, no login, no profile.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
