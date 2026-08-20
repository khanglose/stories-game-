import React, { useEffect, useState, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  User, 
  Image as ImageIcon, 
  UploadCloud, 
  RefreshCw,
  Camera,
  Smartphone,
  Upload
} from 'lucide-react';
import { api } from '../services/api';
import { Avatar, ImageAsset } from '../types';
import { sounds } from '../services/audio';
import { useAuth } from '../context/AuthContext';
import { processDeviceImage } from '../utils/imageUtils';

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSuccess?: (newAvatarUrl: string) => void;
  title?: string;
}

export const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectSuccess,
  title = 'Chọn Ảnh Đại Diện',
}) => {
  const { user, avatarUrl, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [characterImages, setCharacterImages] = useState<ImageAsset[]>([]);
  const [tab, setTab] = useState<'device' | 'avatars' | 'custom'>('device');
  const [selectedUrl, setSelectedUrl] = useState<string>(avatarUrl || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');
  const [customInputUrl, setCustomInputUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(avatarUrl || '');
      loadCollections();
    }
  }, [isOpen, avatarUrl]);

  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const [avatarList, imageList] = await Promise.all([
        api.getAvatars().catch(() => []),
        api.getImageAssets('Characters').catch(() => []),
      ]);
      setAvatars(avatarList);
      setCharacterImages(imageList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const dataUrl = await processDeviceImage(file, 400, 0.88);
      setSelectedUrl(dataUrl);
      setSelectedAvatarId('');
      sounds.playChoiceSelected();
    } catch (err: any) {
      setError(err.message || 'Không thể đọc ảnh từ thiết bị.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSaveAvatar = async () => {
    if (!selectedUrl.trim()) {
      setError('Vui lòng chọn một ảnh đại diện từ bộ sưu tập điện thoại.');
      return;
    }

    setSaving(true);
    setError(null);
    sounds.playChoiceSelected();

    try {
      await updateProfile({
        avatarId: selectedAvatarId || undefined,
        avatarUrl: selectedUrl,
      });

      if (onSelectSuccess) {
        onSelectSuccess(selectedUrl);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật ảnh đại diện.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* Hidden native file input for mobile photo library / camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleDeviceFileSelect}
      />

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Chọn ảnh trực tiếp từ bộ sưu tập điện thoại hoặc thư viện mẫu</p>
            </div>
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

        {/* Selected Preview Bar */}
        <div className="py-4 border-b border-slate-800 flex items-center gap-4 bg-slate-950/50 rounded-2xl px-4 my-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 ring-4 ring-indigo-500/20 bg-slate-950 shrink-0">
              <img
                src={selectedUrl || avatarUrl}
                alt="Selected Avatar Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-slate-950">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Ảnh Đã Chọn (Bấm nút Lưu là lưu luôn)</span>
            <h4 className="text-sm font-bold text-white truncate">
              {user?.playerName || user?.name || 'Người Chơi'}
            </h4>
            <p className="text-xs text-slate-400 truncate">
              {user?.role === 'ADMIN' ? '👑 Quản Trị Viên (ADMIN)' : '🎮 Người Chơi'}
            </p>
          </div>

          <button
            id="confirm-avatar-btn"
            onClick={handleSaveAvatar}
            disabled={saving || !selectedUrl}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Avatar Luôn</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => {
              sounds.playClick();
              setTab('device');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'device'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Bộ Sưu Tập Điện Thoại</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setTab('avatars');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'avatars'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Avatar Mẫu ({avatars.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setTab('custom');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              tab === 'custom'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Dán URL</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 scrollbar-thin">
          {tab === 'device' ? (
            <div className="space-y-4 text-center py-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 rounded-3xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-lg">
                  {uploading ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {uploading ? 'Đang đọc ảnh từ điện thoại...' : 'Nhấn vào đây để chọn ảnh từ Bộ Sưu Tập Điện Thoại'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Hỗ trợ tất cả định dạng ảnh từ điện thoại (Camera, Thư viện ảnh, Tệp tin)
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md pointer-events-none"
                >
                  <Camera className="w-4 h-4" />
                  <span>Mở Bộ Sưu Tập Ảnh / Máy Ảnh</span>
                </button>
              </div>
            </div>
          ) : tab === 'avatars' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {avatars.map((av) => {
                const isSelected = selectedUrl === av.imageUrl;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedUrl(av.imageUrl);
                      setSelectedAvatarId(av.id);
                    }}
                    className={`group relative rounded-2xl overflow-hidden border-2 p-1 text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/40 scale-105'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:scale-[1.02]'
                    }`}
                  >
                    <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-900 relative">
                      <img
                        src={av.imageUrl}
                        alt={av.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-slate-200 mt-1.5 truncate px-1">
                      {av.name}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dán đường dẫn ảnh đại diện tùy ý (URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customInputUrl.trim()) {
                        setSelectedUrl(customInputUrl.trim());
                        setSelectedAvatarId('');
                        sounds.playChoiceSelected();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    Xem Thử
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 mb-2 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 text-center font-medium">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {user?.role === 'ADMIN' ? '👑 Quản Trị Viên StoryVerse' : '👤 Người Chơi'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveAvatar}
              disabled={saving || !selectedUrl}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Ngay'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
