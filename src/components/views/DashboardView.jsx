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
    Calculator
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const StatCard = ({ title, value, icon: Icon, colorClass, isCurrency = false, trend = null }) => (
    <div className="bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium-hover border border-enterprise-100 flex items-start gap-4 sm:gap-6 transition-all hover:shadow-2xl hover:-translate-y-1 group animate-premium-fade min-w-0">
        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${colorClass} flex-shrink-0 transition-transform group-hover:rotate-12 duration-500`}>
            <Icon size={window.innerWidth < 640 ? 20 : 24} />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[10px] font-black text-enterprise-500 uppercase tracking-widest mb-1 sm:mb-1.5 truncate">
                {title}
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-enterprise-950 tracking-tighter leading-none mb-1 sm:mb-2 truncate">
                {isCurrency ? formatMXN(value, 0) : value}
            </h3>
            {trend && (
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-100">
                        <ArrowUpRight size={10} strokeWidth={3} />
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter">+{trend}%</span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-enterprise-500 uppercase tracking-widest">Vs Last Period</span>
                </div>
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
        const pipeline = filteredH.filter(h => h.estatus !== 'ganada' && h.estatus !== 'perdida');

        const totalVenta = ganadas.reduce((sum, h) => sum + (parseFloat(h.subtotalGeneral || h.total / 1.16) || 0), 0);
        const valorPipeline = pipeline.reduce((sum, h) => sum + (parseFloat(h.subtotalGeneral || h.total / 1.16) || 0), 0);

        const mesActual = ahora.getMonth() + 1;
        const meta = metasComerciales.find(m => Number(m.mes) === mesActual)?.monto_meta || 1500000;
        const cumplimiento = Math.round((totalVenta / meta) * 100);

        const totalCobrado = cobranza.filter(c => c.estatus_pago === 'cobrado').reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);

        return {
            totalVenta,
            valorPipeline,
            cumplimiento,
            meta,
            totalCobrado,
            countLeads: clientes.filter(c => new Date(c.created_at) >= inicio).length
        };
    }, [historial, clientes, periodo, metasComerciales, cobranza]);

    return (
        <div className="space-y-12 animate-premium-fade pb-20">
            {/* Executive Masthead */}
            <div className="flex flex-col min-[1190px]:flex-row justify-between items-start min-[1190px]:items-end gap-6 sm:gap-10 border-b border-enterprise-100 pb-8 sm:pb-12 text-balance">
                <div className="space-y-3 sm:space-y-4">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-[#111111] text-white rounded-full shadow-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none">Global Sync Active</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl sm:text-2xl md:text-3xl min-[1190px]:text-4xl font-black text-enterprise-950 tracking-tighter leading-none uppercase italic italic-brand">
                            Media <span className="text-[#FF5900] not-italic">Intelligence</span>
                        </h1>
                        <p className="text-[10px] sm:text-[11px] font-bold text-enterprise-600 max-w-xl">
                            Estrategia y control de rendimiento comercial • TelevisaUnivision México.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-enterprise-100 shadow-xl overflow-hidden">
                        {['mes', 'anio'].map(v => (
                            <button
                                key={v}
                                onClick={() => setPeriodo(v)}
                                className={`px-4 sm:px-8 h-10 sm:h-12 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all
                                    ${periodo === v
                                        ? 'bg-enterprise-950 text-white shadow-xl'
                                        : 'text-enterprise-500 hover:text-enterprise-950 hover:bg-enterprise-50'}`}
                            >
                                {v === 'mes' ? 'Este Mes' : 'Año'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="w-14 h-14 bg-white text-enterprise-950 border border-enterprise-100 rounded-[1.25rem] flex items-center justify-center hover:bg-enterprise-950 hover:text-white hover:shadow-2xl transition-all active:scale-90 shadow-xl group"
                    >
                        <RefreshCw size={22} className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 min-[1190px]:grid-cols-4 gap-8">
                <StatCard
                    title="Venta Realizada"
                    value={statistics.totalVenta}
                    isCurrency
                    icon={DollarSign}
                    colorClass="bg-[#FF5900] text-white"
                    trend="24.1"
                />
                <StatCard
                    title="Cobranza Liquidada"
                    value={statistics.totalCobrado}
                    isCurrency
                    icon={CheckCircle2}
                    colorClass="bg-[#059669] text-white"
                />
                <StatCard
                    title="Pipeline Reservado"
                    value={statistics.valorPipeline}
                    isCurrency
                    icon={Activity}
                    colorClass="bg-[#111111] text-white"
                />
                <StatCard
                    title="Captación Mensual"
                    value={statistics.countLeads}
                    icon={Users}
                    colorClass="bg-enterprise-100 text-enterprise-900 border border-enterprise-200"
                />
            </div>

            {/* Performance Analysis & Strategic Actions */}
            <div className="grid grid-cols-1 min-[1190px]:grid-cols-12 gap-10">
                {/* Fulfillment Status */}
                <div className="min-[1190px]:col-span-8">
                    <div className="bg-[#111111] p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                        {/* Brand Decorative Corner */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5900] opacity-10 blur-[100px] -mr-40 -mt-40" />

                        <div className="flex flex-col desktop:flex-row justify-between items-start desktop:items-end gap-8 sm:gap-12 relative z-10">
                            <div className="space-y-4 sm:space-y-6">
                                <span className="text-[10px] sm:text-[11px] font-black text-[#FF5900] uppercase tracking-widest flex items-center gap-3">
                                    <Target size={16} /> KPI Status: High Performance
                                </span>
                                <div className="space-y-1 sm:space-y-2">
                                    <h2 className="text-5xl sm:text-6xl min-[1190px]:text-7xl font-black tracking-tighter leading-none">{statistics.cumplimiento}%</h2>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest italic leading-none">Operational Goal Fulfillment</p>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] backdrop-blur-md w-full min-[1190px]:w-auto">
                                <span className="block text-[9px] sm:text-[10px] font-black text-white/50 uppercase tracking-widest mb-1 sm:mb-2 text-left min-[1190px]:text-right">Target Amount</span>
                                <span className="text-2xl sm:text-4xl font-black tracking-tight">{formatMXN(statistics.meta, 0)}</span>
                                <div className="flex items-center justify-start min-[1190px]:justify-end gap-2 mt-2 sm:mt-3 text-[#34d399]">
                                    <TrendingUp size={14} sm:size={16} />
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Optimized Track</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="mt-10 sm:mt-20 space-y-6 sm:space-y-8 relative z-10">
                            <div className="h-6 sm:h-8 bg-white/5 rounded-full p-1.5 sm:p-2 border border-white/10">
                                <div
                                    className="h-full bg-brand-orange rounded-full shadow-brand shadow-2xl transition-all duration-1000 ease-out flex items-center justify-end pr-3 overflow-hidden"
                                    style={{ width: `${Math.min(statistics.cumplimiento, 100)}%` }}
                                >
                                    {statistics.cumplimiento > 5 && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-4">
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Current Revenue</span>
                                        <span className="text-base sm:text-lg font-black">{formatMXN(statistics.totalVenta, 0)}</span>
                                    </div>
                                    <div className="w-px h-8 sm:h-10 bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest text-brand-orange">Shortfall (Gap)</span>
                                        <span className="text-base sm:text-lg font-black text-brand-orange/90">{formatMXN(Math.max(0, statistics.meta - statistics.totalVenta), 0)}</span>
                                    </div>
                                </div>
                                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest flex items-center gap-3 text-white/60 hover:text-white transition-colors cursor-pointer">
                                    Full Audit Report <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Strategic Actions */}
                <div className="min-[1190px]:col-span-4 space-y-6">
                    <button
                        onClick={iniciarNuevaCotizacion}
                        className="w-full group bg-univision-gradient p-[2px] rounded-[2.5rem] shadow-2xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="bg-[#111111] p-10 rounded-[2.4rem] flex items-center justify-between text-white overflow-hidden relative">
                            {/* Circle decoration reflecting new logo */}
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-univision-gradient rounded-full opacity-10 blur-3xl group-hover:opacity-30 transition-opacity"></div>

                            <div className="relative z-10 flex flex-col items-start gap-6">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-[#FF5900] group-hover:text-white transition-all shadow-md">
                                    <Zap size={24} className="fill-current" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-[11px] font-black uppercase tracking-widest opacity-50 mb-1 leading-none">Intelligence Engine</span>
                                    <span className="text-xl font-black uppercase leading-tight italic italic-brand">Generar Nueva<br />Cotización</span>
                                </div>
                            </div>
                            <div className="absolute right-[-30px] top-[-30px] opacity-10 group-hover:opacity-20 transition-opacity">
                                <Calculator className="w-48 h-48" />
                            </div>
                        </div>
                    </button>

                    <div className="grid grid-cols-2 gap-6">
                        <button
                            onClick={() => setVistaActual('reportes')}
                            className="bg-white p-8 rounded-[2.5rem] border border-enterprise-100 flex flex-col gap-6 text-left shadow-premium hover:border-brand-orange transition-all group"
                        >
                            <div className="w-12 h-12 bg-enterprise-50 rounded-2xl flex items-center justify-center text-enterprise-400 group-hover:bg-brand-orange/5 group-hover:text-brand-orange transition-all">
                                <BarChart3 size={24} />
                            </div>
                            <span className="text-[10px] font-black text-enterprise-950 uppercase tracking-widest leading-tight">Analytics<br />Reports</span>
                        </button>
                        <button
                            onClick={() => setVistaActual('crm')}
                            className="bg-white p-8 rounded-[2.5rem] border border-enterprise-100 flex flex-col gap-6 text-left shadow-premium hover:border-enterprise-950 transition-all group"
                        >
                            <div className="w-12 h-12 bg-enterprise-50 rounded-2xl flex items-center justify-center text-enterprise-400 group-hover:bg-enterprise-950 group-hover:text-white transition-all">
                                <Activity size={24} />
                            </div>
                            <span className="text-[10px] font-black text-enterprise-950 uppercase tracking-widest leading-tight">Pipeline<br />Manager</span>
                        </button>
                    </div>

                    {/* Quick System Health */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-enterprise-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[10px] font-black text-enterprise-500 uppercase tracking-widest leading-none">Real-time DB Sync</span>
                        </div>
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-8 h-8 border-2 border-white bg-enterprise-100 rounded-full flex items-center justify-center text-[10px] font-black ${i === 1 ? 'bg-orange-50 text-brand-orange' : i === 2 ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {i}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
