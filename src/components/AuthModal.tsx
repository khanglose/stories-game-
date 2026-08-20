import React, { useState } from 'react';
import { X, ShieldCheck, Gamepad2, Sparkles, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../services/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginPlayer, loginAdmin, registerPlayer } = useAuth();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    sounds.playClick();

    try {
      if (isAdminMode) {
        await loginAdmin(name.trim(), pin.trim());
      } else if (isRegister) {
        await registerPlayer(name.trim(), pin.trim());
      } else {
        await loginPlayer(name.trim(), pin.trim());
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại Tên & Mã PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-b from-indigo-500/20 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="auth-close-btn"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700/60 mb-3 shadow-inner">
            {isAdminMode ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : (
              <Sparkles className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isAdminMode 
              ? 'Đăng Nhập Quản Trị Viên (Admin CMS)' 
              : isRegister 
              ? 'Tạo Hồ Sơ Người Chơi Mới' 
              : 'Đăng Nhập Người Chơi StoryVerse'
            }
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAdminMode
              ? 'Nhập tài khoản Quản trị viên để quản lý Story, Ảnh và Avatar'
              : isRegister
              ? 'Tên người chơi là duy nhất kết hợp mã PIN bảo mật 4-6 số'
              : 'Nhập Tên người chơi và mã PIN để tải lại toàn bộ lịch sử chơi'
            }
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsAdminMode(false);
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              !isAdminMode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Người Chơi (Player)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsAdminMode(true);
              setError(null);
              if (!name) setName('KhangVan');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isAdminMode ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Quản Trị (Admin)</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isAdminMode && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-300 flex items-center justify-between">
              <span>Mã PIN Quản Trị Viên: <strong>150408</strong></span>
              <button
                type="button"
                onClick={() => {
                  setName('KhangVan');
                  setPin('150408');
                  sounds.playClick();
                }}
                className="px-2 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
              >
                Tự động điền
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isAdminMode ? 'Tên Admin (hoặc để mặc định):' : 'Tên Người Chơi:'}
            </label>
            <input
              id="auth-name-input"
              type="text"
              required={!isAdminMode}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAdminMode ? 'KhangVan / Admin' : 'Ví dụ: Minh, Linh, Hoàng...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Mã PIN Bảo Mật (4-6 số):</span>
              <span className="text-[10px] text-slate-500 font-normal">Được mã hóa SHA-256</span>
            </label>
            <div className="relative">
              <input
                id="auth-pin-input"
                type="password"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder={isAdminMode ? '150408' : '••••••'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono tracking-widest placeholder:text-slate-600 focus:border-indigo-500 outline-none"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading || (!isAdminMode && !name.trim()) || pin.length < 4}
            className={`w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
              isAdminMode 
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/50'
            }`}
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : isAdminMode ? (
              <span>Đăng Nhập Quyền Admin (PIN: 150408)</span>
            ) : isRegister ? (
              <span>Đăng Ký & Bắt Đầu Chơi</span>
            ) : (
              <span>Đăng Nhập</span>
            )}
          </button>
        </form>

        {/* Toggle Register / Login for Player */}
        {!isAdminMode && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-indigo-400 hover:underline cursor-pointer"
            >
              {isRegister 
                ? 'Đã có tài khoản và mã PIN? Nhấn để Đăng Nhập' 
                : 'Chưa có tài khoản? Nhấn để Đăng Ký mới'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
