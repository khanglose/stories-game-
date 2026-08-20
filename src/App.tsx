import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { NameEntryScreen } from './components/NameEntryScreen';
import { StoryList } from './components/PlayerView/StoryList';
import { StoryPlayer } from './components/PlayerView/StoryPlayer';
import { PlayerEndingsView } from './components/PlayerView/PlayerEndingsModal';
import { AdminDashboard } from './components/AdminCMS/AdminDashboard';
import { Story } from './types';

type AppView = 'stories' | 'player' | 'endings' | 'admin';

const MainContent: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { hasEnteredName, playerName } = usePlayer();
  const [currentView, setCurrentView] = useState<AppView>('stories');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isChangingName, setIsChangingName] = useState(false);

  const handleStartPlay = (story: Story | string) => {
    const id = typeof story === 'string' ? story : story.id;
    setActiveStoryId(id);
    setCurrentView('player');
  };

  // If user hasn't entered their name yet, or requested to change name, show NameEntryScreen
  if (!hasEnteredName || isChangingName) {
    return (
      <NameEntryScreen
        onStart={(isAdminTriggered) => {
          setIsChangingName(false);
          if (isAdminTriggered) {
            setCurrentView('admin');
          } else {
            setCurrentView('stories');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'player' && !activeStoryId) {
            setCurrentView('stories');
          } else {
            setCurrentView(view);
          }
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        onChangeName={() => setIsChangingName(true)}
      />

      {/* Main View Area */}
      <div className="flex-1 pb-16 sm:pb-0">
        {currentView === 'stories' && (
          <StoryList
            onSelectStory={handleStartPlay}
          />
        )}

        {currentView === 'player' && activeStoryId && (
          <StoryPlayer
            storyId={activeStoryId}
            onBackToLibrary={() => setCurrentView('stories')}
          />
        )}

        {currentView === 'endings' && (
          <PlayerEndingsView
            onBack={() => setCurrentView('stories')}
            onPlayStory={handleStartPlay}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            onBackToPlayer={() => setCurrentView('stories')}
          />
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <MainContent />
      </PlayerProvider>
    </AuthProvider>
  );
}

export default App;

