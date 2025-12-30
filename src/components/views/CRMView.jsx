import React, { useState } from 'react';
import { Search, Users, Briefcase, Plus, ChevronRight, MapPin, Building2, User, Filter } from 'lucide-react';

const CRMView = ({ clientes, onSelectClient, onAddNewClient }) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEtapa, setFiltroEtapa] = useState('Todas');

    const etapas = ['Todas', 'Prospecto', 'Contactado', 'Interesado', 'No Interesado', 'Cliente'];

    const clientesFiltrados = (clientes || []).filter(c => {
        const matchBusqueda = (c.nombre_empresa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.nombre_contacto || '').toLowerCase().includes(busqueda.toLowerCase());
        const matchEtapa = filtroEtapa === 'Todas' || c.etapa === filtroEtapa;
        return matchBusqueda && matchEtapa;
    });

    const getStageColor = (etapa) => {
        switch (etapa) {
            case 'Cliente': return 'bg-emerald-500';
            case 'No Interesado': return 'bg-enterprise-400';
            case 'Prospecto': return 'bg-blue-500';
            case 'Contactado': return 'bg-brand-orange';
            case 'Interesado': return 'bg-brand-magenta';
            default: return 'bg-enterprise-300';
        }
    };

    return (
        <div className="space-y-6 animate-premium-fade pb-20 px-4">
            {/* NEXUS CRM STATION HEADER */}
            <div className="bg-enterprise-950 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-brand-orange/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-brand-orange/5 blur-3xl rounded-full" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-orange shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <Briefcase size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-3">
                                Pipeline de <span className="text-brand-orange">Clientes</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                                <span>Hub de Identidad Comercial</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="text-brand-orange/80">Conexiones Activas: {clientesFiltrados.length}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onAddNewClient}
                        className="w-full lg:w-auto px-8 py-3.5 bg-brand-orange text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-brand-orange/90 transition-all shadow-xl shadow-brand-orange/20 active:scale-95 group/btn"
                    >
                        <Plus size={16} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                        Desplegar Nuevo Prospecto
                    </button>
                </div>
            </div>

            {/* Navigation & Intelligence Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-[2rem] border border-enterprise-100 shadow-premium">
                <div className="flex-1 relative w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-enterprise-400 group-focus-within:text-brand-orange transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="BUSCAR IDENTIDAD DE CUENTA O CONTACTO..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-enterprise-50 border border-enterprise-100/50 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-brand-orange/50 transition-all placeholder:text-enterprise-300"
                    />
                </div>

                <div className="flex bg-enterprise-950 rounded-xl p-1 w-full md:w-fit overflow-x-auto scrollbar-hide border border-white/5 shadow-xl">
                    {etapas.map(etapa => (
                        <button
                            key={etapa}
                            onClick={() => setFiltroEtapa(etapa)}
                            className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300
                                ${filtroEtapa === etapa
                                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20'
                                    : 'text-white/30 hover:text-white'}`}
                        >
                            {etapa}
                        </button>
                    ))}
                </div>
            </div>

            {/* High-Density Pipeline List */}
            <div className="bg-white rounded-[2.5rem] shadow-premium border border-enterprise-100 overflow-hidden">
                <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-enterprise-950 text-white border-b border-white/5 items-center">
                    <div className="col-span-4 text-[7.5px] font-black uppercase tracking-[0.3em] opacity-40 italic">Identidad de Cuenta / Contacto</div>
                    <div className="col-span-2 text-[7.5px] font-black uppercase tracking-[0.3em] opacity-40 italic text-center">Fase del Ciclo de Vida</div>
                    <div className="col-span-2 text-[7.5px] font-black uppercase tracking-[0.3em] opacity-40 italic text-center">Hub Regional</div>
                    <div className="col-span-3 text-[7.5px] font-black uppercase tracking-[0.3em] opacity-40 italic">Clasificación de Segmento</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="divide-y divide-gray-50">
                    {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map(cliente => (
                            <div
                                key={cliente.id}
                                onClick={() => onSelectClient(cliente)}
                                className="group lg:grid lg:grid-cols-12 gap-4 px-6 md:px-8 py-6 hover:bg-red-50/30 transition-all cursor-pointer items-center content-center"
                            >
                                {/* Empresa / Contacto (Full width on mobile) */}
                                <div className="col-span-12 lg:col-span-4 flex items-center gap-4 mb-4 lg:mb-0">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm ${getStageColor(cliente.etapa)}`}>
                                        {cliente.nombre_empresa.substring(0, 1)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-black text-enterprise-950 tracking-tight group-hover:text-brand-orange transition-colors truncate">
                                            {cliente.nombre_empresa}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                            <User size={10} className="text-gray-300" />
                                            <span className="truncate">{cliente.nombre_contacto || 'Sin contacto'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Etapa (Middle-left on mobile) */}
                                <div className="col-span-6 lg:col-span-2 flex justify-start lg:justify-center mb-4 lg:mb-0">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-tighter shadow-sm ${getStageColor(cliente.etapa)}`}>
                                        {cliente.etapa || 'Paso 1'}
                                    </span>
                                </div>

                                {/* Plaza (Middle-right on mobile) */}
                                <div className="col-span-6 lg:col-span-2 flex items-center justify-end lg:justify-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-4 lg:mb-0">
                                    <MapPin size={12} className="text-red-500/50" />
                                    {cliente.plaza || 'Mérida'}
                                </div>

                                {/* Segmento (Bottom-left on mobile) */}
                                <div className="col-span-6 lg:col-span-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                                    <Building2 size={12} className="text-gray-300" />
                                    {cliente.segmento || 'General'}
                                </div>

                                {/* Accción (Bottom-right on mobile) */}
                                <div className="col-span-6 lg:col-span-1 flex justify-end">
                                    <div className="w-8 h-8 rounded-full bg-enterprise-50 group-hover:bg-brand-orange group-hover:text-white flex items-center justify-center transition-all text-enterprise-300">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center bg-white">
                            <Users className="mx-auto text-enterprise-100 mb-4" size={48} />
                            <p className="text-enterprise-400 font-black uppercase text-xs tracking-widest">Sin coincidencias en el CRM</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Disclaimer inferior */}
            <div className="text-center">
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em]">Propiedad de Televisa Interactive Mérida © 2025</p>
            </div>
        </div>
    );
};

export default CRMView;
