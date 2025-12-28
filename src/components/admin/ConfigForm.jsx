import React, { useState, useEffect } from 'react';
import { Save, Settings, Hash, Type } from 'lucide-react';

const ConfigForm = ({ configuracion, onSave, setMensaje }) => {
    // Convertir objeto de config a array para editar
    const [configArray, setConfigArray] = useState([]);

    useEffect(() => {
        if (configuracion) {
            const arr = Object.entries(configuracion).map(([key, value]) => ({
                parametro: key,
                valor: value,
                tipo: typeof value === 'number' ? 'NUMERO' : 'TEXTO'
            }));
            setConfigArray(arr);
        }
    }, [configuracion]);

    const handleChange = (parametro, newValue) => {
        setConfigArray(prev => prev.map(c =>
            c.parametro === parametro ? { ...c, valor: newValue } : c
        ));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMensaje({ tipo: 'cargando', texto: 'Actualizando configuración...' });

        // El onSave de useDatabase hace upsert, así que podemos enviar el array directamente
        const payload = configArray.map(c => ({
            parametro: c.parametro,
            valor: c.valor.toString(),
            tipo: c.tipo
        }));

        const result = await onSave('configuracion', payload, 'parametro');
        if (result) {
            setMensaje({ tipo: 'exito', texto: 'Configuración global actualizada.' });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-8">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <Settings size={24} className="text-red-500" />
                    Configuración del Sistema
                </h3>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {configArray.map((config) => (
                        <div key={config.parametro} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-red-100 transition-all">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                {config.parametro.replace(/_/g, ' ')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                                    {config.tipo === 'NUMERO' ? <Hash size={16} /> : <Type size={16} />}
                                </div>
                                <input
                                    type={config.tipo === 'NUMERO' ? 'number' : 'text'}
                                    step="0.01"
                                    value={config.valor}
                                    onChange={(e) => handleChange(config.parametro, e.target.value)}
                                    className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-700"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        className="w-full bg-slate-800 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center shadow-lg active:scale-95"
                    >
                        <Save className="mr-3" size={20} />
                        Guardar Cambios Globales
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ConfigForm;
