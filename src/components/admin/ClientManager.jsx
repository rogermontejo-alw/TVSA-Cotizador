import React, { useState } from 'react';
import { Trash2, Search, Users, MapPin, Phone, Mail, User, ShieldCheck, Edit3, Building2, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

const ClientManager = ({ clientes, onToggleEstatus, onEliminar, onEdit, setMensaje }) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('activo'); // activo, inactivo, todos

    const clientesFiltrados = (clientes || []).filter(c => {
        const matchBusqueda = (c.nombre_empresa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.plaza || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.nombre_contacto || '').toLowerCase().includes(busqueda.toLowerCase());

        const matchEstatus = filtroEstatus === 'todos' ? true : c.estatus === filtroEstatus;

        return matchBusqueda && matchEstatus;
    });

    const handleInactivar = (cliente, currentStatus) => {
        const nuevoEstatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
        const accion = nuevoEstatus === 'activo' ? 'reactivar' : 'inactivar';
        if (window.confirm(`¿Seguro que deseas ${accion} al cliente "${cliente.nombre_empresa}"?`)) {
            onToggleEstatus({ ...cliente, estatus: nuevoEstatus });
        }
    };

    const handleEliminarPermanente = (cliente) => {
        const confirmacion1 = window.confirm(`⚠️ ADVERTENCIA DE LIMPIEZA ⚠️\n\n¿Estás seguro de ELIMINAR PERMANENTEMENTE a "${cliente.nombre_empresa}"?\n\nEsta acción borrará:\n• El registro del cliente\n• TODAS sus cotizaciones y propuestas\n• Historial de cobranza y facturas\n\nEsta acción NO se puede deshacer. ¿Proceder?`);

        if (confirmacion1) {
            const confirmacion2 = window.confirm(`Confirma una última vez: Escribe "ELIMINAR" mentalmente y pulsa OK para borrar definitivamente.`);
            if (confirmacion2) {
                onEliminar(cliente.id);
            }
        }
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 mt-12 animate-in fade-in duration-500 mb-20">
            {/* Header Operativo: Base de Datos */}
            <div className="bg-slate-900 p-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                            <Building2 size={28} className="text-red-500" />
                            BASE DE DATOS CLIENTES
                        </h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Directorio Maestro de Cuentas y Prospectos</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        {/* Filtro de Estatus */}
                        <div className="flex bg-slate-800 rounded-xl p-1">
                            {['activo', 'inactivo', 'todos'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFiltroEstatus(status)}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                                        ${filtroEstatus === status
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {status}s
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Validar existencia de cliente..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full lg:w-80 pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none placeholder:text-slate-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Listado de Directorio */}
            <div className="divide-y divide-gray-100">
                {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map(cliente => (
                        <div
                            key={cliente.id}
                            className={`group grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-6 hover:bg-slate-50/80 transition-all items-center
                                ${cliente.estatus === 'inactivo' ? 'opacity-60 bg-gray-50/30' : ''}`}
                        >
                            <div className="md:col-span-4 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-all
                                    ${cliente.estatus === 'inactivo' ? 'bg-gray-200 text-gray-400' : 'bg-slate-100 text-slate-400 group-hover:bg-red-600 group-hover:text-white'}`}>
                                    {cliente.nombre_empresa.substring(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-black text-slate-900 text-base tracking-tight truncate">
                                            {cliente.nombre_empresa}
                                        </h4>
                                        {cliente.estatus === 'inactivo' && (
                                            <span className="bg-gray-200 text-[7px] font-black text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">Baja</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <ShieldCheck size={10} className={cliente.estatus === 'inactivo' ? 'text-gray-300' : 'text-blue-500'} />
                                        {cliente.tipo_acuerdo?.replace(/_/g, ' ') || 'GENERAL'}
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1">
                                    <User size={14} className="text-slate-300" />
                                    <span className="truncate">{cliente.nombre_contacto || 'Sin contacto'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                    <MapPin size={12} className="text-red-500/30" />
                                    <span className="truncate">{cliente.plaza}</span>
                                </div>
                            </div>

                            <div className="md:col-span-3">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estatus Pipeline</div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter text-white
                                    ${cliente.estatus === 'inactivo' ? 'bg-gray-400' :
                                        cliente.etapa === 'Cliente' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                    {cliente.etapa || 'Prospecto'}
                                </span>
                            </div>

                            <div className="md:col-span-2 flex justify-end items-center gap-2 pt-4 md:pt-0">
                                <button
                                    onClick={() => onEdit(cliente)}
                                    className="p-2.5 bg-gray-50 text-gray-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"
                                    title="Editar Registro"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => handleInactivar(cliente, cliente.estatus)}
                                    className={`p-2.5 rounded-xl transition-all shadow-sm
                                        ${cliente.estatus === 'inactivo'
                                            ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-600 hover:text-white'
                                            : 'bg-gray-50 text-gray-400 hover:bg-slate-900 hover:text-white'}`}
                                    title={cliente.estatus === 'inactivo' ? 'Reactivar' : 'Archivar / Dar de Baja'}
                                >
                                    {cliente.estatus === 'inactivo' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                </button>
                                <button
                                    onClick={() => handleEliminarPermanente(cliente)}
                                    className="p-2.5 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                                    title="Eliminar Permanente (Limpiar Pruebas)"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-24 text-center">
                        <Users className="mx-auto text-gray-100 mb-4" size={48} />
                        <p className="text-gray-400 font-black uppercase text-xs tracking-widest italic">No hay coincidencias con esos criterios en la base de datos</p>
                    </div>
                )}
            </div>

            <div className="bg-slate-50 p-4 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-t border-gray-100">
                <span className="flex items-center gap-1.5 italic">
                    Central de Datos Maestros Televisa Mérida
                </span>
                <span>{clientesFiltrados.length} Registros Encontrados</span>
            </div>
        </div>
    );
};

export default ClientManager;
