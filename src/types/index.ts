export interface Station {
  id: string;
  name: string;
  url: string;
  category: string;
  isCustom?: boolean;
  description?: string;
  bitrate?: string;
  codec?: string;
  createdAt?: number;
}

export type PlayState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface PlaybackHistoryItem {
  stationId: string;
  timestamp: number;
  station: Station;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type Language = 'ko' | 'en' | 'ja' | 'zh-CN' | 'zh-TW';

export type CastState = 'unavailable' | 'available' | 'connecting' | 'connected' | 'error';

export interface AppSettings {
  theme: ThemeMode;
  language: Language;
  volume: number;
  isMuted: boolean;
  autoReconnect: boolean;
  sleepTimerMinutes: number | null;
  preferredView: 'grid' | 'list';
}

export interface BackupData {
  version: number;
  exportedAt: string;
  customStations: Station[];
  favorites: string[];
  history: PlaybackHistoryItem[];
  categoryOrder: string[];
  settings: Partial<AppSettings>;
}
