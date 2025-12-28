import React, { useState, useMemo } from 'react';
import { ArrowLeft, FileText, Printer, Eye, Trash2, Calendar, Search, CopyPlus, Filter, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const HistoryView = ({
    setVistaActual,
    historial,
    setCotizacion,
    agregarAComparador,
    mostrarPropuesta,
    eliminarCotizacion,
    onSaveQuote,
    setMensaje
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroVix, setFiltroVix] = useState('todos');
    const [confirmingStatus, setConfirmingStatus] = useState(null); // { quote, status }
    const [isUpdating, setIsUpdating] = useState(false);

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

    const handleEliminar = (id) => {
        if (window.confirm('¿Seguro que deseas eliminar esta cotización? Esta acción no se puede deshacer.')) {
            eliminarCotizacion(id);
        }
    };

    const handleUpdateStatus = async (quote, newStatus) => {
        setIsUpdating(true);
        try {
            const success = await onSaveQuote('cotizaciones', { id: quote.id, estatus: newStatus });
            if (success) {
                setMensaje({ tipo: 'exito', texto: `Estatus actualizado: ${newStatus.toUpperCase()}` });
                setConfirmingStatus(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-b-8 border-gray-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setVistaActual('cotizador')}
                                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Cotizaciones Enviadas</h1>
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Sincronizado con CRM Supabase</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 w-full md:w-auto">
                            <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                                <FileText className="text-gray-400" size={24} />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registros</p>
                                    <p className="text-xl font-black text-gray-800">{historialFiltrado.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por cliente, ID o ciudad..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500 font-bold outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filtroVix}
                                onChange={(e) => setFiltroVix(e.target.value)}
                                className="px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-red-500 cursor-pointer"
                            >
                                <option value="todos">Todos los Escenarios</option>
                                <option value="vix">Solo con VIX</option>
                                <option value="no_vix">Solo TV</option>
                            </select>
                        </div>
                    </div>
                </div>

                {historialFiltrado.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl p-20 text-center border border-gray-100">
                        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText size={40} className="text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">Sin resultados</h2>
                        <p className="text-gray-400 font-medium">No se encontraron cotizaciones con esos criterios.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest">
                                        <th className="px-4 py-3 text-left">Fecha y Hora</th>
                                        <th className="px-4 py-3 text-left">Cliente / ID</th>
                                        <th className="px-4 py-3 text-left">Estatus</th>
                                        <th className="px-4 py-3 text-left">Detalle</th>
                                        <th className="px-4 py-3 text-right">Inversión</th>
                                        <th className="px-4 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {historialFiltrado.map(cotz => (
                                        <tr key={cotz.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-gray-800">
                                                        {cotz.fecha instanceof Date && !isNaN(cotz.fecha)
                                                            ? cotz.fecha.toLocaleDateString('es-MX')
                                                            : 'Fecha no válida'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400">
                                                        {cotz.fecha instanceof Date && !isNaN(cotz.fecha)
                                                            ? cotz.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col max-w-[150px]">
                                                    <span className="text-[12px] font-black text-gray-800 truncate">{cotz.cliente?.nombre_empresa || 'Cliente Desconocido'}</span>
                                                    <span className="text-[9px] font-bold text-red-600 tracking-tighter truncate">{cotz.folio || cotz.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex gap-1">
                                                    {['enviada', 'ganada', 'perdida'].map(st => (
                                                        <button
                                                            key={st}
                                                            onClick={() => setConfirmingStatus({ quote: cotz, status: st })}
                                                            disabled={isUpdating}
                                                            className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter transition-all relative overflow-hidden
                                                                ${cotz.estatus === st
                                                                    ? st === 'ganada' ? 'bg-emerald-500 text-white shadow-lg' : st === 'perdida' ? 'bg-red-500 text-white shadow-lg' : 'bg-blue-500 text-white shadow-lg'
                                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                        >
                                                            {st}
                                                            {isUpdating && cotz.estatus === st && (
                                                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center animate-spin">
                                                                    <RefreshCw size={8} />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[120px]">
                                                    <span className="text-[8px] font-black bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 uppercase">
                                                        {cotz.items.length}P
                                                    </span>
                                                    {cotz.paqueteVIX && (
                                                        <span className="text-[8px] font-black bg-blue-50 px-1.5 py-0.5 rounded text-blue-600 uppercase border border-blue-100">
                                                            VIX
                                                        </span>
                                                    )}
                                                    <span className="text-[8px] font-black bg-red-50 px-1.5 py-0.5 rounded text-red-600 uppercase border border-red-100">
                                                        {cotz.diasCampana}D
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right whitespace-nowrap">
                                                <span className="text-[12px] font-black text-gray-800">{formatMXN(cotz.subtotalGeneral || (cotz.monto_total || cotz.total) / 1.16)}</span>
                                                <span className="block text-[8px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">Neta</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => { setCotizacion(cotz); setVistaActual('cotizador'); }}
                                                        className="p-1.5 bg-gray-100 hover:bg-gray-800 hover:text-white rounded-lg transition-all text-gray-600"
                                                        title="Editar"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => mostrarPropuesta(cotz)}
                                                        className="p-1.5 bg-gray-100 hover:bg-red-600 hover:text-white rounded-lg transition-all text-gray-600"
                                                        title="Imprimir"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminar(cotz.id)}
                                                        className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {historialFiltrado.map(cotz => (
                                <div key={cotz.id} className="p-6 space-y-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                {cotz.fecha instanceof Date && !isNaN(cotz.fecha)
                                                    ? cotz.fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : 'Fecha no válida'}
                                            </div>
                                            <div className="font-black text-gray-800 text-lg leading-tight">{cotz.cliente?.nombre_empresa}</div>
                                            <div className="text-[10px] font-bold text-red-600 mt-1">{cotz.folio || cotz.id}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-gray-900">{formatMXN(cotz.subtotalGeneral || (cotz.monto_total || cotz.total) / 1.16)}</div>
                                            <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">SUBTOTAL</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[9px] font-black bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                                            {cotz.items.length} PRODUCTOS
                                        </span>
                                        {cotz.paqueteVIX && (
                                            <span className="text-[9px] font-black bg-blue-50 px-3 py-1 rounded-full text-blue-600 border border-blue-100">
                                                VIX INCLUIDO
                                            </span>
                                        )}
                                        <span className="text-[9px] font-black bg-red-50 px-3 py-1 rounded-full text-red-600 border border-red-100">
                                            {cotz.diasCampana} DÍAS
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 pt-2">
                                        <button
                                            onClick={() => { setCotizacion(cotz); setVistaActual('cotizador'); }}
                                            className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-800 hover:text-white transition-all"
                                        >
                                            <Eye size={20} />
                                            <span className="text-[8px] font-black mt-1 uppercase">Ver</span>
                                        </button>
                                        <button
                                            onClick={() => mostrarPropuesta(cotz)}
                                            className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl text-gray-600 hover:bg-red-600 hover:text-white transition-all"
                                        >
                                            <Printer size={20} />
                                            <span className="text-[8px] font-black mt-1 uppercase">PDF</span>
                                        </button>
                                        <button
                                            onClick={() => agregarAComparador(cotz)}
                                            className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl text-gray-600 hover:bg-slate-900 hover:text-white transition-all"
                                        >
                                            <CopyPlus size={20} />
                                            <span className="text-[8px] font-black mt-1 uppercase">Comp.</span>
                                        </button>
                                        <button
                                            onClick={() => handleEliminar(cotz.id)}
                                            className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all"
                                        >
                                            <Trash2 size={20} />
                                            <span className="text-[8px] font-black mt-1 uppercase">Borrar</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Confirmación de Estatus */}
            {
                confirmingStatus && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white animate-in zoom-in-95 duration-200">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 ${confirmingStatus.status === 'ganada' ? 'bg-emerald-50 text-emerald-600' :
                                confirmingStatus.status === 'perdida' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                <AlertCircle size={32} />
                            </div>

                            <h3 className="text-center text-lg font-black text-slate-900 leading-tight mb-2 uppercase">
                                ¿Cambiar a {confirmingStatus.status.toUpperCase()}?
                            </h3>
                            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                                {confirmingStatus.status === 'ganada' ? 'Este monto se reflejará como VENTA REAL en el Dashboard y Reportes.' :
                                    confirmingStatus.status === 'perdida' ? 'La cotización se marcará como rechazada.' : 'Estatus informativo.'}
                            </p>

                            <div className="flex flex-col gap-2">
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(confirmingStatus.quote, confirmingStatus.status)}
                                    className={`w-full py-4 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 ${confirmingStatus.status === 'ganada' ? 'bg-emerald-600' :
                                        confirmingStatus.status === 'perdida' ? 'bg-red-600' : 'bg-slate-900'
                                        }`}
                                >
                                    {isUpdating && <RefreshCw size={14} className="animate-spin" />}
                                    Confirmar Cambio
                                </button>
                                <button
                                    onClick={() => setConfirmingStatus(null)}
                                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default HistoryView;
