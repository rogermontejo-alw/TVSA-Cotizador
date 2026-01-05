import React, { useState } from 'react';
import { Search, Users, Briefcase, Plus, ChevronRight, MapPin, Building2, User, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

const CRMView = ({ clientes, onSelectClient, onAddNewClient }) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEtapa, setFiltroEtapa] = useState('Todas');
    const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'

    const etapas = ['Todas', 'Prospecto', 'Contactado', 'Interesado', 'No Interesado', 'Cliente'];

    const clientesFiltrados = (clientes || []).filter(c => {
        const matchBusqueda = (c.nombre_empresa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.nombre_contacto || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(busqueda.toLowerCase());
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

    const handleExportExcel = () => {
        try {
            const wb = XLSX.utils.book_new();

            // Estilos
            const headerStyle = {
                font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
                fill: { fgColor: { rgb: "0F172A" } },
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
            };
            const titleStyle = { font: { bold: true, sz: 14, color: { rgb: "0F172A" } } };
            const metaStyle = { font: { italic: true, sz: 9, color: { rgb: "64748B" } } };
            const cellStyle = { font: { sz: 9 }, alignment: { vertical: "center", wrapText: true } };

            const headers = ["EMPRESA / RAZÓN SOCIAL", "CONTACTO", "EMAIL", "TELÉFONO", "PLAZA", "SEGMENTO", "ETAPA CRM"];
            const wsData = [
                [{ v: "NEXUS CRM - DIRECTORIO MAESTRO", s: titleStyle }],
                [{ v: "TELEVISA UNIVISION INTERACTIVE", s: metaStyle }],
                [{ v: `FECHA DE EXPORTACIÓN: ${new Date().toLocaleString()}`, s: metaStyle }],
                [{ v: `TOTAL DE REGISTROS: ${clientesFiltrados.length}`, s: metaStyle }],
                [],
                headers.map(h => ({ v: h, s: headerStyle }))
            ];

            clientesFiltrados.forEach(c => {
                wsData.push([
                    { v: c.nombre_empresa?.toUpperCase() || '', s: cellStyle },
                    { v: c.nombre_contacto || '', s: cellStyle },
                    { v: (c.email || '').toLowerCase(), s: cellStyle },
                    { v: c.telefono || '', s: cellStyle },
                    { v: c.plaza || '', s: cellStyle },
                    { v: c.segmento || '', s: cellStyle },
                    { v: c.etapa?.toUpperCase() || '', s: { ...cellStyle, font: { ...cellStyle.font, bold: true } } }
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Configurar anchos
            ws['!cols'] = [
                { wch: 40 }, // Empresa
                { wch: 25 }, // Contacto
                { wch: 35 }, // Email
                { wch: 20 }, // Tel
                { wch: 15 }, // Plaza
                { wch: 15 }, // Segmento
                { wch: 20 }  // Etapa
            ];

            XLSX.utils.book_append_sheet(wb, ws, "Directorio Clientes");
            XLSX.writeFile(wb, `Nexus_Directorio_CRM_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (error) {
            console.error("Error al exportar Excel:", error);
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
                                Directorio <span className="text-brand-orange">Estratégico</span> CRM
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                                <span>Master Database de Cuentas</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="text-brand-orange/80">Entidades Registradas: {clientesFiltrados.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-center">
                        {/* View Switcher */}
                        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex mr-2">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'cards' ? 'bg-brand-orange text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                Tarjetas
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-brand-orange text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                Directorio
                            </button>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            {/* BOTÓN EXPORTAR ICONO SOLO */}
                            <button
                                onClick={handleExportExcel}
                                className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 transition-all shadow-xl active:scale-95 group/exp"
                                title="Exportar Directorio a Excel"
                            >
                                <Download size={20} className="group-hover/exp:animate-bounce" />
                            </button>

                            <button
                                onClick={onAddNewClient}
                                className="flex-1 sm:flex-none px-8 py-3.5 bg-brand-orange text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-brand-orange/90 transition-all shadow-xl shadow-brand-orange/20 active:scale-95 group/btn"
                            >
                                <Plus size={16} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                                Cliente
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation & Intelligence Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-[2rem] border border-enterprise-100 shadow-premium">
                <div className="flex-1 relative w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-enterprise-400 group-focus-within:text-brand-orange transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="BUSCAR POR NOMBRE, CONTACTO O CORREO ELECTRÓNICO..."
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

            {/* Lista o Tabla de Clientes */}
            <div className="bg-white rounded-[2.5rem] shadow-premium border border-enterprise-100 overflow-hidden min-h-[400px]">
                {viewMode === 'cards' ? (
                    <>
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
                                        <div className="col-span-12 lg:col-span-4 flex items-center gap-4 mb-4 lg:mb-0">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm ${getStageColor(cliente.etapa)}`}>
                                                {(cliente.nombre_empresa || 'X').substring(0, 1)}
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

                                        <div className="col-span-6 lg:col-span-2 flex justify-start lg:justify-center mb-4 lg:mb-0">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-tighter shadow-sm ${getStageColor(cliente.etapa)}`}>
                                                {cliente.etapa || 'Paso 1'}
                                            </span>
                                        </div>

                                        <div className="col-span-6 lg:col-span-2 flex items-center justify-end lg:justify-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-4 lg:mb-0">
                                            <MapPin size={12} className="text-red-500/50" />
                                            {cliente.plaza || 'Mérida'}
                                        </div>

                                        <div className="col-span-6 lg:col-span-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                                            <Building2 size={12} className="text-gray-300" />
                                            {cliente.segmento || 'General'}
                                        </div>

                                        <div className="col-span-6 lg:col-span-1 flex justify-end">
                                            <div className="w-8 h-8 rounded-full bg-enterprise-50 group-hover:bg-brand-orange group-hover:text-white flex items-center justify-center transition-all text-enterprise-300">
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <ViewEmptyState />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-enterprise-950 text-white">
                                    <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.3em] italic opacity-50">Empresa / Razón Social</th>
                                    <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.3em] italic opacity-50">Contacto Principal</th>
                                    <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.3em] italic opacity-50 px-4">Correo Electrónico</th>
                                    <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.3em] italic opacity-50">Teléfono</th>
                                    <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.3em] italic opacity-50 text-center">Plaza</th>
                                    <th className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.3em] italic opacity-50 text-center">Estatus CRM</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {clientesFiltrados.length > 0 ? (
                                    clientesFiltrados.map(cliente => (
                                        <tr
                                            key={cliente.id}
                                            onClick={() => onSelectClient(cliente)}
                                            className="hover:bg-enterprise-50/50 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg ${getStageColor(cliente.etapa)} flex items-center justify-center text-white font-black text-xs`}>
                                                        {(cliente.nombre_empresa || 'X').substring(0, 1)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-enterprise-950 group-hover:text-brand-orange transition-colors truncate max-w-[200px]">{cliente.nombre_empresa}</p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{cliente.segmento || 'PYME'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-bold text-enterprise-800">{cliente.nombre_contacto || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-medium text-blue-600 lowercase">{cliente.email || 'sin correo'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-black text-enterprise-700 tracking-tighter">{cliente.telefono || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[9px] font-black text-white bg-enterprise-950 px-2.5 py-1 rounded-lg uppercase italic">{cliente.plaza}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-tighter shadow-sm ${getStageColor(cliente.etapa)}`}>
                                                    {cliente.etapa || 'Lead'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-orange" />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7">
                                            <ViewEmptyState />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Disclaimer inferior */}
            <div className="text-center">
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em]">Propiedad de Televisa Interactive Mérida © 2025</p>
            </div>
        </div>
    );
};

const ViewEmptyState = () => (
    <div className="py-20 text-center bg-white">
        <Users className="mx-auto text-enterprise-100 mb-4" size={48} />
        <p className="text-enterprise-400 font-black uppercase text-xs tracking-widest">Sin coincidencias en el CRM</p>
    </div>
);

export default CRMView;
