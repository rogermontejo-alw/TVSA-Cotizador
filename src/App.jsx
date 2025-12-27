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

  const { cargarDatos, guardarEnSheets, eliminarRegistro, mensajeAdmin, setMensajeAdmin, configuracion } = sheetsData;
  const {
    setCotizacionResult,
    historial,
    setHistorial,
    comparar,
    setComparar,
    iniciarNuevaCotizacion
  } = cotizacionState;

  // Effects
  // La carga inicial y sincronización ya las maneja el hook useSheetsData


  // Sincronizar historial de Sheets con el estado local
  useEffect(() => {
    // Mapear el historial plano de Sheets (aunque esté vacío) a los objetos complejos
    const historialFormateado = (sheetsData.historial || []).map(row => {
      try {
        if (!row.id) return null; // Solo requerimos ID para identificar la fila

        const detalles = JSON.parse(row.detalles_json || '{}');
        const clienteNombre = (row.cliente || 'Desconocido').trim();

        // Búsqueda de cliente más flexible
        const clienteEncontrado = sheetsData.clientes.find(c =>
          c.nombre?.toLowerCase().trim() === clienteNombre.toLowerCase()
        );

        // Búsqueda de paquete VIX para recuperar impresiones
        const nombreVix = row.paquete_digital || 'Ninguno';
        const vixCompleto = sheetsData.paquetesVIX.find(v => v.nombre === nombreVix) || { nombre: nombreVix, impresiones: 0 };

        return {
          id: row.id,
          fecha: row.fecha ? new Date(row.fecha) : new Date(),
          cliente: clienteEncontrado || { nombre: clienteNombre, plaza: 'Externa', id: 'EXT' },
          total: parseFloat(row.inversion_total_neta) || 0,
          subtotalTV: parseFloat(row.subtotal_tv) || 0,
          costoVIX: parseFloat(row.costo_vix) || 0,
          subtotalGeneral: (parseFloat(row.subtotal_tv) || 0) + (parseFloat(row.costo_vix) || 0),
          presupuestoBase: parseFloat(row.inversion_inicial) || 0,
          items: detalles.items || [],
          distribucion: detalles.distribucion || [],
          diasCampana: detalles.diasCampana || 30,
          paqueteVIX: vixCompleto
        };
      } catch (e) {
        console.error("Error parseando fila de historial:", row, e);
        return null;
      }
    }).filter(Boolean);

    setHistorial(historialFormateado);
  }, [sheetsData.historial, sheetsData.clientes, sheetsData.paquetesVIX, setHistorial]);

  // Actions
  const handleGuardarCotizacion = useCallback(async () => {
    if (!cotizacionState.cotizacionResult) return;

    const cotz = cotizacionState.cotizacionResult;

    // Preparar resumen de productos para una columna legible en Sheets
    const resumenProductos = cotz.items.map(i => `${i.cantidad}x ${i.producto.tipo} (${i.producto.canal})`).join(' | ');

    const datosParaSheet = {
      id: cotz.id,
      fecha: cotz.fecha.toISOString(),
      cliente: cotz.cliente.nombre,
      inversion_inicial: cotz.presupuestoBase,
      inversion_total_neta: cotz.total,
      subtotal_tv: cotz.subtotalTV,
      costo_vix: cotz.costoVIX,
      paquete_digital: cotz.paqueteVIX?.nombre || 'Ninguno',
      productos_cotizados: resumenProductos,
      detalles_json: JSON.stringify({
        items: cotz.items,
        distribucion: cotz.distribucion,
        diasCampana: cotz.diasCampana
      })
    };

    const exito = await guardarEnSheets(datosParaSheet, 'Cotizaciones');
    if (exito) {
      setHistorial(prev => [cotz, ...prev]);
    }
  }, [cotizacionState.cotizacionResult, guardarEnSheets, setHistorial]);

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
            eliminarRegistro={eliminarRegistro}
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
            eliminarCotizacion={(id) => eliminarRegistro('Cotizaciones', 'id', id)}
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