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
import { DollarSign, UserCircle, Eye, Wrench, MapPin, Briefcase, Database, CreditCard, Shield } from 'lucide-react';
import PlazaManager from './PlazaManager';

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
    const [moduloActivo, setModuloActivo] = useState('comercial');
    const [seccionActiva, setSeccionActiva] = useState('clientes');
    const [clienteEdicion, setClienteEdicion] = useState(null);
    const [showClientModal, setShowClientModal] = useState(false);

    const modulos = [
        {
            id: 'comercial',
            label: 'Comercial',
            icon: Briefcase,
            color: 'brand-orange',
            sections: [
                { id: 'clientes', label: 'Clientes', icon: Users },
                { id: 'tarifas', label: 'Especiales', icon: Tag },
                { id: 'metas', label: 'Metas', icon: Target },
            ]
        },
        {
            id: 'inventario',
            label: 'Inventario',
            icon: Database,
            color: 'brand-orange',
            sections: [
                { id: 'catalogo', label: 'Activos', icon: Package },
                { id: 'plazas', label: 'Regiones', icon: MapPin },
                { id: 'tarifario', label: 'Tarifario', icon: Eye },
            ]
        },
        {
            id: 'finanzas',
            label: 'Finanzas',
            icon: CreditCard,
            color: 'brand-orange',
            sections: [
                { id: 'cobranza', label: 'Cobranza', icon: DollarSign },
            ]
        },
        {
            id: 'sistema',
            label: 'Sistema',
            icon: Shield,
            color: 'brand-orange',
            sections: [
                { id: 'config', label: 'Config', icon: Sliders },
                { id: 'mantenimiento', label: 'Limpieza', icon: Wrench },
                { id: 'cuenta', label: 'Mi Cuenta', icon: UserCircle },
            ]
        }
    ];

    const currentModule = modulos.find(m => m.id === moduloActivo);

    const handleModuleChange = (modId) => {
        setModuloActivo(modId);
        const mod = modulos.find(m => m.id === modId);
        if (mod && mod.sections.length > 0) {
            setSeccionActiva(mod.sections[0].id);
        }
    };

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

                    {/* Pilares Maestros (Módulos principales) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                        {modulos.map(mod => (
                            <button
                                key={mod.id}
                                onClick={() => handleModuleChange(mod.id)}
                                className={`
                                    relative group p-6 rounded-[2rem] border transition-all duration-300 flex flex-col items-center gap-3 overflow-hidden
                                    ${moduloActivo === mod.id
                                        ? 'bg-brand-orange border-brand-orange text-white shadow-2xl shadow-brand-orange/40 scale-[1.02]'
                                        : 'bg-white/5 border-white/10 text-enterprise-400 hover:bg-white/10 hover:border-white/20'}
                                `}
                            >
                                <div className={`
                                    w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                                    ${moduloActivo === mod.id ? 'bg-white text-brand-orange' : 'bg-enterprise-900 text-brand-orange group-hover:scale-110'}
                                `}>
                                    <mod.icon size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{mod.label}</span>

                                {moduloActivo === mod.id && (
                                    <div className="absolute -bottom-1 w-12 h-1 bg-white rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Sub-Navegación Dinámica */}
                    {currentModule && currentModule.sections.length > 1 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-8 animate-in fade-in slide-in-from-top-2">
                            {currentModule.sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setSeccionActiva(section.id)}
                                    className={`
                                        px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2
                                        ${seccionActiva === section.id
                                            ? 'bg-white text-enterprise-950 shadow-lg'
                                            : 'text-enterprise-400 hover:text-white bg-white/5 border border-white/5'}
                                    `}
                                >
                                    <section.icon size={12} className={seccionActiva === section.id ? 'text-brand-orange' : 'text-brand-orange/50'} />
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    )}
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
                            eliminarRegistro={eliminarRegistro}
                            setMensaje={setMensajeAdmin}
                            historial={historial}
                            condicionesCliente={condicionesCliente}
                            configuracion={configuracion}
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

                    {seccionActiva === 'plazas' && (
                        <PlazaManager
                            configuracion={configuracion}
                            onSave={guardarRegistro}
                            setMensaje={setMensajeAdmin}
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
