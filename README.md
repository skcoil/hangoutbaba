# HangoutBaba — 100% Serverless Anonymous Real-Time Chat & 1-to-1 Video

A modern, serverless anonymous communication platform built with **Next.js 14 (Static Export)**, **WebRTC (Peer-to-Peer & CoTURN Relay Video)**, and **Google Firebase (Hosting + Cloud Firestore)**.

No signup, no login, no backend API server to maintain, and zero external database fees. Join live topic chatrooms or start **random 1-to-1 video calls** with strangers globally across any network.

🚀 **Live App:** [https://hangout-baba.web.app](https://hangout-baba.web.app)  
📹 **Direct Video Chat:** [https://hangout-baba.web.app/video](https://hangout-baba.web.app/video)

---

## ⚡ Key Highlights

### 📹 1-to-1 Random Video Chat (Omegle-Style)
- **Cross-Network Global Calling (STUN + TURN):** Seamless connectivity across Wi-Fi, 4G/5G mobile carriers, and strict symmetric NATs powered by a self-hosted **CoTURN server** (UDP/TCP/TLS) backed by **Google, Cloudflare, and Mozilla STUN** fallback pools.
- **Camera Flip (Front / Back Switch):** Seamlessly toggle between front and rear cameras mid-call on mobile and multi-camera devices without interrupting the active stream (`sender.replaceTrack`).
- **Interactive Video Swap (PiP):** Tap or click the Picture-in-Picture window anytime to swap between the Stranger video and Self video in the main view.
- **Universal In-Call File Sharing:** Send **any file type** directly inside video chat — **Images** (auto-compressed with fullscreen lightbox preview), **PDFs, Word Docs, Spreadsheets, ZIP/RAR Archives, Audio, Video, APKs, and Code files** rendered as dedicated download cards with custom format icons, size badges, and 1-click downloads.
- **Mobile Background Call Retention:** Dedicated background `<audio>` element prevents mobile OS suspension when switching apps or locking screens; includes a **25-second reconnection grace period** with automatic `pc.restartIce()`, **Screen Wake Lock**, and automatic **camera hardware re-acquisition** upon returning to the tab.
- **Smart Auto-Skip:** If the connected partner disconnects or skips to the next person, the remaining user automatically transitions into finding the next available stranger.
- **Keyboard Shortcuts:** Press `ESC` to instantly skip to the next stranger.

### 💬 Topic Chatrooms
- **100% Serverless Real-Time Messaging:** Powered by Google Cloud Firestore's real-time listeners (`onSnapshot`), supporting instant messages, live typing indicators, and active online user presence.
- **Pre-Configured & Dynamic Rooms:** 14 built-in chatrooms (General, Technology, Gaming, Music, Pune, India, Memes, etc.) plus instant custom room creation.
- **Smart Room Title Generator:** Generates human-readable room titles from initial context using deterministic keyword analysis (zero paid AI APIs).
- **Complete Anonymity:** Auto-generates fun usernames (e.g., `BrightFox42`, `CosmicTiger88`) stored strictly in browser `localStorage`, combined with browser-safe XSS sanitization.

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router, Static Export) | Fast static HTML generation (`output: 'export'`) and client-side routing |
| **Video & Audio Calling** | [WebRTC](https://webrtc.org/) (`RTCPeerConnection`) | Encrypted browser-to-browser P2P video/audio streaming |
| **NAT Traversal / Relay** | Self-Hosted **CoTURN** + Public STUN Pools | Cross-network UDP/TCP/TLS relay (ports `3478` & `5349`) and IP discovery |
| **Signaling & Database** | [Google Cloud Firestore](https://firebase.google.com/docs/firestore) | Atomic matchmaking transactions, SDP offer/answer exchange, ICE trickle, chat |
| **Static Web Hosting** | [Firebase Hosting](https://firebase.google.com/docs/hosting) | Global HTTPS CDN hosting |
| **Language & Styling** | [TypeScript](https://www.typescriptlang.org/) & [Tailwind CSS](https://tailwindcss.com/) | Strict type safety and responsive mobile-first UI |

---

## 📁 Project Structure

```text
hangoutbaba/
├── firebase.json                 # Firebase Hosting rewrites & Firestore rules config
├── firestore.rules               # Firestore security rules
├── .firebaserc                   # Firebase project binding
├── next.config.js                # Next.js static export configuration
├── package.json                  # Dependencies & build/deploy scripts
├── out/                          # Compiled static production bundle
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Global layout & metadata
│   │   ├── globals.css           # Tailwind CSS & custom animations
│   │   ├── page.tsx              # Landing homepage
│   │   ├── video/page.tsx        # 📹 1-to-1 Video Chat UI (PiP swap, flip cam, universal file share)
│   │   ├── chat/page.tsx         # Chat room directory
│   │   ├── room/[slug]/
│   │   │   ├── page.tsx          # SSG room entry page
│   │   │   └── RoomClient.tsx    # Live chatroom client UI
│   │   ├── about/page.tsx
│   │   ├── privacy/page.tsx
│   │   └── community-guidelines/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                   # Reusable UI components (Button, Input, Modal, Spinner, Badge)
│   │   ├── layout/               # Header & Footer
│   │   └── chat/                 # Chatroom UI components (MessageList, MessageItem, RoomSidebar, etc.)
│   │
│   ├── hooks/
│   │   ├── useVideoChat.ts       # 📹 WebRTC P2P engine, atomic matchmaking, grace recovery & signaling
│   │   ├── useSession.ts         # Anonymous session & username persistence
│   │   ├── useSocket.ts          # Real-time Firestore room chat hook
│   │   └── useRooms.ts           # Firestore rooms sync hook
│   │
│   └── lib/
│       ├── webrtc.ts             # ICE config loader (CoTURN -> Metered fallback -> Multi-STUN)
│       ├── firebase.ts           # Firebase App & Firestore client setup
│       ├── defaultRooms.ts       # 14 built-in chatrooms
│       ├── titleGenerator.ts     # Deterministic room title generator
│       ├── username.ts           # Anonymous username generator
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
Create a `.env.local` file in the root directory (ensure `.env.local` is never committed to Git):

```env
# Firebase Web App Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Self-Hosted CoTURN Server (Recommended for cross-network mobile 4G/5G calls)
NEXT_PUBLIC_TURN_URL="turn:YOUR_SERVER_IP:3478?transport=udp,turn:YOUR_SERVER_IP:3478?transport=tcp,turns:YOUR_SERVER_IP:5349?transport=tcp"
NEXT_PUBLIC_TURN_USERNAME="your-turn-username"
NEXT_PUBLIC_TURN_CREDENTIAL="your-turn-password"

# Optional: Dynamic Metered TURN API Fallback
# NEXT_PUBLIC_METERED_DOMAIN="your-metered-app"
# NEXT_PUBLIC_METERED_API_KEY="your-metered-api-key"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Self-Hosted CoTURN Setup (For Lifetime Free Relay)

For reliable global calling across strict mobile carrier NATs (e.g., 4G/5G to Wi-Fi), you can deploy **CoTURN** on any Always-Free Cloud VM (such as Oracle Cloud Always Free Tier):

1. Open ingress ports on your cloud firewall & OS firewall:
   - `3478` (TCP & UDP) — Standard STUN/TURN
   - `5349` (TCP & UDP) — Secure TURNS (TLS)
   - `49152–65535` (UDP) — Media relay port range
2. Install `coturn` and configure `/etc/coturn/turnserver.conf` with `lt-cred-mech`, your VM's `external-ip`, and a strong long-term user credential.
3. Add your `NEXT_PUBLIC_TURN_*` variables to `.env.local` and rebuild (`npm run build`).

`src/lib/webrtc.ts` prioritizes your custom TURN credentials first, falls back to Metered if configured, and always maintains Google/Cloudflare/Mozilla STUN servers as baseline NAT discovery.

---

## 📹 How 1-to-1 Video Chat Works

1. **Atomic Queue Matchmaking:** Users register in Firestore's `/video_queue`. An atomic transaction pairs two waiting strangers without race conditions.
2. **Signaling & Trickle ICE:** Caller sends an SDP Offer and Callee responds with an SDP Answer through `/video_calls/{callId}`, streaming ICE candidates in real time.
3. **Resilient Media Streaming:** WebRTC establishes direct browser-to-browser media or seamlessly relays through CoTURN over UDP/TCP/TLS when behind strict firewalls.
4. **Universal Chat & File Transfer:** Text messages and chunk-safe encoded attachments flow securely inside `/video_calls/{callId}/messages` during the session.
5. **Graceful Teardown & Auto-Next:** Leaving or pressing `ESC` cleans up active signaling docs, triggers peer auto-rematching, and updates presence heartbeats.

---

## 📦 Build & Deploy to Firebase Hosting

```bash
# Build static export and deploy to Firebase Hosting + Firestore Rules
npm run deploy
```

To deploy only Hosting after building:
```bash
npm run build
npx firebase-tools deploy --only hosting
```

---

## 🛡️ Security & Privacy

- **Zero Server Media Storage:** All video/audio streams flow directly peer-to-peer or encrypted through stateless TURN relay; nothing is recorded or saved on disk.
- **No Secrets in Version Control:** `.env.local` and private keys remain strictly ignored in `.gitignore`. Never hardcode credentials in client source files or documentation.
- **No Account Required:** Zero emails, phone numbers, or personal PII collected.
- **Presence Cleanup:** Automated queue heartbeats and `beforeunload` cleanup prevent stale ghost sessions.

---

## 📄 License
MIT License. Feel free to use, modify, and distribute.
