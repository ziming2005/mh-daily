import React, { useState, useRef } from 'react';
import NewBlockModal, { BlockData as ModalBlockData } from './NewBlockModal';

interface WeeklyTemplateProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
  blocks: ModalBlockData[];
  onUpdateBlocks: (blocks: ModalBlockData[]) => void;
}

// Ensure compatibility with the Modal's definition
interface BlockData extends ModalBlockData { }

const WeeklyTemplate: React.FC<WeeklyTemplateProps> = ({ toggleTheme, isDarkMode, blocks, onUpdateBlocks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Track geometry for collision detection
  const [draggedBlock, setDraggedBlock] = useState<{
    index: number;
    day: string;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);

  const [ghostBlock, setGhostBlock] = useState<BlockData | null>(null);
  const [editingBlock, setEditingBlock] = useState<BlockData | null>(null);
  const [isOverDelete, setIsOverDelete] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const deleteBtnRef = useRef<HTMLDivElement>(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const selectedDay = days[selectedDayIndex];

  // Helper to convert time string to minutes
  const timeToMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const checkBlockOverlap = (candidate: BlockData) => {
    const cStart = timeToMins(candidate.startTime);
    const cEnd = timeToMins(candidate.endTime);

    return blocks.some(b => {
      // Skip comparing with itself (if editing/moving existing block)
      if (candidate.id && b.id === candidate.id) return false;

      // Check if they share any days
      const hasCommonDay = b.days.some(day => candidate.days.includes(day));
      if (!hasCommonDay) return false;

      const bStart = timeToMins(b.startTime);
      const bEnd = timeToMins(b.endTime);

      // Check for time overlap: (StartA < EndB) and (EndA > StartB)
      return cStart < bEnd && cEnd > bStart;
    });
  };

  const handleSaveBlock = (data: BlockData) => {
    // Validate overlap before saving
    if (checkBlockOverlap(data)) {
      alert("This time slot overlaps with an existing block. Please adjust the time or days.");
      return;
    }

    if (data.id) {
      onUpdateBlocks(blocks.map(b => b.id === data.id ? data : b));
    } else {
      onUpdateBlocks([...blocks, { ...data, id: crypto.randomUUID() }]);
    }
    setIsModalOpen(false);
    setEditingBlock(null);
  };

  const handleCreateNewBlock = () => {
    setEditingBlock(null);
    setIsModalOpen(true);
  };

  const handleEditBlock = (block: BlockData) => {
    setEditingBlock(block);
    setIsModalOpen(true);
  };

  const getColorClasses = (colorId: string) => {
    switch (colorId) {
      case 'blue': return 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200';
      case 'red': return 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-200';
      case 'green': return 'bg-emerald-100 dark:bg-emerald-900/30 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-200';
      case 'amber': return 'bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200';
      case 'violet': return 'bg-violet-100 dark:bg-violet-900/30 border-l-4 border-violet-500 text-violet-800 dark:text-violet-200';
      case 'pink': return 'bg-pink-100 dark:bg-pink-900/30 border-l-4 border-pink-500 text-pink-800 dark:text-pink-200';
      case 'cyan': return 'bg-cyan-100 dark:bg-cyan-900/30 border-l-4 border-cyan-500 text-cyan-800 dark:text-cyan-200';
      case 'slate': return 'bg-slate-100 dark:bg-slate-800 border-l-4 border-slate-500 text-slate-800 dark:text-slate-200';
      default: return 'bg-primary/10 dark:bg-primary/20 border-l-4 border-primary text-primary-dark dark:text-primary-light';
    }
  };

  const getPositionStyle = (day: string, startTime: string, endTime: string) => {
    const dayIndex = days.indexOf(day);
    if (dayIndex === -1) return { display: 'none' };

    // On mobile, only show if it's the selected day
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // In React, we can't reliably check window.innerWidth in the style generator during render 
    // without a resize listener, so we'll use CSS classes to hide/show, 
    // but the gridColumn and Row values still need to be calculated.
    // For the "responsive" fix, we'll return a data attribute or specific col index.

    const colStart = dayIndex + 2;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startRow = (startH - 7) + 1;
    const topOffsetPx = startM;

    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const heightPx = durationMinutes;

    return {
      gridColumnStart: colStart,
      gridRowStart: startRow,
      marginTop: `${topOffsetPx}px`,
      height: `${heightPx}px`,
      position: 'relative' as const,
      zIndex: 25,
    };
  };

  const handleDragStart = (e: React.DragEvent, index: number, day: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggedBlock({
      index,
      day,
      offsetX,
      offsetY,
      width: rect.width,
      height: rect.height
    });

    e.dataTransfer.effectAllowed = 'move';

    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedBlock(null);
    setGhostBlock(null);
    setIsOverDelete(false);
  };

  const dayColIndices = [2, 3, 4, 5, 6, 7, 8];

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedBlock) return;

    // --- 1. Delete Collision Detection ---
    if (deleteBtnRef.current) {
      const deleteRect = deleteBtnRef.current.getBoundingClientRect();

      const blockLeft = e.clientX - draggedBlock.offsetX;
      const blockTop = e.clientY - draggedBlock.offsetY;
      const blockRight = blockLeft + draggedBlock.width;
      const blockBottom = blockTop + draggedBlock.height;

      const isIntersecting = !(
        blockRight < deleteRect.left ||
        blockLeft > deleteRect.right ||
        blockBottom < deleteRect.top ||
        blockTop > deleteRect.bottom
      );

      setIsOverDelete(isIntersecting);
    }

    // --- 2. Grid Snapping Logic ---
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const x = e.clientX - rect.left;

      const timeColWidth = 80;

      if (x < timeColWidth || x > rect.width || y < 0 || y > rect.height) {
        setGhostBlock(null);
        return;
      }

      const dayColWidth = (rect.width - timeColWidth) / 7;
      const dayIndex = Math.floor((x - timeColWidth) / dayColWidth);
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const targetDay = days[dayIndex];

      if (!targetDay) {
        setGhostBlock(null);
        return;
      }

      // Snap time
      const blockTopY = y - draggedBlock.offsetY;
      const pixelsFrom7am = blockTopY;
      const validPixels = Math.max(0, pixelsFrom7am);
      const snappedMinutes = Math.round(validPixels / 15) * 15;
      let startTotalMins = 7 * 60 + snappedMinutes;

      const block = blocks[draggedBlock.index];
      const [oldStartH, oldStartM] = block.startTime.split(':').map(Number);
      const [oldEndH, oldEndM] = block.endTime.split(':').map(Number);
      const durationMins = (oldEndH * 60 + oldEndM) - (oldStartH * 60 + oldStartM);

      const MAX_MINS = 24 * 60;
      const MIN_MINS = 7 * 60;

      if (startTotalMins + durationMins > MAX_MINS) {
        startTotalMins = MAX_MINS - durationMins;
      }

      if (startTotalMins < MIN_MINS) {
        startTotalMins = MIN_MINS;
      }

      const newStartH = Math.floor(startTotalMins / 60);
      const newStartM = startTotalMins % 60;

      const formatTime = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const newStartTime = formatTime(newStartH, newStartM);

      const endTotalMins = startTotalMins + durationMins;
      const newEndH = Math.floor(endTotalMins / 60);
      const newEndM = endTotalMins % 60;

      const newEndTime = formatTime(newEndH, newEndM);

      // --- NEW: Overlap Check with multi-day support ---

      // Construct the hypothetical block state
      const originalBlock = blocks[draggedBlock.index];
      let newDays = [...originalBlock.days];

      // If dragging from one day to another, update days list for the check
      if (draggedBlock.day !== targetDay) {
        newDays = newDays.filter(d => d !== draggedBlock.day);
        if (!newDays.includes(targetDay)) {
          newDays.push(targetDay);
        }
      }

      const hypotheticalBlock = {
        ...originalBlock,
        startTime: newStartTime,
        endTime: newEndTime,
        days: newDays
      };

      if (checkBlockOverlap(hypotheticalBlock)) {
        setGhostBlock(null);
        return;
      }

      if (ghostBlock && ghostBlock.days[0] === targetDay && ghostBlock.startTime === newStartTime) {
        return;
      }

      setGhostBlock({
        ...block,
        startTime: newStartTime,
        endTime: newEndTime,
        days: [targetDay]
      });
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedBlock) return;

    if (isOverDelete) {
      const newBlocks = [...blocks];
      const blockIndex = draggedBlock.index;
      const dayToRemove = draggedBlock.day;

      if (newBlocks[blockIndex]) {
        const block = { ...newBlocks[blockIndex] };
        block.days = block.days.filter(d => d !== dayToRemove);

        if (block.days.length === 0) {
          newBlocks.splice(blockIndex, 1);
        } else {
          newBlocks[blockIndex] = block;
        }
        onUpdateBlocks(newBlocks);
      }
      cleanupDrag();
      return;
    }

    if (ghostBlock) {
      const newStartTime = ghostBlock.startTime;
      const newEndTime = ghostBlock.endTime;
      const targetDay = ghostBlock.days[0];

      // Re-construct final block to double-check
      const originalBlock = blocks[draggedBlock.index];
      let newDays = [...originalBlock.days];

      if (draggedBlock.day !== targetDay) {
        newDays = newDays.filter(d => d !== draggedBlock.day);
        if (!newDays.includes(targetDay)) {
          newDays.push(targetDay);
        }
      }

      const finalBlock = {
        ...originalBlock,
        startTime: newStartTime,
        endTime: newEndTime,
        days: newDays
      };

      if (checkBlockOverlap(finalBlock)) {
        cleanupDrag();
        return;
      }

      // Apply Update
      const newBlocks = [...blocks];
      newBlocks[draggedBlock.index] = finalBlock;
      onUpdateBlocks(newBlocks);
      cleanupDrag();
      return;
    }

    cleanupDrag();
  };

  const cleanupDrag = () => {
    setDraggedBlock(null);
    setGhostBlock(null);
    setIsOverDelete(false);
  };

  return (
    <>
      <NewBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBlock}
        initialData={editingBlock}
      />
      <div
        className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50/50 dark:bg-transparent"
        onDragOver={handleContainerDragOver}
        onDrop={handleGlobalDrop}
      >
        <style>{`
          .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
          .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

          @keyframes shake {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(0.5deg); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(-0.5deg); }
            100% { transform: rotate(0deg); }
          }

          .delete-mode-shake {
            animation: shake 0.2s infinite;
            border-color: #ef4444 !important;
            cursor: pointer !important;
          }

          /* Neomorphic Toolbar Styles */
          .neu-toolbar-card {
            background-color: #e4e4e4;
            border-radius: 16px;
            box-shadow: 10px 10px 20px #c4c4c4,
                        -10px -10px 20px #ffffff;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 5px;
            gap: 4px;
          }

          .neu-button {
            background-color: #e4e4e4;
            border: none;
            border-radius: 11px;
            box-shadow: inset 5px 5px 5px #c4c4c4,
                        inset -5px -5px 5px #ffffff;
            color: #333;
            cursor: pointer;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            font-weight: bold;
            margin: 2px;
            padding: 10px 16px;
            text-transform: uppercase;
            transition: all 0.3s ease;
            gap: 7px;
          }

          .neu-button:hover {
            box-shadow: none;
          }

          .neu-button .material-symbols-outlined {
            font-size: 20px;
          }

          .neu-button.Post {
            color: #333;
          }

          .neu-button.Post:hover {
            background-color: #333;
            color: #e4e4e4;
            box-shadow: none;
          }

          .neu-button.Chat {
            color: #b82323;
          }

          .neu-button.Chat:hover, .neu-button.Chat.active {
            background-color: #b82323;
            color: #e4e4e4;
            box-shadow: none;
          }
        `}</style>
        <div className="w-full px-4 md:px-6 py-4 flex items-center justify-end z-30">
          <div className="neu-toolbar-card">
            <button
              onClick={handleCreateNewBlock}
              className="neu-button Post"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span>Block</span>
            </button>

            <button
              onClick={() => setIsDeleteMode(!isDeleteMode)}
              className={`neu-button Chat ${isDeleteMode ? 'active' : ''}`}
              title="Click to enter Delete Mode, then select blocks to remove"
            >
              <span className="material-symbols-outlined">delete</span>
              <span className="hidden sm:inline">{isDeleteMode ? 'Finish Deleting' : 'Delete'}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative z-10 custom-scrollbar-hide">
          <div className="w-full md:min-w-[1000px] px-0 md:px-6 pb-10">
            {/* Mobile Day Selector */}
            <div className="flex md:hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-none md:rounded-xl mb-4 p-1 shadow-sm border-y md:border border-border-light dark:border-border-dark overflow-x-auto no-scrollbar">
              {days.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex-1 min-w-[60px] py-2 rounded-lg text-xs font-bold transition-all ${selectedDayIndex === idx
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_repeat(7,1fr)] border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark sticky top-0 z-40 backdrop-blur-md rounded-t-xl overflow-hidden shadow-sm">
              <div className="p-2 md:p-4 text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider text-center border-r border-border-light dark:border-border-dark flex items-center justify-center bg-slate-50 dark:bg-surface-dark/40">
                GMT+2
              </div>
              {/* Desktop Day Headers */}
              {days.map((day) => (
                <div key={day} className="hidden md:flex p-4 text-center border-r border-border-light dark:border-border-dark last:border-r-0 items-center justify-center">
                  <span className="block text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">{day}</span>
                </div>
              ))}
              {/* Mobile Selected Day Header */}
              <div className="md:hidden p-3 text-center flex items-center justify-center">
                <span className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">{selectedDay}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-b-xl shadow-card border-x border-b border-border-light dark:border-border-dark overflow-hidden">
              <div
                ref={gridRef}
                className="relative grid grid-cols-[60px_1fr] md:grid-cols-[80px_repeat(7,1fr)] auto-rows-[60px]"
              >
                <div className="absolute inset-0 grid grid-cols-[60px_1fr] md:grid-cols-[80px_repeat(7,1fr)] pointer-events-none z-0">
                  <div className="border-r border-border-light dark:border-border-dark bg-white dark:bg-white/5"></div>
                  {/* Desktop Grid Lines */}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="hidden md:block border-r border-border-light dark:border-border-dark grid-lines"></div>
                  ))}
                  {/* Mobile Grid Column */}
                  <div className="md:hidden border-r border-border-light dark:border-border-dark grid-lines"></div>
                </div>

                {Array.from({ length: 17 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-start-1 h-[60px] border-b border-transparent text-[10px] md:text-xs text-slate-400 font-medium flex items-start justify-center pt-2 z-10 pointer-events-none"
                    style={{ gridRowStart: i + 1 }}
                  >
                    {String(i + 7).padStart(2, '0')}:00
                  </div>
                ))}

                <div
                  onClick={handleCreateNewBlock}
                  className="col-start-5 row-start-3 row-span-2 p-1 relative z-10 group empty-slot flex items-center justify-center transition-all cursor-pointer"
                >
                  <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center size-8 rounded-full bg-primary text-white shadow-lg transform scale-75 group-hover:scale-100 transition-all duration-200">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </div>
                </div>

                {blocks.map((block, idx) => (
                  block.days.map((day) => {
                    const dayIdx = days.indexOf(day);
                    const isSelectedMobile = day === selectedDay;

                    return (
                      <div
                        key={`${block.id || idx}-${day}`}
                        className={`p-1 group hover:z-50 cursor-grab active:cursor-grabbing ${isOverDelete ? 'opacity-50 grayscale transition-all' : ''} ${isSelectedMobile ? 'flex' : 'hidden md:flex'
                          } ${isDeleteMode ? 'delete-mode-shake' : ''}`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, idx, day)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isDeleteMode) {
                            const newBlocks = [...blocks];
                            newBlocks.splice(idx, 1);
                            onUpdateBlocks(newBlocks);
                          } else {
                            handleEditBlock(block);
                          }
                        }}
                        style={{
                          ...getPositionStyle(day, block.startTime, block.endTime),
                          gridColumnStart: dayIdx + 2
                        }}
                      >
                        {(() => {
                          const duration = timeToMins(block.endTime) - timeToMins(block.startTime);
                          if (duration <= 30) {
                            return (
                              <div className={`h-full w-full rounded-r-md rounded-bl-sm px-2 py-0.5 shadow-sm hover:shadow-lg transition-all flex items-center justify-between gap-1 overflow-hidden ${getColorClasses(block.color)}`}>
                                <div className="flex items-center gap-1.5 min-w-0 pr-1 border-r border-black/5 dark:border-white/5 h-full">
                                  {block.icon && <span className="material-symbols-outlined text-[12px] opacity-70 shrink-0">{block.icon}</span>}
                                  <span className="text-[10px] font-bold truncate leading-none">{block.name}</span>
                                </div>
                                <span className="text-[9px] font-bold opacity-80 shrink-0 whitespace-nowrap">{block.startTime}</span>
                              </div>
                            );
                          }

                          return (
                            <div className={`h-full w-full rounded-r-md rounded-bl-sm p-2 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between ${getColorClasses(block.color)}`}>
                              <div className="flex items-start justify-between">
                                <span className="text-xs font-bold truncate">{block.name}</span>
                                {block.icon && <span className="material-symbols-outlined text-[14px] opacity-70">{block.icon}</span>}
                              </div>
                              <span className="text-[10px] font-medium opacity-80">{block.startTime} - {block.endTime}</span>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })
                ))}

                {ghostBlock && !isOverDelete && (
                  <div
                    className={`p-1 z-40 pointer-events-none opacity-60`}
                    style={getPositionStyle(ghostBlock.days[0], ghostBlock.startTime, ghostBlock.endTime)}
                  >
                    <div className={`h-full w-full rounded-r-md rounded-bl-sm border-2 border-dashed ${getColorClasses(ghostBlock.color)}`}>
                      <div className="flex items-start justify-between p-2 h-full">
                        <span className="text-xs font-bold truncate opacity-70">{ghostBlock.name}</span>
                        <span className="text-[10px] font-bold bg-white/50 dark:bg-black/50 px-1 rounded">{ghostBlock.startTime}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WeeklyTemplate;