import React, { useState } from 'react';
import { Download, ArrowLeft, Search, MapPin } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const PriceListView = ({ setVistaActual, clientes, productos, calcularPrecioUnitario }) => {
    const [clienteSel, setClienteSel] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const productosFiltrados = productos.filter(p =>
        p.disponible &&
        (p.canal.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.tipo.toLowerCase().includes(busqueda.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-b-8 border-red-700">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setVistaActual('cotizador')}
                                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Lista de Precios</h1>
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Consulta de tarifas netas por cliente</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">1. Seleccionar Cliente</label>
                        <select
                            value={clienteSel}
                            onChange={(e) => setClienteSel(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 font-bold text-gray-800"
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">2. Filtrar por Producto</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Canal o tipo de producto..."
                                className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 font-bold text-gray-800"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                        </div>
                    </div>
                </div>

                {clienteSel && (
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-10 duration-700">
                        <div className="p-8 bg-gray-800 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black">{clientes.find(c => c.id === clienteSel)?.nombre}</h2>
                                <p className="text-red-500 font-bold text-xs uppercase tracking-widest">Tarifario Personalizado</p>
                            </div>
                            <button
                                onClick={() => alert('Próximamente: Exportación completa a PDF')}
                                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl border border-white/20 transition-all"
                            >
                                <Download size={20} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-left">
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Canal / Producto</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Plaza</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Horario</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Duración</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Precio Lista</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Neto Cliente</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ahorro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {productosFiltrados.map(p => {
                                        const precioCliente = calcularPrecioUnitario(p.id, clienteSel);
                                        const ahorro = p.costoBase - precioCliente;
                                        const porcentajeAhorro = (ahorro / p.costoBase) * 100;

                                        return (
                                            <tr key={p.id} className="hover:bg-red-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-black text-gray-800 text-sm mb-0.5">{p.canal} - {p.tipo}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">{p.categoria}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        <MapPin size={10} /> {p.plaza}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs font-bold text-gray-600">{p.horario}</td>
                                                <td className="px-6 py-4 text-center text-xs font-bold text-gray-600">{p.duracion}</td>
                                                <td className="px-6 py-4 text-right text-xs font-bold text-gray-400 line-through">
                                                    {formatMXN(p.costoBase)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="font-black text-red-700">{formatMXN(precioCliente)}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {ahorro > 0 ? (
                                                        <span className="inline-block bg-green-100 text-green-700 font-black text-[10px] px-2 py-1 rounded-full uppercase">
                                                            -{porcentajeAhorro.toFixed(0)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceListView;
