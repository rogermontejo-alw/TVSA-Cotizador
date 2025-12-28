import React, { useState } from 'react';
import {
    User, Phone, Mail, MapPin, Building2, Briefcase,
    ChevronLeft, Edit3, Plus, FileText, CheckCircle2,
    Clock, AlertCircle, Save, Trash2, ArrowRight
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ClientFichaView = ({
    cliente,
    cotizaciones,
    onBack,
    onSaveClient,
    onNewQuote,
    onViewQuote,
    setMensaje
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...cliente });
    const [motivoDescarte, setMotivoDescarte] = useState('');
    const [confirmingNoInterest, setConfirmingNoInterest] = useState(false);

    const clientQuotes = (cotizaciones || []).filter(q => q.cliente_id === cliente.id);

    const stages = ['Prospecto', 'Contactado', 'Interesado', 'No Interesado', 'Cliente'];
    const currentStageIdx = stages.indexOf(cliente.etapa);

    const handlePromote = async (forcedStage = null) => {
        let nextStage = forcedStage;

        if (!nextStage) {
            if (cliente.etapa === 'Prospecto') nextStage = 'Contactado';
            else if (cliente.etapa === 'Interesado') nextStage = 'Cliente';
        }

        if (nextStage) {
            let updated = { ...cliente, etapa: nextStage };

            // Si es descarte, añadir el motivo a las notas
            if (nextStage === 'No Interesado' && motivoDescarte) {
                const timestamp = new Date().toLocaleDateString('es-MX');
                const nuevaNota = `[DESCARTE ${timestamp}]: ${motivoDescarte}\n${cliente.notas_generales || ''}`;
                updated.notas_generales = nuevaNota;
            }

            const success = await onSaveClient('clientes', updated);
            if (success) {
                setMensaje({ tipo: 'exito', texto: `Cliente actualizado a ${nextStage}` });
                setConfirmingNoInterest(false);
                setMotivoDescarte('');
            }
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Información y Etapas */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Tarjeta de Etapa */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <Briefcase size={80} />
                        </div>

                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-6">Estado del Pipeline</h4>

                        <div className="space-y-4">
                            {stages.map((s, idx) => {
                                const isCompleted = idx <= currentStageIdx && cliente.etapa !== 'No Interesado';
                                const isCurrent = idx === currentStageIdx;
                                const isNoInt = cliente.etapa === 'No Interesado' && idx === 3;

                                return (
                                    <div key={s} className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all
                                            ${isNoInt ? 'bg-gray-400 text-white' :
                                                isCompleted ? (idx === 4 ? 'bg-green-500 text-white' : 'bg-red-600 text-white') :
                                                    'bg-gray-100 text-gray-300'}`}>
                                            {isCompleted && !isNoInt ? <CheckCircle2 size={14} /> : idx + 1}
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-widest 
                                            ${isCurrent ? 'text-slate-900' : 'text-gray-300'}`}>
                                            {s}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {cliente.etapa !== 'Cliente' && cliente.etapa !== 'No Interesado' && (
                            <>
                                {cliente.etapa === 'Contactado' ? (
                                    <div className="mt-8 space-y-4">
                                        {!confirmingNoInterest ? (
                                            <>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">Cualificar Prospecto</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePromote('Interesado')}
                                                        className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[8px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-95 shadow-lg"
                                                    >
                                                        Interesado <CheckCircle2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmingNoInterest(true)}
                                                        className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[8px] flex items-center justify-center gap-2 hover:bg-slate-300 transition-all active:scale-95"
                                                    >
                                                        No Interesado <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100 animate-in zoom-in-95 duration-200">
                                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">Motivo de Descarte</p>
                                                <textarea
                                                    value={motivoDescarte}
                                                    onChange={(e) => setMotivoDescarte(e.target.value)}
                                                    placeholder="Ej: Presupuesto agotado, ya contrató con competencia..."
                                                    className="w-full h-24 p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-red-500 transition-all"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setConfirmingNoInterest(false)}
                                                        className="flex-1 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        disabled={!motivoDescarte.trim()}
                                                        onClick={() => handlePromote('No Interesado')}
                                                        className="flex-[2] py-2.5 bg-red-600 text-white rounded-lg font-black uppercase tracking-widest text-[8px] disabled:opacity-30 disabled:grayscale transition-all"
                                                    >
                                                        Confirmar Descarte
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handlePromote()}
                                        className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-red-600 transition-all active:scale-95 shadow-lg"
                                    >
                                        {cliente.etapa === 'Prospecto' ? 'Confirmar Contacto' : 'Cerrar como Cliente'} <ArrowRight size={14} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>

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
                <div className="lg:col-span-2 space-y-6">
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
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-red-600 group-hover:bg-red-50 transition-all">
                                                {getStatusIcon(quote.estatus)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{quote.folio}</span>
                                                    <span className="text-[8px] px-2 py-0.5 bg-slate-200 text-slate-500 rounded font-black uppercase tracking-tighter">
                                                        {quote.estatus}
                                                    </span>
                                                </div>
                                                <p className="text-lg font-black text-slate-900 tracking-tight group-hover:text-red-600 transition-colors">
                                                    {formatMXN(quote.monto_total)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right w-full md:w-auto">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Creada el</p>
                                            <p className="text-[10px] font-bold text-slate-600">
                                                {new Date(quote.created_at).toLocaleDateString('es-MX', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </p>
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
        </div>
    );
};

export default ClientFichaView;
