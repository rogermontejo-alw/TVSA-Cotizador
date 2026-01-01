import React, { useState, useEffect, useMemo } from 'react';
import {
    ShieldAlert, Calendar, LayoutDashboard, Rocket,
    ArrowRight, CheckCircle2, Clock, Zap, Star
} from 'lucide-react';

const BriefingModal = ({ interacciones, clientes, onClose }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

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
                if (!i.fecha_recordatorio) return false;
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
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
                {/* Header Premium */}
                <div className="bg-enterprise-950 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-brand-orange/20 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-brand-orange rounded-lg shadow-lg shadow-brand-orange/20 animate-pulse">
                                    <Zap size={16} className="text-white fill-white" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tighter uppercase italic italic-brand">Nexus Briefing</h2>
                            </div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Módulo de Inteligencia Comercial</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black tracking-tighter opacity-20">{localHoy.getFullYear()}</p>
                            <p className="text-[9px] font-bold text-brand-orange uppercase">{currentTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {/* Stats de Impacto */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center group hover:bg-white hover:shadow-xl transition-all">
                            <p className="text-[24px] font-black text-slate-900 group-hover:scale-110 transition-transform">{clientes.length}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Cartera Total</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center group hover:bg-white hover:shadow-xl transition-all">
                            <p className={`text-[24px] font-black ${pendientesHoy.length > 0 ? 'text-brand-orange' : 'text-slate-900'}`}>{pendientesHoy.length}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Focus Hoy</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center group hover:bg-white hover:shadow-xl transition-all">
                            <p className="text-[24px] font-black text-slate-900">{pendientesSemana.length}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">En Pipeline</p>
                        </div>
                    </div>

                    {/* Alertas Críticas */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Star size={14} className="text-brand-orange fill-brand-orange" />
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Agenda de Seguimiento</h3>
                        </div>

                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                            {todosPendientes.length > 0 ? todosPendientes.map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all">
                                        <Clock size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[150px]">{clientes.find(c => String(c.id) === String(p.cliente_id))?.nombre_empresa || 'Cliente'}</p>
                                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md bg-white border border-slate-100 ${p.colorEtiqueta}`}>
                                                {p.etiqueta}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold truncate italic leading-tight mt-0.5">"{p.comentario}"</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-900 uppercase">{p.fechaD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-[7px] font-bold text-slate-300 uppercase">{p.fechaD.toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                    <p className="text-[9px] font-black text-slate-300 uppercase italic">Sin seguimientos para esta semana</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Frase Motivacional */}
                    <div className="bg-brand-orange/5 p-6 rounded-[2rem] border border-brand-orange/10 relative overflow-hidden">
                        <Rocket className="absolute -right-4 -bottom-4 text-brand-orange/10" size={80} />
                        <p className="text-[11px] font-black text-brand-orange uppercase tracking-widest mb-2 italic">Mindset Corporativo</p>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic relative z-10">"{fraseDelDia}"</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-5 bg-enterprise-950 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-enterprise-950/20 active:scale-95 group"
                    >
                        Entendido, vamos a vender
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BriefingModal;
