'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useVideoChat } from '@/hooks/useVideoChat';
import { AttachedFilePayload } from '@/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Client-side helper to compress images before storing in Firestore messages / WebRTC data
 * Keeps images crisp while reducing payload to ~40KB - 120KB.
 */
const compressImage = async (
  file: File,
  maxDim = 1000,
  quality = 0.75
): Promise<{ data: string; size: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const approxBytes = Math.round((base64Length * 3) / 4);
        resolve({ data: dataUrl, size: approxBytes });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
    facingMode,
    isFlippingCamera,
    flipCamera,
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

  const desktopFileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [videoFit, setVideoFit] = useState<'contain' | 'cover'>('contain');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Feature 3: Self video size flip / swap with caller video
  const [isSwapped, setIsSwapped] = useState(false);

  // Feature 2: File / Image attachment in in-call chat
  const [pendingFile, setPendingFile] = useState<AttachedFilePayload | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; name: string } | null>(null);

  // Attach local media stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote media stream to remote video element with play() trigger
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((err) => {
        console.warn('[Video] Remote stream play() failed, waiting for user gesture:', err);
      });
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please select a file under 10MB.');
      e.target.value = '';
      return;
    }

    setIsProcessingFile(true);
    try {
      if (file.type.startsWith('image/')) {
        const { data, size } = await compressImage(file, 1000, 0.75);
        setPendingFile({
          name: file.name,
          type: file.type || 'image/jpeg',
          size,
          data,
        });
      } else {
        if (file.size > 600 * 1024) {
          alert('Non-image files must be under 600KB for in-call sharing.');
          e.target.value = '';
          setIsProcessingFile(false);
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const data = ev.target?.result as string;
          setPendingFile({
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            data,
          });
          setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (err) {
      console.error('[Video] File processing failed:', err);
      alert('Could not process this file.');
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !pendingFile) return;
    sendMessage(chatInput, pendingFile);
    setChatInput('');
    setPendingFile(null);
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

      {/* Main App Container */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2.5 flex flex-col overflow-hidden">
        
        {/* Safety & Status Pill Banner */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 mb-1.5 sm:mb-2 shrink-0">
          <div className="flex items-center gap-2 truncate">
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
          <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-200 rounded-xl flex items-center justify-between gap-2 text-xs shrink-0 mb-1.5">
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
            
            {/* Main Video Stage Card */}
            <div
              ref={videoContainerRef}
              className="relative flex-1 min-h-0 w-full bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center"
            >
              {/* REMOTE STRANGER VIDEO CONTAINER (Swaps between Main Stage and Mini PiP Box) */}
              <div
                className={
                  !isSwapped
                    ? `absolute inset-0 w-full h-full transition-all duration-300 ${
                        status === 'connected' && remoteStream ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'
                      }`
                    : `absolute bottom-2.5 sm:bottom-4 right-2.5 sm:right-4 z-20 w-24 sm:w-36 md:w-44 aspect-video rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-2xl transition-all duration-300 cursor-pointer hover:border-accent-400 group`
                }
                onClick={isSwapped ? () => setIsSwapped(false) : undefined}
                title={isSwapped ? 'Click to swap back to main view' : undefined}
              >
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full ${
                    !isSwapped ? (videoFit === 'cover' ? 'object-cover' : 'object-contain') : 'object-contain'
                  } bg-black`}
                />

                {/* Overlay on Mini Remote Box when Swapped */}
                {isSwapped && (
                  <>
                    <div className="absolute bottom-1 left-1.5 px-1 py-0.2 rounded bg-black/75 text-[9px] text-white flex items-center gap-0.5 font-medium pointer-events-none">
                      <span className="truncate max-w-[50px] sm:max-w-none">{partnerUsername || 'Stranger'}</span>
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium gap-1 pointer-events-none">
                      <span>🔀</span> Swap
                    </div>
                  </>
                )}
              </div>

              {/* LOCAL SELF VIDEO CONTAINER (Swaps between Mini PiP Box and Main Stage) */}
              <div
                className={
                  isSwapped
                    ? `absolute inset-0 w-full h-full transition-all duration-300 z-10`
                    : `absolute bottom-2.5 sm:bottom-4 right-2.5 sm:right-4 z-20 w-24 sm:w-36 md:w-44 aspect-video rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-2xl transition-all duration-300 cursor-pointer hover:border-accent-400 group`
                }
                onClick={!isSwapped ? () => setIsSwapped(true) : undefined}
                title={!isSwapped ? 'Click to swap self video to main view' : undefined}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full ${
                    isSwapped ? (videoFit === 'cover' ? 'object-cover' : 'object-contain') : 'object-contain'
                  } bg-black ${facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-1'} ${isVideoOff ? 'hidden' : 'block'}`}
                />

                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-[10px]">
                    <span>📷 Camera Off</span>
                  </div>
                )}

                {/* Overlays when Local Video is in Mini PiP Corner */}
                {!isSwapped ? (
                  <>
                    <div className="absolute bottom-1 left-1.5 px-1 py-0.2 rounded bg-black/75 text-[9px] text-white flex items-center gap-0.5 font-medium pointer-events-none">
                      <span className="truncate max-w-[50px] sm:max-w-none">You</span>
                      {isMuted && <span className="text-red-400">🔇</span>}
                    </div>

                    {/* Quick Camera Flip Button on Mini Local Preview */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        flipCamera();
                      }}
                      disabled={isFlippingCamera}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/75 hover:bg-black/95 text-white text-[11px] flex items-center justify-center shadow-md border border-white/20 transition-transform active:scale-90"
                      title={`Flip Camera (Currently: ${facingMode === 'user' ? 'Front' : 'Back'})`}
                      aria-label="Flip Camera"
                    >
                      <span className={isFlippingCamera ? 'animate-spin inline-block' : ''}>🔄</span>
                    </button>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium gap-1 pointer-events-none">
                      <span>🔀</span> Swap
                    </div>
                  </>
                ) : (
                  /* Overlay when Local Video is on Main Stage */
                  <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 z-20 flex items-center gap-2 pointer-events-none">
                    <div className="px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-white shadow-lg pointer-events-auto">
                      <span>You (Main View)</span>
                      {isMuted && <span className="text-red-400">🔇</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Overlay when NOT connected */}
              {status !== 'connected' && (
                <div className="relative z-20 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-sm sm:max-w-md animate-fade-in pointer-events-auto">
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

              {/* Top-Left Overlay: Status Badge (when normal Stranger is main view) */}
              {!isSwapped && (
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
              )}

              {/* Top-Right Overlay: Swap, Video Fit, Fullscreen */}
              <div className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 z-20 flex items-center gap-1.5">
                {/* Swap Videos Button */}
                <button
                  type="button"
                  onClick={() => setIsSwapped((s) => !s)}
                  className={`px-2 py-1 backdrop-blur-md rounded-lg border text-[10px] sm:text-xs transition-colors flex items-center gap-1 shadow-md active:scale-95 ${
                    isSwapped
                      ? 'bg-accent-600/90 border-accent-400 text-white'
                      : 'bg-black/65 hover:bg-black/85 border-white/15 text-slate-200'
                  }`}
                  title="Swap Self & Caller Video Size (PiP Swap)"
                  aria-label="Swap Video Screens"
                >
                  <span>🔀</span>
                  <span className="hidden sm:inline">{isSwapped ? 'Swapped' : 'Swap'}</span>
                </button>

                {status === 'connected' && (
                  <button
                    type="button"
                    onClick={() => setVideoFit((f) => (f === 'contain' ? 'cover' : 'contain'))}
                    className="px-2 py-1 bg-black/65 hover:bg-black/85 backdrop-blur-md rounded-lg border border-white/15 text-[10px] sm:text-xs text-slate-200 transition-colors flex items-center gap-1 shadow-md active:scale-95"
                    title={videoFit === 'contain' ? 'Current: Original / No Crop (Click to Fill & Crop)' : 'Current: Fill / Cropped (Click for Original)'}
                  >
                    <span>{videoFit === 'contain' ? '⊡ Original' : '⛶ Cropped'}</span>
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

              {/* MOBILE IN-CALL CHAT OVERLAY */}
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
                  <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2 text-xs">
                    {status !== 'connected' && messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-500 text-xs">
                        <span className="text-lg mb-0.5">👋</span>
                        <p>Start a video call to send live text & photos to your partner.</p>
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
                            {/* Text Content */}
                            {msg.content && <p>{msg.content}</p>}

                            {/* Attached File/Image */}
                            {msg.file && (
                              <div className="mt-1">
                                {msg.file.type.startsWith('image/') ? (
                                  <div className="relative group">
                                    <img
                                      src={msg.file.data}
                                      alt={msg.file.name}
                                      onClick={() => setLightboxImage({ src: msg.file!.data, name: msg.file!.name })}
                                      className="max-w-[180px] max-h-[140px] rounded-lg object-cover cursor-pointer hover:opacity-90 shadow-sm border border-white/10"
                                    />
                                    <span className="text-[8px] opacity-75 mt-0.5 block truncate max-w-[180px]">
                                      {msg.file.name} ({formatFileSize(msg.file.size)})
                                    </span>
                                  </div>
                                ) : (
                                  <a
                                    href={msg.file.data}
                                    download={msg.file.name}
                                    className="flex items-center gap-1.5 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-[11px] underline truncate"
                                  >
                                    <span>📄</span>
                                    <span className="truncate">{msg.file.name}</span>
                                    <span className="text-[9px] opacity-75">({formatFileSize(msg.file.size)})</span>
                                    <span>⬇️</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={mobileChatBottomRef} />
                  </div>

                  {/* Pending File Attachment Pill (Mobile) */}
                  {pendingFile && (
                    <div className="px-3 py-1.5 bg-slate-800 border-t border-slate-700 flex items-center justify-between gap-2 text-xs text-slate-200 shrink-0">
                      <div className="flex items-center gap-2 truncate">
                        <span>{pendingFile.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                        <span className="truncate font-medium">{pendingFile.name}</span>
                        <span className="text-[10px] text-slate-400">({formatFileSize(pendingFile.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingFile(null)}
                        className="text-red-400 hover:text-red-300 text-xs px-1"
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Mobile Chat Input Form */}
                  <form onSubmit={handleSendChat} className="p-2 border-t border-slate-800 bg-slate-950/50 flex items-center gap-1.5 shrink-0">
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={mobileFileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                    />

                    {/* Attach File Button */}
                    <button
                      type="button"
                      disabled={status !== 'connected' || isProcessingFile}
                      onClick={() => mobileFileInputRef.current?.click()}
                      className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 flex items-center justify-center text-sm transition-colors shrink-0"
                      title="Attach Image or File"
                      aria-label="Attach File"
                    >
                      {isProcessingFile ? <Spinner size="sm" /> : '📎'}
                    </button>

                    <input
                      type="text"
                      placeholder={status === 'connected' ? 'Type message to stranger...' : 'Connect to stranger first...'}
                      disabled={status !== 'connected'}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      maxLength={350}
                      className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-50"
                    />

                    <button
                      type="submit"
                      disabled={status !== 'connected' || (!chatInput.trim() && !pendingFile)}
                      className="px-3 py-1.5 rounded-xl bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Video Control Action Bar */}
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

              {/* Hardware Toggles: Mic, Video, Camera Flip, Chat */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Microphone Toggle */}
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

                {/* Camera Video Toggle */}
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

                {/* Feature 1: Camera Flip (Front ↔ Back) */}
                <button
                  type="button"
                  onClick={flipCamera}
                  disabled={isFlippingCamera}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center text-sm shadow-sm active:scale-95"
                  title={`Flip Camera (Currently: ${facingMode === 'user' ? 'Front' : 'Back'})`}
                  aria-label="Flip Camera"
                >
                  <span className={isFlippingCamera ? 'animate-spin inline-block' : ''}>🔄</span>
                </button>

                {/* Chat Panel Toggle */}
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

          {/* DESKTOP 1-to-1 Live In-Call Text Chat Side Panel */}
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
                    <p>Start a video call to send live text & photos to your partner.</p>
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
                        {/* Text Content */}
                        {msg.content && <p>{msg.content}</p>}

                        {/* Attached File/Image */}
                        {msg.file && (
                          <div className="mt-1">
                            {msg.file.type.startsWith('image/') ? (
                              <div className="relative group">
                                <img
                                  src={msg.file.data}
                                  alt={msg.file.name}
                                  onClick={() => setLightboxImage({ src: msg.file!.data, name: msg.file!.name })}
                                  className="max-w-[200px] max-h-[160px] rounded-lg object-cover cursor-pointer hover:opacity-90 shadow-sm border border-white/10"
                                />
                                <span className="text-[8px] opacity-75 mt-0.5 block truncate max-w-[200px]">
                                  {msg.file.name} ({formatFileSize(msg.file.size)})
                                </span>
                              </div>
                            ) : (
                              <a
                                href={msg.file.data}
                                download={msg.file.name}
                                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-[11px] underline truncate"
                              >
                                <span>📄</span>
                                <span className="truncate">{msg.file.name}</span>
                                <span className="text-[9px] opacity-75">({formatFileSize(msg.file.size)})</span>
                                <span>⬇️</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={desktopChatBottomRef} />
              </div>

              {/* Pending File Attachment Pill (Desktop) */}
              {pendingFile && (
                <div className="px-3.5 py-1.5 bg-slate-800 border-t border-slate-700 flex items-center justify-between gap-2 text-xs text-slate-200 shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <span>{pendingFile.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                    <span className="truncate font-medium">{pendingFile.name}</span>
                    <span className="text-[10px] text-slate-400">({formatFileSize(pendingFile.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingFile(null)}
                    className="text-red-400 hover:text-red-300 text-xs px-1"
                    title="Remove attachment"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Desktop Chat Input Form */}
              <form onSubmit={handleSendChat} className="p-2.5 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2 shrink-0">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={desktopFileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                />

                {/* Attach File Button */}
                <button
                  type="button"
                  disabled={status !== 'connected' || isProcessingFile}
                  onClick={() => desktopFileInputRef.current?.click()}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 flex items-center justify-center text-sm transition-colors shrink-0"
                  title="Attach Image or File"
                  aria-label="Attach File"
                >
                  {isProcessingFile ? <Spinner size="sm" /> : '📎'}
                </button>

                <input
                  type="text"
                  placeholder={
                    status === 'connected' ? 'Type message to stranger...' : 'Connect to stranger first...'
                  }
                  disabled={status !== 'connected'}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  maxLength={350}
                  className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={status !== 'connected' || (!chatInput.trim() && !pendingFile)}
                  className="px-3.5 py-2 rounded-xl bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Modal for Full-Size Image Preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <a
              href={lightboxImage.src}
              download={lightboxImage.name || 'image.jpg'}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg border border-slate-700"
            >
              <span>⬇️</span> Download
            </a>
            <button
              onClick={() => setLightboxImage(null)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-sm shadow-lg border border-slate-700"
              aria-label="Close Preview"
            >
              ✕
            </button>
          </div>

          <div className="max-w-4xl max-h-[85vh] p-2 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.name}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
            <span className="text-xs text-slate-400 mt-2 truncate max-w-md">{lightboxImage.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}