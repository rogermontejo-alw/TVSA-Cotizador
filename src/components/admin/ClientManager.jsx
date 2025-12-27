import React, { useState } from 'react';
import { Trash2, Search, Users, ExternalLink, MapPin } from 'lucide-react';

const ClientManager = ({ clientes, onEliminar, setMensaje }) => {
    const [busqueda, setBusqueda] = useState('');

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.plaza.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.segmento.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleEliminar = (clienteId, nombre) => {
        if (window.confirm(`¿Seguro que deseas eliminar al cliente "${nombre}"? \n\nESTO ELIMINARÁ TAMBIÉN TODAS SUS CONDICIONES ESPECIALES EN GOOGLE SHEETS.`)) {
            onEliminar(clienteId);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <Users size={24} className="text-blue-500" />
                    Base de Clientes Activa
                </h3>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none placeholder:text-gray-500"
                    />
                </div>
            </div>

            {/* Vista Responsiva: Tabla para tablets/desktop, Cards para móvil */}
            <div className="p-0 overflow-x-auto">
                {/* Desktop/Tablet Table */}
                <table className="w-full text-left border-collapse hidden md:table">
                    <thead>
                        <tr className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-widest border-b border-gray-100">
                            <th className="px-6 py-4">Nombre del Cliente</th>
                            <th className="px-6 py-4">Plaza / Segmento</th>
                            <th className="px-6 py-4">Acuerdo</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {clientesFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">
                                    No se encontraron clientes que coincidan con la búsqueda.
                                </td>
                            </tr>
                        ) : (
                            clientesFiltrados.map(cliente => (
                                <tr key={cliente.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-gray-800">{cliente.nombre}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {cliente.id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="flex items-center gap-1 font-bold text-gray-600 mb-1">
                                            <MapPin size={12} className="text-red-500" /> {cliente.plaza}
                                        </div>
                                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-black text-[9px] uppercase">
                                            {cliente.segmento}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black uppercase tracking-tight px-3 py-1 rounded-lg ${cliente.tipoAcuerdo === 'SIN_ACUERDO'
                                            ? 'bg-gray-100 text-gray-500'
                                            : 'bg-green-50 text-green-600 border border-green-100'
                                            }`}>
                                            {cliente.tipoAcuerdo.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleEliminar(cliente.id, cliente.nombre); }}
                                                className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-red-200"
                                                title="Eliminar Cliente y sus Condiciones"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {clientesFiltrados.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-400 font-medium">
                            No se encontraron clientes.
                        </div>
                    ) : (
                        clientesFiltrados.map(cliente => (
                            <div key={cliente.id} className="p-6 space-y-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                        <div className="font-black text-gray-800 text-lg leading-tight mb-1">{cliente.nombre}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {cliente.id}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleEliminar(cliente.id, cliente.nombre); }}
                                        className="p-3 bg-red-50 text-red-500 rounded-xl"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <div className="flex items-center gap-1 font-bold text-gray-600 text-xs bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                        <MapPin size={12} className="text-red-500" /> {cliente.plaza}
                                    </div>
                                    <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase border border-gray-200">
                                        {cliente.segmento}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-tight px-3 py-1.5 rounded-lg border ${cliente.tipoAcuerdo === 'SIN_ACUERDO'
                                        ? 'bg-gray-50 text-gray-400 border-gray-100'
                                        : 'bg-green-50 text-green-600 border-green-100'
                                        }`}>
                                        {cliente.tipoAcuerdo.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Total: {clientesFiltrados.length} Clientes</span>
                <span className="flex items-center gap-1"><Users size={12} /> Sync Online</span>
            </div>
        </div>
    );
};

export default ClientManager;
