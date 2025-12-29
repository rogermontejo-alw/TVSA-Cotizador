import React, { useState } from 'react';
import {
    DollarSign, Search, Calendar, FileText, CheckCircle2,
    Clock, AlertCircle, Building2, Upload, Eye, Printer,
    ChevronRight, MoreVertical, Edit3, Save, X, Plus
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';

const CobranzaView = ({ cobranza = [], clientes = [], onSave, setMensaje }) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('todos');
    const [editingId, setEditingId] = useState(null);
    const [uploadingId, setUploadingId] = useState(null);
    const [isShowManualForm, setIsShowManualForm] = useState(false);

    const [formData, setFormData] = useState({
        numero_factura: '',
        fecha_programada_cobro: '',
        estatus_pago: 'pendiente',
        monto_facturado: '',
        cliente_id_manual: '',
        notas: ''
    });

    const filtrados = (cobranza || []).filter(c => {
        // Soporte para facturas vinculadas a cotizacion o directas (si se implementa cliente_id)
        const clienteNom = c.cotizaciones?.clientes?.nombre_empresa || c.clientes?.nombre_empresa || 'Cliente Desconocido';
        const matchesBusqueda =
            (c.cotizaciones?.folio || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            clienteNom.toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.numero_factura || '').toLowerCase().includes(busqueda.toLowerCase());

        const matchesEstatus = filtroEstatus === 'todos' || c.estatus_pago === filtroEstatus;

        return matchesBusqueda && matchesEstatus;
    });

    const stats = {
        total: filtrados.reduce((sum, c) => sum + parseFloat(c.monto_facturado || 0), 0),
        cobrado: filtrados.filter(c => c.estatus_pago === 'cobrado').reduce((sum, c) => sum + parseFloat(c.monto_facturado || 0), 0),
        vencido: filtrados.filter(c => {
            if (c.estatus_pago === 'cobrado') return false;
            if (!c.fecha_programada_cobro) return false;
            return new Date(c.fecha_programada_cobro) < new Date();
        }).reduce((sum, c) => sum + parseFloat(c.monto_facturado || 0), 0)
    };

    const handleEdit = (reg) => {
        setEditingId(reg.id);
        setFormData({
            numero_factura: reg.numero_factura || '',
            fecha_programada_cobro: reg.fecha_programada_cobro || '',
            estatus_pago: reg.estatus_pago || 'pendiente',
            notas: reg.notas || ''
        });
    };

    const handleSave = async (id) => {
        const success = await onSave('cobranza', { ...formData, id });
        if (success) {
            setMensaje({ tipo: 'exito', texto: 'Registro de cobranza actualizado' });
            setEditingId(null);
        }
    };

    const handleSaveManual = async () => {
        if (!formData.cliente_id_manual || !formData.monto_facturado || !formData.numero_factura) {
            setMensaje({ tipo: 'error', texto: 'Por favor completa cliente, folio e importe del subtotal.' });
            return;
        }

        const payload = {
            // Nota: En el esquema actual, se requiere cotizacion_id. 
            // Si no hay, informamos o permitimos nulo si la DB lo deja.
            numero_factura: formData.numero_factura,
            monto_facturado: parseFloat(formData.monto_facturado),
            fecha_programada_cobro: formData.fecha_programada_cobro || null,
            estatus_pago: formData.estatus_pago,
            notas: formData.notas
        };

        const success = await onSave('cobranza', payload);
        if (success) {
            setMensaje({ tipo: 'exito', texto: 'Nueva factura registrada' });
            setIsShowManualForm(false);
            setFormData({
                numero_factura: '',
                fecha_programada_cobro: '',
                estatus_pago: 'pendiente',
                monto_facturado: '',
                cliente_id_manual: '',
                notas: ''
            });
        }
    };

    const handleFileUpload = async (e, id) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingId(id);
        try {
            const fileName = `facturas/${id}_${Date.now()}.pdf`;
            const { data, error } = await supabase.storage
                .from('comprobantes')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('comprobantes')
                .getPublicUrl(fileName);

            await onSave('cobranza', { id, url_archivo_pdf: publicUrl });
            setMensaje({ tipo: 'exito', texto: 'Factura PDF subida correctamente' });
        } catch (err) {
            console.error(err);
            setMensaje({ tipo: 'error', texto: 'Error al subir el archivo. Verifica que el storage "comprobantes" sea público.' });
        } finally {
            setUploadingId(null);
        }
    };

    const getEstatusInfo = (reg) => {
        const esVencido = reg.estatus_pago !== 'cobrado' && reg.fecha_programada_cobro && new Date(reg.fecha_programada_cobro) < new Date();

        if (reg.estatus_pago === 'cobrado') {
            return { label: 'Cobrado', color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle2 size={12} /> };
        }
        if (esVencido) {
            return { label: 'Vencido', color: 'bg-brand-magenta/10 text-brand-magenta', icon: <AlertCircle size={12} /> };
        }
        if (reg.estatus_pago === 'programado') {
            return { label: 'Programado', color: 'bg-blue-50 text-blue-600', icon: <Calendar size={12} /> };
        }
        return { label: 'Pendiente', color: 'bg-enterprise-50 text-enterprise-400', icon: <Clock size={12} /> };
    };

    return (
        <div className="space-y-4 md:space-y-6 pb-24 animate-premium-fade max-w-7xl mx-auto px-4 md:px-0 overflow-hidden">
            {/* Header Cobranza */}
            <div className="bg-enterprise-950 p-6 rounded-2xl md:rounded-b-none flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 blur-[80px] -mr-32 -mt-32"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <DollarSign size={20} className="text-brand-orange" />
                    <h3 className="text-sm font-black text-white uppercase italic italic-brand flex items-center gap-3 tracking-widest">
                        Gestión de Cobranza Premium
                    </h3>
                </div>
            </div>
            {/* Header Stats Compact (Estilo Reporte) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                <div className="bg-white px-3 md:px-6 py-5 rounded-xl md:rounded-2xl shadow-sm border border-enterprise-100 hover:shadow-lg transition-all duration-300">
                    <p className="text-[7px] md:text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-1 md:mb-2">Cartera Individual</p>
                    <div className="flex items-baseline gap-1 md:gap-2">
                        <h4 className="text-sm md:text-xl font-black text-enterprise-950 tracking-tighter">{formatMXN(stats.total)}</h4>
                        <span className="text-[6px] md:text-[7px] font-bold text-enterprise-300 uppercase tracking-tighter">Subt.</span>
                    </div>
                </div>

                <div className="bg-white px-3 md:px-6 py-5 rounded-xl md:rounded-2xl shadow-sm border border-enterprise-100 border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-300">
                    <p className="text-[7px] md:text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 md:mb-2">Recuperado</p>
                    <h4 className="text-sm md:text-xl font-black text-emerald-600 tracking-tighter">{formatMXN(stats.cobrado)}</h4>
                </div>

                <div className="bg-white px-3 md:px-6 py-5 rounded-xl md:rounded-2xl shadow-sm border border-enterprise-100 border-l-4 border-l-brand-magenta hover:shadow-lg transition-all duration-300">
                    <p className="text-[7px] md:text-[8px] font-black text-brand-magenta uppercase tracking-widest mb-1 md:mb-2">Vencido</p>
                    <h4 className="text-sm md:text-xl font-black text-brand-magenta tracking-tighter">{formatMXN(stats.vencido)}</h4>
                </div>

                <div className="bg-enterprise-950 px-3 md:px-6 py-5 rounded-xl md:rounded-2xl shadow-xl flex items-center justify-between group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <p className="text-[7px] md:text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-1 md:mb-2">Facturas Totales</p>
                        <h4 className="text-sm md:text-xl font-black text-white tracking-tighter">{filtrados.length}</h4>
                    </div>
                    <DollarSign size={24} className="text-brand-orange opacity-50 relative z-10 group-hover:scale-110 transition-transform" />
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-enterprise-400 group-focus-within:text-brand-orange transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o factura..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-enterprise-100 rounded-xl font-bold text-[10px] shadow-sm outline-none focus:ring-1 focus:ring-brand-orange/20 transition-all placeholder:text-enterprise-300"
                    />
                </div>

                <div className="flex flex-wrap bg-enterprise-950 rounded-xl p-1 w-full md:w-fit shadow-lg">
                    {['todos', 'pendiente', 'programado', 'cobrado'].map(estatus => (
                        <button
                            key={estatus}
                            onClick={() => setFiltroEstatus(estatus)}
                            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all
                                ${filtroEstatus === estatus
                                    ? 'bg-brand-orange text-white shadow-lg'
                                    : 'text-enterprise-400 hover:text-enterprise-200'}`}
                        >
                            {estatus}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setIsShowManualForm(true)}
                    className="w-full md:w-auto bg-brand-orange hover:bg-brand-magenta text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-brand-orange/20 flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> Nueva Factura
                </button>
            </div>

            {/* Modal de Nueva Factura */}
            {isShowManualForm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-4 bg-enterprise-950/60 backdrop-blur-md animate-premium-fade">
                    <div className="bg-white w-full max-w-lg rounded-2xl md:rounded-[3rem] p-6 md:p-12 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange"></div>

                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl md:text-2xl font-black text-enterprise-950 uppercase italic italic-brand tracking-tighter flex items-center gap-3">
                                <Plus className="text-brand-orange" /> Registrar Factura
                            </h2>
                            <button onClick={() => setIsShowManualForm(false)} className="p-3 hover:bg-enterprise-50 rounded-full transition-colors">
                                <X size={20} className="text-enterprise-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">Seleccionar Cliente</label>
                                <select
                                    value={formData.cliente_id_manual}
                                    onChange={e => setFormData({ ...formData, cliente_id_manual: e.target.value })}
                                    className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl font-bold text-sm outline-none focus:ring-1 focus:ring-brand-orange/20 appearance-none"
                                >
                                    <option value="">Elegir empresa...</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre_empresa}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">Folio Factura</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: F-1234"
                                        value={formData.numero_factura}
                                        onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
                                        className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl font-bold text-sm outline-none focus:ring-1 focus:ring-brand-orange/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">Monto Subtotal</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.monto_facturado}
                                        onChange={e => setFormData({ ...formData, monto_facturado: e.target.value })}
                                        className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl font-bold text-sm outline-none focus:ring-1 focus:ring-brand-orange/20 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">Fecha Programada Cobro</label>
                                <input
                                    type="date"
                                    value={formData.fecha_programada_cobro}
                                    onChange={e => setFormData({ ...formData, fecha_programada_cobro: e.target.value })}
                                    className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl font-bold text-sm outline-none focus:ring-1 focus:ring-brand-orange/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-1">Notas Internas</label>
                                <textarea
                                    placeholder="Detalles adicionales sobre el cobro..."
                                    value={formData.notas}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl font-bold text-sm outline-none focus:ring-1 focus:ring-brand-orange/20 min-h-[100px] resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setIsShowManualForm(false)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-enterprise-400 hover:bg-enterprise-50 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveManual}
                                    className="flex-[2] py-4 bg-enterprise-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-brand-orange transition-all shadow-xl shadow-enterprise-900/10"
                                >
                                    Guardar Registro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla de Registros (Estilo Reporte) */}
            <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-enterprise-100">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-enterprise-950 text-white font-black uppercase text-[8px] tracking-[0.2em]">
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5">Cliente / Origen</th>
                                <th className="px-6 py-5">Factura / Folio</th>
                                <th className="px-6 py-5 text-center">Fecha Pago</th>
                                <th className="px-6 py-5 text-right">Subtotal Neto</th>
                                <th className="px-6 py-5 text-center">Documentos</th>
                                <th className="px-6 py-5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-enterprise-50">
                            {filtrados.map((item) => {
                                const info = getEstatusInfo(item);
                                const isEditing = editingId === item.id;
                                const clienteNom = item.cotizaciones?.clientes?.nombre_empresa || item.clientes?.nombre_empresa || 'Cliente S/N';

                                return (
                                    <tr key={item.id} className={`hover:bg-enterprise-50/50 transition-colors ${isEditing ? 'bg-brand-orange/5' : ''}`}>
                                        <td className="px-6 py-5">
                                            {isEditing ? (
                                                <select
                                                    value={formData.estatus_pago}
                                                    onChange={e => setFormData({ ...formData, estatus_pago: e.target.value })}
                                                    className="w-full p-2 bg-white border border-brand-orange/20 rounded-lg text-[8px] font-black uppercase outline-none focus:ring-1 focus:ring-brand-orange/20"
                                                >
                                                    <option value="pendiente">Pendiente</option>
                                                    <option value="programado">Programado</option>
                                                    <option value="cobrado">Cobrado</option>
                                                </select>
                                            ) : (
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${info.color}`}>
                                                    {info.icon} {info.label}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-xs font-black text-enterprise-950 uppercase truncate max-w-[180px]">{clienteNom}</p>
                                            <p className="text-[9px] font-bold text-enterprise-400">Contrato: {item.cotizaciones?.numero_contrato || 'S/N'}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={formData.numero_factura}
                                                    placeholder="Factura"
                                                    onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
                                                    className="w-full p-2 bg-white border border-brand-orange/20 rounded-lg text-[10px] font-black outline-none focus:ring-1 focus:ring-brand-orange/20"
                                                />
                                            ) : (
                                                <>
                                                    <p className="text-[10px] font-black text-enterprise-950">{item.numero_factura || 'Por asignar'}</p>
                                                    <p className="text-[8px] font-bold text-brand-orange uppercase tracking-widest">{item.cotizaciones?.folio || 'Manual'}</p>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={formData.fecha_programada_cobro}
                                                    onChange={e => setFormData({ ...formData, fecha_programada_cobro: e.target.value })}
                                                    className="w-full p-2 bg-white border border-brand-orange/20 rounded-lg text-[10px] font-black outline-none focus:ring-1 focus:ring-brand-orange/20"
                                                />
                                            ) : (
                                                <p className="text-[10px] font-black text-enterprise-700">
                                                    {item.fecha_programada_cobro ? new Date(item.fecha_programada_cobro).toLocaleDateString('es-MX') : '--'}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <p className="text-sm font-black text-enterprise-950">{formatMXN(item.monto_facturado)}</p>
                                            <p className="text-[7px] font-bold text-enterprise-300 uppercase tracking-widest">Antes de IVA</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center gap-2">
                                                {item.url_archivo_pdf ? (
                                                    <a href={item.url_archivo_pdf} target="_blank" rel="noreferrer" className="p-2.5 bg-brand-orange/10 text-brand-orange rounded-xl hover:bg-brand-orange hover:text-white transition-all shadow-sm">
                                                        <FileText size={16} />
                                                    </a>
                                                ) : (
                                                    <label className={`p-2.5 bg-enterprise-50 text-enterprise-400 rounded-xl hover:bg-brand-orange/10 hover:text-brand-orange cursor-pointer transition-all border border-transparent hover:border-brand-orange/20 ${uploadingId === item.id ? 'animate-pulse' : ''}`}>
                                                        <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, item.id)} disabled={uploadingId === item.id} />
                                                        <Upload size={16} />
                                                    </label>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center gap-1">
                                                {!isEditing ? (
                                                    <button onClick={() => handleEdit(item)} className="p-2.5 text-enterprise-400 hover:text-enterprise-950 hover:bg-enterprise-100 rounded-xl transition-all">
                                                        <Edit3 size={16} />
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleSave(item.id)} className="p-2.5 text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                                                            <Save size={16} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="p-2.5 text-white bg-enterprise-400 hover:bg-enterprise-500 rounded-xl shadow-lg shadow-enterprise-400/20 transition-all">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile & Tablet Card View (Más robusto) */}
                <div className="lg:hidden divide-y divide-enterprise-50 bg-white">
                    {filtrados.map((item) => {
                        const info = getEstatusInfo(item);
                        const isEditing = editingId === item.id;
                        const clienteNom = item.cotizaciones?.clientes?.nombre_empresa || item.clientes?.nombre_empresa || 'Cliente S/N';

                        return (
                            <div key={item.id} className={`p-6 transition-colors ${isEditing ? 'bg-brand-orange/5' : ''}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col gap-1">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[7px] font-black uppercase w-fit shadow-sm ${info.color}`}>
                                            {info.icon} {info.label}
                                        </div>
                                        <h3 className="font-black text-enterprise-950 uppercase text-[12px] leading-tight mt-2">{clienteNom}</h3>
                                        <p className="text-[9px] font-bold text-enterprise-400 uppercase tracking-widest mt-1">
                                            {item.cotizaciones?.folio || 'Manual'} • Contrato: {item.cotizaciones?.numero_contrato || 'S/N'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-enterprise-950">{formatMXN(item.monto_facturado)}</p>
                                        <p className="text-[8px] font-bold text-enterprise-300 uppercase tracking-tighter">Subtotal</p>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-4 mt-6 p-6 bg-enterprise-50 rounded-2xl border border-brand-orange/20 shadow-xl">
                                        <div className="col-span-2">
                                            <label className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-2 block">Estatus</label>
                                            <select
                                                value={formData.estatus_pago}
                                                onChange={e => setFormData({ ...formData, estatus_pago: e.target.value })}
                                                className="w-full p-3 bg-white border border-enterprise-100 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-brand-orange/20"
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="programado">Programado</option>
                                                <option value="cobrado">Cobrado</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-2 block">Factura</label>
                                            <input
                                                type="text"
                                                value={formData.numero_factura}
                                                onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
                                                className="w-full p-3 bg-white border border-enterprise-100 rounded-xl text-[10px] font-black outline-none focus:ring-1 focus:ring-brand-orange/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-2 block">Fecha Programada</label>
                                            <input
                                                type="date"
                                                value={formData.fecha_programada_cobro}
                                                onChange={e => setFormData({ ...formData, fecha_programada_cobro: e.target.value })}
                                                className="w-full p-3 bg-white border border-enterprise-100 rounded-xl text-[10px] font-black outline-none focus:ring-1 focus:ring-brand-orange/20"
                                            />
                                        </div>
                                        <div className="col-span-2 flex gap-3 pt-3">
                                            <button onClick={() => handleSave(item.id)} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-500/20">Guardar</button>
                                            <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-enterprise-200 text-enterprise-600 rounded-xl text-[9px] font-black uppercase">Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-enterprise-50">
                                        <div className="flex gap-6">
                                            <div>
                                                <p className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest">Factura</p>
                                                <p className="text-[10px] font-black text-enterprise-950 uppercase">{item.numero_factura || '--'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest">Fecha Pago</p>
                                                <p className="text-[10px] font-black text-enterprise-950">
                                                    {item.fecha_programada_cobro ? new Date(item.fecha_programada_cobro).toLocaleDateString() : '--'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex gap-2">
                                                {item.url_archivo_pdf ? (
                                                    <a href={item.url_archivo_pdf} target="_blank" rel="noreferrer" className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl flex items-center gap-2 border border-brand-orange/10 transition-all hover:bg-brand-orange hover:text-white">
                                                        <FileText size={18} />
                                                        <span className="text-[9px] font-black uppercase">PDF</span>
                                                    </a>
                                                ) : (
                                                    <label className={`p-3 bg-enterprise-50 text-enterprise-400 rounded-xl hover:bg-brand-orange/10 hover:text-brand-orange transition-all cursor-pointer flex items-center gap-2 border border-enterprise-100 hover:border-brand-orange/20 ${uploadingId === item.id ? 'animate-pulse' : ''}`}>
                                                        <input
                                                            type="file"
                                                            accept=".pdf"
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, item.id)}
                                                            disabled={uploadingId === item.id}
                                                        />
                                                        <Upload size={18} />
                                                        <span className="text-[9px] font-black uppercase">Subir</span>
                                                    </label>
                                                )}
                                            </div>
                                            <button onClick={() => handleEdit(item)} className="p-3 text-enterprise-400 bg-enterprise-50 hover:bg-enterprise-950 hover:text-white rounded-xl transition-all border border-enterprise-100 hover:border-enterprise-950">
                                                <Edit3 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filtrados.length === 0 && (
                    <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border-2 border-dashed border-enterprise-100">
                        <DollarSign className="mx-auto text-enterprise-100 mb-6" size={80} />
                        <h4 className="text-xl font-black text-enterprise-200 uppercase tracking-[0.4em]">No hay facturas pendientes</h4>
                        <p className="text-[10px] font-bold text-enterprise-400 uppercase tracking-widest mt-4">{filtroEstatus === 'todos' ? 'Las ventas ganadas aparecerán aquí automáticamente' : `No hay registros con estatus ${filtroEstatus}`}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CobranzaView;
