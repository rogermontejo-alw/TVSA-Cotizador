import React, { useState, useMemo } from 'react';
import {
    Briefcase, Plus, Search, Calendar, DollarSign,
    ArrowRight, CheckCircle2, Clock, AlertCircle,
    ChevronRight, Filter, Building2, BarChart3, FileText, Calculator
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const MasterContractsView = ({
    masterContracts = [],
    cotizaciones = [],
    clientes = [],
    onSaveMC,
    onSaveQuote,
    setMensaje
}) => {
    const [activeTab, setActiveTab] = useState('mcs'); // 'mcs' o 'individuales'
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('todos');
    const [isCreating, setIsCreating] = useState(false);
    const [selectedMC, setSelectedMC] = useState(null);

    // Estado para nuevo/editar MC
    const [formData, setFormData] = useState({
        numero_mc: '',
        cliente_id: '',
        monto_aprobado: '',
        fecha_inicio: '',
        fecha_fin: '',
        notas: '',
        estatus: 'activo'
    });

    // Enriquecer MCs con datos de consumo
    const enrichedMCs = useMemo(() => {
        return (masterContracts || []).map(mc => {
            const cliente = clientes.find(c => String(c.id) === String(mc.cliente_id));
            const mcCotizaciones = cotizaciones.filter(q =>
                String(q.mc_id) === String(mc.id) && q.estatus === 'ganada'
            );

            const montoConsumido = mcCotizaciones.reduce((sum, q) =>
                sum + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0
            );

            const montoRegistrado = mcCotizaciones
                .filter(q => q.fecha_registro_sistema)
                .reduce((sum, q) => sum + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);

            return {
                ...mc,
                cliente,
                cotizaciones: mcCotizaciones,
                montoConsumido,
                montoRegistrado,
                saldoDisponible: parseFloat(mc.monto_aprobado) - montoConsumido,
                saldoTecnico: parseFloat(mc.monto_aprobado) - montoRegistrado,
                porcentajeConsumo: (montoConsumido / parseFloat(mc.monto_aprobado)) * 100,
                porcentajeRegistro: (montoRegistrado / parseFloat(mc.monto_aprobado)) * 100
            };
        });
    }, [masterContracts, cotizaciones, clientes]);

    const filtrados = enrichedMCs.filter(mc => {
        const matchesBusqueda =
            mc.numero_mc?.toLowerCase().includes(busqueda.toLowerCase()) ||
            mc.cliente?.nombre_empresa?.toLowerCase().includes(busqueda.toLowerCase());

        const matchesEstatus = filtroEstatus === 'todos' || mc.estatus === filtroEstatus;

        return matchesBusqueda && matchesEstatus;
    });

    const handleSave = async (e) => {
        e.preventDefault();
        const success = await onSaveMC('master_contracts', formData);
        if (success) {
            setMensaje({ tipo: 'exito', texto: 'Master Contract guardado correctamente' });
            setIsCreating(false);
            setFormData({
                numero_mc: '',
                cliente_id: '',
                monto_aprobado: '',
                fecha_inicio: '',
                fecha_fin: '',
                notas: '',
                estatus: 'activo'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-[2rem] shadow-xl p-6 mb-6 border-b-4 border-slate-900">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Menú de Contratos</h1>
                                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.3em] mt-0.5 italic">Gestión de Bolsas y Emisiones de Sistema</p>
                            </div>
                        </div>

                        {activeTab === 'mcs' && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="bg-red-600 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center gap-2"
                            >
                                <Plus size={16} /> Nuevo Contrato Maestro
                            </button>
                        )}
                    </div>
                </div>

                {/* Selector de Pestañas */}
                <div className="flex gap-4 mb-8 bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100 max-w-md mx-auto">
                    <button
                        onClick={() => setActiveTab('mcs')}
                        className={`flex-1 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'mcs' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        Master Contracts
                    </button>
                    <button
                        onClick={() => setActiveTab('individuales')}
                        className={`flex-1 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'individuales' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        Emisiones (CPs)
                    </button>
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder={activeTab === 'mcs' ? "Buscar por cliente o folio MC..." : "Buscar contrato, cliente o folio sistema..."}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl font-bold text-xs shadow-xl shadow-slate-100 outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-gray-300"
                        />
                    </div>
                    {activeTab === 'mcs' && (
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 whitespace-nowrap">
                            {['todos', 'activo', 'agotado', 'vencido'].map(estatus => (
                                <button
                                    key={estatus}
                                    onClick={() => setFiltroEstatus(estatus)}
                                    className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all
                                        ${filtroEstatus === estatus
                                            ? 'bg-slate-900 text-white shadow-lg'
                                            : 'bg-white text-gray-400 hover:text-slate-900 shadow-sm border border-gray-100'}`}
                                >
                                    {estatus}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {activeTab === 'mcs' ? (
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden mb-10">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest">
                                        <th className="px-8 py-4">Cliente / MC</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4">Bolsa Aprobada</th>
                                        <th className="px-8 py-4">Consumo</th>
                                        <th className="px-8 py-4">Saldo Disponible</th>
                                        <th className="px-8 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtrados.map(mc => (
                                        <tr
                                            key={mc.id}
                                            onClick={() => setSelectedMC(mc)}
                                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{mc.cliente?.nombre_empresa || 'S/N'}</p>
                                                        <p className="text-[9px] font-bold text-red-600 tracking-widest uppercase">MC: {mc.numero_mc}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest
                                                        ${mc.estatus === 'activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${mc.estatus === 'activo' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                                                    {mc.estatus}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 font-black text-slate-900 text-sm">
                                                {formatMXN(mc.monto_aprobado)}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-tight">
                                                        <span>{mc.porcentajeConsumo.toFixed(1)}%</span>
                                                        <span>{formatMXN(mc.montoConsumido)}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${mc.porcentajeConsumo > 90 ? 'bg-red-500' : mc.porcentajeConsumo > 70 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${Math.min(mc.porcentajeConsumo, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className={`text-sm font-black ${mc.saldoDisponible < (mc.monto_aprobado * 0.1) ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {formatMXN(mc.saldoDisponible)}
                                                </div>
                                                <p className="text-[8px] font-bold text-slate-300 uppercase italic">Libre para pauta</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <button className="p-2 bg-slate-50 group-hover:bg-red-600 group-hover:text-white rounded-xl transition-all shadow-sm">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filtrados.map(mc => (
                                <div
                                    key={mc.id}
                                    onClick={() => setSelectedMC(mc)}
                                    className="p-6 space-y-4 hover:bg-slate-50 transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                                                <Building2 size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{mc.cliente?.nombre_empresa}</p>
                                                <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest">{mc.numero_mc}</span>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${mc.estatus === 'activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {mc.estatus}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Aprobado</p>
                                            <p className="text-xs font-black text-slate-900">{formatMXN(mc.monto_aprobado)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Disponible</p>
                                            <p className="text-xs font-black text-emerald-600">{formatMXN(mc.saldoDisponible)}</p>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${mc.porcentajeConsumo > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(mc.porcentajeConsumo, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filtrados.length === 0 && (
                            <div className="py-20 text-center">
                                <Briefcase size={40} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No hay Master Contracts registrados</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden mb-10">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest">
                                        <th className="px-8 py-4">F. Venta</th>
                                        <th className="px-8 py-4">Cliente / Contrato</th>
                                        <th className="px-8 py-4">Importe Neto</th>
                                        <th className="px-8 py-4">F. Sistema (Registro)</th>
                                        <th className="px-8 py-4">Folio Sistema (CP)</th>
                                        <th className="px-8 py-4 text-center">Estado Adm.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(cotizaciones || []).filter(q => q.estatus === 'ganada').filter(q => {
                                        const search = busqueda.toLowerCase();
                                        return (
                                            q.cliente?.nombre_empresa?.toLowerCase().includes(search) ||
                                            q.numero_contrato?.toString().includes(search) ||
                                            q.folio_sistema?.toLowerCase().includes(search)
                                        );
                                    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(q => (
                                        <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="text-[10px] font-black text-slate-900 uppercase">
                                                    {new Date(q.fecha_cierre_real || q.fecha).toLocaleDateString('es-MX')}
                                                </p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Folio: {q.folio}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{q.cliente?.nombre_empresa}</p>
                                                <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest">CTR: {q.numero_contrato}</span>
                                            </td>
                                            <td className="px-8 py-5 font-black text-slate-900 text-sm">
                                                {formatMXN(q.subtotalGeneral || q.total / 1.16)}
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="date"
                                                    value={q.fecha_registro_sistema || ''}
                                                    onChange={async (e) => {
                                                        const success = await onSaveQuote('cotizaciones', { id: q.id, fecha_registro_sistema: e.target.value });
                                                        if (success) setMensaje({ tipo: 'exito', texto: 'Fecha de sistema actualizada' });
                                                    }}
                                                    className="p-2 bg-slate-100 rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-red-500 outline-none w-full max-w-[130px]"
                                                />
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="text"
                                                    placeholder="Ej: CP-12345"
                                                    defaultValue={q.folio_sistema || ''}
                                                    onBlur={async (e) => {
                                                        if (e.target.value !== q.folio_sistema) {
                                                            const success = await onSaveQuote('cotizaciones', { id: q.id, folio_sistema: e.target.value });
                                                            if (success) setMensaje({ tipo: 'exito', texto: 'Folio de sistema actualizado' });
                                                        }
                                                    }}
                                                    className="p-2 bg-slate-100 rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-red-500 outline-none w-full"
                                                />
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                {q.fecha_registro_sistema ? (
                                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-200">
                                                        Registrado
                                                    </span>
                                                ) : (
                                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-200">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modales */}
            {isCreating && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>

                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <Plus className="text-red-600" /> Crear Master Contract
                        </h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Seleccionar Cliente</label>
                                    <select
                                        required
                                        value={formData.cliente_id}
                                        onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                                    >
                                        <option value="">Elegir empresa...</option>
                                        {clientes.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre_empresa}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Folio MC</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: MC-2024-001"
                                        value={formData.numero_mc}
                                        onChange={(e) => setFormData({ ...formData, numero_mc: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Inversión Aprobada</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="$0.00"
                                        value={formData.monto_aprobado}
                                        onChange={(e) => setFormData({ ...formData, monto_aprobado: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Inicio Periodo</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha_inicio}
                                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fin Periodo</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha_fin}
                                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 transition-all shadow-xl shadow-slate-200"
                                >
                                    Guardar Contrato
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedMC && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                        <button
                            onClick={() => setSelectedMC(null)}
                            className="absolute right-8 top-8 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all z-10"
                        >
                            <ArrowRight className="rotate-180" size={20} />
                        </button>

                        <div className="p-12 pb-6 flex items-center gap-6 border-b border-slate-50">
                            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200">
                                <Briefcase size={36} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{selectedMC.cliente?.nombre_empresa}</h2>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">Master Contract: {selectedMC.numero_mc}</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                        {new Date(selectedMC.fecha_inicio).toLocaleDateString()} - {new Date(selectedMC.fecha_fin).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                <div className="bg-slate-50 p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Bolsa Autorizada</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatMXN(selectedMC.monto_aprobado)}</p>
                                    <p className="text-[8px] font-bold text-slate-300 mt-2 uppercase">Presupuesto inicial del contrato</p>
                                </div>
                                <div className="bg-red-50/50 p-7 rounded-[2.5rem] border border-red-100/50 shadow-sm">
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3">Total Devengado (Comercial)</p>
                                    <p className="text-2xl font-black text-red-600 tracking-tighter">{formatMXN(selectedMC.montoConsumido)}</p>
                                    <p className="text-[8px] font-bold text-red-300 mt-2 uppercase">Ventas ganadas en cotizador</p>
                                </div>
                                <div className="bg-blue-50/50 p-7 rounded-[2.5rem] border border-blue-100/50 shadow-sm">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Total Registrado (Sistema)</p>
                                    <p className="text-2xl font-black text-blue-600 tracking-tighter">{formatMXN(selectedMC.montoRegistrado)}</p>
                                    <p className="text-[8px] font-bold text-blue-300 mt-2 uppercase">Contratos con folio CP</p>
                                </div>
                                <div className="bg-emerald-500 p-7 rounded-[2.5rem] shadow-xl shadow-emerald-100 text-white relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                                        <DollarSign size={100} />
                                    </div>
                                    <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-3 relative z-10">Saldo Disponible (Técnico)</p>
                                    <p className="text-2xl font-black text-white tracking-tighter relative z-10">{formatMXN(selectedMC.saldoTecnico)}</p>
                                    <p className="text-[8px] font-bold text-emerald-100 mt-2 uppercase relative z-10">
                                        {selectedMC.montoRegistrado > 0 ? `${selectedMC.porcentajeRegistro.toFixed(1)}% formalizado` : 'Bolsa técnica al 100%'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm"><AlertCircle size={16} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diferencia por Registrar</p>
                                        <p className="text-xs font-black text-slate-900">{formatMXN(selectedMC.montoConsumido - selectedMC.montoRegistrado)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Comercial Libre</p>
                                    <p className="text-xs font-black text-red-600">{formatMXN(selectedMC.saldoDisponible)}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-3">
                                    <FileText size={16} className="text-red-600" /> Historial de Implementación
                                </h4>
                                <div className="h-px flex-1 bg-slate-100 mx-6"></div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                    {selectedMC.cotizaciones?.length || 0} Cotizaciones
                                </span>
                            </div>

                            <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-2">
                                {selectedMC.cotizaciones?.length > 0 ? (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <th className="px-6 py-4">Folio / Contrato</th>
                                                <th className="px-6 py-4">Fecha Cierre</th>
                                                <th className="px-6 py-4">Registro Sistema</th>
                                                <th className="px-6 py-4 text-right">Monto Netificado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white">
                                            {selectedMC.cotizaciones.map(cotz => (
                                                <tr key={cotz.id} className="hover:bg-white transition-colors group">
                                                    <td className="px-6 py-5 rounded-l-3xl">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-50">
                                                                <CheckCircle2 size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-900 uppercase">CTR-{cotz.numero_contrato || 'S/N'}</p>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Folio: {cotz.folio}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-bold text-slate-600">
                                                        {new Date(cotz.fecha_cierre_real || cotz.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {cotz.fecha_registro_sistema ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-emerald-600">#{cotz.folio_sistema}</span>
                                                                <span className="text-[8px] font-bold text-slate-400">{new Date(cotz.fecha_registro_sistema).toLocaleDateString()}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Pendiente</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-right rounded-r-3xl">
                                                        <p className="text-sm font-black text-slate-900">{formatMXN(cotz.subtotalGeneral || cotz.total / 1.16)}</p>
                                                        <p className="text-[8px] font-bold text-emerald-600 uppercase italic">Impacto directo</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-50 shadow-sm">
                                            <Calculator size={24} className="text-slate-200" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sin cargos registrados en este periodo</p>
                                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-2">El saldo total está disponible para nuevas pautas</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedMC(null)}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all"
                            >
                                Cerrar Detalle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterContractsView;
