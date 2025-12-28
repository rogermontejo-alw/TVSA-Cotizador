import React, { useState, useEffect } from 'react';
import { User, Phone, Briefcase, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ProfileForm = ({ perfil, onSave, setMensaje }) => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        telefono: '',
        puesto: 'Asesor Comercial'
    });

    useEffect(() => {
        if (perfil) {
            setFormData({
                nombre_completo: perfil.nombre_completo || '',
                telefono: perfil.telefono || '',
                puesto: perfil.puesto || 'Asesor Comercial'
            });
        }
    }, [perfil]);

    const handleSubmit = async (e) => {
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

    return (
        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 max-w-2xl mx-auto">
            <div className="p-8 md:p-12">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">Mi Perfil Profesional</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estos datos aparecerán en tu firma de PDF</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input
                                type="text"
                                value={formData.nombre_completo}
                                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                                placeholder="Ej: Roger Montejo"
                                className="w-full p-4 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    placeholder="999..."
                                    className="w-full p-4 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Puesto / Cargo</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="text"
                                    value={formData.puesto}
                                    onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                    className="w-full p-4 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Save size={18} /> Actualizar Información de Firma
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileForm;
