// ============================================================
// WebRTC Configuration & Utilities
// ============================================================

/**
 * Standard Verified Public STUN Servers:
 * High-speed STUN servers across Google, Cloudflare, and Mozilla for NAT discovery.
 */
export const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.services.mozilla.com:3478' },
  { urls: 'stun:stun.sipgate.net:3478' },
];

let cachedRTCConfig: RTCConfiguration | null = null;
let pendingConfigPromise: Promise<RTCConfiguration> | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

/**
 * Get active WebRTC configuration, supporting custom TURN credentials or dynamic Metered API
 */
export async function getRTCConfig(): Promise<RTCConfiguration> {
  const now = Date.now();
  if (cachedRTCConfig && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedRTCConfig;
  }

  if (pendingConfigPromise) {
    return pendingConfigPromise;
  }

  pendingConfigPromise = (async (): Promise<RTCConfiguration> => {
    // 1. If user provided custom static TURN credentials in env (e.g. Oracle Cloud Always Free CoTURN)
    const customTurnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const customTurnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const customTurnPass = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    if (customTurnUrl && customTurnUser && customTurnPass) {
      console.log('[WebRTC] Using dedicated lifetime CoTURN server on Oracle Cloud...');
      cachedRTCConfig = {
        iceServers: [
          {
            urls: customTurnUrl.split(',').map((u) => u.trim()),
            username: customTurnUser,
            credential: customTurnPass,
          },
          ...DEFAULT_STUN_SERVERS,
        ],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 10,
      };
      lastFetchTime = Date.now();
      return cachedRTCConfig;
    }

    // 2. If user provided a Metered Domain & API key in env, fetch dynamic TURN servers
    const meteredDomain = process.env.NEXT_PUBLIC_METERED_DOMAIN;
    const meteredApiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;

    if (meteredDomain && meteredApiKey) {
      try {
        const cleanDomain = meteredDomain
          .replace(/^https?:\/\//, '')
          .replace(/\.metered\.live\/?$/, '')
          .trim();
        const endpoint = `https://${cleanDomain}.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey.trim()}`;
        console.log('[WebRTC] Requesting dynamic Metered TURN credentials...');
        const res = await fetch(endpoint);
        if (res.ok) {
          const dynamicServers: RTCIceServer[] = await res.json();
          if (Array.isArray(dynamicServers) && dynamicServers.length > 0) {
            console.log(`[WebRTC] Loaded ${dynamicServers.length} Metered TURN servers successfully.`);
            cachedRTCConfig = {
              iceServers: [...dynamicServers, ...DEFAULT_STUN_SERVERS],
              iceTransportPolicy: 'all',
              iceCandidatePoolSize: 10,
            };
            lastFetchTime = Date.now();
            return cachedRTCConfig;
          }
        } else {
          console.warn('[WebRTC] Metered API returned status:', res.status, res.statusText);
        }
      } catch (e) {
        console.warn('[WebRTC] Failed to fetch dynamic Metered TURN credentials, using fallback:', e);
      }
    }

    cachedRTCConfig = {
      iceServers: DEFAULT_STUN_SERVERS,
      iceTransportPolicy: 'all',
      iceCandidatePoolSize: 5,
    };
    lastFetchTime = Date.now();
    return cachedRTCConfig;
  })().finally(() => {
    pendingConfigPromise = null;
  });

  return pendingConfigPromise;
}

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: DEFAULT_STUN_SERVERS,
  iceTransportPolicy: 'all',
};

/**
 * Sanitize candidate to avoid undefined fields breaking Firestore addDoc
 */
export function sanitizeIceCandidate(candidate: RTCIceCandidate): Record<string, any> {
  const json = candidate.toJSON();
  const clean: Record<string, any> = {
    candidate: json.candidate || '',
  };
  if (json.sdpMid !== undefined && json.sdpMid !== null) {
    clean.sdpMid = json.sdpMid;
  }
  if (json.sdpMLineIndex !== undefined && json.sdpMLineIndex !== null) {
    clean.sdpMLineIndex = json.sdpMLineIndex;
  }
  if (json.usernameFragment) {
    clean.usernameFragment = json.usernameFragment;
  }
  return clean;
}

/**
 * Stop all tracks on a MediaStream to release camera and microphone hardware
 */
export function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch (e) {
      console.warn('[WebRTC] Failed to stop track:', e);
    }
  });
}

/**
 * Safely toggle audio track enabled status
 */
export function setStreamAudioEnabled(stream: MediaStream | null, enabled: boolean) {
  if (!stream) return;
  stream.getAudioTracks().forEach((track) => {
    track.enabled = enabled;
  });
}

/**
 * Safely toggle video track enabled status
 */
export function setStreamVideoEnabled(stream: MediaStream | null, enabled: boolean) {
  if (!stream) return;
  stream.getVideoTracks().forEach((track) => {
    track.enabled = enabled;
  });
}
