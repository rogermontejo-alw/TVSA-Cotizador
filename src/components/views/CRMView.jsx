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
            case 'Cliente': return 'bg-green-500';
            case 'No Interesado': return 'bg-gray-400';
            case 'Prospecto': return 'bg-blue-500';
            case 'Contactado': return 'bg-orange-500';
            case 'Interesado': return 'bg-red-600';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header CRM Compacto */}
            <div className="bg-slate-900 p-4 rounded-2xl md:rounded-b-none flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <Briefcase size={20} className="text-red-500" />
                    <h3 className="text-sm font-black text-white uppercase flex items-center gap-3">
                        Pipeline de Clientes
                    </h3>
                </div>

                <button
                    onClick={onAddNewClient}
                    className="w-full md:w-auto px-4 py-1.5 bg-red-600 text-white rounded-lg font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    <Plus size={14} /> Alta de Prospecto
                </button>
            </div>

            {/* Filtros de Navegación */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar por empresa o contacto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-bold shadow-sm focus:ring-1 focus:ring-red-500 outline-none transition-all"
                    />
                </div>

                <div className="flex bg-slate-900 rounded-xl p-1 w-fit overflow-x-auto scrollbar-hide">
                    {etapas.map(etapa => (
                        <button
                            key={etapa}
                            onClick={() => setFiltroEtapa(etapa)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all
                                ${filtroEtapa === etapa
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {etapa}
                        </button>
                    ))}
                </div>
            </div>

            {/* Listado de Clientes (Formato Lista Responsive) */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                {/* Header de la Lista (Solo Desktop) */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 border-b border-gray-100 items-center">
                    <div className="col-span-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Empresa / Contacto</div>
                    <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Etapa CRM</div>
                    <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Plaza</div>
                    <div className="col-span-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Segmento</div>
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
                                        <h3 className="text-sm font-black text-slate-900 tracking-tight group-hover:text-red-600 transition-colors truncate">
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
                                    <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-all text-gray-300">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center bg-white">
                            <Users className="mx-auto text-gray-100 mb-4" size={48} />
                            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Sin coincidencias en el CRM</p>
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
