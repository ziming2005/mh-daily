import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '../App';
import confetti from 'canvas-confetti';
import NewTaskModal from './NewTaskModal';

interface TaskListViewProps {
    toggleTheme: () => void;
    isDarkMode: boolean;
    tasks: Task[];
    onToggleTaskStatus: (taskId: string) => void;
    onAddTask: (task: Task) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
}

interface TaskGroup {
    id: string;
    label: string;
    dateStr: string;
    tasks: Task[];
    isOverdue?: boolean;
    index: number;
}

const TaskListView: React.FC<TaskListViewProps> = ({ toggleTheme, isDarkMode, tasks, onToggleTaskStatus, onAddTask, onEditTask, onDeleteTask }) => {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedDateForNewTask, setSelectedDateForNewTask] = useState<Date | undefined>(undefined);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [numColumns, setNumColumns] = useState(5);
    const [viewMode, setViewMode] = useState<'board' | 'carousel'>('carousel');

    // 3D Orbit Interaction State
    const [rotationAngle, setRotationAngle] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isAutoRotating = viewMode === 'carousel' && !isDragging && !isHovered;
    const startX = useRef(0);
    const baseAngle = useRef(0);
    const clickStartTime = useRef(0);
    const requestRef = useRef<number>();

    // Auto-rotation effect
    useEffect(() => {
        if (!isAutoRotating) {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            return;
        }

        const animate = () => {
            setRotationAngle(prev => prev + 0.15);
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [viewMode, isDragging, isHovered]);

    const handleCarouselMouseUp = () => {
        setIsDragging(false);
    };

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<{
        status: 'all' | 'active' | 'completed';
        type: 'all' | 'task' | 'event';
        urgency: 'all' | 'High' | 'Medium' | 'Low' | 'Normal';
        timeframe: 'all' | 'past' | 'today' | 'upcoming';
    }>({
        status: 'all',
        type: 'all',
        urgency: 'all',
        timeframe: 'all'
    });
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateColumns = () => {
            if (window.innerWidth < 768) setNumColumns(1);
            else if (window.innerWidth < 1024) setNumColumns(2);
            else if (window.innerWidth < 1440) setNumColumns(3);
            else if (window.innerWidth < 1800) setNumColumns(4);
            else setNumColumns(5);
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    // Filter click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        if (isFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isFilterOpen]);

    const toggleGroup = (group: string) => {
        const newSet = new Set(collapsedGroups);
        if (newSet.has(group)) {
            newSet.delete(group);
        } else {
            newSet.add(group);
        }
        setCollapsedGroups(newSet);
    };

    const filteredTasks = useMemo(() => {
        const todayStr = new Date().toLocaleDateString('en-CA');
        return tasks.filter(task => {
            // Status Filter
            if (filters.status === 'active' && task.status === 'completed') return false;
            if (filters.status === 'completed' && task.status !== 'completed') return false;

            // Type Filter
            if (filters.type !== 'all' && task.type !== filters.type) return false;

            // Urgency Filter
            if (filters.urgency !== 'all' && task.urgency !== filters.urgency) return false;

            // Timeframe Filter
            if (filters.timeframe === 'past') {
                if (task.date >= todayStr) return false;
            } else if (filters.timeframe === 'today') {
                if (task.date !== todayStr) return false;
            } else if (filters.timeframe === 'upcoming') {
                if (task.date <= todayStr) return false;
            }

            // ** NEW LOGIC **
            // If NOT explicitly looking at 'past', hide completed tasks that are in the past.
            // This ensures 'Overdue' only shows actionable items.
            if (filters.timeframe !== 'past' && task.date < todayStr && task.status === 'completed') {
                return false;
            }

            return true;
        });
    }, [tasks, filters]);

    const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

    const [focusedGroupId, setFocusedGroupId] = useState<string | null>(null);

    const boardGroups = useMemo(() => {
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-CA');
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-CA');

        const groups: { id: string; label: string; dateStr: string; tasks: Task[]; isOverdue?: boolean; index: number }[] = [];
        let indexCounter = 0;

        // Pre-populate with the next 5 days starting from today
        const datesToShow = new Set<string>();
        for (let i = 0; i < 5; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            datesToShow.add(d.toLocaleDateString('en-CA'));
        }

        // 2. Add ALL dates from filteredTasks (Past, Present, Future)
        filteredTasks.forEach(t => {
            datesToShow.add(t.date);
        });

        const sortedDates = Array.from(datesToShow).sort();

        sortedDates.forEach(dateStr => {
            const dateTasks = filteredTasks.filter(t => t.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            let label = '';
            const isOverdue = dateStr < todayStr;

            if (dateStr === todayStr) label = 'Today';
            else if (dateStr === tomorrowStr) label = 'Tomorrow';
            else {
                const [y, m, d] = dateStr.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                label = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            }

            groups.push({
                id: dateStr,
                label,
                dateStr,
                tasks: dateTasks,
                isOverdue,
                index: indexCounter++
            });
        });

        return groups as TaskGroup[];
    }, [filteredTasks, filters.timeframe]);

    const distributedGroups = useMemo(() => {
        const cols: typeof boardGroups[] = Array.from({ length: numColumns }, () => []);
        boardGroups.forEach((group, i) => {
            cols[i % numColumns].push(group);
        });
        return cols;
    }, [boardGroups, numColumns]);

    const focusedGroup = useMemo(() => {
        if (!focusedGroupId) return null;
        return boardGroups.find(g => g.id === focusedGroupId) || null;
    }, [focusedGroupId, boardGroups]);

    const handleCarouselMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        clickStartTime.current = Date.now();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        startX.current = clientX;
        baseAngle.current = rotationAngle;
    };

    const handleCarouselMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - startX.current;
        // Sensitivity: 0.5 degrees per pixel
        setRotationAngle(baseAngle.current + deltaX * 0.5);
    };

    const handleCardClick = (group: TaskGroup) => {
        // Only trigger if it's not a drag (short click duration and no movement)
        const duration = Date.now() - clickStartTime.current;
        if (duration < 200) {
            setFocusedGroupId(group.id);
        }
    };

    const getTaskStyles = (task: Task) => {
        if (task.color) {
            const colors: any = {
                blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-700/50' },
                red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', border: 'border-red-200 dark:border-red-700/50' },
                green: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-700/50' },
                amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-700/50' },
                violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500', border: 'border-violet-200 dark:border-violet-700/50' },
                pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', dot: 'bg-pink-500', border: 'border-pink-200 dark:border-pink-700/50' },
                cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500', border: 'border-cyan-200 dark:border-cyan-700/50' },
                slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-500', border: 'border-slate-200 dark:border-slate-700' },
            };
            return colors[task.color] || colors.slate;
        }
        return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600', dot: 'bg-slate-500', border: 'border-slate-200' };
    };

    const getUrgencyStyles = (urgency: string) => {
        switch (urgency) {
            case 'High': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
            case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
            case 'Low': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
            default: return 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    };

    const getDayColumnStyle = (index: number) => {
        const styles = [
            // Monday - Beige/Yellow
            'bg-[#FDF6D8] dark:bg-yellow-900/30 border-[#F5E6A3] dark:border-yellow-900/40 backdrop-blur-sm',
            // Tuesday - Blue
            'bg-[#E3F1FC] dark:bg-blue-900/30 border-[#C8E4FA] dark:border-blue-900/40 backdrop-blur-sm',
            // Wednesday - Green
            'bg-[#E8F5E9] dark:bg-green-900/30 border-[#C8E6C9] dark:border-green-900/40 backdrop-blur-sm',
            // Thursday - Purple
            'bg-[#F3E5F5] dark:bg-purple-900/30 border-[#E1BEE7] dark:border-purple-900/40 backdrop-blur-sm',
            // Friday - Pink
            'bg-[#FCE4EC] dark:bg-pink-900/30 border-[#F8BBD0] dark:border-pink-900/40 backdrop-blur-sm',
            // Saturday - Orange
            'bg-[#FFF3E0] dark:bg-orange-900/30 border-[#FFE0B2] dark:border-orange-900/40 backdrop-blur-sm',
            // Sunday - Cyan
            'bg-[#E0F7FA] dark:bg-cyan-900/30 border-[#B2EBF2] dark:border-cyan-900/40 backdrop-blur-sm',
        ];
        return styles[index % styles.length];
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

    const handleAddNew = () => {
        setEditingTask(null);
        setSelectedDateForNewTask(undefined);
        setIsTaskModalOpen(true);
    };

    const handleAddNewForDate = (date: Date) => {
        setEditingTask(null);
        setSelectedDateForNewTask(date);
        setIsTaskModalOpen(true);
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setSelectedDateForNewTask(undefined);
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = (task: Task) => {
        if (editingTask) {
            onEditTask(task);
        } else {
            onAddTask(task);
        }
        setIsTaskModalOpen(false);
    };

    // DnD Handlers
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
        setDraggedTaskId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDateDrop = (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        if (draggedTaskId) {
            const task = tasks.find(t => t.id === draggedTaskId);
            if (task && task.date !== dateStr) {
                onEditTask({ ...task, date: dateStr });
            }
        }
        setDraggedTaskId(null);
    };





    const todayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });



    // Color map for 3D cards based on the day-of-week style provided by the user
    // We map the border colors of each day style to RGB for the glow effect
    const dayColorRGB = [
        '245, 230, 163', // Monday - Beige/Yellow
        '200, 228, 250', // Tuesday - Blue
        '200, 230, 201', // Wednesday - Green
        '225, 190, 231', // Thursday - Purple
        '248, 187, 208', // Friday - Pink
        '255, 224, 178', // Saturday - Orange
        '178, 235, 242', // Sunday - Cyan
    ];

    return (
        <>
            <NewTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleSaveTask}
                initialTask={editingTask}
                initialDate={selectedDateForNewTask}
                onDelete={onDeleteTask}
            />
            <style>{`
                .carousel-wrapper {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .carousel-inner {
                    --w: 200px;
                    --h: 250px;
                    --quantity: ${Math.min(boardGroups.length, 8)};
                    /* Dynamic radius based on quantity to prevent overlap */
                    --translateZ: calc(max(400px, (var(--w) * var(--quantity)) / 6.28 + 100px));
                    --rotateX: -13deg;
                    --perspective: 1500px;
                    position: relative;
                    width: var(--w);
                    height: var(--h);
                    top: -65px;
                    transform-style: preserve-3d;
                    transform: perspective(var(--perspective)) rotateX(var(--rotateX)) rotateY(${rotationAngle}deg);
                    transition: ${isDragging || isAutoRotating ? 'none' : 'transform 0.5s cubic-bezier(0.1, 0, 0.1, 1)'};
                }

                .carousel-card {
                    position: absolute;
                    inset: 0;
                    transform: rotateY(calc((360deg / var(--quantity)) * var(--index))) translateZ(var(--translateZ));
                    transform-style: preserve-3d;
                    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
                    cursor: pointer;
                    backface-visibility: visible;
                }

                .carousel-card:hover {
                    scale: 1.05;
                }

                /* Show/hide content based on rotation relative to viewer */
                .card-content {
                    width: 100%;
                    height: 100%;
                    border-radius: 20px;
                    border: 2px solid rgba(var(--color-card), 0.5);
                    display: flex;
                    flex-direction: column;
                    padding: 15px 12px;
                    text-align: left;
                    box-shadow: 0 0 30px rgba(var(--color-card), 0.2), 
                                inset 0 0 20px rgba(var(--color-card), 0.1);
                    overflow: hidden;
                    position: relative;
                }

                .card-content .custom-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .card-content .custom-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                    touch-action: pan-y;
                    pointer-events: auto;
                }

                .card-glow {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 0%, rgba(var(--color-card), 0.4) 0%, transparent 70%);
                    pointer-events: none;
                }

                .card-footer {
                    margin-top: auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
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

                .neu-button.Chat {
                    color: #b82323;
                }

                .neu-button.Chat:hover, .neu-button.Chat.active {
                    background-color: #b82323;
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

            <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">

                <div className="px-6 py-5 flex flex-col sm:flex-row items-center justify-end z-20">
                    <div className="neu-toolbar-card">
                        <button
                            onClick={handleAddNew}
                            className="neu-button Post"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            <span>Task</span>
                        </button>

                        <div className="neu-toggle-group">
                            <button
                                onClick={() => setViewMode('carousel')}
                                className={`neu-button Explore ${viewMode === 'carousel' ? 'active' : ''}`}
                            >
                                <span className="material-symbols-outlined">deployed_code</span>
                                <span>Orbit</span>
                            </button>

                            <button
                                onClick={() => setViewMode('board')}
                                className={`neu-button Explore ${viewMode === 'board' ? 'active' : ''}`}
                            >
                                <span className="material-symbols-outlined">dashboard</span>
                                <span>Board</span>
                            </button>
                        </div>

                        <div className="relative h-full" ref={filterRef}>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`neu-button Chat ${isFilterOpen || activeFilterCount > 0 ? 'active' : ''}`}
                            >
                                <span className="material-symbols-outlined">filter_list</span>
                                Filter
                                {activeFilterCount > 0 && (
                                    <span className="ml-1 opacity-70">({activeFilterCount})</span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-5 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-900 dark:text-white">Filters</h3>
                                        {activeFilterCount > 0 && (
                                            <button
                                                onClick={() => setFilters({ status: 'all', type: 'all', urgency: 'all', timeframe: 'all' })}
                                                className="text-xs text-primary font-bold hover:underline"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-8">
                                        {/* Filters content remains the same - minimized for clarity */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['all', 'past', 'today', 'upcoming'].map(t => (
                                                    <button key={t} onClick={() => setFilters({ ...filters, timeframe: t as any })}
                                                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all capitalize ${filters.timeframe === t ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>{t}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
                                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                                {['all', 'active', 'completed'].map(s => (
                                                    <button key={s} onClick={() => setFilters({ ...filters, status: s as any })}
                                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${filters.status === s ? 'bg-white dark:bg-surface-dark shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{s}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    {viewMode === 'carousel' ? (
                        <div
                            className={`carousel-wrapper ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                            onMouseDown={handleCarouselMouseDown}
                            onMouseMove={handleCarouselMouseMove}
                            onMouseUp={handleCarouselMouseUp}
                            onMouseLeave={() => {
                                handleCarouselMouseUp();
                                setIsHovered(false);
                            }}
                            onTouchStart={handleCarouselMouseDown}
                            onTouchMove={handleCarouselMouseMove}
                            onTouchEnd={handleCarouselMouseUp}
                        >
                            {boardGroups.length > 0 ? (
                                <div className="carousel-inner">
                                    {boardGroups.slice(0, 10).map((group, index) => {
                                        const rgb = group.isOverdue ? '254, 226, 226' : dayColorRGB[group.index % dayColorRGB.length];
                                        const dayClasses = group.isOverdue
                                            ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                                            : getDayColumnStyle(group.index);

                                        return (
                                            <div
                                                key={group.id}
                                                className="carousel-card"
                                                style={{ '--index': index, '--color-card': rgb } as any}
                                                onMouseEnter={() => setIsHovered(true)}
                                                onMouseLeave={() => setIsHovered(false)}
                                                onClick={() => handleCardClick(group)}
                                            >
                                                <div className={`card-content ${dayClasses}`}>
                                                    <div className="card-glow"></div>

                                                    <div className="flex justify-between items-center mb-2">
                                                        <h3 className={`text-[15px] font-bold tracking-tight ${group.isOverdue ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                                            {group.label}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-full border border-white/20">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-slate-300">{group.tasks.length}</span>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="flex-1 overflow-y-auto custom-scrollbar space-y-2"
                                                        style={{ transform: 'translateZ(1px)' }}
                                                        onWheel={(e) => e.stopPropagation()}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        onTouchStart={(e) => e.stopPropagation()}
                                                        onTouchMove={(e) => e.stopPropagation()}
                                                    >
                                                        {group.tasks.length === 0 ? (
                                                            <div className="py-10 text-center font-medium text-slate-500 dark:text-slate-500 text-sm italic">
                                                                No tasks
                                                            </div>
                                                        ) : (
                                                            group.tasks.map(task => {
                                                                const isCompleted = task.status === 'completed';
                                                                const isEvent = task.type === 'event';

                                                                return (
                                                                    <div
                                                                        key={task.id}
                                                                        className={`flex items-start gap-2 p-2 rounded-xl transition-all ${isCompleted ? 'opacity-40' : 'bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/40'}`}
                                                                        onClick={() => setFocusedGroupId(group.id)}
                                                                    >
                                                                        {!isEvent ? (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (!isCompleted) fireConfetti(e.clientX, e.clientY);
                                                                                    onToggleTaskStatus(task.id);
                                                                                }}
                                                                                className={`mt-0.5 shrink-0 w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${isCompleted ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-primary'}`}
                                                                            >
                                                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                                                            </button>
                                                                        ) : (
                                                                            <span className="material-symbols-outlined text-[20px] text-slate-400 shrink-0">event</span>
                                                                        )}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                                <p className={`text-sm font-bold leading-tight truncate ${isCompleted ? 'line-through text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                                                                                    {task.title}
                                                                                </p>
                                                                                {task.urgency !== 'Normal' && (
                                                                                    <span className={`material-symbols-outlined text-[14px] filled shrink-0 ${task.urgency === 'High' ? 'text-red-500' :
                                                                                        task.urgency === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                                                                                        }`}>flag</span>
                                                                                )}
                                                                            </div>
                                                                            {task.time && (
                                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{task.time.slice(0, 5)}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>


                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700">
                                    <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                                        <span className="material-symbols-outlined text-[40px]">inventory_2</span>
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No tasks in orbit</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
                            <div className="flex gap-6 pb-10 items-start">
                                {distributedGroups.map((colGroups, colIndex) => (
                                    <div key={colIndex} className="flex-1 flex flex-col gap-6 min-w-0">
                                        {colGroups.map((group) => {
                                            const colStyle = group.isOverdue
                                                ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                                                : getDayColumnStyle(group.index);

                                            return (
                                                <div
                                                    key={group.id}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDateDrop(e, group.dateStr)}
                                                    className={`w-full h-fit rounded-[2rem] p-5 border ${colStyle} transition-all shadow-sm flex flex-col`}
                                                >
                                                    <h3 className={`text-xl font-bold mb-4 px-2 ${group.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-100'}`}>
                                                        {group.label}
                                                    </h3>

                                                    <div className={`space-y-3 ${draggedTaskId ? 'min-h-[100px] bg-black/5 dark:bg-white/5 rounded-xl transition-all' : ''}`}>
                                                        {group.tasks.length === 0 && !draggedTaskId && (
                                                            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                                                                No tasks
                                                            </div>
                                                        )}
                                                        {group.tasks.map(task => {
                                                            const isCompleted = task.status === 'completed';
                                                            const isEvent = task.type === 'event';

                                                            return (
                                                                <div
                                                                    key={task.id}
                                                                    draggable="true"
                                                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                                                    onDragEnd={handleDragEnd}
                                                                    className={`group flex items-center gap-4 cursor-grab active:cursor-grabbing hover:bg-white/40 dark:hover:bg-black/20 p-2 rounded-lg transition-colors ${isCompleted ? 'opacity-50' : ''}`}
                                                                >
                                                                    {!isEvent ? (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (!isCompleted) fireConfetti(e.clientX, e.clientY);
                                                                                onToggleTaskStatus(task.id);
                                                                            }}
                                                                            className={`text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors`}
                                                                        >
                                                                            <span className={`material-symbols-outlined text-[22px] ${isCompleted ? 'filled text-primary' : ''}`}>
                                                                                {isCompleted ? 'check_box' : 'check_box_outline_blank'}
                                                                            </span>
                                                                        </button>
                                                                    ) : (
                                                                        <span className={`material-symbols-outlined text-[22px] text-slate-400`}>event</span>
                                                                    )}
                                                                    <div className="flex-1 min-w-0" onClick={() => handleEdit(task)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className={`text-base font-medium text-slate-900 dark:text-white leading-snug tracking-tight truncate ${isCompleted ? 'line-through' : ''}`}>
                                                                                {task.title}
                                                                            </p>
                                                                            {task.urgency !== 'Normal' && (
                                                                                <span className={`material-symbols-outlined text-[18px] filled shrink-0 ${task.urgency === 'High' ? 'text-red-500' :
                                                                                    task.urgency === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                                                                                    }`}>flag</span>
                                                                            )}
                                                                        </div>
                                                                        {task.time && (
                                                                            <div className="mt-0.5">
                                                                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums tracking-tight">{task.time?.slice(0, 5)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {!group.isOverdue && (
                                                        <button
                                                            onClick={() => {
                                                                const [y, m, d] = group.dateStr.split('-').map(Number);
                                                                const dateObj = new Date(y, m - 1, d);
                                                                handleAddNewForDate(dateObj);
                                                            }}
                                                            className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors px-2 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 w-full -ml-1 text-left"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">add</span>
                                                            New Task
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DAILY FOCUS OVERLAY (EXPANDED CARD) */}
            {focusedGroup && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300"
                    onClick={() => setFocusedGroupId(null)}
                >
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

                    <div
                        className={`relative w-full max-w-md aspect-[3/4] max-h-[80vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 border-[5px] duration-500 ${focusedGroup.isOverdue ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' : getDayColumnStyle(focusedGroup.index)}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backdropFilter: 'blur(4px)',
                            boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.3)'
                        }}
                    >
                        {/* Daily Focus Header & Content */}
                        <div className="h-full flex flex-col p-8">
                            <div className="flex justify-between items-start mb-8">
                                <h2 className={`text-3xl font-bold tracking-tight ${focusedGroup.isOverdue ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                    {focusedGroup.label}
                                </h2>
                                <button
                                    onClick={() => setFocusedGroupId(null)}
                                    className="w-12 h-12 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center transition-colors"
                                >
                                    <span className="material-symbols-outlined text-slate-800 dark:text-white">close</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                                {focusedGroup.tasks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                        <span className="material-symbols-outlined text-[64px] mb-4">task_alt</span>
                                        <p className="font-bold text-lg italic">All clear for this day!</p>
                                    </div>
                                ) : (
                                    focusedGroup.tasks.map(task => {
                                        const isCompleted = task.status === 'completed';
                                        const isEvent = task.type === 'event';
                                        return (
                                            <div
                                                key={task.id}
                                                className={`group px-5 py-4 rounded-2xl transition-all ${isCompleted ? 'opacity-50' : 'bg-white/40 dark:bg-black/30 hover:bg-white/60 dark:hover:bg-black/50 shadow-sm'}`}
                                                onClick={() => handleEdit(task)}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {!isEvent ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!isCompleted) fireConfetti(e.clientX, e.clientY);
                                                                onToggleTaskStatus(task.id);
                                                            }}
                                                            className={`mt-1 shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${isCompleted ? 'bg-primary border-primary text-white' : 'border-slate-400 dark:border-slate-500 text-transparent hover:border-primary'}`}
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">check</span>
                                                        </button>
                                                    ) : (
                                                        <span className="material-symbols-outlined mt-1 text-[23px] text-slate-500 shrink-0">event</span>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                <p className={`text-[17px] font-medium truncate ${isCompleted ? 'line-through' : 'text-slate-900 dark:text-white'}`}>
                                                                    {task.title}
                                                                </p>
                                                                {task.urgency !== 'Normal' && (
                                                                    <span className={`material-symbols-outlined text-[20px] filled shrink-0 ${task.urgency === 'High' ? 'text-red-500' :
                                                                        task.urgency === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                                                                        }`}>flag</span>
                                                                )}
                                                            </div>
                                                            {task.time && (
                                                                <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tabular-nums shrink-0">
                                                                    {task.time.slice(0, 5)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {!focusedGroup.isOverdue && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const [y, m, d] = focusedGroup.dateStr.split('-').map(Number);
                                        const dateObj = new Date(y, m - 1, d);
                                        handleAddNewForDate(dateObj);
                                    }}
                                    className="mt-6 w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all text-lg"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    ADD TASK TO {focusedGroup.label.split(',')[0].toUpperCase()}
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default TaskListView;