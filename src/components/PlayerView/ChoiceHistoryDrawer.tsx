import React from 'react';
import { X, GitBranch, ArrowDown, History, Sparkles } from 'lucide-react';
import { ChoiceStep } from '../../types';
import { sounds } from '../../services/audio';

interface ChoiceHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  choicePath: ChoiceStep[];
  storyTitle: string;
}

export const ChoiceHistoryDrawer: React.FC<ChoiceHistoryDrawerProps> = ({
  isOpen,
  onClose,
  choicePath,
  storyTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Lịch Sử Nhánh Quyết Định</h3>
              <p className="text-xs text-slate-400 line-clamp-1">{storyTitle}</p>
            </div>
          </div>

          <button
            id="close-history-drawer-btn"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {choicePath.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <GitBranch className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
              <span>Bạn đang ở khởi đầu câu chuyện. Chưa có lựa chọn nào được thực hiện.</span>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-indigo-600/40 space-y-6">
              {choicePath.map((step, idx) => (
                <div key={idx} className="relative group">
                  {/* Step node dot */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-slate-900 shadow-md shadow-indigo-900/50" />

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-semibold text-indigo-400">Bước #{idx + 1}</span>
                      <span>{new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>

                    <p className="text-xs font-semibold text-slate-300">
                      Tình huống: <span className="text-white">{step.nodeTitle}</span>
                    </p>

                    <div className="mt-2 p-2 rounded-lg bg-indigo-950/40 border border-indigo-900/60 text-xs text-indigo-200 font-medium flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Đã chọn: "{step.optionText}"</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-center text-xs text-slate-500">
          Tổng số quyết định đã đưa ra: <span className="font-bold text-indigo-400">{choicePath.length}</span>
        </div>
      </div>
    </div>
  );
};
