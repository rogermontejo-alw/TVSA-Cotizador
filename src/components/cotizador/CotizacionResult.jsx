import React from 'react';
import { Save, Printer, Eye, Calendar, RefreshCw, FileText, ChevronRight } from 'lucide-react';
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

    return (
        <div className="bg-white rounded-2xl shadow-2xl border-t-8 border-red-700 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                    <div>
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-2">Resultados del Cálculo</span>
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Cotización Generada</h2>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <button
                            onClick={guardarCotizacion}
                            className="flex-1 lg:flex-none h-11 bg-green-600 text-white px-6 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center transition-all shadow-lg active:scale-95"
                        >
                            <Save className="mr-2" size={18} />
                            Guardar
                        </button>
                        <button
                            onClick={() => agregarAComparador(cotizacion)}
                            className="flex-1 lg:flex-none h-11 bg-gray-600 text-white px-6 rounded-xl font-bold hover:bg-gray-700 flex items-center justify-center transition-all shadow-lg active:scale-95"
                        >
                            <Eye className="mr-2" size={18} />
                            Comparador
                        </button>
                        <button
                            onClick={mostrarPropuesta}
                            className="w-full lg:w-auto h-11 bg-red-600 text-white px-8 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 flex items-center justify-center transition-all shadow-xl active:scale-95"
                        >
                            <Printer className="mr-2" size={18} />
                            Ver Propuesta PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Info del Cliente */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cliente Solicitante</p>
                                    <p className="text-2xl font-black text-red-700">{cotizacion.cliente.nombre}</p>
                                    <p className="text-sm font-bold text-gray-500 mt-1">{cotizacion.cliente.segmento} | {cotizacion.cliente.plaza}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Periodo de Campaña</p>
                                    <p className="text-lg font-black text-gray-800">{cotizacion.diasCampana} DÍAS</p>
                                </div>
                            </div>
                        </div>

                        {/* Proyección de Distribución */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={16} className="text-red-600" />
                                Proyección de Distribución de Pauta
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cotizacion.distribucion.map((dist, idx) => (
                                    <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col gap-1 mb-3">
                                            <p className="font-black text-gray-800 text-sm leading-tight">{dist.producto.tipo}</p>
                                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">{dist.producto.canal} | {dist.producto.plaza}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-gray-50 p-2 rounded-lg text-center">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">Inserciones</p>
                                                <p className="text-lg font-black text-gray-800">{dist.totalUnidades}</p>
                                            </div>
                                            <div className="bg-green-50 p-2 rounded-lg text-center">
                                                <p className="text-[9px] font-bold text-green-700 uppercase">Pauta/Día</p>
                                                <p className="text-lg font-black text-green-600">{dist.unidadesPorDia}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Resumen Financiero Lateral */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-2xl p-6 text-white shadow-2xl sticky top-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-6 pb-2 border-b border-gray-700">Resumen Presupuestal</h3>

                            <div className="space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Inversión TV (Net):</span>
                                    <span className="font-bold">{formatMXN(cotizacion.subtotalTV)}</span>
                                </div>

                                {cotizacion.paqueteVIX && (
                                    <div className="flex justify-between items-center py-2 px-3 bg-gray-700 rounded-lg border border-gray-600">
                                        <span className="text-[10px] font-black uppercase text-red-400">VIX {cotizacion.paqueteVIX.nombre}</span>
                                        <span className="text-xs font-bold">{formatMXN(cotizacion.costoVIX)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-5 border-t border-gray-700">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Subtotal Neto:</span>
                                    <span className="text-xl font-black">{formatMXN(cotizacion.subtotalGeneral)}</span>
                                </div>

                                <div className="flex justify-between items-center opacity-60">
                                    <span className="text-[10px] font-bold uppercase">IVA (${((configuracion.iva_porcentaje || 0.16) * 100).toFixed(0)}%):</span>
                                    <span className="text-sm font-bold">{formatMXN(cotizacion.iva)}</span>
                                </div>

                                <div className="pt-6 mt-6 border-t-2 border-red-700">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black uppercase text-red-500">Total Planificado</span>
                                        <span className="text-3xl font-black">{formatMXN(cotizacion.total)}</span>
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <button
                                        onClick={iniciarNuevaCotizacion}
                                        className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold flex items-center justify-center transition-all border border-white/20"
                                    >
                                        <RefreshCw className="mr-2" size={18} />
                                        Limpiar y Reiniciar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desglose Detallado */}
                <div className="pt-8 border-t border-gray-100">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Detalle de Inversión por Producto</h3>
                    <div className="space-y-3">
                        {cotizacion.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 hover:bg-white border-2 border-transparent hover:border-red-100 rounded-2xl transition-all">
                                <div className="flex-1 mb-2 md:mb-0">
                                    <p className="font-black text-gray-800">{item.producto.tipo} - {item.producto.canal}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.producto.plaza} | {item.producto.horario} | {item.producto.duracion}</p>
                                </div>
                                <div className="flex gap-8 items-center w-full md:w-auto overflow-x-auto whitespace-nowrap">
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Cant.</p>
                                        <p className="font-black text-gray-800">{item.cantidad}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Unitario</p>
                                        <p className="font-black text-gray-800">{formatMXN(item.precioUnitario)}</p>
                                    </div>
                                    {item.descuentoVolumen > 0 && (
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-green-600 uppercase">Dcto.</p>
                                            <p className="font-black text-green-600">{item.descuentoVolumen}%</p>
                                        </div>
                                    )}
                                    <div className="text-right pl-4 border-l border-gray-200">
                                        <p className="text-[9px] font-bold text-red-700 uppercase">Subtotal</p>
                                        <p className="text-lg font-black text-red-700">{formatMXN(item.subtotal)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CotizacionResult;
