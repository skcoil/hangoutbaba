'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useVideoChat } from '@/hooks/useVideoChat';
import { Header } from '@/components/layout/Header';
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
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const desktopChatBottomRef = useRef<HTMLDivElement>(null);
  const mobileChatBottomRef = useRef<HTMLDivElement>(null);

  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [videoFit, setVideoFit] = useState<'cover' | 'contain'>('cover');
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    desktopChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    mobileChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  // Automatically start camera preview when user opens video page
  useEffect(() => {
    initLocalMedia().catch(() => {});
  }, [initLocalMedia]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Global ESC key shortcut for "Next Stranger"
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

  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await videoContainerRef.current.requestFullscreen();
      } catch (e) {
        console.warn('Fullscreen request failed:', e);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (e) {
        console.warn('Exit fullscreen failed:', e);
      }
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  if (sessionLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-slate-950 text-white">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Header - pinned & non-shrinking */}
      <div className="shrink-0">
        <Header />
      </div>

      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-2 sm:p-3 flex flex-col overflow-hidden gap-1.5 sm:gap-2">
        {/* Safety & Status Info Pill (compact, hides on mobile when connected to maximize video) */}
        <div
          className={`px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl items-center justify-between text-[11px] sm:text-xs text-slate-400 shrink-0 ${
            status === 'connected' ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span>🛡️</span>
            <span className="truncate">
              <strong>Anonymous Video:</strong> Do not share personal info with strangers.
            </span>
          </div>
          {waitingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-accent-400 font-medium shrink-0 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
              {waitingCount} {waitingCount === 1 ? 'stranger' : 'strangers'} waiting
            </span>
          )}
        </div>

        {/* Error Alert if Camera Denied */}
        {error && (
          <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-200 rounded-xl flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span>⚠️</span>
              <span className="truncate">{error}</span>
            </div>
            <Button size="sm" variant="secondary" className="text-xs !py-1 !px-2.5 shrink-0" onClick={() => initLocalMedia()}>
              Retry
            </Button>
          </div>
        )}

        {/* Video Stage & Chat Section */}
        <div className="relative flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-2 sm:gap-3 overflow-hidden">
          
          {/* Main Video View Column */}
          <div className="flex-1 min-h-0 w-full flex flex-col gap-1.5 sm:gap-2 overflow-hidden">
            
            {/* Main Video Stage Card (Strictly bound to flex-1 min-h-0) */}
            <div
              ref={videoContainerRef}
              className="relative flex-1 min-h-0 w-full bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center"
            >
              {/* Remote Stranger Video Stream (ALWAYS absolute inset-0 so it CANNOT push parent height) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`absolute inset-0 w-full h-full ${
                  videoFit === 'cover' ? 'object-cover' : 'object-contain'
                } bg-black transition-opacity duration-300 ${
                  status === 'connected' && remoteStream ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              />

              {/* Status Overlay when NOT connected */}
              {status !== 'connected' && (
                <div className="relative z-20 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-sm sm:max-w-md animate-fade-in">
                  {status === 'idle' && (
                    <>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-accent-600/20 text-accent-400 border border-accent-500/30 flex items-center justify-center text-2xl sm:text-3xl mb-3 shadow-inner">
                        📹
                      </div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white mb-1.5">1-to-1 Random Video Chat</h2>
                      <p className="text-xs sm:text-sm text-slate-400 mb-4 sm:mb-6 leading-relaxed">
                        Talk face-to-face with random strangers. 100% free, encrypted peer-to-peer, no signup required.
                      </p>
                      <Button size="lg" className="px-6 sm:px-8 shadow-lg shadow-accent-600/30 text-sm sm:text-base" onClick={startSearching}>
                        Start Video Chat →
                      </Button>
                    </>
                  )}

                  {status === 'searching' && (
                    <>
                      <div className="relative mb-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent-500/20 animate-ping absolute inset-0" />
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800 border-2 border-accent-500 flex items-center justify-center text-2xl shadow-xl relative">
                          🔍
                        </div>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white mb-1">Looking for a stranger...</h2>
                      <p className="text-xs text-slate-400 mb-4">Pairing you with an available online user</p>
                      <Button variant="secondary" size="sm" onClick={stopChat}>
                        Cancel Search
                      </Button>
                    </>
                  )}

                  {status === 'connecting' && (
                    <>
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-3">
                        <Spinner size="sm" />
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white mb-1">Stranger Found!</h2>
                      <p className="text-xs text-slate-400">Connecting video stream peer-to-peer...</p>
                    </>
                  )}

                  {status === 'ended' && (
                    <>
                      <span className="text-3xl sm:text-4xl mb-2 sm:mb-3">👋</span>
                      <h2 className="text-base sm:text-lg font-bold text-white mb-1">Stranger Disconnected</h2>
                      <p className="text-xs text-slate-400 mb-4">Ready for the next conversation?</p>
                      <Button size="md" className="px-6" onClick={nextStranger}>
                        Find Another Stranger (ESC) →
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Top-Left Overlay: Status Badge */}
              <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 z-20 flex items-center gap-2 pointer-events-none">
                {status === 'connected' && (
                  <div className="px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-white shadow-lg pointer-events-auto">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span>Stranger: <strong>{partnerUsername || 'Anonymous'}</strong></span>
                  </div>
                )}
                {status === 'searching' && (
                  <div className="px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5 text-[11px] sm:text-xs text-accent-300 pointer-events-auto">
                    <span className="w-2 h-2 rounded-full bg-accent-400 animate-ping" />
                    <span>Searching...</span>
                  </div>
                )}
              </div>

              {/* Top-Right Overlay: Video Fit (Cover/Contain) & Fullscreen Toggles */}
              <div className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 z-20 flex items-center gap-1.5">
                {status === 'connected' && (
                  <button
                    type="button"
                    onClick={() => setVideoFit((f) => (f === 'cover' ? 'contain' : 'cover'))}
                    className="px-2 py-1 bg-black/65 hover:bg-black/85 backdrop-blur-md rounded-lg border border-white/15 text-[10px] sm:text-xs text-slate-200 transition-colors flex items-center gap-1 shadow-md active:scale-95"
                    title={videoFit === 'cover' ? 'Switch to Fit (show entire camera uncropped)' : 'Switch to Fill (cover stage)'}
                  >
                    <span>{videoFit === 'cover' ? '⊡ Fit' : '⛶ Fill'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1 sm:p-1.5 bg-black/65 hover:bg-black/85 backdrop-blur-md rounded-lg border border-white/15 text-xs text-slate-200 transition-colors shadow-md active:scale-95"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  aria-label="Toggle Fullscreen"
                >
                  {isFullscreen ? '↙️' : '↗️'}
                </button>
              </div>

              {/* Local Self-Video Preview (PIP in Bottom-Right Corner) */}
              <div className="absolute bottom-2.5 sm:bottom-4 right-2.5 sm:right-4 z-20 w-24 sm:w-36 md:w-44 aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-2xl transition-all">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'hidden' : 'block'}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-[10px]">
                    <span>📷 Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1.5 px-1 py-0.2 rounded bg-black/75 text-[9px] text-white flex items-center gap-0.5 font-medium">
                  <span className="truncate max-w-[50px] sm:max-w-none">You</span>
                  {isMuted && <span className="text-red-400">🔇</span>}
                </div>
              </div>

              {/* MOBILE IN-CALL CHAT OVERLAY (Floats gracefully over the video stage so it never expands page height) */}
              {isChatOpen && (
                <div className="lg:hidden absolute inset-x-2 bottom-2 max-h-[55%] z-30 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
                    <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                      <span>💬</span> 1-to-1 Live Text
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">
                        {status === 'connected' ? `With ${partnerUsername || 'Stranger'}` : 'Waiting for call'}
                      </span>
                      <button
                        onClick={() => setIsChatOpen(false)}
                        className="text-slate-400 hover:text-white p-1 text-sm leading-none"
                        aria-label="Close chat"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Mobile Message List */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5 text-xs">
                    {status !== 'connected' && messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-500 text-xs">
                        <span className="text-lg mb-0.5">👋</span>
                        <p>Start a video call to send live text to your partner.</p>
                      </div>
                    )}
                    {messages.map((msg) => {
                      const isMe = msg.senderId === session?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-up`}
                        >
                          <span className="text-[9px] text-slate-500 mb-0.5">
                            {isMe ? 'You' : msg.senderUsername}
                          </span>
                          <div
                            className={`px-2.5 py-1.5 rounded-xl max-w-[85%] break-words text-xs ${
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
                    <div ref={mobileChatBottomRef} />
                  </div>

                  {/* Mobile Chat Input */}
                  <form onSubmit={handleSendChat} className="p-2 border-t border-slate-800 bg-slate-950/50 flex gap-1.5 shrink-0">
                    <input
                      type="text"
                      placeholder={status === 'connected' ? 'Type message to stranger...' : 'Connect to stranger first...'}
                      disabled={status !== 'connected'}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      maxLength={250}
                      className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={status !== 'connected' || !chatInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Video Control Action Bar (Clean, Fixed & Thumb-Friendly) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 shadow-lg shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-none">
                {status === 'connected' || status === 'connecting' || status === 'ended' ? (
                  <Button
                    size="md"
                    className="flex-1 sm:flex-none bg-accent-600 hover:bg-accent-500 text-white font-semibold text-xs sm:text-sm px-4 py-2 flex items-center justify-center gap-1.5 shadow-md"
                    onClick={nextStranger}
                  >
                    <span>Next Stranger</span>
                    <span className="hidden sm:inline text-[10px] opacity-75 bg-black/30 px-1.5 py-0.5 rounded font-mono">ESC</span>
                  </Button>
                ) : status === 'searching' ? (
                  <Button
                    size="md"
                    variant="secondary"
                    className="flex-1 sm:flex-none text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-950/40 text-xs sm:text-sm px-4 py-2"
                    onClick={stopChat}
                  >
                    Stop Searching
                  </Button>
                ) : (
                  <Button
                    size="md"
                    className="flex-1 sm:flex-none bg-accent-600 hover:bg-accent-500 text-white font-semibold text-xs sm:text-sm px-6 py-2 shadow-md"
                    onClick={startSearching}
                  >
                    Find Stranger
                  </Button>
                )}

                {(status === 'connected' || status === 'connecting') && (
                  <Button
                    size="md"
                    variant="secondary"
                    className="text-red-400 hover:text-red-300 border-red-900/40 hover:bg-red-950/30 text-xs px-2.5 sm:px-3 py-2"
                    onClick={stopChat}
                    title="End Call"
                  >
                    End
                  </Button>
                )}
              </div>

              {/* Hardware Toggles (Mic, Camera, Chat) */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition-colors flex items-center justify-center text-sm ${
                    isMuted
                      ? 'bg-red-950/90 border-red-700 text-red-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  aria-label="Toggle microphone"
                >
                  {isMuted ? '🔇' : '🎙️'}
                </button>

                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition-colors flex items-center justify-center text-sm ${
                    isVideoOff
                      ? 'bg-red-950/90 border-red-700 text-red-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  aria-label="Toggle camera"
                >
                  {isVideoOff ? '🚫' : '📷'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`h-9 px-2.5 sm:h-10 sm:px-3 rounded-xl border transition-colors flex items-center gap-1 text-xs font-semibold ${
                    isChatOpen
                      ? 'bg-accent-600 text-white border-accent-500'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                  title="Toggle In-Call Chat"
                  aria-label="Toggle in-call chat"
                >
                  <span>💬</span>
                  <span className="hidden sm:inline">Chat</span>
                  {messages.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white text-slate-950 font-bold text-[10px]">
                      {messages.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP 1-to-1 Live In-Call Text Chat (Side Panel on Desktop lg: screens) */}
          {isChatOpen && (
            <div className="hidden lg:flex w-80 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex-col h-full shadow-xl shrink-0 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
                <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                  <span>💬</span> 1-to-1 Live Text
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    {status === 'connected' ? `With ${partnerUsername || 'Stranger'}` : 'Waiting for call'}
                  </span>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="text-slate-400 hover:text-white p-1 text-sm leading-none"
                    aria-label="Close chat"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Desktop Message List */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 text-xs">
                {status !== 'connected' && messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-500 text-xs">
                    <span className="text-xl mb-1">👋</span>
                    <p>Start a video call to send live text to your partner.</p>
                  </div>
                )}

                {messages.map((msg) => {
                  const isMe = msg.senderId === session?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-up`}
                    >
                      <span className="text-[9px] text-slate-500 mb-0.5">
                        {isMe ? 'You' : msg.senderUsername}
                      </span>
                      <div
                        className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words text-xs ${
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
                <div ref={desktopChatBottomRef} />
              </div>

              {/* Desktop Chat Input */}
              <form onSubmit={handleSendChat} className="p-2.5 border-t border-slate-800 bg-slate-950/40 flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder={
                    status === 'connected' ? 'Type message to stranger...' : 'Connect to stranger first...'
                  }
                  disabled={status !== 'connected'}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  maxLength={250}
                  className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status !== 'connected' || !chatInput.trim()}
                  className="px-3 py-2 rounded-xl bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
