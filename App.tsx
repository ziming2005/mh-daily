import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from './lib/supabase';
import { FcLinux } from "react-icons/fc";
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { PiCloverDuotone } from "react-icons/pi";
import { SiApachehadoop } from "react-icons/si";
import WeeklyTemplate from './components/WeeklyTemplate';
import TaskDashboard from './components/TaskDashboard';
import TaskListView from './components/TaskListView';
import Whiteboard from './components/Whiteboard';
import CalendarView from './components/CalendarView';
import AuthModal from './components/AuthModal';
import { BlockData } from './components/NewBlockModal';


// Shared Task Type
export interface Task {
  id: string;
  title: string;
  type: 'task' | 'event';
  color?: string;
  urgency: 'High' | 'Medium' | 'Low' | 'Normal';
  date: string; // YYYY-MM-DD
  time?: string;
  status: 'todo' | 'active' | 'completed';
}

// Shared Note Type
export interface WhiteboardNote {
  id: string;
  type: 'sticky' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  imageUrl?: string;
  title?: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'transparent';
  rotation: number;
  zIndex: number;
  fontSize: number;
  createdAt?: number;
}

interface TopNavigationProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
  session: any;
  deferredPrompt: any;
  isInstallable: boolean;
  handleInstallClick: () => void;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const NAV_ITEMS = [
  { path: '/', icon: 'dashboard', label: 'Dashboard' },
  { path: '/calendar', icon: 'view_week', label: 'Timetable' },
  { path: '/tasks', icon: 'check_circle', label: 'Tasks' },
  { path: '/full-calendar', icon: 'calendar_month', label: 'Calendar' },
  { path: '/whiteboard', icon: 'draw', label: 'Whiteboard' },
];

const TopNavigation: React.FC<TopNavigationProps> = ({ toggleTheme, isDarkMode, session, deferredPrompt, isInstallable, handleInstallClick, isLoggedIn, isLoading }) => {
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('Guest');
  const [userEmail, setUserEmail] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (session?.user) {
      setUserName(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User');
      setUserEmail(session.user.email || '');
      if (session.user.user_metadata.avatar_url) {
        setProfileImage(session.user.user_metadata.avatar_url);
      } else {
        setProfileImage(null);
      }
    } else {
      setUserName('Guest');
      setUserEmail('');
      setProfileImage(null);
    }
  }, [session]);

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle profile image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageUrl = reader.result as string;
        setProfileImage(imageUrl);

        // Update user metadata in Supabase
        await supabase.auth.updateUser({
          data: { avatar_url: imageUrl }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
  };


  // Handle login click (opens modal)
  const handleLogin = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  // Handle signup click (opens modal)
  const handleSignup = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  // Perform actual login
  const handleAuthLogin = () => {
    setIsAuthModalOpen(false);
  };

  // Perform actual signup
  const handleAuthSignup = () => {
    setIsAuthModalOpen(false);
  };


  const navLinkClass = (isActive: boolean) =>
    `relative flex items-center justify-center size-10 rounded-xl transition-all duration-200 group ${isActive
      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-105'
      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-blue-600'
    }`;

  return (
    <nav className="h-20 flex items-center justify-between px-4 sm:px-6 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark shrink-0 z-50 relative">
      {/* Left: Brand */}
      <div className="flex items-center gap-4 w-50 hidden sm:flex">
        <div className="size-11 rounded-lg bg-primary/10 flex items-center justify-center text-slate-900 text-[40px]">
          <FcLinux />
        </div>
        <h1 className="flex items-center gap-2 text-3xl font-brand text-slate-900 dark:text-white leading-none tracking-tight">
          MH Daily
          <span className="text-red-500 scale-100 mt-1"><PiCloverDuotone /></span>
        </h1>
      </div>
      {/* Mobile Brand Icon Only */}
      <div className="flex items-center sm:hidden">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-slate-900 text-[36px]">
          <FcLinux />
        </div>
      </div>

      {/* Center: Desktop Nav Icons */}
      <div className="hidden sm:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => navLinkClass(isActive)} title={item.label}>
            <span className={`material-symbols-outlined text-[24px] ${location.pathname === item.path ? 'filled' : ''}`}>{item.icon}</span>
          </NavLink>
        ))}
      </div>

      {/* Right: User Profile & Theme */}
      <div className="flex items-center justify-end gap-3 sm:min-w-[12rem]">
        <button
          onClick={handleFullScreen}
          className="size-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-colors hidden sm:inline-flex"
          title="Toggle Full Screen"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">{isFullScreen ? 'fullscreen_exit' : 'fullscreen'}</span>
        </button>
        <button
          onClick={toggleTheme}
          className="size-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-colors hidden sm:inline-flex"
          title="Toggle Theme"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>


        {/* Profile Dropdown or Login/Signup Buttons */}
        {isLoading ? (
          <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ) : isLoggedIn ? (
          <div className="relative inline-flex items-center" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="size-9 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-surface-dark shadow-sm cursor-pointer hover:ring-gray-300 transition-all flex-shrink-0 overflow-hidden"
            >
              {profileImage ? (
                <div
                  className="size-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${profileImage}")` }}
                />
              ) : (
                <div className="size-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(userName)}
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-75 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 pb-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-4">Profile Info</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative group overflow-hidden rounded-full font-bold">
                      {profileImage ? (
                        <div
                          className="size-12 rounded-full bg-cover bg-center ring-2 ring-slate-200 dark:ring-slate-700"
                          style={{ backgroundImage: `url("${profileImage}")` }}
                        />
                      ) : (
                        <div className="size-12 rounded-full bg-indigo-600 ring-2 ring-slate-200 dark:ring-slate-700 flex items-center justify-center text-white text-lg font-bold">
                          {getInitials(userName)}
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Change profile picture"
                      >
                        <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{userName}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Install PWA Button */}
                {isInstallable && (
                  <div className="px-2 pb-2">
                    <button
                      onClick={handleInstallClick}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
                    >
                      <span className="material-symbols-outlined text-[20px]">install_mobile</span>
                      <span className="text-sm font-bold">Add to Home Screen</span>
                    </button>
                  </div>
                )}

                {/* Logout Button */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span className="text-sm font-bold">Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogin}
              className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Log In
            </button>
            <button
              onClick={handleSignup}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onLogin={handleAuthLogin}
        onSignup={handleAuthSignup}
      />

      {/* Mobile Bottom Navigation - Portal to escape parent stacking context */}
      {createPortal(
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1E1E1E] border-t border-slate-200 dark:border-slate-800 flex justify-around items-center pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] px-2 z-[100]">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center justify-center w-full h-full gap-1
                ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}
              `}
            >
              <span className={`material-symbols-outlined text-[24px] transition-transform duration-200 ${location.pathname === item.path ? 'filled scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>,
        document.body
      )}
    </nav>
  );
};

const INITIAL_BLOCKS: BlockData[] = [];

const INITIAL_NOTES: WhiteboardNote[] = [
  { id: '11111111-1111-1111-1111-111111111111', type: 'sticky', x: 200, y: 200, width: 280, height: 280, content: 'Now you see me! 👀\n\nClick me to reveal the toolbar above.\n\nTry dragging the corners to resize me, or the top handle to rotate!', title: 'Welcome', color: 'yellow', rotation: -2, zIndex: 1, fontSize: 16, createdAt: Date.now() },
  { id: '22222222-2222-2222-2222-222222222222', type: 'sticky', x: 800, y: 400, width: 300, height: 240, content: 'Click the canvas background to hide the toolbar again.', title: 'Tip', color: 'blue', rotation: 1, zIndex: 2, fontSize: 18, createdAt: Date.now() },
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [notes, setNotes] = useState<WhiteboardNote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const isLoggedIn = !!session;

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Capture the install prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        fetchUserData(initialSession);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchUserData(newSession);
      } else {
        setBlocks([]);
        setNotes([]);
        setTasks([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (currentSession?: any) => {
    const activeSession = currentSession || session;
    if (!activeSession?.user?.id) {
      console.log('No active session found, skipping fetch.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userId = activeSession.user.id;
      const [tasksRes, blocksRes, notesRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', userId),
        supabase.from('time_blocks').select('*').eq('user_id', userId),
        supabase.from('whiteboard_notes').select('*').eq('user_id', userId),
      ]);

      console.log('Supabase Fetch Results:', {
        tasks: tasksRes.data?.length,
        blocks: blocksRes.data?.length,
        notes: notesRes.data?.length
      });

      if (tasksRes.error) console.error('Tasks fetch error:', tasksRes.error);
      if (blocksRes.error) console.error('Blocks fetch error:', blocksRes.error);
      if (notesRes.error) console.error('Notes fetch error:', notesRes.error);

      if (tasksRes.data && tasksRes.data.length > 0) {
        setTasks(tasksRes.data.map(t => ({
          ...t,
          time: t.time?.slice(0, 5) || undefined
        })) as unknown as Task[]);
      }

      if (blocksRes.data && blocksRes.data.length > 0) {
        setBlocks(blocksRes.data.map(b => ({
          id: b.id,
          name: b.name,
          color: b.color || 'primary',
          icon: b.icon || 'work',
          startTime: b.start_time?.slice(0, 5) || '',
          endTime: b.end_time?.slice(0, 5) || '',
          days: b.days || []
        })) as BlockData[]);
      } else {
        // Fallback to initial blocks if none in DB
        setBlocks(INITIAL_BLOCKS);
      }

      if (notesRes.data && notesRes.data.length > 0) {
        setNotes(notesRes.data.map(n => ({
          id: n.id,
          type: n.type as any,
          x: Number(n.x) || 0,
          y: Number(n.y) || 0,
          width: Number(n.width) || 256,
          height: Number(n.height) || 256,
          content: n.content || '',
          imageUrl: n.image_url || undefined,
          title: n.title || undefined,
          color: (n.color as any) || 'yellow',
          rotation: Number(n.rotation) || 0,
          zIndex: Number(n.z_index) || 0,
          fontSize: Number(n.font_size) || 16,
          createdAt: n.created_at ? new Date(n.created_at).getTime() : Date.now()
        })) as WhiteboardNote[]);
      } else {
        // Fallback to initial notes if none in DB
        setNotes(INITIAL_NOTES);
      }

    } catch (error) {
      console.error('CRITICAL: Error fetching user data from Supabase:', error);
    } finally {
      setIsLoading(false);
      console.log('Fetch completed. Loading set to false.');
    }
  };




  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAddTask = async (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
    const { error } = await supabase.from('tasks').insert([{
      ...newTask,
      time: newTask.time === '' ? null : newTask.time,
      user_id: session?.user?.id
    }]);
    if (error) console.error('Error adding task:', error);
  };

  const handleEditTask = async (updatedTask: Task) => {
    setTasks((prev) => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    const { error } = await supabase.from('tasks').update({
      ...updatedTask,
      time: updatedTask.time === '' ? null : updatedTask.time
    }).eq('id', updatedTask.id);
    if (error) console.error('Error updating task:', error);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter(t => t.id !== taskId));
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) console.error('Error deleting task:', error);
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) console.error('Error toggling task status:', error);
  };

  const handleUpdateBlocks = async (newBlocks: BlockData[]) => {
    const oldBlocks = blocks;
    setBlocks(newBlocks);

    if (!session?.user?.id) return;

    try {
      // 1. Handle Deletions: Find blocks that were in oldBlocks but not in newBlocks
      const deletedIds = oldBlocks
        .filter(old => !newBlocks.some(now => now.id === old.id))
        .map(old => old.id);

      if (deletedIds.length > 0) {
        await supabase.from('time_blocks').delete().in('id', deletedIds);
      }

      const userId = session?.user?.id;
      if (typeof userId !== 'string') return;

      // 2. Upsert current blocks
      if (newBlocks.length > 0) {
        const { error } = await supabase.from('time_blocks').upsert(newBlocks.map(b => ({
          id: b.id,
          name: b.name,
          color: b.color,
          icon: b.icon,
          start_time: b.startTime,
          end_time: b.endTime,
          days: b.days,
          user_id: userId
        })));
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating blocks:', error);
    }
  };

  // Sync notes to Supabase (debounced)
  useEffect(() => {
    // CRITICAL: Only sync if we have a session AND the initial data has finished loading
    // This prevents deleting DB notes during the time between session start and fetch completion
    if (!session?.user?.id || isLoading) return;

    const syncNotes = async () => {
      try {
        // Fetch current IDs from DB to handle deletions
        const userId = session?.user?.id;
        if (typeof userId !== 'string') {
          console.error('Invalid user ID type:', typeof userId, userId);
          return;
        }

        const { data: dbNotes } = await supabase
          .from('whiteboard_notes')
          .select('id')
          .eq('user_id', userId);

        if (dbNotes) {
          const dbIds = dbNotes.map(n => n.id);
          const localIds = notes.map(n => n.id);
          const idsToDelete = dbIds.filter(id => !localIds.includes(id));

          if (idsToDelete.length > 0) {
            await supabase.from('whiteboard_notes').delete().in('id', idsToDelete);
          }
        }

        if (notes.length > 0) {
          const { error } = await supabase.from('whiteboard_notes').upsert(notes.map(n => ({
            id: n.id,
            type: n.type,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            content: n.content,
            image_url: n.imageUrl || null,
            title: n.title || null,
            color: n.color,
            rotation: n.rotation,
            z_index: n.zIndex,
            font_size: n.fontSize,
            user_id: userId
          })));
          if (error) throw error;
        }
      } catch (error: any) {
        console.error('Error syncing notes full object:', error);
        console.error('Notes being synced:', notes);
        if (error.message) console.error('Error message:', error.message);
        if (error.details) console.error('Error details:', error.details);
        if (error.hint) console.error('Error hint:', error.hint);
      }
    };

    const timer = setTimeout(syncNotes, 2000);
    return () => clearTimeout(timer);
  }, [notes, session]);

  // Handle PWA Install
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };


  return (
    <HashRouter>
      <div className={`flex flex-col h-screen w-full bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-50 antialiased overflow-hidden relative ${isDarkMode ? 'dark' : ''}`}>

        {/* Premium Gradient Mesh Background - Page Level */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Base Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white to-emerald-50/40 dark:from-slate-900 dark:via-background-dark dark:to-slate-900 opacity-100"></div>

          {/* Animated/Soft Blobs */}
          <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-indigo-200/30 dark:bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute bottom-[0%] -right-[5%] w-[40%] h-[40%] rounded-full bg-emerald-200/30 dark:bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>
          <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] rounded-full bg-blue-100/40 dark:bg-blue-600/5 blur-[100px]"></div>

          {/* Texture/Grain Overlay (Subtle) */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>

        {/* Top Navigation replaces Sidebar */}
        <TopNavigation
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          session={session}
          isLoggedIn={isLoggedIn}
          isLoading={isLoading}
          deferredPrompt={deferredPrompt}
          isInstallable={isInstallable}
          handleInstallClick={handleInstallClick}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <Routes>
            <Route path="/" element={
              <TaskDashboard
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
                tasks={tasks}
                blocks={blocks}
                onToggleTaskStatus={handleToggleTaskStatus}
                notes={notes}
                setNotes={setNotes}
              />
            } />
            <Route path="/calendar" element={
              <WeeklyTemplate
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
                blocks={blocks}
                onUpdateBlocks={handleUpdateBlocks}
              />
            } />
            <Route path="/full-calendar" element={<CalendarView toggleTheme={toggleTheme} isDarkMode={isDarkMode} tasks={tasks} onAddTask={handleAddTask} onEditTask={handleEditTask} onDeleteTask={handleDeleteTask} onToggleTaskStatus={handleToggleTaskStatus} />} />
            <Route path="/tasks" element={
              <TaskListView
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
                tasks={tasks}
                onToggleTaskStatus={handleToggleTaskStatus}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            } />
            <Route path="/whiteboard" element={<Whiteboard toggleTheme={toggleTheme} isDarkMode={isDarkMode} notes={notes} setNotes={setNotes} />} />
            <Route path="*" element={
              <TaskDashboard
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
                tasks={tasks}
                blocks={blocks}
                onToggleTaskStatus={handleToggleTaskStatus}
                notes={notes}
                setNotes={setNotes}
              />
            } />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}