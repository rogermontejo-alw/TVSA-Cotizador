import React, { useState } from 'react';
import { Target, Save, Calendar, Plus, Trash2 } from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const GoalManager = ({ metas, onSaveGoal, onRemoveGoal }) => {
    console.log("🥅 GoalManager rendering with metas:", metas);
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [monto, setMonto] = useState('');

    const MESES = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!monto || monto <= 0) return;

        // Buscar si ya existe para actualizar
        const existe = metas.find(m => m.mes === parseInt(mes) && m.anio === parseInt(anio));

        onSaveGoal({
            id: existe?.id || '',
            mes: parseInt(mes),
            anio: parseInt(anio),
            monto_meta: parseFloat(monto)
        });

        setMonto('');
    };

    return (
        <div className="space-y-6">
            {/* Formulario de Alta */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                        <Target size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Configuración de Metas</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">Define objetivos de venta mensuales</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Mes</label>
                        <select
                            value={mes}
                            onChange={(e) => setMes(e.target.value)}
                            className="w-full max-w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-black focus:ring-1 focus:ring-red-500 outline-none truncate"
                        >
                            {MESES.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Año</label>
                        <input
                            type="number"
                            value={anio}
                            onChange={(e) => setAnio(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-black focus:ring-1 focus:ring-red-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Meta (MXN)</label>
                        <input
                            type="number"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            placeholder="Ej: 1500000"
                            className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-black focus:ring-1 focus:ring-red-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-slate-900 text-white p-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2 h-[42px]"
                    >
                        <Save size={16} /> Registrar Goal
                    </button>
                </form>
            </div>

            {/* Listado de Metas */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-gray-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} /> Histórico de Objetivos
                    </span>
                </div>
                <div className="divide-y divide-gray-50">
                    {metas && metas.length > 0 ? metas.map(m => (
                        <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[10px] uppercase">
                                    {MESES[m.mes - 1]?.substring(0, 3)}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800">{MESES[m.mes - 1]} {m.anio}</p>
                                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Vigente</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-sm font-black text-slate-900">{formatMXN(m.monto_meta)}</span>
                                <button
                                    onClick={() => {
                                        if (window.confirm('¿Eliminar esta meta?')) onRemoveGoal(m.id);
                                    }}
                                    className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="p-12 text-center">
                            <p className="text-[10px] font-black text-gray-300 uppercase italic">No hay metas registradas aún</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoalManager;
