import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Cast,
  Maximize2,
  RotateCcw,
  Radio,
  Clock,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Language } from '../types';

interface MiniPlayerProps {
  lang: Language;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = () => {
  const {
    currentStation,
    playState,
    isPlaying,
    volume,
    isMuted,
    sleepTimerRemaining,
    castState,
    castDeviceName,
    isCasting,
    togglePlay,
    nextStation,
    prevStation,
    setVolume,
    toggleMute,
    openFullPlayer,
    toggleCast,
  } = usePlayer();

  if (!currentStation) return null;

  return (
    <aside
      aria-label="라디오 오디오 플레이어"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-all pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Station Identity & Expand Button (Tap anywhere on info to expand full player) */}
        <div
          onClick={openFullPlayer}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer group active:opacity-85 select-none"
          title="클릭하여 전체화면 플레이어 열기"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFullPlayer();
            }
          }}
        >
          {/* Animated Mini Vinyl / Radio Icon */}
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform overflow-hidden">
            <Radio className="w-5 h-5 relative z-10" />
            {isPlaying && (
              <span className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {currentStation.name}
              </h3>
            </div>
            {/* Clean unboxed metadata with divider */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              <span className="truncate">{currentStation.category}</span>
              <span aria-hidden="true">·</span>
              {isCasting ? (
                <span className="text-cyan-600 dark:text-cyan-400 font-medium truncate">
                  Cast ({castDeviceName || '기기 연결'})
                </span>
              ) : playState === 'playing' ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  실시간
                </span>
              ) : playState === 'loading' ? (
                <span className="text-amber-500 font-medium animate-pulse shrink-0">연결 중</span>
              ) : playState === 'error' ? (
                <span className="text-rose-500 font-medium shrink-0">오류</span>
              ) : (
                <span className="shrink-0">일시정지</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Playback Controls (Optimized touch targets for mobile) */}
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          <button
            onClick={prevStation}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition active:scale-90"
            title="이전 방송국"
            aria-label="이전 방송국"
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            title={isPlaying ? '일시정지' : '재생'}
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {playState === 'loading' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : playState === 'error' ? (
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={nextStation}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition active:scale-90"
            title="다음 방송국"
            aria-label="다음 방송국"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Right: Volume, Sleep indicator, Cast & Expand */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Sleep timer indicator if active (tablet/desktop) */}
          {sleepTimerRemaining !== null && (
            <div
              onClick={openFullPlayer}
              className="hidden md:flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-900/60 cursor-pointer"
              title="취침 타이머 동작 중"
              role="button"
              tabIndex={0}
            >
              <Clock className="w-3 h-3" />
              <span>{Math.ceil(sleepTimerRemaining / 60)}분</span>
            </div>
          )}

          {/* Volume Slider (desktop) */}
          <div className="hidden lg:flex items-center gap-2 w-28 xl:w-32">
            <button
              onClick={toggleMute}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition p-1"
              title={isMuted ? '음소거 해제' : '음소거'}
              aria-label={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              aria-label="볼륨 조절"
            />
          </div>

          {/* Chromecast Button (hidden on narrow 320px screens to prevent squeeze, accessible in FullPlayer) */}
          {castState !== 'unavailable' && (
            <button
              onClick={toggleCast}
              className={`w-9 h-9 sm:w-10 sm:h-10 hidden sm:flex items-center justify-center rounded-xl transition cursor-pointer ${
                isCasting
                  ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Google Cast 전송"
              aria-label="Google Cast 전송"
            >
              <Cast className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Expand to Full Player Button */}
          <button
            onClick={openFullPlayer}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer active:scale-95"
            title="전체화면 플레이어 열기"
            aria-label="전체화면 플레이어 열기"
          >
            <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
