import React, { useState } from 'react';
import {
    Search,
    Package,
    Power,
    PowerOff,
    Edit3,
    Save,
    X,
    Tv,
    Layers,
    Tag,
    AlertCircle,
    CheckCircle2,
    Activity
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ProductManager = ({ productos = [], onSave, setMensaje }) => {
    const [busqueda, setBusqueda] = useState('');
    const [productoEditando, setProductoEditando] = useState(null);

    const productosFiltrados = (productos || []).filter(p =>
        p.canal?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.plaza?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleToggleActivo = async (producto) => {
        const nuevoEstatus = !producto.activo;
        const msg = nuevoEstatus ? 'reactivar' : 'suspender';

        if (window.confirm(`¿Deseas ${msg} la disponibilidad de "${producto.canal} - ${producto.tipo}"?`)) {
            const result = await onSave('productos', { ...producto, activo: nuevoEstatus });
            if (result) {
                setMensaje({ tipo: 'exito', texto: `Inventario ${nuevoEstatus ? 'habilitado' : 'congelado'} para cotización.` });
            }
        }
    };

    const handleSavePrecio = async () => {
        const result = await onSave('productos', productoEditando);
        if (result) {
            setMensaje({ tipo: 'exito', texto: 'Tarifa base actualizada en el motor de cálculo.' });
            setProductoEditando(null);
        }
    };

    return (
        <div className="space-y-6 animate-premium-fade">
            {/* Header / Engine Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-enterprise-950 uppercase italic italic-brand tracking-tighter leading-none mb-2">Catálogo de Activos</h2>
                    <p className="text-[10px] font-black text-enterprise-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Layers size={14} className="text-brand-orange" />
                        Inventory Pricing Engine
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <input
                            type="text"
                            placeholder="Canal, Medio o Región..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="premium-input pl-11 h-12 text-sm shadow-sm border border-enterprise-100 bg-white focus:ring-1 focus:ring-brand-orange/20"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-enterprise-300 group-focus-within:text-brand-orange transition-colors" size={18} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-enterprise-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="enterprise-table w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-enterprise-950 text-white font-black uppercase text-[9px] tracking-[0.2em]">
                                <th className="px-8 py-6 opacity-80">Power Status</th>
                                <th className="px-8 py-6 opacity-80">Plataforma / Canal</th>
                                <th className="px-8 py-6 opacity-80">Especificación</th>
                                <th className="px-8 py-6 opacity-80">Región</th>
                                <th className="px-8 py-6 text-right opacity-80">Tarifa Base (MXN)</th>
                                <th className="px-8 py-6 text-center opacity-80">Tuning</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-enterprise-50">
                            {productosFiltrados.length > 0 ? productosFiltrados.map((p) => (
                                <tr key={p.id} className={`group hover:bg-enterprise-50/50 transition-all ${!p.activo ? 'bg-enterprise-50/30' : ''}`}>
                                    <td className="px-8 py-6">
                                        <button
                                            onClick={() => handleToggleActivo(p)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${p.activo
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-500/20 hover:bg-brand-orange hover:text-white hover:border-brand-orange'
                                                : 'bg-enterprise-50 text-enterprise-400 border border-enterprise-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                                                }`}
                                        >
                                            {p.activo ? <><CheckCircle2 size={12} /> Live</> : <><PowerOff size={12} /> Hold</>}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-enterprise-950 rounded-xl flex items-center justify-center text-white shadow-lg">
                                                <Tv size={18} className="text-brand-orange" />
                                            </div>
                                            <span className="text-sm font-black text-enterprise-950 uppercase">{p.canal}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-enterprise-600 uppercase tracking-tight">{p.tipo}</span>
                                            <span className="text-[9px] font-black text-enterprise-300 uppercase tracking-widest">Std Duration</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Tag size={12} className="text-brand-orange" />
                                            <span className="text-[10px] font-black text-enterprise-700 uppercase tracking-widest">{p.plaza}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {productoEditando?.id === p.id ? (
                                            <div className="flex items-center justify-end gap-2 animate-premium-fade">
                                                <input
                                                    type="number"
                                                    value={productoEditando.costo_base}
                                                    onChange={(e) => setProductoEditando({ ...productoEditando, costo_base: e.target.value })}
                                                    className="w-32 h-11 bg-white border-2 border-brand-orange/30 rounded-xl text-right font-black text-base px-3 focus:ring-1 focus:ring-brand-orange/20 outline-none shadow-sm"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-lg font-black text-enterprise-950 tabular-nums">
                                                {formatMXN(p.costo_base)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-3">
                                            {productoEditando?.id === p.id ? (
                                                <>
                                                    <button
                                                        onClick={handleSavePrecio}
                                                        className="w-11 h-11 flex items-center justify-center bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95"
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setProductoEditando(null)}
                                                        className="w-11 h-11 flex items-center justify-center bg-enterprise-100 text-enterprise-400 rounded-xl hover:bg-enterprise-200 transition-all active:scale-95"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setProductoEditando({ ...p })}
                                                    className="w-11 h-11 flex items-center justify-center bg-enterprise-50 text-enterprise-400 hover:bg-enterprise-950 hover:text-white rounded-xl transition-all border border-enterprise-100 hover:border-enterprise-950"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="py-24 text-center">
                                        <AlertCircle size={40} className="mx-auto text-enterprise-200 mb-4" />
                                        <p className="text-xs font-black text-enterprise-300 uppercase tracking-widest italic">
                                            No se han detectado activos bajo estos parámetros.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Performance Insight Footer */}
                <div className="bg-enterprise-50 px-8 py-6 border-t border-enterprise-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-enterprise-950 shadow-lg">
                            <Activity size={16} className="text-brand-orange" />
                        </div>
                        <p className="text-[10px] font-black text-enterprise-400 uppercase tracking-[0.2em]">
                            <span className="text-enterprise-700">{productos.filter(p => p.activo).length}</span> Activos disponibles en el motor de cálculo nacional
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductManager;
