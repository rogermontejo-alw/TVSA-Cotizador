import React, { useState } from 'react';
import {
    Save, Printer, Eye, Smartphone, Monitor,
    CheckCircle, RefreshCw, Briefcase, AlertCircle, Activity, FileText
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const CotizacionResult = ({
    cotizacion,
    iniciarNuevaCotizacion,
    guardarCotizacion,
    agregarAComparador,
    mostrarPropuesta,
    onSaveClient,
    masterContracts = [],
    setMensaje
}) => {
    const [confirmingStage, setConfirmingStage] = useState(null);
    const [confirmingQuoteStatus, setConfirmingQuoteStatus] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
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
                folio: cotizacion.folio || (isNew ? `FOL-${Math.floor(100000 + Math.random() * 900000)}` : cotizacion.id),
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
                }
            };
            const result = await guardarCotizacion('cotizaciones', payload);
            if (result?.[0]) {
                cotizacion.id = result[0].id;
                cotizacion.folio = result[0].folio;
                setMensaje({ tipo: 'exito', texto: 'Plan Guardado Exitosamente.' });
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
                        <span className="text-[7px] font-black text-enterprise-400 uppercase tracking-widest italic leading-none">Seguimiento de Estatus</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${cotizacion.estatus === 'ganada' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-orange/10 text-brand-orange'}`}>
                            {cotizacion.estatus || 'BORRADOR'}
                        </span>
                        <span className="text-[9px] font-black text-enterprise-950 uppercase italic">
                            {cotizacion.folio || 'NUEVO PLAN'}
                        </span>
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
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                <span className="text-white/40">Total Aprobado</span>
                                <span className="text-white">{formatMXN(presupuestoBase)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-brand-orange">
                                <span>Activos Lineales</span>
                                <span>-{formatMXN(inversionTV)}</span>
                            </div>
                            {inversionDigital > 0 && (
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-emerald-500">
                                    <span>Impacto Digital</span>
                                    <span>-{formatMXN(inversionDigital)}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Balance Estratégico</span>
                                <span className={`text-[14px] font-black tracking-widest italic ${saldoColor}`}>{formatMXN(saldoFinal)}</span>
                            </div>
                        </div>
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
                            onClick={mostrarPropuesta}
                            className="bg-enterprise-950 border border-white/10 rounded-2xl h-14 flex flex-col items-center justify-center gap-1.5 hover:bg-brand-orange group transition-all shadow-premium"
                        >
                            <FileText size={14} className="text-white/40 group-hover:text-white" />
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Borrador PDF</span>
                        </button>
                    </div>

                    <button
                        onClick={iniciarNuevaCotizacion}
                        className="w-full py-3 bg-enterprise-50 border border-enterprise-100 rounded-2xl text-[8px] font-black text-enterprise-400 uppercase tracking-widest hover:text-error transition-all italic"
                    >
                        Archivar y Volver al Estratega
                    </button>
                </div>
            </div>

            {/* Modals Normalized to High Density */}
            {confirmingQuoteStatus && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-enterprise-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white">
                        <h3 className="text-center text-[10px] font-black text-slate-900 uppercase italic tracking-widest mb-4">
                            Actualizar Pipeline: {confirmingQuoteStatus.status}
                        </h3>
                        {confirmingQuoteStatus.status === 'ganada' && (
                            <div className="space-y-3 mb-6">
                                <input
                                    type="number"
                                    placeholder="NÚMERO DE CONTRATO..."
                                    value={cierreData.numero_contrato}
                                    onChange={(e) => setCierreData({ ...cierreData, numero_contrato: e.target.value })}
                                    className="w-full h-10 px-4 bg-slate-50 rounded-xl text-[10px] font-black focus:ring-1 focus:ring-emerald-500 outline-none uppercase"
                                />
                                <select
                                    value={cierreData.mc_id}
                                    onChange={(e) => setCierreData({ ...cierreData, mc_id: e.target.value })}
                                    className="w-full h-10 px-4 bg-slate-50 rounded-xl text-[10px] font-black outline-none appearance-none uppercase"
                                >
                                    <option value="">VENTA ÚNICA (SIN MC)</option>
                                    {clientMCs.map(mc => (
                                        <option key={mc.id} value={mc.id}>MC: {mc.numero_mc}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setConfirmingQuoteStatus(null)} className="h-10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-xl">Descartar</button>
                            <button onClick={() => handleUpdateQuoteStatus(confirmingQuoteStatus.status)} className="h-10 bg-enterprise-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-orange">Ejecutar Cambio</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CotizacionResult;
