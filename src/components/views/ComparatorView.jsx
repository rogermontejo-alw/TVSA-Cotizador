import React from 'react';
import { ArrowLeft, Trash2, Printer, Plus } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ComparatorView = ({
    setVistaActual,
    comparar,
    setComparar,
    mostrarPropuesta
}) => {
    const removerDeComparator = (id) => {
        setComparar(prev => prev.filter(c => c.id !== id));
    };

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
                                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Comparador de Escenarios</h1>
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Análisis de rendimiento y costos</p>
                            </div>
                        </div>

                        {comparar.length > 0 && (
                            <button
                                onClick={() => setComparar([])}
                                className="flex items-center gap-2 text-red-600 font-black uppercase text-[10px] tracking-widest hover:text-red-700 transition-all"
                            >
                                <Trash2 size={16} /> Limpiar todo
                            </button>
                        )}
                    </div>
                </div>

                {comparar.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl p-20 text-center border border-gray-100">
                        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Plus size={40} className="text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">No hay escenarios seleccionados</h2>
                        <p className="text-gray-400 font-medium max-w-sm mx-auto">Selecciona "Comparar" desde el historial o después de generar una cotización para ver las diferencias.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-8">
                        <div className="flex gap-6 min-w-max">
                            {comparar.map(cotz => (
                                <div key={cotz.id} className="w-80 bg-white rounded-3xl shadow-2xl border-2 border-transparent hover:border-red-500 transition-all duration-300 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => removerDeComparator(cotz.id)}
                                            className="bg-white/80 backdrop-blur shadow-md p-2 rounded-full text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="p-8">
                                        <div className="mb-6">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Escenario</p>
                                            <h3 className="text-xl font-black text-gray-800 leading-tight">{cotz.cliente.nombre}</h3>
                                            <p className="text-xs font-bold text-red-600 mt-1">{cotz.items.length} Productos | {cotz.paqueteVIX ? 'VIX ON' : 'VIX OFF'}</p>
                                        </div>

                                        <div className="space-y-4 py-6 border-y border-gray-50">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Inversión Bruta</span>
                                                <span className="font-bold text-gray-800">{formatMXN(cotz.subtotalGeneral)}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Unidades Totales</span>
                                                <span className="font-black text-gray-800">{cotz.distribucion.reduce((a, b) => a + b.totalUnidades, 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Duración</span>
                                                <span className="font-black text-gray-800">{cotz.diasCampana} DÍAS</span>
                                            </div>
                                        </div>

                                        <div className="py-8 text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Final con IVA</p>
                                            <p className="text-3xl font-black text-red-700">{formatMXN(cotz.total)}</p>
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                onClick={() => mostrarPropuesta(cotz)}
                                                className="w-full h-12 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Printer size={16} /> Imprimir Escenario
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Distribución</p>
                                        <div className="space-y-2">
                                            {cotz.distribucion.slice(0, 3).map((d, i) => (
                                                <div key={i} className="flex justify-between items-center text-[11px] font-bold">
                                                    <span className="text-gray-600 truncate mr-2">{d.producto.tipo}</span>
                                                    <span className="bg-gray-200 px-1.5 rounded text-gray-800">{d.totalUnidades}</span>
                                                </div>
                                            ))}
                                            {cotz.distribucion.length > 3 && (
                                                <p className="text-[9px] font-black text-gray-300 text-center uppercase mt-2">+{cotz.distribucion.length - 3} productos más</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComparatorView;
