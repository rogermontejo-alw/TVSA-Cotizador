import React, { useState, useMemo } from 'react';
import {
    FileText, Printer, Eye, Trash2, Search, AlertCircle, RefreshCw, CalendarDays, BadgeDollarSign, MoreHorizontal
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const HistoryView = ({
    setVistaActual,
    historial = [],
    setCotizacion,
    mostrarPropuesta,
    eliminarCotizacion,
    onSaveQuote,
    setMensaje
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroVix, setFiltroVix] = useState('todos');
    const [confirmingStatus, setConfirmingStatus] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const [cierreData, setCierreData] = useState({
        numero_contrato: '',
        mc_id: '',
        fecha_registro_sistema: '',
        folio_sistema: ''
    });

    const openStatusModal = (quote, status) => {
        setConfirmingStatus({ quote, status });
        if (status === 'ganada') {
            setCierreData({
                numero_contrato: quote.numero_contrato || '',
                mc_id: quote.mc_id || '',
                fecha_registro_sistema: quote.fecha_registro_sistema || '',
                folio_sistema: quote.folio_sistema || ''
            });
        }
    };

    const historialFiltrado = useMemo(() => {
        return (historial || []).filter(cotz => {
            const nombreCliente = (cotz.cliente?.nombre_empresa || '').toLowerCase();
            const idCotz = (cotz.id || '').toLowerCase();
            const query = busqueda.toLowerCase();
            const matchesSearch = nombreCliente.includes(query) || idCotz.includes(query);
            const matchesVix = filtroVix === 'todos' || (filtroVix === 'vix' && cotz.paqueteVIX?.nombre !== 'Ninguno') || (filtroVix === 'no_vix' && (!cotz.paqueteVIX || cotz.paqueteVIX.nombre === 'Ninguno'));
            return matchesSearch && matchesVix;
        });
    }, [historial, busqueda, filtroVix]);

    const handleUpdateStatus = async (quote, newStatus) => {
        if (newStatus === 'ganada' && !cierreData.numero_contrato) {
            setMensaje({ tipo: 'error', texto: 'Contrato requerido.' });
            return;
        }
        setIsUpdating(true);
        try {
            const payload = { id: quote.id, estatus: newStatus };
            if (newStatus === 'ganada') {
                payload.numero_contrato = parseInt(cierreData.numero_contrato);
                payload.mc_id = cierreData.mc_id || null;
            }
            const success = await onSaveQuote('cotizaciones', payload);
            if (success) {
                setMensaje({ tipo: 'exito', texto: `Status: ${newStatus.toUpperCase()}` });
                setConfirmingStatus(null);
            }
        } catch (err) { console.error(err); } finally { setIsUpdating(false); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-4 animate-premium-fade">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-sm font-black text-enterprise-950 tracking-widest uppercase italic leading-none mb-1 text-center md:text-left">
                        Historical <span className="text-brand-orange not-italic">Pipeline</span>
                    </h1>
                    <p className="text-[8px] font-black text-enterprise-400 uppercase tracking-[0.3em] text-center md:text-left">Master Infrastructure Logs</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-premium border border-enterprise-100 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-300" size={12} />
                        <input
                            type="text"
                            placeholder="SEARCH PARTNER..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full h-8 bg-enterprise-50 border border-enterprise-100 rounded-lg pl-8 pr-3 text-[9px] font-black outline-none focus:border-brand-orange uppercase"
                        />
                    </div>
                    <select
                        value={filtroVix}
                        onChange={(e) => setFiltroVix(e.target.value)}
                        className="h-8 bg-enterprise-50 border border-enterprise-100 rounded-lg px-3 text-[8px] font-black uppercase tracking-widest outline-none cursor-pointer"
                    >
                        <option value="todos">ALL ASSETS</option>
                        <option value="vix">VIX ONLY</option>
                        <option value="no_vix">LINEAR ONLY</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-premium border border-enterprise-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-enterprise-950 text-white border-b border-white/5">
                                <th className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-[0.2em] opacity-40 italic">Sync Date</th>
                                <th className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-[0.2em] opacity-40 italic">Corporate Partner</th>
                                <th className="px-4 py-3 text-center text-[8px] font-black uppercase tracking-[0.2em] opacity-40 italic">Phase</th>
                                <th className="px-4 py-3 text-right text-[8px] font-black uppercase tracking-[0.2em] opacity-40 italic">Net Value</th>
                                <th className="px-4 py-3 text-center text-[8px] font-black uppercase tracking-[0.2em] opacity-40 italic">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-enterprise-50">
                            {historialFiltrado.length > 0 ? historialFiltrado.map(cotz => (
                                <tr key={cotz.id} className="hover:bg-enterprise-50/50 transition-all">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays size={12} className="text-enterprise-300" />
                                            <span className="text-[9px] font-black text-enterprise-900 uppercase">
                                                {cotz.fecha instanceof Date && !isNaN(cotz.fecha) ? cotz.fecha.toLocaleDateString('es-MX') : '--/--'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <span className="block text-[10px] font-black text-enterprise-950 uppercase truncate max-w-[180px]">
                                                {cotz.cliente?.nombre_empresa || 'Prospect Identity'}
                                            </span>
                                            <span className="text-[7px] font-black text-brand-orange uppercase">{cotz.folio || cotz.id.slice(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center gap-1">
                                            {['enviada', 'ganada', 'perdida'].map(st => (
                                                <button
                                                    key={st}
                                                    onClick={() => openStatusModal(cotz, st)}
                                                    className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest transition-all ${cotz.estatus === st
                                                        ? st === 'ganada' ? 'bg-emerald-500 text-white' : st === 'perdida' ? 'bg-brand-orange text-white' : 'bg-enterprise-950 text-white'
                                                        : 'bg-enterprise-100 text-enterprise-300 hover:bg-enterprise-200'
                                                        }`}
                                                >
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-enterprise-950 text-[10px] italic">
                                        {formatMXN(cotz.subtotalGeneral || (cotz.monto_total || cotz.total) / 1.16)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button onClick={() => { setCotizacion(cotz); setVistaActual('cotizador'); }} className="w-7 h-7 flex items-center justify-center bg-enterprise-50 text-enterprise-400 hover:bg-enterprise-950 hover:text-white rounded-lg transition-all"><Eye size={12} /></button>
                                            <button onClick={() => mostrarPropuesta(cotz)} className="w-7 h-7 flex items-center justify-center bg-enterprise-50 text-enterprise-400 hover:bg-brand-orange hover:text-white rounded-lg transition-all"><Printer size={12} /></button>
                                            <button onClick={() => { if (window.confirm('Delete log?')) eliminarCotizacion(cotz.id); }} className="w-7 h-7 flex items-center justify-center bg-enterprise-50 text-enterprise-400 hover:text-brand-orange rounded-lg transition-all"><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-enterprise-300 font-black uppercase text-[8px] italic tracking-widest opacity-40">Empty Infrastructure History</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Normalized */}
            {confirmingStatus && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-enterprise-950/80 backdrop-blur-sm animate-premium-fade">
                    <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl border border-enterprise-100">
                        <h3 className="text-center text-[10px] font-black text-enterprise-950 uppercase italic tracking-widest mb-4">Pipeline Status: {confirmingStatus.status}</h3>
                        {confirmingStatus.status === 'ganada' && (
                            <div className="space-y-3 mb-6">
                                <input
                                    type="number"
                                    value={cierreData.numero_contrato}
                                    onChange={(e) => setCierreData({ ...cierreData, numero_contrato: e.target.value })}
                                    className="w-full h-10 px-4 bg-enterprise-50 rounded-xl text-[10px] font-black outline-none placeholder:text-enterprise-300"
                                    placeholder="CONTRACT REF..."
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setConfirmingStatus(null)} className="h-9 text-[9px] font-black uppercase text-enterprise-400 hover:bg-enterprise-50 rounded-lg">Abort</button>
                            <button onClick={() => handleUpdateStatus(confirmingStatus.quote, confirmingStatus.status)} className="h-9 bg-enterprise-950 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-orange">Commit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryView;
