import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Trash2, ExternalLink, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { Avatar } from '../../types';
import { sounds } from '../../services/audio';

export const AvatarLibraryView: React.FC = () => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvatars = async () => {
    setLoading(true);
    try {
      const data = await api.getAvatars();
      setAvatars(data);
    } catch (err: any) {
      console.error('Failed to load avatars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvatars();
  }, []);

  const handleAddAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim()) {
      setError('Vui lòng điền tên avatar và URL hình ảnh.');
      return;
    }

    setSubmitting(true);
    setError(null);
    sounds.playChoiceSelected();

    try {
      await api.createAvatar({
        name: name.trim(),
        imageUrl: imageUrl.trim(),
      });
      setName('');
      setImageUrl('');
      setShowAddModal(false);
      await fetchAvatars();
    } catch (err: any) {
      setError(err.message || 'Không thể thêm avatar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAvatar = async (id: string, avatarName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa avatar "${avatarName}"?`)) return;
    sounds.playClick();
    try {
      await api.deleteAvatar(id);
      setAvatars((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert('Không thể xóa avatar: ' + (err.message || ''));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 sm:p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <span>Thư Viện Avatar Hệ Thống (Avatar Library)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý các chân dung nhân vật đại diện cho người chơi lựa chọn khi tạo tài khoản hoặc đổi profile.
          </p>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-950/50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Avatar Mới</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Đang tải danh sách avatar...</span>
        </div>
      ) : avatars.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 text-xs space-y-2">
          <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <p>Chưa có avatar nào trong hệ thống.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-indigo-400 hover:underline font-semibold"
          >
            Thêm avatar đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {avatars.map((avatar) => (
            <div
              key={avatar.id}
              className="group relative rounded-2xl bg-slate-900 border border-slate-800 p-4 hover:border-indigo-500/50 transition-all flex flex-col items-center text-center shadow-lg"
            >
              {/* Avatar Image */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 mb-3 group-hover:scale-105 transition-transform duration-300 shadow-md">
                <img
                  src={avatar.imageUrl}
                  alt={avatar.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <p className="text-xs font-bold text-white truncate w-full" title={avatar.name}>
                {avatar.name}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {avatar.isDefault ? 'Mặc định hệ thống' : 'Tùy chỉnh'}
              </p>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <a
                  href={avatar.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Xem ảnh gốc"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleDeleteAvatar(avatar.id, avatar.name)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Xóa avatar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Avatar Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Thêm Avatar Nhân Vật Mới</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tạo avatar mới để người chơi có thêm nhiều lựa chọn phong phú.
              </p>
            </div>

            <form onSubmit={handleAddAvatar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên nhân vật / Avatar:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Chiến Binh Rồng, Pháp Sư Lửa..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder:text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Đường dẫn URL ảnh chân dung (Hình vuông / Portrait):
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder:text-slate-600 outline-none font-mono text-[11px]"
                />
              </div>

              {/* Preview */}
              {imageUrl.trim() && (
                <div className="flex items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-inner">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-rose-400">{error}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-950/50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : 'Thêm Avatar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
