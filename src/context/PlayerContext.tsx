import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import Hls from 'hls.js';
import { Station, PlayState, CastState } from '../types';
import { addToHistory, getSettings, saveSettings } from '../utils/db';
import { castManager } from '../utils/cast';
import {
  detectStreamFormat,
  isMixedContent,
  getProxyUrl,
  canPlayNativeHls,
} from '../utils/streamResolver';

interface PlayerContextType {
  currentStation: Station | null;
  playState: PlayState;
  isPlaying: boolean;
  error: string | null;
  volume: number;
  isMuted: boolean;
  activePlaylist: Station[];
  sleepTimerMinutes: number | null;
  sleepTimerRemaining: number | null; // seconds
  castState: CastState;
  castDeviceName: string;
  isCasting: boolean;
  isFullPlayerOpen: boolean;

  playStation: (station: Station, playlist?: Station[]) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  stop: () => void;
  reconnect: () => void;
  nextStation: () => void;
  prevStation: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setSleepTimer: (minutes: number | null) => void;
  setActivePlaylist: (playlist: Station[]) => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
  toggleCast: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activePlaylist, setActivePlaylistState] = useState<Station[]>([]);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);

  // Cast states
  const [castState, setCastState] = useState<CastState>('unavailable');
  const [castDeviceName, setCastDeviceName] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const currentStationRef = useRef<Station | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<any>(null);
  const historyTimerRef = useRef<any>(null);
  const sleepIntervalRef = useRef<any>(null);
  const fallbackAttemptedRef = useRef<{ proxy: boolean; direct: boolean }>({
    proxy: false,
    direct: false,
  });

  // Keep currentStationRef synchronized
  useEffect(() => {
    currentStationRef.current = currentStation;
  }, [currentStation]);

  // Teardown previous stream completely
  const cleanupStream = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (historyTimerRef.current) {
      clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
    }

    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying HLS instance:', e);
      }
      hlsRef.current = null;
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      } catch (e) {
        console.warn('Error clearing audio element:', e);
      }
    }
  }, []);

  // Initialize audio element & initial settings
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    // IMPORTANT: Do NOT set audio.crossOrigin = 'anonymous' for direct audio elements!
    // Direct audio playback does not need CORS headers, but setting crossOrigin enforces CORS,
    // which breaks Icecast/Shoutcast/MP3/AAC streams that do not return Access-Control-Allow-Origin!
    audioRef.current = audio;

    // Load initial volume & mute
    getSettings().then((s) => {
      if (typeof s.volume === 'number') {
        setVolumeState(s.volume);
        audio.volume = s.volume;
      }
      if (typeof s.isMuted === 'boolean') {
        setIsMuted(s.isMuted);
        audio.muted = s.isMuted;
      }
    });

    const handleWaiting = () => {
      setPlayState((prev) => (prev === 'playing' ? 'loading' : prev));
    };

    const handlePlaying = () => {
      setPlayState('playing');
      setError(null);
      retryCountRef.current = 0;
    };

    const handlePause = () => {
      setPlayState((prev) => (prev !== 'error' && prev !== 'loading' ? 'paused' : prev));
    };

    const handleError = () => {
      const audioErr = audio.error;
      const station = currentStationRef.current;
      console.warn('[RADIO HUB] Audio Error Event:', {
        code: audioErr?.code,
        message: audioErr?.message,
        src: audio.src,
        station: station?.name,
      });

      // Handle fallback to Proxy if direct audio failed and proxy hasn't been tried yet
      if (station && !fallbackAttemptedRef.current.proxy) {
        fallbackAttemptedRef.current.proxy = true;
        console.info('[RADIO HUB] Direct audio playback failed. Retrying via stream proxy...');
        const proxyUrl = getProxyUrl(station.url);
        audio.src = proxyUrl;
        audio.load();
        audio.play().catch((playErr) => {
          console.warn('[RADIO HUB] Proxy audio play error:', playErr);
        });
        return;
      }

      let errMsg = '스트림 연결에 실패했습니다.';
      if (audioErr) {
        if (audioErr.code === MediaError.MEDIA_ERR_NETWORK) {
          errMsg = '네트워크 연결 오류 또는 방송국 서버 응답이 없습니다.';
        } else if (audioErr.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          if (station && isMixedContent(station.url)) {
            errMsg = '보안 정책(HTTPS)으로 인해 HTTP 스트림이 차단되었습니다 (혼합 콘텐츠).';
          } else {
            errMsg = '지원되지 않는 오디오 형식이거나 방송국 서버에서 차단된 스트림입니다.';
          }
        }
      }
      setError(errMsg);
      setPlayState('error');

      // Auto-reconnect retry logic (up to 2 attempts)
      if (retryCountRef.current < 2 && station) {
        retryCountRef.current += 1;
        retryTimerRef.current = setTimeout(() => {
          if (audioRef.current && currentStationRef.current) {
            console.info(`[RADIO HUB] Auto-reconnecting attempt ${retryCountRef.current}...`);
            audioRef.current.load();
            audioRef.current.play().catch(() => {});
          }
        }, 3000);
      }
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    // Sync state when resuming from mobile lockscreen or background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && audioRef.current && currentStationRef.current) {
        if (!audioRef.current.paused && audioRef.current.src) {
          setPlayState('playing');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cast SDK listener
    const unsubCast = castManager.subscribe((state, deviceName) => {
      setCastState(state);
      setCastDeviceName(deviceName || '');
    });

    return () => {
      cleanupStream();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      unsubCast();
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    };
  }, [cleanupStream]);

  // Media Session API Sync
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentStation) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: 'RADIO HUB',
        album: currentStation.category,
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevStation());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextStation());
      navigator.mediaSession.setActionHandler('stop', () => stop());
    }
  }, [currentStation, playState, activePlaylist]);

  // Sleep Timer Interval
  useEffect(() => {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);

    if (sleepTimerRemaining !== null && sleepTimerRemaining > 0) {
      sleepIntervalRef.current = setInterval(() => {
        setSleepTimerRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(sleepIntervalRef.current);
            stop();
            setSleepTimerMinutes(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    };
  }, [sleepTimerRemaining]);

  const setSleepTimer = useCallback((minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    if (minutes === null) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
  }, []);

  const playStation = useCallback(
    async (station: Station, playlist?: Station[]) => {
      if (!audioRef.current) return;
      const audio = audioRef.current;

      if (playlist && playlist.length > 0) {
        setActivePlaylistState(playlist);
      }

      // If casting is active, send stream to Chromecast
      if (castState === 'connected') {
        setCurrentStation(station);
        setPlayState('loading');
        audio.pause();
        const ok = await castManager.castStation(station);
        if (ok) {
          setPlayState('playing');
          addToHistory(station);
        } else {
          setPlayState('error');
          setError('Chromecast 스트림 전송에 실패했습니다.');
        }
        return;
      }

      // Normal Local Audio Playback
      cleanupStream();
      fallbackAttemptedRef.current = { proxy: false, direct: false };
      retryCountRef.current = 0;

      setCurrentStation(station);
      setPlayState('loading');
      setError(null);

      const streamFormat = detectStreamFormat(station.url);
      const isHttp = isMixedContent(station.url);

      console.info(`[RADIO HUB] Starting playback for "${station.name}":`, {
        url: station.url,
        format: streamFormat,
        isMixedContent: isHttp,
      });

      // Strategy A: If it's insecure HTTP on an HTTPS page, route through stream-proxy
      if (isHttp) {
        fallbackAttemptedRef.current.proxy = true;
        const proxyUrl = getProxyUrl(station.url);
        try {
          audio.src = proxyUrl;
          audio.load();
          await audio.play();
          historyTimerRef.current = setTimeout(() => addToHistory(station), 3000);
          return;
        } catch (err: any) {
          console.warn('[RADIO HUB] HTTP Proxy playback error:', err);
          setPlayState('error');
          setError(
            err?.name === 'NotAllowedError'
              ? '브라우저 자동 재생 정책으로 차단되었습니다. 재생 버튼을 눌러주세요.'
              : 'HTTP 방송국 스트림 연결에 실패했습니다.'
          );
          return;
        }
      }

      // Strategy B: If it's an HLS stream (.m3u8 or detected HLS)
      if (streamFormat === 'hls') {
        // B1. If browser natively supports HLS (Safari / iOS)
        if (canPlayNativeHls(audio)) {
          console.info('[RADIO HUB] Using native HLS decoder for Safari/iOS');
          try {
            audio.src = station.url;
            audio.load();
            await audio.play();
            historyTimerRef.current = setTimeout(() => addToHistory(station), 3000);
            return;
          } catch (err: any) {
            console.warn('[RADIO HUB] Native HLS error:', err);
            // Fall through to HLS.js or direct audio
          }
        }

        // B2. If HLS.js is supported (Chrome, Edge, Firefox, Android)
        if (Hls.isSupported()) {
          console.info('[RADIO HUB] Initializing HLS.js engine');
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 60,
          });
          hlsRef.current = hls;

          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.warn('[RADIO HUB] HLS.js error:', data.type, data.details, data.fatal);

            // If the stream was NOT actually an HLS stream (e.g. redirect to MP3 or manifest parsing error)
            if (data.details === 'manifestParsingError') {
              console.info('[RADIO HUB] Manifest parsing failed; falling back to native HTMLAudioElement direct stream...');
              hls.destroy();
              hlsRef.current = null;
              if (audioRef.current) {
                audioRef.current.src = station.url;
                audioRef.current.load();
                audioRef.current.play().catch(() => {});
              }
              return;
            }

            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn('[RADIO HUB] HLS network error, attempting recovery...');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn('[RADIO HUB] HLS media error, attempting recovery...');
                  hls.recoverMediaError();
                  break;
                default:
                  console.error('[RADIO HUB] Fatal unrecoverable HLS error');
                  hls.destroy();
                  hlsRef.current = null;
                  setPlayState('error');
                  setError('HLS 스트림 디코딩 오류가 발생했습니다.');
                  break;
              }
            }
          });

          hls.loadSource(station.url);
          hls.attachMedia(audio);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.info('[RADIO HUB] HLS manifest parsed successfully');
            audio.play().catch((err) => {
              if (err.name === 'NotAllowedError') {
                setPlayState('error');
                setError('브라우저 자동 재생 정책으로 차단되었습니다. 재생 버튼을 눌러주세요.');
              }
            });
          });

          historyTimerRef.current = setTimeout(() => addToHistory(station), 3000);
          return;
        }
      }

      // Strategy C: Standard direct audio stream (MP3, AAC, OGG, Opus, WAV, Icecast, or direct URL)
      try {
        console.info('[RADIO HUB] Playing direct audio stream via HTMLAudioElement');
        audio.src = station.url;
        audio.load();

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }

        historyTimerRef.current = setTimeout(() => addToHistory(station), 3000);
      } catch (err: any) {
        console.warn('[RADIO HUB] Direct audio play error:', err);
        if (err?.name === 'NotAllowedError') {
          setPlayState('error');
          setError('브라우저 자동 재생 정책으로 차단되었습니다. 화면의 재생 버튼을 직접 터치해주세요.');
        } else {
          // Attempt proxy fallback immediately
          if (!fallbackAttemptedRef.current.proxy) {
            fallbackAttemptedRef.current.proxy = true;
            console.info('[RADIO HUB] Falling back to proxy playback...');
            try {
              audio.src = getProxyUrl(station.url);
              audio.load();
              await audio.play();
              historyTimerRef.current = setTimeout(() => addToHistory(station), 3000);
              return;
            } catch (proxyErr: any) {
              console.warn('[RADIO HUB] Proxy fallback also failed:', proxyErr);
            }
          }

          setPlayState('error');
          setError('스트림을 불러올 수 없습니다. 방송사 서버 장애이거나 지원되지 않는 형식입니다.');
        }
      }
    },
    [castState, cleanupStream]
  );

  const togglePlay = useCallback(() => {
    if (!currentStation) return;
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (playState === 'playing') {
      audio.pause();
      setPlayState('paused');
    } else if (playState === 'paused' || playState === 'idle') {
      setPlayState('loading');
      setError(null);
      audio.play().catch((err) => {
        console.warn('Play resume error:', err);
        setPlayState('error');
        setError(
          err.name === 'NotAllowedError'
            ? '재생 버튼을 다시 클릭하여 재생을 시작하세요.'
            : '재생을 시작할 수 없습니다.'
        );
      });
    } else if (playState === 'error') {
      reconnect();
    }
  }, [currentStation, playState]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayState('paused');
    }
  }, []);

  const stop = useCallback(() => {
    cleanupStream();
    setPlayState('idle');
    setError(null);
  }, [cleanupStream]);

  const reconnect = useCallback(() => {
    if (currentStation) {
      playStation(currentStation);
    }
  }, [currentStation, playStation]);

  const nextStation = useCallback(() => {
    if (!currentStation || activePlaylist.length === 0) return;
    const currentIndex = activePlaylist.findIndex((s) => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % activePlaylist.length;
    playStation(activePlaylist[nextIndex], activePlaylist);
  }, [currentStation, activePlaylist, playStation]);

  const prevStation = useCallback(() => {
    if (!currentStation || activePlaylist.length === 0) return;
    const currentIndex = activePlaylist.findIndex((s) => s.id === currentStation.id);
    const prevIndex = (currentIndex - 1 + activePlaylist.length) % activePlaylist.length;
    playStation(activePlaylist[prevIndex], activePlaylist);
  }, [currentStation, activePlaylist, playStation]);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      if (clamped > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
    saveSettings({ volume: clamped });
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
    saveSettings({ isMuted: nextMuted });
  }, [isMuted]);

  const toggleCast = useCallback(async () => {
    if (castState === 'connected') {
      castManager.endCurrentSession(true);
      // Resume locally
      if (currentStation && audioRef.current) {
        playStation(currentStation);
      }
    } else {
      if (!currentStation) return;
      const ok = await castManager.requestSession();
      if (ok && currentStation) {
        audioRef.current?.pause();
        await castManager.castStation(currentStation);
      }
    }
  }, [castState, currentStation, playStation]);

  const openFullPlayer = useCallback(() => setIsFullPlayerOpen(true), []);
  const closeFullPlayer = useCallback(() => setIsFullPlayerOpen(false), []);

  return (
    <PlayerContext.Provider
      value={{
        currentStation,
        playState,
        isPlaying: playState === 'playing',
        error,
        volume,
        isMuted,
        activePlaylist,
        sleepTimerMinutes,
        sleepTimerRemaining,
        castState,
        castDeviceName,
        isCasting: castState === 'connected',
        isFullPlayerOpen,
        playStation,
        togglePlay,
        pause,
        stop,
        reconnect,
        nextStation,
        prevStation,
        setVolume,
        toggleMute,
        setSleepTimer,
        setActivePlaylist: setActivePlaylistState,
        openFullPlayer,
        closeFullPlayer,
        toggleCast,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
