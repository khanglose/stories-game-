import React, { useState, useEffect } from 'react';
import { Search, Sparkles, BookOpen, Compass, Trophy, RefreshCw, Flame } from 'lucide-react';
import { Story, UnlockedEnding } from '../../types';
import { api } from '../../services/api';
import { StoryCard } from './StoryCard';
import { sounds } from '../../services/audio';

interface StoryListProps {
  onSelectStory: (story: Story) => void;
}

const GENRES = [
  'Tất Cả',
  'Bí Ẩn / Kinh Dị',
  'Khoa Học Viễn Tưởng',
  'Kỳ Ảo / Phiêu Lưu',
  'Cyberpunk',
];

export const StoryList: React.FC<StoryListProps> = ({ onSelectStory }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState('Tất Cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [userEndings, setUserEndings] = useState<UnlockedEnding[]>([]);

  const fetchStoriesAndEndings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStories();
      setStories(data);

      try {
        const endingsData = await api.getUnlockedEndings();
        setUserEndings(endingsData.endings || []);
      } catch {
        // Guest user fallback
        setUserEndings([]);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách truyện.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoriesAndEndings();
  }, []);

  const filteredStories = stories.filter((story) => {
    const matchesGenre = selectedGenre === 'Tất Cả' || story.genre === selectedGenre;
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 pb-16">
      
      {/* Hero Showcase Section */}
      <div className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-r from-indigo-500/10 via-amber-500/15 to-purple-500/10 blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Choice Narrative Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Mỗi Quyết Định Định Đoạt <br />
            <span className="bg-gradient-to-r from-amber-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Số Phận & Kết Cục Câu Chuyện
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Chọn câu chuyện yêu thích, đắm chìm vào các tình huống kịch tính, đưa ra những lựa chọn then chốt và khám phá vô số nhánh kết thúc bí mật.
          </p>

          {/* Quick Search & Filters */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="search-stories-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm câu chuyện, chủ đề, thể loại..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-sm outline-none shadow-xl transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Genre Category Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {GENRES.map((genre) => (
              <button
                key={genre}
                id={`filter-genre-${genre}`}
                onClick={() => {
                  sounds.playClick();
                  setSelectedGenre(genre);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedGenre === genre
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60 scale-105'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Story Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              {selectedGenre === 'Tất Cả' ? 'Tất Cả Truyện Đã Xuất Bản' : `Thể loại: ${selectedGenre}`}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
              {filteredStories.length}
            </span>
          </div>

          <button
            id="refresh-stories-btn"
            onClick={() => {
              sounds.playClick();
              fetchStoriesAndEndings();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-400">Đang tải danh sách câu chuyện từ database...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-12 px-6 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-center max-w-md mx-auto">
            <p className="text-rose-300 text-sm font-semibold mb-3">{error}</p>
            <button
              onClick={fetchStoriesAndEndings}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredStories.length === 0 && (
          <div className="py-20 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center max-w-md mx-auto p-8">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">Không tìm thấy câu chuyện nào</h3>
            <p className="text-xs text-slate-500 mt-1">
              Thử thay đổi từ khóa tìm kiếm hoặc chọn thể loại khác.
            </p>
          </div>
        )}

        {/* Grid List */}
        {!loading && !error && filteredStories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                userEndings={userEndings}
                onSelectStory={onSelectStory}
              />
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
