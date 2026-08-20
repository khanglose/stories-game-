import React from 'react';
import { X, Search, Sparkles, Package } from 'lucide-react';
import { sounds } from '../../services/audio';

interface InspectItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemImage?: string;
  itemDescription?: string;
}

export const InspectItemModal: React.FC<InspectItemModalProps> = ({
  isOpen,
  onClose,
  itemName,
  itemImage,
  itemDescription,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
              Manh Mối / Vật Phẩm Thu Thập
            </span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          {itemImage ? (
            <div className="w-full max-h-64 rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-slate-950 shadow-inner flex items-center justify-center">
              <img
                src={itemImage}
                alt={itemName}
                referrerPolicy="no-referrer"
                className="max-h-64 w-full object-contain p-2 hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Search className="w-10 h-10" />
            </div>
          )}

          <h3 className="text-lg sm:text-xl font-black text-white">
            {itemName}
          </h3>

          {itemDescription ? (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-serif bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-left">
              {itemDescription}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Bạn đã kiểm tra kĩ vật phẩm này và ghi nhớ chi tiết vào ký ức.
            </p>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-lg shadow-amber-950/50"
          >
            Cất Vào Túi Đồ
          </button>
        </div>
      </div>
    </div>
  );
};
