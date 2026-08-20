import React, { useState, useEffect } from 'react';
import { X, Play, RotateCcw, ChevronRight, Trophy, AlertCircle, ArrowLeft, User, Sparkles } from 'lucide-react';
import { Story, StoryNode, StoryOption } from '../../types';
import { sounds } from '../../services/audio';
import { renderStoryText } from '../../utils/template';

interface StoryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
  nodes: (StoryNode & { options?: StoryOption[] })[];
}

export const StoryPreviewModal: React.FC<StoryPreviewModalProps> = ({
  isOpen,
  onClose,
  story,
  nodes,
}) => {
  if (!isOpen) return null;

  const startNode = nodes.find((n) => n.isStart) || nodes[0];
  const [currentNodeId, setCurrentNodeId] = useState<string>(startNode?.id || '');
  const [history, setHistory] = useState<string[]>([]);
  const [testPlayerName, setTestPlayerName] = useState<string>('Minh');

  useEffect(() => {
    if (startNode) {
      setCurrentNodeId(startNode.id);
      setHistory([]);
    }
  }, [isOpen, startNode]);

  const currentNode = nodes.find((n) => n.id === currentNodeId);

  const handleSelectOption = (option: StoryOption) => {
    if (!option.nextNodeId) {
      alert('Lựa chọn này chưa được liên kết với node tiếp theo.');
      return;
    }
    sounds.playChoiceSelected();
    setHistory([...history, currentNodeId]);
    setCurrentNodeId(option.nextNodeId);
  };

  const handleRestart = () => {
    sounds.playClick();
    if (startNode) {
      setCurrentNodeId(startNode.id);
      setHistory([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-bold">
              PREVIEW MODE
            </span>
            <h2 className="text-sm font-bold text-white truncate max-w-sm">
              {story.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Chơi lại từ đầu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Variable Test Bar */}
        <div className="px-5 py-2.5 bg-indigo-950/40 border-b border-indigo-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Thử nghiệm biến <code className="px-1.5 py-0.5 rounded bg-indigo-900/60 text-amber-300">{"{{playerName}}"}</code>:</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <input
              id="test-player-name-input"
              type="text"
              value={testPlayerName}
              onChange={(e) => setTestPlayerName(e.target.value)}
              placeholder="Tên thử nghiệm..."
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-indigo-700/60 focus:border-indigo-400 text-xs font-bold text-white outline-none w-32"
            />
            {['Minh', 'An', 'KhangVan'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTestPlayerName(name)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Story Simulation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!currentNode ? (
            <div className="py-12 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm">Không tìm thấy Node khởi đầu hợp lệ.</p>
            </div>
          ) : (
            <div>
              {/* Scene Card */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl mb-6">
                {currentNode.image && (
                  <div className="h-48 w-full overflow-hidden">
                    <img 
                      src={currentNode.image} 
                      alt={currentNode.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentNode.type === 'ENDING'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    }`}>
                      {currentNode.type === 'ENDING' ? 'ENDING' : 'NODE'}
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {renderStoryText(currentNode.title, { playerName: testPlayerName })}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-serif whitespace-pre-line mt-3">
                    {renderStoryText(currentNode.content, { playerName: testPlayerName })}
                  </p>
                </div>
              </div>

              {/* Options or Ending */}
              {currentNode.type === 'ENDING' ? (
                <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-center space-y-3">
                  <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">
                    {renderStoryText(currentNode.endingTitle || 'Đã Đạt Kết Thúc!', { playerName: testPlayerName })}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Bạn đã đi qua {history.length} bước quyết định trong bản demo này.
                  </p>
                  <button
                    onClick={handleRestart}
                    className="mt-3 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
                  >
                    Chơi Lại Từ Đầu
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-2">
                    Lựa chọn trong tình huống này:
                  </span>
                  {currentNode.options && currentNode.options.length > 0 ? (
                    currentNode.options.map((opt, idx) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(opt)}
                        className="w-full text-left p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-850 flex items-center justify-between text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
                      >
                        <span>{idx + 1}. {renderStoryText(opt.text, { playerName: testPlayerName })}</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                      Chưa có lựa chọn nào cho node này.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số node: {nodes.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Đóng Preview
          </button>
        </div>
      </div>
    </div>
  );
};

