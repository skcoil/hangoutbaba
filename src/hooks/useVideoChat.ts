'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SessionData, VideoCallStatus, VideoChatMessage, AttachedFilePayload } from '@/types';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  RTC_CONFIG,
  getRTCConfig,
  sanitizeIceCandidate,
  stopMediaStream,
  setStreamAudioEnabled,
  setStreamVideoEnabled,
} from '@/lib/webrtc';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  orderBy,
} from 'firebase/firestore';

export function useVideoChat(session: SessionData | null) {
  const [status, setStatus] = useState<VideoCallStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [partnerUsername, setPartnerUsername] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<VideoChatMessage[]>([]);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFlippingCamera, setIsFlippingCamera] = useState(false);
  const [autoSkippedNotice, setAutoSkippedNotice] = useState<string | null>(null);

  // References to keep mutable state across async callbacks
  const localStreamRef = useRef<MediaStream | null>(null);
  const facingModeRef = useRef<'user' | 'environment'>('user');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const queuedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isRemoteDescSetRef = useRef(false);
  const rtcConfigRef = useRef<RTCConfiguration>(RTC_CONFIG);
  const isManualStopRef = useRef(false);
  const startSearchingRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const wakeLockRef = useRef<any>(null);

  // Fetch best available dynamic/custom RTC configuration (STUN + TURN)
  useEffect(() => {
    getRTCConfig().then((cfg) => {
      rtcConfigRef.current = cfg;
    });
  }, []);

  // Firestore listeners
  const unsubQueueRef = useRef<(() => void) | null>(null);
  const unsubCallRef = useRef<(() => void) | null>(null);
  const unsubCandidatesRef = useRef<(() => void) | null>(null);
  const unsubMessagesRef = useRef<(() => void) | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const matchmakingPollRef = useRef<NodeJS.Timeout | null>(null);

  // Keep localStreamRef updated
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Track global waiting queue count for UX
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    try {
      const q = query(collection(db, 'video_queue'), where('status', '==', 'waiting'));
      const unsub = onSnapshot(q, (snapshot) => {
        const now = Date.now();
        let count = 0;
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.updatedAt && now - d.updatedAt < 25000) {
            count++;
          }
        });
        setWaitingCount(count);
      });
      return () => unsub();
    } catch (e) {
      console.warn('[useVideoChat] Waiting count error:', e);
    }
  }, []);

  /**
   * Request user camera and microphone permission
   */
  const initLocalMedia = useCallback(async (): Promise<MediaStream | null> => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      setError(null);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: facingModeRef.current,
          },
          audio: true,
        });
      } catch (firstErr) {
        console.warn('[useVideoChat] High-res getUserMedia failed, retrying with fallback constraints:', firstErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingModeRef.current },
            audio: true,
          });
        } catch (secondErr) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        }
      }

      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err: any) {
      console.error('[useVideoChat] Camera/Mic access denied or error:', err);
      let msg = 'Camera and Microphone access is required for video chat.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera or microphone found on your device.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera and mic permissions in browser settings.';
      }
      setError(msg);
      setStatus('error');
      return null;
    }
  }, []);

  /**
   * Flip between front (user) and back (environment) camera without dropping call
   */
  const flipCamera = useCallback(async (): Promise<boolean> => {
    if (isFlippingCamera || !navigator.mediaDevices?.getUserMedia) return false;
    setIsFlippingCamera(true);

    try {
      const nextFacing: 'user' | 'environment' = facingModeRef.current === 'user' ? 'environment' : 'user';

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: nextFacing },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('[useVideoChat] exact facingMode failed, falling back:', firstErr);
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: nextFacing },
            audio: false,
          });
        } catch (secondErr) {
          console.warn('[useVideoChat] facingMode fallback failed:', secondErr);
          setIsFlippingCamera(false);
          return false;
        }
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) {
        setIsFlippingCamera(false);
        return false;
      }

      // Preserve isVideoOff state on new track
      if (isVideoOff) {
        newVideoTrack.enabled = false;
      }

      // Replace track on RTCPeerConnection sender if active call
      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
          console.log('[useVideoChat] Replaced video track with facingMode:', nextFacing);
        }
      }

      // Stop old video track to release hardware
      const currentStream = localStreamRef.current;
      if (currentStream) {
        currentStream.getVideoTracks().forEach((track) => track.stop());
        const audioTracks = currentStream.getAudioTracks();
        const combined = new MediaStream([...audioTracks, newVideoTrack]);
        setLocalStream(combined);
        localStreamRef.current = combined;
      } else {
        setLocalStream(newStream);
        localStreamRef.current = newStream;
      }

      facingModeRef.current = nextFacing;
      setFacingMode(nextFacing);
      return true;
    } catch (err) {
      console.error('[useVideoChat] Failed to flip camera:', err);
      return false;
    } finally {
      setIsFlippingCamera(false);
    }
  }, [isFlippingCamera, isVideoOff]);

  /**
   * Clean up WebRTC peer connection and active call listeners
   */
  const cleanupCall = useCallback((keepLocalMedia = true) => {
    // Unsubscribe Firestore listeners
    if (unsubCallRef.current) {
      unsubCallRef.current();
      unsubCallRef.current = null;
    }
    if (unsubCandidatesRef.current) {
      unsubCandidatesRef.current();
      unsubCandidatesRef.current = null;
    }
    if (unsubMessagesRef.current) {
      unsubMessagesRef.current();
      unsubMessagesRef.current = null;
    }

    // Mark previous call as ended in Firestore
    if (currentCallIdRef.current && isFirebaseConfigured) {
      const callDocRef = doc(db, 'video_calls', currentCallIdRef.current);
      updateDoc(callDocRef, { status: 'ended' }).catch(() => {});
      currentCallIdRef.current = null;
    }

    // Close PeerConnection
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onicecandidateerror = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    queuedCandidatesRef.current = [];
    isRemoteDescSetRef.current = false;
    setRemoteStream(null);
    setPartnerUsername(null);
    setMessages([]);

    if (!keepLocalMedia && localStreamRef.current) {
      stopMediaStream(localStreamRef.current);
      setLocalStream(null);
      localStreamRef.current = null;
    }
  }, []);

  /**
   * Clean up matchmaking queue entries
   */
  const cleanupQueue = useCallback(() => {
    if (unsubQueueRef.current) {
      unsubQueueRef.current();
      unsubQueueRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (matchmakingPollRef.current) {
      clearInterval(matchmakingPollRef.current);
      matchmakingPollRef.current = null;
    }
    if (session?.id && isFirebaseConfigured) {
      const queueDocRef = doc(db, 'video_queue', session.id);
      deleteDoc(queueDocRef).catch(() => {});
    }
  }, [session?.id]);

  /**
   * Setup WebRTC peer connection with local tracks and event handlers
   */
  const setupPeerConnection = useCallback(async (callId: string): Promise<RTCPeerConnection> => {
    const config = await getRTCConfig();
    rtcConfigRef.current = config;
    const pc = new RTCPeerConnection(config);
    pcRef.current = pc;
    isRemoteDescSetRef.current = false;
    queuedCandidatesRef.current = [];

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote track arrival (supporting both event.streams and event.track for mobile Safari/Chrome)
    pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack received:', event.track?.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setStatus('connected');
      } else if (event.track) {
        setRemoteStream((prev) => {
          const s = prev || new MediaStream();
          s.addTrack(event.track);
          return s;
        });
        setStatus('connected');
      }
    };

    // Disconnect grace timer to prevent dropping calls when mobile briefly switches apps / backgrounds
    let disconnectGraceTimer: NodeJS.Timeout | null = null;

    // Connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('[WebRTC] Peer Connection State:', state);
      if (state === 'connected') {
        if (disconnectGraceTimer) {
          clearTimeout(disconnectGraceTimer);
          disconnectGraceTimer = null;
        }
        setStatus('connected');
      } else if (state === 'disconnected') {
        console.log('[WebRTC] Peer temporarily disconnected (backgrounding/packet jitter), waiting for recovery...');
        // Do NOT end call immediately!
      } else if (state === 'failed') {
        console.warn('[WebRTC] Peer connection reported failed, attempting ICE restart and starting 25s grace period...');
        try {
          pc.restartIce();
        } catch {}
        if (!disconnectGraceTimer) {
          disconnectGraceTimer = setTimeout(() => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
              setStatus('ended');
            }
          }, 25000);
        }
      } else if (state === 'closed') {
        setStatus('ended');
      }
    };

    // ICE Connection state changes
    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      console.log('[WebRTC] ICE Connection State:', iceState);
      if (iceState === 'connected' || iceState === 'completed') {
        if (disconnectGraceTimer) {
          clearTimeout(disconnectGraceTimer);
          disconnectGraceTimer = null;
        }
        setStatus('connected');
      } else if (iceState === 'disconnected') {
        console.log('[WebRTC] ICE disconnected temporarily (mobile backgrounding), awaiting recovery...');
      } else if (iceState === 'failed') {
        console.warn('[WebRTC] ICE Connection failed, attempting ICE restart...');
        try {
          pc.restartIce();
        } catch {}
        if (!disconnectGraceTimer) {
          disconnectGraceTimer = setTimeout(() => {
            if (pc.iceConnectionState === 'failed') {
              setStatus('ended');
            }
          }, 25000);
        }
      }
    };

    // Log ICE candidate error (e.g. STUN/TURN unreachable)
    pc.onicecandidateerror = (e: any) => {
      console.warn('[WebRTC] ICE candidate error:', e.errorCode, e.errorText, e.url);
    };

    // Listen to in-call text chat messages
    const messagesCol = collection(db, 'video_calls', callId, 'messages');
    const qMessages = query(messagesCol, orderBy('timestamp', 'asc'));
    unsubMessagesRef.current = onSnapshot(qMessages, (snapshot) => {
      const loaded: VideoChatMessage[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        loaded.push({
          id: d.id,
          senderId: item.senderId || '',
          senderUsername: item.senderUsername || 'Anonymous',
          content: item.content || '',
          timestamp: item.timestamp || Date.now(),
          file: item.file || undefined,
        });
      });
      setMessages(loaded);
    });

    // Listen to call doc status (e.g. if partner ended or skipped)
    const callDocRef = doc(db, 'video_calls', callId);
    unsubCallRef.current = onSnapshot(callDocRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      if (data?.status === 'ended') {
        if (!isManualStopRef.current) {
          console.log('[useVideoChat] Partner skipped or disconnected, auto-finding next stranger...');
          setAutoSkippedNotice('Stranger disconnected. Finding next stranger...');
          setTimeout(() => setAutoSkippedNotice(null), 3000);
          cleanupCall(true);
          startSearchingRef.current();
        } else {
          setStatus('ended');
        }
      }
    });

    return pc;
  }, []);

  /**
   * Flow for the CALLER (the user who initiates the offer)
   */
  const startAsCaller = useCallback(
    async (callId: string, partnerName: string) => {
      currentCallIdRef.current = callId;
      setPartnerUsername(partnerName);
      setStatus('connecting');

      const pc = await setupPeerConnection(callId);

      // Listen for Callee ICE Candidates
      const calleeCandidatesCol = collection(db, 'video_calls', callId, 'calleeCandidates');
      unsubCandidatesRef.current = onSnapshot(calleeCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (!data || !data.candidate) return;

            const candidateInit: RTCIceCandidateInit = {
              candidate: data.candidate,
              sdpMid: data.sdpMid ?? undefined,
              sdpMLineIndex: data.sdpMLineIndex ?? undefined,
              usernameFragment: data.usernameFragment ?? undefined,
            };

            if (isRemoteDescSetRef.current && pc.remoteDescription && pc.remoteDescription.type) {
              pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch((e) =>
                console.warn('[WebRTC] addIceCandidate error:', e)
              );
            } else {
              queuedCandidatesRef.current.push(candidateInit);
            }
          }
        });
      });

      // Send local ICE candidates to callerCandidates with sanitization
      const callerCandidatesCol = collection(db, 'video_calls', callId, 'callerCandidates');
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const cleanCandidate = sanitizeIceCandidate(event.candidate);
          addDoc(callerCandidatesCol, cleanCandidate).catch((e) => {
            console.warn('[WebRTC] Error saving caller candidate:', e);
          });
        }
      };

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const callDocRef = doc(db, 'video_calls', callId);
      await updateDoc(callDocRef, {
        offer: { type: offer.type, sdp: offer.sdp },
      });

      // Wait for Answer in call document
      const unsubAnswer = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !pc.currentRemoteDescription) {
          const rtcSessionDesc = new RTCSessionDescription(data.answer);
          await pc.setRemoteDescription(rtcSessionDesc);
          isRemoteDescSetRef.current = true;

          // Flush any queued candidates safely
          while (queuedCandidatesRef.current.length > 0) {
            const candidateInit = queuedCandidatesRef.current.shift();
            if (candidateInit) {
              pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch((e) => {
                console.warn('[WebRTC] Error applying queued candidate:', e);
              });
            }
          }
        }
      });

      // Append answer listener to active call cleanup
      const prevUnsub = unsubCallRef.current;
      unsubCallRef.current = () => {
        if (prevUnsub) prevUnsub();
        unsubAnswer();
      };
    },
    [setupPeerConnection]
  );

  /**
   * Flow for the CALLEE (the user who receives the offer and sends answer)
   */
  const startAsCallee = useCallback(
    async (callId: string, partnerName: string) => {
      currentCallIdRef.current = callId;
      setPartnerUsername(partnerName);
      setStatus('connecting');

      const pc = await setupPeerConnection(callId);

      // Listen for Caller ICE Candidates
      const callerCandidatesCol = collection(db, 'video_calls', callId, 'callerCandidates');
      unsubCandidatesRef.current = onSnapshot(callerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (!data || !data.candidate) return;

            const candidateInit: RTCIceCandidateInit = {
              candidate: data.candidate,
              sdpMid: data.sdpMid ?? undefined,
              sdpMLineIndex: data.sdpMLineIndex ?? undefined,
              usernameFragment: data.usernameFragment ?? undefined,
            };

            if (isRemoteDescSetRef.current && pc.remoteDescription && pc.remoteDescription.type) {
              pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch((e) =>
                console.warn('[WebRTC] addIceCandidate error:', e)
              );
            } else {
              queuedCandidatesRef.current.push(candidateInit);
            }
          }
        });
      });

      // Send local ICE candidates to calleeCandidates with sanitization
      const calleeCandidatesCol = collection(db, 'video_calls', callId, 'calleeCandidates');
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const cleanCandidate = sanitizeIceCandidate(event.candidate);
          addDoc(calleeCandidatesCol, cleanCandidate).catch((e) => {
            console.warn('[WebRTC] Error saving callee candidate:', e);
          });
        }
      };

      // Wait for Offer in call document
      const callDocRef = doc(db, 'video_calls', callId);
      const unsubOffer = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.offer && !pc.currentRemoteDescription) {
          const rtcSessionDesc = new RTCSessionDescription(data.offer);
          await pc.setRemoteDescription(rtcSessionDesc);
          isRemoteDescSetRef.current = true;

          // Flush any queued candidates safely
          while (queuedCandidatesRef.current.length > 0) {
            const candidateInit = queuedCandidatesRef.current.shift();
            if (candidateInit) {
              pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch((e) => {
                console.warn('[WebRTC] Error applying queued candidate:', e);
              });
            }
          }

          // Create Answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          await updateDoc(callDocRef, {
            answer: { type: answer.type, sdp: answer.sdp },
            status: 'connected',
          });
        }
      });

      // Append offer listener to active call cleanup
      const prevUnsub = unsubCallRef.current;
      unsubCallRef.current = () => {
        if (prevUnsub) prevUnsub();
        unofferCleanup();
      };
      function unofferCleanup() {
        unsubOffer();
      }
    },
    [setupPeerConnection]
  );

  /**
   * Main Matchmaking: Find random stranger or wait in queue with cross-device clock skew tolerance
   */
  const startSearching = useCallback(async () => {
    if (!session) return;

    // 1. Ensure local video is running
    const stream = await initLocalMedia();
    if (!stream) return;

    // 2. Clean up previous call and queue
    cleanupCall(true);
    cleanupQueue();
    setStatus('searching');
    setError(null);

    if (!isFirebaseConfigured) {
      setError('Firebase configuration is missing.');
      setStatus('error');
      return;
    }

    try {
      // Helper function to scan queue and attempt atomic transaction
      const attemptMatch = async (): Promise<boolean> => {
        if (currentCallIdRef.current || pcRef.current) return true;

        const queueCol = collection(db, 'video_queue');
        const q = query(queueCol, where('status', '==', 'waiting'));
        const snapshot = await getDocs(q);

        const now = Date.now();
        let matchedCandidate: { id: string; data: any } | null = null;

        snapshot.forEach((docSnap) => {
          if (matchedCandidate) return;
          const d = docSnap.data();
          // Skip self
          if (docSnap.id === session.id) return;
          // Generous 120s tolerance to handle cross-device clock skew (Mobile vs PC time offsets)
          if (!d.updatedAt || Math.abs(now - d.updatedAt) < 120000) {
            matchedCandidate = { id: docSnap.id, data: d };
          }
        });

        if (!matchedCandidate) return false;

        const candidate = matchedCandidate as { id: string; data: any };
        const newCallId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        try {
          const success = await runTransaction(db, async (tx) => {
            const candidateRef = doc(db, 'video_queue', candidate.id);
            const candidateDoc = await tx.get(candidateRef);

            if (!candidateDoc.exists() || candidateDoc.data()?.status !== 'waiting') {
              return false;
            }

            // Mark candidate as matched (callee)
            tx.update(candidateRef, {
              status: 'matched',
              callId: newCallId,
              peerId: session.id,
              peerUsername: session.username,
              role: 'callee',
              matchedAt: Date.now(),
            });

            // Set my own queue doc
            const myQueueRef = doc(db, 'video_queue', session.id);
            tx.set(myQueueRef, {
              sessionId: session.id,
              username: session.username,
              status: 'matched',
              callId: newCallId,
              peerId: candidate.id,
              peerUsername: candidate.data?.username || 'Stranger',
              role: 'caller',
              matchedAt: Date.now(),
            });

            // Create the video call doc
            const callDocRef = doc(db, 'video_calls', newCallId);
            tx.set(callDocRef, {
              callerId: session.id,
              callerUsername: session.username,
              calleeId: candidate.id,
              calleeUsername: candidate.data?.username || 'Stranger',
              status: 'connecting',
              createdAt: Date.now(),
            });

            return true;
          });

          if (success) {
            // Stop polling & heartbeat
            if (matchmakingPollRef.current) {
              clearInterval(matchmakingPollRef.current);
              matchmakingPollRef.current = null;
            }
            if (heartbeatRef.current) {
              clearInterval(heartbeatRef.current);
              heartbeatRef.current = null;
            }
            if (unsubQueueRef.current) {
              unsubQueueRef.current();
              unsubQueueRef.current = null;
            }

            // We are the caller!
            await startAsCaller(newCallId, candidate.data?.username || 'Stranger');
            return true;
          }
        } catch (txErr) {
          console.warn('[useVideoChat] Transaction race, falling back to queue:', txErr);
        }
        return false;
      };

      // 3. First immediate attempt to match with an existing waiting stranger
      const matchedImmediately = await attemptMatch();
      if (matchedImmediately) return;

      // 4. No candidate found immediately -> Register self as waiting
      const myQueueRef = doc(db, 'video_queue', session.id);
      await setDoc(myQueueRef, {
        sessionId: session.id,
        username: session.username,
        status: 'waiting',
        updatedAt: Date.now(),
      });

      // Send periodic heartbeat every 4 seconds
      heartbeatRef.current = setInterval(() => {
        updateDoc(myQueueRef, { updatedAt: Date.now() }).catch(() => {});
      }, 4000);

      // Periodically scan for waiting candidates every 2.5 seconds while searching
      matchmakingPollRef.current = setInterval(async () => {
        if (currentCallIdRef.current || pcRef.current) return;
        await attemptMatch();
      }, 2500);

      // Also listen to my own queue doc in case another peer claims us as callee
      unsubQueueRef.current = onSnapshot(myQueueRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        if (data?.status === 'matched' && data?.callId && data?.role === 'callee') {
          // Stop queue heartbeat, poll, and listener
          if (matchmakingPollRef.current) {
            clearInterval(matchmakingPollRef.current);
            matchmakingPollRef.current = null;
          }
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
          }
          if (unsubQueueRef.current) {
            unsubQueueRef.current();
            unsubQueueRef.current = null;
          }

          // We are matched as callee!
          startAsCallee(data.callId, data.peerUsername || 'Stranger');
        }
      });
    } catch (err) {
      console.error('[useVideoChat] Matchmaking error:', err);
      setError('Failed to connect to matchmaking server. Please retry.');
      setStatus('error');
    }
  }, [session, initLocalMedia, cleanupCall, cleanupQueue, startAsCaller, startAsCallee]);

  // Keep startSearchingRef up-to-date for automatic partner-skip routing
  useEffect(() => {
    startSearchingRef.current = startSearching;
  }, [startSearching]);

  /**
   * Skip to the next stranger
   */
  const nextStranger = useCallback(async () => {
    isManualStopRef.current = false;
    await startSearching();
  }, [startSearching]);

  /**
   * Stop video chat completely
   */
  const stopChat = useCallback(() => {
    isManualStopRef.current = true;
    cleanupCall(false);
    cleanupQueue();
    setStatus('idle');
  }, [cleanupCall, cleanupQueue]);

  /**
   * Toggle microphone
   */
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const nextState = !isMuted;
    setStreamAudioEnabled(localStreamRef.current, !nextState);
    setIsMuted(nextState);
  }, [isMuted]);

  /**
   * Toggle camera video
   */
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const nextState = !isVideoOff;
    setStreamVideoEnabled(localStreamRef.current, !nextState);
    setIsVideoOff(nextState);
  }, [isVideoOff]);

  /**
   * Send 1-to-1 in-call text message (with optional attached file/image)
   */
  const sendMessage = useCallback(
    async (content: string, attachedFile?: AttachedFilePayload | null) => {
      const trimmed = content.trim();
      if ((!trimmed && !attachedFile) || !currentCallIdRef.current || !session) return;

      try {
        const messagesCol = collection(db, 'video_calls', currentCallIdRef.current, 'messages');
        const payload: Record<string, any> = {
          senderId: session.id,
          senderUsername: session.username,
          content: trimmed.slice(0, 500),
          timestamp: Date.now(),
        };

        if (attachedFile) {
          payload.file = {
            name: attachedFile.name.slice(0, 100),
            type: attachedFile.type,
            size: attachedFile.size,
            data: attachedFile.data,
          };
        }

        await addDoc(messagesCol, payload);
      } catch (err) {
        console.error('[useVideoChat] Send message failed:', err);
      }
    },
    [session]
  );

  // Screen Wake Lock API to prevent phone screen from sleeping during active calls
  const requestWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      } catch (err) {
        console.warn('[useVideoChat] Wake Lock request error:', err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [status, requestWakeLock, releaseWakeLock]);

  // Handle mobile tab visibility changes (auto-resume camera and audio when returning from background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useVideoChat] Tab visible, ensuring media tracks are active...');
        
        // 1. Check if camera track is ended or muted by mobile OS
        if (localStreamRef.current && !isVideoOff) {
          const videoTracks = localStreamRef.current.getVideoTracks();
          const isTerminated = videoTracks.some((t) => t.readyState === 'ended' || t.muted);
          if (isTerminated || videoTracks.length === 0) {
            console.log('[useVideoChat] Camera was revoked by OS in background, re-acquiring...');
            navigator.mediaDevices?.getUserMedia({
              video: { facingMode: facingModeRef.current },
              audio: false,
            }).then((freshStream) => {
              const freshTrack = freshStream.getVideoTracks()[0];
              if (freshTrack && localStreamRef.current) {
                if (pcRef.current) {
                  const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
                  if (sender) {
                    sender.replaceTrack(freshTrack).catch(() => {});
                  }
                }
                videoTracks.forEach((t) => t.stop());
                const audioTracks = localStreamRef.current.getAudioTracks();
                const newCombined = new MediaStream([...audioTracks, freshTrack]);
                setLocalStream(newCombined);
                localStreamRef.current = newCombined;
              }
            }).catch((err) => {
              console.warn('[useVideoChat] Re-acquire camera failed:', err);
            });
          } else {
            videoTracks.forEach((track) => {
              if (!track.enabled) track.enabled = true;
            });
          }
        }

        // 2. Re-acquire screen wake lock
        if (status === 'connected') {
          requestWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, isVideoOff, requestWakeLock]);

  // Clean up on component unmount or browser close
  useEffect(() => {
    const handleUnload = () => {
      if (session?.id && isFirebaseConfigured) {
        // Remove self from matchmaking waiting queue
        const queueDocRef = doc(db, 'video_queue', session.id);
        deleteDoc(queueDocRef).catch(() => {});
        // NOTE: We do NOT aggressively end active calls on mobile beforeunload,
        // because mobile browsers fire beforeunload when simply switching apps or backgrounding.
        // WebRTC peer connection naturally handles true disconnects via ICE/DTLS timeout.
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      cleanupCall(false);
      cleanupQueue();
    };
  }, [session?.id, cleanupCall, cleanupQueue]);

  return {
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
    autoSkippedNotice,
    flipCamera,
    initLocalMedia,
    startSearching,
    nextStranger,
    stopChat,
    toggleMute,
    toggleVideo,
    sendMessage,
  };
}
