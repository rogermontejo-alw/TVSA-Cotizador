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

    const [formData, setFormData] = useState({
        numero_mc: '',
        cliente_id: '',
        monto_aprobado: '',
        fecha_inicio: '',
        fecha_fin: '',
        notas: '',
        estatus: 'activo'
    });

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

    const globalStats = useMemo(() => {
        const totalAprobado = enrichedMCs.reduce((sum, mc) => sum + (parseFloat(mc.monto_aprobado) || 0), 0);
        const totalConsumido = enrichedMCs.reduce((sum, mc) => sum + (mc.montoConsumido || 0), 0);
        const totalRegistrado = enrichedMCs.reduce((sum, mc) => sum + (mc.montoRegistrado || 0), 0);

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
                    <p className="text-[8px] font-black text-brand-orange uppercase tracking-widest mb-1 italic">Consumo Comercial</p>
                    <h4 className="text-sm font-black text-brand-orange">{formatMXN(globalStats.totalConsumido)}</h4>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-premium border border-enterprise-100 border-l-4 border-l-blue-500 relative overflow-hidden">
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">Formalizado (Sist.)</p>
                    <h4 className="text-sm font-black text-blue-600">{formatMXN(globalStats.totalRegistrado)}</h4>
                </div>
                <div className="bg-enterprise-950 p-4 rounded-2xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-brand-orange/10 blur-2xl -mr-10 -mt-10" />
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10 italic">Recuperado (Cobro)</p>
                    <h4 className="text-sm font-black text-emerald-400 relative z-10">{formatMXN(globalStats.montoCobrado)}</h4>
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
                                <span className="text-brand-orange/80">Marcos Activos: {enrichedMCs.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('mcs')}
                            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${activeTab === 'mcs' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            Contratos
                        </button>
                        <button
                            onClick={() => setActiveTab('individuales')}
                            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${activeTab === 'individuales' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            Emisiones
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full lg:w-auto px-8 py-3.5 bg-white text-enterprise-950 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-brand-orange hover:text-white transition-all shadow-xl active:scale-95 group/btn"
                    >
                        <Plus size={16} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                        Iniciar Marco
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
                        <div className="flex items-center gap-1">
                            {['activo', 'agotado', 'vencido'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setFiltroEstatus(filtroEstatus === st ? 'todos' : st)}
                                    className={`px-3 py-1.5 border rounded-lg text-[7px] font-black uppercase tracking-widest transition-all ${filtroEstatus === st ? 'bg-enterprise-950 border-enterprise-950 text-white' : 'bg-white border-enterprise-100 text-enterprise-400 hover:border-brand-orange'}`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-enterprise-950 text-white/40">
                                <tr>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Identidad / Folio</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Capital Aut.</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Exposición</th>
                                    <th className="px-6 py-3 text-right text-[8px] font-black uppercase tracking-widest italic">Disponibilidad</th>
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
                                                    <p className="text-[8px] font-bold text-enterprise-400 uppercase tracking-widest mt-1">MC: {mc.numero_mc}</p>
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
                                            <span className={`text-[10px] font-black ${mc.saldoDisponible < (mc.monto_aprobado * 0.1) ? 'text-error' : 'text-emerald-500'}`}>{formatMXN(mc.saldoDisponible)}</span>
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
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-300" size={14} />
                            <input
                                type="text"
                                placeholder="BUSCAR CONTRATO O SOCIO..."
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
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Fecha Sinc.</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Identidad / CTR</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Valor Neto</th>
                                    <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest italic">Detalle de Infraestructura</th>
                                    <th className="px-6 py-3 text-center text-[8px] font-black uppercase tracking-widest italic">Estatus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-enterprise-50">
                                {(cotizaciones || [])
                                    .filter(q => q.estatus === 'ganada')
                                    .filter(q => {
                                        const search = busqueda.toLowerCase();
                                        return q.cliente?.nombre_empresa?.toLowerCase().includes(search) || q.numero_contrato?.toString().includes(search);
                                    })
                                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                                    .map(q => (
                                        <tr key={q.id} className="hover:bg-enterprise-50/50 transition-all">
                                            <td className="px-6 py-4">
                                                <p className="text-[9px] font-black text-enterprise-950 uppercase italic leading-none">{new Date(q.fecha_cierre_real || q.fecha).toLocaleDateString('es-MX')}</p>
                                                <p className="text-[7px] font-black text-enterprise-300 uppercase tracking-widest mt-1">FOL: {q.folio}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-black text-enterprise-950 uppercase leading-none">{q.cliente?.nombre_empresa}</p>
                                                <p className="text-[9px] font-black text-brand-orange uppercase tracking-widest mt-1">CTR: {q.numero_contrato}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black text-enterprise-950 italic">{formatMXN(q.subtotalGeneral || q.total / 1.16)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5 min-w-[180px]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[7px] font-black text-enterprise-400 uppercase w-12 italic">Registro:</span>
                                                        <input
                                                            type="date"
                                                            value={q.fecha_registro_sistema || ''}
                                                            onChange={async (e) => onSaveQuote('cotizaciones', { id: q.id, fecha_registro_sistema: e.target.value })}
                                                            className="flex-1 h-7 bg-enterprise-50 border border-enterprise-100 rounded-lg text-center text-[8px] font-black outline-none focus:border-brand-orange uppercase"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[7px] font-black text-enterprise-400 uppercase w-12 italic">CP / Folio:</span>
                                                        <input
                                                            type="text"
                                                            defaultValue={q.folio_sistema || ''}
                                                            placeholder="SISTEMA CP..."
                                                            onBlur={async (e) => onSaveQuote('cotizaciones', { id: q.id, folio_sistema: e.target.value })}
                                                            className="flex-1 h-7 bg-white border border-enterprise-100 rounded-lg px-2 text-[8px] font-black outline-none focus:border-brand-orange uppercase"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[7px] font-black text-brand-orange uppercase w-12 italic">Orden:</span>
                                                        <input
                                                            type="text"
                                                            defaultValue={q.numero_orden || ''}
                                                            placeholder="ORDEN DE VENTA..."
                                                            onBlur={async (e) => onSaveQuote('cotizaciones', { id: q.id, numero_orden: e.target.value })}
                                                            className="flex-1 h-7 bg-white border border-brand-orange/20 rounded-lg px-2 text-[8px] font-black outline-none focus:border-brand-orange uppercase placeholder:text-brand-orange/40"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest ${q.fecha_registro_sistema ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-orange/10 text-brand-orange'}`}>
                                                    {q.fecha_registro_sistema ? 'Sincronizado' : 'Borrador'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals - Simplified Nexus Style */}
            {isCreating && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-enterprise-950/80 backdrop-blur-sm animate-premium-fade">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-white">
                        <h3 className="text-[12px] font-black text-enterprise-950 uppercase italic tracking-widest mb-6">Inicializar Infraestructura MC</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <select
                                required
                                value={formData.cliente_id}
                                onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                                className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none appearance-none uppercase"
                            >
                                <option value="">Seleccionar Socio...</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_empresa}</option>)}
                            </select>
                            <input
                                type="text"
                                required
                                placeholder="IDENTIFICADOR MC..."
                                value={formData.numero_mc}
                                onChange={(e) => setFormData({ ...formData, numero_mc: e.target.value })}
                                className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none uppercase"
                            />
                            <input
                                type="number"
                                required
                                placeholder="CAPITAL AUTORIZADO..."
                                value={formData.monto_aprobado}
                                onChange={(e) => setFormData({ ...formData, monto_aprobado: e.target.value })}
                                className="w-full h-11 px-4 bg-enterprise-50 border border-enterprise-100 rounded-xl text-[10px] font-black outline-none uppercase"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setIsCreating(false)} className="h-11 text-[9px] font-black uppercase tracking-widest text-enterprise-400">Abortar</button>
                                <button type="submit" className="h-11 bg-enterprise-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-orange">Inicializar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedMC && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-enterprise-950/90 backdrop-blur-md animate-premium-fade">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-enterprise-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-enterprise-950 rounded-2xl flex items-center justify-center text-white"><Briefcase size={22} className="text-brand-orange" /></div>
                                <div>
                                    <h2 className="text-[14px] font-black text-enterprise-950 uppercase italic leading-none">{selectedMC.cliente?.nombre_empresa}</h2>
                                    <p className="text-[8px] font-black text-brand-orange uppercase tracking-[0.3em] mt-1">Matriz de Análisis MC: {selectedMC.numero_mc}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedMC(null)} className="w-10 h-10 bg-enterprise-50 rounded-full flex items-center justify-center text-enterprise-400 group hover:bg-error hover:text-white transition-all"><X size={18} /></button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-enterprise-50 p-4 rounded-2xl border border-enterprise-100">
                                    <p className="text-[7px] font-black text-enterprise-400 uppercase tracking-widest mb-1">Aprobado</p>
                                    <p className="text-[11px] font-black text-enterprise-950">{formatMXN(selectedMC.monto_aprobado)}</p>
                                </div>
                                <div className="bg-brand-orange/5 p-4 rounded-2xl border border-brand-orange/10">
                                    <p className="text-[7px] font-black text-brand-orange uppercase tracking-widest mb-1">Exposición</p>
                                    <p className="text-[11px] font-black text-brand-orange">{formatMXN(selectedMC.montoConsumido)}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                    <p className="text-[7px] font-black text-blue-600 uppercase tracking-widest mb-1">Formalizado</p>
                                    <p className="text-[11px] font-black text-blue-600">{formatMXN(selectedMC.montoRegistrado)}</p>
                                </div>
                                <div className="bg-emerald-500 p-4 rounded-2xl text-white">
                                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Recuperado</p>
                                    <p className="text-[11px] font-black">{formatMXN(selectedMC.montoCobrado)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[9px] font-black text-enterprise-950 uppercase tracking-[0.3em] border-l-2 border-brand-orange pl-3 italic">Historial de Despliegue</h4>
                                <div className="bg-enterprise-50 rounded-2xl border border-enterprise-100 p-2 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="text-enterprise-400">
                                            <tr>
                                                <th className="px-4 py-3 text-[7px] font-black uppercase tracking-widest italic">CTR / Folio</th>
                                                <th className="px-4 py-3 text-[7px] font-black uppercase tracking-widest italic text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white">
                                            {selectedMC.cotizaciones?.map(q => (
                                                <tr key={q.id} className="hover:bg-white transition-all">
                                                    <td className="px-4 py-3">
                                                        <p className="text-[9px] font-black text-enterprise-950 uppercase leading-none">CTR-{q.numero_contrato}</p>
                                                        <p className="text-[7px] font-black text-enterprise-300 uppercase italic mt-1">{q.folio}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-[9px] font-black text-brand-orange italic">{formatMXN(q.subtotalGeneral || q.total / 1.16)}</span>
                                                    </td>
                                                </tr>
                                            ))}
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
