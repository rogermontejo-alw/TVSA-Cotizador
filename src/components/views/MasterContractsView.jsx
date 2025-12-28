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
    cobranza = [],
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

            const mcBills = (cobranza || []).filter(c =>
                c.cotizaciones?.mc_id && String(c.cotizaciones.mc_id) === String(mc.id)
            );

            const montoCobrado = mcBills
                .filter(c => c.estatus_pago === 'cobrado')
                .reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);

            return {
                ...mc,
                cliente,
                cotizaciones: mcCotizaciones,
                bills: mcBills,
                montoConsumido,
                montoRegistrado,
                montoCobrado,
                saldoDisponible: parseFloat(mc.monto_aprobado) - montoConsumido,
                saldoTecnico: parseFloat(mc.monto_aprobado) - montoRegistrado,
                porcentajeConsumo: (montoConsumido / parseFloat(mc.monto_aprobado)) * 100,
                porcentajeRegistro: (montoRegistrado / parseFloat(mc.monto_aprobado)) * 100
            };
        });
    }, [masterContracts, cotizaciones, clientes]);

    // Estadísticas Globales de Contratos
    const globalStats = useMemo(() => {
        const totalAprobado = enrichedMCs.reduce((sum, mc) => sum + (parseFloat(mc.monto_aprobado) || 0), 0);
        const totalConsumido = enrichedMCs.reduce((sum, mc) => sum + (mc.montoConsumido || 0), 0);
        const totalRegistrado = enrichedMCs.reduce((sum, mc) => sum + (mc.montoRegistrado || 0), 0);

        // Integración de Cobranza vinculada a estos contratos
        const mcIds = enrichedMCs.map(mc => mc.id);
        const contractBills = cobranza.filter(c =>
            c.cotizaciones?.mc_id && mcIds.includes(c.cotizaciones.mc_id)
        );
        const montoCobrado = contractBills
            .filter(c => c.estatus_pago === 'cobrado')
            .reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);

        return { totalAprobado, totalConsumido, totalRegistrado, montoCobrado };
    }, [enrichedMCs, cobranza]);

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
        <div className="min-h-screen bg-enterprise-50 pb-20 animate-premium-fade">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-enterprise-950 p-4 rounded-2xl md:rounded-b-none flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange opacity-5 blur-3xl -mr-32 -mt-32" />
                    <div className="flex items-center gap-3 relative z-10">
                        <Briefcase size={20} className="text-brand-orange" />
                        <h3 className="text-sm font-black text-white uppercase italic italic-brand">
                            Consolidado de Contratos Maestro
                        </h3>
                    </div>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="relative z-10 w-full md:w-auto px-4 py-1.5 bg-brand-orange text-white rounded-lg font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-brand-magenta transition-all shadow-lg active:scale-95"
                    >
                        <Plus size={14} /> Nuevo Registro Maestro
                    </button>
                </div>

                {/* Stats Superiores Compactos */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6">
                    <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-enterprise-100">
                        <p className="text-[7px] md:text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-1">Bolsa Global</p>
                        <h4 className="text-sm md:text-lg font-black text-enterprise-950">{formatMXN(globalStats.totalAprobado)}</h4>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-enterprise-100 border-l-4 border-l-brand-orange">
                        <p className="text-[7px] md:text-[8px] font-black text-brand-orange uppercase tracking-widest mb-1">Consumo Comercial</p>
                        <h4 className="text-sm md:text-lg font-black text-brand-orange">{formatMXN(globalStats.totalConsumido)}</h4>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-enterprise-100 border-l-4 border-l-blue-500">
                        <p className="text-[7px] md:text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Formalizado (Sist.)</p>
                        <h4 className="text-sm md:text-lg font-black text-blue-600">{formatMXN(globalStats.totalRegistrado)}</h4>
                    </div>
                    <div className="bg-enterprise-950 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl">
                        <p className="text-[7px] md:text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-1">Recuperado (Cobro)</p>
                        <h4 className="text-sm md:text-lg font-black text-emerald-400">{formatMXN(globalStats.montoCobrado)}</h4>
                    </div>
                </div>

                {/* Selector de Pestañas */}
                <div className="flex bg-enterprise-100 p-1 rounded-xl shadow-sm border border-enterprise-200 max-w-sm mx-auto mb-8">
                    <button
                        onClick={() => setActiveTab('mcs')}
                        className={`flex-1 py-1.5 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'mcs' ? 'bg-enterprise-950 text-white shadow-lg' : 'text-enterprise-400 hover:text-enterprise-600'}`}
                    >
                        Master Contracts
                    </button>
                    <button
                        onClick={() => setActiveTab('individuales')}
                        className={`flex-1 py-1.5 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'individuales' ? 'bg-enterprise-950 text-white shadow-lg' : 'text-enterprise-400 hover:bg-enterprise-200'}`}
                    >
                        Emisiones (CPs)
                    </button>
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-enterprise-400" size={14} />
                        <input
                            type="text"
                            placeholder={activeTab === 'mcs' ? "Buscar por cliente o folio MC..." : "Buscar contrato..."}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-enterprise-100 rounded-xl font-bold text-[10px] shadow-sm outline-none focus:ring-1 focus:ring-brand-orange/20 transition-all placeholder:text-enterprise-300"
                        />
                    </div>
                    {activeTab === 'mcs' && (
                        <div className="flex bg-enterprise-950 rounded-xl p-1 w-fit">
                            {['todos', 'activo', 'agotado', 'vencido'].map(estatus => (
                                <button
                                    key={estatus}
                                    onClick={() => setFiltroEstatus(estatus)}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                                        ${filtroEstatus === estatus
                                            ? 'bg-brand-orange text-white shadow-lg'
                                            : 'text-enterprise-400 hover:text-white/60'}`}
                                >
                                    {estatus}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {activeTab === 'mcs' ? (
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-enterprise-100 overflow-hidden mb-10">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-enterprise-950 text-white font-black uppercase text-[9px] tracking-[0.2em]">
                                        <th className="px-8 py-5">Cliente / MC</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5">Bolsa Aprobada</th>
                                        <th className="px-8 py-5">Consumo</th>
                                        <th className="px-8 py-5">Saldo Disponible</th>
                                        <th className="px-8 py-5 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-enterprise-50">
                                    {filtrados.map(mc => (
                                        <tr
                                            key={mc.id}
                                            onClick={() => setSelectedMC(mc)}
                                            className="hover:bg-enterprise-50/50 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-enterprise-50 rounded-xl flex items-center justify-center text-enterprise-400 group-hover:bg-brand-orange group-hover:text-white transition-all shadow-sm">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-enterprise-950 truncate uppercase tracking-tight group-hover:text-brand-orange transition-colors">{mc.cliente?.nombre_empresa || 'S/N'}</p>
                                                        <p className="text-[9px] font-bold text-brand-orange tracking-widest uppercase">MC: {mc.numero_mc}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm
                                                        ${mc.estatus === 'activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-magenta/10 text-brand-magenta'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${mc.estatus === 'activo' ? 'bg-emerald-500' : 'bg-brand-magenta'} animate-pulse`}></div>
                                                    {mc.estatus}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-black text-enterprise-950 text-sm">
                                                {formatMXN(mc.monto_aprobado)}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                    <div className="flex justify-between text-[8px] font-black uppercase text-enterprise-400 tracking-tight">
                                                        <span>{mc.porcentajeConsumo.toFixed(1)}%</span>
                                                        <span>{formatMXN(mc.montoConsumido)}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-enterprise-100 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${mc.porcentajeConsumo > 90 ? 'bg-brand-magenta' : mc.porcentajeConsumo > 70 ? 'bg-brand-orange' : 'bg-emerald-500'}`}
                                                            style={{ width: `${Math.min(mc.porcentajeConsumo, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className={`text-sm font-black ${mc.saldoDisponible < (mc.monto_aprobado * 0.1) ? 'text-brand-magenta' : 'text-emerald-600'}`}>
                                                    {formatMXN(mc.saldoDisponible)}
                                                </div>
                                                <p className="text-[8px] font-bold text-enterprise-300 uppercase italic">Libre para pauta</p>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex justify-center">
                                                    <div className="w-10 h-10 bg-enterprise-50 group-hover:bg-brand-orange group-hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center">
                                                        <ChevronRight size={18} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden divide-y divide-enterprise-50">
                            {filtrados.map(mc => (
                                <div
                                    key={mc.id}
                                    onClick={() => setSelectedMC(mc)}
                                    className="p-6 space-y-4 hover:bg-enterprise-50 transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-enterprise-950 text-white rounded-xl flex items-center justify-center">
                                                <Building2 size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-enterprise-950 uppercase tracking-tight truncate max-w-[150px]">{mc.cliente?.nombre_empresa}</p>
                                                <span className="text-[9px] font-bold text-brand-orange uppercase tracking-widest">{mc.numero_mc}</span>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${mc.estatus === 'activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-orange/10 text-brand-orange'}`}>
                                            {mc.estatus}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest">Aprobado</p>
                                            <p className="text-xs font-black text-enterprise-950">{formatMXN(mc.monto_aprobado)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Disponible</p>
                                            <p className="text-xs font-black text-emerald-600">{formatMXN(mc.saldoDisponible)}</p>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-enterprise-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${mc.porcentajeConsumo > 90 ? 'bg-brand-magenta' : 'bg-emerald-500'}`}
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
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-enterprise-100 overflow-hidden mb-10">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-enterprise-950 text-white font-black uppercase text-[9px] tracking-[0.2em]">
                                        <th className="px-8 py-5">F. Venta</th>
                                        <th className="px-8 py-5">Cliente / Contrato</th>
                                        <th className="px-8 py-5">Importe Neto</th>
                                        <th className="px-8 py-5">F. Sistema (Registro)</th>
                                        <th className="px-8 py-5">Folio Sistema (CP)</th>
                                        <th className="px-8 py-5 text-center">Estado Adm.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-enterprise-50">
                                    {(cotizaciones || []).filter(q => q.estatus === 'ganada').filter(q => {
                                        const search = busqueda.toLowerCase();
                                        return (
                                            q.cliente?.nombre_empresa?.toLowerCase().includes(search) ||
                                            q.numero_contrato?.toString().includes(search) ||
                                            q.folio_sistema?.toLowerCase().includes(search)
                                        );
                                    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(q => (
                                        <tr key={q.id} className="hover:bg-enterprise-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] font-black text-enterprise-950 uppercase">
                                                    {new Date(q.fecha_cierre_real || q.fecha).toLocaleDateString('es-MX')}
                                                </p>
                                                <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-tighter">Folio: {q.folio}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black text-enterprise-950 uppercase tracking-tight">{q.cliente?.nombre_empresa}</p>
                                                <span className="text-[9px] font-bold text-brand-orange uppercase tracking-widest">CTR: {q.numero_contrato}</span>
                                            </td>
                                            <td className="px-8 py-6 font-black text-enterprise-950 text-sm">
                                                {formatMXN(q.subtotalGeneral || q.total / 1.16)}
                                            </td>
                                            <td className="px-8 py-6">
                                                <input
                                                    type="date"
                                                    value={q.fecha_registro_sistema || ''}
                                                    onChange={async (e) => {
                                                        const success = await onSaveQuote('cotizaciones', { id: q.id, fecha_registro_sistema: e.target.value });
                                                        if (success) setMensaje({ tipo: 'exito', texto: 'Fecha de sistema actualizada' });
                                                    }}
                                                    className="p-2 bg-enterprise-50 border border-enterprise-100 rounded-lg text-[10px] font-bold focus:ring-1 focus:ring-brand-orange/20 outline-none w-full max-w-[130px] transition-all"
                                                />
                                            </td>
                                            <td className="px-8 py-6">
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
                                                    className="p-2 bg-enterprise-50 border border-enterprise-100 rounded-lg text-[10px] font-bold focus:ring-1 focus:ring-brand-orange/20 outline-none w-full transition-all"
                                                />
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {q.fecha_registro_sistema ? (
                                                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                                                        Registrado
                                                    </span>
                                                ) : (
                                                    <span className="bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-brand-orange/20">
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-enterprise-950/60 backdrop-blur-md animate-premium-fade">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange"></div>

                        <h2 className="text-2xl font-black text-enterprise-950 uppercase italic italic-brand tracking-tighter mb-8 flex items-center gap-3">
                            <Plus className="text-brand-orange" /> Crear Master Contract
                        </h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-2">Seleccionar Cliente</label>
                                    <select
                                        required
                                        value={formData.cliente_id}
                                        onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                                        className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl text-sm font-bold focus:ring-1 focus:ring-brand-orange/20 outline-none appearance-none"
                                    >
                                        <option value="">Elegir empresa...</option>
                                        {clientes.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre_empresa}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-2">Folio MC</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: MC-2024-001"
                                        value={formData.numero_mc}
                                        onChange={(e) => setFormData({ ...formData, numero_mc: e.target.value })}
                                        className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl text-sm font-bold focus:ring-1 focus:ring-brand-orange/20 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-2">Inversión Aprobada</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="$0.00"
                                        value={formData.monto_aprobado}
                                        onChange={(e) => setFormData({ ...formData, monto_aprobado: e.target.value })}
                                        className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl text-sm font-bold focus:ring-1 focus:ring-brand-orange/20 outline-none font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-2">Inicio Periodo</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha_inicio}
                                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                        className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl text-sm font-bold focus:ring-1 focus:ring-brand-orange/20 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-enterprise-400 uppercase tracking-widest ml-2">Fin Periodo</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha_fin}
                                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                                        className="w-full p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl text-sm font-bold focus:ring-1 focus:ring-brand-orange/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-enterprise-400 hover:bg-enterprise-50 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-brand-orange text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-brand-magenta transition-all shadow-xl shadow-brand-orange/20"
                                >
                                    Guardar Contrato
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedMC && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-enterprise-950/80 backdrop-blur-xl animate-premium-fade">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden">
                        <button
                            onClick={() => setSelectedMC(null)}
                            className="absolute right-8 top-8 w-12 h-12 bg-enterprise-50 rounded-full flex items-center justify-center text-enterprise-400 hover:bg-brand-orange/10 hover:text-brand-orange transition-all z-10"
                        >
                            <ArrowRight className="rotate-180" size={20} />
                        </button>

                        <div className="p-12 pb-6 flex items-center gap-6 border-b border-enterprise-50">
                            <div className="w-20 h-20 bg-enterprise-950 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-enterprise-900/10">
                                <Briefcase size={36} className="text-brand-orange" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-enterprise-950 uppercase italic italic-brand tracking-tighter">{selectedMC.cliente?.nombre_empresa}</h2>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em]">Master Contract: {selectedMC.numero_mc}</span>
                                    <span className="w-1 h-1 bg-enterprise-200 rounded-full"></span>
                                    <span className="text-[10px] font-black text-enterprise-400 uppercase tracking-[0.3em]">
                                        {new Date(selectedMC.fecha_inicio).toLocaleDateString()} - {new Date(selectedMC.fecha_fin).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
                                <div className="bg-enterprise-50 p-4 md:p-7 rounded-2xl md:rounded-[2.5rem] border border-enterprise-100 shadow-sm transition-all hover:bg-white hover:shadow-lg">
                                    <p className="text-[7px] md:text-[10px] font-black text-enterprise-400 uppercase tracking-widest mb-1 md:mb-3">Bolsa Autorizada</p>
                                    <p className="text-sm md:text-2xl font-black text-enterprise-950 tracking-tighter">{formatMXN(selectedMC.monto_aprobado)}</p>
                                </div>
                                <div className="bg-brand-orange/5 p-4 md:p-7 rounded-2xl md:rounded-[2.5rem] border border-brand-orange/10 shadow-sm transition-all hover:bg-brand-orange/10">
                                    <p className="text-[7px] md:text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1 md:mb-3">Devengado</p>
                                    <p className="text-sm md:text-2xl font-black text-brand-orange tracking-tighter">{formatMXN(selectedMC.montoConsumido)}</p>
                                </div>
                                <div className="bg-blue-50/50 p-4 md:p-7 rounded-2xl md:rounded-[2.5rem] border border-blue-100/50 shadow-sm transition-all hover:bg-blue-50">
                                    <p className="text-[7px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 md:mb-3">Formalizado</p>
                                    <p className="text-sm md:text-2xl font-black text-blue-600 tracking-tighter">{formatMXN(selectedMC.montoRegistrado)}</p>
                                </div>
                                <div className="bg-emerald-600 p-4 md:p-7 rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-emerald-500/10 text-white relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform hidden md:block">
                                        <CheckCircle2 size={80} />
                                    </div>
                                    <p className="text-[7px] md:text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1 md:mb-3 relative z-10">Recuperado (Cobro)</p>
                                    <p className="text-sm md:text-2xl font-black text-white tracking-tighter relative z-10">{formatMXN(selectedMC.montoCobrado)}</p>
                                </div>
                            </div>
                            <div className="mt-4 mb-8 bg-enterprise-50 p-4 rounded-2xl border border-enterprise-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-orange shadow-sm border border-enterprise-100"><AlertCircle size={16} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest">Saldo Técnico Libre</p>
                                        <p className="text-xs font-black text-enterprise-950">{formatMXN(selectedMC.saldoTecnico)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest">Saldo Comercial Libre</p>
                                    <p className="text-xs font-black text-brand-magenta">{formatMXN(selectedMC.saldoDisponible)}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-[11px] font-black text-enterprise-950 uppercase tracking-[0.4em] flex items-center gap-3 italic italic-brand">
                                    <FileText size={16} className="text-brand-orange" /> Historial de Implementación
                                </h4>
                                <div className="h-px flex-1 bg-enterprise-100 mx-6"></div>
                                <span className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest bg-enterprise-50 px-3 py-1 rounded-lg border border-enterprise-100">
                                    {selectedMC.cotizaciones?.length || 0} Cotizaciones
                                </span>
                            </div>

                            <div className="bg-enterprise-50 rounded-[2.5rem] border border-enterprise-100 p-2 mb-12">
                                {selectedMC.cotizaciones?.length > 0 ? (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest">
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
                                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-enterprise-300 shadow-sm border border-enterprise-50 group-hover:bg-brand-orange group-hover:text-white transition-all">
                                                                <CheckCircle2 size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-enterprise-950 uppercase">CTR-{cotz.numero_contrato || 'S/N'}</p>
                                                                <p className="text-[9px] font-bold text-enterprise-400 uppercase tracking-tighter">Folio: {cotz.folio}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-bold text-enterprise-700">
                                                        {new Date(cotz.fecha_cierre_real || cotz.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {cotz.fecha_registro_sistema ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-emerald-600">#{cotz.folio_sistema}</span>
                                                                <span className="text-[8px] font-bold text-enterprise-400">{new Date(cotz.fecha_registro_sistema).toLocaleDateString()}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[8px] font-black text-brand-orange uppercase tracking-widest">Pendiente</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-right rounded-r-3xl">
                                                        <p className="text-sm font-black text-enterprise-950">{formatMXN(cotz.subtotalGeneral || cotz.total / 1.16)}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-20 text-center">
                                        <Calculator size={24} className="text-enterprise-200 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-enterprise-400 uppercase tracking-[0.2em]">Sin cargos registrados</p>
                                    </div>
                                )}
                            </div>

                            {/* Nueva Sección: Cobranza Vinculada */}
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-[11px] font-black text-enterprise-950 uppercase tracking-[0.4em] flex items-center gap-3 italic italic-brand">
                                    <DollarSign size={16} className="text-emerald-600" /> Cobranza y Facturación
                                </h4>
                                <div className="h-px flex-1 bg-enterprise-100 mx-6"></div>
                                <span className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest bg-enterprise-50 px-3 py-1 rounded-lg border border-enterprise-100">
                                    {selectedMC.bills?.length || 0} Facturas
                                </span>
                            </div>

                            <div className="bg-enterprise-50 rounded-[2.5rem] border border-enterprise-100 p-2">
                                {selectedMC.bills?.length > 0 ? (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest">
                                                <th className="px-6 py-4">F. Programada</th>
                                                <th className="px-6 py-4">Factura</th>
                                                <th className="px-6 py-4 text-center">Estatus</th>
                                                <th className="px-6 py-4 text-right">Importe</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white">
                                            {selectedMC.bills.map(bill => (
                                                <tr key={bill.id} className="hover:bg-white transition-colors">
                                                    <td className="px-6 py-5 rounded-l-3xl">
                                                        <p className="text-[10px] font-black text-enterprise-950">{new Date(bill.fecha_programada_cobro).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <p className="text-[10px] font-black text-enterprise-950 uppercase">{bill.numero_factura || 'PENDIENTE'}</p>
                                                        <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-tighter">Rel: {bill.cotizaciones?.folio}</p>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm
                                                            ${bill.estatus_pago === 'cobrado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-brand-orange/5 text-brand-orange border-brand-orange/10'}`}>
                                                            {bill.estatus_pago}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right rounded-r-3xl">
                                                        <p className="text-sm font-black text-enterprise-950">{formatMXN(bill.monto_facturado)}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 border border-enterprise-100 shadow-sm">
                                            <DollarSign size={24} className="text-enterprise-200" />
                                        </div>
                                        <p className="text-[10px] font-black text-enterprise-400 uppercase tracking-[0.2em]">Sin facturas emitidas para este contrato</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-enterprise-50 border-t border-enterprise-100 flex justify-end">
                            <button
                                onClick={() => setSelectedMC(null)}
                                className="px-10 py-4 bg-enterprise-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-orange transition-all duration-300 shadow-xl shadow-enterprise-900/10"
                            >
                                Cerrar Registro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterContractsView;
