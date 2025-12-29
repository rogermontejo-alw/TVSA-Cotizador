import React, { useState, useMemo } from 'react';
import {
    ArrowLeft,
    FileText,
    Printer,
    Eye,
    Trash2,
    Search,
    Filter,
    AlertCircle,
    RefreshCw,
    Briefcase,
    CalendarDays,
    BadgeDollarSign,
    MoreHorizontal
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const HistoryView = ({
    setVistaActual,
    historial = [],
    setCotizacion,
    agregarAComparador,
    mostrarPropuesta,
    eliminarCotizacion,
    onSaveQuote,
    setMensaje,
    masterContracts = []
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
            const plazaCliente = (cotz.cliente?.plaza || '').toLowerCase();
            const query = busqueda.toLowerCase();

            const matchesSearch =
                nombreCliente.includes(query) ||
                idCotz.includes(query) ||
                plazaCliente.includes(query);

            const matchesVix =
                filtroVix === 'todos' ||
                (filtroVix === 'vix' && cotz.paqueteVIX?.nombre !== 'Ninguno') ||
                (filtroVix === 'no_vix' && (!cotz.paqueteVIX || cotz.paqueteVIX.nombre === 'Ninguno'));

            return matchesSearch && matchesVix;
        });
    }, [historial, busqueda, filtroVix]);

    const handleUpdateStatus = async (quote, newStatus) => {
        if (newStatus === 'ganada' && !cierreData.numero_contrato) {
            setMensaje({ tipo: 'error', texto: 'El número de contrato es obligatorio.' });
            return;
        }

        setIsUpdating(true);
        try {
            const payload = { id: quote.id, estatus: newStatus };

            if (newStatus === 'ganada') {
                payload.numero_contrato = parseInt(cierreData.numero_contrato);
                payload.mc_id = cierreData.mc_id || null;
                payload.fecha_registro_sistema = cierreData.fecha_registro_sistema || null;
                payload.folio_sistema = cierreData.folio_sistema || null;
                payload.fecha_cierre_real = quote.fecha_cierre_real || new Date().toISOString();
            }

            const success = await onSaveQuote('cotizaciones', payload);
            if (success) {
                setMensaje({ tipo: 'exito', texto: `Estatus actualizado: ${newStatus.toUpperCase()}` });

                if (newStatus === 'ganada') {
                    await onSaveQuote('cobranza', {
                        cotizacion_id: quote.id,
                        monto_facturado: quote.subtotalGeneral || quote.data?.total / 1.16 || quote.total / 1.16,
                        estatus_pago: 'pendiente',
                        notas: `Contrato: ${cierreData.numero_contrato}`
                    });
                }

                setConfirmingStatus(null);
                setCierreData({ numero_contrato: '', mc_id: '', fecha_registro_sistema: '', folio_sistema: '' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6 animate-premium-fade">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 sm:gap-4 mb-2">
                        <button
                            onClick={() => setVistaActual('cotizador')}
                            className="p-2 sm:p-2.5 bg-white rounded-2xl shadow-premium border border-enterprise-100 text-enterprise-400 hover:text-brand-orange transition-all active:scale-90"
                        >
                            <ArrowLeft size={window.innerWidth < 640 ? 16 : 20} />
                        </button>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-enterprise-950 tracking-tight leading-none uppercase italic italic-brand">
                            Historical <span className="text-brand-orange not-italic">Records</span>
                        </h1>
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-bold text-enterprise-500 uppercase tracking-widest ml-12 sm:ml-14">
                        Master Database / Commercial Activity
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl shadow-premium border border-enterprise-100 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Buscar Cliente o ID..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full h-11 bg-enterprise-50 border border-enterprise-100 rounded-xl pl-10 pr-4 text-xs font-bold focus:border-brand-orange outline-none transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-400" size={16} />
                    </div>
                    <select
                        value={filtroVix}
                        onChange={(e) => setFiltroVix(e.target.value)}
                        className="h-11 bg-enterprise-50 border border-enterprise-100 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer"
                    >
                        <option value="todos">Todos los Escenarios</option>
                        <option value="vix">Plan Digital VIX</option>
                        <option value="no_vix">Televisión Abierta</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[2.5rem] shadow-premium border border-enterprise-100 overflow-hidden">
                {/* Desktop view */}
                <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-enterprise-950 text-white border-b border-white/5">
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Timeline</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Entidad Legal / Referencia</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Fase Comercial</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Carga</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Valor Neto</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-enterprise-50">
                            {historialFiltrado.length > 0 ? historialFiltrado.map(cotz => (
                                <tr key={cotz.id} className="group hover:bg-enterprise-50/50 transition-all duration-300">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-enterprise-100 flex flex-col items-center justify-center">
                                                <CalendarDays size={16} className="text-enterprise-400" />
                                            </div>
                                            <div>
                                                <span className="block text-xs font-black text-enterprise-900 leading-none mb-1">
                                                    {cotz.fecha instanceof Date && !isNaN(cotz.fecha) ? cotz.fecha.toLocaleDateString('es-MX') : '-- / --'}
                                                </span>
                                                <span className="text-[10px] font-bold text-enterprise-400 uppercase tracking-tighter">Sincronizado</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div>
                                            <span className="block text-sm font-black text-enterprise-950 uppercase truncate max-w-[200px] mb-1">
                                                {cotz.cliente?.nombre_empresa || 'Cliente S/N'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest">{cotz.folio || cotz.id.slice(0, 8)}</span>
                                                {cotz.numero_contrato && (
                                                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase">CT: {cotz.numero_contrato}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center gap-1.5">
                                            {['enviada', 'ganada', 'perdida'].map(st => (
                                                <button
                                                    key={st}
                                                    onClick={() => openStatusModal(cotz, st)}
                                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${cotz.estatus === st
                                                        ? st === 'ganada' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : st === 'perdida' ? 'bg-brand-magenta text-white shadow-lg shadow-brand-magenta/20' : 'bg-enterprise-950 text-white shadow-lg shadow-enterprise-950/20'
                                                        : 'bg-enterprise-100 text-enterprise-400 hover:bg-enterprise-200'
                                                        }`}
                                                >
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-8 h-8 rounded-lg bg-enterprise-50 flex items-center justify-center text-[10px] font-black text-enterprise-600" title="Productos">{cotz.items.length}P</span>
                                            {cotz.paqueteVIX && <div className="w-3 h-3 rounded-full bg-brand-orange animate-pulse" title="Digital Activo" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-enterprise-900 tracking-tight">
                                        {formatMXN(cotz.subtotalGeneral || (cotz.monto_total || cotz.total) / 1.16)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => { setCotizacion(cotz); setVistaActual('cotizador'); }}
                                                className="w-9 h-9 flex items-center justify-center bg-enterprise-50 text-enterprise-400 hover:bg-enterprise-950 hover:text-white rounded-xl transition-all"
                                                title="Revisar Parámetros"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => mostrarPropuesta(cotz)}
                                                className="w-9 h-9 flex items-center justify-center bg-enterprise-50 text-enterprise-500 hover:bg-brand-orange hover:text-white rounded-xl transition-all"
                                                title="Generar Exportable"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                onClick={() => { if (window.confirm('Eliminar registro?')) eliminarCotizacion(cotz.id); }}
                                                className="w-9 h-9 flex items-center justify-center bg-enterprise-50 text-enterprise-500 hover:bg-brand-orange/10 hover:text-brand-orange rounded-xl transition-all"
                                                title="Archivar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-enterprise-400 font-bold uppercase text-[10px] italic tracking-widest">No hay actividad registrada</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view */}
                <div className="lg:hidden divide-y divide-enterprise-50">
                    {historialFiltrado.length > 0 ? historialFiltrado.map(cotz => (
                        <div key={cotz.id} className="p-6 space-y-4 hover:bg-enterprise-50/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black text-enterprise-950 uppercase line-clamp-1">{cotz.cliente?.nombre_empresa || 'S/N'}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest">{cotz.folio || cotz.id.slice(0, 8)}</span>
                                        {cotz.numero_contrato && (
                                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase">CT: {cotz.numero_contrato}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-enterprise-900 tracking-tight">
                                        {formatMXN(cotz.subtotalGeneral || (cotz.monto_total || cotz.total) / 1.16)}
                                    </p>
                                    <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-widest">
                                        {cotz.fecha instanceof Date && !isNaN(cotz.fecha) ? cotz.fecha.toLocaleDateString('es-MX') : '--/--'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-3 border-y border-enterprise-50">
                                <div className="flex gap-1">
                                    {['enviada', 'ganada', 'perdida'].map(st => (
                                        <button
                                            key={st}
                                            onClick={() => openStatusModal(cotz, st)}
                                            className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${cotz.estatus === st
                                                ? st === 'ganada' ? 'bg-emerald-500 text-white shadow-md' : st === 'perdida' ? 'bg-brand-magenta text-white shadow-md' : 'bg-enterprise-950 text-white shadow-md'
                                                : 'bg-enterprise-50 text-enterprise-400'
                                                }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-enterprise-600 bg-enterprise-50 px-2 py-0.5 rounded-md">{cotz.items.length}P</span>
                                    {cotz.paqueteVIX && <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setCotizacion(cotz); setVistaActual('cotizador'); }}
                                    className="flex-1 h-10 flex items-center justify-center bg-enterprise-50 text-enterprise-950 rounded-xl active:bg-enterprise-950 active:text-white transition-all text-[9px] font-black uppercase gap-2"
                                >
                                    <Eye size={14} /> Editar
                                </button>
                                <button
                                    onClick={() => mostrarPropuesta(cotz)}
                                    className="flex-1 h-10 flex items-center justify-center bg-brand-orange/10 text-brand-orange rounded-xl active:bg-brand-orange active:text-white transition-all text-[9px] font-black uppercase gap-2"
                                >
                                    <Printer size={14} /> Reporte
                                </button>
                                <button
                                    onClick={() => { if (window.confirm('Eliminar registro?')) eliminarCotizacion(cotz.id); }}
                                    className="w-10 h-10 flex items-center justify-center bg-enterprise-50 text-enterprise-400 rounded-xl active:bg-brand-magenta active:text-white transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center">
                            <Search size={32} className="mx-auto text-enterprise-100 mb-4" />
                            <p className="text-[10px] font-black text-enterprise-300 uppercase tracking-widest italic">Sin actividad histórica</p>
                        </div>
                    )}
                </div>

                <div className="bg-enterprise-50 p-6 border-t border-enterprise-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest">
                        Mostrando {historialFiltrado.length} de {historial.length} transacciones registradas.
                    </p>
                    <div className="flex gap-2 text-enterprise-300">
                        <MoreHorizontal size={20} />
                    </div>
                </div>
            </div>

            {/* Modal de Cierre */}
            {confirmingStatus && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-enterprise-950/80 backdrop-blur-md animate-premium-fade">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border border-enterprise-100">
                        <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange" />
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-brand-orange/10 rounded-[1.5rem] flex items-center justify-center text-brand-orange">
                                <BadgeDollarSign size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-enterprise-900 uppercase leading-none mb-1">Protocolo de Cierre</h3>
                                <p className="text-[10px] font-bold text-enterprise-400 uppercase tracking-widest">Validación de Estatus Comercial</p>
                            </div>
                        </div>

                        {confirmingStatus.status === 'ganada' ? (
                            <div className="space-y-6 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">Referencia Contrato SAP/MID</label>
                                    <input
                                        type="number"
                                        value={cierreData.numero_contrato}
                                        onChange={(e) => setCierreData({ ...cierreData, numero_contrato: e.target.value })}
                                        className="premium-input text-lg py-4 h-16"
                                        placeholder="Ej: 994021"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">Folio Sistema</label>
                                        <input
                                            type="text"
                                            value={cierreData.folio_sistema}
                                            onChange={(e) => setCierreData({ ...cierreData, folio_sistema: e.target.value })}
                                            className="premium-input text-xs"
                                            placeholder="CP-XXXX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">Fecha Registro</label>
                                        <input
                                            type="date"
                                            value={cierreData.fecha_registro_sistema}
                                            onChange={(e) => setCierreData({ ...cierreData, fecha_registro_sistema: e.target.value })}
                                            className="premium-input text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-enterprise-50 rounded-2xl mb-8 border border-enterprise-100 flex items-center gap-4">
                                <AlertCircle size={24} className="text-brand-orange" />
                                <p className="text-xs font-bold text-enterprise-700 uppercase tracking-widest leading-relaxed">
                                    Confirma el cambio a {confirmingStatus.status.toUpperCase()}. Esto archivará el registro en la fase correspondiente.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleUpdateStatus(confirmingStatus.quote, confirmingStatus.status)}
                                className="w-full h-14 bg-brand-orange text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-brand-orange/20 hover:bg-brand-magenta hover:shadow-brand-magenta/40 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
                            >
                                {isUpdating ? <RefreshCw className="animate-spin" size={18} /> : <span>Confirmar Operación</span>}
                            </button>
                            <button
                                onClick={() => setConfirmingStatus(null)}
                                className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-enterprise-400 hover:text-enterprise-600 transition-colors"
                            >
                                Regresar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryView;
