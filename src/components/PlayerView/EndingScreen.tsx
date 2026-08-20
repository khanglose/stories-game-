import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  RotateCcw, 
  ArrowLeft, 
  Sparkles, 
  Skull, 
  Key, 
  Scale, 
  History, 
  Share2, 
  CheckCircle2 
} from 'lucide-react';
import { ChoiceStep, EndingType, StoryNode } from '../../types';
import { sounds } from '../../services/audio';
import { usePlayer } from '../../context/PlayerContext';
import { renderStoryText } from '../../utils/template';

interface EndingScreenProps {
  storyTitle: string;
  endingNode: StoryNode;
  choicePath: ChoiceStep[];
  onRestart: () => void;
  onBackToLibrary: () => void;
  onOpenHistory: () => void;
}

export const EndingScreen: React.FC<EndingScreenProps> = ({
  storyTitle,
  endingNode,
  choicePath,
  onRestart,
  onBackToLibrary,
  onOpenHistory,
}) => {
  const { playerName } = usePlayer();
  const endingType: EndingType = endingNode.endingType || 'NEUTRAL';

  // Interpolate dynamic variables for rendering
  const renderedEndingTitle = renderStoryText(endingNode.endingTitle || endingNode.title, { playerName });
  const renderedContent = renderStoryText(endingNode.content, { playerName });

  useEffect(() => {
    if (endingType === 'VICTORY') {
      sounds.playVictoryFanfare();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#6366f1', '#38bdf8', '#10b981'],
        });
      } catch (e) {}
    } else if (endingType === 'SECRET') {
      sounds.playSecretSound();
      try {
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#c084fc', '#e879f9', '#38bdf8'],
        });
      } catch (e) {}
    } else if (endingType === 'TRAGIC') {
      sounds.playTragicSound();
    } else {
      sounds.playChoiceSelected();
    }
  }, [endingType]);

  const getEndingMeta = () => {
    switch (endingType) {
      case 'VICTORY':
        return {
          title: 'CHIẾN THẮNG & THOÁT NẠN',
          badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
          icon: <Trophy className="w-5 h-5 text-amber-400" />,
          glowClass: 'from-emerald-500/20 via-amber-500/15 to-transparent',
          borderClass: 'border-emerald-500/40',
        };
      case 'SECRET':
        return {
          title: 'KẾT THÚC BÍ MẬT ẨN',
          badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
          icon: <Key className="w-5 h-5 text-purple-400" />,
          glowClass: 'from-purple-500/20 via-pink-500/15 to-transparent',
          borderClass: 'border-purple-500/40',
        };
      case 'TRAGIC':
        return {
          title: 'KẾT CỤC BI THẢM',
          badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
          icon: <Skull className="w-5 h-5 text-rose-400" />,
          glowClass: 'from-rose-500/20 via-slate-900 to-transparent',
          borderClass: 'border-rose-500/40',
        };
      default:
        return {
          title: 'KẾT THÚC TRUNG LẬP',
          badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60',
          icon: <Scale className="w-5 h-5 text-indigo-400" />,
          glowClass: 'from-indigo-500/20 via-slate-900 to-transparent',
          borderClass: 'border-indigo-500/40',
        };
    }
  };

  const meta = getEndingMeta();

  return (
    <div className="w-full max-w-3xl mx-auto my-8 px-4 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Container card */}
      <div className={`relative rounded-3xl bg-slate-900/95 border ${meta.borderClass} shadow-2xl p-6 sm:p-10 overflow-hidden`}>
        
        {/* Glow ambient background */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b ${meta.glowClass} blur-3xl pointer-events-none`} />

        {/* Top Ending Badge */}
        <div className="flex flex-col items-center text-center relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-md ${meta.badgeClass} mb-4`}>
            {meta.icon}
            <span>{meta.title}</span>
          </div>

          <span className="text-xs text-slate-400 font-medium tracking-wide uppercase mb-1">
            {storyTitle}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {renderedEndingTitle}
          </h2>
        </div>

        {/* Scene Image if available */}
        {endingNode.image && (
          <div className="my-6 rounded-2xl overflow-hidden border border-slate-800 shadow-xl max-h-72 w-full relative z-10">
            <img 
              src={endingNode.image} 
              alt={endingNode.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Narrative Epilogue Content */}
        <div className="my-6 p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-slate-200 text-sm sm:text-base leading-relaxed relative z-10 shadow-inner">
          <p className="whitespace-pre-line font-serif italic text-slate-200">
            "{renderedContent}"
          </p>
        </div>

        {/* Ending Saved / Achievement Notification */}
        <div className="mb-8 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between text-xs text-indigo-300 relative z-10">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Đã lưu kết thúc này vào <b>Bộ Sưu Tập Endings</b> của bạn!</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {choicePath.length} quyết định
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          <button
            id="ending-restart-btn"
            onClick={() => {
              sounds.playClick();
              onRestart();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi Lại Nhánh Khác</span>
          </button>

          <button
            id="ending-history-btn"
            onClick={() => {
              sounds.playClick();
              onOpenHistory();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span>Xem Lịch Sử Nhánh</span>
          </button>

          <button
            id="ending-back-library-btn"
            onClick={() => {
              sounds.playClick();
              onBackToLibrary();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thư Viện Truyện</span>
          </button>
        </div>

      </div>

    </div>
  );
};

