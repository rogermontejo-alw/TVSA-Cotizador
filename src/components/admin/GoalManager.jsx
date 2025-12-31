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
        <div className="space-y-6 animate-premium-fade">
            <div className="bg-enterprise-950 p-6 rounded-2xl md:rounded-b-none flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 blur-[80px] -mr-32 -mt-32"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <Target size={20} className="text-brand-orange" />
                    <h3 className="text-sm font-black text-white uppercase italic italic-brand flex items-center gap-3 tracking-widest">
                        Objetivos de Rendimiento
                    </h3>
                </div>
            </div>

            {/* Formulario de Alta */}
            <div className="bg-white p-4 md:p-6 rounded-b-[2.5rem] shadow-xl border border-enterprise-100">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-enterprise-400 uppercase ml-2 tracking-widest">Mes Operativo</label>
                        <select
                            value={mes}
                            onChange={(e) => setMes(e.target.value)}
                            className="w-full bg-enterprise-50 border border-enterprise-100 rounded-2xl px-4 py-3 text-sm font-black focus:ring-1 focus:ring-brand-orange/20 outline-none appearance-none shadow-sm"
                        >
                            {MESES.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-enterprise-400 uppercase ml-2 tracking-widest">Año Fiscal</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={anio}
                            onChange={(e) => setAnio(e.target.value)}
                            className="w-full bg-enterprise-50 border border-enterprise-100 rounded-2xl px-4 py-3 text-sm font-black focus:ring-1 focus:ring-brand-orange/20 outline-none shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-enterprise-400 uppercase ml-2 tracking-widest">Meta de Ingreso (MXN)</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            placeholder="Ej: 1500000"
                            className="w-full bg-enterprise-50 border border-enterprise-100 rounded-2xl px-4 py-3 text-sm font-black focus:ring-1 focus:ring-brand-orange/20 outline-none shadow-sm placeholder:text-enterprise-300"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-enterprise-950 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-orange transition-all flex items-center justify-center gap-3 h-[46px] shadow-xl shadow-enterprise-900/10 active:scale-95"
                    >
                        <Save size={16} /> Registrar Meta
                    </button>
                </form>
            </div>

            {/* Listado de Metas */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-enterprise-100 overflow-hidden">
                <div className="p-4 bg-enterprise-50 border-b border-enterprise-100">
                    <span className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} className="text-brand-orange" /> Histórico de Objetivos
                    </span>
                </div>
                <div className="divide-y divide-enterprise-50">
                    {metas && metas.length > 0 ? metas.map(m => (
                        <div key={m.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-enterprise-50/50 transition-all gap-4">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-enterprise-950 text-white flex items-center justify-center font-black text-[9px] sm:text-[11px] uppercase shadow-lg flex-shrink-0">
                                    {MESES[m.mes - 1]?.substring(0, 3)}
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-black text-enterprise-950 uppercase italic italic-brand leading-tight">{MESES[m.mes - 1]} {m.anio}</p>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Vigente</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-8">
                                <span className="text-sm sm:text-lg font-black text-enterprise-950 tabular-nums">{formatMXN(m.monto_meta, 0)}</span>
                                <button
                                    onClick={() => {
                                        if (window.confirm('¿Eliminar esta meta?')) onRemoveGoal(m.id);
                                    }}
                                    className="p-3 text-enterprise-200 hover:text-brand-magenta hover:bg-brand-magenta/5 rounded-xl transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center">
                            <Target className="mx-auto text-enterprise-100 mb-6" size={64} />
                            <p className="text-[11px] font-black text-enterprise-300 uppercase tracking-widest italic leading-relaxed">No hay proyecciones financieras <br /> registradas para este periodo</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoalManager;
