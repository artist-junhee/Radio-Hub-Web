import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';
import { getTranslation } from '../i18n';

interface PWAInstallButtonProps {
  lang: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
        title={getTranslation(lang, 'pwaInstallTitle')}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{getTranslation(lang, 'pwaInstall')}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>iOS {getTranslation(lang, 'pwaInstall')}</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  RH
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base">RADIO HUB</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">iOS 홈 화면 추가 안내</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">1.</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Safari 하단 또는 상단 툴바의</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-medium text-slate-900 dark:text-white">
                      <Share2 className="w-3 h-3" /> 공유
                    </span>
                    <span>버튼을 탭합니다.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">2.</span>
                  <div>
                    메뉴를 아래로 스크롤하여 <strong className="text-slate-900 dark:text-white">[홈 화면에 추가]</strong>를 선택합니다.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">3.</span>
                  <div>
                    우측 상단 <strong className="text-slate-900 dark:text-white">[추가]</strong>를 누르면 설치가 완료됩니다.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-medium text-xs text-white shadow-sm transition"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
