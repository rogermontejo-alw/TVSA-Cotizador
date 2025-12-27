import React from 'react';
import { ArrowLeft, FileText, Printer, Eye, Trash2, Calendar } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const HistoryView = ({
    setVistaActual,
    historial,
    setCotizacion,
    agregarAComparador,
    mostrarPropuesta
}) => {
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
                                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Archivo Histórico</h1>
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Control de propuestas emitidas</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                            <FileText className="text-gray-400" size={24} />
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Registros</p>
                                <p className="text-xl font-black text-gray-800">{historial.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {historial.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl p-20 text-center border border-gray-100">
                        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText size={40} className="text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">No hay registros aún</h2>
                        <p className="text-gray-400 font-medium">Las cotizaciones que guardes aparecerán en este archivo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {historial.map(cotz => (
                            <div key={cotz.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 hover:-translate-y-1">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">Emitida</span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                                            <Calendar size={12} /> {cotz.fecha.toLocaleDateString()} - {cotz.fecha.toLocaleTimeString()}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-black text-gray-800 mb-1">{cotz.cliente.nombre}</h3>
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <p className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block uppercase tracking-tighter">
                                            {cotz.items.length} Productos | {cotz.paqueteVIX ? 'Incluye VIX' : 'Sin VIX'}
                                        </p>
                                        <p className="text-xs font-black text-red-700">Total: {formatMXN(cotz.total)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => { setCotizacion(cotz); setVistaActual('cotizador'); }}
                                        className="flex-1 md:flex-none h-11 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold flex items-center justify-center transition-all"
                                        title="Editar/Regenerar"
                                    >
                                        <Eye className="mr-2" size={18} /> Ver
                                    </button>
                                    <button
                                        onClick={() => mostrarPropuesta(cotz)}
                                        className="flex-1 md:flex-none h-11 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center transition-all shadow-lg"
                                        title="Imprimir PDF"
                                    >
                                        <Printer className="mr-2" size={18} /> Reporte
                                    </button>
                                    <button
                                        onClick={() => agregarAComparador(cotz)}
                                        className="h-11 w-11 bg-gray-800 hover:bg-gray-900 text-white rounded-xl flex items-center justify-center transition-all"
                                        title="Añadir a Comparador"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryView;
