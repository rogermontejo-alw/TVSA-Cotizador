import React from 'react';
import { Settings } from 'lucide-react';
import ClientForm from './ClientForm';
import ClientManager from './ClientManager';
import ConditionsForm from './ConditionsForm';
import StatusMessage from './StatusMessage';

const AdminPanel = ({
    setVistaActual,
    mensajeAdmin,
    setMensajeAdmin,
    guardarEnSheets,
    eliminarRegistro,
    clientes,
    productos,
    condicionesCliente
}) => {
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto">
                {/* Header Admin */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 mb-8 border-b-8 border-gray-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="bg-red-600 p-4 rounded-2xl shadow-lg shadow-red-200">
                                <Settings className="text-white" size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-gray-800 tracking-tighter">Panel Maestro</h1>
                                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">Configuración y Administración de Tarifas</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setVistaActual('cotizador')}
                            className="w-full md:w-auto px-10 py-4 bg-gray-800 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl active:scale-95"
                        >
                            Volver al Cotizador
                        </button>
                    </div>
                </div>

                <StatusMessage
                    tipo={mensajeAdmin.tipo}
                    texto={mensajeAdmin.texto}
                    setMensaje={setMensajeAdmin}
                />

                <div className="grid grid-cols-1 gap-12">
                    {/* Formulario Clientes */}
                    <ClientForm onSave={guardarEnSheets} setMensaje={setMensajeAdmin} />

                    {/* Formulario Condiciones */}
                    <ConditionsForm
                        clientes={clientes}
                        productos={productos}
                        condicionesCliente={condicionesCliente}
                        onSave={guardarEnSheets}
                        setMensaje={setMensajeAdmin}
                    />

                    {/* Gestor de Clientes Existentes */}
                    <ClientManager
                        clientes={clientes}
                        onEliminar={(id) => eliminarRegistro('clientes', 'cliente_id', id)}
                        setMensaje={setMensajeAdmin}
                    />
                </div>

                <div className="mt-12 text-center">
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em]">Televisa MID Admin Layer v1.0</p>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
