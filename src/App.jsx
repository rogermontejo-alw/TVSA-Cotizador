import React, { useState, useCallback, useEffect } from 'react';
import { useSheetsData } from './hooks/useSheetsData';
import { useCotizacion } from './hooks/useCotizacion';
import { generatePDF } from './utils/pdfGenerator';

// Views
import CotizadorView from './components/views/CotizadorView';
import AdminPanel from './components/admin/AdminPanel';
import PriceListView from './components/views/PriceListView';
import HistoryView from './components/views/HistoryView';
import ComparatorView from './components/views/ComparatorView';

const App = () => {
  const [vistaActual, setVistaActual] = useState('cotizador');

  // Custom Hooks
  const sheetsData = useSheetsData();
  const cotizacionState = useCotizacion(sheetsData);

  const { cargarDatos, guardarEnSheets, mensajeAdmin, setMensajeAdmin, configuracion } = sheetsData;
  const {
    setCotizacionResult,
    historial,
    setHistorial,
    comparar,
    setComparar,
    iniciarNuevaCotizacion
  } = cotizacionState;

  // Effects
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Actions
  const handleGuardarCotizacion = useCallback(async () => {
    if (!cotizacionState.cotizacionResult) return;

    const cotz = cotizacionState.cotizacionResult;
    const datosParaSheet = {
      id: cotz.id,
      fecha: cotz.fecha.toISOString(),
      cliente: cotz.cliente.nombre,
      total: cotz.total,
      detalles: JSON.stringify({
        items: cotz.items,
        paqueteVIX: cotz.paqueteVIX,
        distribucion: cotz.distribucion,
        presupuestoBase: cotz.presupuestoBase,
        diasCampana: cotz.diasCampana
      })
    };

    const exito = await guardarEnSheets(datosParaSheet, 'historico_cotizaciones');
    if (exito) {
      setHistorial(prev => [cotz, ...prev]);
      setMensajeAdmin({ tipo: 'exito', texto: 'Cotización guardada correctamente en el historial y Google Sheets.' });
    }
  }, [cotizacionState.cotizacionResult, guardarEnSheets, setHistorial, setMensajeAdmin]);

  const handleAgregarAComparador = useCallback((cotz) => {
    if (!comparar.some(c => c.id === cotz.id)) {
      setComparar(prev => [...prev, cotz]);
      setMensajeAdmin({ tipo: 'exito', texto: 'Añadido al comparador de escenarios.' });
    } else {
      setMensajeAdmin({ tipo: 'error', texto: 'Esta cotización ya está en el comparador.' });
    }
  }, [comparar, setComparar, setMensajeAdmin]);

  const handleMostrarPropuesta = useCallback((cotz) => {
    generatePDF(cotz, configuracion);
  }, [configuracion]);

  // Router-ish rendering
  const renderVista = () => {
    switch (vistaActual) {
      case 'administracion':
        return (
          <AdminPanel
            setVistaActual={setVistaActual}
            mensajeAdmin={mensajeAdmin}
            setMensajeAdmin={setMensajeAdmin}
            guardarEnSheets={guardarEnSheets}
            clientes={sheetsData.clientes}
            productos={sheetsData.productos}
            condicionesCliente={sheetsData.condicionesCliente}
          />
        );
      case 'lista-precios':
        return (
          <PriceListView
            setVistaActual={setVistaActual}
            clientes={sheetsData.clientes}
            productos={sheetsData.productos}
            calcularPrecioUnitario={cotizacionState.calcularPrecioUnitario}
          />
        );
      case 'historial':
        return (
          <HistoryView
            setVistaActual={setVistaActual}
            historial={historial}
            setCotizacion={(cotz) => {
              // Hydrate state from history
              cotizacionState.setClienteSeleccionado(cotz.cliente.id);
              cotizacionState.setPresupuesto(cotz.presupuestoBase);
              cotizacionState.setDuracionDias(cotz.diasCampana);
              cotizacionState.setPaqueteVIX(cotz.paqueteVIX?.id || '');
              cotizacionState.setProductosSeleccionados(cotz.items.map(i => ({ id: i.producto.id, cantidad: i.cantidad })));
              cotizacionState.setCotizacionResult(cotz);
            }}
            agregarAComparador={handleAgregarAComparador}
            mostrarPropuesta={handleMostrarPropuesta}
          />
        );
      case 'comparador':
        return (
          <ComparatorView
            setVistaActual={setVistaActual}
            comparar={comparar}
            setComparar={setComparar}
            mostrarPropuesta={handleMostrarPropuesta}
          />
        );
      default:
        return (
          <CotizadorView
            data={sheetsData}
            cotizacionState={cotizacionState}
            setVistaActual={setVistaActual}
            iniciarNuevaCotizacion={iniciarNuevaCotizacion}
            configuracion={configuracion}
            mostrarPropuesta={handleMostrarPropuesta}
            guardarCotizacion={handleGuardarCotizacion}
            agregarAComparador={handleAgregarAComparador}
            mensajeAdmin={mensajeAdmin}
            setMensajeAdmin={setMensajeAdmin}
          />
        );
    }
  };

  return (
    <div className="font-sans antialiased text-gray-900">
      {renderVista()}
    </div>
  );
};

export default App;