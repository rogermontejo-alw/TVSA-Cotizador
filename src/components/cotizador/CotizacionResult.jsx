import React, { useState } from 'react';
import {
    Save, Printer, Eye, Smartphone, Monitor, ChevronDown,
    CheckCircle, RefreshCw, Briefcase, AlertCircle, ArrowRight, FileText as FileTextIcon
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const CotizacionResult = ({
    cotizacion,
    iniciarNuevaCotizacion,
    guardarCotizacion,
    agregarAComparador,
    mostrarPropuesta,
    configuracion,
    onSaveClient,
    setMensaje
}) => {
    const [confirmingStage, setConfirmingStage] = useState(null);
    const [confirmingQuoteStatus, setConfirmingQuoteStatus] = useState(null); // { quote, status }
    const [isUpdating, setIsUpdating] = useState(false);

    if (!cotizacion) return null;

    const cliente = cotizacion.cliente;
    const stages = ['Prospecto', 'Contactado', 'Interesado', 'No Interesado', 'Cliente'];
    const currentStageIdx = stages.indexOf(cliente?.etapa);

    const handleUpdateStage = async (targetStage) => {
        setIsUpdating(true);
        try {
            const updated = { ...cliente, etapa: targetStage };
            const success = await onSaveClient('clientes', updated);
            if (success) {
                setMensaje({ tipo: 'exito', texto: `¡Venta Cerrada! El cliente ahora está en etapa: ${targetStage}` });
                setConfirmingStage(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateQuoteStatus = async (newStatus) => {
        setIsUpdating(true);
        try {
            // Solo si la cotización ya existe en DB (tiene ID UUID)
            if (!cotizacion.id || cotizacion.id.startsWith('COT-')) {
                setMensaje({ tipo: 'info', texto: 'Primero debes guardar la cotización para cambiar su estatus oficial.' });
                setConfirmingQuoteStatus(null);
                return;
            }

            const success = await onSaveClient('cotizaciones', { id: cotizacion.id, estatus: newStatus });
            if (success) {
                setMensaje({ tipo: 'exito', texto: `Cotización marcada como ${newStatus.toUpperCase()}` });

                // Si la cotización es GANADA y el cliente no es etapa "Cliente", preguntar por cambio de etapa
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

    const presupuestoBase = cotizacion.presupuestoBase || 0;
    const inversionDigital = cotizacion.costoVIX || 0;
    const subtotalParaTV = presupuestoBase - inversionDigital;
    const inversionTV = cotizacion.subtotalTV || 0;
    const saldoFinal = subtotalParaTV - inversionTV;
    const inversionTotalNeto = inversionDigital + inversionTV;

    // El saldo sigue teniendo color dinámico pero dentro del botón
    const saldoColor = saldoFinal >= 0 ? 'text-green-400' : 'text-red-400';

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">

            {/* Cabecera Compacta */}
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <CheckCircle size={24} className="text-green-500" />
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Cotización Generada</h2>
                </div>
                <button
                    onClick={iniciarNuevaCotizacion}
                    className="text-[10px] font-bold text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors uppercase"
                >
                    <RefreshCw size={12} /> Nueva
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                {/* LADO IZQUIERDO: DETALLES (Tablet/Desktop) */}
                <div className="md:col-span-7 lg:col-span-8 order-2 md:order-1 space-y-6">

                    {/* Inversión Digital */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                            <Monitor size={14} className="text-red-600" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Detalle Inversión Digital</span>
                        </div>
                        <div className="p-4">
                            {cotizacion.paqueteVIX ? (
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-black text-gray-800">{cotizacion.paqueteVIX.nombre}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{cotizacion.paqueteVIX.impresiones.toLocaleString()} Impresiones | {cotizacion.paqueteVIX.dias} Días</p>
                                    </div>
                                    <p className="text-base font-black text-red-700">{formatMXN(cotizacion.costoVIX)}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic text-center py-2">Sin inversión digital</p>
                            )}
                        </div>
                    </div>

                    {/* Detalle Pauta TV */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                            <Smartphone size={14} className="text-red-600" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Detalle Pauta TV</span>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cotizacion.distribucion.map((dist, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="font-black text-gray-800 text-[11px] leading-tight line-clamp-1">{dist.producto.tipo}</p>
                                    <p className="text-[9px] font-bold text-red-600 uppercase mb-2">{dist.producto.canal} | {dist.totalUnidades} Unids.</p>
                                    <p className="text-xs font-black text-gray-700 border-t pt-2 mt-1">
                                        {formatMXN(cotizacion.items.find(i => i.producto.id === dist.producto.id)?.subtotal || 0)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* LADO DERECHO: RESUMEN FINANCIERO (Delgado e Invariante) */}
                <div className="md:col-span-5 lg:col-span-4 order-1 md:order-2">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl md:sticky md:top-6 w-full max-w-sm mx-auto">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-6 border-b border-white/10 pb-2">
                            Resumen Financiero
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Inversión Inicial:</span>
                                <span className="text-xs font-black">${presupuestoBase.toLocaleString('es-MX')}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">(-) Inversión Digital:</span>
                                <span className="text-xs font-black text-red-500">-${inversionDigital.toLocaleString('es-MX')}</span>
                            </div>

                            <div className="py-2 border-y border-white/5 my-1 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Sobrante para TV:</span>
                                <span className="text-xs font-black text-white">${subtotalParaTV.toLocaleString('es-MX')}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">(-) Inversión TV (Net):</span>
                                <span className="text-xs font-black text-red-500">-${inversionTV.toLocaleString('es-MX')}</span>
                            </div>

                            <div className="pt-6 border-t border-white/10 mt-4 space-y-4">
                                {/* CUADRO ROJO: MUESTRA LA INVERSIÓN TOTAL */}
                                <div className="text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Inversión Total Propuesta</p>
                                    <div className="inline-block px-5 py-2 bg-red-600 rounded-lg shadow-lg border border-red-500">
                                        <p className="text-lg font-black text-white">
                                            {formatMXN(inversionTotalNeto)}
                                        </p>
                                    </div>
                                    <p className="text-[8px] font-bold text-gray-500 mt-1 uppercase">más IVA</p>
                                </div>

                                {/* SALDO FINAL (Pequeño debajo) */}
                                <div className="flex justify-between items-center px-2 py-2 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Saldo Final:</span>
                                    <span className={`text-sm font-black ${saldoColor}`}>${saldoFinal.toLocaleString('es-MX')}</span>
                                </div>

                                {/* Acciones Compactas */}
                                <div className="space-y-2 pt-2">
                                    <button
                                        onClick={mostrarPropuesta}
                                        className="w-full h-10 bg-white text-slate-900 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 flex items-center justify-center transition-all shadow-md"
                                    >
                                        <Printer className="mr-2" size={14} />
                                        Generar Propuesta PDF
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={guardarCotizacion}
                                            className="h-8 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/20 rounded-lg font-black text-[9px] flex items-center justify-center transition-all uppercase"
                                        >
                                            Guardar
                                        </button>
                                        <button
                                            onClick={() => agregarAComparador(cotizacion)}
                                            className="h-8 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-black text-[9px] flex items-center justify-center transition-all uppercase"
                                        >
                                            Comparar
                                        </button>
                                    </div>
                                </div>

                                {/* Estatus de la Propuesta (NUEVO) */}
                                <div className="pt-6 border-t border-white/10 space-y-3">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <FileTextIcon size={12} className="text-gray-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Estatus de Propuesta</span>
                                        </div>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${cotizacion.estatus === 'ganada' ? 'bg-emerald-500 text-white' :
                                            cotizacion.estatus === 'perdida' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                                            }`}>
                                            {cotizacion.estatus || 'borrador'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['enviada', 'ganada', 'perdida'].map(st => (
                                            <button
                                                key={st}
                                                onClick={() => setConfirmingQuoteStatus({ status: st })}
                                                className={`py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all
                                                    ${cotizacion.estatus === st
                                                        ? st === 'ganada' ? 'bg-emerald-500 text-white' : st === 'perdida' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {cliente && (
                                    <div className="pt-6 border-t border-white/10 space-y-3">
                                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">
                                                Propuesta para: {cliente.nombre_empresa}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmación de Cambio de Etapa */}
            {confirmingStage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} />
                        </div>

                        <h3 className="text-center text-lg font-black text-slate-900 leading-tight mb-2">
                            {confirmingStage === 'Cliente' ? '¡FELICIDADES POR LA VENTA!' : `¿CAMBIAR A ${confirmingStage.toUpperCase()}?`}
                        </h3>
                        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                            {confirmingStage === 'Cliente'
                                ? 'Esto marcará al cliente como GANADO en el Pipeline'
                                : 'Esta acción actualizará el estado comercial del cliente'}
                        </p>

                        <div className="flex flex-col gap-2">
                            <button
                                disabled={isUpdating}
                                onClick={() => handleUpdateStage(confirmingStage)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                            >
                                {isUpdating && <RefreshCw size={14} className="animate-spin" />}
                                {confirmingStage === 'Cliente' ? 'Cerrar Venta Ahora' : 'Confirmar Cambio'}
                            </button>
                            <button
                                onClick={() => setConfirmingStage(null)}
                                className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                onClick={() => handleUpdateQuoteStatus(confirmingQuoteStatus.status)}
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

export default CotizacionResult;
