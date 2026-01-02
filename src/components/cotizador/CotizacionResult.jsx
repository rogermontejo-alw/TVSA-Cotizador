import React, { useState } from 'react';
import {
    Save, Printer, Eye, Smartphone, Monitor,
    CheckCircle, RefreshCw, Briefcase, AlertCircle, Activity, FileText
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const CotizacionResult = ({
    cotizacion,
    iniciarNuevaCotizacion,
    cargarCotizacionEdicion,
    guardarCotizacion,
    agregarAComparador,
    mostrarPropuesta,
    onSaveClient,
    masterContracts = [],
    perfil = null,
    setMensaje
}) => {
    const [confirmingStage, setConfirmingStage] = useState(null);
    const [confirmingQuoteStatus, setConfirmingQuoteStatus] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [localObservaciones, setLocalObservaciones] = useState(cotizacion.observaciones || '');
    const [cierreData, setCierreData] = useState({ numero_contrato: '', mc_id: '' });

    if (!cotizacion) return null;

    const cliente = cotizacion.cliente;
    const clientMCs = (masterContracts || []).filter(mc =>
        String(mc.cliente_id) === String(cliente?.id) && mc.estatus === 'activo'
    );

    const handleUpdateStage = async (targetStage) => {
        setIsUpdating(true);
        try {
            const updated = { ...cliente, etapa: targetStage };
            const success = await onSaveClient('clientes', updated);
            if (success) {
                setMensaje({ tipo: 'exito', texto: `Estatus Actualizado: ${targetStage}` });
                setConfirmingStage(null);
            }
        } catch (err) { console.error(err); } finally { setIsUpdating(false); }
    };

    const handleOpenQuoteStatusModal = (status) => {
        setConfirmingQuoteStatus({ status });
        if (status === 'ganada') {
            setCierreData({
                numero_contrato: cotizacion.numero_contrato || '',
                mc_id: cotizacion.mc_id || ''
            });
        }
    };

    const handleUpdateQuoteStatus = async (newStatus) => {
        setIsUpdating(true);
        try {
            if (!cotizacion.id || String(cotizacion.id).startsWith('COT-')) {
                setMensaje({ tipo: 'info', texto: 'Guarda la cotización primero antes de cambiar el estatus.' });
                setConfirmingQuoteStatus(null);
                return;
            }
            const payload = { id: cotizacion.id, estatus: newStatus };
            if (newStatus === 'ganada') {
                payload.numero_contrato = cierreData.numero_contrato ? parseInt(cierreData.numero_contrato) : null;
                payload.mc_id = cierreData.mc_id || null;
                payload.fecha_cierre_real = new Date().toISOString();
            }
            const success = await onSaveClient('cotizaciones', payload);
            if (success) {
                setMensaje({ tipo: 'exito', texto: `Estatus: ${newStatus.toUpperCase()}` });
                if (newStatus === 'ganada' && cliente.etapa !== 'Cliente') {
                    setConfirmingQuoteStatus(null);
                    setConfirmingStage('Cliente');
                } else { setConfirmingQuoteStatus(null); }
            }
        } catch (err) { console.error(err); } finally { setIsUpdating(false); }
    };

    const handleSaveQuote = async () => {
        setIsUpdating(true);
        try {
            if (!cliente?.id) {
                setMensaje({ tipo: 'error', texto: 'No se ha seleccionado cliente.' });
                return;
            }
            const isNew = !cotizacion.id || String(cotizacion.id).startsWith('COT-');
            const payload = {
                id: isNew ? undefined : cotizacion.id,
                cliente_id: cliente.id,
                folio: cotizacion.folio || (() => {
                    const initials = (perfil?.iniciales || 'TV').toUpperCase();
                    const city = (perfil?.codigo_ciudad || 'MID').toUpperCase();
                    const now = new Date();
                    const dateStr = now.getFullYear().toString() +
                        (now.getMonth() + 1).toString().padStart(2, '0') +
                        now.getDate().toString().padStart(2, '0') +
                        now.getHours().toString().padStart(2, '0') +
                        now.getMinutes().toString().padStart(2, '0');
                    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
                    return `${initials}${city}-${dateStr}${random}`;
                })(),
                monto_total: cotizacion.total || 0,
                dias_campana: cotizacion.diasCampana || 30,
                paquete_vix: !!cotizacion.paqueteVIX,
                estatus: cotizacion.estatus || 'borrador',
                json_detalles: {
                    items: cotizacion.items || [],
                    distribucion: cotizacion.distribucion || [],
                    paqueteVIX: cotizacion.paqueteVIX || null,
                    costoVIX: cotizacion.costoVIX || 0,
                    presupuestoBase: cotizacion.presupuestoBase || 0,
                    subtotalTV: cotizacion.subtotalTV || 0,
                    subtotalGeneral: cotizacion.subtotalGeneral || 0,
                    iva: cotizacion.iva || 0
                },
                observaciones: localObservaciones
            };
            const result = await guardarCotizacion('cotizaciones', payload);
            if (result?.[0]) {
                const savedQuote = result[0];
                cotizacion.id = savedQuote.id;
                cotizacion.folio = savedQuote.folio;

                // Registro Automático de Actividad en CRM
                await guardarCotizacion('interacciones_cliente', {
                    cliente_id: cliente.id,
                    tipo: 'Cotización',
                    comentario: `Se generó propuesta comercial con Folio: ${savedQuote.folio}. Inversión: ${formatMXN(cotizacion.total || 0)}`,
                    usuario_id: perfil?.id
                });

                setMensaje({ tipo: 'exito', texto: 'Plan Guardado y Actividad Registrada.' });
            }
        } catch (err) { setMensaje({ tipo: 'error', texto: `Error: ${err.message}` }); } finally { setIsUpdating(false); }
    };

    const presupuestoBase = cotizacion.presupuestoBase || 0;
    const inversionDigital = cotizacion.costoVIX || 0;
    const subtotalParaTV = presupuestoBase - inversionDigital;
    const inversionTV = cotizacion.subtotalTV || 0;
    const saldoFinal = subtotalParaTV - inversionTV;
    const inversionTotalNeto = inversionDigital + inversionTV;
    const saldoColor = saldoFinal >= 0 ? 'text-emerald-400' : 'text-brand-orange';

    return (
        <div className="max-w-[1000px] mx-auto pb-20 px-4 md:px-0 space-y-4 animate-premium-fade">
            {/* Dashboard Headers - 4 Columns on Tablet (md) and Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="bg-white rounded-2xl shadow-premium border border-enterprise-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={12} className="text-brand-orange" />
                        <span className="text-[7px] font-black text-enterprise-400 uppercase tracking-widest italic leading-none">Verificación de Identidad</span>
                    </div>
                    <h3 className="text-[10px] font-black text-enterprise-950 uppercase italic leading-none truncate">
                        {cliente?.nombre_empresa || 'Socio Prospecto'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[6px] font-black text-enterprise-400 uppercase tracking-widest leading-none">{cliente?.segmento || 'GENERAL'} • {cliente?.etapa || 'Pipeline'}</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-premium border border-enterprise-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={12} className="text-brand-orange" />
                        <span className="text-[7px] font-black text-enterprise-400 uppercase tracking-widest italic leading-none">Matriz de Despliegue</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="block text-[6px] text-enterprise-300 uppercase font-black leading-none mb-1">Duración</span>
                            <span className="text-[9px] font-black text-enterprise-900">{cotizacion.diasCampana || 30} Días</span>
                        </div>
                        <div>
                            <span className="block text-[6px] text-enterprise-300 uppercase font-black leading-none mb-1">Estructura</span>
                            <span className="text-[9px] font-black text-enterprise-900 uppercase">Híbrida TV+VIX</span>
                        </div>
                    </div>
                </div>

                <div className="bg-enterprise-950 rounded-2xl shadow-premium p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-brand-orange/10 blur-[40px] -mr-10 -mt-10" />
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[7px] font-black text-white/40 uppercase tracking-widest italic leading-none">Valuación de Capital</span>
                    </div>
                    <div className="flex flex-col relative z-10">
                        <span className="text-[12px] font-black text-white tracking-widest">
                            {formatMXN(inversionTotalNeto)}
                        </span>
                        <span className="text-[6px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">+ VALUACIÓN AUTORIZADA</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-premium border border-enterprise-100 p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={12} className="text-brand-orange" />
                        <span className="text-[7px] font-black text-enterprise-400 uppercase tracking-widest italic leading-none">Estatus del Pipeline</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest ${cotizacion.estatus === 'ganada' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                            cotizacion.estatus === 'perdida' ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' :
                                'bg-enterprise-950 text-white shadow-lg shadow-enterprise-950/20'
                            }`}>
                            {cotizacion.estatus || 'BORRADOR'}
                        </span>
                        <div className="flex flex-col items-end">
                            <span className="text-[6px] font-black text-enterprise-300 uppercase tracking-widest leading-none mb-1">Folio de Registro</span>
                            <span className="text-[9px] font-black text-enterprise-950 uppercase italic tracking-tighter">
                                {cotizacion.folio || 'NUEVO PLAN'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Content - 50/50 Split on Tablet (md) and Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                {/* DEPLOYMENT DETAIL - 2 COLUMNS WIDTH */}
                <div className="space-y-3">
                    <div className="bg-white rounded-2xl shadow-premium border border-enterprise-100 overflow-hidden flex flex-col h-[450px]">
                        <div className="bg-enterprise-950 px-4 py-2 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Monitor size={12} className="text-brand-orange" />
                                <h4 className="text-white text-[9px] font-black uppercase tracking-widest italic">Despliegue TV Lineal</h4>
                            </div>
                            <span className="text-[8px] font-black text-white/30 uppercase">{cotizacion.distribucion?.length || 0} Activos</span>
                        </div>
                        <div className="p-3 overflow-y-auto custom-scrollbar space-y-1.5 bg-enterprise-50/30 flex-1">
                            {cotizacion.distribucion?.map((dist, idx) => {
                                const lineTotal = cotizacion.items.find(i => i.producto.id === dist.producto.id)?.subtotal || 0;
                                return (
                                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-enterprise-100 flex items-center justify-between shadow-sm">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-[7px] font-black text-brand-orange uppercase">{dist.producto.canal}</span>
                                                <span className="text-[7px] text-enterprise-400 font-bold uppercase truncate">{dist.producto.plaza}</span>
                                            </div>
                                            <h5 className="text-[10px] font-black text-enterprise-950 uppercase truncate italic leading-none">
                                                {dist.producto.tipo} <span className="not-italic text-enterprise-500 text-[8px] font-bold ml-1">{dist.producto.duracion}</span>
                                            </h5>
                                        </div>
                                        <div className="text-right ml-3 shrink-0">
                                            <span className="text-[10px] font-black text-enterprise-950 italic">{formatMXN(lineTotal)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* PIPELINE RECAP & ACTIONS - 2 COLUMNS WIDTH */}
                <div className="space-y-4">
                    <div className="bg-enterprise-950 rounded-2xl shadow-premium border border-white/10 p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                            <Activity size={14} className="text-brand-orange" />
                            <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic">Resumen del Pipeline</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                                <span className="text-white/40">Total Aprobado</span>
                                <span className="text-white bg-white/5 px-2 py-1 rounded">{formatMXN(presupuestoBase)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-brand-orange">
                                <span>Activos Lineales</span>
                                <span className="bg-brand-orange/10 px-2 py-1 rounded">-{formatMXN(inversionTV)}</span>
                            </div>
                            {inversionDigital > 0 && (
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">
                                    <span>Impacto Digital</span>
                                    <span className="bg-emerald-500/10 px-2 py-1 rounded">-{formatMXN(inversionDigital)}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none mb-1">Balance Estratégico</span>
                                    <span className="text-[6px] font-bold text-white/30 uppercase tracking-widest">Sobrante a favor</span>
                                </div>
                                <span className={`text-[16px] font-black tracking-widest italic leading-none ${saldoColor}`}>{formatMXN(saldoFinal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* OBSERVATIONS FIELD */}
                    <div className="bg-white rounded-2xl shadow-premium border border-enterprise-100 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <FileText size={12} className="text-brand-orange" />
                            <span className="text-[7px] font-black text-enterprise-400 uppercase tracking-widest italic leading-none">Observaciones del Plan</span>
                        </div>
                        <textarea
                            value={localObservaciones}
                            onChange={(e) => setLocalObservaciones(e.target.value)}
                            disabled={cotizacion.estatus === 'ganada'}
                            placeholder={cotizacion.estatus === 'ganada' ? "RESUMEN FINALIZADO (SÓLO LECTURA)" : "AÑADE NOTAS ESPECÍFICAS PARA EL CLIENTE..."}
                            className="w-full h-20 p-3 bg-enterprise-50 rounded-xl text-[9px] font-bold text-enterprise-900 placeholder:text-enterprise-300 outline-none focus:ring-1 focus:ring-brand-orange resize-none transition-all disabled:opacity-50"
                        />
                    </div>

                    {/* NEW ACTION BAR - ALWAYS BELOW RECAP, MATCHING WIDTH */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleSaveQuote}
                            disabled={isUpdating || cotizacion.estatus === 'ganada'}
                            className="bg-white border border-enterprise-100 rounded-2xl h-14 flex flex-col items-center justify-center gap-1.5 hover:border-brand-orange shadow-premium group transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isUpdating ? (
                                <RefreshCw size={14} className="animate-spin text-brand-orange" />
                            ) : cotizacion.estatus === 'ganada' ? (
                                <CheckCircle size={14} className="text-emerald-500" />
                            ) : (
                                <Save size={14} className="text-enterprise-300 group-hover:text-brand-orange" />
                            )}
                            <span className="text-[8px] font-black text-enterprise-950 uppercase tracking-widest">
                                {cotizacion.estatus === 'ganada' ? 'Plan Finalizado' : 'Guardar Datos'}
                            </span>
                        </button>
                        <button
                            onClick={() => mostrarPropuesta({ ...cotizacion, observaciones: localObservaciones })}
                            className="bg-enterprise-950 border border-white/10 rounded-2xl h-14 flex flex-col items-center justify-center gap-1.5 hover:bg-brand-orange group transition-all shadow-premium"
                        >
                            <FileText size={14} className="text-white/40 group-hover:text-white" />
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Borrador PDF</span>
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-enterprise-50">
                        <button
                            onClick={() => cargarCotizacionEdicion(cotizacion)}
                            disabled={cotizacion.estatus === 'ganada'}
                            className="w-full py-4 bg-enterprise-950 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-lg shadow-enterprise-950/20 hover:bg-brand-orange active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="flex items-center justify-center gap-3 relative z-10">
                                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                <span>Editar Estrategia Comercial</span>
                            </div>
                        </button>

                        <button
                            onClick={iniciarNuevaCotizacion}
                            className="w-full py-3 bg-white border border-enterprise-100 rounded-2xl text-[8px] font-black text-enterprise-400 uppercase tracking-[0.4em] hover:bg-enterprise-50 hover:text-error transition-all italic text-center"
                        >
                            Archivar y Finalizar Sesión
                        </button>
                    </div>
                </div>
            </div>

            {/* Client Stage Modal still kept as it's a critical CRM transition */}
            {confirmingStage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-enterprise-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white">
                        <h3 className="text-center text-[10px] font-black text-slate-900 uppercase italic tracking-widest mb-4">
                            Socio Detectado: Actualizar a Cliente
                        </h3>
                        <p className="text-[9px] text-center text-slate-500 mb-6 font-bold uppercase tracking-tight">La venta ha sido exitosa. ¿Deseas mover el registro del socio a la etapa de CLIENTE ACTIVO?</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setConfirmingStage(null)} className="h-10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-xl">Mantener Prospecto</button>
                            <button onClick={() => handleUpdateStage('Cliente')} className="h-10 bg-enterprise-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors">Convertir a Cliente</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CotizacionResult;
