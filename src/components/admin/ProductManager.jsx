import React, { useState } from 'react';
import { Search, Package, Power, PowerOff, Edit3, Save, X } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ProductManager = ({ productos, onSave, setMensaje }) => {
    const [busqueda, setBusqueda] = useState('');
    const [productoEditando, setProductoEditando] = useState(null);

    const productosFiltrados = (productos || []).filter(p =>
        p.canal?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.plaza?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleToggleActivo = async (producto) => {
        const nuevoEstatus = !producto.activo;
        const msg = nuevoEstatus ? 'activar' : 'suspender';

        if (window.confirm(`¿Deseas ${msg} el producto "${producto.canal} - ${producto.tipo}"?`)) {
            const result = await onSave('productos', { ...producto, activo: nuevoEstatus });
            if (result) {
                setMensaje({ tipo: 'exito', texto: `Producto ${nuevoEstatus ? 'activado' : 'suspendido'} correctamente.` });
            }
        }
    };

    const handleEditPrecio = (producto) => {
        setProductoEditando({ ...producto });
    };

    const handleSavePrecio = async () => {
        const result = await onSave('productos', productoEditando);
        if (result) {
            setMensaje({ tipo: 'exito', texto: 'Precio actualizado correctamente.' });
            setProductoEditando(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-8">
            <div className="bg-slate-900 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-sm font-black text-white uppercase flex items-center gap-3">
                    <Package size={20} className="text-red-500" />
                    Catálogo de Productos
                </h3>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[10px] placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-red-500 transition-all font-bold"
                    />
                </div>
            </div>

            {/* Vista Mobile: Cards */}
            <div className="md:hidden divide-y divide-gray-100">
                {productosFiltrados.map((p) => (
                    <div key={p.id} className={`p-4 space-y-3 ${!p.activo ? 'bg-gray-50 opacity-70' : ''}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.canal}</div>
                                <div className="text-sm font-black text-gray-800">{p.tipo}</div>
                                <div className="text-[10px] font-bold text-gray-500 italic">{p.plaza}</div>
                            </div>
                            <button
                                onClick={() => handleToggleActivo(p)}
                                className={`px-2 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 transition-all ${p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                            >
                                {p.activo ? <><Power size={8} /> Activo</> : <><PowerOff size={8} /> Suspendido</>}
                            </button>
                        </div>

                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                            <div>
                                <div className="text-[8px] font-black text-gray-400 uppercase">Costo Base</div>
                                {productoEditando?.id === p.id ? (
                                    <input
                                        type="number"
                                        value={productoEditando.costo_base}
                                        onChange={(e) => setProductoEditando({ ...productoEditando, costo_base: e.target.value })}
                                        className="w-24 p-1 border border-red-300 rounded text-sm font-bold outline-none"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="text-sm font-black text-gray-900">{formatMXN(p.costo_base)}</div>
                                )}
                            </div>
                            <div className="flex gap-1">
                                {productoEditando?.id === p.id ? (
                                    <>
                                        <button onClick={handleSavePrecio} className="p-2 bg-green-600 text-white rounded-lg"><Save size={12} /></button>
                                        <button onClick={() => setProductoEditando(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg"><X size={12} /></button>
                                    </>
                                ) : (
                                    <button onClick={() => handleEditPrecio(p)} className="p-2 text-gray-400 hover:text-red-600"><Edit3 size={14} /></button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Vista Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
                            <th className="p-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Canal / Medio</th>
                            <th className="p-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipo / Duración</th>
                            <th className="p-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Plaza</th>
                            <th className="p-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Costo Base</th>
                            <th className="p-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {productosFiltrados.map((p) => (
                            <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${!p.activo ? 'opacity-50' : ''}`}>
                                <td className="p-3">
                                    <button
                                        onClick={() => handleToggleActivo(p)}
                                        className={`flex items-center gap-2 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all ${p.activo ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'}`}
                                    >
                                        {p.activo ? (
                                            <><Power size={8} /> Activo</>
                                        ) : (
                                            <><PowerOff size={8} /> Suspendido</>
                                        )}
                                    </button>
                                </td>
                                <td className="p-3 font-black text-gray-800 text-[11px] whitespace-nowrap">{p.canal}</td>
                                <td className="p-3 font-bold text-gray-600 text-[10px] whitespace-nowrap">{p.tipo}</td>
                                <td className="p-3 font-bold text-gray-500 text-[10px]">{p.plaza}</td>
                                <td className="p-3 text-right">
                                    {productoEditando?.id === p.id ? (
                                        <input
                                            type="number"
                                            value={productoEditando.costo_base}
                                            onChange={(e) => setProductoEditando({ ...productoEditando, costo_base: e.target.value })}
                                            className="w-20 p-1 border border-red-300 rounded text-[10px] font-bold outline-none text-right"
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="font-bold text-gray-900 text-[11px]">{formatMXN(p.costo_base)}</span>
                                    )}
                                </td>
                                <td className="p-3 text-center">
                                    <div className="flex justify-center gap-1">
                                        {productoEditando?.id === p.id ? (
                                            <>
                                                <button onClick={handleSavePrecio} className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-all"><Save size={12} /></button>
                                                <button onClick={() => setProductoEditando(null)} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 shadow-sm transition-all"><X size={12} /></button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleEditPrecio(p)}
                                                className="p-1.5 bg-white text-gray-400 hover:text-red-600 border border-gray-100 rounded-lg shadow-sm hover:border-red-600/20 transition-all font-bold"
                                            >
                                                <Edit3 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mostrando {productosFiltrados.length} productos en catálogo</p>
            </div>
        </div>
    );
};

export default ProductManager;
