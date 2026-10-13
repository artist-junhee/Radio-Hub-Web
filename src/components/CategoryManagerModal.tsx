import React, { useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, RotateCcw, Check, X } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import initialCategories from '../data/initialCategories.json';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSaveOrder: (newOrder: string[]) => void;
  lang: Language;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveOrder,
  lang,
}) => {
  const [order, setOrder] = useState<string[]>(categories);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setOrder(next);
  };

  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === idx) return;
    moveItem(draggedIndex, idx);
    setDraggedIndex(idx);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleReset = () => {
    // Preserve any custom categories that were added, appending them after initialCategories
    const defaults = [...initialCategories];
    const customCats = order.filter((c) => !defaults.includes(c));
    const merged = [...defaults, ...customCats];
    setOrder(merged);
  };

  const handleSave = () => {
    onSaveOrder(order);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="카테고리 순서 편집"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85dvh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {getTranslation(lang, 'reorderCategories')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {getTranslation(lang, 'dragToReorder')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of categories with touch friendly controls */}
        <div className="flex-1 overflow-y-auto modal-scroll p-3 sm:p-4 space-y-2">
          {order.map((cat, idx) => {
            const isDragging = draggedIndex === idx;
            return (
              <div
                key={cat}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 opacity-70 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div
                    className="w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
                    title="드래그하여 이동"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 w-5 shrink-0">{idx + 1}</span>
                  <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {cat}
                  </span>
                </div>

                {/* Mobile Friendly Up/Down Touch Buttons (≥ 40-44px) */}
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <button
                    onClick={() => moveItem(idx, idx - 1)}
                    disabled={idx === 0}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-25 disabled:pointer-events-none transition active:scale-90"
                    title="위로 이동"
                    aria-label={`${cat} 위로 이동`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveItem(idx, idx + 1)}
                    disabled={idx === order.length - 1}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-25 disabled:pointer-events-none transition active:scale-90"
                    title="아래로 이동"
                    aria-label={`${cat} 아래로 이동`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl shrink-0">
          <button
            onClick={handleReset}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{getTranslation(lang, 'resetDefaultOrder')}</span>
            <span className="sm:hidden">초기화</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="min-h-[44px] px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-95"
            >
              {getTranslation(lang, 'cancel')}
            </button>
            <button
              onClick={handleSave}
              className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{getTranslation(lang, 'saveOrder')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
