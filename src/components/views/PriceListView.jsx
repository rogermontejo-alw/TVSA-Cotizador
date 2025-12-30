import React, { useState } from 'react';
import { Download, Search, MapPin, Building2, Tag, ArrowUpRight } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const PriceListView = ({ clientes, productos, calcularPrecioUnitario }) => {
    const [clienteSel, setClienteSel] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const productosFiltrados = productos.filter(p =>
        p.disponible &&
        (p.canal.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.tipo.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const activeClient = clientes.find(c => String(c.id) === String(clienteSel));

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-premium-fade pb-20">
            {/* Navigation Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 bg-enterprise-950 p-6 rounded-3xl shadow-premium relative overflow-hidden flex items-center gap-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange opacity-10 blur-3xl" />
                    <div className="w-12 h-12 bg-brand-orange/20 rounded-2xl flex items-center justify-center text-brand-orange">
                        <Tag size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase italic tracking-tight italic-brand">Tarifario Corporativo</h3>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Consulta de activos y acuerdos comerciales</p>
                    </div>
                </div>
                <div className="md:col-span-4">
                    <button
                        onClick={() => alert('Generando exportación de tarifario...')}
                        className="w-full h-full bg-white border border-enterprise-100 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-enterprise-950 hover:border-brand-orange transition-all shadow-premium group"
                    >
                        <Download size={16} className="text-enterprise-300 group-hover:text-brand-orange" />
                        Export Pipeline (PDF)
                    </button>
                </div>
            </div>

            {/* Matrix Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-enterprise-100 shadow-premium flex flex-col justify-center">
                    <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest mb-2 ml-1">Account Visibility</span>
                    <select
                        value={clienteSel}
                        onChange={(e) => setClienteSel(e.target.value)}
                        className="w-full bg-enterprise-50 border border-enterprise-100 rounded-2xl px-4 py-3 text-xs font-black text-enterprise-950 outline-none focus:border-brand-orange transition-all"
                    >
                        <option value="">-- SELECT CLIENT PROFILE --</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_empresa.toUpperCase()}</option>)}
                    </select>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-enterprise-100 shadow-premium flex flex-col justify-center">
                    <span className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest mb-2 ml-1">Asset Filter</span>
                    <div className="relative group">
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="SEARCH BY CHANNEL OR ASSET TYPE..."
                            className="w-full bg-enterprise-50 border border-enterprise-100 rounded-2xl pl-10 pr-4 py-3 text-xs font-black text-enterprise-950 outline-none focus:border-brand-orange transition-all placeholder:text-enterprise-300"
                        />
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-enterprise-300 group-focus-within:text-brand-orange transition-colors" />
                    </div>
                </div>
            </div>

            {clienteSel ? (
                <div className="space-y-4">
                    {/* Identity Banner */}
                    <div className="bg-enterprise-50 border border-enterprise-100 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-brand-orange rounded-full" />
                            <div>
                                <h4 className="text-xs font-black text-enterprise-950 uppercase italic">{activeClient?.nombre_empresa}</h4>
                                <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-widest mt-0.5">{activeClient?.segmento} • {activeClient?.plaza} Region</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-enterprise-600 uppercase tracking-widest">Active Agreement</span>
                        </div>
                    </div>

                    {/* High Density Table View */}
                    <div className="bg-white rounded-3xl border border-enterprise-100 shadow-premium overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-enterprise-950">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest">Signal / Region</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest">Asset Details</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest text-center">Standard Valuation</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-brand-orange uppercase tracking-widest text-center bg-white/5">Strategic Net</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest text-center">Benefit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-enterprise-50">
                                    {productosFiltrados.map(p => {
                                        const precioCliente = calcularPrecioUnitario ? calcularPrecioUnitario(p.id, clienteSel) : p.costoBase;
                                        const ahorro = (p.costoBase || 0) - (precioCliente || 0);
                                        const porcentajeAhorro = ahorro > 0 ? (ahorro / p.costoBase) * 100 : 0;

                                        return (
                                            <tr key={p.id} className="hover:bg-enterprise-50 transition-all group">
                                                <td className="px-6 py-3">
                                                    <p className="text-[10px] font-black text-enterprise-900 uppercase italic leading-tight">{p.canal}</p>
                                                    <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-widest">{p.plaza}</p>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="text-[10px] font-black text-enterprise-700 uppercase">{p.tipo} <span className="text-[9px] text-enterprise-300 ml-1 font-medium">{p.duracion}</span></p>
                                                    <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-widest">{p.horario}</p>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="text-[10px] font-black text-enterprise-300 line-through tracking-tighter">{formatMXN(p.costoBase)}</span>
                                                </td>
                                                <td className="px-6 py-3 text-center bg-enterprise-50/50">
                                                    <span className="text-sm font-black text-brand-orange tracking-tighter italic">{formatMXN(precioCliente)}</span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    {ahorro > 0 ? (
                                                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-black text-[9px] uppercase italic">
                                                            <ArrowUpRight size={12} /> {porcentajeAhorro.toFixed(0)}% OFF
                                                        </div>
                                                    ) : (
                                                        <span className="text-[8px] font-black text-enterprise-300 uppercase tracking-widest italic">Standard</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-32 bg-white rounded-[3rem] border-2 border-dashed border-enterprise-100 animate-premium-fade shadow-premium flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-enterprise-50 rounded-full flex items-center justify-center mb-6">
                        <Search className="text-enterprise-200" size={32} />
                    </div>
                    <h4 className="text-xs font-black text-enterprise-950 uppercase italic tracking-widest">Active Pipeline Visualization</h4>
                    <p className="text-[10px] font-bold text-enterprise-400 uppercase tracking-widest max-w-xs mt-3 leading-loose italic">
                        Select a strategic partner profile to visualize active negotiated tariffs and corporate portfolio availability.
                    </p>
                </div>
            )}
        </div>
    );
};


export default PriceListView;
