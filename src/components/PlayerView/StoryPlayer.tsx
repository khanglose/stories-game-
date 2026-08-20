import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  History, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  HelpCircle, 
  AlertCircle, 
  Compass,
  Skull,
  User,
  Package,
  Eye,
  Zap,
  Volume2,
  VolumeX,
  FastForward
} from 'lucide-react';
import { 
  ChoiceStep, 
  PlayerProgress, 
  StoryFullDetail, 
  StoryNode, 
  StoryOption 
} from '../../types';
import { api } from '../../services/api';
import { sounds } from '../../services/audio';
import { EndingScreen } from './EndingScreen';
import { ChoiceHistoryDrawer } from './ChoiceHistoryDrawer';
import { InspectItemModal } from './InspectItemModal';
import { usePlayer } from '../../context/PlayerContext';
import { renderStoryText } from '../../utils/template';

interface StoryPlayerProps {
  storyId: string;
  onBackToLibrary: () => void;
}

export const StoryPlayer: React.FC<StoryPlayerProps> = ({ storyId, onBackToLibrary }) => {
  const { playerName } = usePlayer();
  const [story, setStory] = useState<StoryFullDetail | null>(null);
  const [currentNode, setCurrentNode] = useState<(StoryNode & { options: StoryOption[] }) | null>(null);
  const [choicePath, setChoicePath] = useState<ChoiceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [savedProgressPrompt, setSavedProgressPrompt] = useState<PlayerProgress | null>(null);

  // Deep Story & Clues state
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  // Jumpscare Active State
  const [activeJumpscare, setActiveJumpscare] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Progressive Text Animation
  const [displayedTextLength, setDisplayedTextLength] = useState<number>(0);
  const [isTextComplete, setIsTextComplete] = useState<boolean>(false);
  const fullTextRef = useRef<string>('');

  // Load initial story data & check saved progress
  useEffect(() => {
    let isMounted = true;

    const loadStory = async () => {
      setLoading(true);
      setError(null);
      try {
        const storyData = await api.getStoryDetail(storyId);
        if (!isMounted) return;
        setStory(storyData);

        // Check if there is saved progress for this story
        try {
          const progressRes = await api.getProgress(storyId);
          if (progressRes.progress && !progressRes.progress.completed && progressRes.progress.currentNodeId) {
            setSavedProgressPrompt(progressRes.progress);
          }
        } catch {
          // Ignore if unauthenticated
        }

        // Load start node
        const startId = storyData.startNodeId || storyData.nodes[0]?.id;
        if (!startId) {
          throw new Error('Câu chuyện chưa có nội dung bắt đầu (START node).');
        }

        const nodeData = await api.getNode(storyId, startId);
        if (!isMounted) return;
        setCurrentNode(nodeData);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Không thể tải nội dung câu chuyện.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStory();

    return () => {
      isMounted = false;
    };
  }, [storyId]);

  // Trigger jumpscare and text reveal when currentNode changes
  useEffect(() => {
    if (!currentNode) return;

    const rendered = renderStoryText(currentNode.content, { playerName });
    fullTextRef.current = rendered;
    setDisplayedTextLength(0);
    setIsTextComplete(false);

    // Handle Jumpscare
    if (currentNode.hasJumpscare) {
      setActiveJumpscare(true);
      setScreenShake(true);
      sounds.playJumpscare(currentNode.jumpscareSound || 'screech');

      const shakeTimeout = setTimeout(() => {
        setScreenShake(false);
      }, currentNode.jumpscareIntensity === 'extreme' ? 1200 : 700);

      const jumpscareTimeout = setTimeout(() => {
        setActiveJumpscare(false);
      }, currentNode.jumpscareIntensity === 'extreme' ? 2200 : 1500);

      return () => {
        clearTimeout(shakeTimeout);
        clearTimeout(jumpscareTimeout);
      };
    }
  }, [currentNode?.id, playerName]);

  // Text Typewriter Tick Interval
  useEffect(() => {
    if (!currentNode || isTextComplete) return;

    const fullLen = fullTextRef.current.length;
    if (fullLen === 0) {
      setIsTextComplete(true);
      return;
    }

    // Step size based on length for comfortable pacing
    const step = Math.max(1, Math.floor(fullLen / 45));
    const interval = setInterval(() => {
      setDisplayedTextLength((prev) => {
        const next = prev + step;
        if (next >= fullLen) {
          clearInterval(interval);
          setIsTextComplete(true);
          return fullLen;
        }
        if (next % 15 === 0) {
          sounds.playTypewriter();
        }
        return next;
      });
    }, 28);

    return () => clearInterval(interval);
  }, [currentNode?.id, isTextComplete]);

  // Keyboard shortcut listener (numbers 1-9 to select options)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentNode || !currentNode.options || transitioning || activeJumpscare) return;

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= currentNode.options.length) {
        const selectedOpt = currentNode.options[num - 1];
        if (selectedOpt) {
          handleSelectOption(selectedOpt);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNode, transitioning, activeJumpscare]);

  const handleSkipText = () => {
    setDisplayedTextLength(fullTextRef.current.length);
    setIsTextComplete(true);
  };

  // Resume saved progress
  const handleResumeProgress = async () => {
    if (!savedProgressPrompt) return;
    sounds.playChoiceSelected();
    setLoading(true);
    try {
      const nodeData = await api.getNode(storyId, savedProgressPrompt.currentNodeId);
      setCurrentNode(nodeData);
      setChoicePath(savedProgressPrompt.choicePath || []);
      setSavedProgressPrompt(null);
    } catch (err: any) {
      setError('Không thể tiếp tục tiến trình cũ, bắt đầu lại từ đầu.');
      setSavedProgressPrompt(null);
    } finally {
      setLoading(false);
    }
  };

  // Choose an Option / Branch
  const handleSelectOption = async (option: StoryOption) => {
    if (!story || !currentNode || transitioning) return;

    if (!option.nextNodeId) {
      setError('Lựa chọn này chưa được thiết lập nhánh tiếp theo bởi Tác giả.');
      return;
    }

    sounds.playChoiceSelected();
    setTransitioning(true);

    const step: ChoiceStep = {
      nodeId: currentNode.id,
      nodeTitle: renderStoryText(currentNode.title, { playerName }),
      optionId: option.id,
      optionText: renderStoryText(option.text, { playerName }),
      timestamp: new Date().toISOString(),
    };

    const newPath = [...choicePath, step];
    setChoicePath(newPath);

    try {
      // Save progress to database
      try {
        await api.saveProgress({
          storyId: story.id,
          currentNodeId: option.nextNodeId,
          choiceStep: step,
        });
      } catch {
        // Proceed even if unauthenticated
      }

      // Load next node
      const nextNodeData = await api.getNode(story.id, option.nextNodeId);
      
      // Smooth fade transition
      setTimeout(() => {
        setCurrentNode(nextNodeData);
        setTransitioning(false);
      }, 160);

    } catch (err: any) {
      setError(err.message || 'Không thể chuyển sang tình huống tiếp theo.');
      setTransitioning(false);
    }
  };

  // Restart Story
  const handleRestart = async () => {
    if (!story) return;
    sounds.playClick();
    setLoading(true);
    try {
      try {
        await api.resetProgress(story.id);
      } catch {}

      const startId = story.startNodeId || story.nodes[0]?.id;
      const nodeData = await api.getNode(story.id, startId);
      setCurrentNode(nodeData);
      setChoicePath([]);
      setSavedProgressPrompt(null);
    } catch (err: any) {
      setError('Không thể khởi động lại câu chuyện.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <h3 className="text-base font-bold text-slate-200">Đang chuẩn bị câu chuyện...</h3>
        <p className="text-xs text-slate-500 mt-1">Đang tải các nhánh quyết định và tài nguyên hình ảnh...</p>
      </div>
    );
  }

  if (error || !story || !currentNode) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-5 rounded-3xl bg-rose-950/40 border border-rose-800/60 max-w-md">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-200">{error || 'Không thể tải câu chuyện'}</h3>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={onBackToLibrary}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Quay lại thư viện
            </button>
            <button
              onClick={handleRestart}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If node is an ENDING, render EndingScreen
  if (currentNode.type === 'ENDING') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 py-8">
        <EndingScreen
          storyTitle={story.title}
          endingNode={currentNode}
          choicePath={choicePath}
          onRestart={handleRestart}
          onBackToLibrary={onBackToLibrary}
          onOpenHistory={() => setShowHistory(true)}
        />
        <ChoiceHistoryDrawer
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          choicePath={choicePath}
          storyTitle={story.title}
        />
      </div>
    );
  }

  // Atmosphere background theme styles
  const themeClass = 
    currentNode.sceneTheme === 'horror' ? 'bg-gradient-to-b from-rose-950/40 via-slate-950 to-slate-950' :
    currentNode.sceneTheme === 'mystery' ? 'bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950' :
    currentNode.sceneTheme === 'fantasy' ? 'bg-gradient-to-b from-amber-950/30 via-slate-950 to-slate-950' :
    currentNode.sceneTheme === 'cyber' ? 'bg-gradient-to-b from-cyan-950/40 via-slate-950 to-slate-950' :
    'bg-slate-950';

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${themeClass} pb-24 relative overflow-x-hidden ${screenShake ? 'animate-bounce duration-75' : ''}`}>
      
      {/* ========================================================= */}
      {/* FULLSCREEN JUMPSCARE EFFECT OVERLAY */}
      {/* ========================================================= */}
      {activeJumpscare && (
        <div 
          onClick={() => setActiveJumpscare(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-lg animate-in zoom-in-105 duration-100 cursor-pointer select-none"
        >
          {/* Blood Vignette Effect */}
          <div className="absolute inset-0 border-[24px] sm:border-[40px] border-rose-600/80 rounded-none pointer-events-none animate-pulse" />

          {/* Jumpscare Image or Ghost */}
          <div className="relative z-10 flex flex-col items-center text-center animate-in zoom-in-75 duration-150">
            {currentNode.jumpscareImage ? (
              <div className="w-72 sm:w-96 max-h-[60vh] rounded-3xl overflow-hidden border-4 border-rose-500 shadow-2xl shadow-rose-900/90">
                <img
                  src={currentNode.jumpscareImage}
                  alt="Jumpscare"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-110 animate-pulse"
                />
              </div>
            ) : (
              <div className="p-8 rounded-full bg-rose-950/80 border-4 border-rose-600 shadow-2xl shadow-rose-900/80 animate-ping duration-700">
                <Skull className="w-24 h-24 text-rose-500" />
              </div>
            )}

            <h2 className="text-2xl sm:text-4xl font-black text-rose-400 mt-6 tracking-widest uppercase drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]">
              {currentNode.jumpscareText || 'NGUY HIỂM KINH HOÀNG!'}
            </h2>
            <p className="text-xs text-rose-300/80 mt-2">
              (Nhấn để tiếp tục)
            </p>
          </div>
        </div>
      )}

      {/* Top Gameplay Bar */}
      <div className="sticky top-16 z-30 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            id="player-back-btn"
            onClick={() => {
              sounds.playClick();
              onBackToLibrary();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Rời khỏi truyện</span>
          </button>

          <div className="text-center px-2 truncate max-w-[200px] sm:max-w-sm">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">
              {story.title}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="text-[10px] text-indigo-400 font-semibold">
                Quyết định #{choicePath.length + 1}
              </span>
              {currentNode.sceneTheme && currentNode.sceneTheme !== 'default' && (
                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  {currentNode.sceneTheme}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="player-history-btn"
              onClick={() => {
                sounds.playClick();
                setShowHistory(true);
              }}
              title="Xem các lựa chọn đã đi"
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Lịch Sử ({choicePath.length})</span>
            </button>

            <button
              id="player-restart-btn"
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn bắt đầu lại câu chuyện từ đầu?')) {
                  handleRestart();
                }
              }}
              title="Chơi lại từ đầu"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Saved Progress Prompt Banner */}
      {savedProgressPrompt && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2.5 text-xs text-indigo-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Phát hiện tiến trình chơi dở dang ({savedProgressPrompt.choicePath.length} quyết định).</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="prompt-resume-btn"
                onClick={handleResumeProgress}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Tiếp tục chơi dở
              </button>
              <button
                onClick={() => setSavedProgressPrompt(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Narrative Stage */}
      <main className="max-w-3xl mx-auto px-4 mt-6">
        <div className={`transition-opacity duration-200 ${transitioning ? 'opacity-20 scale-[0.99]' : 'opacity-100 scale-100'}`}>
          
          {/* Scene Header Card */}
          <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl overflow-hidden mb-6">
            
            {/* Scene Image */}
            {currentNode.image && (
              <div className="relative h-60 sm:h-80 w-full overflow-hidden bg-slate-950">
                <img 
                  src={currentNode.image} 
                  alt={currentNode.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                
                {/* Node Title Badge */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-amber-300 backdrop-blur-md">
                      {currentNode.isStart ? 'Khởi Đầu Câu Chuyện' : 'Tình Huống'}
                    </span>
                    {currentNode.hasJumpscare && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-700 text-rose-300 flex items-center gap-1 backdrop-blur-md">
                        <Skull className="w-3 h-3" />
                        <span>Kinh Dị</span>
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white mt-2 drop-shadow-md">
                    {renderStoryText(currentNode.title, { playerName })}
                  </h1>
                </div>
              </div>
            )}

            {!currentNode.image && (
              <div className="p-6 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-300">
                    {currentNode.isStart ? 'Khởi Đầu Câu Chuyện' : 'Tình Huống'}
                  </span>
                  {currentNode.hasJumpscare && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-700 text-rose-300 flex items-center gap-1">
                      <Skull className="w-3 h-3" />
                      <span>Kinh Dị</span>
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-3">
                  {renderStoryText(currentNode.title, { playerName })}
                </h1>
              </div>
            )}

            {/* Character Speaker Card (Deep Storytelling) */}
            {(currentNode.characterName || currentNode.characterAvatar) && (
              <div className="mx-6 sm:mx-8 mt-4 p-3.5 rounded-2xl bg-slate-950/70 border border-indigo-500/30 flex items-center gap-3.5">
                {currentNode.characterAvatar ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-indigo-500 shrink-0">
                    <img 
                      src={currentNode.characterAvatar} 
                      alt={currentNode.characterName || 'Character'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-300 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentNode.characterName || 'Nhân vật bí ẩn'}</span>
                    {currentNode.characterRole && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                        {currentNode.characterRole}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Đang quan sát và trò chuyện cùng bạn...
                  </p>
                </div>
              </div>
            )}

            {/* Story Text Content with Interactive Reveal */}
            <div 
              onClick={handleSkipText}
              className="p-6 sm:p-8 pt-5 cursor-pointer relative group"
              title="Nhấn để hiện toàn bộ chữ ngay"
            >
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-serif whitespace-pre-line selection:bg-indigo-600 selection:text-white">
                {fullTextRef.current.slice(0, displayedTextLength)}
                {!isTextComplete && (
                  <span className="inline-block w-2 h-5 bg-amber-400 ml-1 animate-pulse" />
                )}
              </p>

              {!isTextComplete && (
                <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity">
                  <FastForward className="w-3 h-3" />
                  <span>Nhấn vào đoạn văn để hiện toàn bộ</span>
                </div>
              )}
            </div>

            {/* Inspectable Clue / Artifact Action Card (Deep Storytelling) */}
            {currentNode.inspectItemName && (
              <div className="mx-6 sm:mx-8 mb-6 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {currentNode.inspectItemImage ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-500/50 bg-slate-950 shrink-0">
                      <img 
                        src={currentNode.inspectItemImage} 
                        alt={currentNode.inspectItemName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-400 shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      Phát hiện manh mối / đồ vật:
                    </span>
                    <h4 className="text-sm font-black text-white">
                      {currentNode.inspectItemName}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setInspectModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem Chi Tiết</span>
                </button>
              </div>
            )}

          </div>

          {/* Interactive Choices Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">
                  Bạn sẽ quyết định làm gì tiếp theo?
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Mẹo: Bấm phím 1, 2, 3... để chọn nhanh
              </span>
            </div>

            {currentNode.options && currentNode.options.length > 0 ? (
              <div className="space-y-3.5">
                {currentNode.options.map((option, index) => (
                  <button
                    key={option.id}
                    id={`choice-option-${index + 1}`}
                    onClick={() => handleSelectOption(option)}
                    onMouseEnter={() => sounds.playChoiceHover()}
                    disabled={transitioning}
                    className="w-full text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 hover:border-amber-400/70 hover:shadow-xl hover:shadow-amber-500/10 group transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden"
                  >
                    {/* Glowing highlight indicator on hover */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-transparent group-hover:bg-gradient-to-b group-hover:from-indigo-500 group-hover:to-amber-500 transition-colors" />

                    <div className="flex items-center gap-4 pl-1">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-amber-600 text-slate-300 group-hover:text-white text-xs font-black flex items-center justify-center transition-all shrink-0 shadow-sm">
                        {index + 1}
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-slate-200 group-hover:text-white transition-colors leading-relaxed">
                        {renderStoryText(option.text, { playerName })}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-800/80 group-hover:bg-amber-500/20 text-slate-500 group-hover:text-amber-400 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-center text-amber-300 text-xs">
                <HelpCircle className="w-6 h-6 mx-auto mb-2 opacity-80" />
                <span>Node này chưa có lựa chọn nào được cấu hình trong CMS.</span>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Choice History Drawer */}
      <ChoiceHistoryDrawer
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        choicePath={choicePath}
        storyTitle={story.title}
      />

      {/* Inspect Item Modal */}
      {currentNode.inspectItemName && (
        <InspectItemModal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          itemName={currentNode.inspectItemName}
          itemImage={currentNode.inspectItemImage}
          itemDescription={currentNode.inspectItemDescription}
        />
      )}

    </div>
  );
};
