import React from 'react';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  Edit2,
  Trash2,
  Radio,
  RotateCcw,
} from 'lucide-react';
import { Station, Language } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { getTranslation } from '../i18n';

interface StationCardProps {
  station: Station;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onEditStation?: (station: Station) => void;
  onDeleteStation?: (id: string) => void;
  playlist: Station[];
  viewMode: 'grid' | 'list';
  lang: Language;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  isFavorite,
  onToggleFavorite,
  onEditStation,
  onDeleteStation,
  playlist,
  viewMode,
  lang,
}) => {
  const { currentStation, playState, isPlaying, playStation, togglePlay } = usePlayer();
  const [showMenu, setShowMenu] = React.useState(false);

  const isCurrent = currentStation?.id === station.id;
  const isCurrentPlaying = isCurrent && isPlaying;
  const isCurrentLoading = isCurrent && playState === 'loading';
  const isCurrentError = isCurrent && playState === 'error';

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playStation(station, playlist);
    }
  };

  // Compact List Row View
  if (viewMode === 'list') {
    return (
      <div
        className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
          isCurrent
            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
        }`}
      >
        <div
          onClick={handleCardClick}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
        >
          {/* Play status circle button */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
              isCurrentPlaying
                ? 'bg-indigo-600 text-white shadow-sm'
                : isCurrentLoading
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white'
            }`}
            role="button"
            aria-label={`${isCurrentPlaying ? '일시정지' : '재생'}: ${station.name}`}
          >
            {isCurrentLoading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : isCurrentError ? (
              <RotateCcw className="w-4 h-4" />
            ) : isCurrentPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </div>

          <div className="min-w-0 flex-1 pr-1">
            <h4
              className={`font-semibold text-xs sm:text-sm truncate leading-snug break-words ${
                isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {station.name}
            </h4>

            {/* Zero-Pill Discipline: unboxed text metadata with dot separator */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              <span>{station.category}</span>
              {station.isCustom && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-500 dark:text-indigo-400 font-medium">사용자 등록</span>
                </>
              )}
              {isCurrentPlaying && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    청취 중
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions (Touch targets ≥ 40-44px) */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          <button
            onClick={() => onToggleFavorite(station.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition active:scale-90 cursor-pointer ${
              isFavorite
                ? 'text-rose-500 hover:text-rose-600'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={getTranslation(lang, 'favorites')}
            aria-label={`${isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}: ${station.name}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {station.isCustom && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                title="추가 메뉴"
                aria-label="추가 메뉴"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-30 text-xs">
                  {onEditStation && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEditStation(station);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{getTranslation(lang, 'editStation')}</span>
                    </button>
                  )}
                  {onDeleteStation && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (confirm(getTranslation(lang, 'confirmDelete'))) {
                          onDeleteStation(station.id);
                        }
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{getTranslation(lang, 'deleteStation')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid Card View (Responsive for 320px, 360px, 768px, 1440px)
  return (
    <div
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
        isCurrent
          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm ring-1 ring-indigo-500/30'
          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Card Header: Brand Icon & Action Buttons */}
      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
        <div
          onClick={handleCardClick}
          className="cursor-pointer flex items-center gap-2.5"
        >
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${
              isCurrent
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
            }`}
          >
            <Radio className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite(station.id)}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition cursor-pointer active:scale-90 ${
              isFavorite
                ? 'text-rose-500 hover:text-rose-600'
                : 'text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title={getTranslation(lang, 'favorites')}
            aria-label={`${isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}: ${station.name}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {station.isCustom && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90"
                title="추가 메뉴"
                aria-label="추가 메뉴"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-30 text-xs">
                  {onEditStation && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEditStation(station);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{getTranslation(lang, 'editStation')}</span>
                    </button>
                  )}
                  {onDeleteStation && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (confirm(getTranslation(lang, 'confirmDelete'))) {
                          onDeleteStation(station.id);
                        }
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{getTranslation(lang, 'deleteStation')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Body: Title & Clean unboxed metadata */}
      <div onClick={handleCardClick} className="cursor-pointer flex-1">
        <h4
          className={`font-semibold text-xs sm:text-sm line-clamp-2 leading-snug break-words ${
            isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
          }`}
        >
          {station.name}
        </h4>

        {/* Zero-Pill Discipline */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2">
          <span>{station.category}</span>
          {station.isCustom && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-indigo-500 dark:text-indigo-400 font-medium">사용자 등록</span>
            </>
          )}
        </div>

        {station.description && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1 break-words">
            {station.description}
          </p>
        )}
      </div>

      {/* Card Footer: Play Action Affordance */}
      <div
        onClick={handleCardClick}
        className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between cursor-pointer select-none"
      >
        <span className="text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 font-medium transition-colors">
          {isCurrentPlaying ? '재생 중' : isCurrentLoading ? '버퍼링 중' : '스트림 청취'}
        </span>

        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isCurrentPlaying
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white'
          }`}
          role="button"
          aria-label={`${isCurrentPlaying ? '일시정지' : '재생'}: ${station.name}`}
        >
          {isCurrentLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : isCurrentError ? (
            <RotateCcw className="w-3.5 h-3.5" />
          ) : isCurrentPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
};
