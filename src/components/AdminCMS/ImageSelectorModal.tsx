import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, X, Check, Search, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { ImageAsset, ImageCollectionId } from '../../types';
import { sounds } from '../../services/audio';

interface ImageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  initialUrl?: string;
}

const COLLECTIONS: (ImageCollectionId | 'ALL')[] = [
  'ALL',
  'Backgrounds',
  'Characters',
  'Locations',
  'Objects',
  'Story Images',
  'Other',
];

export const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Chọn Hình Ảnh Từ Thư Viện',
  initialUrl = '',
}) => {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ImageCollectionId | 'ALL'>('ALL');
  const [customUrl, setCustomUrl] = useState(initialUrl);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCustomUrl(initialUrl);
      loadImages();
    }
  }, [isOpen]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await api.getImageAssets();
      setImages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = images.filter((img) => {
    const matchCol = selectedCollection === 'ALL' || img.collectionId === selectedCollection;
    const matchSearch = !search.trim() || img.name.toLowerCase().includes(search.toLowerCase());
    return matchCol && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Custom URL Input Bar */}
        <div className="py-3 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Hoặc dán trực tiếp đường dẫn URL ảnh bất kỳ..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none font-mono"
          />
          {customUrl.trim() && (
            <button
              onClick={() => {
                sounds.playChoiceSelected();
                onSelect(customUrl.trim());
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
            >
              Áp Dụng URL Này
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {COLLECTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCollection(c)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCollection === c
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {c === 'ALL' ? 'Tất cả' : c}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none w-full sm:w-44"
            />
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 scrollbar-thin">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Đang tải ảnh...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Không tìm thấy ảnh nào phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    sounds.playChoiceSelected();
                    onSelect(img.url);
                    onClose();
                  }}
                  className="group relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden hover:border-indigo-500 text-left transition-all p-1.5 flex flex-col cursor-pointer"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 relative">
                    <img
                      src={img.url}
                      alt={img.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] text-slate-300">
                      {img.collectionId}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-white truncate mt-1.5 px-1">{img.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
