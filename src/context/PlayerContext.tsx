import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

interface PlayerContextType {
  playerName: string;
  hasEnteredName: boolean;
  avatarUrl: string;
  setPlayerName: (name: string) => Promise<boolean>;
  clearPlayerName: () => void;
  isAdminDetected: boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, playerName, avatarUrl, updateProfile, logout } = useAuth();

  const hasEnteredName = !!user && !!playerName;
  const isAdminDetected = isAdmin;

  const setPlayerName = async (name: string): Promise<boolean> => {
    const trimmed = (name || '').trim();
    if (!trimmed) return false;
    try {
      await updateProfile({ playerName: trimmed });
      return isAdmin;
    } catch {
      return false;
    }
  };

  const clearPlayerName = () => {
    logout();
  };

  return (
    <PlayerContext.Provider
      value={{
        playerName: playerName || 'Người Chơi',
        hasEnteredName,
        avatarUrl,
        setPlayerName,
        clearPlayerName,
        isAdminDetected,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
