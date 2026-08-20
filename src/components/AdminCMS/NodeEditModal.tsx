import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Image as ImageIcon, 
  Flag, 
  Trophy, 
  Skull, 
  Key, 
  Scale, 
  Sparkles, 
  Check, 
  ExternalLink,
  Variable,
  Zap,
  Volume2,
  Eye,
  User,
  Package,
  Palette
} from 'lucide-react';
import { EndingType, JumpscareSound, JumpscareType, NodeType, StoryNode, StoryOption } from '../../types';
import { api } from '../../services/api';
import { sounds } from '../../services/audio';
import { ImageSelectorModal } from './ImageSelectorModal';
import { DeviceImagePicker } from '../DeviceImagePicker';

interface NodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  node: (StoryNode & { options?: StoryOption[] }) | null;
  allNodes: StoryNode[];
  onNodeUpdated: () => void;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  isOpen,
  onClose,
  storyId,
  node,
  allNodes,
  onNodeUpdated,
}) => {
  if (!isOpen || !node) return null;

  // Basic Node Info
  const [title, setTitle] = useState(node.title || '');
  const [content, setContent] = useState(node.content || '');
  const [image, setImage] = useState(node.image || '');
  const [type, setType] = useState<NodeType>(node.type || 'NORMAL');
  const [endingType, setEndingType] = useState<EndingType>(node.endingType || 'NEUTRAL');
  const [endingTitle, setEndingTitle] = useState(node.endingTitle || '');
  const [isStart, setIsStart] = useState(!!node.isStart);
  const [sceneTheme, setSceneTheme] = useState<'horror' | 'cyber' | 'fantasy' | 'mystery' | 'default'>(
    node.sceneTheme || 'default'
  );

  // Jumpscare / Horror Controls
  const [hasJumpscare, setHasJumpscare] = useState(!!node.hasJumpscare);
  const [jumpscareType, setJumpscareType] = useState<JumpscareType>(node.jumpscareType || 'SCREAM_SHAKE');
  const [jumpscareSound, setJumpscareSound] = useState<JumpscareSound>(node.jumpscareSound || 'screech');
  const [jumpscareImage, setJumpscareImage] = useState(node.jumpscareImage || '');
  const [jumpscareIntensity, setJumpscareIntensity] = useState<'mild' | 'intense' | 'extreme'>(
    node.jumpscareIntensity || 'intense'
  );
  const [jumpscareText, setJumpscareText] = useState(node.jumpscareText || '');
  const [testingJumpscare, setTestingJumpscare] = useState(false);

  // Deep Story Media (Character & Item Clue)
  const [characterName, setCharacterName] = useState(node.characterName || '');
  const [characterAvatar, setCharacterAvatar] = useState(node.characterAvatar || '');
  const [characterRole, setCharacterRole] = useState(node.characterRole || '');
  const [inspectItemName, setInspectItemName] = useState(node.inspectItemName || '');
  const [inspectItemImage, setInspectItemImage] = useState(node.inspectItemImage || '');
  const [inspectItemDescription, setInspectItemDescription] = useState(node.inspectItemDescription || '');

  // Options state
  const [options, setOptions] = useState<StoryOption[]>(node.options || []);
  const [newOptionText, setNewOptionText] = useState('');
  const [newOptionNextNode, setNewOptionNextNode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image Selector Modal State & Target
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [imageSelectorTarget, setImageSelectorTarget] = useState<'scene' | 'jumpscare' | 'character' | 'item'>('scene');

  const handleSaveNode = async () => {
    setSaving(true);
    setError(null);
    sounds.playClick();
    try {
      await api.updateNode(storyId, node.id, {
        title,
        content,
        image,
        type,
        endingType: type === 'ENDING' ? endingType : undefined,
        endingTitle: type === 'ENDING' ? (endingTitle || title) : undefined,
        isStart,
        sceneTheme,
        // Jumpscare
        hasJumpscare,
        jumpscareType: hasJumpscare ? jumpscareType : undefined,
        jumpscareSound: hasJumpscare ? jumpscareSound : undefined,
        jumpscareImage: hasJumpscare ? jumpscareImage : undefined,
        jumpscareIntensity: hasJumpscare ? jumpscareIntensity : undefined,
        jumpscareText: hasJumpscare ? jumpscareText : undefined,
        // Deep Story
        characterName: characterName.trim() || undefined,
        characterAvatar: characterAvatar.trim() || undefined,
        characterRole: characterRole.trim() || undefined,
        inspectItemName: inspectItemName.trim() || undefined,
        inspectItemImage: inspectItemImage.trim() || undefined,
        inspectItemDescription: inspectItemDescription.trim() || undefined,
      });

      onNodeUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu thay đổi.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOption = async () => {
    if (!newOptionText.trim()) return;
    sounds.playClick();
    try {
      const created = await api.createOption(node.id, {
        text: newOptionText.trim(),
        nextNodeId: newOptionNextNode,
        order: options.length + 1,
      });
      setOptions([...options, created]);
      setNewOptionText('');
      setNewOptionNextNode('');
      onNodeUpdated();
    } catch (err: any) {
      setError(err.message || 'Lỗi thêm option.');
    }
  };

  const handleUpdateOption = async (optionId: string, updates: Partial<StoryOption>) => {
    try {
      const updated = await api.updateOption(optionId, updates);
      setOptions(options.map((o) => (o.id === optionId ? updated : o)));
      onNodeUpdated();
    } catch (err: any) {
      setError(err.message || 'Lỗi cập nhật option.');
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    sounds.playClick();
    try {
      await api.deleteOption(optionId);
      setOptions(options.filter((o) => o.id !== optionId));
      onNodeUpdated();
    } catch (err: any) {
      setError(err.message || 'Lỗi xóa option.');
    }
  };

  const handleInsertPlayerName = () => {
    sounds.playClick();
    setContent((prev) => prev + ' {{playerName}}');
  };

  const handleTestJumpscare = () => {
    sounds.playJumpscare(jumpscareSound);
    setTestingJumpscare(true);
    setTimeout(() => {
      setTestingJumpscare(false);
    }, 1500);
  };

  const openImagePicker = (target: 'scene' | 'jumpscare' | 'character' | 'item') => {
    sounds.playClick();
    setImageSelectorTarget(target);
    setShowImageSelector(true);
  };

  const handleImageSelected = (selectedUrl: string) => {
    if (imageSelectorTarget === 'scene') setImage(selectedUrl);
    if (imageSelectorTarget === 'jumpscare') setJumpscareImage(selectedUrl);
    if (imageSelectorTarget === 'character') setCharacterAvatar(selectedUrl);
    if (imageSelectorTarget === 'item') setInspectItemImage(selectedUrl);
  };

  const otherNodes = allNodes.filter((n) => n.id !== node.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Testing Jumpscare Flash Overlay */}
        {testingJumpscare && (
          <div className="absolute inset-0 z-50 bg-rose-950/90 flex flex-col items-center justify-center p-6 text-center animate-ping duration-300">
            {jumpscareImage ? (
              <img 
                src={jumpscareImage} 
                alt="Jumpscare" 
                referrerPolicy="no-referrer"
                className="max-h-64 rounded-2xl object-cover shadow-2xl border-4 border-rose-500 scale-125" 
              />
            ) : (
              <Skull className="w-28 h-28 text-rose-500 animate-bounce" />
            )}
            <h2 className="text-2xl font-black text-rose-400 mt-4 tracking-widest uppercase">
              {jumpscareText || 'JUMPSCARE TRIGGERED!'}
            </h2>
          </div>
        )}

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              type === 'ENDING' 
                ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                : isStart
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
            }`}>
              {type === 'ENDING' ? 'Node ENDING' : isStart ? 'Node START' : 'Node NORMAL'}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-sm">
              Chỉnh Sửa Node: {title || 'Chưa đặt tên'}
            </h2>
          </div>

          <button
            id="close-node-modal-btn"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Node Type & Properties */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Loại Node:
              </label>
              <select
                id="node-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as NodeType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="NORMAL">NORMAL (Tình huống chuyển tiếp)</option>
                <option value="ENDING">ENDING (Kết thúc câu chuyện)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Palette className="w-3 h-3 text-indigo-400" />
                <span>Bầu Không Khí:</span>
              </label>
              <select
                value={sceneTheme}
                onChange={(e) => setSceneTheme(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="default">Mặc định (Dark Neutral)</option>
                <option value="horror">Kinh Dị (Horror Crimson)</option>
                <option value="mystery">Huyền Bí (Midnight Mystery)</option>
                <option value="fantasy">Huyền Ảo (Golden Fantasy)</option>
                <option value="cyber">Công Nghệ (Cyber Neon)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300 select-none">
                <input
                  id="node-is-start-checkbox"
                  type="checkbox"
                  checked={isStart}
                  onChange={(e) => setIsStart(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span>Node Khởi Đầu (START)</span>
              </label>
            </div>
          </div>

          {/* If Ending -> Ending specifics */}
          {type === 'ENDING' && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1.5">
                    Phân Loại Ending:
                  </label>
                  <select
                    id="ending-type-select"
                    value={endingType}
                    onChange={(e) => setEndingType(e.target.value as EndingType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-800/60 text-amber-200 text-xs focus:border-amber-500 outline-none cursor-pointer"
                  >
                    <option value="VICTORY">VICTORY (Chiến Thắng / Hoàn Thành)</option>
                    <option value="TRAGIC">TRAGIC (Bi Kịch / Thất Bại)</option>
                    <option value="SECRET">SECRET (Bí Mật Ẩn Giấu)</option>
                    <option value="NEUTRAL">NEUTRAL (Trung Lập / Kết Mở)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1.5">
                    Tên Danh Hiệu Ending:
                  </label>
                  <input
                    id="ending-title-input"
                    type="text"
                    value={endingTitle}
                    onChange={(e) => setEndingTitle(e.target.value)}
                    placeholder="Ví dụ: Kẻ Sống Sót Duy Nhất"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-amber-800/60 text-white text-xs focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Tiêu Đề Node:
            </label>
            <input
              id="node-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Căn phòng bí mật..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Content & Dynamic Variable Helper */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Nội Dung Diễn Biến Cốt Truyện:
              </label>
              <button
                type="button"
                onClick={handleInsertPlayerName}
                className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Chèn biến tên người chơi {{playerName}}"
              >
                <Variable className="w-3 h-3 text-amber-400" />
                <span>+ Chèn biến {"{{playerName}}"}</span>
              </button>
            </div>
            <textarea
              id="node-content-input"
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung tình huống hoặc kết cục tại đây. Sử dụng {{playerName}} để cá nhân hóa theo tên người chơi..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 outline-none leading-relaxed resize-y"
            />
          </div>

          {/* ==================================================== */}
          {/* JUMPSCARE / HORROR EFFECT SECTION (USER REQUEST) */}
          {/* ==================================================== */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/25 border border-rose-800/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                  Hiệu Ứng Kinh Dị / Jumpscare
                </h3>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasJumpscare}
                  onChange={(e) => setHasJumpscare(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-rose-800 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-bold text-rose-300">
                  Kích hoạt Jumpscare khi vào Node này
                </span>
              </label>
            </div>

            {hasJumpscare && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-300 mb-1">
                      Kiểu Hiệu Ứng:
                    </label>
                    <select
                      value={jumpscareType}
                      onChange={(e) => setJumpscareType(e.target.value as JumpscareType)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-rose-800/60 text-xs text-rose-100 outline-none cursor-pointer"
                    >
                      <option value="SCREAM_SHAKE">Rung Lắc Dữ Dội & Chớp Giật (Scream Shake)</option>
                      <option value="GHOST_POPUP">Quái Vật / Bóng Ma Cận Cảnh (Ghost Popup)</option>
                      <option value="BLOOD_VIGNETTE">Viền Máu Loang & Tim Đập Dồn Dập (Blood Vignette)</option>
                      <option value="GLITCH_STATIC">Nhiễu Sóng Ma Quái VHS (Glitch Static)</option>
                      <option value="DARK_PULSE">Màn Tối Vụt Tắt & Âm Thì Thầm (Dark Pulse)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-300 mb-1">
                      Âm Thanh Kinh Dị:
                    </label>
                    <select
                      value={jumpscareSound}
                      onChange={(e) => setJumpscareSound(e.target.value as JumpscareSound)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-rose-800/60 text-xs text-rose-100 outline-none cursor-pointer"
                    >
                      <option value="screech">Tiếng Rít Xé Màng Nhĩ (Screech)</option>
                      <option value="scream">Tiếng Thét Kinh Hoàng (Scream)</option>
                      <option value="heartbeat">Nhịp Tim Đập Dồn Dập (Heartbeat)</option>
                      <option value="glitch">Nhiễu Sóng Trắng Static (Glitch)</option>
                      <option value="thud">Chấn Động Nặng Nề Sub-bass (Thud)</option>
                      <option value="whisper">Thì Thầm Rùng Rợn (Whisper)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-300 mb-1">
                      Mức Độ Đe Dọa:
                    </label>
                    <select
                      value={jumpscareIntensity}
                      onChange={(e) => setJumpscareIntensity(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-rose-800/60 text-xs text-rose-100 outline-none cursor-pointer"
                    >
                      <option value="mild">Nhẹ Nhàng (Hồi hộp)</option>
                      <option value="intense">Mạnh Mẽ (Giật mình thực sự)</option>
                      <option value="extreme">Cực Đại (Ám ảnh kinh hoàng)</option>
                    </select>
                  </div>
                </div>

                {/* Jumpscare Image from Collection or URL */}
                <div>
                  {/* Jumpscare Image Picker */}
                  <div className="pt-2">
                    <DeviceImagePicker
                      value={jumpscareImage}
                      onChange={(url) => setJumpscareImage(url)}
                      label="Hình Ảnh Hiện Ra Đột Ngột (Jumpscare):"
                      helperText="Chọn từ bộ sưu tập điện thoại hoặc máy tính"
                      aspectRatio="square"
                    />

                    <div className="flex items-center justify-between mt-2">
                      <button
                        type="button"
                        onClick={() => openImagePicker('jumpscare')}
                        className="px-2.5 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-800 text-rose-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Chọn từ Thư Viện Mẫu Có Sẵn</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleTestJumpscare}
                        className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all shadow-md"
                        title="Xem thử cách hiệu ứng jumpscare kích hoạt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Thử Nghiệm Hiệu Ứng</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* DEEP STORY ELEMENTS (COLLECTION INTEGRATION) */}
          {/* ==================================================== */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Chiều Sâu Cốt Truyện & Hình Ảnh Từ Bộ Sưu Tập Điện Thoại
              </h3>
            </div>

            {/* 1. Scene Background Image */}
            <div className="space-y-2">
              <DeviceImagePicker
                value={image}
                onChange={(url) => setImage(url)}
                label="Hình Ảnh Bối Cảnh Chính (Bản Đồ / Căn Phòng / Ngoại Cảnh):"
                helperText="Tải trực tiếp từ điện thoại - lưu ngay"
                aspectRatio="video"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => openImagePicker('scene')}
                  className="text-[11px] text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Hoặc chọn từ kho ảnh có sẵn</span>
                </button>
              </div>
            </div>

            {/* 2. Character Speaker Portrait */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-cyan-400" />
                  <span>Nhân Vật Đối Thoại / Xuất Hiện:</span>
                </label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Tên nhân vật (vd: Giáo sư William, Bóng đen bí ẩn...)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                />
              </div>

              <DeviceImagePicker
                value={characterAvatar}
                onChange={(url) => setCharacterAvatar(url)}
                label="Ảnh Chân Dung Nhân Vật (Từ Bộ Sưu Tập Điện Thoại):"
                aspectRatio="avatar"
              />
            </div>

            {/* 3. Inspectable Clue / Artifact */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3 text-amber-400" />
                  <span>Manh Mối / Vật Phẩm Thu Thập:</span>
                </label>
                <input
                  type="text"
                  value={inspectItemName}
                  onChange={(e) => setInspectItemName(e.target.value)}
                  placeholder="Tên vật phẩm (vd: Cuốn nhật ký ố vàng, Chìa khóa đồng...)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                />
              </div>

              <DeviceImagePicker
                value={inspectItemImage}
                onChange={(url) => setInspectItemImage(url)}
                label="Hình Ảnh Manh Mối / Vật Phẩm (Từ Bộ Sưu Tập):"
                aspectRatio="square"
              />
            </div>
          </div>

          {/* Options Management (Only for NORMAL nodes) */}
          {type === 'NORMAL' && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Các Lựa Chọn Nhánh Đi Tiếp ({options.length}):</span>
                </h3>
              </div>

              {/* Existing Options */}
              <div className="space-y-2">
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleUpdateOption(opt.id, { text: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                        placeholder="Văn bản lựa chọn..."
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteOption(opt.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Xóa lựa chọn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        Dẫn tới Node:
                      </span>
                      <select
                        value={opt.nextNodeId || ''}
                        onChange={(e) => handleUpdateOption(opt.id, { nextNodeId: e.target.value })}
                        className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-indigo-300 outline-none cursor-pointer"
                      >
                        <option value="">-- Chưa liên kết --</option>
                        {otherNodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            [{n.type}] {n.title} {n.hasJumpscare ? '⚡ [Jumpscare]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Option Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 space-y-3">
                <p className="text-[11px] font-semibold text-slate-400">Thêm lựa chọn mới:</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Nhập nội dung lựa chọn (vd: Đi vào ngôi nhà hoang...)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none"
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={newOptionNextNode}
                      onChange={(e) => setNewOptionNextNode(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 outline-none cursor-pointer"
                    >
                      <option value="">-- Chọn Node Đích Đến --</option>
                      {otherNodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          [{n.type}] {n.title} {n.hasJumpscare ? '⚡ [Jumpscare]' : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddOption}
                      disabled={!newOptionText.trim()}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {hasJumpscare && <span className="text-rose-400 font-bold">⚡ Jumpscare đang bật</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveNode}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-950/60 flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </div>
      </div>

      {/* Image Selector Modal */}
      <ImageSelectorModal
        isOpen={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelect={handleImageSelected}
        initialUrl={
          imageSelectorTarget === 'scene'
            ? image
            : imageSelectorTarget === 'jumpscare'
            ? jumpscareImage
            : imageSelectorTarget === 'character'
            ? characterAvatar
            : inspectItemImage
        }
      />
    </div>
  );
};
