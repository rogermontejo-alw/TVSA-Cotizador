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
    masterContracts = [],
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

    // Estado para cierre de venta desde la lista
    const [cierreData, setCierreData] = useState({
        numero_contrato: '',
        mc_id: '',
        fecha_registro_sistema: '',
        folio_sistema: ''
    });

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
                updatedQuote.fecha_cierre_real = quote.fecha_cierre_real || new Date().toISOString();
            }

            const success = await onSaveClient('cotizaciones', updatedQuote);

            if (success) {
                setMensaje({ tipo: 'exito', texto: `Cotización actualizada a: ${newStatus.toUpperCase()}` });

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

            {/* Pipeline */}
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
                    {isUpdating && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><RefreshCw className="animate-spin" /></div>}
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                <div className="xl:w-[400px] flex-shrink-0 space-y-6">
                    {/* Datos Contacto */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Detalles de Contacto</h4>
                            <button onClick={() => setIsEditing(!isEditing)} className="text-red-600"><Edit3 size={18} /></button>
                        </div>
                        {isEditing ? (
                            <div className="space-y-4">
                                <input placeholder="Nombre" value={editData.nombre_contacto} onChange={e => setEditData({ ...editData, nombre_contacto: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold" />
                                <input placeholder="Email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold" />
                                <input placeholder="Tel" value={editData.telefono} onChange={e => setEditData({ ...editData, telefono: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold" />
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
                </div>

                <div className="flex-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 min-h-[500px]">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Histórico de Cotizaciones</h4>
                            <button onClick={onNewQuote} className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-black uppercase text-[9px] flex items-center gap-2"><Plus size={14} /> Nueva Cotización</button>
                        </div>
                        <div className="space-y-4">
                            {clientQuotes.map(quote => (
                                <div key={quote.id} onClick={() => onViewQuote(quote)} className="group p-6 bg-slate-50 hover:bg-white rounded-2xl border border-transparent hover:border-red-100 transition-all cursor-pointer flex flex-col md:flex-row justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            {getStatusIcon(quote.estatus)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                                                <span className="text-[10px] font-black text-slate-900 uppercase">{quote.folio}</span>
                                                {quote.estatus === 'ganada' && quote.numero_contrato && (
                                                    <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-tighter">
                                                        Contrato: {quote.numero_contrato}
                                                    </span>
                                                )}
                                                <div className="flex gap-1">
                                                    {['enviada', 'ganada', 'perdida'].map(st => (
                                                        <button key={st} onClick={() => handleOpenQuoteStatusModal(quote, st)} className={`text-[7px] px-2 py-0.5 rounded font-black uppercase ${quote.estatus === st ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 opacity-60 hover:opacity-100 transition-opacity'}`}>{st}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-lg font-black text-slate-900">{formatMXN(quote.subtotalGeneral || quote.total / 1.16)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {quote.estatus === 'ganada' && (
                                            <button
                                                onClick={e => { e.stopPropagation(); handleOpenQuoteStatusModal(quote, 'ganada'); }}
                                                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                title="Datos de Cierre"
                                            >
                                                <Briefcase size={16} />
                                            </button>
                                        )}
                                        <button onClick={e => { e.stopPropagation(); onPrintQuote(quote); }} className="p-3 bg-white rounded-xl border border-gray-100"><Printer size={16} /></button>
                                    </div>
                                </div>
                            ))}
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
                        <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                        <h3 className="text-xl font-black uppercase mb-2 tracking-tighter">¡Venta Ganada!</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">¿Promover a CLIENTE en el CRM?</p>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => handlePromote('Cliente')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]">Sí, promover</button>
                            <button onClick={() => setConfirmingStage(null)} className="w-full py-3 text-[10px] font-black uppercase text-slate-400">Ahora no</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientFichaView;
