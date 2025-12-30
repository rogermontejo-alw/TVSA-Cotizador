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
                <div className="bg-white rounded-2xl border border-enterprise-100 shadow-premium overflow-hidden flex flex-col h-[75px] group hover:border-brand-orange transition-all">
                    <div className="bg-enterprise-950 px-4 py-1.5 flex items-center justify-between">
                        <span className="text-[7.5px] font-black text-white uppercase tracking-[0.3em] italic">Selección Regional</span>
                        <MapPin size={10} className="text-brand-orange" />
                    </div>
                    <div className="px-4 flex-1 flex items-center relative">
                        <select
                            value={plazaSeleccionada}
                            onChange={(e) => setPlazaSeleccionada(e.target.value)}
                            className="w-full bg-transparent pr-4 py-2 text-[10px] font-black text-enterprise-950 outline-none appearance-none cursor-pointer uppercase truncate tracking-tight"
                        >
                            <option value="">TODAS LAS REGIONES</option>
                            {plazasDisponibles.map(plaza => (
                                <option key={plaza} value={plaza}>{plaza.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-enterprise-300 pointer-events-none group-hover:text-brand-orange transition-colors">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>

                {/* 3rd Module: Pipeline Financials */}
                <div className="bg-white rounded-2xl border border-enterprise-100 shadow-premium overflow-hidden flex flex-col h-[75px] group hover:border-brand-orange transition-all">
                    <div className="bg-enterprise-950 px-4 py-1.5 flex items-center justify-between">
                        <span className="text-[7.5px] font-black text-white uppercase tracking-[0.3em] italic">Inversión y Vigencia</span>
                        <DollarSign size={10} className="text-brand-orange" />
                    </div>
                    <div className="flex-1 flex divide-x divide-enterprise-100">
                        <div className="flex-1 px-4 flex items-center gap-2">
                            <span className="text-[10px] font-black text-brand-orange">$</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={presupuesto}
                                onChange={(e) => setPresupuesto(e.target.value)}
                                placeholder="MXN..."
                                className="w-full bg-transparent text-[10px] font-black text-enterprise-950 outline-none placeholder:text-enterprise-300 uppercase"
                            />
                        </div>
                        <div className="w-[80px] px-4 flex items-center gap-2 bg-enterprise-50/30">
                            <Calendar size={12} className="text-brand-orange shrink-0" />
                            <input
                                type="number"
                                inputMode="numeric"
                                value={duracionDias}
                                onChange={(e) => setDuracionDias(e.target.value)}
                                placeholder="30"
                                className="w-full bg-transparent text-[10px] font-black text-enterprise-950 outline-none placeholder:text-enterprise-300 text-center uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* 4th Module: Digital / VIX */}
                <div className="bg-white rounded-2xl border border-enterprise-100 shadow-premium overflow-hidden flex flex-col h-[75px] group hover:border-brand-orange transition-all">
                    <div className="bg-enterprise-950 px-4 py-1.5 flex items-center justify-between">
                        <span className="text-[7.5px] font-black text-white uppercase tracking-[0.3em] italic">Despliegue Digital</span>
                        <Sparkles size={10} className="text-brand-orange" />
                    </div>
                    <div className="px-4 flex-1 flex items-center relative gap-2">
                        <select
                            value={paqueteVIX}
                            onChange={(e) => setPaqueteVIX(e.target.value)}
                            className="flex-1 bg-transparent pr-4 py-2 text-[10px] font-black text-enterprise-950 outline-none appearance-none cursor-pointer uppercase truncate tracking-tight"
                        >
                            <option value="">SIN PLAN DIGITAL</option>
                            {paquetesVIX.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre.toUpperCase()} • {formatMXN(p.inversion)}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={sugerirDistribucion}
                            disabled={!clienteSeleccionado || !presupuesto}
                            className="w-7 h-7 flex items-center justify-center bg-brand-orange text-white rounded-lg hover:bg-brand-magenta transition-all disabled:opacity-30 shadow-lg shadow-brand-orange/20"
                            title="Sugerir Plan"
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
