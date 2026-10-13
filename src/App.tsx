import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Radio,
  Search,
  Heart,
  Clock,
  Plus,
  SlidersHorizontal,
  LayoutGrid,
  List,
  FolderSync,
  Settings as SettingsIcon,
  Moon,
  Sun,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import defaultStationsData from './data/stations.json';
import {
  Station,
  AppSettings,
  ThemeMode,
} from './types';
import {
  getCustomStations,
  saveCustomStation,
  deleteCustomStation,
  getFavorites,
  toggleFavorite,
  getHistory,
  getCategoryOrder,
  saveCategoryOrder,
  getSettings,
  saveSettings,
  defaultSettings,
} from './utils/db';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { MiniPlayer } from './components/MiniPlayer';
import { FullPlayer } from './components/FullPlayer';
import { StationCard } from './components/StationCard';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { StationModal } from './components/StationModal';
import { DataBackupModal } from './components/DataBackupModal';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { getTranslation } from './i18n';

function RadioHubMain() {
  const {
    currentStation,
    togglePlay,
    nextStation,
    prevStation,
    volume,
    setVolume,
    toggleMute,
  } = usePlayer();

  // App States
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [customStations, setCustomStations] = useState<Station[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [historyStationIds, setHistoryStationIds] = useState<string[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mobile specific UI states
  const [isCategoryExpanded, setIsCategoryExpanded] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<Station | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load initial data from DB
  const refreshData = useCallback(async () => {
    try {
      const [custom, favs, hist, catOrder, sett] = await Promise.all([
        getCustomStations(),
        getFavorites(),
        getHistory(),
        getCategoryOrder(),
        getSettings(),
      ]);

      setCustomStations(custom);
      setFavorites(favs);
      setHistoryStationIds(hist.map((h) => h.stationId));
      setCategoryOrder(catOrder);
      setSettings(sett);
      if (sett.preferredView) {
        setViewMode(sett.preferredView);
      }
    } catch (err) {
      console.warn('Failed to load storage data:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Apply Theme Mode (Light / Dark / System)
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (mode: ThemeMode) => {
      if (mode === 'dark' || (mode === 'system' && mediaQuery.matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(settings.theme);

    const listener = () => {
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [settings.theme]);

  // Keyboard Shortcuts (Space, Left/Right, Up/Down, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevStation();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextStation();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, prevStation, nextStation, volume, setVolume, toggleMute]);

  // All Stations combined (Default + Custom)
  const allStations = useMemo(() => {
    const map = new Map<string, Station>();
    (defaultStationsData as Station[]).forEach((s) => map.set(s.id, s));
    customStations.forEach((s) => map.set(s.id, s));
    return Array.from(map.values());
  }, [customStations]);

  // Ensure category order includes any categories from custom stations
  const displayCategories = useMemo(() => {
    const catSet = new Set(categoryOrder);
    allStations.forEach((s) => {
      if (s.category && !catSet.has(s.category)) {
        catSet.add(s.category);
      }
    });
    return Array.from(catSet);
  }, [categoryOrder, allStations]);

  // Filtering Logic
  const filteredStations = useMemo(() => {
    let list = allStations;

    // Filter by Tab
    if (activeCategory === 'favorites') {
      const favSet = new Set(favorites);
      list = list.filter((s) => favSet.has(s.id));
    } else if (activeCategory === 'recent') {
      const orderMap = new Map<string, number>();
      historyStationIds.forEach((id, index) => orderMap.set(id, index));
      list = list
        .filter((s) => orderMap.has(s.id))
        .sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
    } else if (activeCategory !== 'all') {
      list = list.filter((s) => s.category === activeCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allStations, activeCategory, favorites, historyStationIds, searchQuery]);

  // Favorites Handlers
  const handleToggleFavorite = async (stationId: string) => {
    const isNowFav = await toggleFavorite(stationId);
    setFavorites((prev) =>
      isNowFav ? [...prev, stationId] : prev.filter((id) => id !== stationId)
    );
  };

  // Custom Station Handlers
  const handleSaveStation = async (station: Station) => {
    await saveCustomStation(station);
    setCustomStations((prev) => {
      const idx = prev.findIndex((s) => s.id === station.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = station;
        return next;
      }
      return [...prev, station];
    });
  };

  const handleDeleteStation = async (stationId: string) => {
    await deleteCustomStation(stationId);
    setCustomStations((prev) => prev.filter((s) => s.id !== stationId));
  };

  // Category Order Save
  const handleSaveCategoryOrder = async (newOrder: string[]) => {
    setCategoryOrder(newOrder);
    await saveCategoryOrder(newOrder);
  };

  // Settings update
  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    const updated = await saveSettings(partial);
    setSettings(updated);
    if (partial.preferredView) {
      setViewMode(partial.preferredView);
    }
  };

  // Quick Theme toggle
  const toggleThemeQuick = () => {
    const nextTheme: ThemeMode = settings.theme === 'dark' ? 'light' : 'dark';
    handleUpdateSettings({ theme: nextTheme });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Live Pulse */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  RADIO HUB
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Centered Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-md mx-2 sm:mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getTranslation(settings.language, 'searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="검색어 지우기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-90"
              title="검색"
              aria-label="검색창 열기/닫기"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton lang={settings.language} />

            {/* Add Custom Station Button (Desktop/Tablet) */}
            <button
              onClick={() => {
                setStationToEdit(null);
                setIsStationModalOpen(true);
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition active:scale-95 cursor-pointer"
              title={getTranslation(settings.language, 'addStation')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{getTranslation(settings.language, 'addStation')}</span>
            </button>

            {/* View Mode Toggle (Grid / List) */}
            <button
              onClick={() => {
                const next = viewMode === 'grid' ? 'list' : 'grid';
                setViewMode(next);
                handleUpdateSettings({ preferredView: next });
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              title={viewMode === 'grid' ? '목록 보기' : '그리드 보기'}
              aria-label={viewMode === 'grid' ? '목록 보기로 전환' : '그리드 보기로 전환'}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            </button>

            {/* M3U Backup & Restore Button (hidden on very small 320px screens, accessible via Settings) */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 hidden xs:flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              title={getTranslation(settings.language, 'backupAndRestore')}
              aria-label={getTranslation(settings.language, 'backupAndRestore')}
            >
              <FolderSync className="w-4 h-4" />
            </button>

            {/* Quick Theme Switcher */}
            <button
              onClick={toggleThemeQuick}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              title={settings.theme === 'dark' ? '라이트 모드' : '다크 모드'}
              aria-label={settings.theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              title={getTranslation(settings.language, 'settings')}
              aria-label={getTranslation(settings.language, 'settings')}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {isMobileSearchOpen && (
          <div className="sm:hidden px-3 pb-2.5 pt-0.5 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getTranslation(settings.language, 'searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                  aria-label="검색어 지우기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Category Navigation Bar (With Mobile Collapsible / Expandable Drawer) */}
      <nav
        aria-label="라디오 카테고리 선택"
        className="sticky top-14 sm:top-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 transition-colors shadow-2xs"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
          <div className="flex items-center justify-between gap-2">
            {/* Horizontal Scrollable Tabs (When Collapsed) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 flex-1 pr-1">
              {/* 'All' Tab */}
              <button
                onClick={() => {
                  setActiveCategory('all');
                  if (isCategoryExpanded) setIsCategoryExpanded(false);
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 ${
                  activeCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {getTranslation(settings.language, 'allCategories')}
                <span className="ml-1 text-[10px] opacity-75 font-normal">({allStations.length})</span>
              </button>

              {/* 'Favorites' Tab */}
              <button
                onClick={() => {
                  setActiveCategory('favorites');
                  if (isCategoryExpanded) setIsCategoryExpanded(false);
                }}
                className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 ${
                  activeCategory === 'favorites'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${activeCategory === 'favorites' ? 'fill-current' : ''}`} />
                <span>{getTranslation(settings.language, 'favorites')}</span>
                {favorites.length > 0 && (
                  <span className="text-[10px] opacity-80 font-normal">({favorites.length})</span>
                )}
              </button>

              {/* 'Recent' Tab */}
              <button
                onClick={() => {
                  setActiveCategory('recent');
                  if (isCategoryExpanded) setIsCategoryExpanded(false);
                }}
                className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 ${
                  activeCategory === 'recent'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{getTranslation(settings.language, 'recentHistory')}</span>
                {historyStationIds.length > 0 && (
                  <span className="text-[10px] opacity-80 font-normal">({historyStationIds.length})</span>
                )}
              </button>

              {/* Separator */}
              <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 shrink-0 mx-1" aria-hidden="true" />

              {/* Ordered Regional & Custom Categories */}
              {displayCategories.map((cat) => {
                const count = allStations.filter((s) => s.category === cat).length;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      if (isCategoryExpanded) setIsCategoryExpanded(false);
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="ml-1 text-[10px] opacity-70 font-normal">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Expand / Collapse Toggle + Category Manager Button */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                title={isCategoryExpanded ? '카테고리 접기' : '모든 카테고리 펼쳐보기'}
                aria-label={isCategoryExpanded ? '카테고리 접기' : '모든 카테고리 펼쳐보기'}
              >
                {isCategoryExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">접기</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">펼치기</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                title={getTranslation(settings.language, 'reorderCategories')}
                aria-label={getTranslation(settings.language, 'reorderCategories')}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Expanded Category Grid Panel */}
          {isCategoryExpanded && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                <span>카테고리 전체 목록 (터치하여 이동)</span>
                <button
                  onClick={() => setIsCategoryExpanded(false)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  접기
                </button>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-56 overflow-y-auto modal-scroll p-0.5">
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setIsCategoryExpanded(false);
                  }}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span className="truncate">{getTranslation(settings.language, 'allCategories')}</span>
                  <span className="text-[10px] opacity-75 ml-1">({allStations.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveCategory('favorites');
                    setIsCategoryExpanded(false);
                  }}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between transition-colors ${
                    activeCategory === 'favorites'
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span className="truncate flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-current" />
                    {getTranslation(settings.language, 'favorites')}
                  </span>
                  <span className="text-[10px] opacity-75 ml-1">({favorites.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveCategory('recent');
                    setIsCategoryExpanded(false);
                  }}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between transition-colors ${
                    activeCategory === 'recent'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span className="truncate flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getTranslation(settings.language, 'recentHistory')}
                  </span>
                  <span className="text-[10px] opacity-75 ml-1">({historyStationIds.length})</span>
                </button>

                {displayCategories.map((cat) => {
                  const count = allStations.filter((s) => s.category === cat).length;
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setIsCategoryExpanded(false);
                      }}
                      className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      <span className="text-[10px] opacity-75 ml-1">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Station List Area */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3.5 sm:mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white">
              {activeCategory === 'all'
                ? getTranslation(settings.language, 'allCategories')
                : activeCategory === 'favorites'
                ? getTranslation(settings.language, 'favorites')
                : activeCategory === 'recent'
                ? getTranslation(settings.language, 'recentHistory')
                : activeCategory}
            </h2>
            <span className="text-xs text-slate-400 font-normal">
              ({filteredStations.length})
            </span>
          </div>

          {/* Quick Action for mobile Add Station */}
          <button
            onClick={() => {
              setStationToEdit(null);
              setIsStationModalOpen(true);
            }}
            className="md:hidden min-h-[36px] flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 active:scale-95"
            aria-label="방송국 추가"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>추가</span>
          </button>
        </div>

        {/* Empty States */}
        {filteredStations.length === 0 ? (
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center p-4 sm:p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 sm:mb-4">
              <Radio className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {searchQuery
                ? getTranslation(settings.language, 'noStationsFound')
                : activeCategory === 'favorites'
                ? getTranslation(settings.language, 'noFavoritesYet')
                : activeCategory === 'recent'
                ? getTranslation(settings.language, 'noRecentYet')
                : getTranslation(settings.language, 'noStationsFound')}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium mt-1 inline-block"
                >
                  검색어 초기화
                </button>
              ) : activeCategory === 'favorites' ? (
                '방송국 카드의 하트 아이콘을 눌러 나만의 즐겨찾기 목록을 만들어보세요.'
              ) : (
                '상단 "+ 방송국 추가" 버튼으로 나만의 스트림 채널을 등록할 수 있습니다.'
              )}
            </p>
          </div>
        ) : (
          /* Cards Grid or List: Fully Responsive for 320px, 360px, 768px, 1024px, 1440px */
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5'
                : 'space-y-2 max-w-4xl'
            }
          >
            {filteredStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                isFavorite={favorites.includes(station.id)}
                onToggleFavorite={handleToggleFavorite}
                onEditStation={(stn) => {
                  setStationToEdit(stn);
                  setIsStationModalOpen(true);
                }}
                onDeleteStation={handleDeleteStation}
                playlist={filteredStations}
                viewMode={viewMode}
                lang={settings.language}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Sticky Mini Player */}
      <MiniPlayer lang={settings.language} />

      {/* Expandable Full Player Overlay */}
      <FullPlayer
        isFavorite={currentStation ? favorites.includes(currentStation.id) : false}
        onToggleFavorite={() => {
          if (currentStation) handleToggleFavorite(currentStation.id);
        }}
        lang={settings.language}
      />

      {/* Modals */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={displayCategories}
        onSaveOrder={handleSaveCategoryOrder}
        lang={settings.language}
      />

      <StationModal
        isOpen={isStationModalOpen}
        onClose={() => {
          setIsStationModalOpen(false);
          setStationToEdit(null);
        }}
        stationToEdit={stationToEdit}
        categories={displayCategories}
        onSave={handleSaveStation}
        lang={settings.language}
      />

      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        stations={allStations}
        currentCategory={activeCategory === 'all' ? '서울' : activeCategory}
        onImportStations={(imported) => {
          setCustomStations((prev) => [...prev, ...imported]);
          imported.forEach((stn) => saveCustomStation(stn));
        }}
        onRestoreComplete={refreshData}
        lang={settings.language}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        lang={settings.language}
        onHistoryCleared={() => setHistoryStationIds([])}
      />
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <RadioHubMain />
    </PlayerProvider>
  );
}
