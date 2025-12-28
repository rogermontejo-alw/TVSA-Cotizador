import React, { useEffect } from 'react';
import { RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react';

const StatusMessage = ({ tipo, texto, setMensaje }) => {
    // Auto-close after 4 seconds unless it's a "loading" state
    useEffect(() => {
        if (texto && tipo !== 'cargando') {
            const timer = setTimeout(() => {
                setMensaje({ tipo: '', texto: '' });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [texto, tipo, setMensaje]);

    if (!texto) return null;

    let icon, accentColor, shadowColor;

    switch (tipo) {
        case 'exito':
            accentColor = 'bg-emerald-500';
            shadowColor = 'shadow-emerald-500/20';
            icon = <CheckCircle size={24} className="text-white" />;
            break;
        case 'error':
            accentColor = 'bg-red-600';
            shadowColor = 'shadow-red-600/20';
            icon = <AlertCircle size={24} className="text-white" />;
            break;
        case 'cargando':
            accentColor = 'bg-slate-900';
            shadowColor = 'shadow-slate-900/20';
            icon = <RefreshCw className="animate-spin text-white" size={24} />;
            break;
        default:
            accentColor = 'bg-slate-700';
            shadowColor = 'shadow-slate-700/20';
            icon = <AlertCircle size={24} className="text-white" />;
    }

    return (
        <div className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center p-4 sm:p-6 pointer-events-none animate-in fade-in duration-300">
            {/* Backdrop for mobile focus */}
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] pointer-events-auto" onClick={() => setMensaje({ tipo: '', texto: '' })} />

            <div className={`
                relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto
                ${shadowColor} animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-500
            `}>
                <div className="flex items-center p-5 gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 ${accentColor} rounded-2xl flex items-center justify-center shadow-lg`}>
                        {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Notificación</p>
                        <p className="text-sm font-black text-slate-800 leading-tight">
                            {texto}
                        </p>
                    </div>

                    <button
                        onClick={() => setMensaje({ tipo: '', texto: '' })}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Progress bar for auto-close */}
                {tipo !== 'cargando' && (
                    <div className="h-1 w-full bg-gray-50">
                        <div className={`h-full ${accentColor} animate-toast-progress`} />
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes toast-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-toast-progress {
                    animation: toast-progress 4s linear forwards;
                }
            `}} />
        </div>
    );
};

export default StatusMessage;
