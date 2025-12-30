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
            <div className="max-w-[1200px] mx-auto pt-10">
                <CotizadorSkeleton />
            </div>
        );
    }

    const saldoRestante = (presupuesto || 0) - subtotalActual;
    const porcentajeUtilizado = presupuesto > 0 ? (subtotalActual / presupuesto) * 100 : 0;
    const isExcedido = saldoRestante < 0;

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-24 px-4 sm:px-0">
            {!cotizacionResult ? (
                <div className="flex flex-col gap-4">

                    {/* TOP STATUS BAR - DUAL LEVEL KPI CONSOLE */}
                    <div className="sticky top-20 z-40 mb-2">
                        <div className={`bg-enterprise-950 border ${isExcedido ? 'border-brand-orange animate-pulse' : 'border-white/20'} rounded-2xl p-3 shadow-2xl relative overflow-hidden`}>
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-orange/5 to-transparent pointer-events-none" />

                            <div className="relative z-10 flex flex-col gap-2.5">
                                {/* TOP ROW: PRIMARY OBJECTIVES (PLAN & EFFICIENCY) */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                    <div className="flex items-center gap-3">
                                        <Target size={12} className="text-brand-orange" />
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-[6px] font-black text-white/50 uppercase tracking-[0.2em] leading-none mb-1">Target Plan</p>
                                                <p className="text-[11px] font-black text-white leading-none tracking-tight">{formatMXN(presupuesto || 0)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 max-w-[50%] flex items-center justify-end gap-3 px-4 border-l border-white/10">
                                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${isExcedido ? 'bg-brand-orange' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(porcentajeUtilizado, 100)}%` }}
                                            />
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[6px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Efficiency</p>
                                            <p className={`text-[10px] font-black leading-none ${isExcedido ? 'text-brand-orange' : 'text-emerald-400'}`}>
                                                {porcentajeUtilizado.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTTOM ROW: CURRENT STATUS (ACTUAL & AVAILABLE) */}
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <Activity size={10} className={isExcedido ? 'text-error' : 'text-emerald-400'} />
                                            <div>
                                                <span className="text-[6px] font-black text-white/40 uppercase tracking-widest mr-2">Actual Run:</span>
                                                <span className={`text-[10px] font-black ${isExcedido ? 'text-error' : 'text-emerald-400'}`}>{formatMXN(subtotalActual)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="text-[6px] font-black text-white/40 uppercase tracking-widest mr-2">Net Available:</span>
                                            <span className={`text-[10px] font-black tracking-tight ${isExcedido ? 'text-brand-orange' : 'text-white'}`}>
                                                {formatMXN(saldoRestante)}
                                            </span>
                                        </div>
                                        {isExcedido && <AlertCircle size={12} className="text-brand-orange" />}
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
                    mostrarPropuesta={() => mostrarPropuesta(cotizacionResult)}
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
