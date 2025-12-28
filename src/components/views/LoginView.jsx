import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, Loader2, Play } from 'lucide-react';

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
                ? 'Credenciales incorrectas. Verifica tu email y contraseña.'
                : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-md relative animate-in fade-in zoom-in duration-700">
                {/* Logo / Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-red-600 to-red-500 rounded-3xl shadow-2xl shadow-red-900/40 mb-6 transform hover:rotate-6 transition-transform">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
                        TELEVISA<span className="text-red-500">MID</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
                        Portal de Gestión de Ventas v2.0
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Corporativo</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 text-white pl-12 pr-4 py-4 rounded-2xl transition-all outline-none font-bold"
                                    placeholder="usuario@televisa.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 text-white pl-12 pr-4 py-4 rounded-2xl transition-all outline-none font-bold"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-4 rounded-xl animate-in shake duration-500">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>Acceder al Sistema</span>
                                    <Play size={16} className="fill-current group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-50">
                        Solo personal autorizado por la Dirección Comercial
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
