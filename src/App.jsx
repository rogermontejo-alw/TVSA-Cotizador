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
  const dbData = useDatabase();
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

        const clienteEncontrado = (clientes || []).find(c => String(c.id) === String(row.cliente_id));
        const vixCompleto = paquetesVIX.find(v => v.id === row.paquete_vix_id) || { nombre: 'Ninguno', impresiones: 0 };

        return {
          id: row.id,
          folio: row.folio,
          fecha: row.created_at ? new Date(row.created_at) : new Date(),
          cliente: clienteEncontrado || { nombre_empresa: 'Externo', plaza: 'Externa', id: 'EXT' },
          total: parseFloat(row.monto_total) || 0,
          monto_total: parseFloat(row.monto_total) || 0,
          cliente_id: row.cliente_id,
          subtotalGeneral: detalles.subtotalGeneral ||
            ((parseFloat(detalles.subtotal_tv) || 0) + (parseFloat(detalles.costo_vix) || 0)) ||
            (parseFloat(row.monto_total) / 1.16),
          estatus: row.estatus,
          probabilidad: row.probabilidad_cierre,
          items: detalles.items || [],
          distribucion: detalles.distribucion || [],
          paqueteVIX: detalles.paqueteVIX || vixCompleto,
          costoVIX: detalles.costoVIX || (detalles.paqueteVIX?.inversion) || 0,
          presupuestoBase: detalles.presupuestoBase || row.monto_total,
          subtotalTV: detalles.subtotalTV || detalles.subtotal_tv || row.monto_total,
          diasCampana: detalles.diasCampana || 30,
          mc_id: row.mc_id,
          numero_contrato: row.numero_contrato,
          fecha_registro_sistema: row.fecha_registro_sistema,
          folio_sistema: row.folio_sistema,
          fecha_cierre_real: row.fecha_cierre_real
        };
      } catch (e) {
        console.error("Error parseando fila de historial:", row, e);
        return null;
      }
    }).filter(Boolean);

    setHistorial(historialFormateado);
    setHistorialState(historialFormateado);
  }, [rawHistorial, session, clientes, paquetesVIX, setHistorialState]);

  if (authLoading) return null;
  if (!session) return <LoginView />;

  const handleVerFichaCliente = (clienteTarget) => {
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
            limpiarTabla={limpiarTabla}
            masterContracts={masterContracts}
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
            setCotizacionResult={setCotizacionResult}
            comparar={comparar}
            setComparar={setComparar}
            onSaveQuote={guardarRegistro}
          />
        );
      case 'comparar':
        return (
          <ComparatorView
            comparar={comparar}
            setVistaActual={setVistaActual}
            setComparar={setComparar}
          />
        );
      case 'cotizador':
        return (
          <CotizadorView
            setVistaActual={setVistaActual}
            dbData={dbData}
            cotizacionState={cotizacionState}
          />
        );
      case 'dashboard':
        return (
          <DashboardView
            historial={historial}
            clientes={clientes}
            setVistaActual={setVistaActual}
            setCotizacionResult={setCotizacionResult}
            onSaveQuote={guardarRegistro}
            onVerFicha={handleVerFichaCliente}
          />
        );
      case 'crm':
        return (
          <CRMView
            clientes={clientes}
            historial={historial}
            setVistaActual={setVistaActual}
            onVerFicha={handleVerFichaCliente}
          />
        );
      case 'ficha-cliente':
        return (
          <ClientFichaView
            cliente={selectedClient}
            historial={historial.filter(h => h.cliente_id === selectedClient?.id)}
            masterContracts={masterContracts.filter(mc => mc.cliente_id === selectedClient?.id)}
            condiciones={condicionesCliente.filter(c => c.clienteId === selectedClient?.id)}
            productos={productos}
            onBack={() => setVistaActual('crm')}
            onSaveQuote={guardarRegistro}
          />
        );
      case 'master-contracts':
        return (
          <MasterContractsView
            masterContracts={masterContracts}
            clientes={clientes}
            historial={historial}
            onSaveQuote={guardarRegistro}
          />
        );
      case 'reportes':
        return (
          <ReportsView
            historial={historial}
            metas={metasComerciales}
            clientes={clientes}
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
              V1.3.1 • 28 DEC 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;