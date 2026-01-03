import React, { useState } from 'react';
import ClientSelector from '../cotizador/ClientSelector';
import ParametersPanel from '../cotizador/ParametersPanel';
import ProductGrid from '../cotizador/ProductGrid';
import SelectedProducts from '../cotizador/SelectedProducts';
import CotizacionResult from '../cotizador/CotizacionResult';
import { CotizadorSkeleton } from '../ui/Skeleton';
import { TrendingUp, AlertCircle, Wallet, Activity, Target, ArrowRight, RotateCcw } from 'lucide-react';
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
        cargarCotizacionEdicion,
    } = cotizacionState;

    const [etapaMovil, setEtapaMovil] = useState('context'); // 'context', 'digital', 'pauta'

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

                    {/* TOP STATUS BAR - PERSISTENT & STICKY */}
                    <div className="sticky top-20 z-50 mb-4 animate-in slide-in-from-top duration-700">
                        <div className={`bg-enterprise-950 border ${isExcedido ? 'border-brand-orange/50 shadow-brand-orange/10' : 'border-white/10'} rounded-[1.5rem] p-4 sm:p-5 shadow-2xl relative overflow-hidden`}>
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-brand-orange/5 to-transparent pointer-events-none" />

                            <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
                                {/* MAIN STATS ROW */}
                                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center w-full">
                                    {/* AREA 1: TARGET */}
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <Target size={8} className="text-brand-orange" />
                                            <span className="text-[6px] sm:text-[7px] font-black text-white/70 uppercase tracking-[0.3em] italic">Target</span>
                                        </div>
                                        <p className="text-sm sm:text-lg font-black text-white tracking-tighter ml-4 sm:ml-5">
                                            {formatMXN(Number(presupuesto) || 0)}
                                        </p>
                                    </div>

                                    {/* AREA 2: PROGRESS (CENTERED) */}
                                    <div className="flex flex-col items-center gap-1.5 px-4">
                                        <div className="w-full flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-[5px] sm:text-[6px] font-black uppercase tracking-[0.2em] mb-0.5">
                                                <span className={isExcedido ? 'text-brand-orange' : 'text-emerald-400'}>{porcentajeUtilizado.toFixed(0)}%</span>
                                                <span className="text-white/40">Load</span>
                                            </div>
                                            <div className="h-0.5 sm:h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ease-out ${isExcedido ? 'bg-brand-orange' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]'}`}
                                                    style={{ width: `${Math.min(porcentajeUtilizado, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* AREA 3: BALANCE & RESET */}
                                    <div className="flex items-center gap-3 sm:gap-6 justify-end">
                                        <div className="flex flex-col items-start gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[6px] sm:text-[7px] font-black text-white/70 uppercase tracking-[0.3em] italic">Saldo Disponible</span>
                                                <Activity size={8} className={isExcedido ? 'text-brand-orange pulse-neon' : 'text-emerald-400'} />
                                            </div>
                                            <p className={`text-xs sm:text-2xl font-black italic tracking-tighter leading-none ${isExcedido ? 'text-brand-orange' : 'text-emerald-400'}`}>
                                                {formatMXN(saldoRestante)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={iniciarNuevaCotizacion}
                                            className="w-8 h-8 sm:w-12 sm:h-12 bg-error rounded-xl sm:rounded-2xl flex items-center justify-center group active:scale-90 transition-all shadow-lg shadow-error/30 shrink-0"
                                            title="Reiniciar Cotización"
                                        >
                                            <RotateCcw size={16} className="text-white group-hover:rotate-180 transition-transform duration-700" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                        <div>
                            <ClientSelector
                                clientes={clientes}
                                clienteSeleccionado={clienteSeleccionado}
                                setClienteSeleccionado={setClienteSeleccionado}
                                compactRow={true}
                                mobileStage={etapaMovil}
                            />
                        </div>
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
                            iniciarNuevaCotizacion={iniciarNuevaCotizacion}
                            compactRow={true}
                            mobileStage={etapaMovil}
                        />

                        {/* Navigation Buttons (Visible on Mobile, Tablet and small Desktops) */}
                        <div className="xl:hidden mt-2">
                            {etapaMovil === 'context' && (
                                <button
                                    onClick={() => { setEtapaMovil('digital'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={!clienteSeleccionado || !presupuesto}
                                    className="w-full py-4 bg-enterprise-950 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-30 shadow-xl"
                                >
                                    Siguiente: Plan Digital <ArrowRight size={14} />
                                </button>
                            )}
                            {etapaMovil === 'digital' && (
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => { setEtapaMovil('pauta'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="w-full py-4 bg-brand-orange text-white rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-brand-orange/20"
                                    >
                                        Configurar Pauta <ArrowRight size={14} />
                                    </button>
                                    <button
                                        onClick={() => setEtapaMovil('context')}
                                        className="w-full py-3 text-enterprise-400 font-black uppercase text-[8px] tracking-widest"
                                    >
                                        Regresar a Parámetros
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Desktop/Tablet Transition Message (Only visible on larger screens if in early stages) */}
                    {(etapaMovil === 'context' || etapaMovil === 'digital') && (
                        <div className="hidden xl:flex items-center justify-center py-10 bg-white/50 rounded-[3rem] border-2 border-dashed border-enterprise-100 animate-in fade-in duration-700">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-enterprise-500 uppercase tracking-[0.4em] mb-4">Configuración de contexto lista</p>
                                <button
                                    onClick={() => setEtapaMovil('pauta')}
                                    disabled={!clienteSeleccionado || !presupuesto}
                                    className="px-10 py-4 bg-enterprise-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-4 hover:bg-brand-orange transition-all disabled:opacity-20 active:scale-95 shadow-2xl"
                                >
                                    Abrir Consola de Pauta <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* CAPTURE GRIDS - SIDE BY SIDE STARTING FROM TABLET */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 items-start text-enterprise-950">
                        <div className="min-w-0">
                            <ProductGrid
                                productos={productos}
                                productosSeleccionados={productosSeleccionados}
                                plazaSeleccionada={plazaSeleccionada}
                                setPlazaSeleccionada={setPlazaSeleccionada}
                                clienteSeleccionado={clienteSeleccionado}
                                calcularPrecioUnitario={calcularPrecioUnitario}
                                agregarProducto={agregarProducto}
                            />
                        </div>

                        <div className="min-w-0">
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
                    cargarCotizacionEdicion={cargarCotizacionEdicion}
                    guardarCotizacion={guardarCotizacion}
                    agregarAComparador={agregarAComparador}
                    mostrarPropuesta={(data) => mostrarPropuesta(data || cotizacionResult)}
                    configuracion={configuracion}
                    onSaveClient={onSaveClient}
                    masterContracts={masterContracts}
                    perfil={data.perfil}
                    setMensaje={setMensajeAdmin}
                />
            )}
        </div>
    );
};

export default CotizadorView;
