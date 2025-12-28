import React, { useMemo } from 'react';
import { Search, Plus, MapPin } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ProductGrid = ({
    productos,
    productosSeleccionados,
    plazaSeleccionada,
    clienteSeleccionado,
    calcularPrecioUnitario,
    agregarProducto
}) => {
    const [busqueda, setBusqueda] = React.useState('');

    const productosFiltrados = useMemo(() => {
        return productos.filter(p =>
            p.disponible &&
            !productosSeleccionados.some(ps => ps.id === p.id) &&
            (plazaSeleccionada === '' || p.plaza === plazaSeleccionada) &&
            (
                p.canal.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.horario.toLowerCase().includes(busqueda.toLowerCase())
            )
        );
    }, [productos, busqueda, productosSeleccionados, plazaSeleccionada]);

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-700 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Cátalogo de Productos</h2>
                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Filtrar por canal..."
                        className="w-full p-2.5 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm font-medium"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar" style={{ maxHeight: '500px' }}>
                {productosFiltrados.length === 0 ? (
                    <div className="py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium">No se encontraron productos disponibles</p>
                    </div>
                ) : (
                    productosFiltrados.map(p => {
                        const precio = clienteSeleccionado ? calcularPrecioUnitario(p.id, clienteSeleccionado) : p.costoBase;

                        return (
                            <div
                                key={p.id}
                                className="group flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                            >
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-white uppercase tracking-wider">
                                            {p.canal}
                                        </span>
                                        <span className="text-xs font-bold text-red-700 uppercase">{p.tipo}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 truncate">{p.horario}</h3>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="inline-flex items-center text-[11px] font-semibold text-gray-500">
                                            <MapPin className="mr-1" size={12} /> {p.plaza}
                                        </span>
                                        <span className="text-[11px] font-bold text-gray-400 uppercase">{p.categoria}</span>
                                    </div>

                                    {clienteSeleccionado && (
                                        <div className="mt-2 text-green-700 font-bold text-sm bg-green-50 inline-block px-2 py-0.5 rounded">
                                            {formatMXN(precio)}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => agregarProducto(p.id)}
                                    disabled={!clienteSeleccionado}
                                    className="bg-white text-red-600 border-2 border-red-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-red-600 shadow-sm group-hover:scale-110"
                                    title={clienteSeleccionado ? "Agregar a cotización" : "Selecciona un cliente primero"}
                                >
                                    <Plus size={20} strokeWidth={3} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ProductGrid;
