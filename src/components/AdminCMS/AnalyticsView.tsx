import React, { useState, useEffect } from 'react';
import { BarChart3, Users, BookOpen, Trophy, Play, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';
import { AdminStats } from '../../types';
import { api } from '../../services/api';
import { sounds } from '../../services/audio';

export const AnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Đang tổng hợp dữ liệu phân tích...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Thống Kê Hoạt Động Toàn Hệ Thống
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tổng quan số liệu người chơi, lượt trải nghiệm các nhánh và tỷ lệ mở khóa Endings.
          </p>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            fetchStats();
          }}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Tổng Lượt Chơi</span>
            <Play className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.totalPlays}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Endings Đã Đạt</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">{stats.totalEndingsReached}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Story Đã Xuất Bản</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">
            {stats.publishedStories} <span className="text-xs text-slate-500 font-normal">/ {stats.totalStories} tổng</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Người Dùng Đăng Ký</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-cyan-400">{stats.totalUsers}</p>
        </div>
      </div>

      {/* Popular Stories Table & Genre Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Popular Stories */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Top Câu Chuyện Thu Hút Người Chơi Nhất</span>
          </h3>

          <div className="space-y-3">
            {stats.popularStories.map((story, idx) => (
              <div
                key={story.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {story.title}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-400">
                    <b className="text-white">{story.plays}</b> lượt chơi
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {story.completions} về đích
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Genre Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Phân Bổ Thể Loại</span>
          </h3>

          <div className="space-y-3">
            {stats.genreBreakdown.map((item) => (
              <div key={item.genre} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.genre}</span>
                  <span className="font-bold text-indigo-400">{item.count} truyện</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, (item.count / stats.totalStories) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
