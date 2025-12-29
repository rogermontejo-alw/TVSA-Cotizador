import React, { useMemo, useState } from 'react';
import {
    Users,
    DollarSign,
    TrendingUp,
    Zap,
    RefreshCw,
    BarChart3,
    CheckCircle2,
    PieChart,
    Activity,
    Target,
    Tv,
    Globe,
    ChevronRight,
    ArrowUpRight,
    Calculator,
    Briefcase // Added Briefcase icon
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const StatCard = ({ title, value, icon: Icon, colorClass, isCurrency = false, trend = null, subtext = null }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-enterprise-100 flex items-start gap-3 transition-all hover:shadow-md group animate-premium-fade min-w-0">
        <div className={`p-2.5 rounded-xl ${colorClass} flex-shrink-0 transition-transform group-hover:scale-110 duration-500`}>
            <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest mb-0.5 truncate">
                {title}
            </p>
            <h3 className="text-xl font-black text-enterprise-950 tracking-tight leading-none mb-1 truncate">
                {isCurrency ? formatMXN(value, 0) : value}
            </h3>
            {trend && (
                <div className="flex items-center gap-1">
                    <span className="text-[8px] font-black text-emerald-600">+{trend}%</span>
                </div>
            )}
            {subtext && (
                <p className="text-[8px] font-bold text-enterprise-300 uppercase italic truncate">{subtext}</p>
            )}
        </div>
    </div>
);

const DashboardView = ({
    historial = [],
    clientes = [],
    cobranza = [],
    metasComerciales = [],
    setVistaActual,
    actualizarDashboard,
    iniciarNuevaCotizacion
}) => {
    const [periodo, setPeriodo] = useState('mes');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await actualizarDashboard?.();
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const statistics = useMemo(() => {
        const ahora = new Date();
        const inicio = new Date();
        if (periodo === 'mes') inicio.setDate(1);
        else inicio.setMonth(0, 1);
        inicio.setHours(0, 0, 0, 0);

        const filteredH = historial.filter(h => {
            const dateStr = h.fecha_cierre_real || h.fecha;
            if (!dateStr) return false;
            const itemDate = new Date(dateStr);
            return itemDate >= inicio && itemDate <= ahora;
        });

        const ganadas = filteredH.filter(h => h.estatus === 'ganada');
        const totalVenta = ganadas.reduce((sum, h) => sum + (parseFloat(h.subtotalGeneral || h.total / 1.16) || 0), 0);

        // CPS Lógica
        const conCPS = ganadas.filter(h => h.monto_contrato && h.monto_contrato.length > 2);
        const montoCPS = conCPS.reduce((sum, h) => sum + (parseFloat(h.subtotalGeneral || h.total / 1.16) || 0), 0);

        const mesActual = ahora.getMonth() + 1;
        const meta = metasComerciales.find(m => Number(m.mes) === mesActual)?.monto_meta || 1500000;
        const cumplimiento = Math.round((totalVenta / meta) * 100);

        // Cobranza y Facturación
        const filteredCobranza = cobranza.filter(c => {
            const d = new Date(c.fecha_facturacion || c.updated_at);
            return d >= inicio && d <= ahora;
        });

        const totalFacturado = filteredCobranza.reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);
        const totalCobrado = filteredCobranza.filter(c => c.estatus_pago === 'cobrado').reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);

        return {
            totalVenta,
            montoCPS,
            countCPS: conCPS.length,
            totalWon: ganadas.length,
            totalFacturado,
            totalCobrado,
            cumplimiento,
            meta,
            countLeads: clientes.filter(c => new Date(c.created_at) >= inicio).length
        };
    }, [historial, clientes, periodo, metasComerciales, cobranza]);

    return (
        <div className="max-w-[1440px] mx-auto space-y-8 animate-premium-fade pb-20 px-4 xl:px-8">
            {/* Executive Masthead - Compact */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-enterprise-100 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center text-white shadow-brand">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-enterprise-950 tracking-tighter uppercase italic italic-brand leading-none">
                            Financial <span className="text-brand-orange">Control Tower</span>
                        </h1>
                        <p className="text-[10px] font-bold text-enterprise-400 uppercase tracking-widest mt-1">
                            Media Performance Synchronizer • TelevisaUnivision
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white p-1 rounded-xl border border-enterprise-100 shadow-sm">
                        {['mes', 'anio'].map(v => (
                            <button
                                key={v}
                                onClick={() => setPeriodo(v)}
                                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                                    ${periodo === v
                                        ? 'bg-enterprise-950 text-white shadow-md'
                                        : 'text-enterprise-400 hover:text-enterprise-950'}`}
                            >
                                {v === 'mes' ? 'Mensual' : 'Anual'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="w-9 h-9 bg-white text-enterprise-950 border border-enterprise-100 rounded-lg flex items-center justify-center hover:bg-enterprise-950 hover:text-white transition-all shadow-sm group"
                    >
                        <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Financial Ribbon - 6 Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 min-[1190px]:grid-cols-6 gap-4">
                <StatCard
                    title="Venta Bruta"
                    value={statistics.totalVenta}
                    isCurrency
                    icon={DollarSign}
                    colorClass="bg-brand-orange text-white"
                />
                <StatCard
                    title="Formalizado (CPS)"
                    value={statistics.montoCPS}
                    isCurrency
                    icon={Briefcase}
                    colorClass="bg-blue-600 text-white"
                    subtext={`${statistics.countCPS} de ${statistics.totalWon} contratos`}
                />
                <StatCard
                    title="Facturación"
                    value={statistics.totalFacturado}
                    isCurrency
                    icon={BarChart3}
                    colorClass="bg-slate-800 text-white"
                />
                <StatCard
                    title="Cobranza"
                    value={statistics.totalCobrado}
                    isCurrency
                    icon={CheckCircle2}
                    colorClass="bg-emerald-600 text-white"
                />
                <StatCard
                    title="Por Cobrar"
                    value={Math.max(0, statistics.totalFacturado - statistics.totalCobrado)}
                    isCurrency
                    icon={Activity}
                    colorClass="bg-red-50 text-red-600 border border-red-100"
                />
                <StatCard
                    title="Meta Index"
                    value={statistics.cumplimiento}
                    icon={Target}
                    colorClass="bg-enterprise-100 text-enterprise-900"
                    subtext={`${statistics.cumplimiento}% de la meta`}
                />
            </div>

            {/* Performance Analysis & Strategic Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Fulfillment Status */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-[#111111] p-6 rounded-[2rem] text-white relative overflow-hidden shadow-xl border border-white/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange opacity-5 blur-[80px] -mr-32 -mt-32" />

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                            <div>
                                <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest flex items-center gap-2">
                                    <Target size={14} /> Revenue Performance
                                </span>
                                <div className="mt-2 flex items-baseline gap-4">
                                    <h2 className="text-5xl font-black tracking-tighter leading-none">{statistics.cumplimiento}%</h2>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest italic">Sync Fulfillment</p>
                                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{formatMXN(statistics.totalVenta)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md w-full md:w-auto">
                                <span className="block text-[8px] font-black text-white/40 uppercase tracking-widest mb-1 text-left md:text-right">Target Period</span>
                                <span className="text-2xl font-black tracking-tight">{formatMXN(statistics.meta, 0)}</span>
                            </div>
                        </div>

                        {/* Progress Bar Container - Compact */}
                        <div className="mt-8 space-y-4 relative z-10">
                            <div className="h-4 bg-white/5 rounded-full p-1 border border-white/10 overflow-hidden">
                                <div
                                    className="h-full bg-univision-gradient rounded-full shadow-brand transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(statistics.cumplimiento, 100)}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2 border-t border-white/5">
                                <div>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Formalización</p>
                                    <p className="text-sm font-black text-blue-400">
                                        {Math.round((statistics.montoCPS / Math.max(1, statistics.totalVenta)) * 100)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Cobranza Real</p>
                                    <p className="text-sm font-black text-emerald-400">
                                        {Math.round((statistics.totalCobrado / Math.max(1, statistics.totalFacturado)) * 100)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Gap Facturación</p>
                                    <p className="text-sm font-black text-red-400">
                                        {formatMXN(Math.max(0, statistics.totalVenta - statistics.totalFacturado), 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Actions Table (Placeholder for density) */}
                    <div className="bg-white rounded-[2rem] border border-enterprise-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-enterprise-50 flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-enterprise-950 uppercase tracking-widest">Faltantes de Formalización (Ganadas sin CPS)</h4>
                            <span className="text-[9px] font-black text-brand-orange bg-brand-orange/5 px-2 py-0.5 rounded-full">
                                {statistics.totalWon - statistics.countCPS} Pendientes
                            </span>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-enterprise-50 text-enterprise-400 font-black uppercase text-[8px] tracking-widest">
                                        <th className="px-6 py-3">Cliente</th>
                                        <th className="px-6 py-3">Monto Total</th>
                                        <th className="px-6 py-3">Días Ganada</th>
                                        <th className="px-6 py-3">Estatus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-enterprise-50">
                                    {historial.filter(h => h.estatus === 'ganada' && (!h.monto_contrato || h.monto_contrato.length < 2)).slice(0, 3).map((h, i) => (
                                        <tr key={i} className="hover:bg-enterprise-50/50 transition-colors">
                                            <td className="px-6 py-3 text-[10px] font-bold text-enterprise-950">{h.cliente?.nombre || 'N/A'}</td>
                                            <td className="px-6 py-3 text-[10px] font-black">{formatMXN(h.subtotalGeneral || h.total / 1.16)}</td>
                                            <td className="px-6 py-3 text-[10px] text-enterprise-400 font-medium">
                                                {Math.round((new Date() - new Date(h.fecha)) / (1000 * 60 * 60 * 24))}d
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-[8px] font-black text-brand-orange uppercase italic tracking-widest">Pendiente CPS</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Vertical Strategic Actions - Compact Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <button
                        onClick={iniciarNuevaCotizacion}
                        className="w-full group bg-univision-gradient p-[1px] rounded-2xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        <div className="bg-[#111111] p-6 rounded-[0.9rem] flex items-center justify-between text-white overflow-hidden relative">
                            <div className="relative z-10">
                                <span className="block text-[8px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Intelligence Station</span>
                                <h3 className="text-xl font-black uppercase tracking-tighter italic italic-brand">Nueva Cotización</h3>
                            </div>
                            <div className="relative z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <Zap size={20} className="fill-current" />
                            </div>
                        </div>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => setVistaActual('reportes')}
                            className="bg-white p-6 rounded-2xl border border-enterprise-100 flex flex-col gap-4 text-left shadow-sm hover:border-brand-orange transition-all group"
                        >
                            <div className="w-10 h-10 bg-enterprise-50 rounded-xl flex items-center justify-center text-enterprise-400 group-hover:bg-brand-orange/5 group-hover:text-brand-orange transition-all">
                                <BarChart3 size={20} />
                            </div>
                            <span className="text-[9px] font-black text-enterprise-950 uppercase tracking-widest leading-none">Reportes<br />Ejecutivos</span>
                        </button>
                        <button
                            onClick={() => setVistaActual('crm')}
                            className="bg-white p-6 rounded-2xl border border-enterprise-100 flex flex-col gap-4 text-left shadow-sm hover:border-enterprise-950 transition-all group"
                        >
                            <div className="w-10 h-10 bg-enterprise-50 rounded-xl flex items-center justify-center text-enterprise-400 group-hover:bg-enterprise-950 group-hover:text-white transition-all">
                                <Activity size={20} />
                            </div>
                            <span className="text-[9px] font-black text-enterprise-950 uppercase tracking-widest leading-none">Gestión<br />Pipeline</span>
                        </button>
                    </div>

                    {/* Operational Alerts - New Section */}
                    <div className="bg-enterprise-50 rounded-2xl p-5 border border-enterprise-100 space-y-4">
                        <h4 className="text-[9px] font-black text-enterprise-400 uppercase tracking-widest flex items-center gap-2">
                            Alertas Operativas
                        </h4>
                        <div className="space-y-2">
                            {statistics.totalVenta > statistics.totalFacturado && (
                                <div className="p-3 bg-white rounded-xl border border-enterprise-100 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <p className="text-[9px] font-bold text-enterprise-600">
                                        Hay <span className="text-enterprise-950 font-black">{formatMXN(statistics.totalVenta - statistics.totalFacturado)}</span> ganados no facturados.
                                    </p>
                                </div>
                            )}
                            <div className="p-3 bg-white rounded-xl border border-enterprise-100 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <p className="text-[9px] font-bold text-enterprise-600">
                                    Base de datos sincronizada en tiempo real.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
