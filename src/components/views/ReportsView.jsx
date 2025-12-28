import React, { useState, useMemo } from 'react';
import {
    BarChart3,
    Download,
    Printer,
    Calendar,
    Filter,
    Search,
    ChevronDown,
    Clock,
    MapPin,
    Tv,
    TrendingUp
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const ReportsView = ({ clientes, cotizaciones }) => {
    const [etapaSeleccionada, setEtapaSeleccionada] = useState('Cliente');
    const [busqueda, setBusqueda] = useState('');

    // 📅 Manejo de fechas
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const etapasDisponibles = ['Prospecto', 'Contactado', 'Interesado', 'Cliente', 'No Interesado'];

    // Atajos de fecha
    const establecerRango = (tipo) => {
        const hoy = new Date();
        const inicio = new Date();

        if (tipo === 'hoy') {
            const iso = hoy.toISOString().split('T')[0];
            setFechaInicio(iso);
            setFechaFin(iso);
        } else if (tipo === 'semana') {
            const primerDiaSemana = hoy.getDate() - hoy.getDay();
            inicio.setDate(primerDiaSemana);
            setFechaInicio(inicio.toISOString().split('T')[0]);
            setFechaFin(hoy.toISOString().split('T')[0]);
        } else if (tipo === 'mes') {
            inicio.setDate(1);
            setFechaInicio(inicio.toISOString().split('T')[0]);
            setFechaFin(hoy.toISOString().split('T')[0]);
        } else if (tipo === 'año') {
            inicio.setMonth(0, 1);
            setFechaInicio(inicio.toISOString().split('T')[0]);
            setFechaFin(hoy.toISOString().split('T')[0]);
        }
    };

    // 🔍 Filtrado Maestro de Clientes (Por Etapa + Búsqueda + Fecha)
    const clientesFiltrados = useMemo(() => {
        return (clientes || []).filter(c => {
            const matchEtapa = c.etapa === etapaSeleccionada;
            const matchBusqueda = (c.nombre_empresa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                (c.plaza || '').toLowerCase().includes(busqueda.toLowerCase());

            const fechaCliente = new Date(c.created_at);
            const matchFechaInicio = fechaInicio ? fechaCliente >= new Date(fechaInicio) : true;
            const fechaFinAjustada = fechaFin ? new Date(new Date(fechaFin).setHours(23, 59, 59, 999)) : null;
            const matchFechaFin = fechaFinAjustada ? fechaCliente <= fechaFinAjustada : true;

            return matchEtapa && matchBusqueda && matchFechaInicio && matchFechaFin;
        });
    }, [clientes, etapaSeleccionada, busqueda, fechaInicio, fechaFin]);

    // 📊 Métricas Operativas
    const analytics = useMemo(() => {
        const result = {
            porPlaza: {},
            porCanal: {},
            totalValor: 0
        };

        (cotizaciones || []).forEach(q => {
            const fechaQ = new Date(q.created_at || q.fecha);
            const matchFechaInicio = fechaInicio ? fechaQ >= new Date(fechaInicio) : true;
            const fechaFinAjustada = fechaFin ? new Date(new Date(fechaFin).setHours(23, 59, 59, 999)) : null;
            const matchFechaFin = fechaFinAjustada ? fechaQ <= fechaFinAjustada : true;

            if (matchFechaInicio && matchFechaFin && q.estatus === 'ganada') {
                const cliente = (clientes || []).find(c => c.id === q.cliente_id);
                if (cliente) {
                    const plaza = cliente.plaza || 'Mérida';
                    const canal = q.canal || 'Digital';
                    const monto = parseFloat(q.subtotalGeneral || (q.monto_total || q.total) / 1.16) || 0;

                    result.porPlaza[plaza] = (result.porPlaza[plaza] || 0) + monto;
                    result.porCanal[canal] = (result.porCanal[canal] || 0) + monto;
                    result.totalValor += monto;
                }
            }
        });

        return result;
    }, [cotizaciones, clientes, fechaInicio, fechaFin]);

    // Conteo por Etapa (Para las fichas superiores)
    const metricasEtapas = useMemo(() => {
        const counts = {};
        etapasDisponibles.forEach(e => {
            const lista = (clientes || []).filter(c => {
                const fechaCliente = new Date(c.created_at);
                const matchFechaInicio = fechaInicio ? fechaCliente >= new Date(fechaInicio) : true;
                const fechaFinAjustada = fechaFin ? new Date(new Date(fechaFin).setHours(23, 59, 59, 999)) : null;
                const matchFechaFin = fechaFinAjustada ? fechaCliente <= fechaFinAjustada : true;
                return c.etapa === e && matchFechaInicio && matchFechaFin;
            });
            counts[e] = lista.length;
        });
        return counts;
    }, [clientes, fechaInicio, fechaFin]);

    const handleExportCSV = () => {
        const headers = ['Empresa', 'Contacto', 'Etapa', 'Plaza', 'Fecha'];
        const csvRows = clientesFiltrados.map(c => [
            `"${c.nombre_empresa}"`,
            `"${c.nombre_contacto || ''}"`,
            c.etapa,
            c.plaza,
            new Date(c.created_at).toLocaleDateString()
        ]);
        const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Reporte_Televisa_${etapaSeleccionada}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 print:p-0">
            {/* Header Pro */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 print:hidden">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <BarChart3 className="text-red-600" size={26} />
                        Reportes Inteligentes
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Análisis por Período, Canal y Territorio</p>
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                    <button onClick={handleExportCSV} className="flex-1 bg-white border border-gray-100 px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={14} /> EXCEL
                    </button>
                    <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-xl active:scale-95">
                        <Printer size={14} /> IMPRIMIR
                    </button>
                </div>
            </div>

            {/* Panel de Filtros con Atajos */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6 print:hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                    <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <Clock size={14} /> Atajos de Período
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['hoy', 'semana', 'mes', 'año'].map((btn) => (
                                <button
                                    key={btn}
                                    onClick={() => establecerRango(btn)}
                                    className="px-4 py-2 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-xl text-[9px] font-black uppercase transition-all border border-slate-100"
                                >
                                    {btn === 'año' ? 'Todo el Año' : btn === 'semana' ? 'Esta Semana' : btn === 'mes' ? 'Este Mes' : 'Hoy'}
                                </button>
                            ))}
                            {(fechaInicio || fechaFin) && (
                                <button
                                    onClick={() => { setFechaInicio(''); setFechaFin(''); }}
                                    className="px-4 py-2 text-rose-600 text-[9px] font-black uppercase"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Desde</label>
                        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-2.5 text-xs font-bold focus:ring-1 focus:ring-red-500" />
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Hasta</label>
                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-2.5 text-xs font-bold focus:ring-1 focus:ring-red-500" />
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input type="text" placeholder="Filtrar por empresa o plaza..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-red-500 outline-none" />
                    </div>
                </div>
            </div>

            {/* Quick Metrics per Stage */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 print:hidden">
                {etapasDisponibles.map(etapa => (
                    <button
                        key={etapa}
                        onClick={() => setEtapaSeleccionada(etapa)}
                        className={`p-5 rounded-[2rem] border transition-all text-left relative overflow-hidden group
                            ${etapaSeleccionada === etapa
                                ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.03]'
                                : 'bg-white border-gray-100 text-slate-400 hover:border-red-200'}`}
                    >
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${etapaSeleccionada === etapa ? 'text-red-500' : 'text-gray-300'}`}>{etapa}</p>
                        <p className="text-2xl font-black tracking-tighter leading-none">{metricasEtapas[etapa] || 0}</p>
                        <div className={`absolute -right-2 -bottom-2 opacity-5 group-hover:rotate-12 transition-transform ${etapaSeleccionada === etapa ? 'text-white' : 'text-slate-900'}`}>
                            <TrendingUp size={60} />
                        </div>
                    </button>
                ))}
            </div>

            {/* Resumen por Plaza y Canal (Nuevas Secciones) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <MapPin size={14} className="text-red-600" /> Ventas por Ciudad
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(analytics.porPlaza).length > 0 ? Object.entries(analytics.porPlaza).map(([plaza, monto]) => (
                            <div key={plaza} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                <span className="text-[10px] font-black uppercase text-slate-600">{plaza}</span>
                                <span className="text-xs font-black text-slate-900">{formatMXN(monto)}</span>
                            </div>
                        )) : (
                            <p className="text-[10px] text-gray-300 italic text-center py-4 uppercase font-black">Sin datos en período</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <Tv size={14} className="text-red-600" /> Ventas por Canal
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(analytics.porCanal).length > 0 ? Object.entries(analytics.porCanal).map(([canal, monto]) => (
                            <div key={canal} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl text-white">
                                <span className="text-[10px] font-black uppercase text-slate-300">{canal}</span>
                                <span className="text-xs font-black text-red-500">{formatMXN(monto)}</span>
                            </div>
                        )) : (
                            <p className="text-[10px] text-gray-300 italic text-center py-4 uppercase font-black">Sin datos en período</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Listado para Impresión */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                <div className="flex justify-between items-end mb-6 print:mb-12">
                    <div className="space-y-1">
                        <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">Segmentación: {etapaSeleccionada}s</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            {fechaInicio && fechaFin ? `${fechaInicio} al ${fechaFin}` : 'Corte Histórico'}
                        </p>
                    </div>
                    <div className="text-right hidden print:block">
                        <p className="text-[10px] font-black text-slate-900 uppercase">Televisa Mérida</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Generado: {new Date().toLocaleString()}</p>
                    </div>
                </div>

                <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-slate-900">
                                <th className="py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest">Cuenta / Cliente</th>
                                <th className="py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest">Responsable</th>
                                <th className="py-4 text-[9px] font-black text-slate-900 uppercase tracking-widest">Territorio</th>
                                <th className="py-4 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest">Inversión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clientesFiltrados.length > 0 ? clientesFiltrados.map(cliente => {
                                const valor = (cotizaciones || []).filter(q => q.cliente_id === cliente.id && q.estatus === 'ganada')
                                    .reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || (q.monto_total || q.total) / 1.16) || 0), 0);
                                return (
                                    <tr key={cliente.id} className="hover:bg-slate-50/50">
                                        <td className="py-4">
                                            <p className="text-xs font-black text-slate-900 uppercase">{cliente.nombre_empresa}</p>
                                            <p className="text-[9px] text-gray-300 font-bold">{cliente.segmento || 'GENERAL'}</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="text-[10px] font-bold text-slate-500">{cliente.nombre_contacto || '-'}</p>
                                        </td>
                                        <td className="py-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cliente.plaza}</span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className="text-xs font-black text-slate-900">{formatMXN(valor)}</span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="4" className="py-16 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest">Sin resultados para esta selección</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Disclaimer para impresión */}
            <div className="hidden print:flex justify-between items-center border-t-2 border-slate-900 pt-8 mt-12 bg-white">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Reporte Ejecutivo de Pipeline - Televisa</p>
                    <p className="text-[8px] text-gray-400 font-bold mt-1 uppercase">Confidencial / Uso Interno</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-8">
                    <p className="text-[10px] font-black text-slate-900 uppercase mb-4 tracking-widest">Validado Por:</p>
                    <div className="w-48 h-px bg-slate-900 mt-8"></div>
                    <p className="text-[8px] text-slate-400 font-black uppercase mt-1">Nombre y Firma</p>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
