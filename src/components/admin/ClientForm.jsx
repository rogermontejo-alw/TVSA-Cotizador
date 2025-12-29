import React, { useState } from 'react';
import { Save, UserPlus, Phone, Mail, MapPin, Briefcase, X } from 'lucide-react';

const ClientForm = ({ onSave, setMensaje, clienteEdicion = null, onCancel = null }) => {
    const [clienteData, setClienteData] = useState({
        nombre_empresa: '',
        nombre_contacto: '',
        email: '',
        telefono: '',
        direccion_completa: '',
        plaza: 'MERIDA',
        segmento: 'PYME',
        tipo_acuerdo: 'SIN_ACUERDO',
        tipo: 'prospecto',
        etapa: 'Prospecto',
        notas_generales: ''
    });

    // Cargar datos si estamos editando
    React.useEffect(() => {
        if (clienteEdicion) {
            setClienteData({
                ...clienteEdicion,
                nombre_empresa: clienteEdicion.nombre_empresa || '',
                nombre_contacto: clienteEdicion.nombre_contacto || '',
                email: clienteEdicion.email || '',
                telefono: clienteEdicion.telefono || '',
                direccion_completa: clienteEdicion.direccion_completa || '',
                plaza: clienteEdicion.plaza || 'MERIDA',
                segmento: clienteEdicion.segmento || 'PYME',
                tipo_acuerdo: clienteEdicion.tipo_acuerdo || 'SIN_ACUERDO',
                tipo: clienteEdicion.tipo || 'prospecto',
                etapa: clienteEdicion.etapa || 'Prospecto',
                notas_generales: clienteEdicion.notas_generales || ''
            });
        } else {
            setClienteData({
                nombre_empresa: '',
                nombre_contacto: '',
                email: '',
                telefono: '',
                direccion_completa: '',
                plaza: 'MERIDA',
                segmento: 'PYME',
                tipo_acuerdo: 'SIN_ACUERDO',
                tipo: 'prospecto',
                etapa: 'Prospecto',
                notas_generales: ''
            });
        }
    }, [clienteEdicion]);

    const handleClienteChange = (e) => {
        const { name, value } = e.target;
        setClienteData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clienteData.nombre_empresa) {
            setMensaje({ tipo: 'error', texto: 'El nombre de la empresa es obligatorio.' });
            return;
        }

        // Sanitización extrema para depurar error 400
        const payload = {
            ...clienteData,
            estatus: clienteData.estatus || 'activo'
        };

        const exito = await onSave('clientes', payload);
        if (exito) {
            if (!clienteEdicion) {
                setClienteData({
                    nombre_empresa: '',
                    nombre_contacto: '',
                    email: '',
                    telefono: '',
                    direccion_completa: '',
                    plaza: 'MERIDA',
                    segmento: 'PYME',
                    tipo_acuerdo: 'SIN_ACUERDO',
                    tipo: 'prospecto',
                    etapa: 'Prospecto',
                    notas_generales: ''
                });
            } else if (onCancel) {
                onCancel();
            }
        }
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col lg:flex-row">
            {/* Sidebar Decorativo */}
            <div className="lg:w-1/4 bg-gray-900 p-8 text-white flex flex-col justify-between relative">
                {/* Botón de Cerrar (X) arriba a la derecha */}
                <button
                    type="button"
                    onClick={onCancel}
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-all z-20 group"
                    title="Cerrar y descartar"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>

                <div>
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/40 mb-6">
                        <UserPlus size={24} />
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter mb-2">
                        {clienteEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                        {clienteEdicion ? 'Actualiza los datos de la cuenta en el sistema central.' : 'Registra una nueva cuenta en el CRM centralizado de Televisa MID.'}
                    </p>
                </div>


                <div className="space-y-4 pt-8 border-t border-gray-800">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Base de Datos Segura
                    </div>
                </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex-1 p-8 md:p-12 space-y-8">
                {/* Indicador de Etapa CRM */}
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Flujo Comercial CRM</h4>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm
                            ${clienteData.etapa === 'Cliente' ? 'bg-green-500 text-white' :
                                clienteData.etapa === 'No Interesado' ? 'bg-gray-400 text-white' : 'bg-red-600 text-white'}`}>
                            {clienteData.etapa}
                        </span>
                    </div>
                    <div className="flex gap-2 h-1.5">
                        {['Prospecto', 'Contactado', 'Interesado', 'No Interesado', 'Cliente'].map((e, idx) => {
                            const stages = ['Prospecto', 'Contactado', 'Interesado', 'No Interesado', 'Cliente'];
                            const currentIdx = stages.indexOf(clienteData.etapa);
                            const isActive = idx <= currentIdx && clienteData.etapa !== 'No Interesado';
                            const isNoInteresado = clienteData.etapa === 'No Interesado' && idx === 3;

                            return (
                                <div
                                    key={idx}
                                    className={`flex-1 rounded-full transition-all duration-500 ${isNoInteresado ? 'bg-gray-400' :
                                        isActive ? (idx === 4 ? 'bg-green-500' : 'bg-red-600') : 'bg-gray-200'
                                        }`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-3">
                        {['Prospecto', 'Cliente'].map(label => (
                            <span key={label} className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Información Básica */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4">Información de Empresa</h4>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Razón Social / Nombre Comercial</label>
                            <input
                                type="text"
                                name="nombre_empresa"
                                value={clienteData.nombre_empresa}
                                onChange={handleClienteChange}
                                required
                                placeholder="Ej: Corporativo del Sur S.A."
                                className="w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Plaza Base</label>
                                <select
                                    name="plaza"
                                    value={clienteData.plaza}
                                    onChange={handleClienteChange}
                                    className="w-full max-w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none appearance-none truncate"
                                >
                                    {['MERIDA', 'CANCUN', 'CAMPECHE', 'CDMX'].map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Segmento</label>
                                <select
                                    name="segmento"
                                    value={clienteData.segmento}
                                    onChange={handleClienteChange}
                                    className="w-full max-w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none appearance-none truncate"
                                >
                                    {['PYME', 'CORPORATIVO', 'GOBIERNO', 'OTROS'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Contacto Directo */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4">Contacto Directo</h4>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Persona de Contacto</label>
                            <div className="relative">
                                <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="text"
                                    name="nombre_contacto"
                                    value={clienteData.nombre_contacto}
                                    onChange={handleClienteChange}
                                    placeholder="Nombre del responsable"
                                    className="w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input
                                        type="tel"
                                        name="telefono"
                                        value={clienteData.telefono}
                                        onChange={handleClienteChange}
                                        placeholder="999..."
                                        className="w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={clienteData.email}
                                        onChange={handleClienteChange}
                                        placeholder="correo@empresa.com"
                                        className="w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tipo de Acuerdo</label>
                            <select
                                name="tipo_acuerdo"
                                value={clienteData.tipo_acuerdo}
                                onChange={handleClienteChange}
                                className="w-full max-w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none appearance-none truncate"
                            >
                                {['SIN_ACUERDO', 'ACUERDO_ANUAL', 'PRECIO_FIJO'].map(t => (
                                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Etapa Comercial</label>
                            <select
                                name="etapa"
                                value={clienteData.etapa}
                                onChange={handleClienteChange}
                                className="w-full max-w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none appearance-none truncate"
                            >
                                {['Prospecto', 'Contactado', 'Interesado', 'No Interesado', 'Cliente'].map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Dirección Completa</label>
                            <div className="relative">
                                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="text"
                                    name="direccion_completa"
                                    value={clienteData.direccion_completa}
                                    onChange={handleClienteChange}
                                    placeholder="Calle, Número, Colonia, Ciudad"
                                    className="w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Notas Generales / Alertas</label>
                        <textarea
                            name="notas_generales"
                            value={clienteData.notas_generales}
                            onChange={handleClienteChange}
                            placeholder="Información relevante para ventas y facturación..."
                            rows="2"
                            className="w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-medium outline-none"
                        ></textarea>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-gray-100 text-gray-900 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center active:scale-[0.98]"
                        >
                            <X className="mr-3" size={24} />
                            Descartar
                        </button>
                    )}
                    <button
                        type="submit"
                        className="flex-[2] bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center shadow-xl shadow-red-200 active:scale-[0.98]"
                    >
                        <Save className="mr-3" size={24} />
                        {clienteEdicion ? 'Actualizar Cliente' : 'Guardar en CRM'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClientForm;
