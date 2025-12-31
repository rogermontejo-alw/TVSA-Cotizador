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
import { APP_CONFIG } from './appConfig';
import { DashboardSkeleton } from './components/ui/Skeleton';

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
    metasComerciales,
    contratosEjecucion
  } = dbData;

  const [comparar, setComparar] = useState([]);

  const {
    setCotizacionResult,
    setHistorial: setHistorialState,
    setComparar: setCompararState,
    iniciarNuevaCotizacion,
    cargarCotizacionEdicion
  } = cotizacionState;

  // Consolidar formateo de historial usando React.useMemo para máxima reactividad
  const historial = React.useMemo(() => {
    if (!rawHistorial) return [];

    return rawHistorial.map(row => {
      try {
        if (!row.id) return null;

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
          subtotalTV: detalles.subtotalTV || 0,
          presupuestoBase: detalles.presupuestoBase || row.monto_total,
        };
      } catch (e) {
        console.error("Error formatting history row:", row, e);
        return null;
      }
    }).filter(Boolean);
  }, [rawHistorial, clientes, paquetesVIX]);

  useEffect(() => {
    setHistorialState(historial);
  }, [historial, setHistorialState]);

  if (authLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!session) return <LoginView />;

  // Skeletons while loading initial data
  if (dbData.loading && clientes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="h-20 bg-white border-b border-enterprise-100 mb-10" />
        <main className="flex-1 max-w-[1800px] w-full mx-auto px-4">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  // Handlers para acciones comunes
  const handlePrint = (cotz) => {
    generatePDF(cotz, dbData.configuracion, dbData.perfil);
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
            contratosEjecucion={contratosEjecucion}
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
            contratosEjecucion={dbData.contratosEjecucion}
            perfil={dbData.perfil}
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
            contratosEjecucion={dbData.contratosEjecucion}
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
            clientes={clientes}
            contratosEjecucion={dbData.contratosEjecucion}
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
            interacciones={dbData.interacciones.filter(i => String(i.cliente_id) === String(selectedClient?.id))}
            perfil={dbData.perfil}
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
            contratosEjecucion={dbData.contratosEjecucion}
            onSaveMC={guardarRegistro}
            onSaveQuote={guardarRegistro}
            onSaveContrato={guardarRegistro}
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
            contratosEjecucion={dbData.contratosEjecucion}
          />
        );
      default:
        return <DashboardView historial={historial} clientes={clientes} setVistaActual={setVistaActual} />;
    }
  };

  return (
    <div className="min-h-screen bg-enterprise-50 flex flex-col font-sans selection:bg-brand-orange/10 selection:text-brand-orange">
      <Navbar
        setVistaActual={setVistaActual}
        vistaActual={vistaActual}
        session={session}
        perfil={dbData.perfil}
        onLogout={handleLogout}
        onNuevaCotizacion={() => {
          iniciarNuevaCotizacion();
          setVistaActual('cotizador');
        }}
      />

      <main className="flex-1 pt-24 pb-20 px-2 sm:px-4">
        <div className="max-w-[1800px] mx-auto">
          {renderVista()}
        </div>
      </main>

      <footer className="bg-enterprise-950 py-12 px-6 text-white border-t border-white/5 mt-auto">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2 shadow-lg hover:scale-110 transition-transform">
                <img src="/logo-tvsa.png" alt="TU" className="w-full h-full object-contain" />
              </div>
              <p className="text-sm font-black text-white uppercase tracking-tighter italic italic-brand">
                Televisa <span className="text-brand-orange">Univision</span> MID
              </p>
            </div>
            <div className="hidden md:block h-6 w-px bg-white/10"></div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.4em]">
              Enterprise Deployment <span className="text-white/70">© 2025</span>
            </p>
          </div>

          <div className="flex items-center gap-10">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Architecture</span>
              <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                Roger A Montejo
              </p>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Deployment</span>
              <p className="text-[10px] font-black text-white uppercase tracking-widest">
                V{APP_CONFIG.VERSION} • MID-TU
              </p>
            </div>
          </div>
        </div>
      </footer>

      {mensajeAdmin && (
        <StatusMessage
          tipo={mensajeAdmin.tipo}
          texto={mensajeAdmin.texto}
          setMensaje={setMensajeAdmin}
        />
      )}
    </div>
  );
};

export default App;