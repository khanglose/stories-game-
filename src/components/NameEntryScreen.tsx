import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, ArrowRight, Lock, User as UserIcon, LogIn, UserPlus, RefreshCw, KeyRound, Edit3, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Avatar } from '../types';
import { sounds } from '../services/audio';

interface NameEntryScreenProps {
  onStart: (isAdmin: boolean) => void;
}

export const NameEntryScreen: React.FC<NameEntryScreenProps> = ({ onStart }) => {
  const {
    user,
    isAdmin,
    playerName,
    avatarUrl,
    registerPlayer,
    loginPlayer,
    loginAdmin,
    updateProfile,
    logout,
  } = useAuth();

  // Mode: 'register' | 'login' | 'admin' | 'editProfile'
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Form Fields
  const [nameInput, setNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');

  // Admin Modal Fields
  const [adminName, setAdminName] = useState('KhangVan');
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Profile Edit Fields
  const [editName, setEditName] = useState('');
  const [editAvatarId, setEditAvatarId] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Avatars List
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);

  // General State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvatars();
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.playerName || user.name || '');
      setEditAvatarId(user.avatarId || '');
    }
  }, [user]);

  const loadAvatars = async () => {
    setLoadingAvatars(true);
    try {
      const list = await api.getAvatars();
      setAvatars(list);
      if (list.length > 0 && !selectedAvatarId) {
        setSelectedAvatarId(list[0].id);
      }
    } catch (err) {
      console.warn('Could not load avatars:', err);
    } finally {
      setLoadingAvatars(false);
    }
  };

  // Handle Player Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = nameInput.trim();
    const trimmedPin = pinInput.trim();

    if (!trimmedName) {
      setError('Vui lòng nhập tên của bạn.');
      return;
    }
    if (!trimmedPin || trimmedPin.length < 4) {
      setError('Mã PIN bảo vệ hồ sơ phải có ít nhất 4 ký tự.');
      return;
    }
    if (trimmedPin !== pinConfirmInput.trim()) {
      setError('Xác nhận mã PIN không khớp.');
      return;
    }

    setLoading(true);
    setError(null);
    sounds.playChoiceSelected();

    try {
      // Check if name already exists
      const check = await api.checkPlayerName(trimmedName);
      if (check.exists) {
        setError(`Tên "${trimmedName}" đã được sử dụng. Vui lòng chuyển sang Đăng Nhập hoặc chọn tên khác.`);
        setAuthMode('login');
        setLoading(false);
        return;
      }

      await registerPlayer(trimmedName, trimmedPin, selectedAvatarId);
      onStart(false);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo hồ sơ người chơi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Player Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = nameInput.trim();
    const trimmedPin = pinInput.trim();

    if (!trimmedName) {
      setError('Vui lòng nhập tên người chơi.');
      return;
    }
    if (!trimmedPin) {
      setError('Vui lòng nhập mã PIN bảo mật.');
      return;
    }

    setLoading(true);
    setError(null);
    sounds.playChoiceSelected();

    try {
      const loggedUser = await loginPlayer(trimmedName, trimmedPin);
      onStart(loggedUser.role === 'ADMIN');
    } catch (err: any) {
      setError(err.message || 'Tên người chơi hoặc mã PIN không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminPin.trim()) {
      setAdminError('Vui lòng nhập Tên Quản Trị Viên và Mã PIN.');
      return;
    }

    setLoading(true);
    setAdminError(null);
    sounds.playChoiceSelected();

    try {
      await loginAdmin(adminName.trim(), adminPin.trim());
      setShowAdminModal(false);
      onStart(true);
    } catch (err: any) {
      setAdminError(err.message || 'Xác thực Quản Trị Viên không thành công.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Profile Update
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Tên không được để trống.');
      return;
    }

    setLoading(true);
    setEditError(null);
    sounds.playChoiceSelected();

    try {
      await updateProfile({
        playerName: editName.trim(),
        avatarId: editAvatarId,
      });
      setShowProfileModal(false);
    } catch (err: any) {
      setEditError(err.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VIEW: RETURNING PLAYER ALREADY ACTIVE
  // ==========================================
  if (user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-indigo-600 to-cyan-500 p-[2px] shadow-2xl shadow-indigo-950/80 mb-3">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Story<span className="text-indigo-400">Verse</span>
            </h1>
          </div>

          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6 text-center">
            {/* Avatar & Welcome */}
            <div className="flex flex-col items-center">
              <div className="relative group mb-3">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl bg-slate-950">
                  <img
                    src={avatarUrl}
                    alt={playerName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setShowProfileModal(true);
                  }}
                  className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  title="Chỉnh sửa hồ sơ"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs text-slate-400 font-serif italic">Chào mừng trở lại,</span>
              <h2 className="text-2xl font-extrabold text-white mt-0.5">{playerName}</h2>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                }`}>
                  {isAdmin ? 'Quản Trị Viên (ADMIN)' : 'Người Chơi (PLAYER)'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                id="continue-game-btn"
                onClick={() => {
                  sounds.playChoiceSelected();
                  onStart(isAdmin);
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white text-sm font-black tracking-wide uppercase shadow-xl shadow-indigo-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Bắt Đầu / Tiếp Tục Chơi</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setShowProfileModal(true);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Đổi Avatar / Tên</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    logout();
                    setAuthMode('login');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-rose-950/40 hover:border-rose-800/60 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đổi Tài Khoản</span>
                </button>
              </div>
            </div>
          </div>

          {/* Profile Edit Modal */}
          {showProfileModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>Chỉnh Sửa Hồ Sơ Người Chơi</span>
                </h3>

                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tên người chơi:
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Chọn ảnh đại diện (Avatar):
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                      {avatars.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setEditAvatarId(av.id);
                          }}
                          className={`aspect-square rounded-xl overflow-hidden border-2 relative cursor-pointer ${
                            editAvatarId === av.id
                              ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <img
                            src={av.imageUrl}
                            alt={av.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {editAvatarId === av.id && (
                            <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editError && <p className="text-xs text-rose-400">{editError}</p>}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                    >
                      {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: REGISTRATION / LOGIN FORM
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      
      {/* Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-indigo-600 to-cyan-500 p-[2px] shadow-2xl shadow-indigo-950/80 mb-3 hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-amber-400" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Story<span className="text-indigo-400">Verse</span>
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-1 font-semibold">
            Interactive Choice Story Platform
          </p>
        </div>

        {/* Auth Box */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          
          {/* Header Title */}
          <div className="text-center">
            <p className="text-sm text-slate-400 font-serif italic mb-1">
              {authMode === 'register' ? 'Chào mừng bạn đến với StoryVerse' : 'Đăng nhập hồ sơ người chơi'}
            </p>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {authMode === 'register' ? 'Tạo Hồ Sơ Người Chơi' : 'Nhập Tên & Mã PIN'}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
              {authMode === 'register'
                ? 'Tên bạn sẽ xuất hiện trực tiếp trong cốt truyện và định hình diễn biến thế giới.'
                : 'Đồng bộ tiến trình và mở khóa các nhánh kết thúc độc nhất.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={authMode === 'register' ? handleRegister : handleLogin} className="space-y-4">
            
            {/* Player Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tên của bạn:</span>
              </label>
              <input
                id="player-name-input"
                type="text"
                autoFocus
                maxLength={30}
                required
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Nhập tên của bạn (vd: Minh, An, Nam...)"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-base font-bold text-white placeholder:text-slate-600 outline-none shadow-inner transition-all focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* PIN Inputs */}
            {authMode === 'register' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tạo mã PIN (4-12 số):</span>
                  </label>
                  <input
                    id="player-pin-create"
                    type="password"
                    maxLength={12}
                    required
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Mã PIN bảo mật"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm font-bold text-white placeholder:text-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Xác nhận mã PIN:</span>
                  </label>
                  <input
                    id="player-pin-confirm"
                    type="password"
                    maxLength={12}
                    required
                    value={pinConfirmInput}
                    onChange={(e) => {
                      setPinConfirmInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Nhập lại PIN"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm font-bold text-white placeholder:text-slate-600 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Mã PIN người chơi:</span>
                </label>
                <input
                  id="player-pin-login"
                  type="password"
                  maxLength={12}
                  required
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Nhập mã PIN đã tạo"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-base font-bold text-white placeholder:text-slate-600 outline-none"
                />
              </div>
            )}

            {/* Avatar Selector (Only in Register mode) */}
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Chọn ảnh đại diện nhân vật:
                </label>
                {loadingAvatars ? (
                  <div className="py-4 text-center text-xs text-slate-500">Đang tải avatar...</div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {avatars.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedAvatarId(av.id);
                        }}
                        className={`aspect-square rounded-xl overflow-hidden border-2 relative cursor-pointer transition-all ${
                          selectedAvatarId === av.id
                            ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-950/60'
                            : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                        title={av.name}
                      >
                        <img
                          src={av.imageUrl}
                          alt={av.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {selectedAvatarId === av.id && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 text-center font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              id="submit-auth-btn"
              type="submit"
              disabled={loading || !nameInput.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-black tracking-wider uppercase shadow-xl shadow-indigo-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : authMode === 'register' ? (
                <>
                  <span>Bắt Đầu Phiêu Lưu</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Ngay</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle between Register and Login */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            {authMode === 'register' ? (
              <p>
                Đã có hồ sơ từ trước?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setAuthMode('login');
                    setError(null);
                  }}
                  className="text-indigo-400 hover:underline font-bold cursor-pointer"
                >
                  Đăng nhập bằng PIN
                </button>
              </p>
            ) : (
              <p>
                Người chơi mới?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setAuthMode('register');
                    setError(null);
                  }}
                  className="text-indigo-400 hover:underline font-bold cursor-pointer"
                >
                  Tạo hồ sơ mới
                </button>
              </p>
            )}

            {/* Admin Login Dialog Trigger */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowAdminModal(true);
              }}
              className="text-slate-400 hover:text-amber-400 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin CMS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-2xl bg-amber-950 border border-amber-800 text-amber-400 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Đăng Nhập Quản Trị Viên</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Truy cập toàn quyền CMS để chỉnh sửa và xuất bản truyện.
              </p>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên Quản Trị Viên:
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-bold text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mã PIN Quản Trị:
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Nhập mã PIN Admin..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-bold text-white outline-none"
                />
              </div>

              {adminError && <p className="text-xs text-rose-400 text-center">{adminError}</p>}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer shadow-lg"
                >
                  {loading ? 'Xác thực...' : 'Đăng Nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
