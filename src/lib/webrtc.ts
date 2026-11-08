// ============================================================
// WebRTC Configuration & Utilities
// ============================================================

/**
 * Standard ICE Servers:
 * - High-speed STUN servers (Google, Cloudflare) for direct P2P NAT hole-punching
 * - OpenRelay TURN servers (UDP + TCP port 443) for relaying media when symmetric NAT / mobile firewalls block direct P2P
 */
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  // Primary Public STUN servers
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:openrelay.metered.ca:80' },

  // OpenRelay Public TURN servers (Required for connections between different networks / mobile data)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turns:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

/**
 * Get active WebRTC configuration, supporting custom TURN credentials or dynamic Metered API
 */
export async function getRTCConfig(): Promise<RTCConfiguration> {
  // If user provided a Metered Domain & API key in env, fetch dynamic ICE servers with dedicated free 20GB/mo quota
  const meteredDomain = process.env.NEXT_PUBLIC_METERED_DOMAIN;
  const meteredApiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;

  if (meteredDomain && meteredApiKey) {
    try {
      const res = await fetch(`https://${meteredDomain}.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`);
      if (res.ok) {
        const dynamicServers: RTCIceServer[] = await res.json();
        if (Array.isArray(dynamicServers) && dynamicServers.length > 0) {
          return {
            iceServers: [...dynamicServers, ...DEFAULT_ICE_SERVERS],
            iceTransportPolicy: 'all',
          };
        }
      }
    } catch (e) {
      console.warn('[WebRTC] Failed to fetch dynamic Metered TURN credentials, using default fallback:', e);
    }
  }

  // If user provided custom static TURN in env
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
        ...DEFAULT_ICE_SERVERS,
      ],
      iceTransportPolicy: 'all',
    };
  }

  return {
    iceServers: DEFAULT_ICE_SERVERS,
    iceTransportPolicy: 'all',
  };
}

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: DEFAULT_ICE_SERVERS,
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
