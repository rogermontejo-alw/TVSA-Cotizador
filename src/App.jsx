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
import MasterContractsView from './components/views/MasterContractsView';
import ReportsView from './components/views/ReportsView';
import Navbar from './components/common/Navbar';
import StatusMessage from './components/admin/StatusMessage';
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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setVistaActual('dashboard');
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  // Custom Hooks
  const dbData = useDatabase(session);
  const cotizacionState = useCotizacion(dbData);

  const {
    cargarDatos,
    guardarRegistro,
    eliminarRegistro,
    limpiarTabla,
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

  const [comparar, setComparar] = useState([]);

  const {
    setCotizacionResult,
    setHistorial: setHistorialState,
    setComparar: setCompararState,
    iniciarNuevaCotizacion
  } = cotizacionState;

  // Consolidar formateo de historial usando React.useMemo para máxima reactividad
  const historial = React.useMemo(() => {
    if (!rawHistorial) return [];

    return rawHistorial.map(row => {
      try {
        if (!row.id) return null;

        // El row ya viene parcialmente formateado de useDatabase, pero App añade capas extras (como VIX detallado)
        const detalles = typeof row.json_detalles === 'string'
          ? JSON.parse(row.json_detalles)
          : (row.json_detalles || {});

        const clienteEncontrado = (clientes || []).find(c => String(c.id) === String(row.cliente_id));
        const vixCompleto = paquetesVIX.find(v => v.id === row.paquete_vix_id) || { nombre: 'Ninguno', inversion: 0 };

        return {
          ...row,
          fecha: row.created_at ? new Date(row.created_at) : new Date(),
          cliente: clienteEncontrado || { nombre_empresa: 'Externo', plaza: 'Externa', id: 'EXT' },
          total: parseFloat(row.monto_total) || 0,
          subtotalGeneral: detalles.subtotalGeneral ||
            ((parseFloat(detalles.subtotal_tv) || 0) + (parseFloat(detalles.costo_vix) || 0)) ||
            (parseFloat(row.monto_total) / 1.16),
          items: detalles.items || [],
          distribucion: detalles.distribucion || [],
          paqueteVIX: detalles.paqueteVIX || vixCompleto,
          costoVIX: detalles.costoVIX || (detalles.paqueteVIX?.inversion) || 0,
          presupuestoBase: detalles.presupuestoBase || row.monto_total,
        };
      } catch (e) {
        console.error("Error formatting history row:", row, e);
        return null;
      }
    }).filter(Boolean);
  }, [rawHistorial, clientes, paquetesVIX]);

  // Sincronizar el historial formateado con el hook de cotización
  useEffect(() => {
    setHistorialState(historial);
  }, [historial, setHistorialState]);

  if (authLoading) return null;
  if (!session) return <LoginView />;

  // Si no hay datos y está cargando, mostrar la cara de carga corporativa
  if (dbData.loading && clientes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-100 rounded-2xl"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-red-600 border-t-transparent rounded-2xl animate-spin"></div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-slate-900 font-black uppercase tracking-[0.4em] text-[10px]">Sincronizando Televisa MID</p>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px] mt-2">Accediendo a la nube segura...</p>
        </div>
      </div>
    );
  }

  // Handlers para acciones comunes
  const handlePrint = (cotz) => {
    generatePDF(cotz, dbData.configuracion);
  };

  const handleAddToComparator = (cotz) => {
    setComparar(prev => {
      if (prev.some(c => c.id === cotz.id)) return prev;
      return [...prev, cotz];
    });
    setMensajeAdmin({ tipo: 'exito', texto: 'Añadido al comparador' });
  };

  const handleEliminarCotizacion = async (id) => {
    const success = await dbData.eliminarRegistro('cotizaciones', id);
    if (success) {
      setMensajeAdmin({ tipo: 'exito', texto: 'Registro eliminado correctamente' });
    }
  };

  const handleVerFichaCliente = (cliente) => {
    setSelectedClient(cliente);
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
            guardarRegistro={guardarRegistro}
            eliminarRegistro={eliminarRegistro}
            clientes={clientes}
            productos={productos}
            condicionesCliente={condicionesCliente}
            configuracion={configuracion}
            cobranza={dbData.cobranza}
            historial={historial}
            metasComerciales={metasComerciales}
            perfil={dbData.perfil}
            perfiles={dbData.perfiles}
            limpiarTabla={limpiarTabla}
            masterContracts={masterContracts}
            calcularPrecioUnitario={cotizacionState.calcularPrecioUnitario}
            onLogout={handleLogout}
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
            historial={historial}
            setVistaActual={setVistaActual}
            setCotizacion={setCotizacionResult}
            agregarAComparador={handleAddToComparator}
            mostrarPropuesta={handlePrint}
            eliminarCotizacion={handleEliminarCotizacion}
            onSaveQuote={guardarRegistro}
            setMensaje={setMensajeAdmin}
            masterContracts={masterContracts}
          />
        );
      case 'comparar':
        return (
          <ComparatorView
            comparar={comparar}
            setVistaActual={setVistaActual}
            setComparar={setComparar}
            mostrarPropuesta={handlePrint}
          />
        );
      case 'cotizador':
        return (
          <CotizadorView
            data={dbData}
            cotizacionState={cotizacionState}
            setVistaActual={setVistaActual}
            iniciarNuevaCotizacion={iniciarNuevaCotizacion}
            configuracion={configuracion}
            mostrarPropuesta={handlePrint}
            guardarCotizacion={guardarRegistro}
            agregarAComparador={handleAddToComparator}
            mensajeAdmin={mensajeAdmin}
            setMensajeAdmin={setMensajeAdmin}
            onSaveClient={guardarRegistro}
          />
        );
      case 'dashboard':
        return (
          <DashboardView
            historial={historial}
            clientes={clientes}
            cobranza={dbData.cobranza}
            metasComerciales={metasComerciales}
            setVistaActual={setVistaActual}
            actualizarDashboard={cargarDatos}
            iniciarNuevaCotizacion={() => {
              iniciarNuevaCotizacion();
              setVistaActual('cotizador');
            }}
          />
        );
      case 'cobranza':
        return (
          <CobranzaView
            cobranza={dbData.cobranza}
            onSave={guardarRegistro}
            setMensaje={setMensajeAdmin}
          />
        );
      case 'crm':
        return (
          <CRMView
            clientes={clientes}
            onSelectClient={handleVerFichaCliente}
            onAddNewClient={() => setVistaActual('administracion')}
          />
        );
      case 'ficha-cliente':
        return (
          <ClientFichaView
            cliente={selectedClient}
            cotizaciones={historial.filter(h => String(h.cliente_id) === String(selectedClient?.id))}
            masterContracts={masterContracts.filter(mc => String(mc.cliente_id) === String(selectedClient?.id))}
            onBack={() => setVistaActual('crm')}
            onSaveClient={guardarRegistro}
            onNewQuote={() => {
              iniciarNuevaCotizacion();
              cotizacionState.setClienteSeleccionado(selectedClient);
              setVistaActual('cotizador');
            }}
            onViewQuote={(q) => {
              setCotizacionResult(q);
              setVistaActual('cotizador');
            }}
            onPrintQuote={handlePrint}
            setMensaje={setMensajeAdmin}
          />
        );
      case 'master-contracts':
        return (
          <MasterContractsView
            masterContracts={masterContracts}
            clientes={clientes}
            cotizaciones={historial}
            cobranza={dbData.cobranza}
            onSaveMC={guardarRegistro}
            onSaveQuote={guardarRegistro}
            setMensaje={setMensajeAdmin}
          />
        );
      case 'reportes':
        return (
          <ReportsView
            cotizaciones={historial}
            metas={metasComerciales}
            clientes={clientes}
            cobranza={dbData.cobranza}
            masterContracts={masterContracts}
          />
        );
      default:
        return <DashboardView historial={historial} clientes={clientes} setVistaActual={setVistaActual} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        setVistaActual={setVistaActual}
        vistaActual={vistaActual}
        session={session}
        onLogout={handleLogout}
      />

      <main className="flex-1 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {renderVista()}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center text-[10px] font-bold text-white uppercase italic">
              TV
            </div>
            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">
              TELEVISA UNIVISION <span className="text-red-600">MID</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              COTIZADOR ESTRATÉGICO 2025
            </p>
            <div className="h-4 w-px bg-slate-100"></div>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
              V1.4.2 • 28 DEC 2025
            </p>
          </div>
        </div>
      </footer>

      <StatusMessage
        tipo={mensajeAdmin.tipo}
        texto={mensajeAdmin.texto}
        setMensaje={setMensajeAdmin}
      />
    </div>
  );
};

export default App;