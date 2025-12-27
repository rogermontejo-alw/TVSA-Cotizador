import React, { useState, useEffect, useMemo } from 'react';
import { Save, Search, Plus, X, Tag } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ConditionsForm = ({ clientes, productos, condicionesCliente, onSave, setMensaje }) => {
    const [clienteIdSeleccionado, setClienteIdSeleccionado] = useState('');
    const [busquedaProductoAdmin, setBusquedaProductoAdmin] = useState('');
    const [productosParaCondicion, setProductosParaCondicion] = useState([]);

    useEffect(() => {
        setProductosParaCondicion([]);
    }, [clienteIdSeleccionado, clientes]);

    const handleCondicionChange = (productId, name, value) => {
        setProductosParaCondicion(prev => prev.map(p => {
            if (p.id === productId) {
                const isFactor = name === 'factor';
                return {
                    ...p,
                    factor: isFactor ? value : p.factor,
                    costoFijo: !isFactor ? value : p.costoFijo,
                    tipoAjuste: isFactor ? 'FACTOR' : 'FIJO'
                };
            }
            return p;
        }));
    };

    const agregarProductoParaCondicion = (producto) => {
        if (!productosParaCondicion.find(p => p.id === producto.id)) {
            const condicionExistente = condicionesCliente.find(c => c.clienteId === clienteIdSeleccionado && c.productoId === producto.id);

            setProductosParaCondicion(prev => [
                ...prev,
                {
                    ...producto,
                    factor: condicionExistente?.factorDescuento || '',
                    costoFijo: condicionExistente?.costoFijo || '',
                    tipoAjuste: condicionExistente?.tipoAjuste || 'FACTOR'
                }
            ]);
        }
    };

    const eliminarProductoParaCondicion = (productId) => {
        setProductosParaCondicion(prev => prev.filter(p => p.id !== productId));
    };

    const handleSubmitCondiciones = async () => {
        if (!clienteIdSeleccionado || productosParaCondicion.length === 0) {
            setMensaje({ tipo: 'error', texto: 'Selecciona un cliente y al menos un producto para guardar.' });
            return;
        }

        let hayError = false;
        let condicionesEnviadas = [];

        productosParaCondicion.forEach(p => {
            const valorFactor = parseFloat(p.factor);
            const valorFijo = parseFloat(p.costoFijo);
            let tipoAjuste = '';
            let valor = '';

            if (valorFactor > 0 && (isNaN(valorFijo) || valorFijo === '')) {
                tipoAjuste = 'FACTOR';
                valor = valorFactor;
            } else if (valorFijo > 0 && (isNaN(valorFactor) || valorFactor === '')) {
                tipoAjuste = 'FIJO';
                valor = valorFijo;
            } else if (valorFactor > 0 && valorFijo > 0) {
                tipoAjuste = p.tipoAjuste;
                valor = tipoAjuste === 'FACTOR' ? valorFactor : valorFijo;
            } else {
                hayError = true;
                setMensaje({ tipo: 'error', texto: `El producto ${p.tipo} requiere Factor o Precio Fijo.` });
                return;
            }

            if (hayError) return;

            condicionesEnviadas.push({
                cliente_id: clienteIdSeleccionado,
                producto_id: p.id,
                tipo_ajuste: tipoAjuste,
                factor_descuento: tipoAjuste === 'FACTOR' ? valor : '',
                costo_fijo: tipoAjuste === 'FIJO' ? valor : '',
                vigencia_inicio: '',
                vigencia_fin: '',
                notas: ''
            });
        });

        if (hayError) return;

        const exito = await onSave(condicionesEnviadas, 'condiciones_cliente');
        if (exito) {
            setProductosParaCondicion([]);
        }
    };

    const productosDisponiblesFiltrados = useMemo(() => productos.filter(p =>
        p.disponible &&
        !productosParaCondicion.some(ap => ap.id === p.id) &&
        (
            p.canal.toLowerCase().includes(busquedaProductoAdmin.toLowerCase()) ||
            p.tipo.toLowerCase().includes(busquedaProductoAdmin.toLowerCase()) ||
            p.horario.toLowerCase().includes(busquedaProductoAdmin.toLowerCase())
        )
    ), [productos, busquedaProductoAdmin, productosParaCondicion]);

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-8">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <Tag size={24} className="text-red-500" />
                    Precios Especiales por Cliente
                </h3>
            </div>

            <div className="p-8">
                <div className="mb-8">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">1. Seleccionar Cliente</label>
                    <select
                        value={clienteIdSeleccionado}
                        onChange={(e) => setClienteIdSeleccionado(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all font-bold text-gray-800"
                    >
                        <option value="">-- Seleccionar un cliente para editar --</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>

                {clienteIdSeleccionado && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                        {/* Buscador de Productos */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">2. Buscar Productos</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={busquedaProductoAdmin}
                                    onChange={(e) => setBusquedaProductoAdmin(e.target.value)}
                                    placeholder="Ver catálogo..."
                                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all font-semibold"
                                />
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>

                            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {productosDisponiblesFiltrados.map(p => (
                                    <div key={p.id} className="group flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-red-200 transition-all">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-gray-800 text-sm truncate">{p.canal} - {p.tipo}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{p.plaza} | {p.horario}</p>
                                        </div>
                                        <button
                                            onClick={() => agregarProductoParaCondicion(p)}
                                            className="ml-3 bg-white text-red-600 p-2 rounded-full border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Plus size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Lista de Edición */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">3. Definir Condiciones ({productosParaCondicion.length})</label>

                            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {productosParaCondicion.length === 0 ? (
                                    <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50">
                                        <p className="text-gray-400 text-sm font-medium">Agrega productos para editar precio</p>
                                    </div>
                                ) : (
                                    productosParaCondicion.map(p => (
                                        <div key={p.id} className="p-4 border border-red-100 rounded-2xl bg-white shadow-sm relative group">
                                            <button
                                                onClick={() => eliminarProductoParaCondicion(p.id)}
                                                className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-600 hover:scale-110 shadow-md rounded-full p-1 transition-all z-10"
                                            >
                                                <X size={16} strokeWidth={3} />
                                            </button>

                                            <div className="mb-3">
                                                <p className="font-black text-gray-800 text-sm">{p.canal} - {p.tipo}</p>
                                                <p className="text-[10px] font-bold text-red-700">{p.plaza} | {p.horario} | Original: {formatMXN(p.costoBase)}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase">Factor (0 - 1.0)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={p.factor}
                                                        onChange={(e) => handleCondicionChange(p.id, 'factor', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        className={`w-full p-2.5 rounded-lg border text-sm font-bold transition-all ${p.tipoAjuste === 'FACTOR' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-gray-50 border-gray-100'}`}
                                                        placeholder="Ej: 0.85"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase">Precio Net-Net</label>
                                                    <input
                                                        type="number"
                                                        value={p.costoFijo}
                                                        onChange={(e) => handleCondicionChange(p.id, 'costoFijo', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        className={`w-full p-2.5 rounded-lg border text-sm font-bold transition-all ${p.tipoAjuste === 'FIJO' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-gray-50 border-gray-100'}`}
                                                        placeholder="Ej: 1500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {productosParaCondicion.length > 0 && (
                                <button
                                    onClick={handleSubmitCondiciones}
                                    className="w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center shadow-lg active:scale-95"
                                >
                                    <Save className="mr-3" size={20} />
                                    Actualizar Tarifas
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConditionsForm;
