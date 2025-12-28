import React from 'react';
import ClientSelector from '../cotizador/ClientSelector';
import ParametersPanel from '../cotizador/ParametersPanel';
import ProductGrid from '../cotizador/ProductGrid';
import SelectedProducts from '../cotizador/SelectedProducts';
import CotizacionResult from '../cotizador/CotizacionResult';

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
        ultimaActualizacion,
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
        historial,
        comparar
    } = cotizacionState;

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="w-16 h-16 border-4 border-red-700 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sincronizando con CRM Televisa MID...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div>
                {/* Eliminamos el Header antiguo ya que ahora tenemos un Navbar global */}

                {!cotizacionResult ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            {/* Sidebar Izquierda - 12 columns on mobile, 5 on tablets, 4 on desktop */}
                            <div className="md:col-span-5 lg:col-span-4 space-y-6">
                                <ClientSelector
                                    clientes={clientes}
                                    clienteSeleccionado={clienteSeleccionado}
                                    setClienteSeleccionado={setClienteSeleccionado}
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
                                />
                            </div>

                            {/* Panel Central/Derecha - 12 columns on mobile, 7 on tablets, 8 on desktop */}
                            <div className="md:col-span-7 lg:col-span-8 space-y-6">
                                <ProductGrid
                                    productos={productos}
                                    productosSeleccionados={productosSeleccionados}
                                    plazaSeleccionada={plazaSeleccionada}
                                    clienteSeleccionado={clienteSeleccionado}
                                    calcularPrecioUnitario={calcularPrecioUnitario}
                                    agregarProducto={agregarProducto}
                                />
                            </div>
                        </div>

                        {/* Nueva sección de resumen y productos seleccionados a ancho completo para romper la estructura encajada */}
                        <div className="mt-8 animate-in slide-in-from-bottom-5 duration-500">
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
                            />
                        </div>
                    </>
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
        </div>
    );
};

export default CotizadorView;
