import React from 'react';
import { Save, Printer, Eye, Calendar, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const CotizacionResult = ({
    cotizacion,
    iniciarNuevaCotizacion,
    guardarCotizacion,
    agregarAComparador,
    mostrarPropuesta,
    configuracion
}) => {
    if (!cotizacion) return null;

    const presupuestoBase = cotizacion.presupuestoBase || 0;
    const inversionDigital = cotizacion.costoVIX || 0;
    const subtotalParaTV = presupuestoBase - inversionDigital;
    const inversionTV = cotizacion.subtotalTV || 0;
    const saldoFinal = subtotalParaTV - inversionTV;

    // El saldo final es positivo si sobra dinero del presupuesto para TV
    const saldoColor = saldoFinal >= 0 ? 'text-green-500' : 'text-red-500';

    return (
        <div className="bg-white rounded-2xl shadow-2xl border-t-8 border-red-700 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-4 md:p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                    <div>
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-2">Análisis de Propuesta</span>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Cotización Generada</h2>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <button
                            onClick={guardarCotizacion}
                            className="flex-1 lg:flex-none h-11 bg-green-600 text-white px-6 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center transition-all shadow-lg active:scale-95 text-sm"
                        >
                            <Save className="mr-2" size={16} />
                            Guardar
                        </button>
                        <button
                            onClick={() => agregarAComparador(cotizacion)}
                            className="flex-1 lg:flex-none h-11 bg-gray-600 text-white px-6 rounded-xl font-bold hover:bg-gray-700 flex items-center justify-center transition-all shadow-lg active:scale-95 text-sm"
                        >
                            <Eye className="mr-2" size={16} />
                            Comparador
                        </button>
                        <button
                            onClick={mostrarPropuesta}
                            className="w-full lg:w-auto h-11 bg-red-600 text-white px-8 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 flex items-center justify-center transition-all shadow-xl active:scale-95 text-sm"
                        >
                            <Printer className="mr-2" size={18} />
                            Ver Propuesta PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-8 items-start">

                    {/* Panel de Información y Digital First */}
                    <div className="md:col-span-2 lg:col-span-8 space-y-8">

                        {/* 1. Inversión Digital (VIX) */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Monitor size={16} className="text-red-600" />
                                1. Inversión Digital (Servicios Adicionales)
                            </h3>

                            {cotizacion.paqueteVIX ? (
                                <div className="p-6 bg-gradient-to-r from-red-50 to-white border-2 border-red-100 rounded-2xl shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Paquete Seleccionado</p>
                                            <p className="text-xl font-black text-gray-800">{cotizacion.paqueteVIX.nombre}</p>
                                            <p className="text-sm font-bold text-gray-500 mt-1">
                                                {cotizacion.paqueteVIX.impresiones.toLocaleString()} Impresiones | {cotizacion.paqueteVIX.dias} Días
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Costo Fijo</p>
                                            <p className="text-2xl font-black text-red-700">{formatMXN(cotizacion.costoVIX)}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center">
                                    <p className="text-sm font-bold text-gray-400 italic">No se incluyeron servicios digitales en esta propuesta (Importe: $0.00)</p>
                                </div>
                            )}
                        </div>

                        {/* 2. Detalle de Pauta TV */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Smartphone size={16} className="text-red-600" />
                                2. Detalle de Inversión y Distribución TV
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cotizacion.distribucion.map((dist, idx) => (
                                    <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-black text-gray-800 text-sm leading-tight">{dist.producto.tipo}</p>
                                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">{dist.producto.canal} | {dist.producto.plaza}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                                                <p className="text-sm font-black text-gray-800">{formatMXN(cotizacion.items.find(i => i.producto.id === dist.producto.id)?.subtotal || 0)}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-gray-50 p-2 rounded-lg text-center font-bold">
                                                <p className="text-[8px] font-bold text-gray-400 uppercase">Unidades</p>
                                                <p className="text-base text-gray-800">{dist.totalUnidades}</p>
                                            </div>
                                            <div className="bg-green-50 p-2 rounded-lg text-center font-bold">
                                                <p className="text-[8px] font-bold text-green-700 uppercase">Pauta/Día</p>
                                                <p className="text-base text-green-600">{dist.unidadesPorDia}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Resumen Financiero Lateral - Optimizado para Tablets y Desktop */}
                    <div className="md:col-span-2 lg:col-span-4 h-full">
                        <div className="bg-gray-900 rounded-2xl p-6 md:p-8 text-white shadow-2xl lg:sticky lg:top-6 lg:mb-10">
                            <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-6 pb-2 border-b border-gray-800 flex items-center gap-2">
                                <Smartphone size={16} />
                                Resumen Presupuestal
                            </h3>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Inversión Inicial:</span>
                                    <span className="font-bold text-base">{formatMXN(presupuestoBase)}</span>
                                </div>

                                <div className="flex justify-between items-center px-3">
                                    <span className="text-[10px] font-black text-red-400 uppercase">Menos Digital:</span>
                                    <span className="text-sm font-bold">-{formatMXN(inversionDigital)}</span>
                                </div>

                                <div className="flex justify-between items-center px-3 pt-4 border-t border-gray-800">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Sobrante para TV:</span>
                                    <span className="text-lg font-black text-white">{formatMXN(subtotalParaTV)}</span>
                                </div>

                                <div className="flex justify-between items-center px-3">
                                    <span className="text-[10px] font-black text-red-500 uppercase">Inversión TV (Net):</span>
                                    <span className="text-sm font-bold text-red-500">-{formatMXN(inversionTV)}</span>
                                </div>

                                <div className={`pt-6 mt-6 border-t-2 border-dashed border-gray-700`}>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black uppercase text-gray-400">Saldo Propuesta:</span>
                                        <span className={`text-xl md:text-2xl font-black ${saldoColor}`}>{formatMXN(saldoFinal)}</span>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-800/50 mt-4 space-y-4">
                                    <div className="flex justify-between items-center opacity-50">
                                        <span className="text-[9px] font-bold uppercase">IVA (${((configuracion.iva_porcentaje || 0.16) * 100).toFixed(0)}%):</span>
                                        <span className="text-xs font-bold">{formatMXN(cotizacion.iva)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black uppercase text-red-500">TOTAL FINAL (+IVA)</span>
                                        <span className="text-2xl font-black text-white">${cotizacion.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        onClick={iniciarNuevaCotizacion}
                                        className="w-full h-11 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold flex items-center justify-center transition-all border border-white/10 text-sm"
                                    >
                                        <RefreshCw className="mr-2" size={16} />
                                        Nueva Propuesta
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info del Cliente al Final para tablets/mobile */}
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Identificación de Propuesta</p>
                        <p className="text-lg font-black text-gray-700">{cotizacion.cliente.nombre}</p>
                        <p className="text-[10px] font-bold text-gray-500">{cotizacion.id} | {cotizacion.cliente.plaza}</p>
                    </div>
                    <div className="bg-white border p-3 rounded-xl shadow-sm text-center min-w-[120px]">
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Duración</p>
                        <p className="text-base font-black text-gray-800">{cotizacion.diasCampana} DÍAS</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CotizacionResult;
