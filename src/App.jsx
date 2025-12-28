import React, { useState, useCallback, useEffect } from 'react';
import { useDatabase } from './hooks/useDatabase';
import { useCotizacion } from './hooks/useCotizacion';
import { generatePDF } from './utils/pdfGenerator';

// Views
import CotizadorView from './components/views/CotizadorView';
import AdminPanel from './components/admin/AdminPanel';
import PriceListView from './components/views/PriceListView';
import HistoryView from './components/views/HistoryView';
import ComparatorView from './components/views/ComparatorView';
import DashboardView from './components/views/DashboardView';
import LoginView from './components/views/LoginView';
import CobranzaView from './components/admin/CobranzaView';
import CRMView from './components/views/CRMView';
import ClientFichaView from './components/views/ClientFichaView';
import ReportsView from './components/views/ReportsView';
import Navbar from './components/common/Navbar';
import { supabase } from './lib/supabase';

const App = () => {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [selectedClient, setSelectedClient] = useState(null);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Custom Hooks
  const dbData = useDatabase();
  const cotizacionState = useCotizacion(dbData);

  const {
    cargarDatos,
    guardarRegistro,
    eliminarRegistro,
    mensajeAdmin,
    setMensajeAdmin,
    configuracion,
    masterContracts,
    historial: rawHistorial,
    clientes,
    productos,
    condicionesCliente,
    paquetesVIX,
    metasComerciales
  } = dbData;

  const [historial, setHistorial] = useState([]);
  const [comparar, setComparar] = useState([]);

  const {
    setCotizacionResult,
    setHistorial: setHistorialState,
    setComparar: setCompararState,
    iniciarNuevaCotizacion
  } = cotizacionState;

  // Sincronizar historial de DB con el estado local formateado
  useEffect(() => {
    if (!session || !rawHistorial) return;

    const historialFormateado = rawHistorial.map(row => {
      try {
        if (!row.id) return null;

        const detalles = typeof row.json_detalles === 'string'
          ? JSON.parse(row.json_detalles)
          : (row.json_detalles || {});

        const clienteEncontrado = clientes.find(c => c.id === row.cliente_id);
        const vixCompleto = paquetesVIX.find(v => v.id === row.paquete_vix_id) || { nombre: 'Ninguno', impresiones: 0 };

        return {
          id: row.id,
          folio: row.folio,
          fecha: row.created_at ? new Date(row.created_at) : new Date(),
          cliente: clienteEncontrado || { nombre_empresa: 'Externo', plaza: 'Externa', id: 'EXT' },
          total: parseFloat(row.monto_total) || 0,
          estatus: row.estatus,
          probabilidad: row.probabilidad_cierre,
          items: detalles.items || [],
          distribucion: detalles.distribucion || [],
          diasCampana: row.dias_campana || 30,
          paqueteVIX: vixCompleto,
          presupuestoBase: detalles.inversion_inicial || 0,
          subtotalTV: detalles.subtotal_tv || 0,
          costoVIX: detalles.costo_vix || 0
        };
      } catch (e) {
        console.error("Error parseando fila de historial:", row, e);
        return null;
      }
    }).filter(Boolean);

    setHistorial(historialFormateado);
  }, [rawHistorial, clientes, paquetesVIX, session]);

  // Actions
  const handleGuardarCotizacion = useCallback(async () => {
    if (!cotizacionState.cotizacionResult) return;

    const cotz = cotizacionState.cotizacionResult;

    const datosParaDB = {
      cliente_id: cotz.cliente.id,
      mc_id: cotz.mc_id || null,
      folio: `COT-${Date.now().toString().slice(-6)}`,
      estatus: 'borrador',
      monto_total: cotz.total,
      dias_campana: cotz.diasCampana || 30,
      paquete_vix: !!cotz.paqueteVIX?.id,
      json_detalles: {
        items: cotz.items,
        distribucion: cotz.distribucion,
        inversion_inicial: cotz.presupuestoBase,
        subtotal_tv: cotz.subtotalTV,
        costo_vix: cotz.costoVIX
      }
    };

    const result = await guardarRegistro('cotizaciones', datosParaDB);
    if (result) {
      cargarDatos();
      setMensajeAdmin({ tipo: 'exito', texto: 'Cotización guardada en el CRM.' });
    }
  }, [cotizacionState.cotizacionResult, guardarRegistro, cargarDatos, setMensajeAdmin]);

  const handleAgregarAComparador = useCallback((cotz) => {
    if (!comparar.some(c => c.id === cotz.id)) {
      setComparar(prev => [...prev, cotz]);
      setMensajeAdmin({ tipo: 'exito', texto: 'Añadido al comparador de escenarios.' });
    } else {
      setMensajeAdmin({ tipo: 'error', texto: 'Esta cotización ya está en el comparador.' });
    }
  }, [comparar, setMensajeAdmin]);

  const handleMostrarPropuesta = useCallback((cotz) => {
    generatePDF(cotz, configuracion, dbData.perfil);
  }, [configuracion, dbData.perfil]);

  const handleSelectClient = (clienteTarget) => {
    setSelectedClient(clienteTarget);
    setVistaActual('ficha-cliente');
  };

  // Router rendering
  const renderVista = () => {
    switch (vistaActual) {
      case 'administracion':
        return (
          <AdminPanel
            setVistaActual={setVistaActual}
            mensajeAdmin={mensajeAdmin}
            setMensajeAdmin={setMensajeAdmin}
            guardarEnSheets={guardarRegistro}
            eliminarRegistro={eliminarRegistro}
            clientes={clientes}
            productos={productos}
            condicionesCliente={condicionesCliente}
            configuracion={configuracion}
            cobranza={dbData.cobranza}
            metasComerciales={metasComerciales}
            perfil={dbData.perfil}
            guardarRegistro={guardarRegistro}
          />
        );
      case 'lista-precios':
        return (
          <PriceListView
            setVistaActual={setVistaActual}
            clientes={clientes}
            productos={productos}
            calcularPrecioUnitario={cotizacionState.calcularPrecioUnitario}
          />
        );
      case 'historial':
        return (
          <HistoryView
            setVistaActual={setVistaActual}
            historial={historial}
            setCotizacion={(cotz) => {
              cotizacionState.setClienteSeleccionado(cotz.cliente.id);
              cotizacionState.setPresupuesto(cotz.presupuestoBase);
              cotizacionState.setDuracionDias(cotz.diasCampana);
              cotizacionState.setPaqueteVIX(cotz.paqueteVIX?.id || '');
              cotizacionState.setProductosSeleccionados(cotz.items.map(i => ({ id: i.producto.id, cantidad: i.cantidad })));
              cotizacionState.setCotizacionResult(cotz);
              setVistaActual('cotizador');
            }}
            agregarAComparador={handleAgregarAComparador}
            mostrarPropuesta={handleMostrarPropuesta}
            eliminarCotizacion={(id) => eliminarRegistro('cotizaciones', 'id', id)}
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
      case 'dashboard':
        return (
          <DashboardView
            historial={historial}
            clientes={clientes}
            metasComerciales={metasComerciales}
            setVistaActual={setVistaActual}
            actualizarDashboard={cargarDatos}
            iniciarNuevaCotizacion={(clientId) => {
              if (clientId) {
                const target = clientes.find(c => c.id === clientId);
                setSelectedClient(target);
                iniciarNuevaCotizacion(clientId);
                setVistaActual('cotizador');
              } else {
                setVistaActual('crm');
              }
            }}
          />
        );
      case 'crm':
        return (
          <CRMView
            clientes={clientes}
            onSelectClient={handleSelectClient}
            onAddNewClient={() => {
              setSelectedClient(null);
              setVistaActual('administracion'); // Go to admin to add client
            }}
          />
        );
      case 'ficha-cliente':
        return selectedClient ? (
          <ClientFichaView
            cliente={selectedClient}
            cotizaciones={historial}
            onBack={() => setVistaActual('crm')}
            onSaveClient={guardarRegistro}
            onNewQuote={() => {
              iniciarNuevaCotizacion(selectedClient.id);
              setVistaActual('cotizador');
            }}
            onViewQuote={handleMostrarPropuesta}
            setMensaje={setMensajeAdmin}
          />
        ) : <CRMView clientes={clientes} onSelectClient={handleSelectClient} />;
      case 'reportes':
        return (
          <ReportsView
            clientes={clientes}
            cotizaciones={historial}
          />
        );
      case 'cobranza':
        return (
          <CobranzaView
            cobranza={dbData.cobranza}
            setMensaje={setMensajeAdmin}
          />
        );
      default:
        return (
          <CotizadorView
            data={dbData}
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Verificando Credenciales...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-900">
      <Navbar
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        session={session}
        onLogout={() => supabase.auth.signOut()}
      />

      <main className="flex-1 mt-16 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {renderVista()}
        </div>
      </main>
    </div>
  );
};

export default App;