import React from 'react';
import { Play, Trophy, Users, BookOpen, Clock, Sparkles } from 'lucide-react';
import { Story, UnlockedEnding } from '../../types';
import { sounds } from '../../services/audio';

interface StoryCardProps {
  story: Story;
  userEndings: UnlockedEnding[];
  onSelectStory: (story: Story) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, userEndings, onSelectStory }) => {
  const storyUnlockedEndings = userEndings.filter((e) => e.storyId === story.id);

  // Genre badge color mapping
  const getGenreColor = (genre: string) => {
    switch (genre) {
      case 'Bí Ẩn / Kinh Dị':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'Khoa Học Viễn Tưởng':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60';
      case 'Kỳ Ảo / Phiêu Lưu':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      case 'Cyberpunk':
        return 'bg-pink-950/80 text-pink-300 border-pink-800/60';
      default:
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60';
    }
  };

  return (
    <div 
      id={`story-card-${story.id}`}
      className="group relative flex flex-col rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/50 shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-950/40"
    >
      {/* Thumbnail with overlay gradient */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img 
          src={story.thumbnail} 
          alt={story.title} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
        
        {/* Genre Pill */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-sm ${getGenreColor(story.genre)}`}>
            {story.genre}
          </span>
        </div>

        {/* Play count */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800/80 text-slate-300 text-xs backdrop-blur-md">
          <Users className="w-3 h-3 text-slate-400" />
          <span>{story.stats?.plays || 0} lượt chơi</span>
        </div>

        {/* Endings unlocked badge */}
        {storyUnlockedEndings.length > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-600/70 text-amber-300 text-xs font-semibold shadow-lg backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Đã mở {storyUnlockedEndings.length} Ending</span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
            {story.title}
          </h3>
          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {story.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {story.tags?.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            Tác giả: <span className="text-slate-300 font-semibold">{story.authorName || 'StoryVerse'}</span>
          </span>
          <button
            id={`play-story-btn-${story.id}`}
            onClick={() => {
              sounds.playChoiceSelected();
              onSelectStory(story);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-950/60 flex items-center gap-1.5 transition-all group-hover:scale-105 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Bắt Đầu Chơi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
