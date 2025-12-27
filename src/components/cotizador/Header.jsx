import React from 'react';
import { List, FileText, Eye, Settings, RefreshCw } from 'lucide-react';

const Header = ({
    historialLength,
    compararLength,
    ultimaActualizacion,
    productosCount,
    clientesCount,
    setVistaActual,
    iniciarNuevaCotizacion
}) => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-8 border-red-700">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-800 tracking-tight">Sistema de Cotizaciones Televisa MID</h1>
                    <p className="text-gray-500 mt-1 font-medium">Diseñado por Roger Montejo</p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <button
                        onClick={() => setVistaActual('lista-precios')}
                        className="w-full sm:w-auto bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors font-semibold"
                    >
                        <List className="mr-2" size={18} />
                        Lista Precios
                    </button>
                    <button
                        onClick={() => setVistaActual('historial')}
                        className="w-full sm:w-auto bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors font-semibold"
                    >
                        <FileText className="mr-2" size={18} />
                        Historial ({historialLength})
                    </button>
                    <button
                        onClick={() => setVistaActual('comparador')}
                        className="w-full sm:w-auto bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors font-semibold"
                    >
                        <Eye className="mr-2" size={18} />
                        Comparar ({compararLength})
                    </button>
                    <button
                        onClick={() => setVistaActual('administracion')}
                        className="w-full sm:w-auto bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center justify-center transition-colors font-semibold"
                    >
                        <Settings className="mr-2" size={18} />
                        Admin
                    </button>
                    <button
                        onClick={iniciarNuevaCotizacion}
                        className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center shadow-md transition-all font-semibold"
                    >
                        <RefreshCw size={16} className="mr-2" />
                        Nueva Cotización
                    </button>
                </div>
            </div>

            {ultimaActualizacion && (
                <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100 overflow-x-auto whitespace-nowrap">
                    <span><strong>Última actualización:</strong> {ultimaActualizacion.toLocaleTimeString()}</span>
                    <span className="hidden sm:inline">|</span>
                    <span><strong>Productos hincados:</strong> {productosCount}</span>
                    <span className="hidden sm:inline">|</span>
                    <span><strong>Clientes activos:</strong> {clientesCount}</span>
                </div>
            )}
        </div>
    );
};

export default Header;
