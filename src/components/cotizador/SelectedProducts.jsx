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
        <div className="bg-white rounded-2xl shadow-premium border border-enterprise-100 overflow-hidden flex flex-col w-full h-[450px]">
            <div className="bg-enterprise-950 px-3 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Layers size={12} className="text-brand-orange" />
                    <h2 className="text-white text-[9px] font-black uppercase tracking-widest italic leading-none">Plan Architecture</h2>
                </div>
                <span className="text-[7px] font-black text-white/70 uppercase tracking-widest">
                    {productosSeleccionados.length + (vixSeleccionado ? 1 : 0)} Consolidated
                </span>
            </div>

            <div className="overflow-y-auto custom-scrollbar space-y-1 bg-enterprise-50/30 flex-1 p-2">
                {productosSeleccionados.length === 0 && !vixSeleccionado ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <Layers size={16} className="text-enterprise-300 mb-1" />
                        <p className="text-[7px] font-black uppercase tracking-widest leading-none">Empty Plan</p>
                    </div>
                ) : (
                    <>
                        {productosSeleccionados.map(ps => {
                            const producto = productos.find(p => p.id === ps.id);
                            if (!producto) return null;
                            const precioUnitario = calcularPrecioUnitario(ps.id, clienteSeleccionado);

                            return (
                                <div key={ps.id} className="group flex items-center gap-2 p-2 bg-white border border-enterprise-200 rounded-lg shadow-sm">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 mb-0.5 text-[6px] font-black uppercase">
                                            <span className="text-brand-orange">{producto.canal}</span>
                                            <span className="text-enterprise-600 truncate">{producto.plaza}</span>
                                        </div>
                                        <h4 className="text-[9px] font-black text-enterprise-950 uppercase truncate leading-none mb-0.5">
                                            {producto.tipo} <span className="text-enterprise-600 font-bold ml-1 text-[7px]">{producto.duracion}</span>
                                        </h4>
                                        <div className="text-[6px] font-black text-enterprise-700 uppercase tracking-widest">
                                            <span>{formatMXN(precioUnitario)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center bg-enterprise-50 p-0.5 rounded-md border border-enterprise-200">
                                            <button
                                                onClick={() => actualizarCantidad(ps.id, ps.cantidad - 1)}
                                                className="w-4 h-4 flex items-center justify-center text-enterprise-600 hover:text-brand-orange"
                                            >
                                                <Minus size={8} strokeWidth={4} />
                                            </button>
                                            <input
                                                type="number"
                                                value={ps.cantidad}
                                                onChange={(e) => actualizarCantidad(ps.id, e.target.value)}
                                                className="w-5 bg-transparent text-center font-black text-[8px] text-enterprise-950 outline-none"
                                            />
                                            <button
                                                onClick={() => actualizarCantidad(ps.id, ps.cantidad + 1)}
                                                className="w-4 h-4 flex items-center justify-center text-enterprise-600 hover:text-brand-orange"
                                            >
                                                <Plus size={8} strokeWidth={4} />
                                            </button>
                                        </div>

                                        <div className="text-right min-w-[50px]">
                                            <span className="text-[9px] font-black text-enterprise-950 tracking-tighter block italic leading-none">
                                                {formatMXN(precioUnitario * ps.cantidad)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => eliminarProducto(ps.id)}
                                            className="w-6 h-6 rounded flex items-center justify-center text-enterprise-400 hover:text-error transition-all"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {vixSeleccionado && (
                            <div className="p-2 bg-enterprise-950 rounded-lg flex items-center justify-between border border-white/20">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center shrink-0">
                                        <span className="text-brand-orange font-black text-[8px] italic leading-none">VIX</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[8px] font-black text-white uppercase truncate leading-none">
                                            {vixSeleccionado.nombre}
                                        </h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-white tracking-tighter">{formatMXN(vixSeleccionado.inversion)}</span>
                                    <button onClick={() => setPaqueteVIX('')} className="text-white/40 hover:text-error transition-all px-1">
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    const summarySection = (
        <div className="bg-enterprise-950 rounded-2xl shadow-premium p-5 text-white border border-white/10 relative overflow-hidden flex flex-col gap-4">
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <PieChart size={12} className="text-brand-orange" />
                    <h3 className="text-[8px] font-black text-white uppercase tracking-widest italic leading-none">Final Valuation</h3>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10 border-b border-white/5 pb-4">
                <div className="flex flex-col">
                    <span className="text-[6px] font-black text-white/60 uppercase tracking-widest mb-0.5">Approved</span>
                    <span className="text-[10px] font-black tracking-widest">{formatMXN(presupuestoNum)}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[6px] font-black text-white/60 uppercase tracking-widest mb-0.5">Execution Total</span>
                    <span className={`text-[10px] font-black tracking-widest ${isOverBudget ? 'text-brand-orange animate-pulse' : 'text-emerald-400'}`}>
                        {formatMXN(subtotalActual)}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between relative z-10">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="text-[6px] font-black text-white/40 uppercase mb-0.5 tracking-widest">Linear TV Assets</span>
                        <span className="text-[8px] font-black text-white/90">{formatMXN(subtotalTVActual)}</span>
                    </div>
                    {subtotalVIXActual > 0 && (
                        <div className="flex flex-col">
                            <span className="text-[6px] font-black text-brand-orange/40 uppercase mb-0.5 tracking-widest">Digital Impact</span>
                            <span className="text-[8px] font-black text-brand-orange/90">{formatMXN(subtotalVIXActual)}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={generarCotizacion}
                    className="h-9 px-6 bg-white text-enterprise-950 rounded-lg font-black uppercase tracking-widest text-[8px] flex items-center justify-center gap-2 shadow-xl hover:bg-brand-orange hover:text-white transition-all group/btn"
                >
                    <FileText size={12} />
                    Deploy Plan
                    <ArrowRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="flex items-start gap-1.5 opacity-40">
                <Info size={8} className="text-white/70 shrink-0" />
                <p className="text-[5px] font-black text-white/70 uppercase tracking-widest leading-none">
                    Inventory Audit Required.
                </p>
            </div>
        </div>
    );

    if (onlyItems) return itemsSection;
    if (onlySummary) return summarySection;

    return (
        <div className="flex flex-col gap-4 animate-premium-fade w-full">
            {itemsSection}
            {summarySection}
        </div>
    );
};

export default SelectedProducts;
