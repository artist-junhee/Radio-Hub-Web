export type StreamFormat = 'hls' | 'mp3' | 'aac' | 'ogg' | 'wav' | 'playlist' | 'direct' | 'unknown';

export interface StreamResolution {
  effectiveUrl: string;
  isHls: boolean;
  needsProxy: boolean;
  format: StreamFormat;
}

/**
 * Checks if the current page is loaded over HTTPS while the stream URL is insecure HTTP.
 */
export function isMixedContent(url: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:' && url.startsWith('http://');
}

/**
 * Inspects a stream URL to infer format without rigid extension matching.
 */
export function detectStreamFormat(url: string): StreamFormat {
  const lower = url.toLowerCase();

  // HLS Manifest Detection
  if (
    lower.includes('.m3u8') ||
    lower.includes('format=m3u8') ||
    lower.includes('type=m3u8') ||
    lower.includes('/hls/') ||
    lower.includes('ch=1radio') || // KBS / MBC / SBS CDN stream queries that redirect to m3u8
    lower.includes('ch=2radio') ||
    lower.includes('ch=3radio') ||
    lower.includes('ch=1fm') ||
    lower.includes('ch=2fm') ||
    lower.includes('ch=sfm') ||
    lower.includes('ch=fm4u') ||
    lower.includes('ch=lovefm') ||
    lower.includes('ch=powerfm')
  ) {
    return 'hls';
  }

  // Playlist Text Files (M3U / PLS)
  if (
    (lower.endsWith('.m3u') || lower.includes('.m3u?') || lower.endsWith('.pls')) &&
    !lower.includes('.m3u8')
  ) {
    return 'playlist';
  }

  // Common direct audio codecs
  if (lower.includes('.mp3') || lower.includes('/mp3') || lower.includes('codec=mp3')) {
    return 'mp3';
  }
  if (lower.includes('.aac') || lower.includes('.aacp') || lower.includes('codec=aac')) {
    return 'aac';
  }
  if (lower.includes('.ogg') || lower.includes('.opus')) {
    return 'ogg';
  }
  if (lower.includes('.wav')) {
    return 'wav';
  }

  return 'direct';
}

/**
 * Returns the recommended playback URL and whether HLS or Proxy is recommended.
 */
export function resolveStream(url: string): StreamResolution {
  const format = detectStreamFormat(url);
  const mixed = isMixedContent(url);
  const isHls = format === 'hls';

  // If HTTP on HTTPS site, or if playlist file, route through proxy
  if (mixed || format === 'playlist') {
    return {
      effectiveUrl: `/api/stream-proxy?url=${encodeURIComponent(url)}`,
      isHls: false,
      needsProxy: true,
      format,
    };
  }

  return {
    effectiveUrl: url,
    isHls,
    needsProxy: false,
    format,
  };
}

export function getProxyUrl(url: string): string {
  return `/api/stream-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Checks if browser audio element supports HLS natively (Safari / iOS)
 */
export function canPlayNativeHls(audio: HTMLAudioElement): boolean {
  const canPlay = audio.canPlayType('application/vnd.apple.mpegurl');
  return canPlay === 'probably' || canPlay === 'maybe';
}
