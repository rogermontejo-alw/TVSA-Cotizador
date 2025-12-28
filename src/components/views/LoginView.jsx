import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, Loader2, Play, ShieldCheck, Zap, Globe } from 'lucide-react';
import FloatingInput from '../ui/FloatingInput';

const LoginView = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
        } catch (err) {
            setError(err.message === 'Invalid login credentials'
                ? 'Credenciales no reconocidas por el sistema de seguridad.'
                : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-enterprise-50 flex flex-col lg:flex-row overflow-hidden font-sans">
            {/* Visual Brand Side - Premium Gradient */}
            <div className="hidden lg:flex w-7/12 bg-[#111111] relative overflow-hidden items-center justify-center p-20">
                {/* Decorative Brand Background */}
                <div className="absolute top-0 left-0 w-full h-full bg-[#FF5900] opacity-10 blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-full h-full bg-[#C83378] opacity-10 blur-[150px] translate-x-1/2 translate-y-1/2" />

                <div className="relative z-10 text-white space-y-12 max-w-lg">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-2xl p-4 shadow-2xl flex items-center justify-center -rotate-2 hover:rotate-0 transition-transform duration-500">
                            <img src="/logo-tvsa.png" alt="Televisa" className="w-full h-full object-contain" />
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-orange">Security Protocol</p>
                            <p className="text-xl font-black tracking-tighter uppercase italic text-white/90">Commercial <span className="text-white/30 not-italic">Identity</span></p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white/30">Enterprise Intelligence Node</h2>
                        <h1 className="text-6xl font-black tracking-tight leading-[0.95] uppercase text-white">
                            Comercial<br />
                            <span className="text-transparent bg-clip-text bg-univision-gradient italic">Suite</span>
                        </h1>
                        <p className="max-w-md text-base font-medium text-white/50 leading-relaxed">
                            Acceso unificado a la arquitectura de inteligencia comercial de <span className="text-brand-orange font-black">TelevisaUnivision</span>.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                        <div className="space-y-1">
                            <span className="block text-3xl font-black text-white italic tracking-tighter">0.1ms</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Response Global Latency</span>
                        </div>
                        <div className="space-y-1">
                            <span className="block text-3xl font-black text-white italic tracking-tighter">256-AES</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Encryption Protocol</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Disclaimer */}
                <div className="absolute bottom-12 left-20 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse shadow-[0_0_8px_rgba(255,89,0,0.6)]" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                        Corporate Infrastructure • MX-NODE 4.0
                    </p>
                </div>
            </div>

            {/* Login Form Side */}
            <div className="w-full lg:w-5/12 bg-white flex items-center justify-center p-8 md:p-24 relative shadow-[-20px_0_50px_rgba(0,0,0,0.1)]">
                {/* Mobile Background Accent */}
                <div className="lg:hidden absolute top-0 left-0 right-0 h-1.5 bg-brand-orange" />

                <div className="w-full max-w-[380px] space-y-10">
                    {/* Header Section */}
                    <div className="space-y-6">
                        <div className="lg:hidden w-14 h-14 bg-enterprise-50 rounded-2xl p-3.5 mb-8">
                            <img src="/logo-tvsa.png" alt="TU" className="w-full h-full object-contain" />
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-enterprise-50 rounded-lg border border-enterprise-100">
                            <ShieldCheck size={14} className="text-brand-orange" />
                            <span className="text-[9px] font-black text-enterprise-500 uppercase tracking-widest leading-none">Acceso Protocolizado</span>
                        </div>

                        <div className="space-y-2 text-left">
                            <h2 className="text-3xl font-black text-enterprise-950 tracking-tight leading-none uppercase italic">Inicia Sesión</h2>
                            <p className="text-enterprise-400 font-medium text-sm leading-snug">Autenticación corporativa requerida.</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-5">
                            <FloatingInput
                                label="Identificador de Usuario"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={Mail}
                                required
                            />

                            <div className="space-y-2">
                                <FloatingInput
                                    label="Clave de Acceso"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    icon={Lock}
                                    required
                                />
                                <div className="flex justify-start px-1 pt-1">
                                    <button type="button" className="text-[9px] font-black text-enterprise-300 hover:text-brand-orange transition-all uppercase tracking-widest">
                                        Restaurar credenciales
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-error-light border border-error/10 rounded-xl text-[10px] font-black text-error uppercase tracking-wide flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                                <Zap size={16} className="fill-error shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-6">
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full h-16 bg-enterprise-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-enterprise-900/10 hover:bg-brand-orange hover:shadow-brand-orange/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <span>Autenticar Acceso</span>
                                        <Play size={14} className="fill-white group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <p className="text-[8px] font-black text-enterprise-300 uppercase tracking-widest text-center leading-loose">
                                Entorno de seguridad restringido <br />
                                TelevisaUnivision Cybersecurity
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer Disclaimer (Mobile) */}
                <div className="lg:hidden absolute bottom-8 left-0 right-0 text-center px-8">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-enterprise-300">
                        TU INTELLIGENCE NODE © 2025
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
