import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

export interface BlockData {
  id?: string;
  name: string;
  color: string;
  icon: string;
  startTime: string;
  endTime: string;
  days: string[];
}

interface NewBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BlockData) => void;
  initialData?: BlockData | null;
}

const NewBlockModal: React.FC<NewBlockModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [blockName, setBlockName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedIcon, setSelectedIcon] = useState('work');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setBlockName(initialData.name);
        setSelectedColor(initialData.color);
        setSelectedIcon(initialData.icon);
        setStartTime(initialData.startTime);
        setEndTime(initialData.endTime);
        setSelectedDays(initialData.days);
      } else {
        setBlockName('');
        setSelectedColor('blue');
        setSelectedIcon('work');
        setStartTime('09:00');
        setEndTime('11:30');
        setSelectedDays(['Mon']);
      }
    }
  }, [isOpen, initialData]);

  // Colors based on the visual reference
  const colors = [
    { id: 'blue', class: 'bg-blue-500', ring: 'ring-blue-500' },
    { id: 'red', class: 'bg-red-500', ring: 'ring-red-500' },
    { id: 'green', class: 'bg-emerald-500', ring: 'ring-emerald-500' },
    { id: 'amber', class: 'bg-amber-500', ring: 'ring-amber-500' },
    { id: 'violet', class: 'bg-violet-500', ring: 'ring-violet-500' },
    { id: 'pink', class: 'bg-pink-500', ring: 'ring-pink-500' },
    { id: 'cyan', class: 'bg-cyan-500', ring: 'ring-cyan-500' },
    { id: 'slate', class: 'bg-slate-500', ring: 'ring-slate-500' },
  ];

  // Icons based on the visual reference
  const icons = [
    { id: 'wb_sunny', icon: 'wb_sunny' },
    { id: 'work', icon: 'work' },
    { id: 'local_cafe', icon: 'local_cafe' },
    { id: 'menu_book', icon: 'menu_book' },
    { id: 'bedtime', icon: 'bedtime' },
    { id: 'bolt', icon: 'bolt' },
    { id: 'smartphone', icon: 'smartphone' },
    { id: 'music_note', icon: 'music_note' },
    { id: 'favorite', icon: 'favorite' },
    { id: 'build', icon: 'build' },
  ];

  const weekDays = [
    { id: 'Mon', label: 'M' },
    { id: 'Tue', label: 'T' },
    { id: 'Wed', label: 'W' },
    { id: 'Thu', label: 'T' },
    { id: 'Fri', label: 'F' },
    { id: 'Sat', label: 'S' },
    { id: 'Sun', label: 'S' },
  ];

  const toggleDay = (id: string) => {
    if (selectedDays.includes(id)) {
      setSelectedDays(selectedDays.filter(d => d !== id));
    } else {
      setSelectedDays([...selectedDays, id]);
    }
  };

  const handleSave = () => {
    onSave({
      id: initialData?.id,
      name: blockName || 'New Routine Block',
      color: selectedColor,
      icon: selectedIcon,
      startTime,
      endTime,
      days: selectedDays
    });
    setBlockName('');
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Modal Window */}
      <div className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-[2rem] flex flex-col relative z-10 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{initialData ? 'Edit Routine Block' : 'New Routine Block'}</h2>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-5 space-y-6 bg-white dark:bg-[#1a1a1a] overflow-y-auto max-h-[70vh]">

          {/* Name Input */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Block Name</label>
            <input
              type="text"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              className="w-full text-md font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
              placeholder="e.g. Deep Work Session"
              autoFocus
            />
          </div>

          {/* Color & Icon Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Color Section */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Color Label</label>
              <div className="flex flex-wrap gap-3">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.id)}
                    className={`size-10 rounded-full flex items-center justify-center transition-all duration-200 relative group outline-none`}
                    aria-label={`Select ${c.id}`}
                    type="button"
                  >
                    <span className={`absolute inset-0 rounded-full ${c.class} shadow-sm transition-transform duration-200 ${selectedColor === c.id ? 'scale-100' : 'scale-100 group-hover:scale-110'}`}></span>
                    {selectedColor === c.id && (
                      <span className={`absolute -inset-1 rounded-full border-2 ${c.class.replace('bg-', 'border-')} opacity-30`}></span>
                    )}
                    {selectedColor === c.id && (
                      <span className="absolute inset-0 rounded-full ring-[3px] ring-white dark:ring-[#1a1a1a]"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Section */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Icon</label>
              <div className="grid grid-cols-5 gap-2">
                {icons.map((i) => {
                  const isSelected = selectedIcon === i.id;
                  const activeColorClass = colors.find(c => c.id === selectedColor)?.class || 'bg-slate-900';
                  const activeBorderClass = colors.find(c => c.id === selectedColor)?.class.replace('bg-', 'border-') || 'border-slate-900';

                  return (
                    <button
                      key={i.id}
                      onClick={() => setSelectedIcon(i.id)}
                      className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-200 border-2 ${isSelected
                        ? `${activeColorClass} ${activeBorderClass} text-white shadow-lg scale-105`
                        : 'bg-transparent border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-600 dark:border-slate-800 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                        }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">{i.icon}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time & Schedule Section */}
          <div className="space-y-5 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start Time</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">schedule</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 mt-6">arrow_forward</span>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">End Time</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">schedule</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-600 dark:text-slate-300">Repeat On</label>
              <div className="flex flex-wrap gap-3">
                {weekDays.map((day) => {
                  const isSelected = selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`size-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${isSelected
                        ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      type="button"
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1a1a1a]">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-base shadow-xl shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            {initialData ? 'Update Block' : 'Create Block'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewBlockModal;