import React, { useState, useMemo } from 'react';
import {
    User, Phone, Mail, MapPin, Building2, Briefcase,
    ChevronLeft, Edit3, Plus, FileText, CheckCircle2,
    Clock, AlertCircle, Save, Trash2, ArrowRight, RefreshCw, Printer
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ClientFichaView = ({
    cliente,
    cotizaciones,
    onBack,
    onSaveClient,
    onNewQuote,
    onViewQuote,
    onPrintQuote,
    setMensaje
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [motivoDescarte, setMotivoDescarte] = useState('');
    const [confirmingStage, setConfirmingStage] = useState(null); // Etapa pendiente de confirmar
    const [confirmingQuoteStatus, setConfirmingQuoteStatus] = useState(null); // { quote, status }
    const [isUpdating, setIsUpdating] = useState(false);
    const [editData, setEditData] = useState(cliente);

    const clientQuotes = useMemo(() => {
        if (!cliente?.id || !cotizaciones) return [];
        return cotizaciones.filter(q => String(q.cliente_id) === String(cliente.id));
    }, [cotizaciones, cliente?.id]);

    const stages = ['Prospecto', 'Contactado', 'Interesado', 'No Interesado', 'Cliente'];
    const currentStageIdx = stages.indexOf(cliente.etapa);

    const handlePromote = async (targetStage) => {
        if (!targetStage) return;

        setIsUpdating(true);
        try {
            let updated = { ...cliente, etapa: targetStage };

            // Si es descarte, añadir el motivo a las notas si se proporcionó
            if (targetStage === 'No Interesado' && motivoDescarte) {
                const timestamp = new Date().toLocaleDateString('es-MX');
                const nuevaNota = `[DESCARTE ${timestamp}]: ${motivoDescarte}\n${cliente.notas_generales || ''}`;
                updated.notas_generales = nuevaNota;
            }

            const success = await onSaveClient('clientes', updated);
            if (success) {
                setMensaje({ tipo: 'exito', texto: `El cliente ahora está en etapa: ${targetStage}` });
                setConfirmingStage(null);
                setMotivoDescarte('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateQuoteStatus = async (quote, newStatus) => {
        setIsUpdating(true);
        try {
            const updatedQuote = {
                id: quote.id,
                estatus: newStatus
            };

            const success = await onSaveClient('cotizaciones', updatedQuote);

            if (success) {
                setMensaje({ tipo: 'exito', texto: `Cotización actualizada a: ${newStatus.toUpperCase()}` });

                // Lógica inteligente: Si la cotización es GANADA y el cliente no es etapa "Cliente", preguntar
                if (newStatus === 'ganada' && cliente.etapa !== 'Cliente') {
                    setConfirmingQuoteStatus(null);
                    setConfirmingStage('Cliente');
                } else {
                    setConfirmingQuoteStatus(null);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSave = async () => {
        const success = await onSaveClient('clientes', editData);
        if (success) {
            setIsEditing(false);
            setMensaje({ tipo: 'exito', texto: 'Datos actualizados correctamente' });
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ganada': return <CheckCircle2 className="text-green-500" size={16} />;
            case 'perdida': return <AlertCircle className="text-gray-400" size={16} />;
            case 'enviada': return <Clock className="text-blue-500" size={16} />;
            default: return <FileText className="text-slate-300" size={16} />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={onBack}
                    className="p-3 bg-white hover:bg-slate-900 hover:text-white rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{cliente.nombre_empresa}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Ficha de Cliente / CRM</p>
                </div>
            </div>

            {/* Pipeline de Etapas Horizontal */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 mb-6 relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 relative">
                    {stages.map((s, idx) => {
                        const isCompleted = idx < currentStageIdx && cliente.etapa !== 'No Interesado';
                        const isCurrent = idx === currentStageIdx;
                        const isNoInt = cliente.etapa === 'No Interesado' && s === 'No Interesado';

                        return (
                            <React.Fragment key={s}>
                                <button
                                    onClick={() => !isCurrent && setConfirmingStage(s)}
                                    disabled={isUpdating}
                                    className="flex flex-col items-center gap-2 group flex-1 relative z-10"
                                >
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all shadow-sm
                                        ${isNoInt ? 'bg-orange-500 text-white shadow-orange-200' :
                                            isCurrent ? 'bg-slate-900 text-white scale-110 shadow-slate-300' :
                                                isCompleted ? 'bg-emerald-500 text-white shadow-emerald-200' :
                                                    'bg-white text-slate-300 border border-slate-100'}`}>
                                        {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-tighter text-center whitespace-nowrap
                                        ${isCurrent ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                        {s}
                                    </span>
                                </button>

                                {idx < stages.length - 1 && (
                                    <div className={`flex-1 h-0.5 mt-4 -mx-1 relative z-0
                                        ${idx < currentStageIdx ? 'bg-emerald-200' : 'bg-slate-100'}`}>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {isUpdating && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-[2rem] z-20">
                            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                <div className="xl:w-[400px] flex-shrink-0 space-y-6">
                    {/* Pipeline antiguo movido arriba */}


                    {/* Modal de Confirmación de Cambio de Etapa */}
                    {confirmingStage && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white animate-in zoom-in-95 duration-200">
                                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle size={32} />
                                </div>

                                <h3 className="text-center text-lg font-black text-slate-900 leading-tight mb-2">
                                    ¿Cambiar a {confirmingStage.toUpperCase()}?
                                </h3>
                                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                                    Esta acción actualizará el estado comercial del cliente
                                </p>

                                {confirmingStage === 'No Interesado' && (
                                    <div className="mb-6 space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Motivo del descarte (opcional)</label>
                                        <textarea
                                            value={motivoDescarte}
                                            onChange={(e) => setMotivoDescarte(e.target.value)}
                                            placeholder="Ej: Presupuesto agotado..."
                                            className="w-full h-24 p-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handlePromote(confirmingStage)}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
                                    >
                                        Confirmar Cambio
                                    </button>
                                    <button
                                        onClick={() => {
                                            setConfirmingStage(null);
                                            setMotivoDescarte('');
                                        }}
                                        className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Datos de Contacto */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Detalles de Contacto</h4>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-red-600 hover:text-slate-900 transition-colors"
                            >
                                <Edit3 size={18} />
                            </button>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-gray-400">Nombre de Contacto</label>
                                    <input
                                        type="text"
                                        value={editData.nombre_contacto}
                                        onChange={(e) => setEditData({ ...editData, nombre_contacto: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-gray-400">Email</label>
                                    <input
                                        type="email"
                                        value={editData.email}
                                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-gray-400">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={editData.telefono}
                                        onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleSave}
                                    className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
                                >
                                    <Save size={14} /> Guardar Cambios
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Contacto</p>
                                        <p className="text-xs font-bold text-slate-900">{cliente.nombre_contacto || 'No registrado'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                                        <p className="text-xs font-bold text-slate-900">{cliente.email || 'No registrado'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Teléfono</p>
                                        <p className="text-xs font-bold text-slate-900">{cliente.telefono || 'No registrado'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: Cotizaciones */}
                <div className="flex-1 min-w-0 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 min-h-[500px]">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Histórico de Cotizaciones</h4>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Timeline de propuestas comerciales</p>
                            </div>
                            <button
                                onClick={onNewQuote}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                            >
                                <Plus size={14} /> Nueva Cotización
                            </button>
                        </div>

                        {clientQuotes.length > 0 ? (
                            <div className="space-y-4">
                                {clientQuotes.map(quote => (
                                    <div
                                        key={quote.id}
                                        onClick={() => onViewQuote(quote)}
                                        className="group flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-slate-50 hover:bg-white rounded-2xl border border-transparent hover:border-red-100 transition-all cursor-pointer hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all overflow-hidden relative">
                                                {getStatusIcon(quote.estatus)}
                                                {isUpdating && <div className="absolute inset-0 bg-white/50 flex items-center justify-center animate-spin"><RefreshCw size={10} /></div>}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{quote.folio}</span>
                                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                        {['enviada', 'ganada', 'perdida'].map(st => (
                                                            <button
                                                                key={st}
                                                                onClick={() => setConfirmingQuoteStatus({ quote, status: st })}
                                                                className={`text-[7px] px-2 py-0.5 rounded font-black uppercase tracking-tighter transition-all
                                                                    ${quote.estatus === st
                                                                        ? st === 'ganada' ? 'bg-emerald-500 text-white' : st === 'perdida' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                                                                        : 'bg-white text-slate-400 hover:bg-slate-200'}`}
                                                            >
                                                                {st}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-lg font-black text-slate-900 tracking-tight group-hover:text-red-600 transition-colors">
                                                    {formatMXN(quote.subtotalGeneral || quote.monto_total / 1.16)}
                                                </p>
                                                <span className="block text-[8px] font-bold text-gray-400 -mt-1 uppercase tracking-tighter">Subtotal (Neto)</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Creada el</p>
                                                <p className="text-[10px] font-bold text-slate-600">
                                                    {quote.fecha instanceof Date && !isNaN(quote.fecha)
                                                        ? quote.fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : 'F. Reciente'}
                                                </p>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPrintQuote(quote);
                                                }}
                                                className="p-3 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-gray-100 transition-all shadow-sm active:scale-90 group/print"
                                                title="Imprimir Propuesta"
                                            >
                                                <Printer size={16} className="group-hover/print:rotate-12 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                <FileText size={48} className="mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sin cotizaciones registradas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Confirmación de Estatus de Cotización */}
            {confirmingQuoteStatus && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white animate-in zoom-in-95 duration-200">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 ${confirmingQuoteStatus.status === 'ganada' ? 'bg-emerald-50 text-emerald-600' :
                            confirmingQuoteStatus.status === 'perdida' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                            <AlertCircle size={32} />
                        </div>

                        <h3 className="text-center text-lg font-black text-slate-900 leading-tight mb-2 uppercase">
                            ¿Marcar como {confirmingQuoteStatus.status.toUpperCase()}?
                        </h3>
                        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                            {confirmingQuoteStatus.status === 'ganada' ? 'Esta acción sumará el monto a los reportes de Venta Real' :
                                confirmingQuoteStatus.status === 'perdida' ? 'Esta cotización se marcará como no aceptada' : 'Estatus informativo'}
                        </p>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleUpdateQuoteStatus(confirmingQuoteStatus.quote, confirmingQuoteStatus.status)}
                                className={`w-full py-4 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-xl ${confirmingQuoteStatus.status === 'ganada' ? 'bg-emerald-600' :
                                    confirmingQuoteStatus.status === 'perdida' ? 'bg-red-600' : 'bg-slate-900'
                                    }`}
                            >
                                Confirmar Cambio
                            </button>
                            <button
                                onClick={() => setConfirmingQuoteStatus(null)}
                                className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientFichaView;
