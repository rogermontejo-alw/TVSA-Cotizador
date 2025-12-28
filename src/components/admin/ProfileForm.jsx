import React, { useState, useEffect } from 'react';
import { User, Phone, Briefcase, Save, Mail, Lock, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ProfileForm = ({ perfil, onSave, setMensaje }) => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        telefono: '',
        puesto: 'Asesor Comercial'
    });

    const [securityData, setSecurityData] = useState({
        newEmail: perfil?.email || '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);

    useEffect(() => {
        if (perfil) {
            setFormData({
                nombre_completo: perfil.nombre_completo || '',
                telefono: perfil.telefono || '',
                puesto: perfil.puesto || 'Asesor Comercial'
            });
            setSecurityData(prev => ({ ...prev, newEmail: perfil.email }));
        }
    }, [perfil]);

    if (!perfil) {
        return (
            <div className="bg-white rounded-[2rem] shadow-xl p-20 text-center border border-gray-100 max-w-2xl mx-auto flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Sincronizando perfil...</p>
            </div>
        );
    }

    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No hay sesión activa');

            const payload = {
                id: user.id,
                ...formData
            };

            await onSave('perfiles', payload);
        } catch (err) {
            setMensaje({ tipo: 'error', texto: err.message });
        }
    };

    const handleUpdateSecurity = async (e) => {
        e.preventDefault();
        setIsUpdatingAuth(true);

        try {
            // Validaciones básicas
            if (securityData.newPassword && securityData.newPassword !== securityData.confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }

            const updatePayload = {};
            if (securityData.newEmail !== perfil.email) {
                updatePayload.email = securityData.newEmail;
            }
            if (securityData.newPassword) {
                updatePayload.password = securityData.newPassword;
            }

            if (Object.keys(updatePayload).length === 0) {
                throw new Error('No hay cambios de seguridad para aplicar');
            }

            const { error } = await supabase.auth.updateUser(updatePayload);
            if (error) throw error;

            setMensaje({
                tipo: 'exito',
                texto: securityData.newEmail !== perfil.email
                    ? 'Se ha enviado un correo de confirmación a tu nueva dirección.'
                    : 'Contraseña actualizada correctamente.'
            });

            setSecurityData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        } catch (err) {
            setMensaje({ tipo: 'error', texto: err.message });
        } finally {
            setIsUpdatingAuth(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. Datos de Firma / Perfil */}
                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 flex flex-col h-full">
                    <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-slate-900 text-white">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight uppercase">Datos de Firma</h3>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Publicidad en PDF</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitProfile} className="p-8 space-y-6 flex-1">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="text"
                                    value={formData.nombre_completo}
                                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                                    className="w-full p-4 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none text-sm"
                                    placeholder="Tu nombre en cotizaciones"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Puesto / Cargo</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="text"
                                    value={formData.puesto}
                                    onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                    className="w-full p-4 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    className="w-full p-4 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 mt-4"
                        >
                            <Save size={16} /> Guardar Firma
                        </button>
                    </form>
                </div>

                {/* 2. Seguridad / Acceso */}
                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 flex flex-col h-full">
                    <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-red-600 text-white">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight uppercase">Seguridad y Acceso</h3>
                            <p className="text-[8px] font-bold text-red-200 uppercase tracking-[0.2em]">Credenciales Supabase</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateSecurity} className="p-8 space-y-6 flex-1">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nuevo Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/50" size={18} />
                                <input
                                    type="email"
                                    value={securityData.newEmail}
                                    onChange={(e) => setSecurityData({ ...securityData, newEmail: e.target.value })}
                                    className="w-full p-4 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none text-sm"
                                    placeholder="nuevo@televisa.com.mx"
                                    required
                                />
                            </div>
                            <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-tighter px-1 flex items-center gap-1">
                                <AlertCircle size={10} /> Requiere confirmación por correo
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/50" size={18} />
                                    <input
                                        type="password"
                                        value={securityData.newPassword}
                                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                        className="w-full p-4 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none text-sm"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/50" size={18} />
                                    <input
                                        type="password"
                                        value={securityData.confirmPassword}
                                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                        className="w-full p-4 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isUpdatingAuth}
                            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdatingAuth ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                            Actualizar Credenciales
                        </button>
                    </form>
                </div>
            </div>

            <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.5em] mt-8">
                Portal de Administración Segura • Televisa MID 2025
            </p>
        </div>
    );
};

export default ProfileForm;
