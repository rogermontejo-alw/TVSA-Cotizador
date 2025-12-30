import React from 'react';
import ClientSelector from '../cotizador/ClientSelector';
import ParametersPanel from '../cotizador/ParametersPanel';
import ProductGrid from '../cotizador/ProductGrid';
import SelectedProducts from '../cotizador/SelectedProducts';
import CotizacionResult from '../cotizador/CotizacionResult';
import { CotizadorSkeleton } from '../ui/Skeleton';
import { TrendingUp, AlertCircle, Wallet, Activity, Target } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const CotizadorView = ({
    data,
    cotizacionState,
    setVistaActual,
    iniciarNuevaCotizacion,
    configuracion,
    mostrarPropuesta,
    guardarCotizacion,
    agregarAComparador,
    mensajeAdmin,
    setMensajeAdmin,
    onSaveClient
}) => {
    const {
        productos,
        clientes,
        paquetesVIX,
        masterContracts,
        loading
    } = data;

    const {
        clienteSeleccionado,
        setClienteSeleccionado,
        plazaSeleccionada,
        setPlazaSeleccionada,
        presupuesto,
        setPresupuesto,
        duracionDias,
        setDuracionDias,
        paqueteVIX,
        setPaqueteVIX,
        productosSeleccionados,
        cotizacionResult,
        subtotalActual,
        subtotalTVActual,
        subtotalVIXActual,
        calcularPrecioUnitario,
        agregarProducto,
        actualizarCantidad,
        eliminarProducto,
        sugerirDistribucion,
        generarCotizacion,
    } = cotizacionState;

    if (loading) {
        return (
            <div className="max-w-[1000px] mx-auto pt-10">
                <CotizadorSkeleton />
            </div>
        );
    }

    const saldoRestante = (presupuesto || 0) - subtotalActual;
    const porcentajeUtilizado = presupuesto > 0 ? (subtotalActual / presupuesto) * 100 : 0;
    const isExcedido = saldoRestante < 0;

    return (
        <div className="max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-24 px-4 sm:px-0">
            {!cotizacionResult ? (
                <div className="flex flex-col gap-4">

                    {/* TOP STATUS BAR - NEXUS KPI CONSOLE */}
                    <div className="sticky top-20 z-40 mb-4 animate-in slide-in-from-top duration-700">
                        <div className={`bg-enterprise-950 border ${isExcedido ? 'border-brand-orange/50 shadow-brand-orange/10' : 'border-white/10'} rounded-[1.5rem] p-5 shadow-2xl relative overflow-hidden`}>
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-brand-orange/5 to-transparent pointer-events-none" />
                            <div className="absolute -left-10 -top-10 w-32 h-32 bg-brand-orange/5 blur-3xl rounded-full" />

                            <div className="relative z-10 flex flex-col gap-4">
                                {/* MAIN STATS ROW */}
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-brand-orange/30 flex items-center justify-center">
                                                <Target size={8} className="text-brand-orange" />
                                            </div>
                                            <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em] italic">Target Plan</span>
                                        </div>
                                        <p className="text-xl font-black text-white tracking-tighter ml-6">{formatMXN(presupuesto || 0)}</p>
                                    </div>

                                    <div className="flex-1 max-w-[45%] flex flex-col gap-3">
                                        <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-[0.3em]">
                                            <span className="text-white/20">System Load</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/40 italic">Efficiency</span>
                                                <span className={isExcedido ? 'text-brand-orange' : 'text-emerald-400'}>{porcentajeUtilizado.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex items-center">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out relative ${isExcedido ? 'bg-brand-orange shadow-[0_0_10px_rgba(255,102,0,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}
                                                style={{ width: `${Math.min(porcentajeUtilizado, 100)}%` }}
                                            >
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-lg" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECONDARY MONITORING ROW */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <Activity size={10} className={isExcedido ? 'text-brand-orange' : 'text-emerald-400'} />
                                            <span className="text-[7px] font-black text-white/30 uppercase tracking-widest italic">Actual Run:</span>
                                            <span className={`text-[10px] font-black italic ${isExcedido ? 'text-brand-orange' : 'text-emerald-400'}`}>{formatMXN(subtotalActual)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[7px] font-black text-white/30 uppercase tracking-widest italic">Net Available:</span>
                                            <span className={`text-[10px] font-black tracking-tight ${isExcedido ? 'text-brand-orange' : 'text-white'}`}>{formatMXN(saldoRestante)}</span>
                                        </div>
                                        {isExcedido && <AlertCircle size={12} className="text-brand-orange animate-pulse" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STRATEGY HEADER - SINGLE COMPACT ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <ClientSelector
                            clientes={clientes}
                            clienteSeleccionado={clienteSeleccionado}
                            setClienteSeleccionado={setClienteSeleccionado}
                            compactRow={true}
                        />
                        <ParametersPanel
                            productos={productos}
                            plazaSeleccionada={plazaSeleccionada}
                            setPlazaSeleccionada={setPlazaSeleccionada}
                            presupuesto={presupuesto}
                            setPresupuesto={setPresupuesto}
                            duracionDias={duracionDias}
                            setDuracionDias={setDuracionDias}
                            paqueteVIX={paqueteVIX}
                            setPaqueteVIX={setPaqueteVIX}
                            paquetesVIX={paquetesVIX}
                            sugerirDistribucion={sugerirDistribucion}
                            clienteSeleccionado={clienteSeleccionado}
                            compactRow={true}
                        />
                    </div>

                    {/* CAPTURE GRIDS - TWO COLUMNS SIDE BY SIDE */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2 items-start text-enterprise-950">
                        <ProductGrid
                            productos={productos}
                            productosSeleccionados={productosSeleccionados}
                            plazaSeleccionada={plazaSeleccionada}
                            clienteSeleccionado={clienteSeleccionado}
                            calcularPrecioUnitario={calcularPrecioUnitario}
                            agregarProducto={agregarProducto}
                        />

                        <SelectedProducts
                            productos={productos}
                            productosSeleccionados={productosSeleccionados}
                            paqueteVIX={paqueteVIX}
                            setPaqueteVIX={setPaqueteVIX}
                            paquetesVIX={paquetesVIX}
                            actualizarCantidad={actualizarCantidad}
                            eliminarProducto={eliminarProducto}
                            generarCotizacion={generarCotizacion}
                            presupuesto={presupuesto}
                            subtotalActual={subtotalActual}
                            subtotalTVActual={subtotalTVActual}
                            subtotalVIXActual={subtotalVIXActual}
                            clienteSeleccionado={clienteSeleccionado}
                            calcularPrecioUnitario={calcularPrecioUnitario}
                            onlyItems={true}
                        />
                    </div>

                    {/* SUMMARY ROW - FULL WIDTH BUT RIGHT ALIGNED CONTENT */}
                    <div className="flex justify-end mt-4">
                        <div className="w-full lg:w-1/2">
                            <SelectedProducts
                                presupuesto={presupuesto}
                                subtotalActual={subtotalActual}
                                subtotalTVActual={subtotalTVActual}
                                subtotalVIXActual={subtotalVIXActual}
                                generarCotizacion={generarCotizacion}
                                onlySummary={true}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <CotizacionResult
                    cotizacion={cotizacionResult}
                    iniciarNuevaCotizacion={iniciarNuevaCotizacion}
                    guardarCotizacion={guardarCotizacion}
                    agregarAComparador={agregarAComparador}
                    mostrarPropuesta={(data) => mostrarPropuesta(data || cotizacionResult)}
                    configuracion={configuracion}
                    onSaveClient={onSaveClient}
                    masterContracts={masterContracts}
                    setMensaje={setMensajeAdmin}
                />
            )}
        </div>
    );
};

export default CotizadorView;
