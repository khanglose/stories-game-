import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Upload, X, Link, Check, RefreshCw } from 'lucide-react';
import { processDeviceImage } from '../utils/imageUtils';
import { sounds } from '../services/audio';

interface DeviceImagePickerProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'video' | 'square' | 'avatar' | 'banner';
  placeholder?: string;
}

export const DeviceImagePicker: React.FC<DeviceImagePickerProps> = ({
  value = '',
  onChange,
  label = 'Hình Ảnh',
  helperText = 'Chọn ảnh từ bộ sưu tập điện thoại hoặc máy tính',
  aspectRatio = 'video',
  placeholder = 'Chưa có ảnh nào được chọn',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const maxDim = aspectRatio === 'avatar' ? 400 : 1280;
      const dataUrl = await processDeviceImage(file, maxDim, 0.85);
      onChange(dataUrl);
      sounds.playChoiceSelected();
    } catch (err: any) {
      setError(err.message || 'Không thể đọc ảnh từ thiết bị.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      onChange(urlDraft.trim());
      setShowUrlInput(false);
      setUrlDraft('');
      sounds.playChoiceSelected();
    }
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square max-w-[140px]'
      : aspectRatio === 'avatar'
      ? 'aspect-square w-20 sm:w-24 rounded-full'
      : aspectRatio === 'banner'
      ? 'aspect-[21/9] w-full'
      : 'aspect-video w-full max-w-sm';

  return (
    <div className="space-y-2">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>{label}</span>
          </label>
          <span className="text-[11px] text-slate-400">{helperText}</span>
        </div>
      )}

      {/* Image Preview & Controls */}
      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
        {value ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className={`relative overflow-hidden border border-slate-700 bg-slate-900 ${aspectRatio === 'avatar' ? 'rounded-full' : 'rounded-xl'} ${aspectClass} shrink-0 shadow-md`}>
              <img
                src={value}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {loading && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Ảnh đã sẵn sàng (Bấm nút Lưu là lưu luôn)</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Đổi ảnh từ bộ sưu tập</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    sounds.playClick();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-700/60 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Gỡ ảnh</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-850 border border-indigo-500/40 hover:border-indigo-400 text-indigo-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Đang tải ảnh từ thiết bị...</span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span>Chọn ảnh từ bộ sưu tập điện thoại</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowUrlInput(!showUrlInput);
                sounds.playClick();
              }}
              className="px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Dán đường dẫn ảnh URL"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Dán URL</span>
            </button>
          </div>
        )}

        {/* Optional URL Input */}
        {showUrlInput && (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 animate-in fade-in">
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
            >
              Áp Dụng
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="p-1.5 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {error && (
          <p className="text-[11px] text-rose-400 font-medium">{error}</p>
        )}
      </div>
    </div>
  );
};
