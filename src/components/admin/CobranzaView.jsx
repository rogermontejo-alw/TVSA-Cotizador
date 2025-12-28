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
            return { label: 'Vencido', color: 'bg-red-50 text-red-600', icon: <AlertCircle size={12} /> };
        }
        if (reg.estatus_pago === 'programado') {
            return { label: 'Programado', color: 'bg-blue-50 text-blue-600', icon: <Calendar size={12} /> };
        }
        return { label: 'Pendiente', color: 'bg-slate-50 text-slate-400', icon: <Clock size={12} /> };
    };

    return (
        <div className="space-y-4 md:space-y-6 pb-24 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 md:px-0 overflow-hidden">
            {/* Header Cobranza */}
            <div className="bg-slate-900 p-4 rounded-2xl md:rounded-b-none flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-red-500" />
                    <h3 className="text-sm font-black text-white uppercase flex items-center gap-3">
                        Gestión de Cobranza
                    </h3>
                </div>
            </div>
            {/* Header Stats Compact (Estilo Reporte) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                <div className="bg-white px-3 md:px-6 py-3 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">Cartera Individual</p>
                    <div className="flex items-baseline gap-1 md:gap-2">
                        <h4 className="text-sm md:text-xl font-black text-slate-900">{formatMXN(stats.total)}</h4>
                        <span className="text-[6px] md:text-[7px] font-bold text-gray-300 uppercase tracking-tighter">Subt.</span>
                    </div>
                </div>

                <div className="bg-white px-3 md:px-6 py-3 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500">
                    <p className="text-[7px] md:text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-0.5 md:mb-1">Recuperado</p>
                    <h4 className="text-sm md:text-xl font-black text-emerald-600">{formatMXN(stats.cobrado)}</h4>
                </div>

                <div className="bg-white px-3 md:px-6 py-3 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
                    <p className="text-[7px] md:text-[8px] font-black text-red-600 uppercase tracking-widest mb-0.5 md:mb-1">Vencido</p>
                    <h4 className="text-sm md:text-xl font-black text-red-600">{formatMXN(stats.vencido)}</h4>
                </div>

                <div className="bg-slate-900 px-3 md:px-6 py-3 rounded-xl md:rounded-2xl shadow-xl flex items-center justify-between group">
                    <div>
                        <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">Facturas</p>
                        <h4 className="text-sm md:text-xl font-black text-white">{filtrados.length}</h4>
                    </div>
                    <DollarSign size={16} className="text-red-600 opacity-50 block md:hidden" />
                    <DollarSign size={24} className="text-red-600 opacity-50 hidden md:block group-hover:scale-110 transition-transform" />
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-[10px] shadow-sm outline-none focus:ring-1 focus:ring-red-500 transition-all placeholder:text-gray-300"
                    />
                </div>

                <div className="flex bg-slate-900 rounded-xl p-1 w-fit">
                    {['todos', 'pendiente', 'programado', 'cobrado'].map(estatus => (
                        <button
                            key={estatus}
                            onClick={() => setFiltroEstatus(estatus)}
                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all
                                ${filtroEstatus === estatus
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {estatus}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setIsShowManualForm(true)}
                    className="w-full md:w-auto bg-red-600 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> Nueva Factura
                </button>
            </div>

            {/* Modal de Nueva Factura */}
            {isShowManualForm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-2xl md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>

                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 md:gap-3">
                                <Plus className="text-red-600" size={20} /> Registrar Factura
                            </h2>
                            <button onClick={() => setIsShowManualForm(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                                <select
                                    value={formData.cliente_id_manual}
                                    onChange={e => setFormData({ ...formData, cliente_id_manual: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                                >
                                    <option value="">Seleccionar Cliente...</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre_empresa}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Folio Factura</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: F-1234"
                                        value={formData.numero_factura}
                                        onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtotal (Importe)</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.monto_facturado}
                                        onChange={e => setFormData({ ...formData, monto_facturado: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Programada de Pago</label>
                                <input
                                    type="date"
                                    value={formData.fecha_programada_cobro}
                                    onChange={e => setFormData({ ...formData, fecha_programada_cobro: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones</label>
                                <textarea
                                    placeholder="Nota adicional..."
                                    value={formData.notas}
                                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setIsShowManualForm(false)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveManual}
                                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-xl"
                                >
                                    Guardar Factura
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla de Registros (Estilo Reporte) */}
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-900 text-white font-black uppercase text-[8px] tracking-[0.2em]">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Cliente / Origen</th>
                                <th className="px-6 py-4">Factura / Folio</th>
                                <th className="px-6 py-4 text-center">Fecha Pago</th>
                                <th className="px-6 py-4 text-right">Subtotal Neto</th>
                                <th className="px-6 py-4 text-center">Files</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtrados.map((item) => {
                                const info = getEstatusInfo(item);
                                const isEditing = editingId === item.id;
                                const clienteNom = item.cotizaciones?.clientes?.nombre_empresa || item.clientes?.nombre_empresa || 'Cliente S/N';

                                return (
                                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isEditing ? 'bg-red-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            {isEditing ? (
                                                <select
                                                    value={formData.estatus_pago}
                                                    onChange={e => setFormData({ ...formData, estatus_pago: e.target.value })}
                                                    className="w-full p-2 bg-white border border-red-200 rounded-lg text-[8px] font-black uppercase outline-none focus:ring-1 focus:ring-red-500"
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
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-slate-800 uppercase truncate max-w-[180px]">{clienteNom}</p>
                                            <p className="text-[9px] font-bold text-slate-400">Contrato: {item.cotizaciones?.numero_contrato || 'S/N'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={formData.numero_factura}
                                                    placeholder="Factura"
                                                    onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
                                                    className="w-full p-2 bg-white border border-red-200 rounded-lg text-[10px] font-black outline-none focus:ring-1 focus:ring-red-500"
                                                />
                                            ) : (
                                                <>
                                                    <p className="text-[10px] font-black text-slate-900">{item.numero_factura || 'Por asignar'}</p>
                                                    <p className="text-[8px] font-bold text-red-600 uppercase tracking-widest">{item.cotizaciones?.folio || 'Manual'}</p>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={formData.fecha_programada_cobro}
                                                    onChange={e => setFormData({ ...formData, fecha_programada_cobro: e.target.value })}
                                                    className="w-full p-2 bg-white border border-red-200 rounded-lg text-[10px] font-black outline-none focus:ring-1 focus:ring-red-500"
                                                />
                                            ) : (
                                                <p className="text-[10px] font-black text-slate-600">
                                                    {item.fecha_programada_cobro ? new Date(item.fecha_programada_cobro).toLocaleDateString('es-MX') : '--'}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-black text-slate-900">{formatMXN(item.monto_facturado)}</p>
                                            <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">Antes de IVA</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                {item.url_archivo_pdf ? (
                                                    <a href={item.url_archivo_pdf} target="_blank" rel="noreferrer" className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all">
                                                        <FileText size={14} />
                                                    </a>
                                                ) : (
                                                    <label className={`p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 cursor-pointer transition-all ${uploadingId === item.id ? 'animate-pulse' : ''}`}>
                                                        <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, item.id)} disabled={uploadingId === item.id} />
                                                        <Upload size={14} />
                                                    </label>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-1">
                                                {!isEditing ? (
                                                    <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                                                        <Edit3 size={14} />
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleSave(item.id)} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm">
                                                            <Save size={14} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="p-2 text-white bg-slate-400 hover:bg-slate-500 rounded-lg shadow-sm">
                                                            <X size={14} />
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
                <div className="lg:hidden divide-y divide-gray-50 bg-white">
                    {filtrados.map((item) => {
                        const info = getEstatusInfo(item);
                        const isEditing = editingId === item.id;
                        const clienteNom = item.cotizaciones?.clientes?.nombre_empresa || item.clientes?.nombre_empresa || 'Cliente S/N';

                        return (
                            <div key={item.id} className={`p-5 transition-colors ${isEditing ? 'bg-red-50/50' : ''}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col gap-1">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[7px] font-black uppercase w-fit ${info.color}`}>
                                            {info.icon} {info.label}
                                        </div>
                                        <h3 className="font-black text-slate-900 uppercase text-[11px] leading-tight mt-1">{clienteNom}</h3>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                            {item.cotizaciones?.folio || 'Manual'} • Contrato: {item.cotizaciones?.numero_contrato || 'S/N'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-900">{formatMXN(item.monto_facturado)}</p>
                                        <p className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">Subtotal</p>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-3 mt-4 p-4 bg-white rounded-xl shadow-sm border border-red-100">
                                        <div className="col-span-2">
                                            <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Estatus</label>
                                            <select
                                                value={formData.estatus_pago}
                                                onChange={e => setFormData({ ...formData, estatus_pago: e.target.value })}
                                                className="w-full p-2 bg-slate-50 border-none rounded-lg text-[9px] font-black uppercase outline-none"
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="programado">Programado</option>
                                                <option value="cobrado">Cobrado</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Factura</label>
                                            <input
                                                type="text"
                                                value={formData.numero_factura}
                                                onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
                                                className="w-full p-2 bg-slate-50 border-none rounded-lg text-[9px] font-black outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Fecha</label>
                                            <input
                                                type="date"
                                                value={formData.fecha_programada_cobro}
                                                onChange={e => setFormData({ ...formData, fecha_programada_cobro: e.target.value })}
                                                className="w-full p-2 bg-slate-50 border-none rounded-lg text-[9px] font-black outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2 flex gap-2 pt-2">
                                            <button onClick={() => handleSave(item.id)} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase">Guardar</button>
                                            <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase">Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between mt-4 py-2 border-t border-gray-50">
                                        <div className="flex gap-4">
                                            <div>
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Factura</p>
                                                <p className="text-[9px] font-bold text-slate-800 uppercase">{item.numero_factura || '--'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Fecha Pago</p>
                                                <p className="text-[9px] font-bold text-slate-800">
                                                    {item.fecha_programada_cobro ? new Date(item.fecha_programada_cobro).toLocaleDateString() : '--'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex gap-1">
                                                {item.url_archivo_pdf ? (
                                                    <a href={item.url_archivo_pdf} target="_blank" rel="noreferrer" className="p-2.5 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                                                        <FileText size={16} />
                                                        <span className="text-[8px] font-black uppercase">PDF</span>
                                                    </a>
                                                ) : (
                                                    <label className={`p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-600 hover:text-white transition-all cursor-pointer flex items-center gap-2 ${uploadingId === item.id ? 'animate-pulse' : ''}`}>
                                                        <input
                                                            type="file"
                                                            accept=".pdf"
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, item.id)}
                                                            disabled={uploadingId === item.id}
                                                        />
                                                        <Upload size={16} />
                                                        <span className="text-[8px] font-black uppercase">Subir</span>
                                                    </label>
                                                )}
                                            </div>
                                            <button onClick={() => handleEdit(item)} className="p-2.5 text-slate-400 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl transition-all">
                                                <Edit3 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filtrados.length === 0 && (
                    <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100">
                        <DollarSign className="mx-auto text-gray-100 mb-6" size={80} />
                        <h4 className="text-xl font-black text-slate-300 uppercase tracking-[0.4em]">No hay facturas pendientes</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{filtroEstatus === 'todos' ? 'Las ventas ganadas aparecerán aquí automáticamente' : `No hay registros con estatus ${filtroEstatus}`}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CobranzaView;
