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
    setMensaje,
    contratosEjecucion = [],
    perfil
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('todos');
    const [isUpdating, setIsUpdating] = useState(false);
    const [confirmingAction, setConfirmingAction] = useState(null);

    const historialFiltrado = useMemo(() => {
        return (historial || []).filter(cotz => {
            const nombreCliente = (cotz.cliente?.nombre_empresa || '').toLowerCase();
            const idCotz = (cotz.id || '').toLowerCase();
            const query = busqueda.toLowerCase();
            const matchesSearch = nombreCliente.includes(query) || idCotz.includes(query);
            const matchesEstatus = filtroEstatus === 'todos' || cotz.estatus === filtroEstatus;
            return matchesSearch && matchesEstatus;
        });
    }, [historial, busqueda, filtroEstatus]);

    const handleUpdateStatus = async (quote, newStatus) => {
        setIsUpdating(true);
        try {
            const payload = { id: quote.id, estatus: newStatus };
            if (newStatus === 'ganada') {
                payload.fecha_cierre_real = new Date().toISOString();
            }
            const success = await onSaveQuote('cotizaciones', payload);
            if (success) {
                setMensaje({ tipo: 'exito', texto: `Estatus: ${newStatus.toUpperCase()}` });
                setConfirmingAction(null);
            }
        } catch (err) {
            console.error(err);
            setConfirmingAction(null);
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmAction = (message, onConfirm) => {
        setConfirmingAction({ message, onConfirm });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-premium-fade px-4">
            {/* NEXUS HISTORY STATION HUB */}
            <div className="bg-enterprise-950 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-brand-orange/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-brand-orange/5 blur-3xl rounded-full" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-orange shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <FileText size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-3">
                                Pipeline <span className="text-brand-orange">Histórico</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                                <span>Logs Maestros de Infraestructura</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="text-brand-orange/80">Registros Capturados: {historialFiltrado.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl w-full flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-orange transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="BUSCAR SOCIO O FOLIO..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest outline-none focus:bg-white/10 focus:border-brand-orange transition-all placeholder:text-white/20"
                            />
                        </div>
                        <select
                            value={filtroEstatus}
                            onChange={(e) => setFiltroEstatus(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[9px] font-black text-white uppercase tracking-widest outline-none cursor-pointer hover:bg-white/10 transition-all appearance-none text-center"
                        >
                            <option value="todos" className="bg-enterprise-950">TODOS LOS ESTATUS</option>
                            <option value="enviada" className="bg-enterprise-950">SOLO ENVIADAS</option>
                            <option value="ganada" className="bg-enterprise-950">SOLO GANADAS</option>
                            <option value="perdida" className="bg-enterprise-950">SOLO PERDIDAS</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-premium border border-enterprise-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-enterprise-950 text-white border-b border-white/5">
                                <th className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-[0.2em] opacity-40 italic">Fecha Sinc.</th>
                                <th className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-[0.2em] opacity-40 italic">Socio Corporativo</th>
                                <th className="px-4 py-3 text-center text-[8px] font-black uppercase tracking-[0.2em] opacity-40 italic">Fase</th>
                                <th className="px-4 py-3 text-right text-[8px] font-black uppercase tracking-[0.2em] opacity-40 italic">Valor Neto</th>
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
                                                {cotz.cliente?.nombre_empresa || 'Identidad Prospecto'}
                                            </span>
                                            <span className="text-[7px] font-black text-brand-orange uppercase">{cotz.folio || cotz.id.slice(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center gap-1">
                                            {['enviada', 'ganada', 'perdida'].map(st => {
                                                const hasContracts = (contratosEjecucion || []).some(ce => String(ce.cotizacion_id) === String(cotz.id));

                                                return (
                                                    <div key={st} className="relative group/st">
                                                        <button
                                                            onClick={() => {
                                                                if (st === cotz.estatus) return;
                                                                confirmAction(
                                                                    `¿Cambiar estatus de la cotización ${cotz.folio || cotz.id} a ${st.toUpperCase()}?`,
                                                                    () => handleUpdateStatus(cotz, st)
                                                                );
                                                            }}
                                                            disabled={cotz.estatus === 'ganada' && st !== 'ganada' && hasContracts}
                                                            className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest transition-all ${cotz.estatus === st
                                                                ? st === 'ganada' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : st === 'perdida' ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'bg-enterprise-950 text-white shadow-lg shadow-enterprise-950/20'
                                                                : 'bg-enterprise-100 text-enterprise-300 hover:bg-enterprise-200'
                                                                } ${cotz.estatus === 'ganada' && st !== 'ganada' && hasContracts ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                        >
                                                            {st}
                                                        </button>
                                                        {st === 'ganada' && cotz.estatus === 'ganada' && !hasContracts && perfil?.rol === 'Gerencia' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    confirmAction(
                                                                        '¿Reabrir cotización para ajustes finos? (Se perderá la fecha de cierre original)',
                                                                        () => handleUpdateStatus(cotz, 'enviada')
                                                                    );
                                                                }}
                                                                className="absolute -right-2 -top-2 bg-white border border-brand-orange text-brand-orange rounded-full p-1 opacity-0 group-hover/st:opacity-100 transition-all hover:bg-brand-orange hover:text-white shadow-lg z-10"
                                                                title="Reabrir para edición"
                                                            >
                                                                <RefreshCw size={8} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-enterprise-950 text-[10px] italic">
                                        {formatMXN(cotz.subtotalGeneral || (cotz.monto_total || cotz.total) / 1.16)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button onClick={() => { setCotizacion(cotz); setVistaActual('cotizador'); }} className="w-7 h-7 flex items-center justify-center bg-enterprise-50 text-enterprise-400 hover:bg-enterprise-950 hover:text-white rounded-lg transition-all"><Eye size={12} /></button>
                                            <button onClick={() => mostrarPropuesta(cotz)} className="w-7 h-7 flex items-center justify-center bg-enterprise-50 text-enterprise-400 hover:bg-brand-orange hover:text-white rounded-lg transition-all"><Printer size={12} /></button>
                                            {perfil?.rol === 'Gerencia' && (
                                                <button onClick={() => {
                                                    confirmAction(
                                                        '¿Estás seguro de eliminar este registro permanentemente?',
                                                        () => eliminarCotizacion(cotz.id)
                                                    );
                                                }} className="w-7 h-7 flex items-center justify-center bg-enterprise-50 text-enterprise-400 hover:text-brand-orange rounded-lg transition-all"><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-enterprise-300 font-black uppercase text-[8px] italic tracking-widest opacity-40">Historial de Infraestructura Vacío</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custom Interactive Confirmation Modal */}
            {confirmingAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-enterprise-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 bg-enterprise-50 rounded-2xl flex items-center justify-center text-brand-orange">
                                <AlertCircle size={32} strokeWidth={2.5} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-black text-enterprise-950 uppercase tracking-widest italic leading-tight">
                                    Confirmación de Sistema
                                </h3>
                                <p className="text-[10px] font-bold text-enterprise-400 uppercase tracking-tight leading-relaxed px-4">
                                    {confirmingAction.message}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full pt-4">
                                <button
                                    onClick={() => setConfirmingAction(null)}
                                    className="h-12 text-[9px] font-black uppercase tracking-[0.2em] text-enterprise-300 hover:text-enterprise-950 hover:bg-enterprise-50 rounded-2xl transition-all"
                                >
                                    Abortar
                                </button>
                                <button
                                    onClick={confirmingAction.onConfirm}
                                    disabled={isUpdating}
                                    className="h-12 bg-enterprise-950 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-brand-orange shadow-lg shadow-enterprise-950/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isUpdating ? 'Procesando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryView;
