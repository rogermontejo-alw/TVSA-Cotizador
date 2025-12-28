import React from 'react';
import { X, Plus, Minus, FileText, Trash2, DollarSign, PieChart, Layers, ShieldCheck, Zap, AlertTriangle, ArrowRight } from 'lucide-react';
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
    calcularPrecioUnitario
}) => {
    const vixSeleccionado = paquetesVIX.find(p => p.id === paqueteVIX);
    const presupuestoNum = presupuesto ? parseFloat(presupuesto) : 0;
    const saldoDisponible = presupuestoNum - subtotalActual;
    const isOverBudget = saldoDisponible < 0;

    if (productosSeleccionados.length === 0 && !paqueteVIX) return null;

    return (
        <div className="space-y-8 animate-premium-fade">
            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Visual Inventory / Cart */}
                <div className="flex-1 w-full bg-white rounded-[2.5rem] shadow-premium border border-enterprise-100 overflow-hidden">
                    <div className="bg-enterprise-950 px-8 py-6 flex items-center justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red opacity-10 blur-2xl -mr-16 -mt-16" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center text-brand-red">
                                <Layers size={22} />
                            </div>
                            <div>
                                <h2 className="text-white text-lg font-black uppercase tracking-tight">Arquitectura del Plan</h2>
                                <p className="text-[9px] font-black text-brand-red uppercase tracking-[0.3em]">Commercial Deployment</p>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full relative z-10">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                {productosSeleccionados.length + (vixSeleccionado ? 1 : 0)} Activos Consolidados
                            </span>
                        </div>
                    </div>

                    <div className="p-6 max-h-[700px] overflow-y-auto custom-scrollbar space-y-4 bg-enterprise-50/30">
                        {/* TV Items */}
                        {productosSeleccionados.map(ps => {
                            const producto = productos.find(p => p.id === ps.id);
                            if (!producto) return null;
                            const precioUnitario = calcularPrecioUnitario(ps.id, clienteSeleccionado);

                            return (
                                <div key={ps.id} className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 bg-white hover:shadow-premium border border-enterprise-100 rounded-[1.5rem] transition-all duration-500 hover:-translate-y-0.5">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[9px] font-black bg-enterprise-950 text-white px-2 py-0.5 rounded-lg uppercase tracking-widest">{producto.canal}</span>
                                            <div className="h-3 w-[1px] bg-enterprise-200" />
                                            <span className="text-[9px] font-black text-brand-red uppercase tracking-[0.2em] flex items-center gap-1">
                                                <Zap size={10} className="fill-brand-red" /> {producto.plaza}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-black text-enterprise-950 uppercase truncate mb-0.5">
                                            {producto.horario}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-enterprise-400 uppercase tracking-[0.1em]">
                                            <span className="px-1.5 py-0.5 bg-enterprise-100 rounded-md text-enterprise-600 font-black">{producto.tipo}</span>
                                            <span className="w-1 h-1 bg-enterprise-200 rounded-full" />
                                            <span className="text-enterprise-400">Unit: <span className="text-enterprise-900 font-black">{formatMXN(precioUnitario)}</span></span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 pt-3 sm:pt-0 border-t sm:border-t-0 border-enterprise-50">
                                        <div className="flex flex-col items-center sm:items-end">
                                            <span className="text-[8px] font-black text-enterprise-400 uppercase tracking-[0.2em] mb-1.5">Inserciones</span>
                                            <div className="flex items-center bg-enterprise-50 p-1 rounded-xl border border-enterprise-200 shadow-inner group-hover:bg-white transition-colors duration-500">
                                                <button
                                                    onClick={() => actualizarCantidad(ps.id, ps.cantidad - 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-enterprise-400 hover:text-brand-red hover:bg-white rounded-lg transition-all"
                                                >
                                                    <Minus size={14} strokeWidth={3} />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={ps.cantidad}
                                                    onChange={(e) => actualizarCantidad(ps.id, e.target.value)}
                                                    className="w-10 bg-transparent text-center font-black text-sm text-enterprise-900 outline-none"
                                                />
                                                <button
                                                    onClick={() => actualizarCantidad(ps.id, ps.cantidad + 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-enterprise-400 hover:text-brand-red hover:bg-white rounded-lg transition-all"
                                                >
                                                    <Plus size={14} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end min-w-[100px]">
                                            <span className="text-[8px] font-black text-enterprise-300 uppercase tracking-[0.2em] mb-1">Total Línea</span>
                                            <span className="text-base font-black text-enterprise-950 tracking-tighter italic">
                                                {formatMXN(precioUnitario * ps.cantidad)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => eliminarProducto(ps.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-enterprise-200 hover:text-white hover:bg-error transition-all duration-300 transform hover:rotate-90"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* VIX Digital Item */}
                        {vixSeleccionado && (
                            <div className="p-6 bg-enterprise-950 rounded-[2rem] flex items-center justify-between border border-white/5 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 blur-3xl opacity-50" />
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="w-14 h-14 bg-white rounded-[1.25rem] flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                                        <span className="text-brand-red font-black text-lg italic tracking-tight">ViX</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Digital Asset</span>
                                            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        </div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight">
                                            {vixSeleccionado.nombre}
                                        </h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 text-right relative z-10">
                                    <div>
                                        <span className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Fee Inversión</span>
                                        <span className="text-xl font-black text-white">{formatMXN(vixSeleccionado.inversion)}</span>
                                    </div>
                                    <button
                                        onClick={() => setPaqueteVIX('')}
                                        className="w-12 h-12 rounded-[1rem] flex items-center justify-center bg-white/10 text-white hover:bg-white hover:text-brand-red transition-all duration-300"
                                    >
                                        <Trash2 size={22} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vertical Summary Panel */}
                <div className="w-full lg:w-96 space-y-5">
                    <div className="bg-enterprise-950 rounded-[2.5rem] shadow-2xl p-8 text-white border border-white/5 relative overflow-hidden group/summary">
                        {/* Abstract Decorative Background */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-red/10 blur-[100px] rounded-full group-hover/summary:bg-brand-red/20 transition-all duration-1000" />

                        <div className="flex items-center gap-4 mb-10 relative z-10">
                            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-red">
                                <PieChart size={24} />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Valuación</h3>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Consolidado Estratégico</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Ppt. Autorizado</span>
                                    <span className="text-2xl font-black tracking-tighter mt-1">{formatMXN(presupuestoNum)}</span>
                                </div>
                                <ShieldCheck size={20} className="text-success mb-2 opacity-40" />
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex justify-between items-center group/item">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] group-hover/item:text-white/60 transition-colors">Asset TV TU</span>
                                    <span className="text-base font-black text-white/90">-{formatMXN(subtotalTVActual)}</span>
                                </div>
                                {subtotalVIXActual > 0 && (
                                    <div className="flex justify-between items-center group/item">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] group-hover/item:text-brand-red transition-colors">Impacto Digital</span>
                                        <span className="text-base font-black text-brand-red">-{formatMXN(subtotalVIXActual)}</span>
                                    </div>
                                )}
                            </div>

                            <div className={`mt-8 p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden relative ${isOverBudget
                                ? 'bg-error-light border-error/20'
                                : 'bg-white/5 border-white/10'}`}>

                                {isOverBudget && (
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <AlertTriangle size={64} className="text-error rotate-12" />
                                    </div>
                                )}

                                <div className="relative z-10">
                                    <span className="block text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Remanente Disponible</span>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-3xl font-black tracking-tighter ${isOverBudget ? 'text-error animate-pulse' : 'text-success'}`}>
                                            {formatMXN(saldoDisponible)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={generarCotizacion}
                            className="w-full h-18 bg-univision-gradient text-white rounded-[2rem] mt-10 font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 shadow-2xl shadow-brand-red/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 relative overflow-hidden group/final"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/final:translate-y-0 transition-transform duration-500" />
                            <FileText size={22} className="relative z-10" />
                            <span className="relative z-10">Finalizar Orden</span>
                            <ArrowRight size={18} className="relative z-10 opacity-0 -translate-x-4 group-hover/final:opacity-100 group-hover/final:translate-x-0 transition-all duration-500" />
                        </button>
                    </div>

                    <div className="p-6 bg-enterprise-50 rounded-[2.5rem] border border-enterprise-100 flex items-start gap-4">
                        <Info size={16} className="text-enterprise-400 mt-1 shrink-0" />
                        <p className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest leading-relaxed opacity-60">
                            Sujeto a disponibilidad de inventario al momento del cierre. Validez de 24 horas hábiles.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectedProducts;
