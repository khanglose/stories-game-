import React, { useState } from 'react';
import { BookOpen, Users, BarChart3, ShieldAlert, ArrowLeft, Plus, Image as ImageIcon, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StoryManager } from './StoryManager';
import { StoryEditor } from './StoryEditor';
import { UserManager } from './UserManager';
import { AnalyticsView } from './AnalyticsView';
import { ImageLibraryView } from './ImageLibraryView';
import { AvatarLibraryView } from './AvatarLibraryView';
import { sounds } from '../../services/audio';

interface AdminDashboardProps {
  onBackToPlayer: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToPlayer }) => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'stories' | 'images' | 'avatars' | 'users' | 'analytics'>('stories');
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);

  // If user is not admin, show permission denied guard
  if (!user || !isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-slate-900 border border-rose-800/60 max-w-md shadow-2xl space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Truy Cập Bị Từ Chối (403 Forbidden)</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bạn cần đăng nhập bằng tài khoản Quản Trị Viên (role: <b className="text-rose-400">ADMIN</b>) để truy cập hệ thống CMS này.
          </p>
          <button
            onClick={onBackToPlayer}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Quay Về Giao Diện Người Chơi
          </button>
        </div>
      </div>
    );
  }

  // If editing a specific story, render StoryEditor
  if (editingStoryId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <StoryEditor
            storyId={editingStoryId}
            onBack={() => setEditingStoryId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold uppercase">
                StoryVerse Content Management System
              </span>
              <span className="text-xs text-slate-400">Admin Mode</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Trung Tâm Quản Trị (Admin CMS)
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                onBackToPlayer();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Chuyển Sang Chế Độ Chơi Game</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto scrollbar-none">
          <button
            id="admin-tab-stories"
            onClick={() => {
              sounds.playClick();
              setActiveTab('stories');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stories'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Quản Lý Story</span>
          </button>

          <button
            id="admin-tab-images"
            onClick={() => {
              sounds.playClick();
              setActiveTab('images');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'images'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Thư Viện Ảnh</span>
          </button>

          <button
            id="admin-tab-avatars"
            onClick={() => {
              sounds.playClick();
              setActiveTab('avatars');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'avatars'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Thư Viện Avatar</span>
          </button>

          <button
            id="admin-tab-users"
            onClick={() => {
              sounds.playClick();
              setActiveTab('users');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Người Dùng & Người Chơi</span>
          </button>

          <button
            id="admin-tab-analytics"
            onClick={() => {
              sounds.playClick();
              setActiveTab('analytics');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Thống Kê Lựa Chọn</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {activeTab === 'stories' && (
            <StoryManager onEditStory={(id) => setEditingStoryId(id)} />
          )}

          {activeTab === 'images' && <ImageLibraryView />}

          {activeTab === 'avatars' && <AvatarLibraryView />}

          {activeTab === 'users' && <UserManager />}

          {activeTab === 'analytics' && <AnalyticsView />}
        </div>
      </div>
    </div>
  );
};
