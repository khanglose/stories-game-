import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Tag, ExternalLink, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { ImageAsset, ImageCollectionId } from '../../types';
import { sounds } from '../../services/audio';

const COLLECTIONS: ImageCollectionId[] = [
  'Backgrounds',
  'Characters',
  'Locations',
  'Objects',
  'Story Images',
  'Other',
];

export const ImageLibraryView: React.FC = () => {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<ImageCollectionId | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [collectionId, setCollectionId] = useState<ImageCollectionId>('Backgrounds');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await api.getImageAssets(selectedCollection === 'ALL' ? undefined : selectedCollection);
      setImages(data);
    } catch (err: any) {
      console.error('Failed to load image library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [selectedCollection]);

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setError('Vui lòng nhập tên ảnh và đường dẫn URL.');
      return;
    }

    setSubmitting(true);
    setError(null);
    sounds.playChoiceSelected();

    try {
      await api.createImageAsset({
        name: name.trim(),
        url: url.trim(),
        collectionId,
      });
      setName('');
      setUrl('');
      setShowAddModal(false);
      await fetchImages();
    } catch (err: any) {
      setError(err.message || 'Không thể thêm hình ảnh.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (id: string, imgName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa ảnh "${imgName}" khỏi thư viện?`)) return;
    sounds.playClick();
    try {
      await api.deleteImageAsset(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err: any) {
      alert('Không thể xóa ảnh: ' + (err.message || ''));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 sm:p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            <span>Thư Viện Hình Ảnh (Image Library)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý tài nguyên hình ảnh dùng cho Bối cảnh, Nhân vật, Địa danh và Đạo cụ trong các câu chuyện.
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
          <span>Thêm Ảnh Mới</span>
        </button>
      </div>

      {/* Collection filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => {
            sounds.playClick();
            setSelectedCollection('ALL');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCollection === 'ALL'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Tất cả bộ sưu tập ({images.length})
        </button>
        {COLLECTIONS.map((col) => (
          <button
            key={col}
            onClick={() => {
              sounds.playClick();
              setSelectedCollection(col);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCollection === col
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {col}
          </button>
        ))}
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Đang tải thư viện ảnh...</span>
        </div>
      ) : images.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 text-xs space-y-2">
          <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <p>Chưa có hình ảnh nào trong bộ sưu tập này.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-indigo-400 hover:underline font-semibold"
          >
            Thêm ảnh đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((asset) => (
            <div
              key={asset.id}
              className="group relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-indigo-500/50 transition-all flex flex-col shadow-lg"
            >
              {/* Preview Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={asset.url}
                  alt={asset.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/50 text-[10px] font-medium text-slate-300">
                  {asset.collectionId}
                </span>
              </div>

              {/* Asset Info & Actions */}
              <div className="p-3 flex items-center justify-between gap-2 flex-1">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate" title={asset.name}>
                    {asset.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {new Date(asset.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Mở ảnh gốc"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDeleteImage(asset.id, asset.name)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Image Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Thêm Ảnh Vào Thư Viện</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Đăng ký hình ảnh chất lượng cao để sử dụng xuyên suốt các tác phẩm.
              </p>
            </div>

            <form onSubmit={handleAddImage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên / Tiêu đề ảnh:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Rừng Sương Mù Về Đêm"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder:text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bộ sưu tập (Collection):
                </label>
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value as ImageCollectionId)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white outline-none cursor-pointer"
                >
                  {COLLECTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Đường dẫn URL ảnh (Unsplash / CDN / Direct link):
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder:text-slate-600 outline-none font-mono text-[11px]"
                />
              </div>

              {/* Preview if URL entered */}
              {url.trim() && (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                  <img
                    src={url}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] text-indigo-300 border border-indigo-900 font-medium">
                    Xem trước
                  </span>
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
                  {submitting ? 'Đang lưu...' : 'Thêm Vào Thư Viện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
