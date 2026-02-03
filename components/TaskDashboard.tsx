import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, WhiteboardNote } from '../App';
import { BlockData } from './NewBlockModal';
import confetti from 'canvas-confetti';

interface TaskDashboardProps {
    toggleTheme: () => void;
    isDarkMode: boolean;
    tasks: Task[];
    blocks: BlockData[];
    onToggleTaskStatus: (taskId: string) => void;
    notes: WhiteboardNote[];
    setNotes: React.Dispatch<React.SetStateAction<WhiteboardNote[]>>;
}

// --- Helper Functions ---

const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const addDuration = (startTime: string, duration?: string) => {
    if (!startTime) return startTime;
    if (!duration || duration.toLowerCase() === 'all day') return formatTime(timeToMinutes(startTime) + 30);

    try {
        const [h, m] = startTime.split(':').map(Number);
        let totalMinutes = h * 60 + m;

        const hoursMatch = duration.match(/(\d+)\s*h/);
        const minsMatch = duration.match(/(\d+)\s*m/);

        if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
        if (minsMatch) totalMinutes += parseInt(minsMatch[1]);

        return formatTime(totalMinutes);
    } catch {
        return formatTime(timeToMinutes(startTime) + 30);
    }
};

const formatTime = (totalMinutes: number) => {
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

// --- Sub-Components ---
const AnalogClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const startRef = useRef(new Date());

    // Calculate difference in seconds from mount to ensure monotonic values
    // We base everything on the initial render time to prevent large number precision issues
    const startSeconds = startRef.current.getHours() * 3600 + startRef.current.getMinutes() * 60 + startRef.current.getSeconds();
    const diffSeconds = Math.floor((time.getTime() - startRef.current.getTime()) / 1000);
    const safeTotalSeconds = startSeconds + diffSeconds;

    const secDeg = safeTotalSeconds * 6;
    const minDeg = (safeTotalSeconds / 60) * 6;
    const hourDeg = (safeTotalSeconds / 3600) * 30;

    return (
        <div className="relative flex items-center justify-center scale-75 sm:scale-100 py-0">
            <style>{`
                .neu-clock-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 240px;
                    height: 240px;
                }

                .clock-face {
                    width: 230px;
                    height: 230px;
                    background-color: #e0e5ec;
                    border-radius: 50%;
                    box-shadow:
                        12px 12px 24px #a3b1c6,
                        -12px -12px 24px #ffffff;
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .clock-face::before {
                    content: "";
                    position: absolute;
                    width: 92%;
                    height: 92%;
                    background-color: transparent;
                    border-radius: 50%;
                    box-shadow:
                        inset 8px 8px 16px #a3b1c6,
                        inset -8px -8px 16px #ffffff;
                }

                .marker {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    z-index: 1;
                }

                .marker-dot {
                    position: absolute;
                    top: 12px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 3px;
                    height: 3px;
                    border-radius: 50%;
                    background-color: #e0e5ec;
                    box-shadow:
                        inset 1px 1px 2px #a3b1c6,
                        inset -1px -1px 2px #ffffff;
                }

                /* Markers */
                ${[...Array(12)].map((_, i) => `
                    .marker-${i + 1} { transform: rotate(${(i + 1) * 30}deg); }
                    ${(i + 1) % 3 === 0 ? `.marker-${i + 1} .marker-dot { width: 5px; height: 5px; }` : ''}
                `).join('\n')}

                .num-label {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    text-align: center;
                    font-size: 18px;
                    font-weight: 600;
                    color: #b8c1d1;
                    text-shadow:
                        1px 1px 1px #ffffff,
                        -1px -1px 1px #a3b1c6;
                    z-index: 2;
                }

                ${[...Array(12)].map((_, i) => `
                    .num-${i + 1} { transform: rotate(${(i + 1) * 30}deg); }
                    .num-${i + 1}-text { 
                        display: inline-block; 
                        transform: translateY(26px) rotate(${-(i + 1) * 30}deg); 
                    }
                `).join('\n')}

                .clock-hand {
                    position: absolute;
                    bottom: 50%;
                    left: 50%;
                    transform-origin: bottom center;
                    border-radius: 10px 10px 0 0;
                    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.15);
                    transition: transform 0.5s cubic-bezier(0.4, 2.08, 0.55, 0.44);
                }

                .neu-hour-hand {
                    width: 6px;
                    height: 45px;
                    background: #4a5463;
                    z-index: 5;
                }

                .neu-minute-hand {
                    width: 4px;
                    height: 65px;
                    background: #7a8a9e;
                    z-index: 6;
                }

                .neu-second-hand {
                    width: 2px;
                    height: 82px;
                    background: #e65e5e;
                    z-index: 7;
                    transition: transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44);
                }

                .center-pin {
                    width: 16px;
                    height: 16px;
                    background: #e0e5ec;
                    border-radius: 50%;
                    position: absolute;
                    z-index: 10;
                    box-shadow:
                        inset 3px 3px 6px #a3b1c6,
                        inset -3px -3px 6px #ffffff;
                }

                .center-pin::after {
                    content: "";
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 5px;
                    height: 5px;
                    background: #4a5463;
                    border-radius: 50%;
                }

                /* Custom Heart Checkbox */
                .heart-container input {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                    height: 0;
                    width: 0;
                }

                .heart-container {
                    display: block;
                    position: relative;
                    cursor: pointer;
                    font-size: 14px;
                    user-select: none;
                    transition: 100ms;
                }

                .heart-checkmark {
                    top: 0;
                    left: 0;
                    height: 1.6em;
                    width: 1.6em;
                    transition: 100ms;
                    animation: dislike_effect 400ms ease;
                }

                .heart-container input:checked ~ .heart-checkmark path {
                    fill: #FF5353;
                    stroke-width: 0;
                }

                .heart-container input:checked ~ .heart-checkmark {
                    animation: like_effect 400ms ease;
                }

                .heart-container:hover {
                    transform: scale(1.1);
                }

                @keyframes like_effect {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                @keyframes dislike_effect {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `}</style>

            <div className="neu-clock-container">
                <div className="clock-face">
                    {/* Markers */}
                    {[...Array(12)].map((_, i) => (
                        <div key={`marker-${i + 1}`} className={`marker marker-${i + 1}`}>
                            <div className="marker-dot"></div>
                        </div>
                    ))}

                    {/* Numbers */}
                    {[...Array(12)].map((_, i) => (
                        <div key={`num-${i + 1}`} className={`num-label num-${i + 1}`}>
                            <span className={`num-${i + 1}-text`}>{i + 1}</span>
                        </div>
                    ))}

                    {/* Hands */}
                    <div
                        className="clock-hand neu-hour-hand"
                        style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
                    ></div>
                    <div
                        className="clock-hand neu-minute-hand"
                        style={{ transform: `translateX(-50%) rotate(${minDeg}deg)` }}
                    ></div>
                    <div
                        className="clock-hand neu-second-hand"
                        style={{ transform: `translateX(-50%) rotate(${secDeg}deg)` }}
                    ></div>

                    <div className="center-pin"></div>
                </div>
            </div>
        </div>
    );
};

const InteractiveWidget = () => {
    const [activeTab, setActiveTab] = useState<'clock' | 'wheel'>('clock');

    // Wheel State
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const segments = [
        { text: 'Yes', color: '#3b82f6' }, // Blue
        { text: 'No', color: '#ef4444' },  // Red
        { text: 'Yes', color: '#eab308' }, // Yellow
        { text: 'No', color: '#22c55e' },  // Green
        { text: 'Yes', color: '#3b82f6' },
        { text: 'No', color: '#ef4444' },
        { text: 'Yes', color: '#eab308' },
        { text: 'No', color: '#22c55e' },
        { text: 'Yes', color: '#3b82f6' },
        { text: 'No', color: '#ef4444' },
        { text: 'Yes', color: '#eab308' },
        { text: 'No', color: '#22c55e' },
    ];

    const handleSpin = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setResult(null);

        // Add 5-10 full spins (1800-3600 deg) + random
        const spinAmount = 1800 + Math.random() * 1800;
        const newRotation = rotation + spinAmount;

        setRotation(newRotation);

        setTimeout(() => {
            setIsSpinning(false);

            const degrees = newRotation % 360;
            const anglePerSegment = 360 / segments.length;
            const winningAngle = (360 - degrees) % 360;
            const winningIndex = Math.floor(winningAngle / anglePerSegment);

            const winText = segments[winningIndex].text;
            setResult(winText);

            if (winText === 'Yes') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#22c55e', '#eab308']
                });
            }
        }, 3000);
    };

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-sm mb-2 flex flex-col items-center relative overflow-hidden shrink-0 transition-all">

            {/* Toggle Switch */}
            <div className="absolute top-3 right-4 z-30 bg-slate-100 dark:bg-white/5 rounded-lg p-0.5 flex gap-0.5">
                <button
                    onClick={() => setActiveTab('clock')}
                    className={`p-1.5 rounded-md transition-all flex items-center justify-center ${activeTab === 'clock' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="Clock"
                >
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                </button>
                <button
                    onClick={() => setActiveTab('wheel')}
                    className={`p-1.5 rounded-md transition-all flex items-center justify-center ${activeTab === 'wheel' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="Decision Wheel"
                >
                    <span className="material-symbols-outlined text-[18px]">casino</span>
                </button>
            </div>

            <div className="mt-1 min-h-[230px] flex items-center justify-center w-full">
                {activeTab === 'clock' ? (
                    <AnalogClock />
                ) : (
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56 animate-in fade-in zoom-in-95 duration-300">
                        {/* Pointer (Triangle) - positioned at right (3 o'clock) */}
                        <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-20 w-0 h-0 border-y-[10px] border-y-transparent border-r-[20px] border-r-red-500 drop-shadow-md"></div>

                        {/* Wheel */}
                        <div
                            className="w-full h-full rounded-full overflow-hidden border-2 border-slate-700 dark:border-slate-700 relative"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                transition: isSpinning ? 'transform 3s cubic-bezier(0.15, 0, 0.2, 1)' : 'none'
                            }}
                        >
                            <svg viewBox="-1 -1 2 2" className="w-full h-full block">
                                {segments.map((seg, i) => {
                                    const start = i / segments.length;
                                    const end = (i + 1) / segments.length;

                                    const [startX, startY] = getCoordinatesForPercent(start);
                                    const [endX, endY] = getCoordinatesForPercent(end);

                                    const largeArcFlag = end - start > 0.5 ? 1 : 0;

                                    const pathData = [
                                        `M 0 0`,
                                        `L ${startX} ${startY}`,
                                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                                        `L 0 0`,
                                    ].join(' ');

                                    // Text position logic
                                    const midAngle = (start + end) / 2;
                                    const textX = Math.cos(2 * Math.PI * midAngle) * 0.7;
                                    const textY = Math.sin(2 * Math.PI * midAngle) * 0.7;
                                    const rotationAngle = midAngle * 360;

                                    return (
                                        <g key={i}>
                                            <path d={pathData} fill={seg.color} stroke="white" strokeWidth="0.02" />
                                            <text
                                                x={textX}
                                                y={textY}
                                                fill="white"
                                                fontSize="0.2"
                                                fontWeight="800"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                transform={`rotate(${rotationAngle}, ${textX}, ${textY})`}
                                                style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.2)' }}
                                            >
                                                {seg.text}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* Center Button */}
                        <button
                            onClick={handleSpin}
                            disabled={isSpinning}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center border-2 border-slate-700 dark:border-slate-700 z-10 transition-transform active:scale-95 hover:scale-105 disabled:opacity-80 disabled:cursor-not-allowed group"
                        >
                            {isSpinning ? (
                                <span className="material-symbols-outlined text-slate-400 animate-spin text-[24px]">refresh</span>
                            ) : (
                                <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">Spin</span>
                            )}
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
};

// --- Main Component ---

const TaskDashboard: React.FC<TaskDashboardProps> = ({ toggleTheme, isDarkMode, tasks, blocks, onToggleTaskStatus, notes: allNotes, setNotes }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [now, setNow] = useState(new Date());
    const [mobileTab, setMobileTab] = useState<'schedule' | 'plan'>('schedule');

    // Note State - filtered from props
    const notes = useMemo(() => allNotes.filter(n => n.type === 'sticky'), [allNotes]);

    const [activeNoteIndex, setActiveNoteIndex] = useState(0);
    const [isNoteMenuOpen, setIsNoteMenuOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const noteMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If active note index is out of bounds (e.g. note deleted), reset it
        if (activeNoteIndex >= notes.length && notes.length > 0) {
            setActiveNoteIndex(notes.length - 1);
        } else if (notes.length === 0) {
            // Automatically create a note if none exist, or handle empty state
            // For now, let's just create one if empty to avoid UI issues
            handleAddNote();
        }
    }, [notes.length]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    // Handle click outside for note menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (noteMenuRef.current && !noteMenuRef.current.contains(event.target as Node)) {
                setIsNoteMenuOpen(false);
            }
        };
        if (isNoteMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNoteMenuOpen]);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const handleDateClick = (day: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    interface TimelineItem {
        id: string;
        title: string;
        startTime: string;
        type: 'task' | 'event' | 'block';
        color: string;
        icon?: string;
        status?: 'todo' | 'active' | 'completed';
        data?: any;
        urgency?: string;
        duration?: string;
    }

    const timelineItems = useMemo(() => {
        const selectedDateStr = currentDate.toLocaleDateString('en-CA');
        const dayName = dayNamesShort[currentDate.getDay()];

        const items: TimelineItem[] = [];

        // 1. Add Routine Blocks for this day
        blocks.forEach(block => {
            if (block.days.includes(dayName)) {
                items.push({
                    id: `block-${block.id}`,
                    title: block.name,
                    startTime: block.startTime,
                    type: 'block',
                    color: block.color,
                    icon: block.icon,
                    status: 'todo',
                    data: block
                });
            }
        });

        // 2. Add Tasks/Events for this date
        tasks.forEach(task => {
            if (task.date === selectedDateStr) {
                // Determine start time (use valid time or empty string for "all day"/unscheduled)
                const startTime = task.time || '';

                items.push({
                    id: task.id,
                    title: task.title,
                    startTime: startTime,
                    type: task.type === 'event' ? 'event' : 'task',
                    color: task.color || 'slate',
                    icon: task.type === 'event' ? 'event' : 'check_circle',
                    status: task.status,
                    urgency: task.urgency,
                    data: task
                });
            }
        });

        return items;
    }, [currentDate, tasks, blocks]);

    const groupedTimeline = useMemo(() => {
        const sorted = [...timelineItems].sort((a, b) => {
            const timeDiff = a.startTime.localeCompare(b.startTime);
            if (timeDiff !== 0) return timeDiff;
            const getTypeScore = (t: string) => (t === 'block' ? 2 : 1);
            return getTypeScore(b.type) - getTypeScore(a.type);
        });

        const groups: {
            time: string;
            endTime?: string;
            container?: TimelineItem;
            items: TimelineItem[];
            durationMins?: number;
        }[] = [];

        const processedIds = new Set<string>();

        sorted.forEach((item) => {
            if (processedIds.has(item.id)) return;

            if (item.type === 'block') {
                const blockEnd = item.data.endTime;
                const children: TimelineItem[] = [];

                sorted.forEach((candidate) => {
                    if (candidate.id === item.id) return;
                    if (processedIds.has(candidate.id)) return;

                    if (candidate.type !== 'block' &&
                        candidate.startTime >= item.startTime &&
                        candidate.startTime < blockEnd) {
                        children.push(candidate);
                        processedIds.add(candidate.id);
                    }
                });

                children.sort((a, b) => a.startTime.localeCompare(b.startTime));

                const startM = timeToMinutes(item.startTime);
                const endM = timeToMinutes(blockEnd);

                groups.push({
                    time: item.startTime,
                    endTime: blockEnd,
                    container: item,
                    items: children,
                    durationMins: endM - startM
                });
                processedIds.add(item.id);

            } else {
                const lastGroup = groups[groups.length - 1];
                if (lastGroup && lastGroup.time === item.startTime && !lastGroup.container) {
                    lastGroup.items.push(item);
                    const currentDuration = lastGroup.durationMins || 30;
                    const newItemEnd = addDuration(item.startTime, undefined); // Tasks have no duration now
                    const newItemEndM = timeToMinutes(newItemEnd);
                    const groupStartM = timeToMinutes(lastGroup.time);

                    let newDuration = newItemEndM - groupStartM;
                    if (newDuration < 0) newDuration += 24 * 60;

                    if (newDuration > currentDuration) {
                        lastGroup.durationMins = newDuration;
                    }
                } else {
                    const endStr = addDuration(item.startTime, undefined); // Tasks have no duration now
                    const startM = timeToMinutes(item.startTime);
                    const endM = timeToMinutes(endStr);

                    let duration = endM - startM;
                    if (duration < 0) duration += 24 * 60;

                    groups.push({
                        time: item.startTime,
                        container: undefined,
                        items: [item],
                        durationMins: duration
                    });
                }
                processedIds.add(item.id);
            }
        });

        return groups.sort((a, b) => a.time.localeCompare(b.time));
    }, [timelineItems]);


    const dailyTasks = useMemo(() => {
        const dateStr = currentDate.toLocaleDateString('en-CA');
        return tasks
            .filter(t => t.date === dateStr)
            .sort((a, b) => {
                // 1. Completion status (Active first)
                if (a.status === 'completed' && b.status !== 'completed') return 1;
                if (a.status !== 'completed' && b.status === 'completed') return -1;

                // 2. Time (Scheduled first, then Unscheduled)
                if (a.time && b.time) return a.time.localeCompare(b.time);
                if (a.time && !b.time) return -1;
                if (!a.time && b.time) return 1;

                return 0;
            });
    }, [tasks, currentDate]);

    const completionStats = useMemo(() => {
        const actionableTasks = dailyTasks.filter(t => t.type !== 'event');
        const total = actionableTasks.length;
        const completed = actionableTasks.filter(t => t.status === 'completed').length;

        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        return { total, completed, percent };
    }, [dailyTasks]);

    const upcomingTasks = useMemo(() => {
        const targetDate = new Date(currentDate);
        targetDate.setDate(targetDate.getDate() + 1);
        const targetStr = targetDate.toLocaleDateString('en-CA');

        return tasks.filter(t => t.date === targetStr && t.status !== 'completed').slice(0, 3);
    }, [tasks, currentDate]);

    const getTimelineColorClasses = (item: TimelineItem) => {
        const isCompleted = item.status === 'completed';
        const opacity = isCompleted ? 'opacity-60' : 'opacity-100';

        const colors: any = {
            blue: { bg: 'bg-blue-100 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', iconBg: 'bg-blue-100 text-blue-600', ring: 'ring-blue-500' },
            red: { bg: 'bg-red-100 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300', iconBg: 'bg-red-100 text-red-600', ring: 'ring-red-500' },
            green: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', iconBg: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-500' },
            amber: { bg: 'bg-amber-100 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', iconBg: 'bg-amber-100 text-amber-600', ring: 'ring-amber-500' },
            violet: { bg: 'bg-violet-100 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-300', iconBg: 'bg-violet-100 text-violet-600', ring: 'ring-violet-500' },
            pink: { bg: 'bg-pink-100 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-700 dark:text-pink-300', iconBg: 'bg-pink-100 text-pink-600', ring: 'ring-pink-500' },
            cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300', iconBg: 'bg-cyan-100 text-cyan-600', ring: 'ring-cyan-500' },
            primary: { bg: 'bg-primary/10 dark:bg-primary/20', border: 'border-primary/20', text: 'text-primary-dark dark:text-primary-light', iconBg: 'bg-primary text-white', ring: 'ring-primary' },
            slate: { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', iconBg: 'bg-slate-200 text-slate-600', ring: 'ring-slate-500' },
        };

        const c = colors[item.color] || colors.slate;

        if (item.type === 'block') {
            return {
                wrapper: `border-l-4 ${c.border.replace('border-', 'border-l-')} ${c.bg} ${opacity}`,
                icon: `${c.iconBg}`,
                title: `${c.text}`,
                raw: c
            };
        }

        return {
            wrapper: `bg-white dark:bg-surface-dark border ${c.border} shadow-sm ${opacity}`,
            icon: `${c.iconBg} dark:bg-opacity-20`,
            title: `text-slate-900 dark:text-white`,
            raw: c
        };
    };

    // --- Note Logic ---
    const handleNoteContentChange = (content: string) => {
        const activeNote = notes[activeNoteIndex];
        if (!activeNote) return;
        setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, content } : n));
    };

    const handleNoteColorChange = (color: WhiteboardNote['color']) => {
        const activeNote = notes[activeNoteIndex];
        if (!activeNote) return;
        setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, color } : n));
        setIsNoteMenuOpen(false);
    };

    const handleAddNote = () => {
        const newNote: WhiteboardNote = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'sticky',
            x: 200 + (notes.length * 20),
            y: 200 + (notes.length * 20),
            width: 256,
            height: 256,
            content: '',
            title: 'New Note',
            color: 'yellow',
            rotation: (Math.random() * 4) - 2,
            zIndex: 10 + notes.length,
            fontSize: 16,
            createdAt: Date.now()
        };
        setNotes(prev => [...prev, newNote]);
        // activeNoteIndex will naturally point to the end once notes array updates, or we can force it:
        setActiveNoteIndex(notes.length);
        setIsNoteMenuOpen(false);
        setIsExpanded(false);
    };

    const handleDeleteNote = () => {
        const activeNote = notes[activeNoteIndex];
        if (!activeNote) return;

        if (notes.length <= 1) {
            // If last note, reset content instead of deleting, to keep widget alive
            handleNoteContentChange('');
            setIsNoteMenuOpen(false);
            return;
        }

        setNotes(prev => prev.filter(n => n.id !== activeNote.id));
        setIsNoteMenuOpen(false);
    };

    const handlePrevNote = () => {
        if (activeNoteIndex > 0) setActiveNoteIndex(activeNoteIndex - 1);
    };

    const handleNextNote = () => {
        if (activeNoteIndex < notes.length - 1) setActiveNoteIndex(activeNoteIndex + 1);
    };

    const noteColors = {
        yellow: { bg: 'bg-note-yellow dark:bg-note-yellow-dark', border: 'border-yellow-200/50 dark:border-yellow-900/20', accent: 'bg-yellow-200 dark:bg-yellow-900/20' },
        pink: { bg: 'bg-note-pink dark:bg-note-pink-dark', border: 'border-pink-200/50 dark:border-pink-900/20', accent: 'bg-pink-200 dark:bg-pink-900/20' },
        blue: { bg: 'bg-note-blue dark:bg-note-blue-dark', border: 'border-blue-200/50 dark:border-blue-900/20', accent: 'bg-blue-200 dark:bg-blue-900/20' },
        green: { bg: 'bg-note-green dark:bg-note-green-dark', border: 'border-green-200/50 dark:border-green-900/20', accent: 'bg-green-200 dark:bg-green-900/20' },
        transparent: { bg: 'bg-white dark:bg-slate-800', border: 'border-slate-200', accent: 'bg-slate-200' }, // Fallback for transparency in dashboard
    };

    const activeNote = notes[activeNoteIndex] || { title: '', content: '', color: 'yellow', createdAt: Date.now() };
    const currentNoteTheme = noteColors[activeNote.color] || noteColors.yellow;

    const currentMins = now.getHours() * 60 + now.getMinutes();
    const isToday = currentDate.toDateString() === now.toDateString();

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50/50 dark:bg-transparent">
            <div className={`flex-1 flex flex-col xl:flex-row relative z-10 ${mobileTab === 'plan' ? 'overflow-y-auto xl:overflow-hidden' : 'overflow-hidden'}`}>

                {/* Left Sidebar - Calendar & Notepad */}
                {/* Desktop: Always Visible. Mobile: Visible only in 'plan' tab */}
                <aside className={`
            flex-col shrink-0 z-20 gap-6
            xl:flex xl:w-80 xl:m-6 xl:mr-0 xl:static
            ${mobileTab === 'plan' ? 'flex w-full p-6 pb-0 bg-background-light dark:bg-background-dark' : 'hidden'}
        `}>
                    {/* Calendar Widget */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-sm shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={prevMonth} className="size-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            </button>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <button onClick={nextMonth} className="size-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-7 mb-2 text-center">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <span key={`${d}-${i}`} className="text-[10px] font-bold text-slate-400 uppercase">{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="w-8 h-8"></div>
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                                const isSelected = day === currentDate.getDate();

                                return (
                                    <div key={day} className="w-8 h-8 flex items-center justify-center">
                                        <button
                                            onClick={() => handleDateClick(day)}
                                            className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-all
                            ${isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-110' :
                                                    isToday ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}
                        `}>
                                            {day}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sticky Note Widget */}
                    <div className="relative flex flex-col min-h-[300px] xl:min-h-0 xl:flex-1 group pt-2 select-none" style={{ touchAction: 'pan-y' }}>

                        {/* Background Layer for depth */}
                        <div
                            className={`absolute inset-0 ${currentNoteTheme.accent} rounded-xl opacity-60 transform rotate-2 translate-y-1 transition-transform group-hover:rotate-3`}
                        ></div>

                        {/* Realistic Tape */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none drop-shadow-md">
                            <div
                                /* CHANGED: bg-white/40 -> bg-slate-200/50 (darker, frosted look) */
                                /* CHANGED: dark:bg-white/10 -> dark:bg-white/5 (less bright in dark mode) */
                                className="w-32 h-10 bg-slate-200/90 dark:bg-white/5 backdrop-blur-md border-white/20 dark:border-white/5 skew-x-1 flex items-center justify-center overflow-hidden [clip-path:polygon(0%_0%,100%_0%,100%_75%,96%_100%,92%_75%,88%_100%,84%_75%,80%_100%,76%_75%,72%_100%,68%_75%,64%_100%,60%_75%,56%_100%,52%_75%,48%_100%,44%_75%,40%_100%,36%_75%,32%_100%,28%_75%,24%_100%,20%_75%,16%_100%,12%_75%,8%_100%,4%_75%,0%_100%)]"
                            >
                                {/* Inner gradient for texture */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50"></div>
                            </div>
                        </div>

                        {/* Note Container */}
                        <div
                            className={`relative flex-1 ${currentNoteTheme.bg} rounded-xl shadow-paper flex flex-col border ${currentNoteTheme.border} overflow-hidden transition-all`}
                        >

                            {/* Note Header */}
                            <div className="relative h-14 flex items-center justify-end px-5 pt-4 shrink-0 z-20">

                                <div className="relative z-10 flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className={`size-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'text-slate-800 dark:text-white bg-black/5 dark:bg-white/10' : 'text-slate-600/50 hover:text-slate-800 dark:text-slate-300/50 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}
                                        title={isExpanded ? "Single View" : "Show All Notes"}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                                    </button>

                                    <div ref={noteMenuRef} className="relative">
                                        <button
                                            onClick={() => setIsNoteMenuOpen(!isNoteMenuOpen)}
                                            className="size-8 rounded-full flex items-center justify-center text-slate-600/50 hover:text-slate-800 dark:text-slate-300/50 dark:hover:text-white transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                        </button>

                                        {isNoteMenuOpen && (
                                            <div className="absolute right-0 top-full mt-2 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100 min-w-[140px]">
                                                <div className="flex gap-2 justify-between">
                                                    {(['yellow', 'pink', 'blue', 'green'] as const).map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => handleNoteColorChange(c)}
                                                            className={`w-5 h-5 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm transition-transform hover:scale-110 ${noteColors[c].bg}`}
                                                            title={c.charAt(0).toUpperCase() + c.slice(1)}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="h-px bg-slate-100 dark:bg-slate-700"></div>
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={handleAddNote}
                                                        className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary p-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded transition-colors text-left"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                                        Add Note
                                                    </button>
                                                    <button
                                                        onClick={handleDeleteNote}
                                                        className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-red-500 p-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded transition-colors text-left"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        Delete Note
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* GRID VIEW OVERLAY */}
                            {isExpanded ? (
                                <div className="absolute inset-0 top-12 z-30 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-sm p-4 animate-in zoom-in-95 fade-in duration-200 overflow-y-auto no-scrollbar">
                                    <div className="grid grid-cols-2 gap-3 pb-4">
                                        {notes.map((note, idx) => {
                                            const theme = noteColors[note.color];
                                            const isActive = idx === activeNoteIndex;
                                            return (
                                                <button
                                                    key={note.id}
                                                    onClick={() => {
                                                        setActiveNoteIndex(idx);
                                                        setIsExpanded(false);
                                                    }}
                                                    className={`aspect-square rounded-lg p-3 text-left flex flex-col gap-1 transition-all hover:scale-105 active:scale-95 shadow-sm border ${theme.bg} ${theme.border} ${isActive ? 'ring-2 ring-slate-400 dark:ring-slate-500' : ''}`}
                                                >
                                                    <p className="text-[10px] font-medium text-slate-700 dark:text-slate-200 line-clamp-4 leading-relaxed w-full">
                                                        {note.content || <span className="opacity-40 italic">Empty note...</span>}
                                                    </p>
                                                    <div className="mt-auto text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                                                        {note.createdAt ? new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {/* Quick Add Button in Grid */}
                                        <button
                                            onClick={handleAddNote}
                                            className="aspect-square rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                        >
                                            <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">add</span>
                                            <span className="text-[10px] font-bold">New Note</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>


                                    {/* Clean Text Area */}
                                    <textarea
                                        className="flex-1 w-full bg-transparent border-0 resize-none focus:ring-0 text-sm leading-loose text-slate-800 dark:text-slate-100 px-5 pb-10 no-scrollbar placeholder:text-slate-500/30 font-medium cursor-auto"
                                        placeholder="Write your thoughts..."
                                        value={activeNote.content}
                                        onChange={(e) => handleNoteContentChange(e.target.value)}
                                    />

                                    {/* Bottom Controls: Arrows & Dots */}
                                    <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-4 px-4 pointer-events-none z-20">
                                        {/* Left Arrow - Moved here */}
                                        <button
                                            onClick={handlePrevNote}
                                            disabled={activeNoteIndex === 0}
                                            className={`pointer-events-auto p-1 rounded-full flex items-center justify-center text-slate-600/40 hover:text-slate-800 hover:bg-black/5 dark:text-slate-300/40 dark:hover:text-white dark:hover:bg-white/10 transition-all ${activeNoteIndex === 0 ? 'opacity-0 cursor-default' : 'opacity-100'}`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                        </button>

                                        {/* Dots - Centered */}
                                        <div className="flex items-center gap-1.5 pointer-events-auto">
                                            {notes.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActiveNoteIndex(i)}
                                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeNoteIndex ? 'bg-slate-800/40 dark:bg-white/40 scale-125' : 'bg-slate-800/10 dark:bg-white/10 hover:bg-slate-800/30 dark:hover:bg-white/30'}`}
                                                ></button>
                                            ))}
                                        </div>

                                        {/* Right Arrow - Moved here */}
                                        <button
                                            onClick={handleNextNote}
                                            disabled={activeNoteIndex === notes.length - 1}
                                            className={`pointer-events-auto p-1 rounded-full flex items-center justify-center text-slate-600/40 hover:text-slate-800 hover:bg-black/5 dark:text-slate-300/40 dark:hover:text-white dark:hover:bg-white/10 transition-all ${activeNoteIndex === notes.length - 1 ? 'opacity-0 cursor-default' : 'opacity-100'}`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Timeline Section */}
                {/* Desktop: Always Visible. Mobile: Visible only in 'schedule' tab */}
                <section className={`
            flex-1 overflow-y-auto px-2 xl:px-6 pb-10 relative no-scrollbar
            ${mobileTab === 'schedule' ? 'block' : 'hidden xl:block'}
        `}>

                    <div className="flex flex-col gap-0 relative pt-8 pb-2 pl-0">

                        {groupedTimeline.length === 0 && (
                            <div className="pl-24 pt-10 text-slate-400 italic">
                                Nothing scheduled for this day.
                            </div>
                        )}

                        {groupedTimeline.map((group, index) => {
                            const blockItem = group.container;
                            const contentItems = group.items;
                            const styles = blockItem ? getTimelineColorClasses(blockItem) : (contentItems.length > 0 ? getTimelineColorClasses(contentItems[0]) : getTimelineColorClasses({ type: 'task', color: 'slate' } as any));

                            const prevGroup = groupedTimeline[index - 1];
                            const nextGroup = groupedTimeline[index + 1];
                            const isContinuous = prevGroup && prevGroup.endTime === group.time;
                            const isStartTimeRepeated = prevGroup && prevGroup.time === group.time;

                            const groupStartMins = timeToMinutes(group.time);
                            const groupEndMins = groupStartMins + (group.durationMins || 30);

                            // Highlight Logic
                            const isActiveGroup = isToday && currentMins >= groupStartMins && currentMins < groupEndMins;
                            const wrapperClasses = isActiveGroup
                                ? "relative -mx-2 xl:-mx-4 px-2 xl:px-4 py-3 bg-red-100/40 dark:bg-red-900/10 border-l-4 border-red-500 transition-all duration-300"
                                : "relative py-3 pl-1 border-l-4 border-transparent transition-all duration-300";

                            // Block Rendering
                            if (blockItem) {
                                const blockColor = styles.raw;
                                const hasTasks = contentItems.length > 0;
                                const isEndTimeRepeated = nextGroup && nextGroup.time === group.endTime;

                                return (
                                    <React.Fragment key={group.time + index}>
                                        {isActiveGroup && (
                                            <div className="relative flex items-center gap-0 mb-2 animate-in fade-in zoom-in-95 duration-500">
                                                <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-red-500/70 to-red-600/80 dark:via-red-900/60 dark:to-red-500/70"></div>
                                                <div className="px-3 py-0 text-md font-black font-mono text-red-500 dark:text-red-400 tracking-[0.2em]">
                                                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </div>
                                                <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent via-red-500/70 to-red-600/80 dark:via-red-900/60 dark:to-red-500/70"></div>
                                            </div>
                                        )}
                                        <div className={wrapperClasses}>
                                            <div className="contents group">
                                                {/* 1. BLOCK HEADER */}
                                                <div className="relative grid grid-cols-[50px_16px_1fr] gap-0">
                                                    <div className="text-right pr-2 pt-0 text-sm font-bold text-slate-900 dark:text-white">
                                                        {!isStartTimeRepeated ? group.time?.slice(0, 5) : ''}
                                                    </div>
                                                    <div className="relative flex justify-center pt-1">
                                                        <div className={`w-2 h-2 rounded-full z-20 ${blockColor.iconBg} ring-2 ring-white dark:ring-black`}></div>
                                                        <div className="absolute top-2 bottom-0 w-px border-r-2 border-dotted border-slate-300 dark:border-slate-700/60 z-0"></div>
                                                    </div>
                                                    <div className="pl-4 pr-4 relative">
                                                        <div className={`px-3 py-4 ${hasTasks ? '' : 'pb-0'} rounded-t-xl border border-b-0 ${blockColor.border} ${blockColor.bg}`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-white/50 dark:bg-black/20 ${blockColor.text}`}>
                                                                    <span className="material-symbols-outlined text-[24px]">{blockItem.icon || 'view_agenda'}</span>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className={`font-bold text-sm ${blockColor.text}`}>{blockItem.title}</h3>
                                                                    </div>
                                                                    <div className={`text-xs font-medium opacity-90 mt-0.5 ${blockColor.text}`}>
                                                                        {blockItem.startTime?.slice(0, 5)} - {blockItem.data.endTime?.slice(0, 5)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. NESTED TASKS AS ROWS */}
                                                {contentItems.map((item, i) => {
                                                    const isCompleted = item.status === 'completed';
                                                    return (
                                                        <React.Fragment key={item.id}>
                                                            <div className="relative grid grid-cols-[50px_16px_1fr] gap-0">
                                                                <div className={`text-right pr-2 pt-1 text-sm font-bold font-mono tracking-tight ${isCompleted ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                    {item.startTime?.slice(0, 5)}
                                                                </div>
                                                                <div className="relative flex justify-center">
                                                                    <div className="absolute top-0 bottom-0 w-px border-r-2 border-dotted border-slate-300 dark:border-slate-700/60 z-0"></div>
                                                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 z-10 box-content border-2 border-background-light dark:border-background-dark"></div>
                                                                </div>
                                                                <div className="pl-4 pr-4 relative">
                                                                    <div className={`px-3 py-2 border-x ${blockColor.border} ${blockColor.bg} flex items-center`}>
                                                                        <div className={`flex-1 bg-white dark:bg-surface-dark p-3 rounded-lg border border-black/5 dark:border-white/5 shadow-sm flex items-center gap-3 transition-colors ${isCompleted ? 'opacity-60' : ''}`}>
                                                                            {item.type === 'task' ? (
                                                                                <label className="heart-container" onClick={(e) => e.stopPropagation()}>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isCompleted}
                                                                                        onChange={(e) => {
                                                                                            if (!isCompleted) {
                                                                                                confetti({
                                                                                                    particleCount: 40,
                                                                                                    spread: 60,
                                                                                                    origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
                                                                                                    colors: ['#FF5353', '#FF69B4', '#FFD700'],
                                                                                                });
                                                                                            }
                                                                                            onToggleTaskStatus(item.id);
                                                                                        }}
                                                                                    />
                                                                                    <div className="heart-checkmark">
                                                                                        <svg viewBox="0 0 256 256">
                                                                                            <rect fill="none" height="256" width="256"></rect>
                                                                                            <path d="M224.6,51.9a59.5,59.5,0,0,0-43-19.9,60.5,60.5,0,0,0-44,17.6L128,59.1l-7.5-7.4C97.2,28.3,59.2,26.3,35.9,47.4a59.9,59.9,0,0,0-2.3,87l83.1,83.1a15.9,15.9,0,0,0,22.6,0l81-81C243.7,113.2,245.6,75.2,224.6,51.9Z" strokeWidth="20px" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fill="none"></path>
                                                                                        </svg>
                                                                                    </div>
                                                                                </label>
                                                                            ) : (
                                                                                <div className="shrink-0 w-5 h-5 flex items-center justify-center text-slate-400">
                                                                                    <span className="material-symbols-outlined text-[18px]">event</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <p className={`text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug ${isCompleted ? 'line-through opacity-60' : ''}`}>
                                                                                        {item.title}
                                                                                    </p>
                                                                                    {item.urgency && item.urgency !== 'Normal' && (
                                                                                        <span className={`material-symbols-outlined text-[16px] filled ${item.urgency === 'High' ? 'text-red-500' :
                                                                                            item.urgency === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                                                                                            }`} title={`${item.urgency} Priority`}>flag</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </React.Fragment>
                                                    );
                                                })}

                                                {/* 3. BLOCK FOOTER / END TIME */}
                                                <div className="relative grid grid-cols-[50px_16px_1fr] gap-0">
                                                    <div className="text-right pr-2 pt-0 text-sm font-bold text-slate-400 dark:text-slate-500">
                                                        {!isEndTimeRepeated ? group.endTime?.slice(0, 5) : ''}
                                                    </div>
                                                    <div className="relative flex justify-center">
                                                        {/* Line stops at the dot */}
                                                        <div className="absolute top-0 h-2 w-px border-r-2 border-dotted border-slate-300 dark:border-slate-700/60 z-0"></div>
                                                        <div className={`mt-1 w-2 h-2 rounded-full z-20 ${blockColor.iconBg} opacity-50 ring-2 ring-white dark:ring-black`}></div>
                                                    </div>
                                                    <div className="pl-4 pr-4 relative">
                                                        <div className={`h-4 rounded-b-xl border border-t-0 ${blockColor.border} ${blockColor.bg}`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            }

                            // Standard Item Rendering (Non-Block)
                            return (
                                <React.Fragment key={group.time + index}>
                                    {isActiveGroup && (
                                        <div className="relative flex items-center gap-0 mb-2 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-red-500/70 to-red-600/80 dark:via-red-900/60 dark:to-red-500/70"></div>
                                            <div className="px-3 py-0 text-md font-black font-mono text-red-500 dark:text-red-400 tracking-[0.2em]">
                                                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </div>
                                            <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent via-red-500/70 to-red-600/80 dark:via-red-900/60 dark:to-red-500/70"></div>
                                        </div>
                                    )}
                                    <div className={wrapperClasses}>
                                        <div className={`group relative grid grid-cols-[50px_16px_1fr] gap-0`}>
                                            {/* Time */}
                                            <div className={`text-right pr-2 pt-0 text-sm font-bold text-slate-900 dark:text-white`}>
                                                {!isStartTimeRepeated ? group.time?.slice(0, 5) : ''}
                                            </div>
                                            {/* Dot */}
                                            <div className="relative flex justify-center pt-1">
                                                <div className={`w-2 h-2 rounded-full ring-2 ring-background-light dark:ring-background-dark z-20 bg-slate-300 dark:bg-slate-600`}></div>
                                                {group.endTime && <div className="absolute top-2 bottom-0 w-px border-r-2 border-dotted border-slate-300 dark:border-slate-700/60 z-0"></div>}
                                            </div>
                                            {/* Content */}
                                            <div className="pl-4 pr-4 relative">
                                                <div className="flex flex-col gap-3">
                                                    {contentItems.map(item => {
                                                        const itemStyles = getTimelineColorClasses(item);
                                                        const isCompleted = item.status === 'completed';
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className={`rounded-xl p-4 transition-all duration-200 
                                                    ${itemStyles.wrapper} 
                                                `}
                                                            >
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${itemStyles.icon}`}>
                                                                            <span className="material-symbols-outlined text-[24px]">{item.icon || 'check_circle'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <h3 className={`font-bold text-sm ${itemStyles.title} ${isCompleted ? 'line-through decoration-slate-400' : ''}`}>
                                                                                    {item.title}
                                                                                </h3>
                                                                                {item.urgency && item.urgency !== 'Normal' && (
                                                                                    <span className={`material-symbols-outlined text-[16px] filled ${item.urgency === 'High' ? 'text-red-500' :
                                                                                        item.urgency === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                                                                                        }`} title={`${item.urgency} Priority`}>flag</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {item.type === 'task' && (
                                                                        <label className="heart-container" onClick={(e) => e.stopPropagation()}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isCompleted}
                                                                                onChange={(e) => {
                                                                                    if (!isCompleted) {
                                                                                        confetti({
                                                                                            particleCount: 40,
                                                                                            spread: 60,
                                                                                            origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
                                                                                            colors: ['#FF5353', '#FF69B4', '#FFD700'],
                                                                                        });
                                                                                    }
                                                                                    onToggleTaskStatus(item.id);
                                                                                }}
                                                                            />
                                                                            <div className="heart-checkmark">
                                                                                <svg viewBox="0 0 256 256">
                                                                                    <rect fill="none" height="256" width="256"></rect>
                                                                                    <path d="M224.6,51.9a59.5,59.5,0,0,0-43-19.9,60.5,60.5,0,0,0-44,17.6L128,59.1l-7.5-7.4C97.2,28.3,59.2,26.3,35.9,47.4a59.9,59.9,0,0,0-2.3,87l83.1,83.1a15.9,15.9,0,0,0,22.6,0l81-81C243.7,113.2,245.6,75.2,224.6,51.9Z" strokeWidth="20px" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fill="none"></path>
                                                                                </svg>
                                                                            </div>
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}

                    </div>
                </section>

                {/* Right Sidebar - Task Preview Only */}
                {/* Desktop: Always Visible. Mobile: Visible only in 'plan' tab */}
                <aside className={`
            flex-col shrink-0 z-20 gap-3
            xl:flex xl:w-80 xl:m-6 xl:ml-0 xl:static
            ${mobileTab === 'plan' ? 'flex w-full p-6 pb-6 bg-background-light dark:bg-background-dark' : 'hidden'}
        `}>
                    {/* Interactive Widget (Clock/Wheel) */}
                    <InteractiveWidget />

                    {/* Task Preview Widget */}
                    <div className="flex-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl overflow-hidden flex flex-col shadow-xl shadow-slate-200/50 dark:shadow-none min-h-0">
                        <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-500">check_circle</span>
                                To-Do List
                            </h3>
                            <div className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-full">
                                {completionStats.completed}/{completionStats.total}
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${completionStats.percent}%` }}></div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-slate-50/30 dark:bg-black/10 no-scrollbar">

                            {dailyTasks.length === 0 && (
                                <div className="text-center text-xs text-slate-400 py-8 italic">
                                    No tasks for today.<br />Enjoy your free time!
                                </div>
                            )}

                            {dailyTasks.map(task => {
                                const isPast = isToday && task.time && timeToMinutes(task.time) < currentMins;
                                const isActuallyCompleted = task.status === 'completed';
                                // Visual state for the card (grey out if past OR completed)
                                const isVisuallyDisabled = isActuallyCompleted || isPast;
                                const colorMap: Record<string, { bg: string, border: string, text: string, accent: string, flag: string }> = {
                                    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-700/50', text: 'text-blue-700 dark:text-blue-400', accent: 'text-blue-500', flag: 'text-blue-500' },
                                    red: { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-700/50', text: 'text-red-700 dark:text-red-400', accent: 'text-red-500', flag: 'text-red-500' },
                                    green: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-700/50', text: 'text-emerald-700 dark:text-emerald-400', accent: 'text-emerald-500', flag: 'text-emerald-500' },
                                    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-700/50', text: 'text-amber-700 dark:text-amber-400', accent: 'text-amber-500', flag: 'text-amber-500' },
                                    violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', border: 'border-violet-200 dark:border-violet-700/50', text: 'text-violet-700 dark:text-violet-400', accent: 'text-violet-500', flag: 'text-violet-500' },
                                    pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-200 dark:border-pink-700/50', text: 'text-pink-700 dark:text-pink-400', accent: 'text-pink-500', flag: 'text-pink-500' },
                                    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'border-cyan-200 dark:border-cyan-700/50', text: 'text-cyan-700 dark:text-cyan-400', accent: 'text-cyan-500', flag: 'text-cyan-500' },
                                    slate: { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', accent: 'text-slate-500', flag: 'text-slate-400' },
                                    primary: { bg: 'bg-primary/5 dark:bg-primary/10', border: 'border-primary/20', text: 'text-primary-dark dark:text-primary-light', accent: 'text-primary', flag: 'text-primary' }
                                };
                                const c = colorMap[task.color || 'slate'] || colorMap.slate;

                                return (
                                    <div key={task.id} className={`${c.bg} p-3 rounded-2xl border ${c.border} shadow-sm 
                                        ${isActuallyCompleted ? 'grayscale opacity-60' : ''} 
                                        transition-all group relative overflow-hidden`}>
                                        <div className="flex items-center gap-4">
                                            {task.type === 'task' ? (
                                                <label className="heart-container" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isActuallyCompleted}
                                                        onChange={(e) => {
                                                            if (!isActuallyCompleted) {
                                                                confetti({
                                                                    particleCount: 40,
                                                                    spread: 60,
                                                                    origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
                                                                    colors: ['#FF5353', '#FF69B4', '#FFD700'],
                                                                });
                                                            }
                                                            onToggleTaskStatus(task.id);
                                                        }}
                                                    />
                                                    <div className="heart-checkmark">
                                                        <svg viewBox="0 0 256 256">
                                                            <rect fill="none" height="256" width="256"></rect>
                                                            <path d="M224.6,51.9a59.5,59.5,0,0,0-43-19.9,60.5,60.5,0,0,0-44,17.6L128,59.1l-7.5-7.4C97.2,28.3,59.2,26.3,35.9,47.4a59.9,59.9,0,0,0-2.3,87l83.1,83.1a15.9,15.9,0,0,0,22.6,0l81-81C243.7,113.2,245.6,75.2,224.6,51.9Z" strokeWidth="20px" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fill="none"></path>
                                                        </svg>
                                                    </div>
                                                </label>
                                            ) : (
                                                <div className="shrink-0 w-4.5 h-4.5 flex items-center justify-center text-slate-500">
                                                    <span className="material-symbols-outlined text-[23px]">event</span>
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm font-bold truncate leading-tight ${isActuallyCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                                        {task.title}
                                                    </p>
                                                    {task.urgency && task.urgency !== 'Normal' && (
                                                        <span className={`material-symbols-outlined text-[18px] filled shrink-0 ${task.urgency === 'High' ? 'text-red-500' :
                                                            task.urgency === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                                                            }`} title={`${task.urgency} Priority`}>flag</span>
                                                    )}
                                                </div>

                                                {task.time && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                            {task.time?.slice(0, 5)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {upcomingTasks.length > 0 && (
                                <>
                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-slate-50 dark:bg-black/20 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Tomorrow</span>
                                        </div>
                                    </div>
                                    {upcomingTasks.map(task => (
                                        <div key={task.id} className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-border-light dark:border-border-dark shadow-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">{task.title}</h4>
                                            </div>
                                            <p className="text-xs text-slate-400">{task.time ? `Tomorrow • ${task.time.slice(0, 5)}` : 'Tomorrow'}</p>
                                        </div>
                                    ))}
                                </>
                            )}

                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TaskDashboard;
