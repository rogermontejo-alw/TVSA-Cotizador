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
        setSeccionActiva('clientes');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 animate-in fade-in duration-500">
            {/* Header Admin Fijo o Sticky si se desea, por ahora normal */}
            <div className="bg-slate-900 pt-6 pb-24 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-600 p-3 rounded-xl shadow-xl shadow-red-900/20">
                                <Settings className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter">Panel Maestro</h1>
                                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-0.5">Control Central de Televisa MID</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setVistaActual('dashboard')}
                            className="w-full md:w-auto px-5 py-2 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95 text-[9px]"
                        >
                            Salir del Panel
                        </button>
                    </div>

                    {/* Tabs de Navegación Responsivos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSeccionActiva(tab.id)}
                                className={`
                                    flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all
                                    ${seccionActiva === tab.id
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}
                                `}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20">
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    {seccionActiva === 'clientes' && (
                        <div className="space-y-12">
                            <ClientForm
                                onSave={guardarRegistro}
                                setMensaje={setMensajeAdmin}
                                clienteEdicion={clienteEdicion}
                                onCancel={() => setClienteEdicion(null)}
                            />

                            <ClientManager
                                clientes={clientes}
                                onToggleEstatus={(clienteActualizado) => guardarRegistro('clientes', clienteActualizado)}
                                onEliminar={(id) => eliminarRegistro('clientes', 'id', id)}
                                onEdit={handleEditCliente}
                                setMensaje={setMensajeAdmin}
                            />
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

                <div className="mt-20 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Televisa MID Admin Layer v1.4.1 • CRM Cloud Enabled</p>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
