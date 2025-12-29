import React, { useState } from 'react';
import { Settings, Users, Tag, Package, Sliders, Target } from 'lucide-react';
import GoalManager from './GoalManager';
import ClientForm from './ClientForm';
import ClientManager from './ClientManager';
import ConditionsForm from './ConditionsForm';
import ProductManager from './ProductManager';
import ConfigForm from './ConfigForm';
import CobranzaView from './CobranzaView';
import ProfileForm from './ProfileForm';
import MaintenanceView from './MaintenanceView';
import PriceListView from '../views/PriceListView';
import { DollarSign, UserCircle, Eye, Wrench } from 'lucide-react';

const AdminPanel = ({
    setVistaActual,
    mensajeAdmin,
    setMensajeAdmin,
    guardarRegistro,
    eliminarRegistro,
    clientes,
    productos,
    condicionesCliente,
    configuracion,
    cobranza,
    metasComerciales,
    perfil,
    perfiles,
    limpiarTabla,
    historial,
    masterContracts,
    calcularPrecioUnitario,
    onLogout
}) => {
    const [seccionActiva, setSeccionActiva] = useState('clientes');
    const [clienteEdicion, setClienteEdicion] = useState(null);
    const [showClientModal, setShowClientModal] = useState(false);

    const tabs = [
        { id: 'clientes', label: 'Clientes', icon: Users },
        { id: 'tarifas', label: 'Especiales', icon: Tag },
        { id: 'catalogo', label: 'Catálogo', icon: Package },
        { id: 'tarifario', label: 'Tarifario', icon: Eye },
        { id: 'metas', label: 'Metas', icon: Target },
        { id: 'cobranza', label: 'Cobranza', icon: DollarSign },
        { id: 'config', label: 'Config', icon: Sliders },
        { id: 'mantenimiento', label: 'Limpieza', icon: Wrench },
        { id: 'cuenta', label: 'Mi Cuenta', icon: UserCircle },
    ];

    const handleEditCliente = (cliente) => {
        setClienteEdicion(cliente);
        setShowClientModal(true);
    };

    const handleNewClient = () => {
        setClienteEdicion(null);
        setShowClientModal(true);
    };

    return (
        <div className="min-h-screen bg-enterprise-50 pb-20 animate-premium-fade">
            {/* Header Admin Fijo */}
            <div className="bg-enterprise-950 pt-10 pb-36 px-4 md:px-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 blur-[100px] -mr-48 -mt-48"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-orange/20">
                                    <Settings size={20} />
                                </div>
                                <div>
                                    <h1 className="text-sm font-black text-white uppercase tracking-[0.3em]">Central de Operaciones</h1>
                                    <p className="text-[9px] font-bold text-enterprise-400 uppercase tracking-widest mt-0.5">Premium Management Suite</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setVistaActual('dashboard')}
                            className="w-full md:w-auto h-14 px-8 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-orange transition-all shadow-xl active:scale-95 text-[10px] flex items-center justify-center gap-3"
                        >
                            <UserCircle size={18} />
                            Terminal Directiva
                        </button>
                    </div>

                    {/* Tabs de Navegación Responsivos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 mt-10">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSeccionActiva(tab.id)}
                                className={`
                                    flex items-center justify-center gap-3 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all
                                    ${seccionActiva === tab.id
                                        ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/40 scale-105 z-10'
                                        : 'bg-enterprise-900/50 text-enterprise-400 hover:text-white hover:bg-enterprise-900 border border-white/5'}
                                `}
                            >
                                <tab.icon size={14} className={seccionActiva === tab.id ? 'text-white' : 'text-brand-orange'} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-24 relative z-20">
                <div className="bg-enterprise-50 rounded-[3rem] p-6 md:p-10 shadow-2xl border border-white/20 animate-in slide-in-from-bottom-4 duration-500 min-h-[600px]">
                    {seccionActiva === 'clientes' && (
                        <div className="space-y-6">
                            <ClientManager
                                clientes={clientes}
                                onToggleEstatus={(clienteActualizado) => guardarRegistro('clientes', clienteActualizado)}
                                onEliminar={(id) => eliminarRegistro('clientes', 'id', id)}
                                onEdit={handleEditCliente}
                                onNew={handleNewClient}
                                setMensaje={setMensajeAdmin}
                            />

                            {/* Modal de Cliente */}
                            {showClientModal && (
                                <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 md:p-8 pt-10 md:pt-24 overflow-y-auto">
                                    <div
                                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                                        onClick={() => setShowClientModal(false)}
                                    ></div>
                                    <div className="relative w-full max-w-5xl mx-auto animate-in zoom-in-95 duration-200 z-10 mb-20">
                                        <ClientForm
                                            onSave={async (tabla, payload) => {
                                                const res = await guardarRegistro(tabla, payload);
                                                if (res) setShowClientModal(false);
                                                return res;
                                            }}
                                            setMensaje={setMensajeAdmin}
                                            clienteEdicion={clienteEdicion}
                                            onCancel={() => setShowClientModal(false)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {seccionActiva === 'tarifas' && (
                        <ConditionsForm
                            clientes={clientes}
                            productos={productos}
                            condicionesCliente={condicionesCliente}
                            onSave={guardarRegistro}
                            setMensaje={setMensajeAdmin}
                        />
                    )}

                    {seccionActiva === 'catalogo' && (
                        <ProductManager
                            productos={productos}
                            onSave={guardarRegistro}
                            setMensaje={setMensajeAdmin}
                        />
                    )}

                    {seccionActiva === 'config' && (
                        <ConfigForm
                            configuracion={configuracion}
                            onSave={guardarRegistro}
                            setMensaje={setMensajeAdmin}
                        />
                    )}

                    {seccionActiva === 'metas' && (
                        <GoalManager
                            metas={metasComerciales}
                            onSaveGoal={(data) => guardarRegistro('metas_comerciales', data)}
                            onRemoveGoal={(id) => eliminarRegistro('metas_comerciales', 'id', id)}
                        />
                    )}

                    {seccionActiva === 'tarifario' && (
                        <PriceListView
                            productos={productos}
                            clientes={clientes}
                            setVistaActual={setVistaActual}
                            calcularPrecioUnitario={calcularPrecioUnitario}
                        />
                    )}

                    {seccionActiva === 'cobranza' && (
                        <CobranzaView
                            cobranza={cobranza}
                            clientes={clientes}
                            onSave={guardarRegistro}
                            setMensaje={setMensajeAdmin}
                        />
                    )}

                    {seccionActiva === 'mantenimiento' && (
                        <MaintenanceView
                            limpiarTabla={limpiarTabla}
                            historial={historial}
                            clientes={clientes}
                            masterContracts={masterContracts}
                            metasComerciales={metasComerciales}
                            cobranza={cobranza}
                            setMensaje={setMensajeAdmin}
                        />
                    )}

                    {seccionActiva === 'cuenta' && (
                        <ProfileForm
                            perfil={perfil}
                            perfiles={perfiles}
                            onSave={guardarRegistro}
                            onEliminar={(id) => eliminarRegistro('perfiles', 'id', id)}
                            setMensaje={setMensajeAdmin}
                            onLogout={onLogout}
                        />
                    )}
                </div>

                <div className="mt-24 text-center pb-10">
                    <p className="text-[10px] font-black text-enterprise-300 uppercase tracking-[0.5em] opacity-60">Televisa MID Admin Layer • Enterprise Deployment v2.0</p>
                    <p className="text-[8px] font-bold text-enterprise-200 uppercase tracking-[0.3em] mt-2">High-Performance Media Budgeting Engine</p>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
