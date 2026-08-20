import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Trophy, 
  Compass, 
  ChevronDown,
  Gamepad2,
  Edit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { sounds } from '../services/audio';
import { AvatarSelectorModal } from './AvatarSelectorModal';

interface NavbarProps {
  currentView: 'stories' | 'player' | 'admin' | 'endings';
  onNavigate: (view: 'stories' | 'player' | 'admin' | 'endings') => void;
  onOpenAuth: () => void;
  onChangeName?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onChangeName }) => {
  const { user, isAdmin, avatarUrl, logout } = useAuth();
  const { playerName, clearPlayerName } = usePlayer();
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sounds.playClick();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Brand / Logo */}
          <div 
            id="nav-brand-logo"
            onClick={() => {
              sounds.playClick();
              onNavigate('stories');
            }}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-indigo-600 to-cyan-500 p-[2px] shadow-md sm:shadow-lg shadow-indigo-950/50 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-200" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  Story<span className="text-indigo-400">Verse</span>
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hidden xs:inline-block">
                  Choice
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal hidden md:block">
                Thế giới truyện tương tác & đa kết thúc
              </p>
            </div>
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
            <button
              id="nav-explore-btn"
              onClick={() => {
                sounds.playClick();
                onNavigate('stories');
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                currentView === 'stories' || currentView === 'player'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Khám Phá</span>
            </button>

            <button
              id="nav-endings-btn"
              onClick={() => {
                sounds.playClick();
                onNavigate('endings');
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                currentView === 'endings'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Phòng Cúp Endings</span>
            </button>

            {isAdmin && (
              <button
                id="nav-admin-btn"
                onClick={() => {
                  sounds.playClick();
                  onNavigate('admin');
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950'
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/30 border border-emerald-800/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Admin CMS</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
            )}
          </nav>

          {/* Right side controls (Sound, Player Avatar Badge, Auth) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Sound Toggle */}
            <button
              id="nav-sound-toggle-btn"
              onClick={handleToggleMute}
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-slate-700 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Active Player Name Chip */}
            {playerName && (
              <div className="relative">
                <button
                  id="nav-player-name-badge"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-200 transition-all text-xs font-semibold cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-indigo-500/60 bg-slate-950 shrink-0">
                    <img
                      src={avatarUrl}
                      alt={playerName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="text-slate-200 block leading-tight font-bold truncate max-w-[90px]">
                      {playerName}
                    </span>
                    <span className={`text-[9px] block uppercase font-extrabold ${isAdmin ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {isAdmin ? 'ADMIN MODE' : 'PLAYER'}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2 py-2 border-b border-slate-800 flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-500 shrink-0">
                          <img
                            src={avatarUrl}
                            alt={playerName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate">
                            {playerName}
                          </p>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            isAdmin 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                          }`}>
                            {isAdmin ? 'Quản Trị Viên (Admin)' : 'Người Chơi (Player)'}
                          </span>
                        </div>
                      </div>

                      <div className="py-2 space-y-1">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setShowUserMenu(false);
                            setShowAvatarModal(true);
                          }}
                          className="w-full text-left px-2.5 py-2 text-xs text-indigo-300 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Đổi Avatar Từ Điện Thoại</span>
                        </button>

                        {onChangeName && (
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setShowUserMenu(false);
                              onChangeName();
                            }}
                            className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Hồ Sơ & Đổi Tên / PIN</span>
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setShowUserMenu(false);
                              onNavigate('admin');
                            }}
                            className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-emerald-400 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Mở <b>Admin CMS</b></span>
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            clearPlayerName();
                            setShowUserMenu(false);
                            if (onChangeName) onChangeName();
                          }}
                          className="w-full text-left px-2.5 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Đăng xuất / Đổi tài khoản</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* If no name yet, show enter name button */}
            {!playerName && (
              <button
                onClick={() => onChangeName && onChangeName()}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Nhập Tên Chơi</span>
                <span className="xs:hidden">Chơi</span>
              </button>
            )}

          </div>

        </div>

        {/* Global Avatar Selector Modal */}
        <AvatarSelectorModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
        />
      </header>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom for easy thumb tapping) */}
      {/* ========================================================================= */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg px-2 py-1.5 pb-safe flex items-center justify-around">
        <button
          onClick={() => {
            sounds.playClick();
            onNavigate('stories');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentView === 'stories' || currentView === 'player'
              ? 'text-indigo-400 font-bold bg-indigo-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Khám Phá</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onNavigate('endings');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentView === 'endings'
              ? 'text-amber-400 font-bold bg-amber-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Endings</span>
        </button>

        {isAdmin ? (
          <button
            onClick={() => {
              sounds.playClick();
              onNavigate('admin');
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              currentView === 'admin'
                ? 'text-emerald-400 font-bold bg-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <ShieldCheck className="w-5 h-5 mb-0.5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px]">Admin CMS</span>
          </button>
        ) : (
          <button
            onClick={() => {
              sounds.playClick();
              setShowAvatarModal(true);
            }}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="text-[10px]">Avatar</span>
          </button>
        )}

        <button
          onClick={() => {
            sounds.playClick();
            if (onChangeName) onChangeName();
          }}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          <UserIcon className="w-5 h-5 mb-0.5 text-indigo-400" />
          <span className="text-[10px]">Hồ Sơ</span>
        </button>
      </nav>
    </>
  );
};
