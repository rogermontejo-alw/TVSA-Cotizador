import React, { useState, useEffect, useMemo } from 'react';
import {
    ShieldAlert, Calendar, LayoutDashboard, Rocket,
    ArrowRight, CheckCircle2, Clock, Zap, Star, RefreshCw
} from 'lucide-react';

const BriefingModal = ({ interacciones, clientes, onClose, onUpdateInteraction }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Obtener fecha actual en zona horaria local (Mérida)
    const getLocalDate = () => {
        const d = new Date();
        return new Date(d.toLocaleString("en-US", { timeZone: "America/Merida" }));
    };

    const localHoy = getLocalDate();
    localHoy.setHours(0, 0, 0, 0);

    const localMañana = new Date(localHoy);
    localMañana.setDate(localHoy.getDate() + 1);

    const localFinSemana = new Date(localHoy);
    localFinSemana.setDate(localHoy.getDate() + 7);

    // Filtrar y Organizar recordatorios
    const todosPendientes = useMemo(() => {
        return (interacciones || [])
            .filter(i => {
                if (!i.fecha_recordatorio || i.completado) return false;
                const d = new Date(i.fecha_recordatorio);
                return d >= localHoy && d <= localFinSemana;
            })
            .sort((a, b) => new Date(a.fecha_recordatorio) - new Date(b.fecha_recordatorio))
            .map(p => {
                const d = new Date(p.fecha_recordatorio);
                d.setHours(d.getHours()); // Mantener local

                let etiqueta = "";
                let colorEtiqueta = "text-slate-400";

                if (d < localMañana) {
                    etiqueta = "Hoy";
                    colorEtiqueta = "text-brand-orange";
                } else if (d < new Date(localMañana.getTime() + 24 * 60 * 60 * 1000)) {
                    etiqueta = "Mañana";
                    colorEtiqueta = "text-blue-500";
                } else {
                    etiqueta = d.toLocaleDateString('es-MX', { weekday: 'short' });
                }

                return { ...p, etiqueta, colorEtiqueta, fechaD: d };
            });
    }, [interacciones, localHoy, localMañana, localFinSemana]);

    const pendientesHoy = todosPendientes.filter(p => p.etiqueta === "Hoy");
    const pendientesSemana = todosPendientes.filter(p => p.etiqueta !== "Hoy");

    const frasesMotivacionales = [
        "El éxito no es el final, el fracaso no es fatal: lo que cuenta es el valor para continuar.",
        "Tu actitud, no tu aptitud, determinará tu altitud.",
        "No cuentes los días, haz que los días cuenten.",
        "La mejor forma de predecir el futuro es creándolo.",
        "El 80% del éxito consiste en presentarse.",
        "No busques clientes para tus productos, busca productos para tus clientes."
    ];

    const fraseDelDia = frasesMotivacionales[new Date().getDate() % frasesMotivacionales.length];

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-enterprise-950/40 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 flex flex-col">

                {/* Header Premium - More Compact */}
                <div className="bg-enterprise-950 p-6 sm:p-8 text-white relative shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-brand-orange/20 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-brand-orange rounded-lg shadow-lg shadow-brand-orange/20 animate-pulse">
                                    <Zap size={14} className="text-white fill-white" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic italic-brand">Nexus Briefing</h2>
                            </div>
                            <p className="text-[7.5px] sm:text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">Módulo de Inteligencia Comercial</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-brand-orange uppercase">{currentTime.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                            <p className="text-[18px] sm:text-2xl font-black tracking-tighter opacity-20 leading-none">{localHoy.getFullYear()}</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">

                    {/* Stats de Impacto - More density */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-6">
                        <div className="bg-slate-50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 text-center group hover:bg-white hover:shadow-xl transition-all">
                            <p className="text-[18px] sm:text-[24px] font-black text-slate-900 group-hover:scale-110 transition-transform">{clientes.length}</p>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Cartera</p>
                        </div>
                        <div className="bg-slate-50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 text-center group hover:bg-white hover:shadow-xl transition-all">
                            <p className={`text-[18px] sm:text-[24px] font-black ${pendientesHoy.length > 0 ? 'text-brand-orange' : 'text-slate-900'}`}>{pendientesHoy.length}</p>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Focus Hoy</p>
                        </div>
                        <div className="bg-slate-50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 text-center group hover:bg-white hover:shadow-xl transition-all">
                            <p className="text-[18px] sm:text-[24px] font-black text-slate-900">{pendientesSemana.length}</p>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Pipeline</p>
                        </div>
                    </div>

                    {/* Alertas Críticas */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Star size={12} className="text-brand-orange fill-brand-orange" />
                            <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">Agenda Estratégica</h3>
                        </div>

                        <div className="space-y-2">
                            {todosPendientes.length > 0 ? todosPendientes.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                                    <button
                                        onClick={async () => {
                                            setUpdatingId(p.id);
                                            await onUpdateInteraction(p.id, { completado: true });
                                            setUpdatingId(null);
                                        }}
                                        disabled={updatingId === p.id}
                                        className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-300 hover:text-emerald-500 hover:border-emerald-500 transition-all shrink-0 shadow-sm group/check"
                                    >
                                        {updatingId === p.id ? (
                                            <RefreshCw size={14} className="animate-spin text-brand-orange" />
                                        ) : (
                                            <CheckCircle2 size={14} className="group-hover/check:scale-110 transition-transform" />
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[9px] font-black text-slate-900 uppercase truncate">{clientes.find(c => String(c.id) === String(p.cliente_id))?.nombre_empresa || 'Cliente'}</p>
                                            <span className={`text-[6px] font-black uppercase px-1 py-0.5 rounded bg-white border border-slate-100 shrink-0 ${p.colorEtiqueta}`}>
                                                {p.etiqueta}
                                            </span>
                                        </div>
                                        <p className="text-[8.5px] text-slate-400 font-bold truncate italic leading-tight mt-0.5">"{p.comentario}"</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[8.5px] font-black text-slate-900 uppercase">{p.fechaD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-[6.5px] font-bold text-slate-300 uppercase">{p.fechaD.toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-6 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                    <p className="text-[8px] font-black text-slate-300 uppercase italic">Sin seguimientos agendados</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Frase Motivacional - Integrated as an insight block */}
                    <div className="bg-brand-orange/5 p-5 rounded-[1.5rem] border border-brand-orange/10 relative overflow-hidden shrink-0">
                        <Rocket className="absolute -right-4 -bottom-4 text-brand-orange/10" size={60} />
                        <p className="text-[9px] font-black text-brand-orange uppercase tracking-widest mb-1 italic">Mindset Corporativo</p>
                        <p className="text-[12px] font-bold text-slate-600 leading-relaxed italic relative z-10 pr-8">"{fraseDelDia}"</p>
                    </div>
                </div>

                {/* Sticky Footer Action */}
                <div className="p-6 sm:p-8 pt-2 bg-white border-t border-slate-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-enterprise-950 text-white rounded-[1.2rem] font-black uppercase text-[9px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-enterprise-950/20 active:scale-95 group"
                    >
                        Entendido, vamos a vender
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BriefingModal;
