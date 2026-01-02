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
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-0.5 sm:gap-1">
                                        <div className="flex items-center gap-2">
                                            <Target size={8} className="text-brand-orange" />
                                            <span className="text-[6px] sm:text-[7px] font-black text-white/40 uppercase tracking-[0.3em] italic">Target</span>
                                        </div>
                                        <p className="text-sm sm:text-xl font-black text-white tracking-tighter ml-4 sm:ml-6">{formatMXN(presupuesto || 0)}</p>
                                    </div>

                                    <div className="flex-1 max-w-[40%] sm:max-w-[45%] flex flex-col gap-2 sm:gap-3">
                                        <div className="flex items-center justify-between text-[6px] sm:text-[7px] font-black uppercase tracking-[0.3em]">
                                            <div className="flex items-center gap-1">
                                                <span className={isExcedido ? 'text-brand-orange' : 'text-emerald-400'}>{porcentajeUtilizado.toFixed(0)}%</span>
                                            </div>
                                            <span className="text-white/20 hidden sm:inline">System Load</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex items-center">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out relative ${isExcedido ? 'bg-brand-orange shadow-[0_0_10px_rgba(255,102,0,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}
                                                style={{ width: `${Math.min(porcentajeUtilizado, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-0.5 sm:gap-1 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="text-[6px] sm:text-[7px] font-black text-white/40 uppercase tracking-[0.3em] italic">Actual</span>
                                            <Activity size={8} className={isExcedido ? 'text-brand-orange' : 'text-emerald-400'} />
                                        </div>
                                        <p className={`text-sm sm:text-lg font-black italic tracking-tight ${isExcedido ? 'text-brand-orange' : 'text-emerald-400'}`}>{formatMXN(subtotalActual)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FLOW INDICATOR (ONLY MOBILE) */}
                    <div className="flex sm:hidden items-center justify-between px-2 mb-2">
                        {['context', 'digital', 'pauta'].map((s, i) => (
                            <div key={s} className="flex flex-col items-center gap-1 opacity-100 transition-all duration-500">
                                <div className={`w-1.5 h-1.5 rounded-full ${etapaMovil === s ? 'bg-brand-orange scale-150 ring-4 ring-brand-orange/20' : i < ['context', 'digital', 'pauta'].indexOf(etapaMovil) ? 'bg-emerald-500' : 'bg-enterprise-200'}`} />
                                <span className={`text-[6px] font-black uppercase tracking-widest ${etapaMovil === s ? 'text-brand-orange' : 'text-enterprise-300'}`}>{s}</span>
                            </div>
                        ))}
                    </div>

                    {/* STRATEGY HEADER - 2x2 ON TABLET, 1x4 ON DESKTOP */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 ${etapaMovil !== 'context' && etapaMovil !== 'digital' ? 'hidden sm:grid' : ''}`}>
                        <div className={etapaMovil === 'digital' ? 'hidden sm:block' : ''}>
                            <ClientSelector
                                clientes={clientes}
                                clienteSeleccionado={clienteSeleccionado}
                                setClienteSeleccionado={setClienteSeleccionado}
                                compactRow={true}
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
                            compactRow={true}
                            mobileStage={etapaMovil}
                        />

                        {/* Mobile Navigation Buttons */}
                        <div className="sm:hidden mt-2">
                            {etapaMovil === 'context' && (
                                <button
                                    onClick={() => { setEtapaMovil('digital'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={!clienteSeleccionado || !presupuesto}
                                    className="w-full py-4 bg-enterprise-950 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-30"
                                >
                                    Siguiente: Plan Digital <ArrowRight size={14} />
                                </button>
                            )}
                            {etapaMovil === 'digital' && (
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => { setEtapaMovil('pauta'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="w-full py-4 bg-brand-orange text-white rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"
                                    >
                                        Configurar Pauta <ArrowRight size={14} />
                                    </button>
                                    <button
                                        onClick={() => setEtapaMovil('context')}
                                        className="w-full py-3 text-enterprise-400 font-black uppercase text-[8px] tracking-widest"
                                    >
                                        Regresar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CAPTURE GRIDS - SIDE BY SIDE STARTING FROM TABLET */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 items-start text-enterprise-950 ${etapaMovil !== 'pauta' ? 'hidden sm:grid' : ''}`}>
                        <div className="min-w-0">
                            <ProductGrid
                                productos={productos}
                                productosSeleccionados={productosSeleccionados}
                                plazaSeleccionada={plazaSeleccionada}
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
