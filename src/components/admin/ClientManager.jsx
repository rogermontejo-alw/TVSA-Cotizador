import React, { useState } from 'react';
import {
    Trash2,
    Search,
    Users,
    MapPin,
    Phone,
    Mail,
    User,
    ShieldCheck,
    Edit3,
    Building2,
    UserCircle,
    Activity,
    Globe,
    ExternalLink
} from 'lucide-react';

const ClientManager = ({ clientes = [], onToggleEstatus, onEliminar, onEdit, onNew }) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('activo'); // activo, inactivo, todos

    const clientesFiltrados = (clientes || []).filter(c => {
        const matchBusqueda = (c.nombre_empresa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.plaza || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.nombre_contacto || '').toLowerCase().includes(busqueda.toLowerCase());

        const matchEstatus = filtroEstatus === 'todos' ? true : c.estatus === filtroEstatus;

        return matchBusqueda && matchEstatus;
    });

    return (
        <div className="space-y-6 animate-premium-fade">
            {/* Header / Toolbar Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-enterprise-950 tracking-tight leading-none mb-1">Directorio de Entidades</h2>
                    <p className="text-[10px] font-black text-enterprise-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Globe size={12} className="text-brand-orange" />
                        Master Business Registry v2.0
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    {/* Search Field */}
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Buscar Razón Social, Contacto..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="premium-input pl-11 h-12 text-sm"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-enterprise-300" size={18} />
                    </div>

                    {/* Filter Segment */}
                    <div className="flex bg-enterprise-100 p-1.5 rounded-2xl border border-enterprise-200">
                        {['activo', 'inactivo', 'todos'].map(st => (
                            <button
                                key={st}
                                onClick={() => setFiltroEstatus(st)}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                    ${filtroEstatus === st ? 'bg-enterprise-900 text-white shadow-lg' : 'text-enterprise-400 hover:text-enterprise-600'}`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>

                    {/* Action */}
                    <button
                        onClick={onNew}
                        className="h-12 bg-brand-orange text-white px-6 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-orange/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <UserCircle size={16} />
                        + Cliente
                    </button>
                </div>
            </div>

            {/* Main Interface */}
            <div className="bg-white rounded-[2.5rem] shadow-premium border border-enterprise-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="enterprise-table w-full">
                        <thead>
                            <tr className="bg-enterprise-950 text-white">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Socio Comercial</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Enlace Externo</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Nivel Contractual</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Operación</th>
                                <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Terminal Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-enterprise-50">
                            {clientesFiltrados.length > 0 ? clientesFiltrados.map(c => (
                                <tr key={c.id} className={`hover:bg-enterprise-50/50 transition-colors ${c.estatus === 'inactivo' ? 'opacity-50' : ''}`}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-enterprise-950 rounded-2xl flex items-center justify-center text-white font-black text-lg border-2 border-white shadow-xl shadow-enterprise-900/10">
                                                {c.nombre_empresa?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="block text-sm font-black text-enterprise-950 uppercase tracking-tight">{c.nombre_empresa}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${c.estatus === 'activo' ? 'bg-emerald-500' : 'bg-brand-orange'}`} />
                                                    <span className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest">ID-ENTT:{c.id.slice(0, 6)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-enterprise-700 font-bold text-xs">
                                                <User size={12} className="text-brand-orange" />
                                                {c.nombre_contacto || 'No asignado'}
                                            </div>
                                            <div className="text-[10px] text-enterprise-400 font-medium">
                                                {c.segmento || 'General Market'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                            <span className="text-[10px] font-black text-enterprise-700 uppercase tracking-widest">
                                                {c.tipo_acuerdo?.replace(/_/g, ' ') || 'PRECIO LISTA'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-brand-orange" />
                                            <span className="text-[10px] font-bold text-enterprise-950 uppercase">{c.plaza}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => onEdit(c)}
                                                className="w-10 h-10 flex items-center justify-center bg-enterprise-50 text-enterprise-500 hover:bg-enterprise-900 hover:text-white rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onToggleEstatus(c)}
                                                className="w-10 h-10 flex items-center justify-center bg-enterprise-50 text-enterprise-500 hover:bg-brand-orange hover:text-white rounded-xl transition-all shadow-sm"
                                            >
                                                <Activity size={16} />
                                            </button>
                                            <button
                                                onClick={() => { if (window.confirm('¿Eliminar definitivamente?')) onEliminar(c.id); }}
                                                className="w-10 h-10 flex items-center justify-center bg-brand-orange/5 text-brand-orange hover:bg-brand-magenta hover:text-white rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-enterprise-400 font-bold uppercase text-[10px] italic tracking-widest">No hay registros disponibles</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-enterprise-50">
                    {clientesFiltrados.length > 0 ? clientesFiltrados.map(c => (
                        <div key={c.id} className={`p-6 space-y-4 ${c.estatus === 'inactivo' ? 'opacity-50' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-enterprise-950 rounded-xl flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-lg">
                                        {c.nombre_empresa?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="block text-xs font-black text-enterprise-950 uppercase tracking-tight">{c.nombre_empresa}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${c.estatus === 'activo' ? 'bg-emerald-500' : 'bg-brand-orange'}`} />
                                            <span className="text-[8px] font-black text-enterprise-400 uppercase">ID:{c.id.slice(0, 6)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => onEdit(c)}
                                        className="w-9 h-9 flex items-center justify-center bg-enterprise-50 text-enterprise-500 rounded-lg active:bg-enterprise-900 active:text-white transition-all shadow-sm"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => onToggleEstatus(c)}
                                        className="w-9 h-9 flex items-center justify-center bg-enterprise-50 text-enterprise-500 rounded-lg active:bg-brand-orange active:text-white transition-all shadow-sm"
                                    >
                                        <Activity size={14} />
                                    </button>
                                    <button
                                        onClick={() => { if (window.confirm('¿Eliminar definitivamente?')) onEliminar(c.id); }}
                                        className="w-9 h-9 flex items-center justify-center bg-brand-orange/5 text-brand-orange rounded-lg active:bg-brand-magenta active:text-white transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-enterprise-50">
                                <div>
                                    <p className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-1">Contacto</p>
                                    <div className="flex items-center gap-1.5 text-enterprise-700 font-bold text-[10px]">
                                        <User size={10} className="text-brand-orange" />
                                        {c.nombre_contacto || 'No asignado'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-1">Ubicación</p>
                                    <div className="flex items-center gap-1.5 text-enterprise-950 font-bold text-[10px] uppercase">
                                        <MapPin size={10} className="text-brand-orange" />
                                        {c.plaza}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-1">Acuerdo Comercial</p>
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck size={10} className="text-emerald-500" />
                                        <span className="text-[9px] font-black text-enterprise-700 uppercase tracking-widest">
                                            {c.tipo_acuerdo?.replace(/_/g, ' ') || 'PRECIO LISTA'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center">
                            <Users size={32} className="mx-auto text-enterprise-100 mb-4" />
                            <p className="text-[10px] font-black text-enterprise-300 uppercase tracking-widest italic">Sin registros</p>
                        </div>
                    )}
                </div>
                {/* Footer Insight */}
                <div className="bg-enterprise-50 px-8 py-5 border-t border-enterprise-200 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-enterprise-200 flex items-center justify-center">
                                    <User size={12} className="text-enterprise-400" />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest">
                            {clientes.length} Cuentas sincronizadas con CRM Regional
                        </p>
                    </div>
                    <button className="text-[10px] font-black text-brand-orange hover:underline uppercase tracking-widest flex items-center gap-2">
                        Exportar a Excel <ExternalLink size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientManager;
