# HangoutBaba — 100% Serverless Anonymous Real-Time Chat

A modern, serverless anonymous chat platform built with **Next.js 14 (Static Export)** and **Google Firebase (Hosting + Cloud Firestore)**. 

No signup, no login, no backend server to maintain, and no external database fees. Pick a room and start talking instantly.

🚀 **Live URL:** [https://hangout-baba.web.app](https://hangout-baba.web.app)  
🌐 **Alternative URL:** [https://hangout-baba.firebaseapp.com](https://hangout-baba.firebaseapp.com)

---

## ⚡ Key Highlights

- **100% Serverless & Zero-Maintenance:** No Node.js backend server or container needed. Runs as a high-performance static SPA on Firebase Hosting (CDN).
- **No Self-Managed Database:** Uses Google Cloud Firestore Client SDK directly from the browser within Firebase's 100% Free (Spark) Plan.
- **Real-Time WebSockets:** Live chat messaging, typing indicators, and online user counts powered by Firestore's real-time listeners (`onSnapshot`).
- **Complete Anonymity:** Auto-generates friendly usernames (e.g. `BrightFox42`, `CosmicTiger88`) stored only in client `localStorage`.
- **Smart Room Title Generator:** Generates human-readable room titles from the first message via natural keyword frequency analysis (no paid AI API required).
- **Pre-Configured Default Rooms:** 14 built-in chatrooms (General, Technology, Gaming, Music, Pune, India, Memes, etc.) + support for dynamic custom rooms.

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router, Static Export) | Fast static page generation, client-side routing |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type-safety across components and hooks |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Modern UI, responsive design, custom animations |
| **Database & Realtime** | [Google Cloud Firestore](https://firebase.google.com/docs/firestore) | Real-time messages, presence (typing & active users), reports |
| **Static Web Hosting** | [Firebase Hosting](https://firebase.google.com/docs/hosting) | Global CDN hosting (100% free forever on Spark tier) |

---

## 📁 Project Structure

```text
hangoutbaba/
├── firebase.json                 # Firebase Hosting rewrites & Firestore rules config
├── firestore.rules               # Firestore security rules (read/write limits, reports)
├── .firebaserc                   # Firebase project binding (hangout-baba)
├── next.config.js                # Next.js static export (output: 'export')
├── package.json                  # Dependencies & scripts (dev, build, deploy)
├── out/                          # Compiled production static bundle
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Global HTML layout & meta tags
│   │   ├── globals.css           # Tailwind CSS & animations
│   │   ├── page.tsx              # Landing homepage
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
│   │   ├── layout/               # Header & Footer
│   │   └── chat/                 # Chat components (MessageList, MessageItem, MessageInput, RoomSidebar)
│   │
│   ├── hooks/
│   │   ├── useSession.ts         # Anonymous session & username management (localStorage)
│   │   ├── useSocket.ts          # Realtime chat hook powered by Firestore (messages, typing, presence)
│   │   └── useRooms.ts           # Firestore rooms synchronization hook
│   │
│   └── lib/
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
git clone https://github.com/skcoil/hangoutbaba.git
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
*(If testing locally without Firebase credentials, the app gracefully falls back to local preview mode).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build & Deploy to Firebase Hosting

This project is configured for single-command builds and zero-friction deployment to Firebase Hosting.

### Build Production Bundle
```bash
npm run build
```
This compiles the Next.js application into static HTML, CSS, and JS inside the `out/` directory.

### Deploy to Firebase
```bash
npm run deploy
```
*(Runs `next build` followed by `firebase deploy` to update both Hosting and Firestore security rules).*

---

## 🗄️ Firestore Data Model

The application uses a lightweight, scalable Firestore document schema:

```text
/rooms/{slug}
  ├── name: string
  ├── slug: string
  ├── category: string
  ├── description: string
  ├── createdAt: timestamp
  │
  ├── /messages/{messageId}
  │     ├── content: string (max 500 chars)
  │     ├── username: string
  │     ├── sessionId: string
  │     ├── isDeleted: boolean
  │     └── createdAt: timestamp
  │
  └── /presence/{sessionId}
        ├── username: string
        ├── sessionId: string
        ├── typing: boolean
        └── updatedAt: number (ms)

/reports/{reportId}
  ├── messageId: string
  ├── reporterId: string
  ├── reason: string
  ├── roomSlug: string
  └── createdAt: timestamp
```

---

## 🛡️ Security & Privacy

- **No Passwords or Emails:** Users are never asked for personal identification.
- **Client-Side Sanitization:** Messages are stripped of HTML tags and normalized before write operations to prevent XSS.
- **Granular Firestore Rules (`firestore.rules`):**
  - Content length validation on messages ($\le 500$ characters).
  - Public read/write access strictly scoped to room messages and temporary presence docs.
  - Reports collection allows anonymous creation but restricts read/delete operations to admins via Firebase Console.

---

## 📄 License
MIT License. Feel free to use, modify, and distribute.
