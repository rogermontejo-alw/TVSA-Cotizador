import React, { useMemo, useState } from 'react';
import { Search, Plus, MapPin, Tv, Info, Activity, Layers, Tag, ChevronRight, Zap } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ProductGrid = ({
    productos = [],
    productosSeleccionados = [],
    plazaSeleccionada = '',
    clienteSeleccionado = null,
    calcularPrecioUnitario,
    agregarProducto
}) => {
    const [busqueda, setBusqueda] = useState('');

    const productosFiltrados = useMemo(() => {
        return productos.filter(p =>
            p.disponible &&
            !productosSeleccionados.some(ps => ps.id === p.id) &&
            (plazaSeleccionada === '' || p.plaza === plazaSeleccionada) &&
            (
                p.canal.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.horario.toLowerCase().includes(busqueda.toLowerCase())
            )
        );
    }, [productos, busqueda, productosSeleccionados, plazaSeleccionada]);

    return (
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-enterprise-100 flex flex-col h-full overflow-hidden animate-premium-fade">
            {/* Header Control Module */}
            <div className="bg-enterprise-950 p-6 sm:p-8 space-y-4 sm:space-y-6 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-orange opacity-10 blur-[100px] -mr-32 -mb-32" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 relative z-10">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white leading-none uppercase tracking-tight">
                            Inventory <span className="text-brand-orange italic not-italic">Multiplex</span>
                        </h2>
                        <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-orange/20 rounded-full text-[9px] sm:text-[10px] font-black text-brand-orange uppercase tracking-widest border border-brand-orange/10">
                                <Zap size={12} className="fill-brand-orange" /> Live Feed
                            </div>
                            <p className="text-[9px] sm:text-[10px] font-black text-white/50 uppercase tracking-widest">
                                Asset Allocation 2025
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-80 group">
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar Canal, Medio, Horario..."
                            className="w-full h-12 sm:h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 font-bold text-white text-xs sm:text-sm focus:border-brand-orange focus:bg-white/10 outline-none transition-all placeholder:text-white/20"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-orange transition-colors" size={18} />
                    </div>
                </div>
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-enterprise-50/50" style={{ maxHeight: 'calc(100vh - 420px)', minHeight: '400px' }}>
                {productosFiltrados.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-3xl border border-dashed border-enterprise-200">
                        <div className="w-20 h-20 bg-enterprise-50 rounded-full flex items-center justify-center text-enterprise-200 mb-6 border border-enterprise-100">
                            <Layers size={40} />
                        </div>
                        <h3 className="text-xl font-black text-enterprise-900 uppercase">Filtros Restrictivos</h3>
                        <p className="text-xs text-enterprise-400 font-bold uppercase tracking-widest mt-2 max-w-[280px] leading-relaxed">
                            No hay activos disponibles que coincidan con la plaza <span className="text-brand-orange">{plazaSeleccionada || 'NACIONAL'}</span>.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {productosFiltrados.map(p => {
                            const precio = clienteSeleccionado ? calcularPrecioUnitario(p.id, clienteSeleccionado) : p.costoBase;

                            return (
                                <div
                                    key={p.id}
                                    className="group relative bg-white border border-enterprise-100 rounded-[1.5rem] p-4 sm:p-6 transition-all duration-500 hover:shadow-premium-hover hover:border-brand-orange/30 hover:-translate-y-1"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
                                        <div className="flex-1 space-y-3 sm:space-y-4">
                                            {/* Top Metadata */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="flex bg-enterprise-950 rounded-[0.5rem] px-2.5 py-1 items-center gap-2">
                                                    <Tv size={12} className="text-brand-orange" />
                                                    <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest leading-none">{p.canal}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-enterprise-50 rounded-[0.5rem] text-[9px] font-black text-enterprise-600 uppercase tracking-widest border border-enterprise-100">
                                                    <Tag size={10} /> {p.tipo}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-enterprise-300 uppercase tracking-[0.2em]">
                                                    <MapPin size={12} /> {p.plaza}
                                                </div>
                                            </div>

                                            {/* Identity Row */}
                                            <div className="min-w-0">
                                                <h3 className="text-base sm:text-lg font-black text-enterprise-950 uppercase tracking-tight mb-0.5 truncate leading-tight">
                                                    {p.horario}
                                                </h3>
                                                <p className="text-[8px] sm:text-[9px] font-bold text-enterprise-500 uppercase tracking-widest opacity-60">
                                                    {p.categoria || 'Strategic Media Asset'}
                                                </p>
                                            </div>

                                            {/* Pricing Row */}
                                            <div className="flex items-center gap-4 sm:gap-8">
                                                {clienteSeleccionado ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] sm:text-[9px] font-black text-brand-orange uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-brand-orange" /> Commercial Fee Active
                                                        </span>
                                                        <span className="text-base sm:text-xl font-black text-enterprise-900 tracking-tighter italic whitespace-nowrap">
                                                            {formatMXN(precio)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2.5 bg-enterprise-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-enterprise-500 border border-enterprise-100">
                                                        <Info size={14} />
                                                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">ID Partner to Value</span>
                                                    </div>
                                                )}
                                                <div className="h-8 sm:h-10 w-px bg-enterprise-100 hidden md:block" />
                                                <div className="hidden md:flex flex-col">
                                                    <span className="text-[8px] sm:text-[9px] font-black text-enterprise-400 uppercase tracking-widest mb-1">Availability</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
                                                        <span className="text-[9px] sm:text-[10px] font-black text-enterprise-700 uppercase">In-Pipeline</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Area */}
                                        <button
                                            onClick={() => agregarProducto(p.id)}
                                            disabled={!clienteSeleccionado}
                                            className="w-14 h-14 sm:w-16 sm:h-16 bg-enterprise-950 text-white rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-center hover:bg-brand-orange hover:shadow-brand-orange/30 hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-10 shadow-xl relative overflow-hidden group/btn flex-shrink-0"
                                        >
                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                            <Plus size={24} strokeWidth={3} className="relative z-10" />
                                        </button>
                                    </div>

                                    {/* Hover Decorator */}
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none translate-x-10 group-hover:translate-x-0 hidden lg:block">
                                        <ChevronRight size={48} className="text-brand-orange/20 rotate-[-15deg]" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Performance Footer */}
            <div className="bg-enterprise-950 px-8 py-6 flex justify-between items-center text-white/40 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] relative z-10">
                    Sincronización: <span className="text-white">Master Inventory TU</span>
                </p>
                <div className="flex items-center gap-5 text-[10px] font-black uppercase tracking-widest relative z-10">
                    <span className="bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded-md">{productosFiltrados.length}</span> Activos Disponibles
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;
