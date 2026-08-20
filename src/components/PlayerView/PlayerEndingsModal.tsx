import React, { useEffect, useState } from 'react';
import { Trophy, Key, Skull, Scale, Sparkles, BookOpen, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { UnlockedEnding } from '../../types';
import { api } from '../../services/api';
import { sounds } from '../../services/audio';

interface PlayerEndingsViewProps {
  onBack: () => void;
  onPlayStory: (storyId: string) => void;
}

export const PlayerEndingsView: React.FC<PlayerEndingsViewProps> = ({ onBack, onPlayStory }) => {
  const [endings, setEndings] = useState<UnlockedEnding[]>([]);
  const [stats, setStats] = useState({
    storiesStarted: 0,
    storiesCompleted: 0,
    endingsUnlocked: 0,
    totalChoicesMade: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchEndings = async () => {
    setLoading(true);
    try {
      const [endingsRes, statsRes] = await Promise.all([
        api.getUnlockedEndings(),
        api.getPlayerStats(),
      ]);
      setEndings(endingsRes.endings || []);
      setStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndings();
  }, []);

  const getEndingIcon = (type: string) => {
    switch (type) {
      case 'VICTORY':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'SECRET':
        return <Key className="w-4 h-4 text-purple-400" />;
      case 'TRAGIC':
        return <Skull className="w-4 h-4 text-rose-400" />;
      default:
        return <Scale className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 pb-16 px-4 sm:px-6 lg:px-8 pt-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <button
              onClick={() => {
                sounds.playClick();
                onBack();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Khám Phá</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <Trophy className="w-7 h-7 text-amber-400" />
              <span>Phòng Cúp & Endings Đã Mở Khóa</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Ghi danh tất cả các nhánh kết thúc bạn đã chinh phục trong vũ trụ StoryVerse.
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              fetchEndings();
            }}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Cập nhật</span>
          </button>
        </div>

        {/* Player Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Endings Đã Mở</span>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.endingsUnlocked}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Truyện Hoàn Thành</span>
            <p className="text-2xl font-black text-indigo-400 mt-1">{stats.storiesCompleted}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Truyện Đã Bắt Đầu</span>
            <p className="text-2xl font-black text-cyan-400 mt-1">{stats.storiesStarted}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Tổng Lựa Chọn Đã Ra</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.totalChoicesMade}</p>
          </div>
        </div>

        {/* Endings Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Đang tải danh hiệu...</p>
          </div>
        ) : endings.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 p-8">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-300">Chưa có Ending nào được mở khóa</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Hãy chọn một câu chuyện trong thư viện, trải nghiệm và đưa ra các quyết định để đạt được kết thúc đầu tiên của bạn!
            </p>
            <button
              onClick={() => {
                sounds.playClick();
                onBack();
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
            >
              Khám Phá Truyện Ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {endings.map((ending) => (
              <div
                key={ending.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 shadow-xl flex items-start gap-4 transition-all"
              >
                {ending.storyThumbnail && (
                  <img
                    src={ending.storyThumbnail}
                    alt={ending.storyTitle}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-slate-300 truncate">{ending.storyTitle}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getEndingIcon(ending.endingType)}
                    <h3 className="text-sm font-bold text-white truncate">
                      {ending.endingTitle}
                    </h3>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ending.unlockedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onPlayStory(ending.storyId);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Chơi Lại Truyện →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
