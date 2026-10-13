import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Cast,
  Clock,
  Heart,
  Copy,
  Check,
  RotateCcw,
  Radio,
  WifiOff,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Language } from '../types';
import { getTranslation } from '../i18n';

interface FullPlayerProps {
  isFavorite: boolean;
  onToggleFavorite: () => void;
  lang: Language;
}

export const FullPlayer: React.FC<FullPlayerProps> = ({
  isFavorite,
  onToggleFavorite,
  lang,
}) => {
  const {
    currentStation,
    playState,
    isPlaying,
    error,
    volume,
    isMuted,
    sleepTimerMinutes,
    sleepTimerRemaining,
    castDeviceName,
    isCasting,
    isFullPlayerOpen,
    togglePlay,
    reconnect,
    nextStation,
    prevStation,
    setVolume,
    toggleMute,
    setSleepTimer,
    closeFullPlayer,
    toggleCast,
  } = usePlayer();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);

  if (!isFullPlayerOpen || !currentStation) return null;

  const handleCopyUrl = () => {
    if (currentStation?.url) {
      navigator.clipboard.writeText(currentStation.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const timerOptions = [null, 15, 30, 45, 60, 90];

  const formatRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}분 ${s < 10 ? '0' : ''}${s}초`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="상세 라디오 플레이어"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl text-white overflow-y-auto modal-scroll animate-in fade-in slide-in-from-bottom-8 duration-300 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      {/* Mobile Top Drag Indicator Handle */}
      <div
        onClick={closeFullPlayer}
        className="w-full flex items-center justify-center pt-2 sm:hidden cursor-pointer"
        title="플레이어 닫기"
      >
        <div className="w-12 h-1 rounded-full bg-slate-700 active:bg-slate-500 transition-colors" />
      </div>

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/80 shrink-0">
        <button
          onClick={closeFullPlayer}
          className="w-11 h-11 flex items-center justify-center -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition active:scale-90 cursor-pointer"
          title="플레이어 축소"
          aria-label="플레이어 축소"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center min-w-0 px-2 flex-1">
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-indigo-400 block truncate">
            {getTranslation(lang, 'nowPlaying')}
          </span>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-0.5 truncate">
            <span className="truncate">{currentStation.category}</span>
            <span aria-hidden="true">·</span>
            <span>RADIO HUB</span>
          </div>
        </div>

        <button
          onClick={onToggleFavorite}
          className={`w-11 h-11 flex items-center justify-center -mr-2 rounded-xl transition active:scale-90 cursor-pointer ${
            isFavorite
              ? 'text-rose-500 hover:text-rose-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
          title={getTranslation(lang, 'favorites')}
          aria-label={getTranslation(lang, 'favorites')}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-md mx-auto w-full my-auto">
        {/* Animated Responsive Turntable / Vinyl Record */}
        <div className="relative my-2 sm:my-4 flex items-center justify-center">
          {/* Subtle Ambient Pulse Glow */}
          <div
            className={`absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full transition-opacity duration-700 blur-2xl sm:blur-3xl pointer-events-none ${
              isPlaying
                ? 'bg-indigo-600/30 opacity-100 scale-105'
                : 'bg-indigo-900/10 opacity-30 scale-95'
            }`}
          />

          {/* Vinyl Disc Outer Rim (Scaled for Mobile Viewports) */}
          <div
            className={`relative w-44 h-44 sm:w-60 sm:h-60 md:w-68 md:h-68 rounded-full bg-slate-900 border-4 border-slate-800 shadow-2xl flex items-center justify-center transition-transform duration-700 ${
              isPlaying ? 'animate-spin [animation-duration:12s]' : ''
            }`}
          >
            {/* Vinyl Grooves */}
            <div className="absolute inset-2 sm:inset-3 rounded-full border border-slate-800/60" />
            <div className="absolute inset-5 sm:inset-7 rounded-full border border-slate-800/60" />
            <div className="absolute inset-9 sm:inset-12 rounded-full border border-slate-800/60" />
            <div className="absolute inset-13 sm:inset-18 rounded-full border border-slate-800/70" />

            {/* Inner Label */}
            <div className="relative w-20 h-20 sm:w-26 sm:h-26 rounded-full bg-gradient-to-tr from-indigo-700 via-purple-700 to-pink-600 p-1 flex items-center justify-center shadow-lg">
              <div className="w-full h-full rounded-full bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-1 sm:p-2">
                <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 mb-0.5" />
                <span className="text-[9px] sm:text-[10px] font-bold text-white tracking-wider">RADIO HUB</span>
              </div>
              {/* Spindle hole */}
              <div className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-slate-950 border-2 border-slate-700" />
            </div>
          </div>
        </div>

        {/* Station Title & Info */}
        <div className="text-center w-full px-2 sm:px-4 mt-3 sm:mt-4">
          <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-2 break-words">
            {currentStation.name}
          </h1>

          {/* Metadata: Clean unboxed discipline with typographic separator */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-1.5 sm:mt-2">
            <span>{currentStation.category}</span>
            <span aria-hidden="true">·</span>
            {isCasting ? (
              <span className="text-cyan-400 font-medium">Chromecast ({castDeviceName || '연결됨'})</span>
            ) : playState === 'playing' ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                실시간 방송 청취 중
              </span>
            ) : playState === 'loading' ? (
              <span className="text-amber-400 font-medium animate-pulse">스트림 버퍼링 중...</span>
            ) : playState === 'error' ? (
              <span className="text-rose-400 font-medium">재생 오류</span>
            ) : (
              <span>일시정지됨</span>
            )}
          </div>

          {currentStation.description && (
            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{currentStation.description}</p>
          )}

          {error && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-900/60 text-xs text-rose-300 flex items-center justify-center gap-2 text-left">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                onClick={reconnect}
                className="underline font-semibold ml-1 shrink-0 hover:text-white p-1"
              >
                {getTranslation(lang, 'reconnect')}
              </button>
            </div>
          )}
        </div>

        {/* Playback Controls (Touch friendly ≥ 44px) */}
        <div className="flex items-center justify-center gap-5 sm:gap-7 mt-4 sm:mt-6 w-full">
          <button
            onClick={prevStation}
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition active:scale-90"
            title="이전 방송국"
            aria-label="이전 방송국"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={togglePlay}
            className="w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            title={isPlaying ? '일시정지' : '재생'}
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {playState === 'loading' ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : playState === 'error' ? (
              <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={nextStation}
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition active:scale-90"
            title="다음 방송국"
            aria-label="다음 방송국"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 w-full max-w-xs mt-5 sm:mt-6 px-2">
          <button
            onClick={toggleMute}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-90 cursor-pointer"
            title={isMuted ? '음소거 해제' : '음소거'}
            aria-label={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 py-2"
            aria-label="볼륨 조절 슬라이더"
          />
          <span className="text-[11px] font-mono text-slate-400 w-8 text-right shrink-0">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>

        {/* Quick Utility Actions (Cast, Sleep Timer, Copy Stream URL) */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-5 sm:mt-6 pt-4 border-t border-slate-800/80 w-full text-xs">
          {/* Chromecast */}
          <button
            onClick={toggleCast}
            className={`min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer active:scale-95 ${
              isCasting
                ? 'bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Google Cast"
            aria-label="Google Cast"
          >
            <Cast className={`w-4 h-4 ${isCasting ? 'text-cyan-400' : ''}`} />
            <span>{isCasting ? castDeviceName || 'Cast' : 'Cast'}</span>
          </button>

          {/* Sleep Timer Menu */}
          <div className="relative">
            <button
              onClick={() => setShowTimerMenu(!showTimerMenu)}
              className={`min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer active:scale-95 ${
                sleepTimerRemaining !== null
                  ? 'bg-amber-950/60 border border-amber-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="취침 타이머 설정"
              aria-label="취침 타이머 설정"
            >
              <Clock className="w-4 h-4" />
              <span>
                {sleepTimerRemaining !== null
                  ? formatRemaining(sleepTimerRemaining)
                  : getTranslation(lang, 'sleepTimer')}
              </span>
            </button>

            {showTimerMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 space-y-1 text-xs z-30">
                {timerOptions.map((opt) => (
                  <button
                    key={String(opt)}
                    onClick={() => {
                      setSleepTimer(opt);
                      setShowTimerMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition ${
                      sleepTimerMinutes === opt
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt === null ? '타이머 끄기' : `${opt}분 후 자동 종료`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stream URL Copy */}
          <button
            onClick={handleCopyUrl}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer active:scale-95"
            title="스트림 URL 복사"
            aria-label="스트림 URL 복사"
          >
            {copiedUrl ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">URL 복사</span>
                <span className="sm:hidden">복사</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
