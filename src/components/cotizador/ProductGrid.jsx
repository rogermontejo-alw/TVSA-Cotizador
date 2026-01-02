import React, { useMemo, useState } from 'react';
import { Plus, Tv, Layers, Zap, MapPin, ChevronDown } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ProductGrid = ({
    productos = [],
    productosSeleccionados = [],
    plazaSeleccionada = '',
    setPlazaSeleccionada, // Prop to update global plaza if needed
    clienteSeleccionado = null,
    calcularPrecioUnitario,
    agregarProducto
}) => {
    const [filtroCanal, setFiltroCanal] = useState('');
    const [filtroHorario, setFiltroHorario] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');

    const options = useMemo(() => {
        // available for listing filters
        const available = productos.filter(p => !productosSeleccionados.some(ps => ps.id === p.id));
        return {
            plazas: [...new Set(available.map(p => p.plaza))].sort(),
            canales: [...new Set(available.map(p => p.canal))].sort(),
            horarios: [...new Set(available.map(p => p.horario))].sort(),
            tipos: [...new Set(available.map(p => p.tipo))].sort()
        };
    }, [productos, productosSeleccionados]);

    const productosFiltrados = useMemo(() => {
        return productos.filter(p =>
            p.disponible &&
            !productosSeleccionados.some(ps => ps.id === p.id) &&
            (plazaSeleccionada === '' || p.plaza === plazaSeleccionada) &&
            (filtroCanal === '' || p.canal === filtroCanal) &&
            (filtroHorario === '' || p.horario === filtroHorario) &&
            (filtroTipo === '' || p.tipo === filtroTipo)
        );
    }, [productos, productosSeleccionados, plazaSeleccionada, filtroCanal, filtroHorario, filtroTipo]);

    return (
        <div className="bg-white rounded-[2rem] shadow-premium border border-enterprise-100 flex flex-col overflow-hidden animate-premium-fade w-full h-[520px]">
            {/* Header / Filter Area */}
            <div className="bg-enterprise-950 p-5 space-y-4 shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl -mr-16 -mt-16" />

                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h2 className="text-[11px] font-black text-white italic tracking-widest uppercase leading-none">
                            Inventario <span className="text-brand-orange">Multiplex</span>
                        </h2>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <Zap size={9} className="fill-brand-orange text-brand-orange" strokeWidth={3} />
                            <span className="text-[7px] font-black text-white/50 uppercase tracking-[0.3em]">Consola de Ciclo de Vida v2.5</span>
                        </div>
                    </div>
                    <div className="bg-white/10 px-2 py-1 rounded-lg border border-white/10">
                        <span className="text-[9px] font-black text-brand-orange tracking-tighter">{productosFiltrados.length} <span className="text-white/40 ml-0.5">DISP</span></span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 relative z-10">
                    {/* PLAZA FILTER */}
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange">
                            <MapPin size={10} />
                        </div>
                        <select
                            value={plazaSeleccionada}
                            onChange={(e) => setPlazaSeleccionada(e.target.value)}
                            className="w-full h-9 bg-white/5 border border-white/10 rounded-xl pl-8 pr-2 font-black text-white text-[9px] appearance-none outline-none focus:border-brand-orange/50 transition-all uppercase"
                        >
                            <option value="" className="bg-enterprise-950">TODAS LAS PLAZAS</option>
                            {options.plazas.map(p => <option key={p} value={p} className="bg-enterprise-950">{p.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-hover:text-brand-orange transition-colors" />
                    </div>

                    <div className="relative group">
                        <select
                            value={filtroCanal}
                            onChange={(e) => setFiltroCanal(e.target.value)}
                            className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-4 font-black text-white text-[9px] appearance-none outline-none focus:border-brand-orange/50 transition-all uppercase"
                        >
                            <option value="" className="bg-enterprise-950">CANAL</option>
                            {options.canales.map(c => <option key={c} value={c} className="bg-enterprise-950">{c.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-hover:text-brand-orange transition-colors" />
                    </div>

                    <div className="relative group">
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-4 font-black text-white text-[9px] appearance-none outline-none focus:border-brand-orange/50 transition-all uppercase"
                        >
                            <option value="" className="bg-enterprise-950">TIPO</option>
                            {options.tipos.map(t => <option key={t} value={t} className="bg-enterprise-950">{t.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-hover:text-brand-orange transition-colors" />
                    </div>

                    <div className="relative group">
                        <select
                            value={filtroHorario}
                            onChange={(e) => setFiltroHorario(e.target.value)}
                            className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-4 font-black text-white text-[9px] appearance-none outline-none focus:border-brand-orange/50 transition-all uppercase"
                        >
                            <option value="" className="bg-enterprise-950">HORARIO</option>
                            {options.horarios.map(h => <option key={h} value={h} className="bg-enterprise-950">{h.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-hover:text-brand-orange transition-colors" />
                    </div>
                </div>
            </div>

            {/* Catalog Grid */}
            <div className="overflow-y-auto p-3 space-y-2 custom-scrollbar bg-enterprise-50/20 flex-1">
                {productosFiltrados.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                        <Layers size={24} className="text-enterprise-950 mb-2" />
                        <p className="text-[8px] font-black text-enterprise-950 uppercase tracking-widest">No se encontraron señales</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-1.5">
                        {productosFiltrados.map(p => {
                            const precio = clienteSeleccionado ? calcularPrecioUnitario(p.id, clienteSeleccionado) : p.costoBase;

                            return (
                                <div
                                    key={p.id}
                                    className="group bg-white border border-enterprise-100 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all hover:border-brand-orange hover:shadow-lg hover:shadow-brand-orange/5"
                                >
                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <div className="w-9 h-9 bg-enterprise-950 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:bg-brand-orange transition-colors shadow-inner">
                                            <Tv size={16} strokeWidth={2.5} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[7.5px] font-black text-brand-orange uppercase italic">{p.canal}</span>
                                                <span className="w-1 h-1 bg-enterprise-200 rounded-full" />
                                                <span className="text-[7.5px] text-enterprise-400 font-bold uppercase truncate tracking-wider">{p.plaza}</span>
                                                {p.horario && (
                                                    <>
                                                        <span className="w-1 h-1 bg-enterprise-200 rounded-full" />
                                                        <span className="text-[7.5px] text-brand-orange/70 font-black uppercase truncate tracking-wider">
                                                            {p.horario}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <h4 className="text-[10px] font-black text-enterprise-950 uppercase italic leading-none truncate group-hover:text-brand-orange transition-colors">
                                                {p.tipo} <span className="text-enterprise-300 not-italic font-bold text-[8px] ml-1">[{p.duracion}]</span>
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <p className="text-[11px] font-black text-enterprise-950 tracking-tighter italic block leading-none">
                                                {formatMXN(precio)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => agregarProducto(p.id)}
                                            disabled={!clienteSeleccionado}
                                            className="w-10 h-10 bg-enterprise-50 text-enterprise-950 rounded-xl flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all disabled:opacity-5 shadow-sm active:scale-90"
                                        >
                                            <Plus size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-enterprise-950 px-4 py-2 flex justify-between items-center text-white/30 border-t border-white/5 shrink-0">
                <span className="text-[7px] font-black uppercase tracking-[0.3em] italic">Señales de Telecast Activas</span>
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[7px] font-black uppercase tracking-[0.3em]">Sincronizado</span>
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;
