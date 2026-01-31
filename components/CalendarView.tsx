import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../App';
import NewTaskModal from './NewTaskModal';
import confetti from 'canvas-confetti';
import { MdOutlineCalendarMonth, MdOutlineViewDay } from "react-icons/md";

interface CalendarViewProps {
    toggleTheme: () => void;
    isDarkMode: boolean;
    tasks: Task[];
    onAddTask: (task: Task) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onToggleTaskStatus: (taskId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ toggleTheme, isDarkMode, tasks, onAddTask, onEditTask, onDeleteTask, onToggleTaskStatus }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none');
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const activeDayRef = useRef<HTMLDivElement>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const monthPickerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);

    // Track screen size for responsive limits
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Scroll to active month in horizontal picker when it opens
    useEffect(() => {
        if (isMonthPickerOpen && monthPickerRef.current) {
            const activeMonthBtn = monthPickerRef.current.querySelector('.active-month');
            if (activeMonthBtn) {
                activeMonthBtn.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
            }
        }
    }, [isMonthPickerOpen]);

    // Scroll to active day when entering day view or changing date
    useEffect(() => {
        if (viewMode === 'day' && activeDayRef.current) {
            activeDayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [viewMode, currentDate]);

    // --- Helpers ---

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const fireConfetti = (x: number, y: number) => {
        const xRatio = x / window.innerWidth;
        const yRatio = y / window.innerHeight;

        confetti({
            particleCount: 80,
            spread: 60,
            origin: { x: xRatio, y: yRatio },
            colors: ['#017a6c', '#00c2cc', '#FFD700', '#FF69B4'],
            disableForReducedMotion: true,
            zIndex: 100,
            scalar: 0.8,
        });
    };

    const getEventClass = (task: Task) => {
        if (task.type === 'event') {
            if (task.color) {
                switch (task.color) {
                    case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50';
                    case 'red': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50';
                    case 'green': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50';
                    case 'amber': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50';
                    case 'violet': return 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700/50';
                    case 'pink': return 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-700/50';
                    case 'cyan': return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700/50';
                    case 'slate': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
                }
            }
            return 'bg-primary text-white border-primary-dark';
        }
        if (task.color) {
            switch (task.color) {
                case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50';
                case 'red': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50';
                case 'green': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50';
                case 'amber': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50';
                case 'violet': return 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700/50';
                case 'pink': return 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-700/50';
                case 'cyan': return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700/50';
                case 'slate': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
                default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
            }
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    // --- Navigation Handlers ---

    const handlePrev = () => {
        setSlideDirection('right');
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else {
            setCurrentDate(addDays(currentDate, -1));
        }
        setTimeout(() => setSlideDirection('none'), 300);
    };

    const handleNext = () => {
        setSlideDirection('left');
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else {
            setCurrentDate(addDays(currentDate, 1));
        }
        setTimeout(() => setSlideDirection('none'), 300);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) handleNext();
            else handlePrev();
        }
        touchStartX.current = null;
    };

    const handleToday = () => setCurrentDate(new Date());

    const handleAddNew = () => {
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = (task: Task) => {
        if (editingTask) onEditTask(task);
        else onAddTask(task);
        setIsTaskModalOpen(false);
    };

    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            const [y, m, d] = e.target.value.split('-').map(Number);
            setCurrentDate(new Date(y, m - 1, d));
        }
    };

    // --- Render Logic ---

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const renderMonthPicker = () => {
        if (!isMonthPickerOpen || !isMobile) return null;

        return (
            <div
                ref={monthPickerRef}
                className="w-full flex items-center gap-2 overflow-x-auto custom-scrollbar-hide py-3 px-1 border-t border-border-light dark:border-border-dark animate-slide-in-down"
            >
                {(() => {
                    const today = new Date();
                    const currentYear = today.getFullYear();
                    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

                    return years.map(year => (
                        <div key={year} className="flex items-center gap-2 shrink-0">
                            <span className={`text-slate-500 dark:text-slate-400 font-black text-sm shrink-0 px-2 ${currentDate.getFullYear() === year ? 'text-primary' : ''}`}>
                                {year}
                            </span>
                            <div className="flex items-center gap-2">
                                {shortMonths.map((month, idx) => {
                                    const isSelected = currentDate.getFullYear() === year && currentDate.getMonth() === idx;
                                    return (
                                        <button
                                            key={`${year}-${month}`}
                                            onClick={() => {
                                                setCurrentDate(new Date(year, idx, currentDate.getDate()));
                                                if (viewMode === 'month') setIsMonthPickerOpen(false);
                                            }}
                                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all shrink-0 active-month-trigger ${isSelected
                                                ? 'bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm active-month'
                                                : 'bg-white/40 hover:bg-white/60 dark:bg-white/10 text-slate-600 dark:text-slate-400 border border-border-light dark:border-border-dark backdrop-blur-sm'
                                                }`}
                                        >
                                            {month}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-2"></div>
                        </div>
                    ));
                })()}
            </div>
        );
    };

    const renderHeader = () => {
        let title = "";
        if (viewMode === 'month') {
            title = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        } else {
            title = `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
        }

        const isoDate = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        return (
            <div className="px-4 md:px-6 pt-4 pb-3 md:pb-5 flex flex-col gap-2 shrink-0 sticky top-0 z-40 bg-transparent backdrop-blur-sm">
                <style>{`
          .date-picker-trigger::-webkit-calendar-picker-indicator {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            width: auto; height: auto;
            color: transparent; background: transparent;
          }
          @keyframes slideInFromRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes slideInFromLeft { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          .animate-slide-right { animation: slideInFromLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .animate-slide-left { animation: slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          @keyframes slideInDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .animate-slide-in-down { animation: slideInDown 0.2s ease-out; }
          .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
          .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

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

          .neu-button.Explore {
            color: #3035cb;
          }

          .neu-button.Explore:hover, .neu-button.Explore.active {
            background-color: #3035cb;
            color: #e4e4e4;
            box-shadow: none;
          }

          .neu-button.Post {
            color: #333;
          }

          .neu-button.Post:hover {
            background-color: #333;
            color: #e4e4e4;
            box-shadow: none;
          }

          .neu-toggle-group {
            background-color: #e4e4e4;
            padding: 1px;
            border-radius: 12px;
            display: flex;
            gap: 2px;
            box-shadow: inset 5px 5px 5px #c4c4c4,
                        inset -5px -5px 5px #ffffff;
            margin: 0 9px;
          }

          /* Override button styles when inside the toggle group */
          .neu-toggle-group .neu-button {
            box-shadow: none !important; 
            margin: 0;
            flex: 1;
            background: transparent;
          }

          /* The active button pops up with your specific brand blue */
          .neu-toggle-group .neu-button.active {
            background-color: #3035cb !important;
            color: #ffffff !important;
            border-radius: 10px;
            box-shadow: 4px 4px 8px rgba(0,0,0,0.15) !important;
          }
        `}</style>

                <div className="flex flex-1 items-center justify-between w-full">
                    <div className="flex items-center gap-6">
                        <div
                            className="relative group flex items-center gap-1.5 cursor-pointer"
                            onClick={() => isMobile && setIsMonthPickerOpen(!isMonthPickerOpen)}
                        >
                            <h2 className="text-[22px] md:text-3xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors select-none">
                                {title}
                            </h2>
                            <span className={`material-symbols-outlined text-slate-400 group-hover:text-primary transition-all text-lg md:text-xl ${isMonthPickerOpen && isMobile ? 'rotate-180' : ''}`}>expand_more</span>
                            {!isMobile && (
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    className="date-picker-trigger absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleDateInput}
                                    value={isoDate}
                                />
                            )}
                        </div>

                        {/* Desktop Navigation Group */}
                        <div className="hidden md:flex items-center bg-white/40 dark:bg-white/5 rounded-lg border border-border-light dark:border-border-dark p-1 shadow-sm h-9 backdrop-blur-sm">
                            <button onClick={handlePrev} className="h-full flex items-center justify-center px-2 hover:bg-white/60 dark:hover:bg-slate-700/50 rounded text-slate-500 dark:text-slate-400 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            </button>
                            <button onClick={handleToday} className="flex items-center px-3 h-full text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/50 rounded transition-colors">
                                Today
                            </button>
                            <button onClick={handleNext} className="h-full flex items-center justify-center px-2 hover:bg-white/60 dark:hover:bg-slate-700/50 rounded text-slate-500 dark:text-slate-400 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center z-20">
                        <div className="neu-toolbar-card">
                            <button
                                onClick={handleAddNew}
                                className="neu-button Post"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                <span>Event</span>
                            </button>

                            <div className="neu-toggle-group">
                                <button
                                    onClick={() => setViewMode('month')}
                                    className={`neu-button Explore ${viewMode === 'month' ? 'active' : ''}`}
                                >
                                    <span className="text-[20px] flex items-center justify-center">
                                        <MdOutlineCalendarMonth />
                                    </span>
                                    <span>Month</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('day')}
                                    className={`neu-button Explore ${viewMode === 'day' ? 'active' : ''}`}
                                >
                                    <span className="text-[18px] flex items-center justify-center">
                                        <MdOutlineViewDay />
                                    </span>
                                    <span>Day</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation Icons */}
                    <div className="flex md:hidden items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); handleToday(); }} className="flex items-center justify-center border-2 border-slate-600 dark:border-slate-500 rounded-md rounded-br-none w-7 h-7 hover:border-primary hover:text-primary transition-all">
                            <span className="text-[14px] font-black leading-none text-slate-600 dark:text-slate-300">{new Date().getDate()}</span>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setViewMode(viewMode === 'month' ? 'day' : 'month'); }}
                            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-primary transition-all"
                        >
                            {viewMode === 'month' ? (
                                <span className="text-[22px] flex items-center justify-center">
                                    <MdOutlineViewDay />
                                </span>
                            ) : (
                                <span className="text-[24px] flex items-center justify-center">
                                    <MdOutlineCalendarMonth />
                                </span>
                            )}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleAddNew(); }} className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-primary transition-all active:scale-95">
                            <span className="material-symbols-outlined text-[30px]">add_circle</span>
                        </button>
                    </div>
                </div>
                {renderMonthPicker()}
            </div>
        );
    };

    const renderMonthView = () => {
        const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
        const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;

        const days = [];
        const prevMonthDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() - 1);
        for (let i = startOffset - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, type: 'prev', fullDate: '' });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(i).padStart(2, '0');
            days.push({ day: i, type: 'current', fullDate: `${year}-${month}-${day}` });
        }
        const totalDaysSoFar = days.length;
        const remainingCells = (7 - (totalDaysSoFar % 7)) % 7;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: i, type: 'next', fullDate: '' });
        }
        const totalRows = Math.ceil(days.length / 7);

        return (
            <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-none md:rounded-xl shadow-card border-y md:border border-border-light dark:border-border-dark flex flex-col h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <div className={`grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky z-20 bg-white/20 dark:bg-white/5 backdrop-blur-md md:rounded-t-xl overflow-hidden ${isMonthPickerOpen ? 'top-[100px]' : 'top-[60px]'} md:top-[72px]`}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <div key={day} className="py-2 md:py-3 text-center text-[11px] md:text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-400">{day}</div>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 relative">
                    <div className={`grid grid-cols-7 auto-rows-[minmax(120px,1fr)] min-h-full transition-all ${slideDirection === 'left' ? 'animate-slide-left' : slideDirection === 'right' ? 'animate-slide-right' : ''}`}>
                        {days.map((dayObj, index) => {
                            const isCurrentMonth = dayObj.type === 'current';
                            const dayEvents = isCurrentMonth ? tasks.filter(t => t.date === dayObj.fullDate) : [];

                            const today = new Date();
                            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                            const isToday = dayObj.fullDate === todayStr;

                            const curY = currentDate.getFullYear();
                            const curM = String(currentDate.getMonth() + 1).padStart(2, '0');
                            const curD = String(currentDate.getDate()).padStart(2, '0');
                            const currentDateStr = `${curY}-${curM}-${curD}`;
                            const isSelected = dayObj.fullDate === currentDateStr;

                            const MAX_VISIBLE = isMobile ? 3 : 5;
                            const visibleEvents = dayEvents.slice(0, MAX_VISIBLE);
                            const overflow = dayEvents.length - MAX_VISIBLE;
                            const isLastCol = index % 7 === 6;
                            const isLastRow = Math.floor(index / 7) === totalRows - 1;
                            const borderClass = `${!isLastCol ? 'border-r' : ''} ${!isLastRow ? 'border-b' : ''}`;

                            return (
                                <div key={index} onClick={() => { if (isCurrentMonth) { setCurrentDate(new Date(dayObj.fullDate)); setViewMode('day'); } }} className={`min-h-[120px] border-border-light dark:border-border-dark p-2 relative group transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${borderClass} ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-black/20' : 'cursor-pointer'}`}>
                                    <div className="flex justify-center md:justify-between items-start">
                                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-primary text-white shadow-sm' : isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                            {dayObj.day}
                                        </span>
                                        {isCurrentMonth && (
                                            <button onClick={(e) => { e.stopPropagation(); setCurrentDate(new Date(dayObj.fullDate)); setEditingTask(null); setIsTaskModalOpen(true); }} className="hidden md:flex opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded">
                                                <span className="material-symbols-outlined text-[18px] block">add</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {visibleEvents.map(task => {
                                            const isCompleted = task.status === 'completed';
                                            const isEvent = task.type === 'event';
                                            return (
                                                <div key={task.id} onClick={(e) => { e.stopPropagation(); if (!isEvent) { if (!isCompleted) fireConfetti(e.clientX, e.clientY); onToggleTaskStatus(task.id); } }} className={`text-[10px] px-2 py-1 rounded-md border truncate font-bold shadow-sm cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5 ${getEventClass(task)} ${isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                                    {!isEvent && <span className={`material-symbols-outlined text-[12px] leading-none ${isCompleted ? 'filled' : ''}`}>{isCompleted ? 'check_circle' : 'radio_button_unchecked'}</span>}
                                                    {task.time && <span className={`opacity-75 font-medium whitespace-nowrap ${isCompleted ? 'line-through' : ''}`}>{task.time}</span>}
                                                    <span className={`truncate ${isCompleted ? 'line-through' : ''}`}>{task.title}</span>
                                                </div>
                                            );
                                        })}
                                        {overflow > 0 && (
                                            <button onClick={(e) => { e.stopPropagation(); setCurrentDate(new Date(dayObj.fullDate)); setViewMode('day'); }} className="text-[10px] text-slate-500 dark:text-slate-400 font-bold pl-1 hover:text-primary transition-colors flex items-center gap-0.5 mt-1">
                                                <span>+{overflow} more</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayTasks = tasks.filter(t => t.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        const currentJsDay = currentDate.getDay();
        const dayOfWeekIndex = currentJsDay === 0 ? 6 : currentJsDay - 1;

        const pastDays = [];
        for (let i = 0; i < dayOfWeekIndex; i++) {
            const offset = -(dayOfWeekIndex - i);
            const d = addDays(currentDate, offset);
            const dStr = d.toISOString().split('T')[0];
            const tasksForDay = tasks.filter(t => t.date === dStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
            pastDays.push({ date: d, tasks: tasksForDay });
        }

        const upcomingDays = [];
        const daysToGenerate = currentJsDay === 0 ? 0 : 7 - currentJsDay;
        for (let i = 1; i <= daysToGenerate; i++) {
            const d = addDays(currentDate, i);
            const dStr = d.toISOString().split('T')[0];
            const tasksForDay = tasks.filter(t => t.date === dStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
            upcomingDays.push({ date: d, tasks: tasksForDay });
        }

        const renderTaskItem = (task: Task) => {
            const isEvent = task.type === 'event';
            const isCompleted = task.status === 'completed';

            return (
                <div
                    key={task.id}
                    onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                    className={`group flex items-center gap-4 px-5 py-4 rounded-2xl border font-bold shadow-sm cursor-pointer hover:shadow-md transition-all ${getEventClass(task)} ${isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}
                >
                    {/* Status Icon (Left) */}
                    <div className="flex-shrink-0">
                        {!isEvent ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isCompleted) fireConfetti(e.clientX, e.clientY);
                                    onToggleTaskStatus(task.id);
                                }}
                                className={`flex items-center justify-center transition-all ${isCompleted ? 'text-inherit opacity-100' : 'text-inherit opacity-60 hover:opacity-100'}`}
                            >
                                <span className={`material-symbols-outlined text-[24px] ${isCompleted ? 'filled' : ''}`}>
                                    {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                            </button>
                        ) : (
                            <div className="flex items-center justify-center">
                                <span className="material-symbols-outlined text-[22px] flex-shrink-0 opacity-60">calendar_today</span>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className={`text-[16px] font-bold truncate ${isCompleted ? 'line-through' : ''}`}>
                            {task.title}
                        </span>
                        {task.time && (
                            <div className="flex items-center gap-1.5 opacity-60">
                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                <span className={`text-[13px] font-bold ${isCompleted ? 'line-through' : ''}`}>
                                    {task.time}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right Side Actions & Priority */}
                    <div className="flex items-center gap-4 px-2">
                        {/* Priority Badge */}
                        {task.urgency === 'High' && (
                            <span className="material-symbols-outlined text-[23px] flex-shrink-0 text-red-500 filled">
                                flag
                            </span>
                        )}
                        {task.urgency === 'Medium' && (
                            <span className="material-symbols-outlined text-[23px] flex-shrink-0 text-amber-500 filled">
                                flag
                            </span>
                        )}
                        {task.urgency === 'Low' && (
                            <span className="material-symbols-outlined text-[23px] flex-shrink-0 text-blue-500 filled">
                                flag
                            </span>
                        )}

                    </div>
                </div>
            );
        };

        const renderDayBlock = (date: Date, tasksForDay: Task[], isPast = false, marginClass = 'mb-8') => {
            const isToday = date.toDateString() === new Date().toDateString();
            const dateLabel = isToday ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

            return (
                <div key={date.toISOString()} onClick={() => setCurrentDate(date)} className={`${marginClass} transition-opacity cursor-pointer ${isPast ? 'opacity-60 hover:opacity-100' : 'opacity-100'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className={`text-[13px] font-black tracking-widest ${isToday ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>{dateLabel}</span>
                            <span className={`text-[13px] font-black ${isToday ? 'text-primary/60' : 'text-slate-400 dark:text-slate-500'}`}>({tasksForDay.length})</span>
                        </div>
                        <div className={`flex-1 h-px ${isToday ? 'bg-primary/30' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                        <button className={`material-symbols-outlined text-[20px] ${isToday ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>expand_more</button>
                    </div>

                    <div className="space-y-4">
                        {tasksForDay.length > 0 ? tasksForDay.map(renderTaskItem) : (
                            <div className="text-center py-6 text-slate-400 italic text-sm">No plans for this day yet.</div>
                        )}
                    </div>
                </div>
            );
        };

        return (
            <div className="max-w-3xl mx-auto w-full px-4 md:px-0 pb-10">
                {pastDays.map(d => renderDayBlock(d.date, d.tasks, true))}

                <div ref={activeDayRef} className="scroll-mt-24">
                    {renderDayBlock(currentDate, dayTasks, false, 'mb-5')}
                </div>

                <div className="mb-8">
                    <button
                        onClick={handleAddNew}
                        className="w-full h-14 flex items-center justify-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-primary hover:border-primary hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                    >
                        <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">add_circle</span>
                        <span className="font-bold text-[15px]">Create new plan</span>
                    </button>
                </div>

                {upcomingDays.map(d => renderDayBlock(d.date, d.tasks, false))}
            </div>
        );
    };

    return (
        <React.Fragment>
            <NewTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSave={handleSaveTask} initialDate={currentDate} initialTask={editingTask} onDelete={onDeleteTask} />
            <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50/50 dark:bg-transparent">
                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
                    {renderHeader()}
                    <div className="flex-1 flex flex-col min-h-0 p-0 md:px-6 md:pb-6">
                        {viewMode === 'month' ? renderMonthView() : <div className="h-full">{renderDayView()}</div>}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default CalendarView;