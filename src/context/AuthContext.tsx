import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api';
import { User, UserRole } from '../types';

const STORAGE_KEY_PLAYER_ID = 'storyverse_player_id';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isPlayer: boolean;
  playerName: string;
  avatarUrl: string;
  registerPlayer: (playerName: string, pin: string, avatarId?: string) => Promise<User>;
  loginPlayer: (playerName: string, pin: string) => Promise<User>;
  loginAdmin: (name: string, pin: string) => Promise<User>;
  updateProfile: (data: { playerName?: string; avatarId?: string; avatarUrl?: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = getAuthToken() || localStorage.getItem(STORAGE_KEY_PLAYER_ID);
      if (token) {
        setAuthToken(token);
        const res = await api.getMe();
        if (res.player || res.user) {
          const profile = res.player || res.user;
          setUser(profile);
          if (profile?.id) {
            localStorage.setItem(STORAGE_KEY_PLAYER_ID, profile.id);
          }
        } else {
          setUser(null);
          setAuthToken(null);
          localStorage.removeItem(STORAGE_KEY_PLAYER_ID);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Failed to restore session:', err);
      setUser(null);
      setAuthToken(null);
      localStorage.removeItem(STORAGE_KEY_PLAYER_ID);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const registerPlayer = async (playerName: string, pin: string, avatarId?: string): Promise<User> => {
    const res = await api.registerPlayer({ playerName, pin, avatarId });
    setAuthToken(res.token);
    localStorage.setItem(STORAGE_KEY_PLAYER_ID, res.token);
    setUser(res.player);
    return res.player;
  };

  const loginPlayer = async (playerName: string, pin: string): Promise<User> => {
    const res = await api.loginPlayer({ playerName, pin });
    setAuthToken(res.token);
    localStorage.setItem(STORAGE_KEY_PLAYER_ID, res.token);
    setUser(res.player);
    return res.player;
  };

  const loginAdmin = async (name: string, pin: string): Promise<User> => {
    const res = await api.loginAdmin({ name, pin });
    setAuthToken(res.token);
    localStorage.setItem(STORAGE_KEY_PLAYER_ID, res.token);
    setUser(res.user);
    return res.user;
  };

  const updateProfile = async (data: { playerName?: string; avatarId?: string; avatarUrl?: string }): Promise<User> => {
    const res = await api.updatePlayerProfile(data);
    setUser(res.player);
    return res.player;
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY_PLAYER_ID);
    setUser(null);
  };

  const playerName = user?.playerName || user?.name || '';
  const avatarUrl = user?.avatarUrl || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === 'ADMIN',
        isPlayer: !!user,
        playerName,
        avatarUrl,
        registerPlayer,
        loginPlayer,
        loginAdmin,
        updateProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
