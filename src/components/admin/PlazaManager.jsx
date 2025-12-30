import React, { useState } from 'react';
import { MapPin, Plus, Trash2, ShieldCheck, AlertCircle, Building2 } from 'lucide-react';

const PlazaManager = ({ configuracion, onSave, setMensaje }) => {
    // Plaza base protegida
    const PLAZA_BASE = 'MERIDA YUCATAN';

    // Obtener plazas de la configuración o usar defaults si no existe
    const plazasString = configuracion.LISTA_PLAZAS || 'MERIDA YUCATAN,CANCUN,CAMPECHE,CHETUMAL,PLAYA DEL CARMEN,COZUMEL,CORPORATIVO';
    const plazas = plazasString.split(',').map(p => p.trim()).filter(Boolean);

    const [nuevaPlaza, setNuevaPlaza] = useState('');

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!nuevaPlaza.trim()) return;

        const nombre = nuevaPlaza.trim().toUpperCase();

        if (plazas.includes(nombre)) {
            setMensaje({ tipo: 'error', texto: `La plaza "${nombre}" ya está registrada.` });
            return;
        }

        const nuevaLista = [...plazas, nombre].join(',');

        const result = await onSave('configuracion', [{
            parametro: 'LISTA_PLAZAS',
            valor: nuevaLista,
            tipo: 'TEXTO'
        }], 'parametro');

        if (result) {
            setMensaje({ tipo: 'exito', texto: `Plaza "${nombre}" añadida al catálogo oficial.` });
            setNuevaPlaza('');
        }
    };

    const handleRemove = async (nombre) => {
        if (nombre === PLAZA_BASE) {
            setMensaje({ tipo: 'error', texto: 'No se puede eliminar la plaza base del sistema.' });
            return;
        }

        const nuevaLista = plazas.filter(p => p !== nombre).join(',');

        const result = await onSave('configuracion', [{
            parametro: 'LISTA_PLAZAS',
            valor: nuevaLista,
            tipo: 'TEXTO'
        }], 'parametro');

        if (result) {
            setMensaje({ tipo: 'exito', texto: `Plaza "${nombre}" eliminada del catálogo.` });
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 animate-premium-fade">
            <div className="bg-enterprise-950 p-6 rounded-2xl md:rounded-b-none flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 blur-[80px] -mr-32 -mt-32"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <MapPin size={20} className="text-brand-orange" />
                    <h3 className="text-sm font-black text-white uppercase italic italic-brand flex items-center gap-3 tracking-widest">
                        Gestión de Regiones Operativas
                    </h3>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-orange/10 rounded-lg text-brand-orange text-[9px] font-black uppercase tracking-[0.2em] border border-brand-orange/20 relative z-10 shadow-lg">
                    <ShieldCheck size={14} /> Catálogo Maestro
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Formulario de Alta */}
                <div className="md:col-span-1">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-enterprise-100 shadow-xl sticky top-8">
                        <h4 className="text-[10px] font-black text-enterprise-950 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Plus size={14} className="text-brand-orange" /> Nueva Jurisdicción
                        </h4>

                        <form onSubmit={handleAdd} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest ml-2">Nombre de Plaza</label>
                                <input
                                    type="text"
                                    placeholder="Ej. VALLADOLID"
                                    value={nuevaPlaza}
                                    onChange={(e) => setNuevaPlaza(e.target.value.toUpperCase())}
                                    className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all uppercase"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-enterprise-950 text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-brand-orange transition-all shadow-lg active:scale-95 text-[9px]"
                            >
                                Registrar Plaza
                            </button>
                        </form>

                        <div className="mt-8 p-4 bg-enterprise-50 rounded-2xl border border-enterprise-100 italic">
                            <p className="text-[8px] text-enterprise-400 leading-relaxed">
                                <AlertCircle size={10} className="inline mr-1 mb-0.5" />
                                Nota: Los nombres se normalizarán a mayúsculas para evitar duplicidades en el motor de cálculo.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Listado de Plazas */}
                <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {plazas.map((p) => (
                            <div
                                key={p}
                                className={`
                                    bg-white p-5 rounded-2xl border flex items-center justify-between group transition-all hover:shadow-lg
                                    ${p === PLAZA_BASE ? 'border-brand-orange/20 bg-brand-orange/5' : 'border-enterprise-100'}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                        ${p === PLAZA_BASE ? 'bg-brand-orange text-white' : 'bg-enterprise-50 text-enterprise-400 group-hover:bg-enterprise-950 group-hover:text-white'}
                                    `}>
                                        <Building2 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-enterprise-950 uppercase tracking-tight">{p}</p>
                                        {p === PLAZA_BASE && (
                                            <p className="text-[7px] font-bold text-brand-orange uppercase tracking-widest">Plaza Principal</p>
                                        )}
                                    </div>
                                </div>

                                {p !== PLAZA_BASE && (
                                    <button
                                        onClick={() => handleRemove(p)}
                                        className="p-2.5 text-enterprise-200 hover:text-brand-magenta hover:bg-brand-magenta/5 rounded-lg transition-all"
                                        title="Eliminar Plaza"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlazaManager;
