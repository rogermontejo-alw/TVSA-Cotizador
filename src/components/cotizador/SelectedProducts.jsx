import React from 'react';
import { X, Plus, Minus, FileText, Trash2, DollarSign } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const SelectedProducts = ({
    productos,
    productosSeleccionados,
    paqueteVIX,
    setPaqueteVIX,
    paquetesVIX,
    actualizarCantidad,
    eliminarProducto,
    generarCotizacion,
    presupuesto,
    subtotalActual,
    subtotalTVActual,
    subtotalVIXActual,
    clienteSeleccionado,
    calcularPrecioUnitario
}) => {
    const vixSeleccionado = paquetesVIX.find(p => p.id === paqueteVIX);
    const presupuestoNum = presupuesto ? parseFloat(presupuesto) : 0;
    const saldoDisponible = presupuestoNum - subtotalActual;
    const saldoColor = saldoDisponible >= 0 ? 'text-green-600' : 'text-red-600';

    if (productosSeleccionados.length === 0 && !paqueteVIX) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:grid md:grid-cols-12 gap-6">

                {/* Panel de Resumen de Presupuesto - Sticky on desktop/tablet, top on mobile */}
                <div className="md:col-span-5 lg:col-span-4 order-first md:order-none">
                    <div className="bg-white rounded-xl shadow-lg p-5 border-t-4 border-red-700 md:sticky md:top-20">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <DollarSign className="mr-2 text-red-700" size={20} />
                            Resumen Financiero
                        </h3>

                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-2">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50 col-span-2 lg:col-span-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Presupuesto Base:</span>
                                <span className="text-sm font-bold text-gray-800">{formatMXN(presupuestoNum)}</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Inversión TV:</span>
                                <span className="text-sm font-bold text-red-700">-{formatMXN(subtotalTVActual)}</span>
                            </div>

                            {subtotalVIXActual > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Inversión VIX:</span>
                                    <span className="text-sm font-bold text-red-600">-{formatMXN(subtotalVIXActual)}</span>
                                </div>
                            )}

                            <div className={`flex flex-col lg:flex-row lg:justify-between lg:items-center gap-1 pt-3 col-span-2 lg:col-span-1 border-t border-gray-100 ${saldoColor}`}>
                                <span className="text-[10px] font-bold uppercase opacity-80">Saldo Disponible:</span>
                                <span className="text-xl lg:text-2xl font-black">{formatMXN(saldoDisponible)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel de Productos en Cotización */}
                <div className="md:col-span-7 lg:col-span-8 bg-white rounded-xl shadow-lg p-5 border-t-4 border-red-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Productos en Cotización</h2>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                            {productosSeleccionados.length + (vixSeleccionado ? 1 : 0)} Items
                        </span>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {/* Lista de Productos de TV */}
                        {productosSeleccionados.map(ps => {
                            const producto = productos.find(p => p.id === ps.id);
                            if (!producto) return null;

                            const precioUnitario = calcularPrecioUnitario(ps.id, clienteSeleccionado);

                            return (
                                <div key={ps.id} className="group relative flex flex-col md:flex-row md:items-center gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-gray-800 truncate text-sm md:text-base">
                                                {producto.canal} - {producto.tipo}
                                            </p>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                            {producto.plaza} | {producto.horario}
                                        </p>
                                        {/* Costo Unitario Informativo */}
                                        <p className="text-[10px] font-black text-red-700 mt-1 uppercase tracking-widest">
                                            Costo Unitario: {formatMXN(precioUnitario)}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200">
                                        <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                                            <button
                                                onClick={() => actualizarCantidad(ps.id, ps.cantidad - 1)}
                                                className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-20"
                                                disabled={ps.cantidad <= 0}
                                            >
                                                <Minus size={14} strokeWidth={3} />
                                            </button>

                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={ps.cantidad}
                                                onChange={(e) => actualizarCantidad(ps.id, e.target.value)}
                                                onFocus={(e) => {
                                                    if (ps.cantidad === 0) {
                                                        // En lugar de vaciar, seleccionamos todo para que sea fácil sobrescribir
                                                        // o si prefiere limpiar:
                                                        // e.target.value = '';
                                                    }
                                                    e.target.select();
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value === "") {
                                                        actualizarCantidad(ps.id, 0);
                                                    }
                                                }}
                                                className="w-10 text-center bg-transparent font-bold text-sm text-gray-800 focus:outline-none"
                                                min="0"
                                            />

                                            <button
                                                onClick={() => actualizarCantidad(ps.id, ps.cantidad + 1)}
                                                className="p-1.5 text-gray-500 hover:text-green-700 hover:bg-green-50 transition-colors"
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => eliminarProducto(ps.id)}
                                            className="text-gray-300 hover:text-red-600 p-1.5 transition-colors self-center"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Paquete VIX */}
                        {vixSeleccionado && (
                            <div className="flex items-center gap-4 p-4 border-2 border-red-200 rounded-xl bg-gradient-to-r from-red-50 to-white hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-1.5 py-0.5 bg-red-700 text-white text-[9px] font-black rounded">VIX</span>
                                        <p className="font-black text-red-800 uppercase tracking-tighter text-sm">
                                            {vixSeleccionado.nombre}
                                        </p>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-700">
                                        {formatMXN(vixSeleccionado.inversion)} (Costo Inversión Fija)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setPaqueteVIX('')}
                                    className="text-red-300 hover:text-red-600 p-1.5 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={generarCotizacion}
                        className="w-full mt-6 bg-red-700 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-800 transition-all flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 group"
                    >
                        <FileText className="mr-3 group-hover:animate-bounce" size={24} />
                        Calcular Cotización Final
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectedProducts;
