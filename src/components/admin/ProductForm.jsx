import React, { useState } from 'react';
import { X, Save, Tv, Tag, MapPin, DollarSign, Clock, Layout, Layers, Activity } from 'lucide-react';

const ProductForm = ({ onSave, onCancel, productoEdicion = null, plazasOficiales = [] }) => {
    const [formData, setFormData] = useState(productoEdicion || {
        canal: '',
        plaza: plazasOficiales[0] || 'MERIDA YUCATAN',
        tipo: '',
        duracion: '20"',
        horario: '',
        costo_base: '',
        activo: true
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Saneamiento estricto antes de enviar a DB
        const payload = {
            canal: formData.canal,
            plaza: formData.plaza,
            tipo: formData.tipo,
            duracion: formData.duracion,
            horario: formData.horario,
            costo_base: parseFloat(formData.costo_base),
            activo: formData.activo
        };

        // Si es edición, incluimos el ID original
        if (productoEdicion?.id) {
            payload.id = productoEdicion.id;
        }

        onSave('productos', payload);
    };

    return (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-enterprise-100 overflow-hidden animate-premium-fade">
            <div className="bg-enterprise-950 p-8 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-orange/20">
                        <Tv size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase italic italic-brand tracking-tighter">
                            {productoEdicion ? 'Ajustar Activo' : 'Nuevo Activo Publicitario'}
                        </h2>
                        <p className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest mt-1">
                            Pricing Engine Configuration
                        </p>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="p-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Canal / Medio */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">
                            <Layout size={12} className="text-brand-orange" /> Canal / Medio
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="Ej. CANAL 13, DIGITAL, etc."
                            value={formData.canal}
                            onChange={(e) => setFormData({ ...formData, canal: e.target.value.toUpperCase() })}
                            className="premium-input h-14 bg-enterprise-50 border-none focus:ring-2 focus:ring-brand-orange/20 font-bold"
                        />
                    </div>

                    {/* Plaza */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">
                            <MapPin size={12} className="text-brand-orange" /> Plaza / Ciudad
                        </label>
                        <select
                            required
                            value={formData.plaza}
                            onChange={(e) => setFormData({ ...formData, plaza: e.target.value })}
                            className="premium-input h-14 bg-enterprise-50 border-none focus:ring-2 focus:ring-brand-orange/20 font-bold appearance-none"
                        >
                            <option value="" disabled>Seleccionar Plaza...</option>
                            {plazasOficiales.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-enterprise-50/50 p-8 rounded-[2rem] border border-enterprise-100/50">
                    <h3 className="text-[10px] font-black text-enterprise-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <Layers size={14} className="text-brand-orange" /> Especificaciones del Activo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Tipo de Producto */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">
                                <Tag size={12} className="text-brand-orange" /> Tipo
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="SPOT, MENCION..."
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value.toUpperCase() })}
                                className="premium-input h-14 bg-white border-none focus:ring-2 focus:ring-brand-orange/20 font-bold"
                            />
                        </div>

                        {/* Duración */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">
                                <Clock size={12} className="text-brand-orange" /> Tiempo
                            </label>
                            <input
                                type="text"
                                placeholder='10", 20", 30"...'
                                value={formData.duracion}
                                onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                                className="premium-input h-14 bg-white border-none focus:ring-2 focus:ring-brand-orange/20 font-bold text-center"
                            />
                        </div>

                        {/* Horario */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">
                                <Clock size={12} className="text-brand-orange" /> Horario
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="PRIME TIME, AAA..."
                                value={formData.horario}
                                onChange={(e) => setFormData({ ...formData, horario: e.target.value.toUpperCase() })}
                                className="premium-input h-14 bg-white border-none focus:ring-2 focus:ring-brand-orange/20 font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Costo Base */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">
                        <DollarSign size={12} className="text-brand-orange" /> Tarifa Base (MXN)
                    </label>
                    <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-enterprise-300">$</span>
                        <input
                            required
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.costo_base}
                            onChange={(e) => setFormData({ ...formData, costo_base: e.target.value })}
                            className="premium-input h-14 pl-10 bg-enterprise-50 border-none focus:ring-2 focus:ring-brand-orange/20 font-black text-lg"
                        />
                    </div>
                </div>

                <div className="pt-6 flex flex-col md:flex-row gap-4">
                    <button
                        type="submit"
                        className="flex-1 h-16 bg-enterprise-950 text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-brand-orange transition-all shadow-xl shadow-enterprise-900/20 active:scale-95 flex items-center justify-center gap-3 text-xs"
                    >
                        <Save size={18} />
                        {productoEdicion ? 'Actualizar Master Record' : 'Dar de Alta en Inventario'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-16 px-10 bg-enterprise-50 text-enterprise-400 font-black uppercase tracking-widest rounded-2xl hover:bg-enterprise-100 transition-all text-[10px]"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
