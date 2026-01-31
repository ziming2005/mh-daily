import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Task } from '../App';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  initialDate?: Date;
  initialTask?: Task | null;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onSave, onDelete, initialDate, initialTask }) => {
  const [type, setType] = useState<'task' | 'event'>('task');
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('blue');
  const [urgency, setUrgency] = useState<Task['urgency']>('Normal');

  // Date & Time Management
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerView, setPickerView] = useState<'calendar' | 'time'>('calendar');
  const [pickerViewDate, setPickerViewDate] = useState(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Priority Management
  const [isPriorityPickerOpen, setIsPriorityPickerOpen] = useState(false);
  const priorityPickerRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setType(initialTask.type);
        setTitle(initialTask.title);
        setColor(initialTask.color || 'blue');
        setUrgency(initialTask.urgency);
        setDate(initialTask.date);
        setTime(initialTask.time || '');
        setPickerViewDate(new Date(initialTask.date));
      } else {
        setType('task');
        setTitle('');
        setColor('blue');
        setUrgency('Normal');
        const d = initialDate || new Date();
        // Adjust for timezone offset to ensure correct date string
        const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
        setDate(offsetDate.toISOString().split('T')[0]);
        setTime(''); // Reset time
        setPickerViewDate(new Date()); // Reset picker view to today
      }
      setPickerView('calendar');
      setIsDatePickerOpen(false);
      setIsPriorityPickerOpen(false);
    }
  }, [isOpen, initialDate, initialTask]);

  // Handle click outside to close picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (priorityPickerRef.current && !priorityPickerRef.current.contains(event.target as Node)) {
        setIsPriorityPickerOpen(false);
      }
    };
    if (isDatePickerOpen || isPriorityPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen, isPriorityPickerOpen]);

  const handleTypeChange = (newType: 'task' | 'event') => {
    setType(newType);
  };

  const urgencies: Task['urgency'][] = ['Low', 'Normal', 'Medium', 'High'];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalTime = time;
    const finalUrgency = type === 'event' ? 'Normal' : urgency;

    const newTask: Task = {
      id: initialTask?.id || crypto.randomUUID(),
      title,
      type, // 'task' | 'event'
      color,
      urgency: finalUrgency,
      date,
      time: finalTime,
      status: initialTask?.status || 'todo',
    };
    onSave(newTask);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (initialTask && onDelete) {
      onDelete(initialTask.id);
      onClose();
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Date';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // --- Date Picker Logic ---

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPickerViewDate(new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPickerViewDate(new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (d: number) => {
    const newDate = new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth(), d);
    const offsetDate = new Date(newDate.getTime() - (newDate.getTimezoneOffset() * 60000));
    setDate(offsetDate.toISOString().split('T')[0]);
    // Keeps dropdown open to allow further edits (e.g. time selection)
  };

  const selectPreset = (preset: 'tomorrow' | 'nextWeek' | 'nextWeekend') => {
    const today = new Date();
    let targetDate = new Date();

    switch (preset) {
      case 'tomorrow':
        targetDate.setDate(today.getDate() + 1);
        break;
      case 'nextWeek':
        // Calculate next Monday
        targetDate.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
        break;
      case 'nextWeekend':
        // Calculate next Saturday
        targetDate.setDate(today.getDate() + ((6 + 7 - today.getDay()) % 7 || 7));
        break;
    }
    const offsetDate = new Date(targetDate.getTime() - (targetDate.getTimezoneOffset() * 60000));
    setDate(offsetDate.toISOString().split('T')[0]);
    // Keeps dropdown open
  };

  // --- Time Picker Logic ---
  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      slots.push(`${String(i).padStart(2, '0')}:00`);
      slots.push(`${String(i).padStart(2, '0')}:30`);
    }
    return slots;
  };

  const handleTimeSelect = (t: string) => {
    setTime(t);
    if (!date) {
      const today = new Date();
      const offsetDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      setDate(offsetDate.toISOString().split('T')[0]);
    }
    setIsDatePickerOpen(false); // Close dropdown instead of switching to calendar
  };

  const renderCalendarGrid = () => {
    const year = pickerViewDate.getFullYear();
    const month = pickerViewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0 (Sun) - 6 (Sat)

    // Adjust for Monday start (based on previous image showing M T W...)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const grid = [];
    // Empty cells
    for (let i = 0; i < startOffset; i++) {
      grid.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDateStr = new Date(year, month, i).toLocaleDateString('en-CA');
      const d = new Date(year, month, i);
      const dStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      const isSelected = date === dStr;
      const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();

      grid.push(
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); handleDateClick(i); }}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors relative
                    ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}
                `}
        >
          {i}
          {isToday && !isSelected && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></span>
          )}
        </button>
      );
    }
    return grid;
  };

  if (!isOpen) return null;

  // Calculate specific dates for the UI labels
  const getNextDayDate = (dayIndex: number) => {
    const d = new Date();
    d.setDate(d.getDate() + ((dayIndex + 7 - d.getDay()) % 7 || 7));
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const nextMonLabel = getNextDayDate(1);
  const nextSatLabel = getNextDayDate(6);

  // Helper for priority display
  const getPriorityColorClass = (u: Task['urgency'], isText = false) => {
    switch (u) {
      case 'High': return isText ? 'text-red-600 dark:text-red-400' : 'text-red-500';
      case 'Medium': return isText ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500';
      case 'Low': return isText ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500';
      default: return isText ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400';
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100001] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        ></div>

        {/* Modal Window */}
        <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-[2rem] flex flex-col z-10 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-visible text-left">

          {/* Header */}
          <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1a1a1a] rounded-t-[2rem]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {initialTask ? (type === 'task' ? 'Edit Task' : 'Edit Event') : (type === 'task' ? 'New Task' : 'New Event')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="size-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-8 py-5 space-y-6 bg-white dark:bg-[#1a1a1a] overflow-visible">

            {/* Type Toggle */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('task')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === 'task'
                  ? 'bg-white dark:bg-surface-dark shadow-sm text-primary ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Task
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('event')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === 'event'
                  ? 'bg-white dark:bg-surface-dark shadow-sm text-primary ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">event</span>
                Event
              </button>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {initialTask ? (type === 'task' ? 'Edit Task Name' : 'Edit Event Name') : (type === 'task' ? 'Task Name' : 'Event Name')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-md font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                placeholder={type === 'task' ? "What needs to be done?" : "Event name"}
                autoFocus
              />
            </div>

            {/* Properties Row: Date, Time, Priority */}
            <div className="flex flex-wrap gap-3">

              {/* Custom Date & Time Picker Dropdown Trigger Container */}
              <div className="relative flex gap-2" ref={datePickerRef}>

                {/* Date Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isDatePickerOpen && pickerView === 'calendar') {
                      setIsDatePickerOpen(false);
                    } else {
                      setIsDatePickerOpen(true);
                      setPickerView('calendar');
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border ${date ? 'border-primary/50 text-primary dark:text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'} rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer`}
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                  <span className="text-sm font-bold">
                    {date ? formatDateDisplay(date) : 'Date'}
                  </span>
                </button>

                {/* Time Button */}
                <div
                  tabIndex={0}
                  role="button"
                  onClick={() => {
                    if (isDatePickerOpen && pickerView === 'time') {
                      setIsDatePickerOpen(false);
                    } else {
                      setIsDatePickerOpen(true);
                      setPickerView('time');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (isDatePickerOpen && pickerView === 'time') {
                        setIsDatePickerOpen(false);
                      } else {
                        setIsDatePickerOpen(true);
                        setPickerView('time');
                      }
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border ${time ? 'border-primary/50 text-primary dark:text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'} rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer select-none`}
                >
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                  <span className="text-sm font-bold">{time || 'Time'}</span>
                  {time && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTime('');
                      }}
                      className="ml-1 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center z-10"
                      title="Remove time"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Dropdown Content */}
                {isDatePickerOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 w-[280px] z-[60] animate-in fade-in zoom-in-95 duration-100 overflow-hidden flex flex-col">

                    {pickerView === 'calendar' ? (
                      <>
                        {/* Selected Date Header */}
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {date ? new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'No Date'}
                          </span>
                          {time && <span className="text-xs bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-semibold">{time}</span>}
                        </div>

                        {/* Presets */}
                        <div className="p-2 space-y-0.5">
                          <button onClick={() => selectPreset('tomorrow')} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg group">
                            <span className="material-symbols-outlined text-[18px] text-amber-500">wb_sunny</span>
                            <div className="flex justify-between flex-1">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Tomorrow</span>
                              <span className="text-xs text-slate-400">Sun</span>
                            </div>
                          </button>
                          <button onClick={() => selectPreset('nextWeek')} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg group">
                            <span className="material-symbols-outlined text-[18px] text-violet-500">calendar_month</span>
                            <div className="flex justify-between flex-1">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Next week</span>
                              <span className="text-xs text-slate-400">{nextMonLabel}</span>
                            </div>
                          </button>
                          <button onClick={() => selectPreset('nextWeekend')} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg group">
                            <span className="material-symbols-outlined text-[18px] text-blue-500">weekend</span>
                            <div className="flex justify-between flex-1">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Next weekend</span>
                              <span className="text-xs text-slate-400">{nextSatLabel}</span>
                            </div>
                          </button>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-700/50 mx-2"></div>

                        {/* Calendar */}
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {pickerViewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                            </span>
                            <div className="flex gap-1">
                              <button onClick={handlePrevMonth} type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500">
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                              </button>
                              <button onClick={() => setPickerViewDate(new Date())} type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500">
                                <span className="material-symbols-outlined text-[14px]">circle</span>
                              </button>
                              <button onClick={handleNextMonth} type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500">
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-7 mb-2 text-center">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                              <span key={i} className="text-[10px] font-bold text-slate-400">{d}</span>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                            {renderCalendarGrid()}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col h-[360px]">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">schedule</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Select Time</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                          <button
                            onClick={() => handleTimeSelect('')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!time ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                          >
                            No Time
                          </button>
                          {generateTimeSlots().map(t => (
                            <button
                              key={t}
                              onClick={() => handleTimeSelect(t)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${time === t ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Priority (Task Only) */}
              {type === 'task' && (
                <div className="relative" ref={priorityPickerRef}>
                  <button
                    type="button"
                    onClick={() => setIsPriorityPickerOpen(!isPriorityPickerOpen)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg shadow-sm transition-all ${urgency === 'High' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' :
                      urgency === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400' :
                        urgency === 'Low' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' :
                          'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${urgency !== 'Normal' ? 'filled' : ''}`}>flag</span>
                    <span className="text-sm font-bold">{urgency}</span>
                  </button>

                  {isPriorityPickerOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 w-[140px] z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {urgencies.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => {
                            setUrgency(u);
                            setIsPriorityPickerOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors ${u === urgency ? 'bg-slate-50 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                        >
                          <span className={`material-symbols-outlined text-[18px] ${u !== 'Normal' ? 'filled' : ''} ${getPriorityColorClass(u)}`}>flag</span>
                          <span className={getPriorityColorClass(u, true)}>{u}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Color Label Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Color Label</label>
              <div className="flex flex-wrap gap-3">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`size-10 rounded-full flex items-center justify-center transition-all duration-200 relative group outline-none`}
                    aria-label={`Select ${c.id}`}
                  >
                    <span className={`absolute inset-0 rounded-full ${c.class} shadow-sm transition-transform duration-200 ${color === c.id ? 'scale-100' : 'scale-100 group-hover:scale-110'}`}></span>
                    {color === c.id && (
                      <span className={`absolute -inset-1 rounded-full border-2 ${c.class.replace('bg-', 'border-')} opacity-30`}></span>
                    )}
                    {color === c.id && (
                      <span className="absolute inset-0 rounded-full ring-[3px] ring-white dark:ring-[#1a1a1a]"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </form>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1a1a1a] rounded-b-[2rem] flex items-center gap-3">
            {initialTask && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="size-12 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 flex items-center justify-center transition-colors shrink-0 border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
                title="Delete Task"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-base shadow-xl shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              {initialTask ? (type === 'task' ? 'Update Task' : 'Update Event') : (type === 'task' ? 'Create Task' : 'Schedule Event')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewTaskModal;