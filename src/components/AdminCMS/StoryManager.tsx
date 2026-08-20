import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Send, 
  Eye, 
  Trash2, 
  Edit, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  GitBranch,
  Trophy,
  RotateCcw,
  Smartphone
} from 'lucide-react';
import { Story, StoryGenre, StoryStatus } from '../../types';
import { api } from '../../services/api';
import { sounds } from '../../services/audio';
import { DeviceImagePicker } from '../DeviceImagePicker';

interface StoryManagerProps {
  onSelectStoryForEdit: (storyId: string) => void;
}

const GENRES: StoryGenre[] = [
  'Bí Ẩn / Kinh Dị',
  'Khoa Học Viễn Tưởng',
  'Kỳ Ảo / Phiêu Lưu',
  'Trinh Thám / Hình Sự',
  'Cyberpunk',
  'Đời Thường / Lãng Mạn',
];

export const StoryManager: React.FC<StoryManagerProps> = ({ onSelectStoryForEdit }) => {
  const [stories, setStories] = useState<(Story & { nodeCount: number; endingCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  // New Story Form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newGenre, setNewGenre] = useState<string>('Bí Ẩn / Kinh Dị');
  const [newThumbnail, setNewThumbnail] = useState('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80');
  const [creating, setCreating] = useState(false);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminStories();
      setStories(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách truyện admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleResetWebsite = async () => {
    setResetting(true);
    setError(null);
    sounds.playClick();
    try {
      const res = await api.resetDatabase();
      setSuccessMsg(res.message || 'Đã khôi phục website về nguyên hiện trạng mới!');
      setShowResetConfirm(false);
      await fetchStories();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi khôi phục trang web.');
    } finally {
      setResetting(false);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;
    sounds.playClick();
    setCreating(true);
    try {
      const res = await api.createStory({
        title: newTitle.trim(),
        description: newDescription.trim(),
        genre: newGenre,
        thumbnail: newThumbnail,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      // Open editor directly
      onSelectStoryForEdit(res.story.id);
    } catch (err: any) {
      setError(err.message || 'Lỗi tạo câu chuyện mới.');
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublish = async (storyId: string, currentStatus: StoryStatus) => {
    sounds.playClick();
    const newStatus: StoryStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.updateStoryStatus(storyId, newStatus);
      fetchStories();
    } catch (err: any) {
      setError(err.message || 'Lỗi cập nhật trạng thái xuất bản.');
    }
  };

  const handleDeleteStory = async (storyId: string, title: string) => {
    sounds.playClick();
    if (window.confirm(`Bạn có chắc chắn muốn xóa câu chuyện "${title}" cùng toàn bộ nodes, options và lịch sử liên quan?`)) {
      try {
        await api.deleteStory(storyId);
        fetchStories();
      } catch (err: any) {
        setError(err.message || 'Lỗi xóa câu chuyện.');
      }
    }
  };

  const filteredStories = stories.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Quản Lý & Biên Soạn Câu Chuyện
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tạo truyện mới, upload ảnh trực tiếp từ điện thoại, thiết lập jumpscare và quản lý nhánh nội dung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Reset Website Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setShowResetConfirm(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Khôi phục website về nguyên hiện trạng mới"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Website Ban Đầu</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              fetchStories();
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="admin-create-story-btn"
            onClick={() => {
              sounds.playClick();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/60 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Câu Chuyện Mới</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề hoặc thể loại..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs outline-none"
          />
        </div>
      </div>

      {/* Stories Grid / Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Đang tải danh sách stories...</p>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-300">Không có câu chuyện nào</h3>
          <p className="text-xs text-slate-500 mt-1">Bấm nút "Tạo Câu Chuyện Mới" để bắt đầu sáng tạo câu chuyện đầu tiên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStories.map((story) => (
            <div
              key={story.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                {/* Thumbnail & Badges */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-950">
                  <img
                    src={story.thumbnail}
                    alt={story.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${
                      story.status === 'PUBLISHED'
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80'
                        : 'bg-amber-950/90 text-amber-300 border-amber-700/80'
                    }`}>
                      {story.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>

                  {/* Nodes & Endings stats */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 font-semibold backdrop-blur-md flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-indigo-400" />
                      {story.nodeCount} Nodes
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] text-amber-300 font-semibold backdrop-blur-md flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      {story.endingCount} Endings
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <span className="text-[10px] text-indigo-400 font-semibold uppercase">
                    {story.genre}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5 line-clamp-1">
                    {story.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {story.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between gap-2 pt-3">
                <button
                  id={`edit-story-${story.id}`}
                  onClick={() => {
                    sounds.playClick();
                    onSelectStoryForEdit(story.id);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Soạn Thảo (CMS)</span>
                </button>

                <button
                  onClick={() => handleTogglePublish(story.id, story.status)}
                  title={story.status === 'PUBLISHED' ? 'Gỡ xuất bản' : 'Xuất bản cho Player'}
                  className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                    story.status === 'PUBLISHED'
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900/60'
                      : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteStory(story.id, story.title)}
                  title="Xóa story"
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-700 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white mb-4">
              Khởi Tạo Câu Chuyện Mới
            </h3>

            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tiêu Đề Câu Chuyện *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Bí Ẩn Thành Phố Mất Tích..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Thể Loại (Genre)
                </label>
                <select
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-indigo-500"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <DeviceImagePicker
                  value={newThumbnail}
                  onChange={(url) => setNewThumbnail(url)}
                  label="Ảnh Bìa Câu Chuyện (Thumbnail)"
                  helperText="Tải từ bộ sưu tập điện thoại hoặc máy tính"
                  aspectRatio="banner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tóm Tắt Cốt Truyện *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả bối cảnh và tiền đề mở màn câu chuyện..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim() || !newDescription.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {creating ? 'Đang tạo...' : 'Tạo & Bắt Đầu Biên Soạn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-slate-900 border border-rose-800/80 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 mb-4 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white text-center">
              Khôi Phục Nguyên Trạng Trang Web Mới?
            </h3>

            <p className="text-xs text-slate-300 text-center mt-2 leading-relaxed">
              Thao tác này sẽ thiết lập lại toàn bộ dữ liệu StoryVerse về trạng thái ban đầu xuất xưởng. Tài khoản Quản Trị Viên mặc định (<strong className="text-emerald-400">KhangVan</strong>, PIN: <strong className="text-amber-400">150408</strong>) và các câu chuyện mẫu kinh dị, hình ảnh sẽ được phục hồi mới hoàn toàn.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={handleResetWebsite}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-950/50 cursor-pointer flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang reset...</span>
                  </>
                ) : (
                  <span>Xác Nhận Khôi Phục</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
