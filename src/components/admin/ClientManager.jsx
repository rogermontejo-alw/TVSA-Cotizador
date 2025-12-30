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
        <div className="space-y-6 animate-premium-fade px-4">
            {/* NEXUS IDENTITY STATION - CLIENT MANAGER */}
            <div className="bg-enterprise-950 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-brand-orange/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-brand-orange/5 blur-3xl rounded-full" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-orange shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <Users size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-3">
                                Nexus de <span className="text-brand-orange">Identidad</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                                <span>Registro Maestro de Entidades v2.0</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="text-brand-orange/80">Entidades Sincronizadas: {clientesFiltrados.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl w-full flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-orange transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="BUSCAR SOCIO, CONTACTO O PLAZA..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest outline-none focus:bg-white/10 focus:border-brand-orange transition-all placeholder:text-white/20"
                            />
                        </div>
                        <button
                            onClick={onNew}
                            className="w-full md:w-auto px-8 py-3 bg-brand-orange text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-brand-orange/90 transition-all shadow-xl shadow-brand-orange/20 active:scale-95 group/btn"
                        >
                            <UserCircle size={16} strokeWidth={3} className="group-hover/btn:rotate-12 transition-transform" />
                            Nuevo Cliente
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation & Lifecycle Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-[2rem] border border-enterprise-100 shadow-premium">
                <div className="flex items-center gap-4 ml-2">
                    <Activity size={16} className="text-brand-orange" />
                    <span className="text-[10px] font-black text-enterprise-950 uppercase tracking-widest italic">Filtros de Ciclo de Vida:</span>
                </div>
                <div className="flex bg-enterprise-950 rounded-xl p-1 w-full md:w-fit shadow-xl border border-white/5">
                    {['activo', 'inactivo', 'todos'].map(st => (
                        <button
                            key={st}
                            onClick={() => setFiltroEstatus(st)}
                            className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300
                                ${filtroEstatus === st
                                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20'
                                    : 'text-white/30 hover:text-white'}`}
                        >
                            {st === 'todos' ? 'TODOS' : st.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Interface */}
            <div className="bg-white rounded-[2.5rem] shadow-premium border border-enterprise-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <div className="overflow-x-auto">
                        <div className="p-6 space-y-3">
                            {clientesFiltrados.length > 0 ? clientesFiltrados.map(c => (
                                <div
                                    key={c.id}
                                    className={`group bg-white rounded-[1.8rem] border border-enterprise-100 p-4 flex items-center justify-between hover:border-brand-orange hover:shadow-xl hover:shadow-brand-orange/5 transition-all duration-300 ${c.estatus === 'inactivo' ? 'opacity-60 grayscale' : ''}`}
                                >
                                    <div className="flex items-center gap-5">
                                        {/* CORPORATE IDENTITY SYMBOL */}
                                        <div className="w-12 h-12 bg-enterprise-950 rounded-2xl flex items-center justify-center text-white font-black text-lg border-2 border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                            {c.nombre_empresa?.charAt(0).toUpperCase()}
                                        </div>

                                        {/* CORE DATA MATRIX */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-orange whitespace-nowrap">
                                                    {c.nombre_empresa}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-enterprise-200" />
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-enterprise-400 whitespace-nowrap flex items-center gap-1">
                                                    <MapPin size={8} className="text-enterprise-300" />
                                                    {c.plaza}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-[12px] font-black text-enterprise-950 uppercase tracking-tight leading-none">
                                                    {c.nombre_contacto || 'IDENTIDAD NO ASIGNADA'}
                                                </h3>
                                                <div className="h-3 w-px bg-enterprise-100" />
                                                <span className="text-[8px] font-black text-enterprise-300 uppercase tracking-widest italic pt-0.5">
                                                    ID-ENTT:{c.id.slice(0, 6)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-enterprise-50 rounded-md border border-enterprise-100/50">
                                                    <ShieldCheck size={10} className="text-emerald-500" />
                                                    <span className="text-[7.5px] font-black text-enterprise-600 uppercase tracking-widest">
                                                        {c.tipo_acuerdo?.replace(/_/g, ' ') || 'PRECIO LISTA'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-orange/5 rounded-md border border-brand-orange/10">
                                                    <Building2 size={10} className="text-brand-orange/70" />
                                                    <span className="text-[7.5px] font-black text-brand-orange/80 uppercase tracking-widest">
                                                        {c.segmento || 'MERCADO GENERAL'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TERMINAL ACTION HUB */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-end mr-4">
                                            <span className={`text-[7px] font-black uppercase tracking-[0.2em] mb-1 ${c.estatus === 'activo' ? 'text-emerald-500' : 'text-brand-orange'}`}>
                                                Estatus de Cuenta
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${c.estatus === 'activo' ? 'bg-emerald-500' : 'bg-brand-orange'}`} />
                                                <span className="text-[9px] font-black text-enterprise-950 uppercase italic tracking-tighter">{c.estatus === 'activo' ? 'ACTIVO' : 'INACTIVO'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 bg-enterprise-50 p-1.5 rounded-2xl border border-enterprise-100 group-hover:bg-white transition-colors">
                                            <button
                                                onClick={() => onEdit(c)}
                                                className="w-9 h-9 flex items-center justify-center bg-white text-enterprise-500 hover:bg-enterprise-900 hover:text-white rounded-xl transition-all shadow-sm border border-enterprise-100"
                                                title="Editar Entidad"
                                            >
                                                <Edit3 size={15} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={() => onToggleEstatus({ ...c, estatus: c.estatus === 'activo' ? 'inactivo' : 'activo' })}
                                                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm border ${c.estatus === 'activo' ? 'bg-white border-enterprise-100 text-enterprise-500 hover:bg-brand-orange hover:text-white hover:border-brand-orange' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                                                title={c.estatus === 'activo' ? 'Desactivar Entidad' : 'Activar Entidad'}
                                            >
                                                <Activity size={15} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={() => { if (window.confirm('¿Eliminar Entidad?')) onEliminar(c.id); }}
                                                className="w-9 h-9 flex items-center justify-center bg-white text-brand-orange border border-brand-orange/10 hover:bg-brand-orange hover:text-white rounded-xl transition-all shadow-sm"
                                                title="Eliminar Entidad"
                                            >
                                                <Trash2 size={15} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-24 text-center">
                                    <Users size={48} className="mx-auto text-enterprise-100 mb-6 stroke-[1]" />
                                    <p className="text-[10px] font-black text-enterprise-300 uppercase tracking-[0.4em] italic">No se encontraron registros en el Nexus</p>
                                </div>
                            )}
                        </div>
                    </div>

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
                                        onClick={() => onToggleEstatus({ ...c, estatus: c.estatus === 'activo' ? 'inactivo' : 'activo' })}
                                        className={`w-9 h-9 flex items-center justify-center rounded-lg active:scale-95 transition-all shadow-sm ${c.estatus === 'activo' ? 'bg-enterprise-50 text-enterprise-500 active:bg-brand-orange active:text-white' : 'bg-emerald-50 text-emerald-600 active:bg-emerald-600 active:text-white'}`}
                                    >
                                        <Activity size={14} />
                                    </button>
                                    <button
                                        onClick={() => { if (window.confirm('¿Eliminar Entidad?')) onEliminar(c.id); }}
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
                <div className="bg-enterprise-950 px-8 py-4 border-t border-white/10 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/5 to-transparent pointer-events-none" />

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] italic">Señales de Identidad Activas</span>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Sincronizado</span>
                            </div>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                            {clientes.length} Cuentas Corporativas Integradas
                        </p>
                    </div>

                    <button className="relative z-10 px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black text-brand-orange uppercase tracking-[0.2em] transition-all flex items-center gap-2 active:scale-95">
                        Exportación Analítica <ExternalLink size={12} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientManager;
