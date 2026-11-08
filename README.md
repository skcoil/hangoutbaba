# HangoutBaba — 100% Serverless Anonymous Real-Time Chat & 1-to-1 Video

A modern, serverless anonymous communication platform built with **Next.js 14 (Static Export)**, **WebRTC (Peer-to-Peer Video)**, and **Google Firebase (Hosting + Cloud Firestore)**. 

No signup, no login, no backend server to maintain, and no external database fees. Join live topic chatrooms or start **random 1-to-1 video calls** with strangers instantly.

🚀 **Live URL:** [https://hangout-baba.web.app](https://hangout-baba.web.app)  
🌐 **Alternative URL:** [https://hangout-baba.firebaseapp.com](https://hangout-baba.firebaseapp.com)

---

## ⚡ Key Highlights

- **📹 Random 1-to-1 Video Chat (Omegle-Style):** Direct peer-to-peer WebRTC encrypted video and audio streaming with random strangers. Instant next matching (`ESC` key support), mic/camera toggles, and live in-call text chat.
- **100% Serverless & Zero-Maintenance:** No Node.js backend server or video relay costs. Video runs directly browser-to-browser via WebRTC using Google's free STUN infrastructure.
- **No Self-Managed Database:** Uses Google Cloud Firestore Client SDK directly from the browser within Firebase's 100% Free (Spark) Plan for signaling and chat.
- **Real-Time WebSockets:** Live chat messaging, typing indicators, and online user counts powered by Firestore's real-time listeners (`onSnapshot`).
- **Complete Anonymity:** Auto-generates friendly usernames (e.g. `BrightFox42`, `CosmicTiger88`) stored only in client `localStorage`.
- **Smart Room Title Generator:** Generates human-readable room titles from the first message via natural keyword frequency analysis (no paid AI API required).
- **Pre-Configured Default Rooms:** 14 built-in chatrooms (General, Technology, Gaming, Music, Pune, India, Memes, etc.) + support for dynamic custom rooms.

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router, Static Export) | Fast static page generation, client-side routing |
| **Video & Audio Calling** | [WebRTC](https://webrtc.org/) (`RTCPeerConnection`) | 100% Free, zero-latency direct Peer-to-Peer encrypted video streaming |
| **NAT Traversal / STUN** | Google STUN (`stun.l.google.com:19302`) | Public IP & candidate discovery for P2P connection |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type-safety across components, hooks, and WebRTC states |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Modern UI, responsive design, custom animations |
| **Database & Signaling** | [Google Cloud Firestore](https://firebase.google.com/docs/firestore) | WebRTC SDP offer/answer exchange, presence, text messages |
| **Static Web Hosting** | [Firebase Hosting](https://firebase.google.com/docs/hosting) | Global CDN hosting (100% free forever on Spark tier) |

---

## 📁 Project Structure

```text
hangoutbaba/
├── firebase.json                 # Firebase Hosting rewrites & Firestore rules config
├── firestore.rules               # Firestore security rules
├── .firebaserc                   # Firebase project binding (hangout-baba)
├── next.config.js                # Next.js static export (output: 'export')
├── package.json                  # Dependencies & scripts (dev, build, deploy)
├── out/                          # Compiled production static bundle
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Global HTML layout & meta tags
│   │   ├── globals.css           # Tailwind CSS & animations
│   │   ├── page.tsx              # Landing homepage with video & text CTA
│   │   ├── video/page.tsx        # 📹 1-to-1 Random Video Chat page (Omegle style)
│   │   ├── chat/page.tsx         # Chat room directory
│   │   ├── room/[slug]/
│   │   │   ├── page.tsx          # SSG server component (generateStaticParams)
│   │   │   └── RoomClient.tsx    # Live chatroom client UI
│   │   ├── about/page.tsx        # About page
│   │   ├── privacy/page.tsx      # Privacy policy
│   │   └── community-guidelines/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                   # Reusable UI (Button, Input, Modal, Spinner, Badge)
│   │   ├── layout/               # Header (with Video Chat badge) & Footer
│   │   └── chat/                 # Chat components (MessageList, MessageItem, RoomSidebar)
│   │
│   ├── hooks/
│   │   ├── useVideoChat.ts       # 📹 WebRTC P2P video chat & matchmaking hook
│   │   ├── useSession.ts         # Anonymous session & username management (localStorage)
│   │   ├── useSocket.ts          # Realtime room chat hook powered by Firestore
│   │   └── useRooms.ts           # Firestore rooms synchronization hook
│   │
│   └── lib/
│       ├── webrtc.ts             # WebRTC configuration & media stream helpers
│       ├── firebase.ts           # Firebase App & Firestore initialization
│       ├── defaultRooms.ts       # 14 default built-in rooms
│       ├── titleGenerator.ts     # Deterministic room title generator
│       ├── username.ts           # Random anonymous username generator
│       └── sanitize.ts           # Browser-safe XSS sanitization
```

---

## 🚀 Getting Started (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/mdey0108/hangoutbaba.git
cd hangoutbaba
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="hangout-baba.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="hangout-baba"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="hangout-baba.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📹 How 1-to-1 Video Chat Works

1. **Queue Matching:** Users looking for a video partner register in Firestore's `/video_queue`.
2. **Atomic Pairing:** An atomic Firestore transaction pairs two online waiting strangers without race conditions.
3. **P2P Signaling:** User A (Caller) creates an SDP Offer; User B (Callee) returns an SDP Answer through `/video_calls/{callId}`.
4. **Direct Media Stream:** WebRTC connects both browsers directly via Google STUN. Video and audio flow directly between users with 0 server relay delay.
5. **Instant Next (`ESC`):** Pressing the Escape key or "Next Stranger" instantly tears down the current call and rematches with the next available stranger.

---

## 📦 Build & Deploy to Firebase Hosting

```bash
npm run deploy
```
*(Runs `next build` followed by `firebase deploy` to update both Hosting and Firestore security rules).*

---

## 🛡️ Security & Privacy

- **No Video Stored on Servers:** Video streams are direct browser-to-browser P2P WebRTC. No intermediate recording or cloud storage of media.
- **No Registration or Account:** Users never need an email, phone number, or login.
- **Granular Security:** Heartbeat-based auto-cleanup prevents ghost users in the queue if a browser tab is abruptly closed.

---

## 📄 License
MIT License. Feel free to use, modify, and distribute.
