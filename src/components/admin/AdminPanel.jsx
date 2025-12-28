import React, { useState } from 'react';
import { Settings, Users, Tag, Package, Sliders, Target } from 'lucide-react';
import GoalManager from './GoalManager';
import ClientForm from './ClientForm';
import ClientManager from './ClientManager';
import ConditionsForm from './ConditionsForm';
import ProductManager from './ProductManager';
import ConfigForm from './ConfigForm';
import CobranzaView from './CobranzaView';
import StatusMessage from './StatusMessage';
import ProfileForm from './ProfileForm';
import PriceListView from '../views/PriceListView';
import { DollarSign, UserCircle, Eye } from 'lucide-react';

const AdminPanel = ({
    setVistaActual,
    mensajeAdmin,
    setMensajeAdmin,
    guardarEnSheets,
    eliminarRegistro,
    clientes,
    productos,
    condicionesCliente,
    configuracion,
    cobranza,
    metasComerciales,
    perfil,
    guardarRegistro
}) => {
    const [seccionActiva, setSeccionActiva] = useState('clientes');
    const [clienteEdicion, setClienteEdicion] = useState(null);

    const tabs = [
        { id: 'clientes', label: 'Clientes', icon: Users },
        { id: 'tarifas', label: 'Especiales', icon: Tag },
        { id: 'catalogo', label: 'Catálogo', icon: Package },
        { id: 'tarifario', label: 'Tarifario', icon: Eye },
        { id: 'metas', label: 'Metas', icon: Target },
        { id: 'config', label: 'Config', icon: Sliders },
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
            <div className="bg-slate-900 pt-8 pb-32 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="bg-red-600 p-4 rounded-2xl shadow-xl shadow-red-900/20">
                                <Settings className="text-white" size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Panel Maestro</h1>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Control Central de Televisa MID</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setVistaActual('dashboard')}
                            className="w-full md:w-auto px-6 py-2.5 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95 text-[10px]"
                        >
                            Salir del Panel
                        </button>
                    </div>

                    {/* Tabs de Navegación Responsivos */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSeccionActiva(tab.id)}
                                className={`
                                    flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all
                                    ${seccionActiva === tab.id
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}
                                `}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20">
                <StatusMessage
                    tipo={mensajeAdmin.tipo}
                    texto={mensajeAdmin.texto}
                    setMensaje={setMensajeAdmin}
                />

                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    {seccionActiva === 'clientes' && (
                        <div className="space-y-12">
                            <ClientForm
                                onSave={guardarEnSheets}
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
                            onSave={guardarEnSheets}
                            setMensaje={setMensajeAdmin}
                        />
                    )}

                    {seccionActiva === 'catalogo' && (
                        <ProductManager
                            productos={productos}
                            onSave={guardarEnSheets}
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
                        />
                    )}

                    {seccionActiva === 'cuenta' && (
                        <ProfileForm
                            perfil={perfil}
                            onSave={guardarEnSheets}
                            setMensaje={setMensajeAdmin}
                        />
                    )}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Televisa MID Admin Layer v1.1 • CRM Cloud Enabled</p>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
