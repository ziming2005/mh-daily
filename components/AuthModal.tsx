import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
    onSignup: () => void;
    initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onSignup, initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            setError(null);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setError(null);
        }, 500); // Elegant slow fade
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                if (data.user) {
                    onLogin();
                }
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        }
                    }
                });

                if (error) throw error;

                if (data.user) {
                    onSignup();
                } else {
                    setError('Signup successful! Check email for confirmation.');
                    return;
                }
            }
            handleClose();
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen && !isClosing) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100002] flex items-center justify-center p-6 overflow-hidden">
            <style>{`
                :root {
                    --accent-primary: #6366f1;
                    --accent-secondary: #4f46e5;
                }
                @font-face {
                    font-family: 'Rocher';
                    src: url(https://assets.codepen.io/9632/RocherColorGX.woff2);
                }
                @font-palette-values --Grays {
                    font-family: Rocher;
                    base-palette: 9;
                }
                @font-palette-values --Purples {
                    font-family: Rocher;
                    base-palette: 6;
                }
                @font-palette-values --Mint {
                    font-family: Rocher;
                    base-palette: 7;
                }
                .rocher-title {
                    font-family: 'Rocher';
                    font-palette: --Purples;
                    font-variation-settings: "wght" 900;
                    font-size: 34px;
                }
                .dark .rocher-title {
                    font-palette: --Grays;
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .modern-glass {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    box-shadow: 
                        0 25px 50px -12px rgba(0, 0, 0, 0.1),
                        0 0 0 1px rgba(255, 255, 255, 0.3) inset;
                }
                .dark .modern-glass {
                    background: rgba(15, 23, 42, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 
                        0 25px 50px -12px rgba(0, 0, 0, 0.5),
                        0 0 0 1px rgba(255, 255, 255, 0.05) inset;
                }
                .modern-input {
                    border: none;
                    outline: none;
                    background: rgba(255, 255, 255, 0.05);
                    font-size: 15px;
                    color: #222;
                    padding: 12px 20px;
                    box-shadow: inset 4px 4px 4px rgba(15, 15, 15, 0.15), 4px 4px 4px rgba(28, 28, 28, 0.05);
                    border-radius: 25px;
                    background-clip: padding-box;
                    transition: all 0.3s ease;
                }
                .dark .modern-input {
                    color: #fff;
                    background: rgba(0, 0, 0, 0.2);
                    box-shadow: inset 4px 4px 6px rgba(0, 0, 0, 0.4), 1px 1px 2px rgba(255, 255, 255, 0.05);
                }
                .modern-input::placeholder {
                    color: #999;
                    transition: all 0.3s ease;
                    font-size: 15px;
                    font-weight: 400;
                    letter-spacing: .3px;
                }
                .dark .modern-input::placeholder {
                    color: #444;
                }
                .modern-input:focus {
                    box-shadow: inset 2px 2px 3px rgba(15, 15, 15, 0.2), 2px 2px 3px rgba(28, 28, 28, 0.1);
                    background: rgba(255, 255, 255, 0.1);
                }
                .modern-input:focus::placeholder {
                    color: #999;
                }
                .action-button {
                    cursor: pointer;
                    padding: 6px 24px; /* This now controls the size */
                    border-radius: 30px;
                    border: 5px solid #e50000;
                    display: inline-block; 
                    overflow: hidden;
                    background: red;
                    box-shadow:
                        inset 6px 6px 10px rgba(255, 255, 255, 0.6),
                        inset -6px -6px 10px rgba(0, 0, 0, 0.3),
                        2px 2px 10px rgba(0, 0, 0, 0.3),
                        -2px -2px 10px rgba(255, 255, 255, 0.5);
                    transition:
                        box-shadow 0.3s ease,
                        transform 0.1s ease;
                }
                .action-button span {
                    font-weight: 900;
                    font-size: 18px;
                    color: #db0000;
                    text-shadow:
                        1px 1px 1px rgba(255, 255, 255, 0.4),
                        -1px -1px 1px rgba(0, 0, 0, 0.4);
                    position: relative;
                    display: inline-block;
                    transition: transform 0.3s ease-out;
                    z-index: 1;
                    padding: 0px 3px;
                }
                .action-button:hover span {
                    color: #d30000;
                }
                .action-button:active span {
                    color: #f30000;
                    text-shadow:
                        1px 1px 1px rgba(255, 255, 255, 0.5),
                        -1px -1px 2px rgba(0, 0, 0, 0.5);
                }
                .action-button span:hover {
                    transform: translateY(-7px);
                }
                .action-button:active {
                    box-shadow:
                        inset 2px 2px 1px rgba(0, 0, 0, 0.3),
                        inset -2px -2px 1px rgba(255, 255, 255, 0.5);
                    transform: scale(0.98);
                }
                .action-button span:nth-child(1) { transition-delay: 50ms; }
                .action-button span:nth-child(2) { transition-delay: 50ms; }
                .action-button span:nth-child(3) { transition-delay: 50ms; }
                .action-button span:nth-child(4) { transition-delay: 50ms; }
                .action-button span:nth-child(5) { transition-delay: 50ms; }
                .action-button span:nth-child(6) { transition-delay: 50ms; }
                .action-button span:nth-child(7) { transition-delay: 50ms; }
                .action-button span:nth-child(8) { transition-delay: 50ms; }
                @keyframes mesh-shift {
                    0% { background-position: 0% 0%; }
                    25% { background-position: 100% 0%; }
                    50% { background-position: 100% 100%; }
                    75% { background-position: 0% 100%; }
                    100% { background-position: 0% 0%; }
                }
                .subtle-mesh {
                    background: 
                        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.18) 0px, transparent 50%),
                        radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.18) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.15) 0px, transparent 50%),
                        radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.15) 0px, transparent 50%);
                    background-size: 150% 150%;
                    animation: mesh-shift 20s ease-in-out infinite;
                }
            `}</style>

            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-slate-200/20 dark:bg-black/40 backdrop-blur-xl transition-opacity duration-700 subtle-mesh ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            />

            {/* Modal Card */}
            <div
                className={`
                    relative w-full max-w-[400px] modern-glass 
                    rounded-[2rem] p-6 md:p-8
                    transform transition-all duration-700 cubic-bezier(0.23, 1, 0.32, 1)
                    ${isOpen && !isClosing ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}
                `}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all z-50 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
                >
                    <span className="material-symbols-outlined text-[24px]">close</span>
                </button>

                {/* Content */}
                <div className="relative z-10 text-center">
                    <div className="mt-5 mb-8 overflow-hidden">
                        <h2
                            key={mode}
                            className="font-black uppercase tracking-tight rocher-title"
                        >
                            {mode === 'login' ? 'Member Login' : 'Create Account'}
                        </h2>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6 text-left">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold text-center">
                                {error}
                            </div>
                        )}

                        {mode === 'signup' && (
                            <div className="space-y-2 grayscale-in">
                                <label className="text-[12px] font-bold text-slate-600 uppercase dark:text-slate-500 tracking-wider ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    required={mode === 'signup'}
                                    className="w-full modern-input rounded-xl py-3.5 px-5 text-slate-900 dark:text-white focus:outline-none text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-slate-600 uppercase dark:text-slate-500 tracking-wider ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                                className="w-full modern-input rounded-xl py-3.5 px-5 text-slate-900 dark:text-white focus:outline-none text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-slate-600 uppercase dark:text-slate-500 tracking-wider ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                required
                                className="w-full modern-input rounded-xl py-3.5 px-5 text-slate-900 dark:text-white focus:outline-none text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>

                        <div className="flex justify-center pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                // CHANGED: Removed 'w-[65%]' so it relies on your CSS padding
                                className={`
                                    action-button
                                    ${isLoading ? 'opacity-50 cursor-wait' : 'opacity-100'}
                                `}
                            >
                                <div className="flex items-center justify-center">
                                    {isLoading ? (
                                        <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        (mode === 'login' ? 'LOG IN' : 'SIGN UP').split('').map((char, i) => (
                                            <span key={i}>
                                                {char === ' ' ? '\u00A0' : char}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </button>
                        </div>
                    </form>

                    {/* Mode Toggle */}
                    <div className="text-center pt-4">
                        <button
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            // CHANGED: Removed slate colors, added blue as default, added hover:underline
                            className="text-[14px] font-bold text-blue-700 hover:underline dark:text-blue-400"
                        >
                            {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AuthModal;




