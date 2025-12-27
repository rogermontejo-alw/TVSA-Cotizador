import React, { useState } from 'react';
import { Save, UserPlus } from 'lucide-react';

const ClientForm = ({ onSave, setMensaje }) => {
    const [clienteData, setClienteData] = useState({
        nombre: '',
        segmento: 'PYME',
        tipoAcuerdo: 'SIN_ACUERDO',
        plaza: 'MERIDA',
        activo: 'SI',
        notas: ''
    });

    const handleClienteChange = (e) => {
        const { name, value } = e.target;
        setClienteData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!clienteData.nombre || !clienteData.segmento) {
            setMensaje({ tipo: 'error', texto: 'El nombre y segmento del cliente son obligatorios.' });
            return;
        }

        const datosCliente = {
            cliente_id: '',
            nombre_cliente: clienteData.nombre,
            tipo_acuerdo: clienteData.tipoAcuerdo,
            segmento: clienteData.segmento,
            plaza: clienteData.plaza,
            activo: clienteData.activo,
            tarifa: '',
            fecha_alta: '',
            notas: clienteData.notas || ''
        };

        const exito = await onSave(datosCliente, 'clientes');
        if (exito) {
            setClienteData({
                nombre: '',
                segmento: 'PYME',
                tipoAcuerdo: 'SIN_ACUERDO',
                plaza: 'MERIDA',
                activo: 'SI',
                notas: ''
            });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <UserPlus size={24} className="text-red-500" />
                    Registrar Nuevo Cliente
                </h3>
            </div>

            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label htmlFor="nombre" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre Comercial</label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={clienteData.nombre}
                            onChange={handleClienteChange}
                            placeholder="Ej: Agencia Digital S.A."
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all font-semibold"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="segmento" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Segmento de Mercado</label>
                        <select
                            id="segmento"
                            name="segmento"
                            value={clienteData.segmento}
                            onChange={handleClienteChange}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all font-semibold"
                        >
                            {['PYME', 'CORPORATIVO', 'GOBIERNO', 'OTROS'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="tipoAcuerdo" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo de Acuerdo</label>
                        <select
                            id="tipoAcuerdo"
                            name="tipoAcuerdo"
                            value={clienteData.tipoAcuerdo}
                            onChange={handleClienteChange}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all font-semibold"
                        >
                            {['SIN_ACUERDO', 'ACUERDO_ANUAL', 'PRECIO_FIJO'].map(t => (
                                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Plaza Base</label>
                        <select
                            name="plaza"
                            value={clienteData.plaza}
                            onChange={handleClienteChange}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all font-semibold"
                        >
                            {['MERIDA', 'CANCUN', 'CAMPECHE', 'CDMX'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notas Internas</label>
                    <textarea
                        name="notas"
                        value={clienteData.notas}
                        onChange={handleClienteChange}
                        placeholder="Detalles adicionales, contactos, etc."
                        rows="3"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all font-medium"
                    ></textarea>
                </div>

                <button
                    onClick={handleSubmit}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center shadow-lg active:scale-95"
                >
                    <Save className="mr-3" size={20} />
                    Registrar Cliente en Sistema
                </button>
            </div>
        </div>
    );
};

export default ClientForm;
