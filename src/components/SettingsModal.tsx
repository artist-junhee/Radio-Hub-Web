import React from 'react';
import {
  X,
  Moon,
  Sun,
  Monitor,
  Globe,
  Trash2,
  Info,
  Keyboard,
  ShieldCheck,
} from 'lucide-react';
import { Language, ThemeMode, AppSettings } from '../types';
import { getTranslation } from '../i18n';
import { clearHistory } from '../utils/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  lang: Language;
  onHistoryCleared: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  lang,
  onHistoryCleared,
}) => {
  if (!isOpen) return null;

  const handleClearHistory = async () => {
    if (confirm('최근 재생 목록을 모두 삭제하시겠습니까?')) {
      await clearHistory();
      onHistoryCleared();
    }
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'ko', label: '한국어 (Korean)' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語 (Japanese)' },
    { code: 'zh-CN', label: '简体中文 (Simplified Chinese)' },
    { code: 'zh-TW', label: '繁體中文 (Traditional Chinese)' },
  ];

  const themes: { mode: ThemeMode; label: string; icon: any }[] = [
    { mode: 'system', label: getTranslation(lang, 'themeSystem'), icon: Monitor },
    { mode: 'light', label: getTranslation(lang, 'themeLight'), icon: Sun },
    { mode: 'dark', label: getTranslation(lang, 'themeDark'), icon: Moon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 relative max-h-[85dvh] overflow-y-auto modal-scroll animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center absolute top-3.5 right-3.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-90"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          {getTranslation(lang, 'settings')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          RADIO HUB 환경 설정 및 앱 정보
        </p>

        <div className="space-y-6 text-xs">
          {/* Theme Settings */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-2">
              {getTranslation(lang, 'theme')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => onUpdateSettings({ theme: mode })}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                    settings.theme === mode
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Settings */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{getTranslation(lang, 'language')}</span>
            </label>
            <select
              value={settings.language}
              onChange={(e) => onUpdateSettings({ language: e.target.value as Language })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Auto Reconnect Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">연결 오류 시 자동 재시도</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                네트워크 지연 또는 일시적 오류 시 최대 3회 재연결을 시도합니다.
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoReconnect: !settings.autoReconnect })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                settings.autoReconnect ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  settings.autoReconnect ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Clear History */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">재생 기록 초기화</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                기기에 저장된 최근 청취 방송 내역을 비웁니다.
              </div>
            </div>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{getTranslation(lang, 'clearHistory')}</span>
            </button>
          </div>

          {/* Keyboard Shortcuts Guide */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <Keyboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>키보드 단축키 가이드</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
              <div className="flex items-center justify-between">
                <span>재생 / 일시정지</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-200">Space</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>음소거 / 해제</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-200">M</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>이전 방송국</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-200">←</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>다음 방송국</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-200">→</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>볼륨 올리기</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-200">↑</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>볼륨 내리기</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-200">↓</kbd>
              </div>
            </div>
          </div>

          {/* Stream Compatibility Notice */}
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-950 dark:text-indigo-200">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{getTranslation(lang, 'streamNoticeTitle')}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {getTranslation(lang, 'streamNoticeDesc')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition active:scale-95"
          >
            {getTranslation(lang, 'confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
