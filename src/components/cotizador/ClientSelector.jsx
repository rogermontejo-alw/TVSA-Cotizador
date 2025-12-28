import React from 'react';
import { Search, User } from 'lucide-react';

const ClientSelector = ({ clientes, clienteSeleccionado, setClienteSeleccionado }) => {
    const selectedClient = clientes.find(c => c.id === clienteSeleccionado);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-red-700">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <User className="mr-2 text-red-700" size={22} />
                Selección de Cliente
            </h2>

            <div className="relative">
                <select
                    value={clienteSeleccionado}
                    onChange={(e) => setClienteSeleccionado(e.target.value)}
                    className="w-full max-w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 appearance-none bg-white font-medium text-gray-700 truncate"
                >
                    <option value="">Buscar cliente...</option>
                    {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.nombre_empresa} {c.segmento ? `(${c.segmento})` : ''}
                        </option>
                    ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Search size={18} />
                </div>
            </div>

            {selectedClient && (
                <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-white rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Tipo de Acuerdo</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">
                                {selectedClient.tipo_acuerdo?.replace(/_/g, ' ') || 'SIN ACUERDO'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Segmento</p>
                            <p className="text-sm font-semibold text-gray-600">
                                {selectedClient.segmento || 'GENERAL'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientSelector;
