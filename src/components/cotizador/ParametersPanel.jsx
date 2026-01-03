import React, { useMemo } from 'react';
import { Calendar, DollarSign, MapPin, ChevronDown, Sparkles } from 'lucide-react';
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
    iniciarNuevaCotizacion, // Prop added
    compactRow,
    mobileStage
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
                <div className={`bg-white rounded-2xl border border-enterprise-100 shadow-premium overflow-hidden flex flex-col h-[75px] group hover:border-brand-orange transition-all ${mobileStage === 'digital' ? 'hidden xl:flex' : 'flex'}`}>
                    <div className="bg-enterprise-950 px-4 py-1.5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[7.5px] font-black text-white uppercase tracking-[0.3em] italic">Propuesta Regional</span>
                            <button
                                onClick={iniciarNuevaCotizacion}
                                className="text-[7px] font-black text-brand-orange hover:text-white uppercase tracking-widest bg-brand-orange/10 hover:bg-brand-orange px-1.5 py-0.5 rounded transition-all"
                                title="Reiniciar Sesión"
                            >
                                Reiniciar
                            </button>
                        </div>
                        <MapPin size={10} className="text-brand-orange" />
                    </div>
                    <div className="px-4 flex-1 flex items-center relative min-w-0">
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
                <div className={`bg-white rounded-2xl border border-enterprise-100 shadow-premium overflow-hidden flex flex-col h-[75px] group hover:border-brand-orange transition-all ${mobileStage === 'digital' ? 'hidden xl:flex' : 'flex'}`}>
                    <div className="bg-enterprise-950 px-4 py-1.5 flex items-center justify-between shrink-0">
                        <span className="text-[7.5px] font-black text-white uppercase tracking-[0.3em] italic">Inversión y Vigencia</span>
                        <DollarSign size={10} className="text-brand-orange" />
                    </div>
                    <div className="flex-1 flex divide-x divide-enterprise-100 min-w-0">
                        <div className="flex-1 px-4 flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black text-brand-orange">$</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={presupuesto}
                                onChange={(e) => setPresupuesto(e.target.value)}
                                placeholder="MXN..."
                                className="w-full bg-transparent text-[10px] font-black text-enterprise-950 outline-none placeholder:text-enterprise-500 uppercase truncate"
                            />
                        </div>
                        <div className="w-[110px] px-4 flex items-center gap-2 bg-enterprise-50/30 shrink-0">
                            <Calendar size={12} className="text-brand-orange shrink-0" />
                            <input
                                type="number"
                                inputMode="numeric"
                                value={duracionDias}
                                onChange={(e) => setDuracionDias(e.target.value)}
                                placeholder="30"
                                className="w-full bg-transparent text-[10px] font-black text-enterprise-950 outline-none placeholder:text-enterprise-500 text-center uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* 4th Module: Digital / VIX */}
                <div className={`bg-white rounded-2xl border border-enterprise-100 shadow-premium overflow-hidden flex flex-col h-[75px] group hover:border-brand-orange transition-all ${mobileStage === 'context' ? 'hidden xl:flex' : 'flex'}`}>
                    <div className="bg-enterprise-950 px-4 py-1.5 flex items-center justify-between shrink-0">
                        <span className="text-[7.5px] font-black text-white uppercase tracking-[0.3em] italic">Despliegue Digital</span>
                        <Sparkles size={10} className="text-brand-orange" />
                    </div>
                    <div className="px-4 flex-1 flex items-center relative gap-2 min-w-0">
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
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-enterprise-300 pointer-events-none group-hover:text-brand-orange transition-colors">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return null;
};

export default ParametersPanel;
