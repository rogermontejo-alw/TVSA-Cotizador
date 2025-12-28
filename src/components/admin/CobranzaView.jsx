import React, { useState } from 'react';
import {
    DollarSign, Search, Calendar, FileText, CheckCircle2,
    Clock, AlertCircle, Building2, Upload, Eye, Printer,
    ChevronRight, MoreVertical, Edit3, Save, X
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';

const CobranzaView = ({ cobranza = [], onSave, setMensaje }) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('todos');
    const [editingId, setEditingId] = useState(null);
    const [uploadingId, setUploadingId] = useState(null);
    const [formData, setFormData] = useState({
        numero_factura: '',
        fecha_programada_cobro: '',
        estatus_pago: '',
        notas: ''
    });

    const filtrados = (cobranza || []).filter(c => {
        const clienteNom = c.cotizaciones?.clientes?.nombre_empresa || '';
        const matchesBusqueda =
            c.cotizaciones?.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
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
        <div className="space-y-8 pb-24 animate-in fade-in duration-700 max-w-7xl mx-auto">
            {/* Header Stats Premium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={60} />
                    </div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Cartera Total</p>
                    <h4 className="text-2xl font-black text-slate-900">{formatMXN(stats.total)}</h4>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 border-l-4 border-l-emerald-500 relative overflow-hidden group">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Recuperado (Cobrado)</p>
                    <h4 className="text-2xl font-black text-emerald-600">{formatMXN(stats.cobrado)}</h4>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 border-l-4 border-l-red-500 relative overflow-hidden group">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em] mb-1">Vencido / Alerta</p>
                    <h4 className="text-2xl font-black text-red-600">{formatMXN(stats.vencido)}</h4>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative group w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, factura o folio..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl font-bold text-xs shadow-xl shadow-slate-200/50 outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-gray-300"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                    {['todos', 'pendiente', 'programado', 'cobrado'].map(estatus => (
                        <button
                            key={estatus}
                            onClick={() => setFiltroEstatus(estatus)}
                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all
                                ${filtroEstatus === estatus
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'bg-white text-gray-400 hover:text-slate-900 border border-gray-100'}`}
                        >
                            {estatus}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de Tickets de Cobranza */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filtrados.map((item) => {
                    const info = getEstatusInfo(item);
                    const isEditing = editingId === item.id;

                    return (
                        <div key={item.id} className={`bg-white rounded-[2.5rem] shadow-xl border transition-all overflow-hidden ${isEditing ? 'ring-2 ring-red-500 border-red-100' : 'border-gray-100 hover:border-red-100'}`}>
                            <div className="p-8">
                                {/* Header del Ticket */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-2 shadow-sm ${info.color}`}>
                                        {info.icon} {info.label}
                                    </div>
                                    <div className="flex gap-2">
                                        {!isEditing ? (
                                            <button onClick={() => handleEdit(item)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                                                <Edit3 size={18} />
                                            </button>
                                        ) : (
                                            <button onClick={() => setEditingId(null)} className="p-2 hover:bg-slate-50 rounded-xl text-red-500 transition-colors">
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                        <Building2 size={28} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-black text-slate-900 truncate tracking-tighter uppercase">
                                            {item.cotizaciones?.clientes?.nombre_empresa || 'Cliente S/N'}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{item.cotizaciones?.folio}</span>
                                            <span className="text-slate-200">|</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato: {item.cotizaciones?.numero_contrato || 'S/N'}</span>
                                        </div>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Folio Factura</label>
                                            <input
                                                type="text"
                                                value={formData.numero_factura}
                                                onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
                                                className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-red-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Compromiso Pago</label>
                                            <input
                                                type="date"
                                                value={formData.fecha_programada_cobro}
                                                onChange={e => setFormData({ ...formData, fecha_programada_cobro: e.target.value })}
                                                className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-red-500 transition-all"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Estatus del Pago</label>
                                            <select
                                                value={formData.estatus_pago}
                                                onChange={e => setFormData({ ...formData, estatus_pago: e.target.value })}
                                                className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-red-500 transition-all appearance-none"
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="programado">Programado</option>
                                                <option value="cobrado">Cobrado / Pagado</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => handleSave(item.id)}
                                            className="col-span-2 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-red-600 transition-all"
                                        >
                                            <Save size={14} /> Actualizar Información
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Factura</span>
                                                <span className="text-sm font-black text-slate-800">{item.numero_factura || 'Por asignar'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto Neto</span>
                                                <span className="text-xl font-black text-slate-900">{formatMXN(item.monto_facturado)}</span>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-32 flex flex-col gap-2">
                                            {item.url_archivo_pdf ? (
                                                <>
                                                    <a
                                                        href={item.url_archivo_pdf}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-2xl py-3 hover:bg-red-100 transition-all"
                                                    >
                                                        <Eye size={16} /> <span className="text-[10px] font-black uppercase">Ver</span>
                                                    </a>
                                                    <button
                                                        onClick={() => window.print()}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-50 text-slate-400 rounded-2xl py-3 hover:bg-slate-100 transition-all border border-slate-100"
                                                    >
                                                        <Printer size={16} /> <span className="text-[10px] font-black uppercase tracking-tighter">Imprimir</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <label className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl hover:border-red-400 hover:bg-red-50 cursor-pointer transition-all p-4 ${uploadingId === item.id ? 'opacity-50 animate-pulse' : ''}`}>
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        className="hidden"
                                                        onChange={(e) => handleFileUpload(e, item.id)}
                                                        disabled={uploadingId === item.id}
                                                    />
                                                    <Upload size={20} className="text-slate-300 mb-1" />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase text-center">Subir Factura</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

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
