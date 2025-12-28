import React, { useMemo, useState } from 'react';
import {
    Users,
    FileText,
    DollarSign,
    TrendingUp,
    Clock,
    Briefcase,
    ArrowUpRight,
    Zap,
    PlusCircle,
    Calendar,
    ChevronRight,
    MapPin,
    Tv,
    LayoutDashboard,
    Target,
    RefreshCw,
    Filter,
    BarChart3,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const MISSING_DATA_CHAR = '0.00';

const StatCard = ({ title, value, icon: Icon, color, isCurrency = false }) => (
    <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg border border-gray-100 flex items-center gap-2 md:gap-4 transition-all hover:border-red-200 h-full">
        <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${color} flex-shrink-0`}>
            <Icon size={14} className="md:w-[18px] md:h-[18px]" />
        </div>
        <div className="min-w-0">
            <p className="text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 truncate">{title}</p>
            <p className="text-xs md:text-base font-black text-slate-900 tracking-tighter leading-none truncate">
                {isCurrency ? formatMXN(value) : value}
            </p>
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
    const [criterioFecha, setCriterioFecha] = useState('comercial'); // 'comercial' o 'sistema'
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await actualizarDashboard?.();
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const { totalHistorial, totalLeads } = useMemo(() => {
        const ahora = new Date();
        const inicio = new Date();
        if (periodo === 'dia') inicio.setHours(0, 0, 0, 0);
        else if (periodo === 'semana') inicio.setDate(ahora.getDate() - ahora.getDay());
        else if (periodo === 'mes') inicio.setDate(1);
        else if (periodo === 'anio') inicio.setMonth(0, 1);
        inicio.setHours(0, 0, 0, 0);

        const filteredH = historial.filter(h => {
            const dateStr = criterioFecha === 'comercial'
                ? (h.fecha_cierre_real || h.fecha)
                : h.fecha_registro_sistema;

            if (!dateStr) return false;
            const itemDate = new Date(dateStr);
            return itemDate >= inicio && itemDate <= ahora;
        });

        const filteredC = clientes.filter(c => new Date(c.created_at) >= inicio);

        return { totalHistorial: filteredH, totalLeads: filteredC };
    }, [historial, clientes, periodo, criterioFecha]);

    const salesStats = useMemo(() => {
        const ganadas = totalHistorial.filter(h => h.estatus === 'ganada');
        const totalVenta = ganadas.reduce((sum, h) => sum + (parseFloat(h.subtotalGeneral || h.total / 1.16) || 0), 0);
        const pipeline = totalHistorial.filter(h => h.estatus !== 'ganada' && h.estatus !== 'perdida');
        const valorPipeline = pipeline.reduce((sum, h) => sum + (parseFloat(h.subtotalGeneral || h.total / 1.16) || 0), 0);

        const mesActual = new Date().getMonth() + 1;
        const meta = metasComerciales.find(m => Number(m.mes) === mesActual)?.monto_meta || 1500000;
        const cumplimiento = ((totalVenta / meta) * 100).toFixed(1);

        const ventaVIX = ganadas.reduce((sum, h) => sum + (parseFloat(h.costoVIX || (h.paqueteVIX?.inversion) || 0)), 0);

        // Cobranza Stats
        const totalFacturado = cobranza.reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);
        const totalCobrado = cobranza
            .filter(c => c.estatus_pago === 'cobrado')
            .reduce((sum, c) => sum + (parseFloat(c.monto_facturado) || 0), 0);
        const pendienteCobro = totalFacturado - totalCobrado;

        return {
            totalVenta,
            valorPipeline,
            cumplimiento,
            meta,
            ventaVIX,
            countLeads: totalLeads.length,
            countCotz: totalHistorial.length,
            totalFacturado,
            totalCobrado,
            pendienteCobro
        };
    }, [totalHistorial, totalLeads, metasComerciales, cobranza]);

    const topPlazas = useMemo(() => {
        const p = {};
        totalHistorial.filter(h => h.estatus === 'ganada').forEach(h => {
            const plaza = h.cliente?.plaza || 'Mérida';
            p[plaza] = (p[plaza] || 0) + (parseFloat(h.subtotalGeneral || h.total / 1.16) || 0);
        });
        return Object.entries(p).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [totalHistorial]);

    const ventaPorCanal = useMemo(() => {
        const c = {};
        const ganadas = totalHistorial.filter(h => h.estatus === 'ganada');
        ganadas.forEach(q => {
            (q.items || []).forEach(item => {
                const canal = item.producto?.canal || 'Otros';
                c[canal] = (c[canal] || 0) + (item.subtotal || 0);
            });
            const costoVIX = parseFloat(q.costoVIX || (q.paqueteVIX?.inversion) || 0);
            if (costoVIX > 0) c['VIX'] = (c['VIX'] || 0) + costoVIX;
        });
        return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [totalHistorial]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

            {/* Header Super Compacto (ALINEACIÓN HORIZONTAL) */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 md:p-4 rounded-2xl shadow-xl border border-gray-100 gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-200">
                        <LayoutDashboard className="text-white" size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm md:text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">Monitor Ejecutivo</h2>
                        <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Inteligencia Comercial</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                        {[
                            { id: 'comercial', label: '$', icon: TrendingUp, title: 'Venta' },
                            { id: 'sistema', label: 'CP', icon: Briefcase, title: 'Sistema' }
                        ].map(c => (
                            <button
                                key={c.id}
                                onClick={() => setCriterioFecha(c.id)}
                                className={`px-2 md:px-4 py-1 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${criterioFecha === c.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                title={c.title}
                            >
                                <c.icon size={10} />
                                <span className="hidden xs:inline">{c.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                        {['mes', 'anio'].map(v => (
                            <button
                                key={v}
                                onClick={() => setPeriodo(v)}
                                className={`px-2 md:px-4 py-1 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${periodo === v ? 'bg-white text-red-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {v === 'mes' ? 'Mes' : 'Anual'}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleRefresh} className={`p-1.5 bg-slate-900 text-white rounded-lg hover:bg-red-600 transition-all shadow-md active:scale-95 flex-shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}>
                        <RefreshCw size={12} />
                    </button>
                </div>
            </div>

            {/* Row 1: Stats Principales (ALINEACIÓN CUADRICULADA) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                <StatCard title={criterioFecha === 'comercial' ? "Venta Neta" : "Netificado Sistema"} value={salesStats.totalVenta} isCurrency icon={criterioFecha === 'comercial' ? DollarSign : Briefcase} color={criterioFecha === 'comercial' ? "bg-emerald-50 text-emerald-600" : "bg-blue-600 text-white"} />
                <StatCard title="Facturado" value={salesStats.totalFacturado} isCurrency icon={FileText} color="bg-blue-50 text-blue-600" />
                <StatCard title="Cobrado" value={salesStats.totalCobrado} isCurrency icon={CheckCircle2} color="bg-emerald-500 text-white" />
                <StatCard title="Pipeline Vivo" value={salesStats.valorPipeline} isCurrency icon={TrendingUp} color="bg-slate-900 text-white" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 lg:hidden">
                <StatCard title="Nuevos Leads" value={salesStats.countLeads} icon={Users} color="bg-purple-50 text-purple-600" />
                <StatCard title="Cotizaciones" value={salesStats.countCotz} icon={FileText} color="bg-red-50 text-red-600" />
            </div>

            {/* Grid Principal estructurado para coincidencia Horizontal/Vertical */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                {/* BLOQUE IZQUIERDO (Largo 8) */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Tarjeta de Meta (Row 1 del Bloque) */}
                    <div className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col justify-center flex-1">
                        <div className="flex justify-between items-end mb-5">
                            <div>
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] block mb-2">Desempeño / Objetivo</span>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                    {salesStats.cumplimiento}% <span className="text-[11px] text-gray-300 font-bold tracking-normal italic">Cumplido</span>
                                </h3>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta: {formatMXN(salesStats.meta)}</p>
                                <p className="text-[11px] font-black text-emerald-600 uppercase mt-1">{formatMXN(salesStats.totalVenta)}</p>
                            </div>
                        </div>
                        <div className="h-5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full shadow-lg transition-all duration-1000"
                                style={{ width: `${Math.min(salesStats.cumplimiento, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-4">
                            <span className="text-[9px] font-bold text-gray-300 uppercase italic">Inversión Neta {periodo}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Faltante: {formatMXN(Math.max(0, salesStats.meta - salesStats.totalVenta))}</span>
                        </div>
                    </div>

                    {/* Tarjeta VIX Share (Row 2 del Bloque) */}
                    <div className="bg-slate-900 p-5 md:p-7 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[180px]">
                        <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10">
                            <Tv size={80} className="text-red-500 md:w-[140px] md:h-[140px]" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
                            <div className="max-w-md text-center md:text-left">
                                <h4 className="text-[10px] md:text-[12px] font-black text-red-500 uppercase tracking-[0.4em] mb-1.5 md:mb-3 flex items-center justify-center md:justify-start gap-2">
                                    Digital Power <Zap size={10} className="fill-red-500" />
                                </h4>
                                <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase leading-tight">VIX Digital Share</h3>
                                <p className="text-[9px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest italic opacity-60">Consolidado de pauta en streaming</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 md:p-5 rounded-2xl md:rounded-3xl backdrop-blur-xl w-full md:min-w-[240px] shadow-2xl">
                                <div className="flex justify-between items-center mb-2 md:mb-3">
                                    <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">Inversión VIX</span>
                                    <span className="text-xs md:text-sm font-black text-red-500">{formatMXN(salesStats.ventaVIX)}</span>
                                </div>
                                <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.7)]"
                                        style={{ width: `${(salesStats.ventaVIX / (salesStats.totalVenta || 1)) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 md:mt-3 text-[8px] md:text-[10px] font-black uppercase italic">
                                    <span className="text-slate-500 lowercase tracking-normal">share digital</span>
                                    <span className="text-slate-400">
                                        {((salesStats.ventaVIX / (salesStats.totalVenta || 1)) * 100).toFixed(1)}% del Total
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* BLOQUE DERECHO (Largo 4) - ALINEACIONES VERTICALES CON EL IZQUIERDO */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Tabla de Plazas (Row 1 del Sidebar) */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
                        <div className="p-5 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-red-600" />
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Top Plazas</h4>
                            </div>
                            <span className="text-[9px] font-black text-slate-300 uppercase italic">Venta Neta</span>
                        </div>
                        <div className="p-3">
                            <table className="w-full">
                                <tbody className="divide-y divide-gray-50">
                                    {topPlazas.length > 0 ? topPlazas.map(([ciudad, monto], i) => (
                                        <tr key={ciudad} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-slate-200">#0{i + 1}</span>
                                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">{ciudad}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <span className="text-[11px] font-black text-slate-900">{formatMXN(monto)}</span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="2" className="py-12 text-center text-[10px] font-bold text-gray-300 uppercase italic tracking-widest">Sin cierres registrados</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tabla de Canales (Row 2 del Sidebar) */}
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
                        <div className="p-4 md:p-5 bg-red-50/30 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Tv size={14} className="text-red-500 md:w-[16px] md:h-[16px]" />
                                <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-widest">Mezcla Canales</h4>
                            </div>
                            <span className="text-[8px] md:text-[9px] font-black text-red-300 uppercase italic">Share</span>
                        </div>
                        <div className="p-2 md:p-3">
                            <table className="w-full">
                                <tbody className="divide-y divide-gray-50">
                                    {ventaPorCanal.length > 0 ? ventaPorCanal.map(([canal, monto]) => (
                                        <tr key={canal} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-2.5 md:py-3 px-2 md:px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-red-500"></div>
                                                    <span className="text-[10px] md:text-[11px] font-bold text-slate-700 uppercase tracking-tighter">{canal}</span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 md:py-3 px-2 md:px-3 text-right">
                                                <span className="text-[10px] md:text-[11px] font-black text-red-600">{formatMXN(monto)}</span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="2" className="py-8 md:py-12 text-center text-[9px] md:text-[10px] font-bold text-gray-300 uppercase italic tracking-widest">Sin datos</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* Accesos Rápidos - ALINEACIÓN TOTAL INFERIOR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => setVistaActual('crm')}
                    className="p-5 bg-slate-900 text-white rounded-3xl flex items-center justify-between group hover:bg-red-600 transition-all shadow-xl active:scale-95"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-2.5 rounded-xl"><Target size={18} /></div>
                        <div>
                            <span className="text-[11px] font-black uppercase tracking-widest block">Pipeline / CRM</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 group-hover:text-white/60">Seguimiento de Leads</span>
                        </div>
                    </div>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                    onClick={() => setVistaActual('reportes')}
                    className="p-5 bg-white border border-gray-100 text-slate-800 rounded-3xl flex items-center justify-between group hover:border-red-600 transition-all shadow-lg active:scale-95"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-50 p-2.5 rounded-xl text-red-600"><BarChart3 size={18} /></div>
                        <div>
                            <span className="text-[11px] font-black uppercase tracking-widest block">Análisis de Datos</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Matrices y Totales</span>
                        </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-red-600 transition-colors" />
                </button>

                <button
                    onClick={iniciarNuevaCotizacion}
                    className="p-5 bg-emerald-600 text-white rounded-3xl flex items-center justify-between group hover:bg-emerald-700 transition-all shadow-xl active:scale-95"
                >
                    <div className="flex items-center gap-4 text-left">
                        <div className="bg-white/20 p-2.5 rounded-xl"><PlusCircle size={18} /></div>
                        <div>
                            <span className="text-[11px] font-black uppercase tracking-widest block">Nueva Inversión</span>
                            <span className="text-[9px] font-bold text-white/70 uppercase tracking-tighter mt-1 block">Lanzar Cotizador</span>
                        </div>
                    </div>
                    <Zap size={18} className="fill-white group-hover:animate-pulse" />
                </button>
            </div>

        </div>
    );
};

export default DashboardView;
