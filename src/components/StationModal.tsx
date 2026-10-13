import React, { useState, useEffect } from 'react';
import { X, Radio, AlertCircle } from 'lucide-react';
import { Station, Language } from '../types';
import { getTranslation } from '../i18n';

interface StationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationToEdit: Station | null;
  categories: string[];
  onSave: (station: Station) => void;
  lang: Language;
}

export const StationModal: React.FC<StationModalProps> = ({
  isOpen,
  onClose,
  stationToEdit,
  categories,
  onSave,
  lang,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(categories[0] || '서울');
  const [customCatInput, setCustomCatInput] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (stationToEdit) {
      setName(stationToEdit.name);
      setUrl(stationToEdit.url);
      setDescription(stationToEdit.description || '');
      if (categories.includes(stationToEdit.category)) {
        setCategory(stationToEdit.category);
        setIsCustomCategory(false);
      } else {
        setIsCustomCategory(true);
        setCustomCatInput(stationToEdit.category);
      }
    } else {
      setName('');
      setUrl('');
      setDescription('');
      setCategory(categories[0] || '서울');
      setCustomCatInput('');
      setIsCustomCategory(false);
    }
    setErrorMsg('');
  }, [stationToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('방송국 이름을 입력해주세요.');
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setErrorMsg('올바른 스트림 URL(http:// 또는 https://)을 입력해주세요.');
      return;
    }

    const finalCategory = isCustomCategory ? customCatInput.trim() || '기타' : category;

    const newStation: Station = {
      id: stationToEdit ? stationToEdit.id : `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      url: trimmedUrl,
      category: finalCategory,
      description: description.trim() || undefined,
      isCustom: true,
      createdAt: stationToEdit?.createdAt || Date.now(),
    };

    onSave(newStation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto modal-scroll rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center absolute top-3.5 right-3.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-90"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 sm:mb-5 pr-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {stationToEdit ? getTranslation(lang, 'editStation') : getTranslation(lang, 'addStation')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stationToEdit ? '방송국 정보를 수정합니다.' : '새로운 스트림 방송국을 등록합니다.'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {getTranslation(lang, 'stationName')} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: KBS 1라디오, 클래식 FM..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {getTranslation(lang, 'streamUrl')} *
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://... 또는 http://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs sm:text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                {getTranslation(lang, 'category')} *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {isCustomCategory ? '기존 카테고리 선택' : '+ 직접 입력'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                required
                value={customCatInput}
                onChange={(e) => setCustomCatInput(e.target.value)}
                placeholder="카테고리명 직접 입력 (예: 재즈, 팝, 팟캐스트)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {getTranslation(lang, 'description')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="간단한 소개나 주파수 (선택)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {getTranslation(lang, 'cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition active:scale-95"
            >
              {getTranslation(lang, 'save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
