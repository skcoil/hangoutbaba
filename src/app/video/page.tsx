'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useVideoChat } from '@/hooks/useVideoChat';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function VideoChatPage() {
  const { session, loading: sessionLoading } = useSession();
  const {
    status,
    localStream,
    remoteStream,
    partnerUsername,
    isMuted,
    isVideoOff,
    error,
    messages,
    waitingCount,
    initLocalMedia,
    startSearching,
    nextStranger,
    stopChat,
    toggleMute,
    toggleVideo,
    sendMessage,
  } = useVideoChat(session);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Attach local media stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote media stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Auto-scroll in-call chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Automatically start camera preview when user opens video page
  useEffect(() => {
    initLocalMedia().catch(() => {});
  }, [initLocalMedia]);

  // Global ESC key shortcut for "Next Stranger" (classic Omegle feature)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (status === 'connected' || status === 'connecting' || status === 'ended') {
          e.preventDefault();
          nextStranger();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, nextStranger]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  if (sessionLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col">
        {/* Safety Banner */}
        <div className="mb-3 px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>
              <strong>Anonymous 1-to-1 Video:</strong> Never share passwords, bank details, or private information with strangers.
            </span>
          </div>
          {waitingCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-accent-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              {waitingCount} {waitingCount === 1 ? 'stranger' : 'strangers'} waiting
            </span>
          )}
        </div>

        {/* Error Alert if Camera Denied */}
        {error && (
          <div className="mb-4 p-4 bg-red-950/70 border border-red-800/80 text-red-200 rounded-2xl flex items-center gap-3 text-sm">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold">Media Access Notice</p>
              <p className="text-xs text-red-300 mt-0.5">{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => initLocalMedia()}>
              Retry Permission
            </Button>
          </div>
        )}

        {/* Video Canvas & Chat Container */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[500px]">
          {/* Main Video Area (3 cols on desktop) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="relative flex-1 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
              
              {/* Remote Stranger Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  status === 'connected' && remoteStream ? 'opacity-100' : 'opacity-0 absolute'
                }`}
              />

              {/* Status Overlay when NOT connected */}
              {status !== 'connected' && (
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-md animate-fade-in z-10">
                  {status === 'idle' && (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-accent-600/20 text-accent-400 border border-accent-500/30 flex items-center justify-center text-3xl mb-4 shadow-inner">
                        📹
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Random 1-to-1 Video Chat</h2>
                      <p className="text-xs sm:text-sm text-slate-400 mb-6">
                        Click below to get matched instantly with a random stranger. Completely free, anonymous, and encrypted peer-to-peer.
                      </p>
                      <Button size="lg" className="px-8 shadow-lg shadow-accent-600/25" onClick={startSearching}>
                        Start Video Chat →
                      </Button>
                    </>
                  )}

                  {status === 'searching' && (
                    <>
                      <div className="relative mb-5">
                        <div className="w-20 h-20 rounded-full bg-accent-500/20 animate-ping absolute inset-0" />
                        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-accent-500 flex items-center justify-center text-3xl shadow-xl relative">
                          🔍
                        </div>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Looking for a stranger...</h2>
                      <p className="text-xs text-slate-400 mb-5">Waiting for an available partner to connect</p>
                      <Button variant="secondary" size="sm" onClick={stopChat}>
                        Cancel
                      </Button>
                    </>
                  )}

                  {status === 'connecting' && (
                    <>
                      <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
                        <Spinner size="md" />
                      </div>
                      <h2 className="text-lg font-bold text-white mb-1">Stranger Found!</h2>
                      <p className="text-xs text-slate-400">Establishing direct peer-to-peer connection...</p>
                    </>
                  )}

                  {status === 'ended' && (
                    <>
                      <span className="text-4xl mb-3">👋</span>
                      <h2 className="text-lg font-bold text-white mb-1">Stranger has disconnected</h2>
                      <p className="text-xs text-slate-400 mb-6">Ready to talk to someone new?</p>
                      <Button size="lg" className="px-8" onClick={nextStranger}>
                        Find Another Stranger (ESC) →
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Status Pill Badge (Top Left of Video) */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                {status === 'connected' && (
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 text-xs font-medium text-white shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span>Stranger: <strong>{partnerUsername || 'Anonymous'}</strong></span>
                  </div>
                )}
                {status === 'searching' && (
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 text-xs text-accent-300">
                    <span className="w-2 h-2 rounded-full bg-accent-400 animate-ping" />
                    <span>Searching...</span>
                  </div>
                )}
              </div>

              {/* Local Self-Video Preview (Picture-in-Picture in Corner) */}
              <div className="absolute bottom-4 right-4 z-20 w-32 h-24 sm:w-44 sm:h-32 rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-2xl group transition-transform hover:scale-105">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'hidden' : 'block'}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                    <span className="text-xl mb-1">📷</span>
                    <span>Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white flex items-center gap-1 font-medium">
                  <span>You ({session?.username || 'You'})</span>
                  {isMuted && <span className="text-red-400">🔇</span>}
                </div>
              </div>
            </div>

            {/* Video Control Action Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                {status === 'connected' || status === 'connecting' || status === 'ended' ? (
                  <Button
                    size="md"
                    className="bg-accent-600 hover:bg-accent-500 text-white font-semibold px-5 flex items-center gap-1.5 shadow-md"
                    onClick={nextStranger}
                  >
                    <span>Next Stranger</span>
                    <span className="hidden sm:inline text-xs opacity-70 bg-black/30 px-1.5 py-0.5 rounded">ESC</span>
                  </Button>
                ) : status === 'searching' ? (
                  <Button
                    size="md"
                    variant="secondary"
                    className="text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-950/40"
                    onClick={stopChat}
                  >
                    Stop Searching
                  </Button>
                ) : (
                  <Button
                    size="md"
                    className="bg-accent-600 hover:bg-accent-500 text-white font-semibold px-6 shadow-md"
                    onClick={startSearching}
                  >
                    Find Stranger
                  </Button>
                )}

                {(status === 'connected' || status === 'connecting') && (
                  <Button
                    size="md"
                    variant="secondary"
                    className="text-red-400 hover:text-red-300 border-red-900/40 hover:bg-red-950/30"
                    onClick={stopChat}
                  >
                    End Call
                  </Button>
                )}
              </div>

              {/* Hardware Toggles (Mic, Camera, Chat) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`p-2.5 rounded-xl border transition-colors flex items-center justify-center text-sm ${
                    isMuted
                      ? 'bg-red-950/80 border-red-700 text-red-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? '🔇' : '🎙️'}
                </button>

                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-2.5 rounded-xl border transition-colors flex items-center justify-center text-sm ${
                    isVideoOff
                      ? 'bg-red-950/80 border-red-700 text-red-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? '🚫' : '📷'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                    isChatOpen
                      ? 'bg-accent-950/60 border-accent-600/70 text-accent-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                  title="Toggle In-Call Chat"
                >
                  <span>💬</span>
                  <span className="hidden sm:inline">Chat</span>
                  {messages.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-accent-600 text-white text-[10px]">
                      {messages.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 1-to-1 Live In-Call Text Chat Side Panel */}
          {isChatOpen && (
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[400px] lg:h-auto shadow-xl">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                  <span>💬</span> 1-to-1 Text Chat
                </span>
                <span className="text-[11px] text-slate-500">
                  {status === 'connected' ? `With ${partnerUsername || 'Stranger'}` : 'Inactive'}
                </span>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
                {status !== 'connected' && messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                    <span className="text-2xl mb-2">👋</span>
                    <p>Start a video call to chat live with your partner.</p>
                  </div>
                )}

                {messages.map((msg) => {
                  const isMe = msg.senderId === session?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-up`}
                    >
                      <span className="text-[10px] text-slate-500 mb-0.5">
                        {isMe ? 'You' : msg.senderUsername}
                      </span>
                      <div
                        className={`px-3 py-1.5 rounded-2xl max-w-[85%] break-words ${
                          isMe
                            ? 'bg-accent-600 text-white rounded-br-xs'
                            : 'bg-slate-800 text-slate-200 rounded-bl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* In-Call Text Chat Input */}
              <form onSubmit={handleSendChat} className="p-2 border-t border-slate-800 bg-slate-950/40 flex gap-2">
                <input
                  type="text"
                  placeholder={
                    status === 'connected' ? 'Type message to stranger...' : 'Connect to stranger first...'
                  }
                  disabled={status !== 'connected'}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  maxLength={250}
                  className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status !== 'connected' || !chatInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
