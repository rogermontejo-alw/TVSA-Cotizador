import React, { useState } from 'react';
import { User, Phone, Briefcase, Save, Mail, Lock, ShieldCheck, AlertCircle, RefreshCw, Trash2, Edit, UserPlus, X, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ProfileForm = ({ perfil, perfiles = [], onSave, onEliminar, setMensaje, onLogout }) => {
    // Estado para gestión de usuarios (Lista y Edición)
    const [editMode, setEditMode] = useState(false); // false = list, true = form
    const [selectedUser, setSelectedUser] = useState(null); // null = nuevo usuario
    const [userFormData, setUserFormData] = useState({
        nombre_completo: '',
        telefono: '',
        puesto: 'Asesor Comercial',
        email: '',
        iniciales: '',
        codigo_ciudad: 'MID',
        rol: 'ventas',
        newPassword: '',
        confirmPassword: ''
    });

    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setUserFormData({
            nombre_completo: user.nombre_completo || '',
            telefono: user.telefono || '',
            puesto: user.puesto || 'Asesor Comercial',
            email: user.email || '',
            iniciales: user.iniciales || '',
            codigo_ciudad: user.codigo_ciudad || 'MID',
            rol: user.rol || 'ventas',
            newPassword: '',
            confirmPassword: ''
        });
        setEditMode(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNewUser = () => {
        setSelectedUser(null);
        setUserFormData({
            nombre_completo: '',
            telefono: '',
            puesto: 'Asesor Comercial',
            email: '',
            iniciales: '',
            codigo_ciudad: 'MID',
            rol: 'ventas',
            newPassword: '',
            confirmPassword: ''
        });
        setEditMode(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmitUser = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            // 1. Validaciones de Contraseña
            if (userFormData.newPassword) {
                if (userFormData.newPassword.length < 6) {
                    throw new Error('La contraseña debe tener al menos 6 caracteres');
                }
                if (userFormData.newPassword !== userFormData.confirmPassword) {
                    throw new Error('Las contraseñas no coinciden');
                }
            }

            // 2. Sincronización con Supabase Auth (Solo si es mi propio usuario)
            let shouldLogout = false;
            if (selectedUser?.id === perfil?.id) {
                const authUpdate = {};
                if (userFormData.email !== perfil.email) {
                    authUpdate.email = userFormData.email;
                    shouldLogout = true;
                }
                if (userFormData.newPassword) {
                    authUpdate.password = userFormData.newPassword;
                    shouldLogout = true;
                }

                if (Object.keys(authUpdate).length > 0) {
                    const { error: authError } = await supabase.auth.updateUser(authUpdate);
                    if (authError) throw authError;
                }
            }

            // 3. Sincronización con Tabla 'perfiles' (Database)
            const payload = {
                nombre_completo: userFormData.nombre_completo,
                telefono: userFormData.telefono,
                puesto: userFormData.puesto,
                email: userFormData.email, // Guardamos el email en la DB para el directorio
                iniciales: userFormData.iniciales.toUpperCase(),
                codigo_ciudad: userFormData.codigo_ciudad.toUpperCase(),
                rol: userFormData.rol,
                id: selectedUser?.id // Si es nuevo, esto es undefined
            };

            await onSave('perfiles', payload);

            if (shouldLogout) {
                setMensaje({
                    tipo: 'exito',
                    texto: 'Credenciales actualizadas correctamente. Redirigiendo...'
                });
                setTimeout(() => {
                    onLogout();
                }, 1500);
            } else {
                setEditMode(false);
                setMensaje({
                    tipo: 'exito',
                    texto: selectedUser ? 'Datos guardados correctamente' : 'Nuevo usuario creado'
                });
            }
        } catch (err) {
            console.error("❌ Error Admin Sync:", err);
            setMensaje({ tipo: 'error', texto: err.message });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteUser = async (user) => {
        if (perfiles.length <= 1) {
            setMensaje({ tipo: 'error', texto: 'No puedes eliminar al único usuario del sistema' });
            return;
        }

        if (user.id === perfil?.id) {
            setMensaje({ tipo: 'error', texto: 'No puedes eliminarte a ti mismo.' });
            return;
        }

        if (window.confirm(`¿Seguro que deseas revocar el acceso a ${user.nombre_completo}?`)) {
            await onEliminar(user.id);
        }
    };

    if (!perfil) {
        return (
            <div className="bg-white rounded-[2rem] shadow-xl p-20 text-center border border-gray-100 max-w-2xl mx-auto flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Sincronizando perfiles...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full animate-in fade-in duration-500 pb-24">

            <div className="bg-white rounded-none md:rounded-[2.5rem] shadow-none md:shadow-2xl border-x-0 md:border border-enterprise-100">
                {/* Header Responsivo */}
                <div className="px-4 md:px-6 py-4 md:py-5 bg-enterprise-950 flex justify-between items-center rounded-none md:rounded-t-[2.5rem]">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-brand-orange" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic italic-brand">Mi Cuenta y Directorio</h3>
                    </div>
                    {!editMode && (
                        <button
                            onClick={handleNewUser}
                            className="px-3 md:px-4 py-2 bg-white text-enterprise-950 rounded-lg font-black uppercase tracking-widest text-[8px] md:text-[9px] hover:bg-brand-orange hover:text-white transition-all shadow-md flex items-center gap-2 active:scale-95"
                        >
                            <UserPlus size={14} /> <span className="hidden xs:inline">Nuevo</span>
                        </button>
                    )}
                </div>

                {editMode ? (
                    <div className="p-4 md:p-8 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center mb-6 md:mb-8 pb-4 border-b border-gray-100">
                            <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] md:tracking-[0.3em]">
                                {selectedUser ? `Edición: ${selectedUser.nombre_completo}` : 'Nuevo Registro de Colaborador'}
                            </h4>
                            <button onClick={() => setEditMode(false)} className="p-2 text-gray-400 hover:text-red-600 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitUser} className="space-y-6 md:space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                {/* Columna 1: Perfil Público */}
                                <div className="space-y-4 md:space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input
                                                type="text"
                                                value={userFormData.nombre_completo}
                                                onChange={(e) => setUserFormData({ ...userFormData, nombre_completo: e.target.value })}
                                                className="w-full p-3.5 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-xl transition-all font-bold outline-none text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Puesto Corporativo</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input
                                                type="text"
                                                value={userFormData.puesto}
                                                onChange={(e) => setUserFormData({ ...userFormData, puesto: e.target.value })}
                                                className="w-full p-3.5 pl-12 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-xl transition-all font-bold outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Iniciales (Folios)</label>
                                            <input
                                                type="text"
                                                value={userFormData.iniciales}
                                                onChange={(e) => setUserFormData({ ...userFormData, iniciales: e.target.value.slice(0, 5) })}
                                                placeholder="EJ. RAM"
                                                className="w-full p-3.5 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-xl transition-all font-bold outline-none text-sm uppercase"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Matriz (MID)</label>
                                            <input
                                                type="text"
                                                value={userFormData.codigo_ciudad}
                                                onChange={(e) => setUserFormData({ ...userFormData, codigo_ciudad: e.target.value.slice(0, 5) })}
                                                placeholder="EJ. MID"
                                                className="w-full p-3.5 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-xl transition-all font-bold outline-none text-sm uppercase"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Rol de Seguridad</label>
                                            <select
                                                value={userFormData.rol}
                                                onChange={(e) => setUserFormData({ ...userFormData, rol: e.target.value })}
                                                disabled={perfil?.rol !== 'Gerencia' && selectedUser?.id !== perfil?.id}
                                                className="w-full p-3.5 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-xl transition-all font-bold outline-none text-sm uppercase"
                                            >
                                                <option value="Gerencia">Gerencia (Control Total)</option>
                                                <option value="ventas">Ventas (Operativo)</option>
                                                <option value="admon">Admon (Administrativo)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Columna 2: Seguridad y Auth */}
                                <div className="bg-enterprise-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] space-y-4 md:space-y-5 border border-enterprise-100">
                                    <h5 className="text-[9px] font-black text-enterprise-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                                        <Lock size={12} className="text-brand-orange" /> Credenciales de Sistema
                                    </h5>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest ml-1">Email de Acceso</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-enterprise-300" size={18} />
                                            <input
                                                type="email"
                                                value={userFormData.email}
                                                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                                disabled={selectedUser && selectedUser.id !== perfil.id}
                                                className="w-full p-3.5 pl-12 bg-white border border-enterprise-100 focus:border-brand-orange rounded-xl transition-all font-bold outline-none text-sm disabled:opacity-60"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest ml-1">{selectedUser?.id === perfil?.id ? 'Cambiar Contraseña' : 'Password'}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-enterprise-300" size={18} />
                                            <input
                                                type="password"
                                                value={userFormData.newPassword}
                                                onChange={(e) => setUserFormData({ ...userFormData, newPassword: e.target.value })}
                                                disabled={selectedUser && selectedUser.id !== perfil.id}
                                                placeholder={selectedUser?.id === perfil?.id ? "Mínimo 6 caracteres" : "Restringido"}
                                                className="w-full p-3.5 pl-12 bg-white border border-enterprise-100 focus:border-brand-orange rounded-xl transition-all font-bold outline-none text-sm disabled:opacity-60"
                                            />
                                        </div>
                                    </div>
                                    {selectedUser?.id === perfil?.id && userFormData.newPassword && (
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest ml-1">Confirmar Password</label>
                                            <input
                                                type="password"
                                                value={userFormData.confirmPassword}
                                                onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                                                className="w-full p-3.5 bg-white border border-enterprise-100 focus:border-brand-orange rounded-xl transition-all font-bold outline-none text-sm"
                                            />
                                        </div>
                                    )}
                                    {selectedUser && selectedUser.id !== perfil.id && (
                                        <div className="p-3 bg-enterprise-100/50 rounded-lg flex items-start gap-2">
                                            <AlertCircle size={14} className="text-enterprise-400 mt-0.5" />
                                            <p className="text-[8px] font-bold text-enterprise-400 uppercase leading-relaxed italic">
                                                Las claves de acceso son privadas. Solo el titular puede modificarlas desde su propio panel.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 border-t border-enterprise-100">
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 py-4 bg-enterprise-950 text-white rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-emerald-600 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    {isUpdating ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                                    {selectedUser ? 'Aplicar y Sincronizar' : 'Vincular a Sistema'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditMode(false)}
                                    className="px-6 md:px-8 py-4 bg-gray-50 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-gray-100 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="w-full">
                        {/* Versión Mobile: Lista de Cartas */}
                        <div className="grid grid-cols-1 md:hidden divide-y divide-gray-100">
                            {perfiles.map(u => (
                                <div key={u.id} className={`p-4 flex items-center justify-between gap-4 ${u.id === perfil.id ? 'bg-red-50/20' : ''}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black shadow-sm
                                            ${u.id === perfil.id ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {u.nombre_completo?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-black text-slate-900 text-xs truncate uppercase tracking-tight">{u.nombre_completo}</p>
                                                {u.id === perfil.id && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
                                            </div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{u.puesto || 'Colaborador'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleEditUser(u)}
                                        className="p-3 bg-slate-50 text-slate-400 rounded-xl active:bg-slate-900 active:text-white transition-all"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Versión Desktop: Tabla Tradicional */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Identidad</th>
                                        <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Contacto / Email</th>
                                        <th className="px-8 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {perfiles.map(u => (
                                        <tr key={u.id} className={`hover:bg-slate-50/30 transition-colors group ${u.id === perfil.id ? 'bg-red-50/10' : ''}`}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all shadow-sm
                                                        ${u.id === perfil.id ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                                                        {u.nombre_completo?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight leading-none">{u.nombre_completo}</p>
                                                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${u.rol === 'Gerencia' ? 'bg-red-50 text-red-600' : u.rol === 'admon' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                                                                {u.rol || 'ventas'}
                                                            </span>
                                                            {u.id === perfil.id && <span className="bg-emerald-50 text-emerald-600 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">TÚ</span>}
                                                        </div>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{u.puesto || 'Colaborador'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-xs font-bold text-slate-600 mb-1 leading-none">{u.email}</p>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    <Phone size={10} className="text-slate-200" />
                                                    {u.telefono || 'S/N'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditUser(u)}
                                                        className="p-2 bg-gray-50 text-gray-400 hover:bg-slate-900 hover:text-white rounded-lg transition-all shadow-sm"
                                                        title="Editar"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    {u.id !== perfil.id && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u)}
                                                            className="p-2 bg-red-50 text-red-300 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-center text-[7px] md:text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] md:tracking-[0.6em] mt-8">
                Infraestructura de Gestión Segura • Televisa MID 2025
            </p>
        </div>
    );
};

export default ProfileForm;
