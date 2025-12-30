import React, { useMemo, useState } from 'react';
import { Search, Plus, Tv, Layers, Zap } from 'lucide-react';
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
    const [filtroCanal, setFiltroCanal] = useState('');
    const [filtroHorario, setFiltroHorario] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');

    const options = useMemo(() => {
        const available = productos.filter(p => !productosSeleccionados.some(ps => ps.id === p.id) && (plazaSeleccionada === '' || p.plaza === plazaSeleccionada));
        return {
            canales: [...new Set(available.map(p => p.canal))].sort(),
            horarios: [...new Set(available.map(p => p.horario))].sort(),
            tipos: [...new Set(available.map(p => p.tipo))].sort()
        };
    }, [productos, productosSeleccionados, plazaSeleccionada]);

    const productosFiltrados = useMemo(() => {
        return productos.filter(p =>
            p.disponible &&
            !productosSeleccionados.some(ps => ps.id === p.id) &&
            (plazaSeleccionada === '' || p.plaza === plazaSeleccionada) &&
            (filtroCanal === '' || p.canal === filtroCanal) &&
            (filtroHorario === '' || p.horario === filtroHorario) &&
            (filtroTipo === '' || p.tipo === filtroTipo) &&
            (
                p.canal.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.horario.toLowerCase().includes(busqueda.toLowerCase())
            )
        );
    }, [productos, busqueda, productosSeleccionados, plazaSeleccionada, filtroCanal, filtroHorario, filtroTipo]);

    return (
        <div className="bg-white rounded-2xl shadow-premium border border-enterprise-100 flex flex-col overflow-hidden animate-premium-fade w-full h-[450px]">
            {/* Header / Search Area */}
            <div className="bg-enterprise-950 p-3 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[10px] font-black text-white italic tracking-widest uppercase leading-none">Inventory <span className="text-brand-orange">Multiplex</span></h2>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Zap size={7} className="fill-brand-orange text-brand-orange" />
                            <span className="text-[6px] font-black text-white/70 uppercase tracking-[0.2em]">Strategic 2025</span>
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-white/70">{productosFiltrados.length}</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                    <select
                        value={filtroCanal}
                        onChange={(e) => setFiltroCanal(e.target.value)}
                        className="h-7 bg-white/10 border border-white/20 rounded px-2 font-black text-white text-[8px] appearance-none outline-none"
                    >
                        <option value="" className="bg-enterprise-900">CHNL</option>
                        {options.canales.map(c => <option key={c} value={c} className="bg-enterprise-900">{c.toUpperCase()}</option>)}
                    </select>
                    <select
                        value={filtroHorario}
                        onChange={(e) => setFiltroHorario(e.target.value)}
                        className="h-7 bg-white/10 border border-white/20 rounded px-2 font-black text-white text-[8px] appearance-none outline-none"
                    >
                        <option value="" className="bg-enterprise-900">TIME</option>
                        {options.horarios.map(h => <option key={h} value={h} className="bg-enterprise-900">{h.toUpperCase()}</option>)}
                    </select>
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="h-7 bg-white/10 border border-white/20 rounded px-2 font-black text-white text-[8px] appearance-none outline-none"
                    >
                        <option value="" className="bg-enterprise-900">TYPE</option>
                        {options.tipos.map(t => <option key={t} value={t} className="bg-enterprise-900">{t.toUpperCase()}</option>)}
                    </select>
                    <div className="relative">
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="SEARCH..."
                            className="w-full h-7 bg-white/10 border border-white/20 rounded pl-7 pr-2 font-black text-white text-[8px] outline-none placeholder:text-white/40"
                        />
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50" size={9} />
                    </div>
                </div>
            </div>

            {/* Catalog Grid - Flex Grow */}
            <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar bg-enterprise-50/30 flex-1">
                {productosFiltrados.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <Layers size={16} className="text-enterprise-200 mb-1" />
                        <p className="text-[7px] font-black text-enterprise-900 uppercase">No Data</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-1">
                        {productosFiltrados.map(p => {
                            const precio = clienteSeleccionado ? calcularPrecioUnitario(p.id, clienteSeleccionado) : p.costoBase;

                            return (
                                <div
                                    key={p.id}
                                    className="group bg-white border border-enterprise-200 rounded-lg p-2 flex items-center justify-between gap-2 transition-all hover:border-brand-orange/30 shadow-sm"
                                >
                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                        <div className="w-7 h-7 bg-enterprise-900 rounded-md flex flex-col items-center justify-center text-white shrink-0 group-hover:bg-brand-orange">
                                            <Tv size={10} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <span className="text-[6px] font-black text-brand-orange uppercase">{p.canal}</span>
                                                <span className="text-[6px] text-enterprise-600 font-bold uppercase truncate">{p.plaza}</span>
                                            </div>
                                            <h4 className="text-[9px] font-black text-enterprise-950 uppercase italic leading-none truncate">
                                                {p.tipo} <span className="text-enterprise-500 not-italic font-bold text-[7px] ml-1">{p.duracion}</span>
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-enterprise-950 tracking-tighter italic block leading-none">
                                                {formatMXN(precio)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => agregarProducto(p.id)}
                                            disabled={!clienteSeleccionado}
                                            className="w-7 h-7 bg-enterprise-950 text-white rounded-md flex items-center justify-center hover:bg-brand-orange transition-all disabled:opacity-5"
                                        >
                                            <Plus size={12} strokeWidth={4} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Performance Footer */}
            <div className="bg-enterprise-950 px-3 py-1.5 flex justify-between items-center text-white/60 border-t border-white/5 shrink-0">
                <span className="text-[6px] font-black uppercase tracking-widest italic">Live Status</span>
                <span className="text-[6px] font-black uppercase tracking-widest">Master 2025</span>
            </div>
        </div>
    );
};

export default ProductGrid;
