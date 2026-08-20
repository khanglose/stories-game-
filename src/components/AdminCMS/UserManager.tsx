import React, { useState, useEffect } from 'react';
import { ShieldCheck, User as UserIcon, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';
import { sounds } from '../../services/audio';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangeRole = async (userId: string, currentRole: UserRole) => {
    sounds.playClick();
    const newRole: UserRole = currentRole === 'ADMIN' ? 'PLAYER' : 'ADMIN';
    try {
      await api.updateUserRole(userId, newRole);
      setSuccess(`Đã cập nhật role của người dùng thành ${newRole}!`);
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Lỗi cập nhật role.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Quản Lý Người Dùng & Phân Quyền (RBAC)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kiểm tra danh sách tài khoản, giám sát phân quyền ADMIN / PLAYER được kiểm tra nghiêm ngặt tại Backend.
          </p>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            fetchUsers();
          }}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Security notice badge */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-white">Bảo mật đa tầng thực tế:</span> Hệ thống kiểm tra quyền trực tiếp tại tầng API Express Server. Tài khoản có role <span className="font-bold text-indigo-300">PLAYER</span> sẽ bị từ chối mọi yêu cầu tạo, sửa, xóa, xuất bản story kể cả khi gọi trực tiếp qua API client.
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Đang tải danh sách người dùng...</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Người Dùng</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Quyền Hạn (Role)</th>
                <th className="py-3.5 px-4">Ngày Tạo</th>
                <th className="py-3.5 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                          {u.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-white block">{u.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{u.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      u.role === 'ADMIN'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-indigo-950 text-indigo-300 border-indigo-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleChangeRole(u.id, u.role)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      {u.role === 'ADMIN' ? 'Hạ quyền xuống PLAYER' : 'Nâng cấp lên ADMIN'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
