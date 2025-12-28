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

    const activeClient = clientes.find(c => c.id === clienteSel);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header / Selector */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="w-full lg:w-1/2">
                        <label className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] block mb-3">1. Seleccionar Cliente para Cotizar en Vivo</label>
                        <select
                            value={clienteSel}
                            onChange={(e) => setClienteSel(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500 font-bold text-gray-800 outline-none appearance-none"
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre_empresa}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full lg:w-1/2">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] block mb-3">2. Buscar Producto de Pauta</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Filtrar por canal o programa..."
                                className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500 font-bold text-gray-800 outline-none"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {clienteSel ? (
                <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">{activeClient?.nombre_empresa}</h2>
                                <p className="text-red-500 font-bold text-[9px] uppercase tracking-widest">{activeClient?.segmento} | {activeClient?.plaza}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => alert('Próximamente: Lista en PDF')}
                            className="w-full md:w-auto px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-slate-900 transition-all"
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
                                <div key={p.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-100 hover:border-red-200 transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.canal}</span>
                                            <h4 className="text-lg font-black text-slate-900 leading-tight tracking-tight group-hover:text-red-600 transition-colors">
                                                {p.tipo}
                                            </h4>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="flex items-center gap-1 text-[8px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded uppercase">
                                                <MapPin size={10} /> {p.plaza}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl mb-4 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Precio Lista</span>
                                            <span className="text-[10px] font-bold text-gray-500 line-through">{formatMXN(p.costo_base)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">
                                                <Tag size={10} className="text-red-500" /> Tarifa Neta
                                            </span>
                                            <span className="text-lg font-black text-red-600">{formatMXN(precioCliente)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                            {p.horario} | {p.duracion}
                                        </div>
                                        {ahorro > 0 && (
                                            <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase tracking-tighter">
                                                <ArrowUpRight size={14} /> Ahorro {porcentajeAhorro.toFixed(0)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <Search className="mx-auto text-gray-100 mb-4" size={64} />
                    <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Selecciona un cliente para visualizar su tarifario personalizado</p>
                </div>
            )}
        </div>
    );
};

export default PriceListView;
