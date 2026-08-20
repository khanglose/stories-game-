import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Eye, 
  Plus, 
  Layers, 
  GitBranch, 
  Table, 
  Edit3, 
  Trash2, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { Story, StoryFullDetail, StoryGenre, StoryNode, StoryOption, StoryStatus } from '../../types';
import { api } from '../../services/api';
import { sounds } from '../../services/audio';
import { VisualFlowGraph } from './VisualFlowGraph';
import { NodeEditModal } from './NodeEditModal';
import { StoryPreviewModal } from './StoryPreviewModal';
import { ImageSelectorModal } from './ImageSelectorModal';
import { Image as ImageIcon } from 'lucide-react';

interface StoryEditorProps {
  storyId: string;
  onBack: () => void;
}

const GENRES: StoryGenre[] = [
  'Bí Ẩn / Kinh Dị',
  'Khoa Học Viễn Tưởng',
  'Kỳ Ảo / Phiêu Lưu',
  'Trinh Thám / Hình Sự',
  'Cyberpunk',
  'Đời Thường / Lãng Mạn',
];

export const StoryEditor: React.FC<StoryEditorProps> = ({ storyId, onBack }) => {
  const [story, setStory] = useState<StoryFullDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Metadata form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [genre, setGenre] = useState<string>('Bí Ẩn / Kinh Dị');
  const [tagsStr, setTagsStr] = useState('');
  const [showMetadataPanel, setShowMetadataPanel] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  // Modals
  const [editingNode, setEditingNode] = useState<(StoryNode & { options?: StoryOption[] }) | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);

  const fetchStoryDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStoryDetail(storyId);
      setStory(data);
      setTitle(data.title);
      setDescription(data.description);
      setThumbnail(data.thumbnail);
      setGenre(data.genre);
      setTagsStr(data.tags?.join(', ') || '');
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết câu chuyện.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoryDetail();
  }, [storyId]);

  // Save story metadata
  const handleSaveMetadata = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    sounds.playClick();
    try {
      const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
      await api.updateStory(storyId, {
        title,
        description,
        thumbnail,
        genre,
        tags,
      });
      setSuccessMsg('Đã lưu thông tin câu chuyện thành công!');
      fetchStoryDetail();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu thông tin.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async () => {
    if (!story) return;
    sounds.playClick();
    const newStatus: StoryStatus = story.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setSaving(true);
    setError(null);
    try {
      const res = await api.updateStoryStatus(storyId, newStatus);
      setSuccessMsg(res.message);
      fetchStoryDetail();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Không thể thay đổi trạng thái xuất bản.');
    } finally {
      setSaving(false);
    }
  };

  // Add new node
  const handleAddNode = async (type: 'NORMAL' | 'ENDING') => {
    sounds.playClick();
    try {
      const created = await api.createNode(storyId, {
        title: type === 'ENDING' ? 'Kết Thúc Mới' : 'Tình Huống Mới',
        content: type === 'ENDING' ? 'Mô tả diễn biến kết cục...' : 'Mô tả tình huống...',
        type,
        endingType: type === 'ENDING' ? 'VICTORY' : undefined,
        position: {
          x: 100 + Math.floor(Math.random() * 400),
          y: 100 + Math.floor(Math.random() * 300),
        },
      });
      await fetchStoryDetail();
      setEditingNode(created);
    } catch (err: any) {
      setError(err.message || 'Lỗi tạo node mới.');
    }
  };

  // Delete node
  const handleDeleteNode = async (nodeId: string) => {
    try {
      await api.deleteNode(storyId, nodeId);
      fetchStoryDetail();
    } catch (err: any) {
      setError(err.message || 'Lỗi xóa node.');
    }
  };

  // Update node position in visual graph
  const handleUpdateNodePosition = async (nodeId: string, position: { x: number; y: number }) => {
    try {
      await api.updateNode(storyId, nodeId, { position });
    } catch (err) {
      console.error('Failed to update node position:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Đang mở trình biên soạn câu chuyện...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Không tìm thấy câu chuyện.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-xs text-white">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const nodes = story.nodes || [];
  const startNode = nodes.find((n) => n.isStart);
  const endingNodes = nodes.filter((n) => n.type === 'ENDING');

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Navigation & Status Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Quay lại Quản lý Story"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                story.status === 'PUBLISHED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}>
                {story.status === 'PUBLISHED' ? '● ĐÃ XUẤT BẢN (PUBLISHED)' : '○ BẢN NHÁP (DRAFT)'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {nodes.length} Nodes ({endingNodes.length} Endings)
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              {story.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="editor-toggle-meta-btn"
            onClick={() => setShowMetadataPanel(!showMetadataPanel)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showMetadataPanel ? 'Ẩn Metadata' : 'Sửa Metadata'}</span>
          </button>

          <button
            id="editor-preview-btn"
            onClick={() => {
              sounds.playClick();
              setShowPreview(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Chơi Thử (Preview)</span>
          </button>

          <button
            id="editor-publish-toggle-btn"
            onClick={handleTogglePublish}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              story.status === 'PUBLISHED'
                ? 'bg-amber-950/80 border border-amber-700/80 text-amber-300 hover:bg-amber-900/80'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{story.status === 'PUBLISHED' ? 'Gỡ Xuất Bản (Unpublish)' : 'Xuất Bản Cho Player (Publish)'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Metadata Collapsible Panel */}
      {showMetadataPanel && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Chỉnh Sửa Thông Tin Story</h3>
            <button
              onClick={handleSaveMetadata}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Đang Lưu...' : 'Lưu Metadata'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tiêu Đề Story</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Thể Loại (Genre)</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs outline-none focus:border-indigo-500"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Ảnh Thumbnail (URL)</label>
                <button
                  type="button"
                  onClick={() => setShowThumbnailSelector(true)}
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Chọn từ Thư Viện Ảnh</span>
                </button>
              </div>
              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (cách nhau bằng dấu phẩy)</label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="Bí ẩn, Sinh tồn, Nhiều kết thúc"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mô Tả Tóm Tắt (Synopsis)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs outline-none focus:border-indigo-500 resize-y"
              />
            </div>
          </div>
        </div>
      )}

      {/* Available Variables Banner for Story Authors */}
      <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-300 font-bold">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Biến Động Cốt Truyện (Dynamic Story Variables):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
            <code className="text-amber-300 font-mono font-bold">{"{{playerName}}"}</code>
            <span className="text-[11px] text-slate-400">→ Tên người chơi</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
            <code className="text-indigo-300 font-mono font-bold">{"{{playerAge}}"}</code>
            <span className="text-[11px] text-slate-400">→ Tuổi nhân vật</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
            <code className="text-indigo-300 font-mono font-bold">{"{{playerMoney}}"}</code>
            <span className="text-[11px] text-slate-400">→ Tiền / Tài sản</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 hidden lg:inline">
          Dùng trong Tiêu đề, Nội dung hoặc Lựa chọn. Tự động thế chỗ khi Player đọc.
        </span>
      </div>

      {/* Editor View Modes & Quick Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            id="switch-view-graph-btn"
            onClick={() => {
              sounds.playClick();
              setViewMode('graph');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'graph'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Sơ Đồ Flowchart Graph</span>
          </button>

          <button
            id="switch-view-list-btn"
            onClick={() => {
              sounds.playClick();
              setViewMode('list');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Danh Sách Dạng Bảng</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddNode('NORMAL')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Thêm Tình Huống</span>
          </button>
          <button
            onClick={() => handleAddNode('ENDING')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Thêm Ending</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {viewMode === 'graph' ? (
        <VisualFlowGraph
          nodes={nodes}
          onEditNode={(node) => setEditingNode(node)}
          onDeleteNode={handleDeleteNode}
          onAddNode={handleAddNode}
          onUpdateNodePosition={handleUpdateNodePosition}
        />
      ) : (
        /* List Mode Table */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Node ID & Tên</th>
                <th className="py-3.5 px-4">Loại Node</th>
                <th className="py-3.5 px-4">Nội Dung Tình Huống</th>
                <th className="py-3.5 px-4">Lựa Chọn (Options)</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {nodes.map((node) => (
                <tr key={node.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {node.isStart && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                          START
                        </span>
                      )}
                      <span className="font-bold text-white">{node.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{node.id}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      node.type === 'ENDING'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    }`}>
                      {node.type === 'ENDING' ? `ENDING (${node.endingType || 'NEUTRAL'})` : 'NORMAL'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="truncate text-slate-400">{node.content}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    {node.type === 'NORMAL' ? (
                      <span className="font-semibold text-indigo-400">
                        {node.options?.length || 0} lựa chọn
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[11px]">Điểm kết thúc câu chuyện</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setEditingNode(node);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          if (window.confirm(`Xóa node "${node.title}"?`)) {
                            handleDeleteNode(node.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Node Edit Modal */}
      {editingNode && (
        <NodeEditModal
          isOpen={!!editingNode}
          onClose={() => setEditingNode(null)}
          storyId={storyId}
          node={editingNode}
          allNodes={nodes}
          onNodeUpdated={fetchStoryDetail}
        />
      )}

      {/* Live Preview Modal */}
      {showPreview && (
        <StoryPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          story={story}
          nodes={nodes}
        />
      )}

      {/* Thumbnail Selector Modal */}
      <ImageSelectorModal
        isOpen={showThumbnailSelector}
        onClose={() => setShowThumbnailSelector(false)}
        onSelect={(selectedUrl) => setThumbnail(selectedUrl)}
        initialUrl={thumbnail}
        title="Chọn Ảnh Thumbnail Cho Câu Chuyện"
      />

    </div>
  );
};
