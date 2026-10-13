import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileText,
  Database,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Station, Language, BackupData } from '../types';
import { getTranslation } from '../i18n';
import { parseM3UContent, generateM3U, downloadTextFile } from '../utils/m3u';
import { exportAllData, importAllData } from '../utils/db';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  currentCategory: string;
  onImportStations: (imported: Station[]) => void;
  onRestoreComplete: () => void;
  lang: Language;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  stations,
  currentCategory,
  onImportStations,
  onRestoreComplete,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'m3u' | 'json'>('m3u');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<BackupData | null>(null);

  const m3uFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle M3U Export
  const handleExportM3U = (all: boolean) => {
    const listToExport = all
      ? stations
      : stations.filter((s) => s.category === currentCategory);
    const content = generateM3U(listToExport, `RADIO HUB ${all ? '전체' : currentCategory}`);
    const filename = all ? 'radio_hub_all_stations.m3u' : `radio_hub_${currentCategory}.m3u`;
    downloadTextFile(content, filename);
    setStatusMessage({ type: 'success', text: `${listToExport.length}개 방송국 M3U 파일이 다운로드되었습니다.` });
  };

  // Handle M3U Import
  const handleM3UFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseM3UContent(text);
        if (parsed.length === 0) {
          setStatusMessage({ type: 'error', text: '재생 가능한 방송국을 찾지 못했습니다.' });
          return;
        }

        // Convert to Station objects
        const existingUrls = new Set(stations.map((s) => s.url.toLowerCase()));
        let dupCount = 0;

        const newStations: Station[] = parsed.map((item, idx) => {
          if (existingUrls.has(item.url.toLowerCase())) {
            dupCount++;
          }
          return {
            id: `custom-m3u-${Date.now()}-${idx}`,
            name: item.name,
            url: item.url,
            category: item.category || '가져온 방송',
            isCustom: true,
            createdAt: Date.now(),
          };
        });

        onImportStations(newStations);
        setStatusMessage({
          type: 'success',
          text: `${newStations.length}개 방송국을 가져왔습니다.${
            dupCount > 0 ? ` (${dupCount}개 기존 URL 중복 포함)` : ''
          }`,
        });
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'M3U 파일을 파싱하는 중 오류가 발생했습니다.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle JSON Export
  const handleExportJSON = async () => {
    try {
      const data = await exportAllData();
      const content = JSON.stringify(data, null, 2);
      downloadTextFile(content, `radio_hub_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
      setStatusMessage({ type: 'success', text: '전체 데이터 백업 파일이 저장되었습니다.' });
    } catch {
      setStatusMessage({ type: 'error', text: '백업 생성에 실패했습니다.' });
    }
  };

  // Handle JSON Restore Select
  const handleJSONFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as BackupData;
        if (!data || !data.version) {
          setStatusMessage({ type: 'error', text: '유효한 RADIO HUB 백업 파일이 아닙니다.' });
          return;
        }
        setPendingRestoreData(data);
        setIsConfirmingRestore(true);
      } catch {
        setStatusMessage({ type: 'error', text: '백업 파일 형식이 올바르지 않습니다.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Confirm restore
  const handleExecuteRestore = async () => {
    if (!pendingRestoreData) return;
    try {
      await importAllData(pendingRestoreData);
      setIsConfirmingRestore(false);
      setPendingRestoreData(null);
      setStatusMessage({ type: 'success', text: '데이터가 성공적으로 복원되었습니다!' });
      onRestoreComplete();
    } catch {
      setStatusMessage({ type: 'error', text: '데이터 복원에 실패했습니다.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="w-full max-w-md max-h-[85dvh] overflow-y-auto modal-scroll rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center absolute top-3.5 right-3.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-90"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          {getTranslation(lang, 'backupAndRestore')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          M3U 플레이리스트 가져오기/내보내기 및 데이터 전체 백업
        </p>

        {/* Segmented Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5">
          <button
            onClick={() => setActiveTab('m3u')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'm3u'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>M3U / M3U8</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'json'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>JSON 전체 백업</span>
          </button>
        </div>

        {/* Status Toast Notification */}
        {statusMessage && (
          <div
            className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: M3U Panel */}
        {activeTab === 'm3u' && (
          <div className="space-y-4">
            {/* Import */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center gap-2 font-medium text-xs text-slate-800 dark:text-slate-200">
                <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{getTranslation(lang, 'importM3U')}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                외부 .m3u 또는 .m3u8 파일의 라디오 채널을 RADIO HUB에 추가합니다.
              </p>
              <input
                ref={m3uFileInputRef}
                type="file"
                accept=".m3u,.m3u8,text/plain"
                onChange={handleM3UFileSelect}
                className="hidden"
              />
              <button
                onClick={() => m3uFileInputRef.current?.click()}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition"
              >
                M3U / M3U8 파일 선택
              </button>
            </div>

            {/* Export */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center gap-2 font-medium text-xs text-slate-800 dark:text-slate-200">
                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{getTranslation(lang, 'exportM3U')}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                현재 등록된 방송국 목록을 M3U 플레이리스트 파일로 내보냅니다.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleExportM3U(true)}
                  className="py-2 px-3 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
                >
                  {getTranslation(lang, 'exportAll')} ({stations.length})
                </button>
                <button
                  onClick={() => handleExportM3U(false)}
                  className="py-2 px-3 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition truncate"
                >
                  [{currentCategory}]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: JSON Backup & Restore Panel */}
        {activeTab === 'json' && (
          <div className="space-y-4">
            {isConfirmingRestore ? (
              <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>백업 복원 확인</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {getTranslation(lang, 'confirmRestore')}
                </p>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 p-2.5 rounded-lg">
                  <div>· 사용자 방송국: {pendingRestoreData?.customStations?.length || 0}개</div>
                  <div>· 즐겨찾기: {pendingRestoreData?.favorites?.length || 0}개</div>
                  <div>· 카테고리 순서: {pendingRestoreData?.categoryOrder?.length || 0}개</div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsConfirmingRestore(false);
                      setPendingRestoreData(null);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:bg-black/5"
                  >
                    {getTranslation(lang, 'cancel')}
                  </button>
                  <button
                    onClick={handleExecuteRestore}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  >
                    복원 실행
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center gap-2 font-medium text-xs text-slate-800 dark:text-slate-200">
                    <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{getTranslation(lang, 'exportBackup')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    즐겨찾기, 최근 재생, 추가한 방송국, 카테고리 정렬 순서 및 설정을 파일로 다운로드합니다.
                  </p>
                  <button
                    onClick={handleExportJSON}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                  >
                    JSON 백업 파일 다운로드
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center gap-2 font-medium text-xs text-slate-800 dark:text-slate-200">
                    <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{getTranslation(lang, 'importBackup')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    이전에 저장한 JSON 백업 파일을 업로드하여 데이터를 원상 복구합니다.
                  </p>
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleJSONFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
                  >
                    JSON 백업 파일 선택
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            {getTranslation(lang, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
};
