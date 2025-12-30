import React, { useMemo } from 'react';
import { Calendar, DollarSign, MapPin, ChevronDown, Sparkles, Wand2 } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

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
    clienteSeleccionado,
    compactRow
}) => {

    const plazasDisponibles = useMemo(() => {
        const plazas = productos.map(p => p.plaza).filter(Boolean);
        return [...new Set(plazas)].sort();
    }, [productos]);

    const vixSeleccionado = paquetesVIX.find(p => p.id === paqueteVIX);

    if (compactRow) {
        return (
            <>
                {/* 2nd Module: Regions/Plaza */}
                <div className="bg-white rounded-2xl border border-enterprise-100 shadow-premium overflow-hidden flex flex-col h-[68px]">
                    <div className="bg-enterprise-950 px-3 py-1.5 flex items-center justify-between">
                        <span className="text-[8px] font-black text-white/70 uppercase tracking-[0.2em] italic text-center w-full">Regional Selection</span>
                    </div>
                    <div className="px-3 flex-1 flex items-center relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange">
                            <MapPin size={12} />
                        </div>
                        <select
                            value={plazaSeleccionada}
                            onChange={(e) => setPlazaSeleccionada(e.target.value)}
                            className="w-full bg-transparent pl-5 pr-4 py-2 text-[10px] font-black text-enterprise-950 outline-none appearance-none cursor-pointer uppercase truncate"
                        >
                            <option value="">TODAS LAS REGIONES</option>
                            {plazasDisponibles.map(plaza => (
                                <option key={plaza} value={plaza}>{plaza.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-enterprise-500 pointer-events-none">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>

                {/* 3rd Module: Pipeline Financials */}
                <div className="bg-white rounded-2xl border border-enterprise-100 shadow-premium overflow-hidden flex flex-col h-[68px]">
                    <div className="bg-enterprise-950 px-3 py-1.5 flex items-center justify-between">
                        <span className="text-[8px] font-black text-white/70 uppercase tracking-[0.2em] italic text-center w-full">Investment & Term</span>
                    </div>
                    <div className="flex-1 flex divide-x divide-enterprise-100">
                        <div className="flex-1 px-3 flex items-center gap-2">
                            <DollarSign size={12} className="text-brand-orange shrink-0" />
                            <input
                                type="number"
                                value={presupuesto}
                                onChange={(e) => setPresupuesto(e.target.value)}
                                placeholder="MXN..."
                                className="w-full bg-transparent text-[10px] font-black text-enterprise-950 outline-none placeholder:text-enterprise-400"
                            />
                        </div>
                        <div className="flex-1 px-3 flex items-center gap-2">
                            <Calendar size={12} className="text-brand-orange shrink-0" />
                            <input
                                type="number"
                                value={duracionDias}
                                onChange={(e) => setDuracionDias(e.target.value)}
                                placeholder="DAYS..."
                                className="w-full bg-transparent text-[10px] font-black text-enterprise-950 outline-none placeholder:text-enterprise-400 text-center"
                            />
                        </div>
                    </div>
                </div>

                {/* 4th Module: Digital / VIX */}
                <div className="bg-white rounded-2xl border border-enterprise-100 shadow-premium overflow-hidden flex flex-col h-[68px]">
                    <div className="bg-enterprise-950 px-3 py-1.5 flex items-center justify-between">
                        <span className="text-[8px] font-black text-white/70 uppercase tracking-[0.2em] italic text-center w-full">Digital Deployment</span>
                        {vixSeleccionado && (
                            <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">{vixSeleccionado.impresiones.toLocaleString()} IMP</span>
                        )}
                    </div>
                    <div className="px-3 flex-1 flex items-center relative gap-2">
                        <div className="text-brand-orange shrink-0">
                            <Sparkles size={12} />
                        </div>
                        <select
                            value={paqueteVIX}
                            onChange={(e) => setPaqueteVIX(e.target.value)}
                            className="flex-1 bg-transparent pr-4 py-2 text-[10px] font-black text-enterprise-950 outline-none appearance-none cursor-pointer uppercase truncate"
                        >
                            <option value="">NO DIGITAL PLAN</option>
                            {paquetesVIX.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre.toUpperCase()} • {formatMXN(p.inversion)}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={sugerirDistribucion}
                            disabled={!clienteSeleccionado || !presupuesto}
                            className="w-6 h-6 flex items-center justify-center bg-brand-orange/10 text-brand-orange rounded-lg hover:bg-brand-orange hover:text-white transition-all disabled:opacity-30"
                            title="Suggest Plan"
                        >
                            <Wand2 size={12} />
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return null;
};

export default ParametersPanel;
