import React, { useState } from 'react';
import { DollarSign, Search, Calendar, FileText, CheckCircle2, Clock, AlertCircle, Building2 } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const CobranzaView = ({ cobranza, setMensaje }) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('todos');

    const filtrados = (cobranza || []).filter(c => {
        const matchesBusqueda =
            c.cotizaciones?.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.cotizaciones?.clientes?.nombre_empresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.numero_factura?.toLowerCase().includes(busqueda.toLowerCase());

        const matchesEstatus = filtroEstatus === 'todos' || c.estatus_pago === filtroEstatus;

        return matchesBusqueda && matchesEstatus;
    });

    const stats = {
        total: filtrados.reduce((sum, c) => sum + parseFloat(c.monto_facturado), 0),
        cobrado: filtrados.filter(c => c.estatus_pago === 'cobrado').reduce((sum, c) => sum + parseFloat(c.monto_facturado), 0),
        pendiente: filtrados.filter(c => c.estatus_pago !== 'cobrado').reduce((sum, c) => sum + parseFloat(c.monto_facturado), 0)
    };

    const getEstatusInfo = (estatus) => {
        switch (estatus) {
            case 'cobrado':
                return { label: 'Cobrado', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> };
            case 'vencido':
                return { label: 'Vencido', color: 'bg-red-100 text-red-700', icon: <AlertCircle size={12} /> };
            case 'programado':
                return { label: 'Programado', color: 'bg-blue-100 text-blue-700', icon: <Calendar size={12} /> };
            default:
                return { label: 'Pendiente', color: 'bg-gray-100 text-gray-700', icon: <Clock size={12} /> };
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header / Stats Compactos en movil */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[2rem] shadow-lg border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Facturado</p>
                    <h4 className="text-xl font-black text-slate-900">{formatMXN(stats.total)}</h4>
                </div>
                <div className="bg-white p-5 rounded-[2rem] shadow-lg border border-gray-100 border-l-4 border-l-green-500">
                    <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Cobrado</p>
                    <h4 className="text-xl font-black text-green-600">{formatMXN(stats.cobrado)}</h4>
                </div>
                <div className="bg-white p-5 rounded-[2rem] shadow-lg border border-gray-100 border-l-4 border-l-red-500">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Pendiente</p>
                    <h4 className="text-xl font-black text-red-600">{formatMXN(stats.pendiente)}</h4>
                </div>
            </div>

            {/* Buscador y Filtro movil-ready */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente o factura..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    />
                </div>
                <div className="flex overflow-x-auto gap-2 scrollbar-hide">
                    {['todos', 'pendiente', 'programado', 'cobrado', 'vencido'].map(estatus => (
                        <button
                            key={estatus}
                            onClick={() => setFiltroEstatus(estatus)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border
                                ${filtroEstatus === estatus
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-red-200'}`}
                        >
                            {estatus}
                        </button>
                    ))}
                </div>
            </div>

            {/* Listado tipo Tarjetas para Máxima Compatibilidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtrados.length > 0 ? filtrados.map((c) => {
                    const info = getEstatusInfo(c.estatus_pago);
                    return (
                        <div key={c.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-100 hover:border-red-100 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-sm ${info.color}`}>
                                    {info.icon} {info.label}
                                </span>
                                <div className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded tracking-tighter">
                                    FACTURA: {c.numero_factura || 'PEND.'}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                                    <Building2 size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">{c.cotizaciones?.clientes?.nombre_empresa}</h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{c.cotizaciones?.folio}</p>
                                </div>
                            </div>

                            <div className="flex items-end justify-between border-t border-gray-50 pt-4 mt-2">
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <Calendar size={10} /> {c.fecha_programada_cobro ? 'Compromiso' : 'S/ Programar'}
                                    </p>
                                    <p className="text-[11px] font-black text-slate-700">
                                        {c.fecha_programada_cobro ? new Date(c.fecha_programada_cobro).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto Neto</p>
                                    <p className="text-lg font-black text-slate-900">{formatMXN(c.monto_facturado)}</p>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                        <DollarSign className="mx-auto text-gray-200 mb-4" size={48} />
                        <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No hay registros de cobranza en esta etapa</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CobranzaView;
