import React, { useMemo, useState } from 'react';
import {
    Users,
    FileText,
    DollarSign,
    TrendingUp,
    Clock,
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
    Filter
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const StatCard = ({ title, value, icon: Icon, color, trendValue, isCurrency = false }) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col justify-between transition-all hover:scale-[1.02]">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-4 rounded-2xl ${color}`}>
                <Icon size={22} />
            </div>
            {trendValue !== undefined && (
                <div className={`flex items-center gap-1 ${trendValue >= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'} px-2.5 py-1 rounded-full text-[10px] font-black`}>
                    {trendValue >= 0 ? <ArrowUpRight size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                    {Math.abs(trendValue)}%
                </div>
            )}
        </div>
        <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
            <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none">
                {isCurrency ? formatMXN(value) : value}
            </p>
        </div>
    </div>
);

const DashboardView = ({
    historial,
    clientes,
    metasComerciales = [],
    setVistaActual,
    actualizarDashboard,
    iniciarNuevaCotizacion
}) => {
    const [periodo, setPeriodo] = useState('mes'); // dia, semana, mes, anio
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await actualizarDashboard();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    // 🕒 Lógica de filtrado por tiempo
    const datosFiltrados = useMemo(() => {
        const ahora = new Date();
        const inicio = new Date();

        if (periodo === 'dia') {
            inicio.setHours(0, 0, 0, 0);
        } else if (periodo === 'semana') {
            const diaSemana = ahora.getDay();
            inicio.setDate(ahora.getDate() - diaSemana);
            inicio.setHours(0, 0, 0, 0);
        } else if (periodo === 'mes') {
            inicio.setDate(1);
            inicio.setHours(0, 0, 0, 0);
        } else if (periodo === 'anio') {
            inicio.setMonth(0, 1);
            inicio.setHours(0, 0, 0, 0);
        }

        const historialFiltrado = historial.filter(h => {
            const fecha = new Date(h.created_at || h.fecha);
            return fecha >= inicio && fecha <= ahora;
        });

        const clientesNuevos = clientes.filter(c => {
            const fecha = new Date(c.created_at);
            return fecha >= inicio && fecha <= ahora;
        });

        return { historialFiltrado, clientesNuevos, inicio, ahora };
    }, [historial, clientes, periodo]);

    // 🎯 Meta Comercial basada en el mes actual del sistema (o el filtrado)
    const metaActual = useMemo(() => {
        const mesBusqueda = new Date().getMonth() + 1;
        const anioBusqueda = new Date().getFullYear();

        // Busqueda estricta asegurando tipos numericos
        const metaEncontrada = metasComerciales.find(m =>
            Number(m.mes) === Number(mesBusqueda) &&
            Number(m.anio) === Number(anioBusqueda)
        );

        return metaEncontrada?.monto_meta || 1500000; // Fallback 1.5M
    }, [metasComerciales]);

    const statsData = useMemo(() => {
        const { historialFiltrado } = datosFiltrados;

        const ventaCerrada = historialFiltrado
            .filter(q => q.estatus === 'ganada')
            .reduce((acc, q) => acc + (parseFloat(q.monto_total || q.total) || 0), 0);

        const pipelineValor = historialFiltrado
            .filter(q => q.estatus !== 'ganada' && q.estatus !== 'perdida')
            .reduce((acc, q) => acc + (parseFloat(q.monto_total || q.total) || 0), 0);

        const porcentajeMeta = metaActual > 0 ? Math.min((ventaCerrada / metaActual) * 100, 100).toFixed(1) : 0;

        return {
            ventaCerrada,
            pipelineValor,
            conteoLeads: datosFiltrados.clientesNuevos.length,
            conteoCotizaciones: historialFiltrado.length,
            porcentajeMeta,
            faltanteMeta: Math.max(0, metaActual - ventaCerrada)
        };
    }, [datosFiltrados, metaActual]);

    // Ventas por Ciudad
    const ventasPorCiudad = useMemo(() => {
        const plazas = {};
        datosFiltrados.historialFiltrado.filter(q => q.estatus === 'ganada').forEach(q => {
            const plaza = q.cliente?.plaza || 'Sin Plaza';
            plazas[plaza] = (plazas[plaza] || 0) + (parseFloat(q.monto_total || q.total) || 0);
        });
        return Object.entries(plazas).sort((a, b) => b[1] - a[1]);
    }, [datosFiltrados]);

    // Pipeline Visual
    const pipelineStages = useMemo(() => {
        const stages = { 'Prospecto': 0, 'Contactado': 0, 'Interesado': 0, 'Cierre': 0 };
        clientes.forEach(c => {
            if (stages[c.etapa] !== undefined) stages[c.etapa]++;
            else if (c.etapa === 'Cliente') stages['Cierre']++;
        });
        return Object.entries(stages);
    }, [clientes]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Pro con Refresh y Filtros */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-3">
                        Monitor <span className="text-red-600 font-black">Televisa</span>
                        <button
                            onClick={handleRefresh}
                            className={`p-2 bg-slate-100 text-slate-400 rounded-xl hover:text-red-600 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={18} />
                        </button>
                    </h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
                        Dashboard Comercial • Inteligencia en Tiempo Real
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    {['dia', 'semana', 'mes', 'anio'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriodo(p)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all
                                ${periodo === p
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            {p === 'dia' ? 'Hoy' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : 'Año'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={periodo === 'mes' ? 'Venta Mes' : `Venta ${periodo}`}
                    value={statsData.ventaCerrada}
                    isCurrency={true}
                    icon={DollarSign}
                    color="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Pipeline en Proceso"
                    value={statsData.pipelineValor}
                    isCurrency={true}
                    icon={TrendingUp}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Nuevos Leads"
                    value={statsData.conteoLeads}
                    icon={Users}
                    color="bg-purple-50 text-purple-600"
                />
                <StatCard
                    title="Propuestas Generadas"
                    value={statsData.conteoCotizaciones}
                    icon={FileText}
                    color="bg-red-50 text-red-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Meta y Pipeline Visual */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Meta Mensual Pro (Viene de Supabase) */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden relative group">
                        <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                            <Target size={160} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Desempeño sobre Objetivo</h3>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">
                                        Cumplimiento: <span className="text-emerald-500">{statsData.porcentajeMeta}%</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 justify-end">
                                        Meta Guardada: {formatMXN(metaActual)}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                        Resta: {formatMXN(statsData.faltanteMeta)}
                                    </p>
                                </div>
                            </div>
                            <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-inner transition-all duration-1000"
                                    style={{ width: `${statsData.porcentajeMeta}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Pipeline Visual Moderno */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
                        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                            Inventario de Pipeline (Total)
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2"></div>
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                            {pipelineStages.map(([stage, count], i) => {
                                const maxCount = Math.max(...pipelineStages.map(s => s[1]), 1);
                                const height = (count / maxCount * 100) + 10;
                                return (
                                    <div key={stage} className="flex flex-col items-center">
                                        <div className="w-full bg-slate-800 rounded-2xl relative mb-4 group h-32 flex items-end overflow-hidden border border-slate-700/50">
                                            <div
                                                className="w-full bg-gradient-to-t from-red-600 to-red-500 transition-all duration-1000 delay-100"
                                                style={{ height: `${height}%` }}
                                            ></div>
                                            <div className="absolute inset-0 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                                                {count}
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">{stage}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Venta por Ciudad y Accesos */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Venta por Ciudad Dinámica */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-6 text-slate-900">
                            <MapPin size={18} className="text-red-600" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Top Plazas ({periodo})</h3>
                        </div>
                        <div className="space-y-5">
                            {ventasPorCiudad.length > 0 ? ventasPorCiudad.map(([ciudad, monto]) => (
                                <div key={ciudad} className="space-y-1.5">
                                    <div className="flex justify-between text-[11px] font-black text-slate-700">
                                        <span className="uppercase tracking-tighter">{ciudad}</span>
                                        <span>{formatMXN(monto)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-600 rounded-full transition-all duration-700"
                                            style={{ width: `${(monto / (ventasPorCiudad[0][1] || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-[10px] text-gray-400 font-bold italic text-center py-4 uppercase">Sin cierres en este periodo</p>
                            )}
                        </div>
                    </div>

                    {/* Accesos Rápidos Pro */}
                    <div className="space-y-3">
                        <button
                            onClick={() => setVistaActual('crm')}
                            className="w-full bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between group hover:bg-red-600 transition-all font-black"
                        >
                            <span className="text-[9px] uppercase tracking-widest">Ver Pipeline Detallado</span>
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => setVistaActual('reportes')}
                            className="w-full bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between group hover:border-red-600 transition-all font-black text-slate-800"
                        >
                            <span className="text-[9px] uppercase tracking-widest">Módulo de Reportes</span>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-red-600" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
