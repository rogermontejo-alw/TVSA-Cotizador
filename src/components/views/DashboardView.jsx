import React, { useMemo, useState } from 'react';
import {
    Users, DollarSign, TrendingUp, Zap, RefreshCw, BarChart3,
    CheckCircle2, PieChart, Activity, Target, Tv, Globe,
    ChevronDown, ChevronRight, ArrowUpRight, Calculator, Briefcase, Clock,
    AlertCircle, Flame, ShieldCheck, ArrowRight, Wallet
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const KPINode = ({ title, value, subtext, icon: Icon, colorClass, isCurrency = true, trend = null, status = 'neutral' }) => (
    <div className="bg-white rounded-[2rem] p-5 border border-enterprise-100 shadow-sm hover:shadow-xl hover:border-brand-orange/20 transition-all duration-500 group animate-premium-fade relative overflow-hidden">
        {status === 'warning' && <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 blur-2xl rounded-full -mr-10 -mt-10" />}
        <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon size={20} strokeWidth={2.5} />
            </div>
            {trend !== null && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[8.5px] font-black uppercase tracking-tighter ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {trend >= 0 ? <TrendingUp size={10} /> : <Activity size={10} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div>
            <p className="text-[8px] font-black text-enterprise-300 uppercase tracking-[0.2em] mb-1">{title}</p>
            <h3 className="text-xl font-black text-enterprise-950 tracking-tighter italic">
                {isCurrency ? formatMXN(value, 0) : value}
            </h3>
            {subtext && <p className="text-[7.5px] font-bold text-enterprise-400 mt-1 uppercase tracking-wider">{subtext}</p>}
        </div>
    </div>
);

const FunnelStep = ({ label, value, icon: Icon, index, total, color = "brand-orange" }) => {
    const colorClasses = {
        'brand-orange': 'bg-brand-orange shadow-brand-orange/20',
        'blue-600': 'bg-blue-600 shadow-blue-600/20',
        'emerald-500': 'bg-emerald-500 shadow-emerald-500/20'
    };
    const activeColor = colorClasses[color] || 'bg-enterprise-950 shadow-enterprise-950/20';
    const isLast = index === total - 1;

    return (
        <div className="relative flex-1 w-full min-w-0">
            <div className={`
                bg-white border border-enterprise-100 p-3 sm:p-4 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-all relative
                ${!isLast ? 'pr-10 sm:pr-12' : ''}
            `}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg text-white shadow-enterprise-900/10 ${activeColor}`}>
                    <Icon size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[7.5px] sm:text-[8px] font-black text-enterprise-400 uppercase tracking-widest leading-tight mb-1">{label}</p>
                    <p className="text-xs sm:text-sm font-black text-enterprise-950 italic">{formatMXN(value, 0)}</p>
                </div>

                {/* Flecha INCRUSTADA */}
                {!isLast && (
                    <div className={`
                        absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center
                        ${index === 1 ? 'sm:hidden lg:flex' : ''}
                    `}>
                        {/* Desktop/Tablet: Flecha derecha */}
                        <ArrowRight className="text-brand-orange/30 hidden sm:block" size={18} strokeWidth={3} />

                        {/* Móvil: Chevron abajo */}
                        <ChevronDown className="text-brand-orange/30 sm:hidden" size={16} strokeWidth={4} />
                    </div>
                )}
            </div>
        </div>
    );
};

const DashboardView = ({
    historial = [],
    clientes = [],
    cobranza = [],
    contratosEjecucion = [],
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

    const stats = useMemo(() => {
        // Forzar tiempo de Mérida (UTC-6)
        const getMeridaNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Merida" }));
        const ahora = getMeridaNow();

        // Helper para comparar fechas sin desfase UTC (solo año-mes-día)
        const isDateInPeriod = (dateStr, start, end) => {
            if (!dateStr) return false;
            // Forzar interpretación como fecha local (YYYY/MM/DD) o desglosar
            const [y, m, d] = dateStr.includes('T') ? dateStr.split('T')[0].split('-') : dateStr.split('-');
            const date = new Date(y, m - 1, d);
            return date >= start && date <= end;
        };

        const inicio = new Date(ahora);
        if (periodo === 'mes') {
            inicio.setDate(1);
        } else {
            inicio.setMonth(0, 1);
        }
        inicio.setHours(0, 0, 0, 0);

        // 1. PIPELINE (Cotizaciones)
        const openQuotes = historial.filter(h => (h.estatus === 'borrador' || h.estatus === 'enviada'));
        const totalPipelineValue = openQuotes.reduce((sum, h) => sum + (parseFloat(h.subtotalGeneral || h.total / 1.16) || 0), 0);

        // 2. FORECAST (Ganadas sin contrato aún)
        const wonNoContract = historial.filter(h =>
            h.estatus === 'ganada' &&
            !(contratosEjecucion || []).some(ce => ce.cotizacion_id === h.id)
        );
        const totalForecastValue = wonNoContract.reduce((sum, h) => sum + (parseFloat(h.subtotalGeneral || h.total / 1.16) || 0), 0);

        // 3. REAL EXECUTION (CONTRATOS) - LA BASE DE LA META
        const periodExecutions = (contratosEjecucion || []).filter(ce => {
            return isDateInPeriod(ce.fecha_inicio_pauta, inicio, ahora);
        });
        const totalRealContracted = periodExecutions.reduce((sum, ce) => sum + (parseFloat(ce.monto_ejecucion) || 0), 0);

        // 4. FACTURACIÓN Y COBRANZA
        const periodBilling = cobranza.filter(c => {
            const dateStr = c.fecha_facturacion || c.updated_at;
            return isDateInPeriod(dateStr, inicio, ahora);
        });
        const totalBilled = periodBilling.reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);
        const totalCollected = periodBilling.filter(c => c.estatus_pago === 'cobrado').reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);

        // META LOGIC
        const mesActual = ahora.getMonth() + 1;
        const metaMonto = metasComerciales.find(m => Number(m.mes) === mesActual)?.monto_meta || 1500000;
        const cumplimiento = Math.round((totalRealContracted / metaMonto) * 100);

        // EXPERT METRICS: Aging & Velocity
        let avgVelocityDays = 0;
        if (periodExecutions.length > 0) {
            const sumDays = periodExecutions.reduce((acc, ce) => {
                const quote = historial.find(h => h.id === ce.cotizacion_id);
                if (!quote) return acc;
                const d1 = new Date(quote.created_at);
                const d2 = new Date(ce.created_at);
                return acc + (d2 - d1) / (1000 * 60 * 60 * 24);
            }, 0);
            avgVelocityDays = Math.round(sumDays / periodExecutions.length);
        }

        // DSO (Days Sales Outstanding)
        const collectedItems = cobranza.filter(c => c.estatus_pago === 'cobrado' && c.fecha_cobro_real);
        let dsoDays = 0;
        if (collectedItems.length > 0) {
            const sumDSO = collectedItems.reduce((acc, c) => {
                const d1 = new Date(c.fecha_facturacion || c.created_at);
                const d2 = new Date(c.fecha_cobro_real);
                return acc + (d2 - d1) / (1000 * 60 * 60 * 24);
            }, 0);
            dsoDays = Math.round(sumDSO / collectedItems.length);
        }

        // COMMISSIONS (15% of Collected)
        const totalCollectedPeriod = periodBilling
            .filter(c => c.estatus_pago === 'cobrado' && c.fecha_cobro_real)
            .filter(c => {
                const d = new Date(c.fecha_cobro_real);
                return d >= inicio && d <= ahora;
            })
            .reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);

        const commissionsGenerated = totalCollectedPeriod * 0.15;
        const commissionsPotential = (totalBilled - totalCollected) * 0.15;

        return {
            totalPipelineValue,
            totalForecastValue,
            totalRealContracted,
            totalBilled,
            totalCollected,
            metaMonto,
            cumplimiento,
            avgVelocityDays,
            dsoDays,
            commissionsGenerated,
            commissionsPotential,
            countOpen: openQuotes.length,
            countWonNoContract: wonNoContract.length,
            countExecutions: periodExecutions.length
        };
    }, [historial, cobranza, contratosEjecucion, metasComerciales, periodo, clientes]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-premium-fade pb-20 px-4">

            {/* NEXUS COMMAND HEADER */}
            <div className="pt-4 pb-2 bg-enterprise-50">
                <div className="bg-enterprise-950 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 shadow-2xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-orange/10 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3 sm:gap-5">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-orange shadow-inner">
                                <Activity size={20} className="sm:w-7 sm:h-7" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-2xl font-black text-white uppercase italic leading-none tracking-tighter">
                                    COMANDO <span className="text-brand-orange">INTELIGENTE</span> NEXUS
                                </h1>
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                                    SISTEMA DE AUDITORÍA FINANCIERA <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> V1.9.7
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                            {['mes', 'anio'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setPeriodo(v)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${periodo === v ? 'bg-brand-orange text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    {v === 'mes' ? 'Corte Mensual' : 'Ciclo Anual'}
                                </button>
                            ))}
                            <button onClick={handleRefresh} className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white hover:text-enterprise-950 transition-all">
                                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* THE CONVERSION FUNNEL (EXPERT FLOW) */}
            <div className="bg-enterprise-950/5 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-enterprise-100 shadow-inner">
                <div className="flex items-center gap-3 mb-6 sm:mb-8 ml-1">
                    <Target size={14} className="text-brand-orange" />
                    <h2 className="text-[9px] sm:text-[10px] font-black text-enterprise-950 uppercase tracking-[0.3em]">Embudo de Conversión Crítica</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FunnelStep index={0} total={4} label="Oportunidad (Pipeline)" value={stats.totalPipelineValue} icon={Zap} color="blue-600" />
                    <FunnelStep index={1} total={4} label="Venta Real (Contratos)" value={stats.totalRealContracted} icon={Briefcase} color="brand-orange" />
                    <FunnelStep index={2} total={4} label="Facturado (Emitido)" value={stats.totalBilled} icon={BarChart3} color="enterprise-950" />
                    <FunnelStep index={3} total={4} label="Recaudado (Liquidez)" value={stats.totalCollected} icon={Wallet} color="emerald-500" />
                </div>
            </div>

            {/* SECONDARY KPIs & VELOCITY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPINode
                    title="Meta de Contratación"
                    value={stats.cumplimiento}
                    isCurrency={false}
                    icon={Target}
                    colorClass="bg-enterprise-950 text-white"
                    subtext={`Meta: ${formatMXN(stats.metaMonto, 0)}`}
                    trend={stats.cumplimiento}
                />
                <KPINode
                    title="Forecast (Por Formalizar)"
                    value={stats.totalForecastValue}
                    icon={Clock}
                    colorClass="bg-brand-orange text-white"
                    subtext={`${stats.countWonNoContract} Ventas esperando contrato`}
                    status={stats.countWonNoContract > 5 ? 'warning' : 'neutral'}
                />
                <KPINode
                    title="Velocidad de Cierre"
                    value={stats.avgVelocityDays}
                    isCurrency={false}
                    icon={TrendingUp}
                    colorClass="bg-blue-600 text-white"
                    subtext="Días Promedio (Lead-to-Contract)"
                />
                <KPINode
                    title="Ciclo de Cobranza (DSO)"
                    value={stats.dsoDays}
                    isCurrency={false}
                    icon={RefreshCw}
                    colorClass="bg-emerald-500 text-white"
                    subtext="Días para recuperar liquidez"
                />
            </div>

            {/* MAIN PERFORMANCE SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Fulfillment Mastery */}
                <div className="lg:col-span-8 bg-[#0a0a0a] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange opacity-10 blur-[100px] -mr-48 -mt-48" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                        <div>
                            <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] flex items-center gap-2">
                                <ShieldCheck size={14} /> DESEMPEÑO DE CUENTA REAL
                            </span>
                            <div className="mt-4 flex items-baseline gap-6">
                                <h2 className="text-5xl sm:text-7xl font-black tracking-tighter italic italic-brand">{stats.cumplimiento}%</h2>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest italic leading-none">CUMPLIMIENTO BASE CONTRATO</p>
                                    <p className="text-[14px] font-black text-emerald-400 tracking-tight leading-none">{formatMXN(stats.totalRealContracted)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl group hover:border-brand-orange/50 transition-all">
                            <span className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 text-right">CUOTA DEL PERIODO</span>
                            <span className="text-3xl font-black tracking-tight italic group-hover:text-brand-orange transition-colors">{formatMXN(stats.metaMonto, 0)}</span>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="h-4 bg-white/5 rounded-full p-1 border border-white/10 overflow-hidden">
                            <div
                                className="h-full bg-univision-gradient rounded-full shadow-[0_0_30px_rgba(255,102,0,0.3)] transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(stats.cumplimiento, 100)}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-white/5">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Formalización de Cartera</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-2xl font-black text-blue-400 italic">
                                        {Math.round((stats.totalRealContracted / Math.max(1, stats.totalRealContracted + stats.totalForecastValue)) * 100)}%
                                    </p>
                                    <span className="text-[8px] font-bold text-white/20 uppercase">Contratado vs Ganado</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Eficiencia de Cobro</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-2xl font-black text-emerald-400 italic">
                                        {Math.round((stats.totalCollected / Math.max(1, stats.totalBilled)) * 100)}%
                                    </p>
                                    <span className="text-[8px] font-bold text-white/20 uppercase">Recaudado vs Facturado</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Gap de Liquidez</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-2xl font-black text-red-400 italic">
                                        {formatMXN(stats.totalBilled - stats.totalCollected, 0)}
                                    </p>
                                    <span className="text-[8px] font-bold text-white/20 uppercase">Cuentas por cobrar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <button
                        onClick={iniciarNuevaCotizacion}
                        className="w-full group bg-enterprise-950 p-[2px] rounded-[2.5rem] transition-all hover:scale-[1.02] shadow-xl active:scale-[0.98]"
                    >
                        <div className="bg-enterprise-950 border border-white/5 p-8 rounded-[2.4rem] flex flex-col items-center justify-center text-white gap-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-brand-orange/5 group-hover:bg-brand-orange/10 transition-colors" />
                            <div className="w-16 h-16 bg-brand-orange rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(255,102,0,0.4)] group-hover:rotate-12 transition-transform">
                                <Zap size={32} strokeWidth={2.5} />
                            </div>
                            <div className="text-center relative z-10">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Nueva Operación</h3>
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mt-1">SISTEMA DE GENERACIÓN RÁPIDA</p>
                            </div>
                        </div>
                    </button>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-enterprise-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertCircle size={16} className="text-brand-orange" />
                            <h4 className="text-[10px] font-black text-enterprise-950 uppercase tracking-[0.25em]">Alertas Estratégicas</h4>
                        </div>

                        <div className="space-y-4">
                            {stats.countWonNoContract > 0 && (
                                <div className="p-4 bg-brand-orange/5 border border-brand-orange/10 rounded-2xl group hover:bg-brand-orange/10 transition-all cursor-pointer" onClick={() => setVistaActual('master-contracts')}>
                                    <p className="text-[8px] font-black text-brand-orange uppercase mb-1">Cero Formalización</p>
                                    <p className="text-[11px] font-bold text-enterprise-800">
                                        Tienes <span className="font-black underline">{stats.countWonNoContract} cierres</span> retenidos sin contrato de operación.
                                    </p>
                                </div>
                            )}

                            {stats.totalBilled - stats.totalCollected > 0 && (
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl group hover:bg-emerald-500/10 transition-all cursor-pointer" onClick={() => setVistaActual('cobranza')}>
                                    <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Riesgo de Cartera</p>
                                    <p className="text-[11px] font-bold text-enterprise-800">
                                        Hay <span className="font-black">{formatMXN(stats.totalBilled - stats.totalCollected, 0)}</span> en facturas fuera de plazo.
                                    </p>
                                </div>
                            )}

                            <div className="p-4 bg-enterprise-50 border border-enterprise-100 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black text-enterprise-400 uppercase mb-0.5">Sincronización</p>
                                    <p className="text-[10px] font-black text-enterprise-900 uppercase">En Tiempo Real</p>
                                </div>
                                <ShieldCheck size={20} className="text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CRITICAL ATTENTION TABLE */}
            <div className="bg-white rounded-[3rem] border border-enterprise-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-enterprise-50 flex items-center justify-between bg-enterprise-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-enterprise-950 rounded-xl flex items-center justify-center text-brand-orange">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-enterprise-950 uppercase tracking-[0.2em]">Cierres Pendientes de Formalización</h4>
                            <p className="text-[9px] font-bold text-enterprise-400 uppercase tracking-widest mt-0.5">Ventas que no están sumando a la meta real</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-4 py-1.5 rounded-full uppercase italic">
                        {stats.countWonNoContract} Bloqueos Administrativos
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-enterprise-50/30 text-enterprise-400 font-black uppercase text-[8.5px] tracking-widest border-b border-enterprise-50">
                                <th className="px-10 py-5">Socio Comercial</th>
                                <th className="px-10 py-5">Valor de Oportunidad</th>
                                <th className="px-10 py-5 text-center">Días de Estancamiento</th>
                                <th className="px-10 py-5 text-right">Estatus Proyectado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-enterprise-50">
                            {historial.filter(h =>
                                h.estatus === 'ganada' &&
                                !(contratosEjecucion || []).some(ce => ce.cotizacion_id === h.id)
                            ).slice(0, 5).map((h, i) => (
                                <tr key={i} className="hover:bg-enterprise-50/30 transition-all group">
                                    <td className="px-10 py-6">
                                        <p className="text-[11px] font-black text-enterprise-950 uppercase">{h.cliente?.nombre_empresa || 'N/A'}</p>
                                        <p className="text-[9px] font-bold text-enterprise-300 uppercase italic mt-1">{h.folio}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-[12px] font-black text-enterprise-950">{formatMXN(h.subtotalGeneral || h.total / 1.16)}</p>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg text-red-600 font-black text-[10px]">
                                            <Flame size={12} className="animate-pulse" />
                                            {h.fecha_cierre_real ? Math.round((new Date() - new Date(h.fecha_cierre_real)) / (1000 * 60 * 60 * 24)) : '?'} DÍAS
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <span className="text-[9px] font-black text-brand-orange uppercase italic tracking-widest border-b-2 border-brand-orange/20 pb-1 group-hover:border-brand-orange transition-all">
                                            CONTRATO PENDIENTE
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {stats.countWonNoContract === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <ShieldCheck size={48} className="text-emerald-500" />
                                            <p className="text-[11px] font-black text-enterprise-950 uppercase tracking-[0.3em] italic">Pipeline Formalizado al 100%</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* COMISIONAMIENTO (FINAL DE PÁGINA) */}
            <div className="bg-enterprise-950 rounded-[3rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -mr-32 -mb-32" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <DollarSign size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-1">Incentivos y Comisiones</h3>
                            <h4 className="text-3xl font-black text-white italic tracking-tighter italic-brand">
                                {formatMXN(stats.commissionsGenerated)}
                                <span className="text-lg text-white/40 ml-4 font-bold not-italic">GENERADOS ESTE PERIODO</span>
                            </h4>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-3xl backdrop-blur-xl">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Potencial por Cobrar</p>
                            <p className="text-xl font-black text-indigo-300">{formatMXN(stats.commissionsPotential, 0)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
