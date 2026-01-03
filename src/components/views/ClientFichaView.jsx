import React, { useState, useMemo, useEffect } from 'react';
import {
    User, Phone, Mail, MapPin, Building2, Briefcase,
    ChevronLeft, Edit3, Plus, FileText, CheckCircle2,
    Clock, AlertCircle, Save, Trash2, ArrowRight, RefreshCw, Printer, Calendar
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';
import { formatToMeridaISO } from '../../utils/dateUtils';

const ClientFichaView = ({
    cliente,
    cotizaciones,
    masterContracts = [],
    interacciones = [],
    perfil,
    onBack,
    onSaveClient,
    onNewQuote,
    onViewQuote,
    onPrintQuote,
    setMensaje
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [motivoDescarte, setMotivoDescarte] = useState('');
    const [confirmingStage, setConfirmingStage] = useState(null);
    const [confirmingQuoteStatus, setConfirmingQuoteStatus] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editData, setEditData] = useState(cliente);

    // Sincronizar editData cuando cambie el prop cliente (después de guardar)
    useEffect(() => {
        if (cliente) {
            setEditData(cliente);
        }
    }, [cliente]);

    // Estado para cierre de venta desde la lista
    const [cierreData, setCierreData] = useState({
        numero_contrato: '',
        mc_id: '',
        fecha_registro_sistema: '',
        folio_sistema: ''
    });

    const [nuevaNota, setNuevaNota] = useState('');
    const [fechaRecordatorio, setFechaRecordatorio] = useState('');
    const [tipoNota, setTipoNota] = useState('Seguimiento');
    const [isSavingNota, setIsSavingNota] = useState(false);

    const clientQuotes = useMemo(() => {
        if (!cliente?.id || !cotizaciones) return [];
        return cotizaciones.filter(q => String(q.cliente_id) === String(cliente.id));
    }, [cotizaciones, cliente?.id]);

    const clientMCs = useMemo(() => {
        return (masterContracts || []).filter(mc =>
            String(mc.cliente_id) === String(cliente?.id) && mc.estatus === 'activo'
        );
    }, [masterContracts, cliente?.id]);

    const stages = ['Prospecto', 'Contactado', 'Interesado', 'No Interesado', 'Cliente'];
    const currentStageIdx = stages.indexOf(cliente.etapa);

    const handlePromote = async (targetStage) => {
        if (!targetStage) return;
        setIsUpdating(true);
        try {
            let updated = { ...cliente, etapa: targetStage };
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

    const handleOpenQuoteStatusModal = (quote, status) => {
        setConfirmingQuoteStatus({ quote, status });
        if (status === 'ganada') {
            setCierreData({
                numero_contrato: quote.numero_contrato || '',
                mc_id: quote.mc_id || '',
                fecha_registro_sistema: quote.fecha_registro_sistema || '',
                folio_sistema: quote.folio_sistema || ''
            });
        }
    };

    const handleUpdateQuoteStatus = async (quote, newStatus) => {
        if (newStatus === 'ganada' && !cierreData.numero_contrato) {
            setMensaje({ tipo: 'error', texto: 'El número de contrato es obligatorio.' });
            return;
        }

        setIsUpdating(true);
        try {
            const updatedQuote = {
                id: quote.id,
                estatus: newStatus
            };

            if (newStatus === 'ganada') {
                updatedQuote.numero_contrato = parseInt(cierreData.numero_contrato);
                updatedQuote.mc_id = cierreData.mc_id || null;
                updatedQuote.fecha_registro_sistema = cierreData.fecha_registro_sistema || null;
                updatedQuote.folio_sistema = cierreData.folio_sistema || null;
                updatedQuote.fecha_cierre_real = quote.fecha_cierre_real || formatToMeridaISO(new Date().toISOString());
            }

            const success = await onSaveClient('cotizaciones', updatedQuote);

            if (success) {
                setMensaje({ tipo: 'exito', texto: `Cotización actualizada a: ${newStatus.toUpperCase()}` });

                // Registrar interacción automática del cambio de estatus
                await onSaveClient('interacciones_cliente', {
                    cliente_id: cliente.id,
                    tipo: 'Sinergia',
                    comentario: `Cotización ${quote.folio} marcada como ${newStatus.toUpperCase()}`,
                    usuario_id: perfil?.id
                });

                // Crear registro en cobranza
                if (newStatus === 'ganada') {
                    await onSaveClient('cobranza', {
                        cotizacion_id: quote.id,
                        monto_facturado: quote.subtotalGeneral || quote.total / 1.16,
                        estatus_pago: 'pendiente',
                        notas: `Contrato: ${cierreData.numero_contrato}`
                    });
                }

                if (newStatus === 'ganada' && cliente.etapa !== 'Cliente') {
                    setConfirmingQuoteStatus(null);
                    setConfirmingStage('Cliente');
                } else {
                    setConfirmingQuoteStatus(null);
                }

                // Reset cierre data
                setCierreData({ numero_contrato: '', mc_id: '', fecha_registro_sistema: '', folio_sistema: '' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSaveNota = async () => {
        if (!nuevaNota.trim()) return;
        setIsSavingNota(true);
        try {
            const success = await onSaveClient('interacciones_cliente', {
                cliente_id: cliente.id,
                tipo: tipoNota,
                comentario: nuevaNota,
                usuario_id: perfil?.id,
                fecha_recordatorio: formatToMeridaISO(fechaRecordatorio) || null
            });
            if (success) {
                setNuevaNota('');
                setFechaRecordatorio('');
                setMensaje({ tipo: 'exito', texto: 'Nota de seguimiento guardada' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingNota(false);
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
            {/* Header */}
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

            {/* Pipeline / Progress Bar */}
            <div className="bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-gray-100 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2 relative">
                    {stages.map((s, idx) => {
                        const isCompleted = idx < currentStageIdx && cliente.etapa !== 'No Interesado';
                        const isCurrent = idx === currentStageIdx;
                        const isNoInt = cliente.etapa === 'No Interesado' && s === 'No Interesado';
                        const isDisabled = isUpdating;

                        return (
                            <React.Fragment key={s}>
                                <div className="flex-1 flex flex-col items-center group relative z-10 w-full sm:w-auto">
                                    <button
                                        onClick={() => !isCurrent && setConfirmingStage(s)}
                                        disabled={isDisabled}
                                        className={`flex flex-row sm:flex-col items-center gap-3 sm:gap-2 p-2 sm:p-0 rounded-2xl transition-all w-full sm:w-auto
                                            ${!isCurrent && !isDisabled ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
                                    >
                                        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-[10px] sm:text-xs font-black transition-all shadow-sm
                                            ${isNoInt ? 'bg-orange-500 text-white shadow-orange-200' :
                                                isCurrent ? 'bg-slate-900 text-white scale-110 shadow-slate-300 ring-4 ring-slate-100' :
                                                    isCompleted ? 'bg-emerald-500 text-white shadow-emerald-200' :
                                                        'bg-white text-slate-300 border border-slate-100'}`}>
                                            {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                                        </div>
                                        <div className="flex flex-col items-start sm:items-center">
                                            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-center whitespace-nowrap
                                                ${isCurrent ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                                {s}
                                            </span>
                                            {isCurrent && <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest sm:hidden">Etapa Actual</span>}
                                        </div>
                                    </button>
                                </div>
                                {idx < stages.length - 1 && (
                                    <div className={`hidden sm:block flex-1 h-[2px] mt-0 relative z-0
                                        ${idx < currentStageIdx ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                                        <div className={`absolute inset-0 bg-emerald-500 transition-all duration-1000 ${idx < currentStageIdx ? 'w-full' : 'w-0'}`} />
                                    </div>
                                )}
                                {idx < stages.length - 1 && (
                                    <div className={`sm:hidden w-0.5 h-4 bg-slate-100 mx-auto
                                        ${idx < currentStageIdx ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                    {isUpdating && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-50 rounded-[2rem]">
                            <RefreshCw className="animate-spin text-slate-900" size={24} />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 2. DETALLES DE CONTACTO */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Detalles de Contacto</h4>
                            <button onClick={() => setIsEditing(!isEditing)} className="text-red-600"><Edit3 size={18} /></button>
                        </div>
                        {isEditing ? (
                            <div className="space-y-4">
                                <input placeholder="Nombre" value={editData.nombre_contacto || ''} onChange={e => setEditData({ ...editData, nombre_contacto: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold" />
                                <input placeholder="Email" value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold" />
                                <input placeholder="Tel" value={editData.telefono || ''} onChange={e => setEditData({ ...editData, telefono: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold" />
                                <button onClick={handleSave} className="w-full py-3 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><Save size={14} /> Guardar</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3"><User size={18} className="text-slate-400" /><div><p className="text-[8px] font-black text-gray-400 uppercase">Contacto</p><p className="text-xs font-bold">{cliente.nombre_contacto || 'No registrado'}</p></div></div>
                                <div className="flex items-center gap-3"><Mail size={18} className="text-slate-400" /><div><p className="text-[8px] font-black text-gray-400 uppercase">Email</p><p className="text-xs font-bold">{cliente.email || 'No registrado'}</p></div></div>
                                <div className="flex items-center gap-3"><Phone size={18} className="text-slate-400" /><div><p className="text-[8px] font-black text-gray-400 uppercase">Teléfono</p><p className="text-xs font-bold">{cliente.telefono || 'No registrado'}</p></div></div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-4">Ubicación y Datos</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3"><MapPin size={18} className="text-slate-400" /><div><p className="text-[8px] font-black text-gray-400 uppercase">Plaza</p><p className="text-xs font-bold">{cliente.plaza || 'Mérida'}</p></div></div>
                            <div className="flex items-center gap-3"><Building2 size={18} className="text-slate-400" /><div><p className="text-[8px] font-black text-gray-400 uppercase">Ciudad Código</p><p className="text-xs font-bold uppercase">{cliente.codigo_ciudad || 'MID'}</p></div></div>
                        </div>
                    </div>
                </div>

                {/* 3. REGISTRO DE INTERACCIÓN (CRM Timeline) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col min-h-[500px]">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Registro de Actividad</h4>
                                <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Timeline de prospección</p>
                            </div>
                        </div>

                        {/* Input de Registro Rápido con Recordatorio */}
                        <div className="mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['Llamada', 'Visita', 'WhatsApp', 'Sinergia', 'Correo', 'Seguimiento'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTipoNota(t)}
                                        className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all
                                            ${tipoNota === t ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100'}`}
                                    >
                                        {t === 'Llamada' && '📞 '}
                                        {t === 'Visita' && '🚗 '}
                                        {t === 'WhatsApp' && '📱 '}
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <textarea
                                    placeholder="¿En qué va la cuenta? Escribe una nota de seguimiento..."
                                    value={nuevaNota}
                                    onChange={e => setNuevaNota(e.target.value)}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold border-none outline-none ring-2 ring-slate-100 focus:ring-slate-900/10 min-h-[80px] transition-all"
                                />

                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="flex-1 w-full relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange" size={16} />
                                        <input
                                            type="datetime-local"
                                            value={fechaRecordatorio}
                                            onChange={e => setFechaRecordatorio(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-slate-900/5 shadow-sm"
                                        />
                                        <div className="absolute -top-1.5 left-10 px-1 bg-slate-50 text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                            Fecha Próximo Contacto (Alertar)
                                        </div>
                                    </div>

                                    <button
                                        disabled={!nuevaNota.trim() || isSavingNota}
                                        onClick={handleSaveNota}
                                        className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-brand-orange transition-all disabled:opacity-30 active:scale-95 flex items-center justify-center gap-3 font-black uppercase text-[10px]"
                                    >
                                        {isSavingNota ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                        Guardar Gestión
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Timeline List */}
                        <div className="flex-1 space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {(interacciones || []).length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20">
                                    <Clock size={48} className="mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin actividad registrada</p>
                                </div>
                            ) : (
                                interacciones.map((note, idx) => (
                                    <div key={note.id || idx} className="flex gap-4 relative">
                                        {idx < interacciones.length - 1 && <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-100" />}
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
                                            ${note.tipo === 'Sinergia' ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-900 border border-slate-100'}`}>
                                            {note.tipo === 'Llamada' ? <Phone size={14} /> :
                                                note.tipo === 'Visita' ? <MapPin size={14} /> :
                                                    note.tipo === 'Sinergia' ? <RefreshCw size={14} /> :
                                                        <FileText size={14} />}
                                        </div>
                                        <div className="flex-1 pb-6 border-b border-gray-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter mr-2">{note.tipo}</span>
                                                    <span className="text-[8px] font-bold text-gray-400">{new Date(note.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{note.comentario}"</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. HISTÓRICO DE COTIZACIONES */}
                <div className="lg:col-span-12">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Histórico de Propuestas</h4>
                                <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Estrategias y Cotizaciones enviadas</p>
                            </div>
                            <button onClick={onNewQuote} className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-red-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Plus size={16} /> Crear Propuesta</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                            {clientQuotes.map(quote => (
                                <div
                                    key={quote.id}
                                    onClick={() => onViewQuote(quote)}
                                    className={`group p-6 rounded-[2rem] border transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-xl
                                        ${quote.estatus === 'ganada'
                                            ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-200'
                                            : 'bg-slate-50 border-transparent hover:border-red-100'}`}
                                >
                                    <div className="flex items-center gap-5 w-full md:w-auto">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors
                                            ${quote.estatus === 'ganada'
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-white group-hover:bg-slate-900 group-hover:text-white'}`}>
                                            {getStatusIcon(quote.estatus)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col mb-1">
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter truncate max-w-[200px]">{quote.folio}</span>
                                                <div className="flex gap-1 mt-1" onClick={e => e.stopPropagation()}>
                                                    {['enviada', 'ganada', 'perdida'].map(st => (
                                                        <button
                                                            key={st}
                                                            onClick={() => handleOpenQuoteStatusModal(quote, st)}
                                                            className={`text-[7px] px-2 py-0.5 rounded-lg font-black uppercase transition-all
                                                                ${quote.estatus === st
                                                                    ? (st === 'ganada' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900 text-white')
                                                                    : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                                                        >
                                                            {st}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className={`text-xl font-black ${quote.estatus === 'ganada' ? 'text-emerald-700' : 'text-slate-900'}`}>
                                                {formatMXN(quote.subtotalGeneral || quote.total / 1.16)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end md:self-center">
                                        <button
                                            onClick={e => { e.stopPropagation(); onPrintQuote(quote); }}
                                            className="p-3 bg-white rounded-xl border border-gray-100 hover:bg-slate-900 hover:text-white transition-colors shadow-sm"
                                        >
                                            <Printer size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {clientQuotes.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <FileText className="mx-auto text-slate-300 mb-3" size={40} />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No hay historial de cotizaciones</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales de Confirmación */}
            {confirmingQuoteStatus && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
                        <h3 className="text-center text-lg font-black uppercase mb-4 tracking-tighter">¿Marcar como {confirmingQuoteStatus.status.toUpperCase()}?</h3>

                        {confirmingQuoteStatus.status === 'ganada' && (
                            <div className="space-y-4 mb-6">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">Contrato Corporativo</label>
                                    <input type="number" placeholder="Contrato (Obligatorio)" value={cierreData.numero_contrato} onChange={e => setCierreData({ ...cierreData, numero_contrato: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none ring-2 ring-emerald-500/20 focus:ring-emerald-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">Master Contract</label>
                                    <select value={cierreData.mc_id} onChange={e => setCierreData({ ...cierreData, mc_id: e.target.value })} className="w-full max-w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none truncate">
                                        <option value="">Venta Única</option>
                                        {clientMCs.map(mc => <option key={mc.id} value={mc.id}>{mc.numero_mc}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">F. Sistema Televisa</label>
                                        <input type="date" value={cierreData.fecha_registro_sistema} onChange={e => setCierreData({ ...cierreData, fecha_registro_sistema: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-bold outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">Folio Sistema (CP)</label>
                                        <input type="text" placeholder="Ej: CP-123" value={cierreData.folio_sistema} onChange={e => setCierreData({ ...cierreData, folio_sistema: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-bold outline-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleUpdateQuoteStatus(confirmingQuoteStatus.quote, confirmingQuoteStatus.status)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]">Confirmar</button>
                            <button onClick={() => setConfirmingQuoteStatus(null)} className="w-full py-3 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmingStage && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center">
                        <div className={`w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center
                            ${confirmingStage === 'No Interesado' ? 'bg-orange-100 text-orange-600' :
                                confirmingStage === 'Cliente' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-blue-100 text-blue-600'}`}>
                            {confirmingStage === 'Cliente' ? <CheckCircle2 size={32} /> :
                                confirmingStage === 'No Interesado' ? <AlertCircle size={32} /> :
                                    <RefreshCw size={32} />}
                        </div>
                        <h3 className="text-xl font-black uppercase mb-2 tracking-tighter">
                            {confirmingStage === 'Cliente' ? '¡Venta Ganada!' :
                                confirmingStage === 'No Interesado' ? 'Descartar Cliente' :
                                    'Cambiar Etapa'}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                            ¿Mover a <span className="text-slate-900">{confirmingStage.toUpperCase()}</span> en el CRM?
                        </p>

                        {confirmingStage === 'No Interesado' && (
                            <div className="mb-6">
                                <textarea
                                    placeholder="Motivo del descarte..."
                                    value={motivoDescarte}
                                    onChange={e => setMotivoDescarte(e.target.value)}
                                    className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none ring-2 ring-slate-100 focus:ring-orange-500/20"
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handlePromote(confirmingStage)}
                                className={`w-full py-4 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg transition-transform active:scale-95
                                    ${confirmingStage === 'No Interesado' ? 'bg-orange-600 shadow-orange-200' : 'bg-slate-900 shadow-slate-200'}`}
                            >
                                Confirmar Cambio
                            </button>
                            <button onClick={() => setConfirmingStage(null)} className="w-full py-3 text-[10px] font-black uppercase text-slate-400">Ahora no</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientFichaView;
