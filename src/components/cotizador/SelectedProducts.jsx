import React from 'react';
import { X, Plus, Minus, FileText, Trash2, PieChart, Layers, ArrowRight, Info } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const SelectedProducts = ({
    productos = [],
    productosSeleccionados = [],
    paqueteVIX = null,
    setPaqueteVIX,
    paquetesVIX = [],
    actualizarCantidad,
    eliminarProducto,
    generarCotizacion,
    presupuesto,
    subtotalActual,
    subtotalTVActual,
    subtotalVIXActual,
    clienteSeleccionado,
    calcularPrecioUnitario,
    onlyItems = false,
    onlySummary = false
}) => {
    const vixSeleccionado = paquetesVIX.find(p => p.id === paqueteVIX);
    const presupuestoNum = presupuesto ? parseFloat(presupuesto) : 0;
    const saldoDisponible = presupuestoNum - subtotalActual;
    const isOverBudget = saldoDisponible < 0;

    const itemsSection = (
        <div className="bg-white rounded-[2rem] shadow-premium border border-enterprise-100 overflow-hidden flex flex-col w-full h-[520px] animate-premium-fade">
            <div className="bg-enterprise-950 px-6 py-4 flex items-center justify-between shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center gap-3 relative z-10">
                    <Layers size={14} className="text-brand-orange" strokeWidth={3} />
                    <h2 className="text-white text-[10px] font-black uppercase tracking-[0.3em] italic leading-none">Arquitectura del Plan</h2>
                </div>
                <span className="text-[8px] font-black text-white/60 uppercase tracking-[0.3em] relative z-10">
                    {productosSeleccionados.length + (vixSeleccionado ? 1 : 0)} Consolidados
                </span>
            </div>

            <div className="overflow-y-auto custom-scrollbar space-y-2 bg-enterprise-50/20 flex-1 p-3">
                {productosSeleccionados.length === 0 && !vixSeleccionado ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                        <Layers size={48} className="text-enterprise-950 mb-4" strokeWidth={1} />
                        <p className="text-[10px] font-black text-enterprise-950 uppercase tracking-[0.4em]">Plan Vacío</p>
                    </div>
                ) : (
                    <>
                        {productosSeleccionados.map(ps => {
                            const producto = productos.find(p => p.id === ps.id);
                            if (!producto) return null;
                            const precioUnitario = calcularPrecioUnitario(ps.id, clienteSeleccionado);

                            return (
                                <div key={ps.id} className="group flex items-center gap-3 p-3 bg-white border border-enterprise-100 rounded-2xl shadow-sm hover:border-brand-orange transition-all">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 text-[7.5px] font-black uppercase italic">
                                            <span className="text-brand-orange">{producto.canal}</span>
                                            <span className="text-enterprise-400">{producto.plaza}</span>
                                            {producto.horario && (
                                                <>
                                                    <span className="w-1 h-1 bg-enterprise-200 rounded-full" />
                                                    <span className="text-brand-orange/70 font-black">{producto.horario}</span>
                                                </>
                                            )}
                                        </div>
                                        <h4 className="text-[10px] font-black text-enterprise-950 uppercase truncate leading-none italic group-hover:text-brand-orange transition-colors">
                                            {producto.tipo} <span className="text-enterprise-300 not-italic font-bold ml-1 text-[8px]">[{producto.duracion}]</span>
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-enterprise-50 p-1 rounded-xl border border-enterprise-100 shadow-inner">
                                            <button
                                                onClick={() => actualizarCantidad(ps.id, ps.cantidad - 1)}
                                                className="w-6 h-6 flex items-center justify-center text-enterprise-950 hover:text-brand-orange transition-colors"
                                            >
                                                <Minus size={10} strokeWidth={4} />
                                            </button>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={ps.cantidad || 0}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                                    actualizarCantidad(ps.id, val);
                                                }}
                                                className="w-10 bg-transparent text-center font-black text-[9px] text-enterprise-950 outline-none"
                                            />
                                            <button
                                                onClick={() => actualizarCantidad(ps.id, ps.cantidad + 1)}
                                                className="w-6 h-6 flex items-center justify-center text-enterprise-950 hover:text-brand-orange transition-colors"
                                            >
                                                <Plus size={10} strokeWidth={4} />
                                            </button>
                                        </div>

                                        <div className="text-right min-w-[70px]">
                                            <span className="text-[11px] font-black text-enterprise-950 tracking-tighter block italic leading-none">
                                                {formatMXN(precioUnitario * ps.cantidad)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => eliminarProducto(ps.id)}
                                            className="w-8 h-8 rounded-xl flex items-center justify-center text-enterprise-300 hover:bg-error/10 hover:text-error transition-all"
                                        >
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {vixSeleccionado && (
                            <div className="p-4 bg-enterprise-950 rounded-2xl flex items-center justify-between border border-white/10 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/10 blur-2xl -mr-12 -mt-12" />
                                <div className="flex items-center gap-3 min-w-0 relative z-10">
                                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                                        <span className="text-brand-orange font-black text-[10px] italic leading-none">VIX</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[9px] font-black text-white uppercase truncate leading-none tracking-widest">
                                            {vixSeleccionado.nombre}
                                        </h4>
                                        <p className="text-[6px] font-black text-white/40 uppercase mt-1">Capa de Impacto Digital</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <span className="text-[11px] font-black text-emerald-400 tracking-tighter italic">{formatMXN(vixSeleccionado.inversion)}</span>
                                    <button onClick={() => setPaqueteVIX('')} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/20 hover:bg-error/20 hover:text-white transition-all">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="bg-enterprise-950 px-4 py-2 flex justify-between items-center text-white/30 border-t border-white/5 shrink-0">
                <span className="text-[7px] font-black uppercase tracking-[0.3em] italic">Estatus de Arquitectura Consolidada</span>
                <span className="text-[7px] font-black uppercase tracking-[0.3em]">Revisión Requerida</span>
            </div>
        </div>
    );

    const summarySection = (
        <div className="bg-enterprise-950 rounded-[2rem] shadow-2xl p-6 text-white border border-white/10 relative overflow-hidden flex flex-col gap-6 group hover:border-brand-orange transition-all duration-700">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-magenta/5 blur-[50px] pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center group-hover:bg-brand-orange/20 transition-colors">
                        <PieChart size={16} className="text-brand-orange" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic leading-none">Valuación Final</h3>
                        <p className="text-[6px] font-black text-white/60 uppercase tracking-[0.2em] mt-1">Monitor de Disponibilidad de Despliegue</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="flex flex-col gap-1.5 pt-4 border-t border-white/5">
                    <span className="text-[7px] font-black text-white/80 uppercase tracking-[0.3em] italic">Asignación Aprobada</span>
                    <span className="text-xl font-black tracking-tighter text-white">{formatMXN(presupuestoNum)}</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-4 border-t border-white/5 text-right">
                    <span className="text-[7px] font-black text-white/80 uppercase tracking-[0.3em] italic">Exposición Actual</span>
                    <span className={`text-xl font-black tracking-tighter ${isOverBudget ? 'text-brand-orange pulse-neon' : 'text-emerald-400'}`}>
                        {formatMXN(subtotalActual)}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between relative z-10 pt-4 border-t border-white/5">
                <div className="flex gap-6">
                    <div className="flex flex-col">
                        <span className="text-[6px] font-black text-white/80 uppercase tracking-widest mb-1 italic">Activos Lineales</span>
                        <span className="text-[10px] font-black text-white/90 italic tracking-tighter">{formatMXN(subtotalTVActual)}</span>
                    </div>
                    {subtotalVIXActual > 0 && (
                        <div className="flex flex-col">
                            <span className="text-[6px] font-black text-brand-orange/80 uppercase tracking-widest mb-1 italic">Peso Digital</span>
                            <span className="text-[10px] font-black text-brand-orange/90 italic tracking-tighter">{formatMXN(subtotalVIXActual)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${isOverBudget ? 'border-brand-orange/30 bg-brand-orange/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isOverBudget ? 'bg-brand-orange animate-pulse' : 'bg-emerald-500'}`} />
                        <span className={`text-[7px] font-black uppercase tracking-widest ${isOverBudget ? 'text-brand-orange' : 'text-emerald-500'}`}>
                            {isOverBudget ? 'LÍMITE EXCEDIDO' : 'OPTIMIZADO'}
                        </span>
                    </div>

                    <button
                        onClick={generarCotizacion}
                        className="h-11 px-8 bg-white text-enterprise-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-3 shadow-2xl hover:bg-brand-orange hover:text-white transition-all duration-300 group/btn active:scale-95 italic"
                    >
                        <FileText size={14} strokeWidth={3} />
                        Desplegar Plan
                        <ArrowRight size={14} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );

    if (onlyItems) return itemsSection;
    if (onlySummary) return summarySection;

    return (
        <div className="flex flex-col gap-6 animate-premium-fade w-full">
            {itemsSection}
            {summarySection}
        </div>
    );
};

export default SelectedProducts;
