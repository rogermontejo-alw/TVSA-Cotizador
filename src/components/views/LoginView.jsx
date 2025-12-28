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

                <div className="relative z-10 text-white space-y-16 max-w-xl">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white rounded-3xl p-5 shadow-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                            <img src="/logo-tvsa.png" alt="Televisa" className="w-full h-full object-contain" />
                        </div>
                        <div className="h-14 w-px bg-white/20" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5900]">Security First</p>
                            <p className="text-2xl font-black tracking-tighter uppercase italic">Institutional <span className="text-white/30 not-italic">Gate</span></p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-[14px] font-black uppercase tracking-[0.5em] text-[#FF5900]/70">Enterprise Resource Planning</h2>
                        <h1 className="text-8xl font-black tracking-tight leading-[0.9] uppercase text-white">
                            Comercial<br />
                            <span className="text-transparent bg-clip-text bg-univision-gradient italic">Suite</span>
                        </h1>
                        <p className="text-xl font-bold text-white/80 leading-relaxed">
                            Acceso unificado a la plataforma de inteligencia comercial más avanzada de <span className="text-[#FF5900] font-black">TelevisaUnivision México</span>.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-10 pt-10 border-t border-white/10">
                        <div className="space-y-2">
                            <span className="block text-5xl font-black text-white italic">0.1ms</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5900]">Latency Response</span>
                        </div>
                        <div className="space-y-2">
                            <span className="block text-5xl font-black text-white italic">256b</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5900]">AES-Encryption</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Disclaimer */}
                <div className="absolute bottom-12 left-20 flex items-center gap-4">
                    <Globe size={16} className="text-[#FF5900] animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                        TelevisaUnivision Intelligence Node • CDMX 2025
                    </p>
                </div>
            </div>

            {/* Login Form Side */}
            <div className="w-full lg:w-5/12 bg-white flex items-center justify-center p-8 md:p-24 relative">
                {/* Mobile Background Accent */}
                <div className="lg:hidden absolute top-0 left-0 right-0 h-1 bg-brand-orange" />

                <div className="w-full max-w-[440px] space-y-12">
                    {/* Header Section */}
                    <div className="space-y-6">
                        <div className="lg:hidden w-16 h-16 bg-enterprise-50 rounded-2xl p-4 mb-8">
                            <img src="/logo-tvsa.png" alt="TU" className="w-full h-full object-contain" />
                        </div>

                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-enterprise-50 rounded-full border border-enterprise-100">
                            <ShieldCheck size={16} className="text-brand-orange" />
                            <span className="text-[10px] font-black text-enterprise-700 uppercase tracking-widest">Protocolo de Acceso Seguro</span>
                        </div>

                        <div className="space-y-2 text-left">
                            <h2 className="text-5xl font-black text-enterprise-950 tracking-tight leading-none uppercase italic italic-brand">Inicia Sesión</h2>
                            <p className="text-enterprise-600 font-bold text-base leading-snug">Ingresa tus credenciales TU corporativas para acceder al ecosistema.</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-5">
                            <FloatingInput
                                label="Dirección de E-mail"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={Mail}
                                required
                            />

                            <div className="space-y-2">
                                <FloatingInput
                                    label="Contraseña"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    icon={Lock}
                                    required
                                />
                                <div className="flex justify-end">
                                    <button type="button" className="text-[10px] font-black text-brand-orange hover:text-brand-magenta transition-all uppercase tracking-widest">
                                        ¿Olvidaste tu acceso?
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-5 bg-error-light border border-error/10 rounded-2xl text-[11px] font-black text-error uppercase tracking-wide flex items-center gap-4 animate-in shake duration-500">
                                <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Zap size={20} className="fill-error" />
                                </div>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-6">
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full h-20 bg-enterprise-950 text-white rounded-[2rem] font-black uppercase tracking-[0.25em] text-xs shadow-2xl shadow-enterprise-900/30 hover:bg-brand-orange hover:shadow-brand-orange/40 hover:-translate-y-1 active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-4 group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        <span>Autenticar Sesión</span>
                                        <Play size={16} className="fill-white group-hover:translate-x-1.5 transition-transform" />
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] font-bold text-enterprise-400 uppercase tracking-widest text-center leading-loose opacity-60">
                                Este entorno está cifrado con AES-256. <br />
                                TelevisaUnivision Cybersecurity Systems.
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
