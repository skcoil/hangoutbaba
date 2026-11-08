// ============================================================
// WebRTC Configuration & Utilities
// ============================================================

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

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
