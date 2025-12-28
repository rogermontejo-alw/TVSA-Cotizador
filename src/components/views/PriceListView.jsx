import React, { useState } from 'react';
import { Download, Search, MapPin, Building2, Tag, ArrowUpRight } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const PriceListView = ({ clientes, productos, calcularPrecioUnitario }) => {
    const [clienteSel, setClienteSel] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const productosFiltrados = productos.filter(p =>
        p.activo &&
        (p.canal.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.tipo.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const activeClient = clientes.find(c => String(c.id) === String(clienteSel));

    return (
        <div className="space-y-6 animate-premium-fade pb-20">
            {/* Header Lista de Precios */}
            <div className="bg-enterprise-950 p-6 rounded-2xl md:rounded-b-none flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 blur-[80px] -mr-32 -mt-32"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <Tag size={20} className="text-brand-orange" />
                    <h3 className="text-sm font-black text-white uppercase italic italic-brand flex items-center gap-3 tracking-widest">
                        Tarifario Institucional
                    </h3>
                </div>
            </div>

            {/* Header / Selector */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-enterprise-100 mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
                    <div className="w-full lg:w-1/2 space-y-2">
                        <label className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] block ml-1">1. Seleccionar Cliente</label>
                        <select
                            value={clienteSel}
                            onChange={(e) => setClienteSel(e.target.value)}
                            className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl focus:ring-1 focus:ring-brand-orange/20 font-bold text-sm text-enterprise-950 outline-none appearance-none truncate shadow-sm"
                        >
                            <option value="">Elegir empresa...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre_empresa}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full lg:w-1/2 space-y-2">
                        <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-[0.2em] block ml-1">2. Filtrar Portafolio</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Canal, programa o tipo de pauta..."
                                className="w-full p-4 pl-12 bg-enterprise-50 border border-enterprise-100 rounded-2xl focus:ring-1 focus:ring-brand-orange/20 font-bold text-sm text-enterprise-950 outline-none placeholder:text-enterprise-300 transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-enterprise-400 group-focus-within:text-brand-orange transition-colors" size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {clienteSel ? (
                <div className="space-y-6">
                    <div className="bg-enterprise-950 p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 blur-3xl"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 bg-brand-orange rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-orange/20">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase italic italic-brand tracking-tighter leading-tight">{activeClient?.nombre_empresa}</h2>
                                <p className="text-brand-orange font-black text-[10px] uppercase tracking-[0.3em] mt-1">{activeClient?.segmento} | {activeClient?.plaza}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => alert('Próximamente: Lista en PDF')}
                            className="w-full md:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-brand-orange transition-all shadow-xl"
                        >
                            <Download size={16} /> Descargar Tarifario
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {productosFiltrados.map(p => {
                            const precioCliente = calcularPrecioUnitario ? calcularPrecioUnitario(p.id, clienteSel) : p.costo_base;
                            const ahorro = (p.costo_base || 0) - (precioCliente || 0);
                            const porcentajeAhorro = ahorro > 0 ? (ahorro / p.costo_base) * 100 : 0;

                            return (
                                <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-enterprise-100 hover:border-brand-orange/30 transition-all duration-300 group relative overflow-hidden flex flex-col h-full hover:shadow-2xl">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest">{p.canal}</span>
                                            <h4 className="text-xl font-black text-enterprise-950 uppercase italic italic-brand leading-tight tracking-tighter group-hover:text-brand-orange transition-colors">
                                                {p.tipo}
                                            </h4>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="flex items-center gap-2 text-[9px] font-black text-enterprise-500 bg-enterprise-50 border border-enterprise-100 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                                <MapPin size={12} /> {p.plaza}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-enterprise-50 p-6 rounded-3xl mb-6 space-y-4 flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest">Precio Lista</span>
                                            <span className="text-xs font-bold text-enterprise-300 line-through">{formatMXN(p.costo_base)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-enterprise-100">
                                            <span className="text-[9px] font-black text-enterprise-950 uppercase tracking-widest flex items-center gap-2">
                                                <Tag size={12} className="text-brand-orange" /> Tarifa Neta
                                            </span>
                                            <span className="text-2xl font-black text-brand-orange tracking-tighter">{formatMXN(precioCliente)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest">
                                            {p.horario} | {p.duracion}
                                        </div>
                                        {ahorro > 0 && (
                                            <div className="flex items-center gap-1 text-emerald-600 font-black text-[11px] uppercase tracking-tighter bg-emerald-50 px-3 py-1 rounded-full shadow-sm">
                                                <ArrowUpRight size={14} /> -{porcentajeAhorro.toFixed(0)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-enterprise-100 animate-premium-fade shadow-sm">
                    <Search className="mx-auto text-enterprise-100 mb-8" size={80} />
                    <p className="text-enterprise-400 font-black uppercase text-[10px] tracking-[0.3em] max-w-md mx-auto leading-relaxed">
                        Selecciona un cliente para visualizar su portafolio de productos y tarifas institucionales personalizadas.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PriceListView;
