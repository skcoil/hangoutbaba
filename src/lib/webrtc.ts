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

/**
 * Get active WebRTC configuration, supporting custom TURN credentials or dynamic Metered API
 */
export async function getRTCConfig(): Promise<RTCConfiguration> {
  // 1. If user provided a Metered Domain & API key in env, fetch dynamic TURN servers with dedicated free 20GB/mo quota
  const meteredDomain = process.env.NEXT_PUBLIC_METERED_DOMAIN;
  const meteredApiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;

  if (meteredDomain && meteredApiKey) {
    try {
      const res = await fetch(`https://${meteredDomain}.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`);
      if (res.ok) {
        const dynamicServers: RTCIceServer[] = await res.json();
        if (Array.isArray(dynamicServers) && dynamicServers.length > 0) {
          return {
            iceServers: [...dynamicServers, ...DEFAULT_STUN_SERVERS],
            iceTransportPolicy: 'all',
          };
        }
      }
    } catch (e) {
      console.warn('[WebRTC] Failed to fetch dynamic Metered TURN credentials, using default fallback:', e);
    }
  }

  // 2. If user provided custom static TURN credentials in env
  const customTurnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const customTurnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const customTurnPass = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (customTurnUrl && customTurnUser && customTurnPass) {
    return {
      iceServers: [
        {
          urls: customTurnUrl.split(',').map((u) => u.trim()),
          username: customTurnUser,
          credential: customTurnPass,
        },
        ...DEFAULT_STUN_SERVERS,
      ],
      iceTransportPolicy: 'all',
    };
  }

  return {
    iceServers: DEFAULT_STUN_SERVERS,
    iceTransportPolicy: 'all',
  };
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
