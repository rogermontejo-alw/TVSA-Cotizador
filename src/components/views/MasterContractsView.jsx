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
    contratosEjecucion = [],
    clientes = [],
    cobranza = [],
    onSaveMC,
    onSaveContrato,
    onSaveQuote,
    setMensaje
}) => {
    const [activeTab, setActiveTab] = useState('mcs'); // 'mcs' (Convenios) o 'ejecuciones' (Contratos)
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('todos');
    const [isCreating, setIsCreating] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [selectedMC, setSelectedMC] = useState(null);

    const [formData, setFormData] = useState({
        numero_mc: '',
        cliente_id: '',
        monto_aprobado: '',
        fecha_inicio: '',
        fecha_fin: '',
        notas: '',
        estatus: 'activo'
    });

    const [executionData, setExecutionData] = useState({
        mc_id: '',
        cotizacion_id: '',
        numero_contrato: '',
        monto_ejecucion: '',
        fecha_inicio_pauta: '',
        notas: ''
    });

    const enrichedMCs = useMemo(() => {
        return (masterContracts || []).map(mc => {
            const cliente = clientes.find(c => String(c.id) === String(mc.cliente_id));

            // Consumo basado en ejecuciones reales vinculadas a este MC
            const ejecucionesMC = (contratosEjecucion || []).filter(ce => String(ce.mc_id) === String(mc.id));

            const montoConsumido = ejecucionesMC.reduce((sum, ce) => sum + (parseFloat(ce.monto_ejecucion) || 0), 0);

            // Cotizaciones ganadas de este cliente que aún no tienen ejecución
            const cotizacionesDisponibles = cotizaciones.filter(q =>
                String(q.cliente_id) === String(mc.cliente_id) &&
                q.estatus === 'ganada' &&
                !(contratosEjecucion || []).some(ce => String(ce.cotizacion_id) === String(q.id))
            );

            return {
                ...mc,
                cliente,
                ejecuciones: ejecucionesMC,
                cotizacionesDisponibles,
                montoConsumido,
                saldoDisponible: parseFloat(mc.monto_aprobado) - montoConsumido,
                porcentajeConsumo: (montoConsumido / parseFloat(mc.monto_aprobado)) * 100
            };
        });
    }, [masterContracts, contratosEjecucion, cotizaciones, clientes]);

    const globalStats = useMemo(() => {
        const totalAprobado = enrichedMCs.reduce((sum, mc) => sum + (parseFloat(mc.monto_aprobado) || 0), 0);
        const totalEjecutado = enrichedMCs.reduce((sum, mc) => sum + (mc.montoConsumido || 0), 0);
        const mcIds = enrichedMCs.map(mc => mc.id);

        // El monto cobrado viene de la tabla cobranza vinculado a ejecuciones de MCs
        const totalCobrado = (cobranza || [])
            .filter(c => c.contrato_ejecucion_id &&
                (contratosEjecucion || []).some(ce => ce.id === c.contrato_ejecucion_id && mcIds.includes(ce.mc_id)))
            .filter(c => c.estatus_pago === 'cobrado')
            .reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);

        return { totalAprobado, totalEjecutado, totalCobrado };
    }, [enrichedMCs, cobranza, contratosEjecucion]);

    const filtrados = enrichedMCs.filter(mc => {
        const matchesBusqueda =
            mc.numero_mc?.toLowerCase().includes(busqueda.toLowerCase()) ||
            mc.cliente?.nombre_empresa?.toLowerCase().includes(busqueda.toLowerCase());
        const matchesEstatus = filtroEstatus === 'todos' || mc.estatus === filtroEstatus;
        return matchesBusqueda && matchesEstatus;
    });

    const handleSaveExecution = async (e) => {
        e.preventDefault();
        const success = await onSaveContrato('contratos_ejecucion', executionData);
        if (success) {
            setMensaje({ tipo: 'exito', texto: 'Contrato de ejecución vinculado correctamente' });
            setIsExecuting(false);
            setExecutionData({
                mc_id: '',
                cotizacion_id: '',
                numero_contrato: '',
                monto_ejecucion: '',
                fecha_inicio_pauta: '',
                notas: ''
            });
        }
    };

    const openExecution = (mc) => {
        setSelectedMC(null); // Cerrar detalle si está abierto
        setExecutionData({
            ...executionData,
            mc_id: mc.id,
            monto_ejecucion: '' // Se llenará al seleccionar cotización
        });
        setIsExecuting(true);
    };

    const handleSelectQuote = (quoteId) => {
        const quote = cotizaciones.find(q => q.id === quoteId);
        if (quote) {
            setExecutionData({
                ...executionData,
                cotizacion_id: quoteId,
                monto_ejecucion: quote.subtotalGeneral || quote.total / 1.16
            });
        }
    };

    const handleSaveMC = async (e) => {
        e.preventDefault();
        const success = await onSaveMC('master_contracts', formData);
        if (success) {
            setMensaje({ tipo: 'exito', texto: 'Contrato Maestro guardado' });
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
        <div className="max-w-[1000px] mx-auto pb-24 space-y-6 animate-premium-fade">
            {/* Header / Stats Nexus Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-premium border border-enterprise-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-enterprise-50 -mr-8 -mt-8 rounded-full" />
                    <p className="text-[8px] font-black text-enterprise-400 uppercase tracking-widest mb-1 relative z-10 italic">Bolsa Global</p>
                    <h4 className="text-sm font-black text-enterprise-950 relative z-10">{formatMXN(globalStats.totalAprobado)}</h4>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-premium border border-enterprise-100 border-l-4 border-l-brand-orange relative overflow-hidden">
                    <p className="text-[8px] font-black text-brand-orange uppercase tracking-widest mb-1 italic">Consumo Contratado</p>
                    <h4 className="text-sm font-black text-brand-orange">{formatMXN(globalStats.totalEjecutado)}</h4>
                </div>
                <div className="bg-enterprise-950 p-4 rounded-2xl shadow-2xl relative overflow-hidden lg:col-span-2">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-brand-orange/10 blur-2xl -mr-10 -mt-10" />
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10 italic">Recuperado (Cobranza Master)</p>
                    <h4 className="text-sm font-black text-emerald-400 relative z-10">{formatMXN(globalStats.totalCobrado)}</h4>
                </div>
            </div>

            {/* NEXUS CONTRACT STATION HUB */}
            <div className="bg-enterprise-950 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-brand-orange/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-brand-orange/5 blur-3xl rounded-full" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-orange shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <Briefcase size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-3">
                                Nexus <span className="text-brand-orange">Estratégico</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                                <span>Gestión de Ciclo de Vida y Órdenes</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="text-brand-orange/80">Convenios Activos: {enrichedMCs.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('mcs')}
                            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${activeTab === 'mcs' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            Convenios
                        </button>
                        <button
                            onClick={() => setActiveTab('ejecuciones')}
                            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${activeTab === 'ejecuciones' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            Contratos
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full lg:w-auto px-8 py-3.5 bg-white text-enterprise-950 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-brand-orange hover:text-white transition-all shadow-xl active:scale-95 group/btn"
                    >
                        <Plus size={16} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                        {activeTab === 'mcs' ? 'Nuevo Convenio' : 'Vincular Contrato'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'mcs' ? (
                <div className="bg-white rounded-[2.5rem] shadow-premium border border-enterprise-100 overflow-hidden">
                    <div className="p-4 border-b border-enterprise-50 flex items-center gap-4 bg-enterprise-50/30">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-300" size={14} />
                            <input
                                type="text"
                                placeholder="IDENTIFICAR SOCIO O MC..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-white border border-enterprise-100 rounded-xl text-[10px] font-black uppercase outline-none focus:border-brand-orange transition-all placeholder:text-enterprise-300"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-enterprise-950 text-white/40">
                                <tr>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Socio / Folio Convenio</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Capital Aut.</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Diferencial</th>
                                    <th className="px-6 py-3 text-right text-[8px] font-black uppercase tracking-widest italic">Contratado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-enterprise-50">
                                {filtrados.map(mc => (
                                    <tr key={mc.id} onClick={() => setSelectedMC(mc)} className="hover:bg-enterprise-50/50 cursor-pointer transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-enterprise-50 flex items-center justify-center text-enterprise-300 group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-all">
                                                    <Building2 size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-enterprise-950 uppercase leading-none group-hover:text-brand-orange">{mc.cliente?.nombre_empresa}</p>
                                                    <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-widest mt-1">CVE: {mc.numero_mc}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-enterprise-950 italic">{formatMXN(mc.monto_aprobado)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-24 flex flex-col gap-1">
                                                <div className="flex justify-between text-[7px] font-black uppercase leading-none">
                                                    <span className="text-enterprise-400">{mc.porcentajeConsumo.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-enterprise-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${mc.porcentajeConsumo > 90 ? 'bg-error' : 'bg-emerald-500'}`} style={{ width: `${Math.min(mc.porcentajeConsumo, 100)}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-[10px] font-black ${mc.saldoDisponible < (mc.monto_aprobado * 0.1) ? 'text-error' : 'text-enterprise-950'}`}>{formatMXN(mc.montoConsumido)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-premium border border-enterprise-100 overflow-hidden">
                    <div className="p-4 border-b border-enterprise-50 flex items-center bg-enterprise-50/30">
                        <Search className="absolute ml-3 text-enterprise-300" size={14} />
                        <input
                            type="text"
                            placeholder="BUSCAR CTR EJE O CLIENTE..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white border border-enterprise-100 rounded-xl text-[10px] font-black uppercase outline-none focus:border-brand-orange transition-all placeholder:text-enterprise-300"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-enterprise-950 text-white/40">
                                <tr>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Fecha Pauta</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Socio / CTR</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Valor Contratado</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic text-center">Referencia Convenio</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic text-right">Vinculado a</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-enterprise-50">
                                {(contratosEjecucion || [])
                                    .filter(ce => {
                                        const search = busqueda.toLowerCase();
                                        const client = clientes.find(c => c.id === ce.mc_id); // mc_id points to MC which has client
                                        // Better way: enriched query already has some of this?
                                        return ce.numero_contrato?.toLowerCase().includes(search) ||
                                            ce.master_contracts?.numero_mc?.toLowerCase().includes(search);
                                    })
                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                    .map(ce => (
                                        <tr key={ce.id} className="hover:bg-enterprise-50/50 transition-all">
                                            <td className="px-6 py-4">
                                                <p className="text-[9px] font-black text-brand-orange uppercase italic leading-none">{new Date(ce.fecha_inicio_pauta).toLocaleDateString('es-MX')}</p>
                                                <p className="text-[7px] font-black text-enterprise-300 uppercase tracking-widest mt-1">REAL ID: {ce.id.substring(0, 8)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-black text-enterprise-950 uppercase leading-none">Contrato {ce.numero_contrato}</p>
                                                <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-widest mt-1">Estatus: Activo</p>
                                            </td>
                                            <td className="px-6 py-4 font-black text-enterprise-950 italic text-[10px]">
                                                {formatMXN(ce.monto_ejecucion)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 bg-enterprise-950 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                    {ce.master_contracts?.numero_mc || 'DIR'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-[9px] font-black text-enterprise-400 uppercase italic">Folio {ce.cotizaciones?.folio}</span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Nuevo MC */}
            {isCreating && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-enterprise-950/80 backdrop-blur-sm animate-premium-fade">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-enterprise-950 rounded-xl flex items-center justify-center text-brand-orange shadow-lg">
                                <Plus size={20} strokeWidth={3} />
                            </div>
                            <h3 className="text-[12px] font-black text-enterprise-950 uppercase italic tracking-widest">Nuevo Convenio Estratégico</h3>
                        </div>

                        <form onSubmit={handleSaveMC} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-enterprise-400 uppercase ml-2 tracking-widest">Socio Comercial</label>
                                <select
                                    required
                                    value={formData.cliente_id}
                                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                                    className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none appearance-none uppercase shadow-inner"
                                >
                                    <option value="">Seleccionar Socio...</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_empresa}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-enterprise-400 uppercase ml-2 tracking-widest">Identificador Convenio</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="CVE-2025-XXX..."
                                    value={formData.numero_mc}
                                    onChange={(e) => setFormData({ ...formData, numero_mc: e.target.value.toUpperCase() })}
                                    className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none uppercase shadow-inner"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-enterprise-400 uppercase ml-2 tracking-widest">Bolsa de Crédito (Capital)</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    value={formData.monto_aprobado}
                                    onChange={(e) => setFormData({ ...formData, monto_aprobado: e.target.value })}
                                    className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none uppercase shadow-inner"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-enterprise-400 uppercase ml-2 tracking-widest">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha_inicio}
                                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                        className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-enterprise-400 uppercase ml-2 tracking-widest">Vencimiento</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha_fin}
                                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                                        className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-enterprise-50">
                                <button type="button" onClick={() => setIsCreating(false)} className="h-11 text-[9px] font-black uppercase tracking-widest text-enterprise-400 hover:text-error transition-colors">Abortar</button>
                                <button type="submit" className="h-11 bg-enterprise-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-orange shadow-lg shadow-enterprise-900/20 active:scale-95 transition-all">Crear Convenio</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Vincular Ejecución (Contrato Individual) */}
            {isExecuting && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-enterprise-950/80 backdrop-blur-sm animate-premium-fade">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl border border-white">
                        <div className="flex items-center gap-3 mb-8">
                            <Calculator className="text-brand-orange" size={20} />
                            <h3 className="text-[12px] font-black text-enterprise-950 uppercase italic tracking-widest">Formalizar Contrato</h3>
                        </div>

                        <form onSubmit={handleSaveExecution} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-enterprise-400 uppercase ml-2">Vincular a Convenio</label>
                                <select
                                    required
                                    value={executionData.mc_id}
                                    onChange={(e) => setExecutionData({ ...executionData, mc_id: e.target.value })}
                                    className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none appearance-none uppercase"
                                >
                                    <option value="">Elegir Convenio / Master Contract...</option>
                                    {enrichedMCs.map(mc => (
                                        <option key={mc.id} value={mc.id}>{mc.cliente?.nombre_empresa} ({mc.numero_mc})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-enterprise-400 uppercase ml-2">Seleccionar Pipeline Won</label>
                                <select
                                    required
                                    value={executionData.cotizacion_id}
                                    onChange={(e) => handleSelectQuote(e.target.value)}
                                    className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none appearance-none uppercase"
                                >
                                    <option value="">Elegir Cotización Ganada...</option>
                                    {enrichedMCs.find(mc => mc.id === executionData.mc_id)?.cotizacionesDisponibles.map(q => (
                                        <option key={q.id} value={q.id}>{q.folio} - {formatMXN(q.subtotalGeneral || q.total / 1.16)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-enterprise-400 uppercase ml-2">Nº Contrato</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="CTR-..."
                                        value={executionData.numero_contrato}
                                        onChange={(e) => setExecutionData({ ...executionData, numero_contrato: e.target.value.toUpperCase() })}
                                        className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none uppercase"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-enterprise-400 uppercase ml-2">Monto a Vincular</label>
                                    <input
                                        type="number"
                                        required
                                        value={executionData.monto_ejecucion}
                                        onChange={(e) => setExecutionData({ ...executionData, monto_ejecucion: e.target.value })}
                                        className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-enterprise-400 uppercase ml-2">Fecha Inicio Pauta</label>
                                <input
                                    type="date"
                                    required
                                    value={executionData.fecha_inicio_pauta}
                                    onChange={(e) => setExecutionData({ ...executionData, fecha_inicio_pauta: e.target.value })}
                                    className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button type="button" onClick={() => setIsExecuting(false)} className="h-12 text-[9px] font-black uppercase tracking-widest text-enterprise-400">Descartar</button>
                                <button type="submit" className="h-12 bg-brand-orange text-white rounded-xl text-[9px] font-black uppercase tracking-[.2em] shadow-xl shadow-brand-orange/20 active:scale-95 transition-all">Sellar Contrato</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Detalle MC */}
            {selectedMC && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-enterprise-950/90 backdrop-blur-md animate-premium-fade">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-enterprise-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-enterprise-950 rounded-2xl flex items-center justify-center text-white"><Briefcase size={22} className="text-brand-orange" /></div>
                                <div>
                                    <h2 className="text-[14px] font-black text-enterprise-950 uppercase italic leading-none">{selectedMC.cliente?.nombre_empresa}</h2>
                                    <p className="text-[8px] font-black text-brand-orange uppercase tracking-[.3em] mt-1">Matriz de Análisis Convenio: {selectedMC.numero_mc}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => openExecution(selectedMC)}
                                    className="px-4 py-2 bg-enterprise-950 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all"
                                >
                                    Vincular Contrato
                                </button>
                                <button onClick={() => setSelectedMC(null)} className="w-10 h-10 bg-enterprise-50 rounded-full flex items-center justify-center text-enterprise-400 group hover:bg-error hover:text-white transition-all"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-enterprise-50 p-4 rounded-2xl border border-enterprise-100">
                                    <p className="text-[7px] font-black text-enterprise-400 uppercase tracking-widest mb-1">Bolsa Autorizada</p>
                                    <p className="text-[11px] font-black text-enterprise-950">{formatMXN(selectedMC.monto_aprobado)}</p>
                                </div>
                                <div className="bg-brand-orange/5 p-4 rounded-2xl border border-brand-orange/10">
                                    <p className="text-[7px] font-black text-brand-orange uppercase tracking-widest mb-1">Total Contratado</p>
                                    <p className="text-[11px] font-black text-brand-orange">{formatMXN(selectedMC.montoConsumido)}</p>
                                </div>
                                <div className={`p-4 rounded-2xl border ${selectedMC.saldoDisponible < (selectedMC.monto_aprobado * 0.1) ? 'bg-error text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                    <p className="text-[7px] font-black opacity-60 uppercase tracking-widest mb-1">Saldo Remanente</p>
                                    <p className="text-[11px] font-black">{formatMXN(selectedMC.saldoDisponible)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[9px] font-black text-enterprise-950 uppercase tracking-[0.3em] border-l-2 border-brand-orange pl-3 italic">Contratos de Operación</h4>
                                <div className="bg-enterprise-50 rounded-2xl border border-enterprise-100 p-2 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="text-enterprise-400">
                                            <tr>
                                                <th className="px-4 py-3 text-[7px] font-black uppercase tracking-widest italic">CTR Nº</th>
                                                <th className="px-4 py-3 text-[7px] font-black uppercase tracking-widest italic text-center">Pauta</th>
                                                <th className="px-4 py-3 text-[7px] font-black uppercase tracking-widest italic text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white">
                                            {selectedMC.ejecuciones?.map(e => (
                                                <tr key={e.id} className="hover:bg-white transition-all">
                                                    <td className="px-4 py-3">
                                                        <p className="text-[9px] font-black text-enterprise-950 uppercase leading-none">{e.numero_contrato}</p>
                                                        <p className="text-[7px] font-black text-enterprise-300 uppercase italic mt-1">Ref: {e.cotizaciones?.folio}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-[8px] font-black text-enterprise-400 uppercase italic">{new Date(e.fecha_inicio_pauta).toLocaleDateString('es-MX')}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-[9px] font-black text-brand-orange italic">{formatMXN(e.monto_ejecucion)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {selectedMC.ejecuciones?.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="py-8 text-center text-[7.5px] font-black text-enterprise-300 uppercase tracking-widest italic opacity-50">Sin contratos formalizados</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const X = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

export default MasterContractsView;
