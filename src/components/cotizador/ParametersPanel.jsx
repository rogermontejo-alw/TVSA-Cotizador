import React, { useMemo } from 'react';
import { Calendar, DollarSign, MapPin, TrendingUp, Trash2, Info, ChevronRight, Sparkles, Activity, AlertCircle } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';
import FloatingInput from '../ui/FloatingInput';
import { APP_CONFIG } from '../../appConfig';

const ParametersPanel = ({
    productos = [],
    plazaSeleccionada,
    setPlazaSeleccionada,
    presupuesto,
    setPresupuesto,
    duracionDias,
    setDuracionDias,
    paqueteVIX,
    setPaqueteVIX,
    paquetesVIX = [],
    sugerirDistribucion,
    clienteSeleccionado
}) => {

    const plazasDisponibles = useMemo(() => {
        const plazas = productos.map(p => p.plaza).filter(Boolean);
        return [...new Set(plazas)].sort();
    }, [productos]);

    const vixSeleccionado = paquetesVIX.find(p => p.id === paqueteVIX);

    return (
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-enterprise-100 overflow-hidden animate-premium-fade h-full">
            {/* Header Module */}
            <div className="bg-enterprise-950 px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange opacity-10 blur-2xl -mr-16 -mt-16" />
                <h2 className="text-white text-base sm:text-lg font-black flex items-center gap-3 uppercase tracking-tight relative z-10">
                    <DollarSign size={20} className="text-brand-orange" />
                    Campaign Config
                </h2>
                <div className="bg-enterprise-800 rounded-full px-3 py-1 border border-white/10 relative z-10">
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none">V{APP_CONFIG.VERSION}</span>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Plaza Mapping */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <MapPin size={14} className="text-brand-orange" />
                        Strategic Plaza
                    </label>
                    <div className="relative group">
                        <select
                            value={plazaSeleccionada}
                            onChange={(e) => setPlazaSeleccionada(e.target.value)}
                            className="w-full h-12 sm:h-14 bg-enterprise-50 border border-enterprise-200 rounded-2xl pl-4 pr-12 font-black text-enterprise-900 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 outline-none transition-all appearance-none cursor-pointer text-xs sm:text-sm"
                        >
                            <option value="">Todas las plazas</option>
                            {plazasDisponibles.map(plaza => (
                                <option key={plaza} value={plaza}>{plaza.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-enterprise-400 pointer-events-none group-hover:text-brand-orange transition-colors">
                            <ChevronRight size={20} className="rotate-90" />
                        </div>
                    </div>
                </div>

                {/* Investment Scope */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FloatingInput
                        label="Inversión Límite (MXN)"
                        type="number"
                        value={presupuesto}
                        onChange={(e) => setPresupuesto(e.target.value)}
                        icon={DollarSign}
                        placeholder=" "
                    />
                    <FloatingInput
                        label="Vigencia (Días)"
                        type="number"
                        value={duracionDias}
                        onChange={(e) => setDuracionDias(e.target.value)}
                        icon={Calendar}
                        placeholder=" "
                    />
                </div>

                {/* Digital Strategy Module */}
                <div className="space-y-5 pt-8 border-t border-enterprise-100">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-brand-orange" /> VIX Digital Integration
                        </label>
                        <div className="w-5 h-5 bg-enterprise-50 rounded-full flex items-center justify-center text-enterprise-300 cursor-help hover:text-brand-orange transition-colors">
                            <Info size={12} />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative flex-1 group">
                            <select
                                value={paqueteVIX}
                                onChange={(e) => setPaqueteVIX(e.target.value)}
                                className="w-full h-12 sm:h-14 bg-white border border-enterprise-200 rounded-2xl pl-4 pr-12 font-black text-enterprise-900 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 outline-none transition-all appearance-none cursor-pointer text-xs sm:text-sm"
                            >
                                <option value="">NO DIGITAL DEPLOYMENT</option>
                                {paquetesVIX.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre.toUpperCase()} — {formatMXN(p.inversion)}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-enterprise-400 pointer-events-none group-focus-within:text-brand-orange">
                                <ChevronRight size={20} className="rotate-90" />
                            </div>
                        </div>
                        {paqueteVIX && (
                            <button
                                onClick={() => setPaqueteVIX('')}
                                className="w-14 h-14 flex items-center justify-center bg-error-light text-error rounded-2xl hover:bg-error hover:text-white transition-all border border-error/10 shadow-sm"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>

                    {vixSeleccionado && (
                        <div className="p-6 bg-enterprise-950 rounded-3xl relative overflow-hidden shadow-2xl animate-premium-fade border border-white/5">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/20 blur-3xl opacity-50" />
                            <div className="relative z-10 flex flex-col gap-3">
                                <span className="text-[9px] font-black text-brand-orange uppercase tracking-[0.4em]">Audience Forecast</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl sm:text-3xl font-black text-white">{vixSeleccionado.impresiones.toLocaleString()}</span>
                                    <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Impressions</span>
                                </div>
                                <div className="h-px bg-white/10 w-full" />
                                <div className="flex items-center gap-3 text-[10px] text-white/60 font-black uppercase tracking-widest">
                                    <Activity size={12} className="text-emerald-400" />
                                    <span>Cycle: <span className="text-white">{vixSeleccionado.dias} Natural Days</span></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* IA Suggestion CTA */}
                <div className="pt-4">
                    <button
                        onClick={sugerirDistribucion}
                        disabled={!clienteSeleccionado || !presupuesto}
                        className="w-full h-16 sm:h-18 bg-univision-gradient text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] sm:text-[11px] flex items-center justify-center gap-4 shadow-2xl shadow-brand-orange/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 disabled:opacity-30 disabled:hover:translate-y-0 disabled:bg-enterprise-200 group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <TrendingUp size={22} className="group-hover:rotate-12 transition-transform" />
                        <span>Suggest Strategy</span>
                    </button>
                    {!clienteSeleccionado && (
                        <div className="flex items-center justify-center gap-2 mt-5 text-[9px] font-black text-enterprise-400 uppercase tracking-[0.3em] opacity-60">
                            <AlertCircle size={12} className="text-brand-red" />
                            Requiere Identidad Comercial para IA
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParametersPanel;
