import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Trophy, 
  ArrowRight, 
  Flag, 
  Sparkles, 
  Move,
  Layers
} from 'lucide-react';
import { StoryNode, StoryOption } from '../../types';
import { sounds } from '../../services/audio';

interface VisualFlowGraphProps {
  nodes: (StoryNode & { options?: StoryOption[] })[];
  onEditNode: (node: StoryNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddNode: (type: 'NORMAL' | 'ENDING') => void;
  onUpdateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
}

export const VisualFlowGraph: React.FC<VisualFlowGraphProps> = ({
  nodes,
  onEditNode,
  onDeleteNode,
  onAddNode,
  onUpdateNodePosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Sync positions from nodes props
  useEffect(() => {
    const posMap: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, idx) => {
      posMap[n.id] = n.position || {
        x: 100 + (idx % 3) * 320,
        y: 80 + Math.floor(idx / 3) * 260,
      };
    });
    setLocalPositions(posMap);
  }, [nodes]);

  // Handle Dragging (Mouse & Touch)
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const currentPos = localPositions[nodeId] || { x: 100, y: 100 };
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX / zoom - currentPos.x,
      y: e.clientY / zoom - currentPos.y,
    });
  };

  const handleTouchStartNode = (e: React.TouchEvent, nodeId: string) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const currentPos = localPositions[nodeId] || { x: 100, y: 100 };
      setDraggingNodeId(nodeId);
      setDragOffset({
        x: touch.clientX / zoom - currentPos.x,
        y: touch.clientY / zoom - currentPos.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;
    const newX = Math.max(20, Math.round(e.clientX / zoom - dragOffset.x));
    const newY = Math.max(20, Math.round(e.clientY / zoom - dragOffset.y));

    setLocalPositions((prev) => ({
      ...prev,
      [draggingNodeId]: { x: newX, y: newY },
    }));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingNodeId || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = Math.max(20, Math.round(touch.clientX / zoom - dragOffset.x));
    const newY = Math.max(20, Math.round(touch.clientY / zoom - dragOffset.y));

    setLocalPositions((prev) => ({
      ...prev,
      [draggingNodeId]: { x: newX, y: newY },
    }));
  };

  const handleEndDrag = () => {
    if (draggingNodeId && localPositions[draggingNodeId]) {
      onUpdateNodePosition(draggingNodeId, localPositions[draggingNodeId]);
    }
    setDraggingNodeId(null);
  };

  // Node dimension constants
  const NODE_WIDTH = 260;
  const NODE_HEIGHT = 160;

  // Compute SVG connections
  const connections: {
    id: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    optionText: string;
    isValid: boolean;
  }[] = [];

  nodes.forEach((node) => {
    const fromPos = localPositions[node.id];
    if (!fromPos || !node.options) return;

    node.options.forEach((opt, optIdx) => {
      if (!opt.nextNodeId) return;
      const targetPos = localPositions[opt.nextNodeId];
      if (targetPos) {
        // Calculate start point on right side of node or bottom
        const fromX = fromPos.x + NODE_WIDTH;
        const fromY = fromPos.y + 70 + optIdx * 25;
        const toX = targetPos.x;
        const toY = targetPos.y + 60;

        connections.push({
          id: `${node.id}-${opt.id}-${opt.nextNodeId}`,
          fromX,
          fromY,
          toX,
          toY,
          optionText: opt.text,
          isValid: true,
        });
      }
    });
  });

  return (
    <div 
      className="relative w-full h-[520px] sm:h-[650px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none touch-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleEndDrag}
      onMouseLeave={handleEndDrag}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEndDrag}
      onTouchCancel={handleEndDrag}
    >
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
        <button
          onClick={() => {
            sounds.playClick();
            setZoom((z) => Math.min(z + 0.15, 1.6));
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Phóng to"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-semibold text-slate-400 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => {
            sounds.playClick();
            setZoom((z) => Math.max(z - 0.15, 0.5));
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setZoom(1);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Khôi phục zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          id="flow-add-normal-node-btn"
          onClick={() => {
            sounds.playClick();
            onAddNode('NORMAL');
          }}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/60 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tình Huống</span>
        </button>
        <button
          id="flow-add-ending-node-btn"
          onClick={() => {
            sounds.playClick();
            onAddNode('ENDING');
          }}
          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950/60 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>+ Ending</span>
        </button>
      </div>

      {/* Graph Area */}
      <div 
        ref={containerRef}
        className="w-[2400px] h-[1800px] relative origin-top-left transition-transform duration-75"
        style={{ transform: `scale(${zoom})` }}
      >
        {/* SVG Connection Arrows */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker
              id="arrow-head"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#818cf8" />
            </marker>
          </defs>

          {connections.map((conn) => {
            const dx = Math.abs(conn.toX - conn.fromX) * 0.5;
            const pathData = `M ${conn.fromX} ${conn.fromY} C ${conn.fromX + dx} ${conn.fromY}, ${conn.toX - dx} ${conn.toY}, ${conn.toX} ${conn.toY}`;
            return (
              <g key={conn.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  opacity="0.75"
                  markerEnd="url(#arrow-head)"
                />
              </g>
            );
          })}
        </svg>

        {/* Node Cards */}
        {nodes.map((node) => {
          const pos = localPositions[node.id] || { x: 100, y: 100 };
          const isEnding = node.type === 'ENDING';
          const isStart = !!node.isStart;

          // Border & color styling
          let borderClass = 'border-slate-800 hover:border-indigo-500';
          let headerBg = 'bg-slate-950/80';
          let badgeText = 'Tình Huống';
          let badgeColor = 'bg-indigo-950 text-indigo-300 border-indigo-800';

          if (isStart) {
            borderClass = 'border-emerald-500/80 shadow-lg shadow-emerald-950/40';
            headerBg = 'bg-emerald-950/40';
            badgeText = '★ START';
            badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-700';
          } else if (isEnding) {
            borderClass = 'border-amber-500/80 shadow-lg shadow-amber-950/40';
            headerBg = 'bg-amber-950/40';
            badgeText = `ENDING (${node.endingType || 'NEUTRAL'})`;
            badgeColor = 'bg-amber-950 text-amber-300 border-amber-700';
          }

          return (
            <div
              key={node.id}
              id={`graph-node-${node.id}`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${NODE_WIDTH}px`,
              }}
              className={`absolute z-10 rounded-2xl bg-slate-900 border ${borderClass} shadow-xl flex flex-col transition-shadow duration-150 ${
                draggingNodeId === node.id ? 'ring-2 ring-indigo-400 scale-[1.02] shadow-2xl z-30' : ''
              }`}
            >
              {/* Card Header / Drag Handle */}
              <div 
                className={`p-3 border-b border-slate-800/80 ${headerBg} rounded-t-2xl flex items-center justify-between cursor-move touch-none`}
                onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                onTouchStart={(e) => handleTouchStartNode(e, node.id)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {badgeText}
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    {node.title}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onEditNode(node);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Chỉnh sửa Node & Options"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      if (window.confirm(`Xóa node "${node.title}"?`)) {
                        onDeleteNode(node.id);
                      }
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Xóa Node"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {node.content}
              </div>

              {/* Options Output Points */}
              {!isEnding && (
                <div className="p-2.5 pt-0 space-y-1.5">
                  {node.options && node.options.length > 0 ? (
                    node.options.map((opt, idx) => (
                      <div 
                        key={opt.id}
                        className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px]"
                      >
                        <span className="text-slate-300 font-medium truncate max-w-[170px]">
                          {idx + 1}. {opt.text}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {opt.nextNodeId ? (
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                          ) : (
                            <span className="text-[9px] text-amber-400 font-bold bg-amber-950/80 px-1 rounded">
                              Chưa nối
                            </span>
                          )}
                          <ArrowRight className="w-3 h-3 text-indigo-400" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-500 italic p-1">
                      Chưa có lựa chọn nào
                    </div>
                  )}
                </div>
              )}

              {/* Ending badge footer */}
              {isEnding && (
                <div className="p-2.5 pt-0 flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold">
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="truncate">{node.endingTitle || 'Điểm Kết Thúc'}</span>
                </div>
              )}

            </div>
          );
        })}

      </div>
    </div>
  );
};
