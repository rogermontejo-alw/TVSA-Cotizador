import React, { useState, useMemo } from 'react';
import {
    BarChart3,
    Download,
    Printer,
    Calendar,
    Search,
    ChevronDown,
    Clock,
    MapPin,
    Tv,
    TrendingUp,
    FileText,
    CheckCircle2,
    XCircle,
    Layout,
    Globe,
    Briefcase
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const MISSING_DATA_CHAR = '-';

const ReportsView = ({ clientes = [], cotizaciones = [] }) => {
    const [seccionReporte, setSeccionReporte] = useState('ventas-mes');

    // 📅 Periodo
    const hoy = new Date();
    const [fechaInicio, setFechaInicio] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]);

    const establecerRango = (tipo) => {
        const d = new Date();
        if (tipo === 'mes') {
            setFechaInicio(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
            setFechaFin(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
        } else if (tipo === 'año') {
            setFechaInicio(new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]);
            setFechaFin(new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0]);
        }
    };

    // 📊 Cotizaciones Ganadas en el rango
    const ganadas = useMemo(() => {
        return (cotizaciones || []).filter(q => {
            if (q.estatus !== 'ganada') return false;
            const fechaQ = new Date(q.fecha_cierre_real || q.created_at || q.fecha);
            const start = new Date(fechaInicio);
            const end = new Date(fechaFin);
            end.setHours(23, 59, 59, 999);
            return fechaQ >= start && fechaQ <= end;
        });
    }, [cotizaciones, fechaInicio, fechaFin]);

    // 1. REPORTE: Ventas por Mes (Corte Mensual Matrix: Clientes x Meses)
    const matrizMensual = useMemo(() => {
        const mesesNombres = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const clienteMap = {}; // { clienteId: { mes: monto } }
        const mesesVisibles = new Set();
        const totalesPorMes = {};

        ganadas.forEach(q => {
            const cliente = (clientes || []).find(c => String(c.id) === String(q.cliente_id));
            const fechaQ = new Date(q.fecha_cierre_real || q.created_at || q.fecha);
            const mesIdx = fechaQ.getMonth();
            const mesNombre = mesesNombres[mesIdx];
            const cId = q.cliente_id;
            const monto = parseFloat(q.subtotalGeneral || q.total / 1.16) || 0;

            mesesVisibles.add(mesIdx);
            if (!clienteMap[cId]) {
                clienteMap[cId] = { nombre: cliente?.nombre_empresa || 'S/N', importes: {} };
            }
            clienteMap[cId].importes[mesIdx] = (clienteMap[cId].importes[mesIdx] || 0) + monto;
            totalesPorMes[mesIdx] = (totalesPorMes[mesIdx] || 0) + monto;
        });

        // Ordenar meses visibles
        const mesesColumnas = Array.from(mesesVisibles).sort((a, b) => a - b);
        const filas = Object.values(clienteMap).map(c => ({
            nombre: c.nombre,
            importes: c.importes,
            total: Object.values(c.importes).reduce((a, b) => a + b, 0)
        })).sort((a, b) => b.total - a.total);

        const granTotal = Object.values(totalesPorMes).reduce((a, b) => a + b, 0);

        return { mesesColumnas, mesesNombres, filas, totalesPorMes, granTotal };
    }, [ganadas, clientes]);

    // 2. REPORTE: Ventas por Canal (Matriz)
    const matrizCanales = useMemo(() => {
        const canalesMap = {}; // { canal: { plaza: monto } }
        const plazasSet = new Set();
        const totalesPorPlaza = {};

        ganadas.forEach(q => {
            const cliente = (clientes || []).find(c => String(c.id) === String(q.cliente_id));
            const pPlaza = cliente?.plaza || 'Mérida';
            plazasSet.add(pPlaza);

            // 1. Pauta tradicional
            (q.items || []).forEach(item => {
                const canal = item.producto?.canal || 'Otros';
                if (!canalesMap[canal]) canalesMap[canal] = {};
                const montoItem = (item.subtotal || 0);
                canalesMap[canal][pPlaza] = (canalesMap[canal][pPlaza] || 0) + montoItem;
                totalesPorPlaza[pPlaza] = (totalesPorPlaza[pPlaza] || 0) + montoItem;
            });

            // 2. VIX
            const costoVIX = parseFloat(q.costoVIX || (q.paqueteVIX?.inversion) || 0);
            if (costoVIX > 0) {
                const canalVIX = 'VIX';
                if (!canalesMap[canalVIX]) canalesMap[canalVIX] = {};
                canalesMap[canalVIX][pPlaza] = (canalesMap[canalVIX][pPlaza] || 0) + costoVIX;
                totalesPorPlaza[pPlaza] = (totalesPorPlaza[pPlaza] || 0) + costoVIX;
            }
        });

        const plazas = Array.from(plazasSet).sort();
        const filas = Object.entries(canalesMap).map(([canal, distrib]) => ({
            canal,
            importes: distrib,
            total: Object.values(distrib).reduce((a, b) => a + b, 0)
        })).sort((a, b) => b.total - a.total);

        const granTotal = Object.values(totalesPorPlaza).reduce((a, b) => a + b, 0);

        return { plazas, filas, totalesPorPlaza, granTotal };
    }, [ganadas, clientes]);

    // 3. REPORTE: Ventas por Ciudad (Matriz)
    const matrizCiudad = useMemo(() => {
        const clienteMap = {}; // { clienteId: { plaza: monto } }
        const plazasSet = new Set();
        const totalesPorPlaza = {};

        ganadas.forEach(q => {
            const cliente = (clientes || []).find(c => String(c.id) === String(q.cliente_id));
            const plaza = cliente?.plaza || 'Mérida';
            const cId = q.cliente_id;
            const monto = parseFloat(q.subtotalGeneral || q.total / 1.16) || 0;

            plazasSet.add(plaza);
            if (!clienteMap[cId]) {
                clienteMap[cId] = { nombre: cliente?.nombre_empresa || 'S/N', importes: {} };
            }
            clienteMap[cId].importes[plaza] = (clienteMap[cId].importes[plaza] || 0) + monto;
            totalesPorPlaza[plaza] = (totalesPorPlaza[plaza] || 0) + monto;
        });

        const plazas = Array.from(plazasSet).sort();
        const filas = Object.values(clienteMap).map(c => ({
            nombre: c.nombre,
            importes: c.importes,
            total: Object.values(c.importes).reduce((a, b) => a + b, 0)
        })).sort((a, b) => b.total - a.total);

        const granTotal = Object.values(totalesPorPlaza).reduce((a, b) => a + b, 0);

        return { plazas, filas, totalesPorPlaza, granTotal };
    }, [ganadas, clientes]);

    const handleExportCSV = () => {
        alert('Generando exportación consolidada...');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 print:p-0">
            {/* Header Pro */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-3 rounded-xl shadow-xl shadow-slate-200">
                        <BarChart3 className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Reportería Corporativa</h2>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Control de Resultados con Totales y Matrices</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                    <button onClick={handleExportCSV} className="flex-1 bg-white border border-gray-100 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={12} /> EXCEL
                    </button>
                    <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-xl active:scale-95">
                        <Printer size={12} /> IMPRIMIR
                    </button>
                </div>
            </div>

            {/* Menu de Nav de Reportes */}
            <div className="flex flex-wrap gap-2 print:hidden bg-white p-2 rounded-2xl shadow-xl border border-gray-100">
                {[
                    { id: 'ventas-mes', label: 'Ventas por Mes', icon: Calendar },
                    { id: 'ventas-canal', label: 'Ventas por Canal', icon: Tv },
                    { id: 'ventas-ciudad', label: 'Ventas por Ciudad', icon: Globe },
                    { id: 'control-cierres', label: 'Control de Cierres', icon: Briefcase },
                    { id: 'resumen-clientes', label: 'Resumen Pipeline', icon: FileText },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSeccionReporte(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all
                            ${seccionReporte === tab.id
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Selector de Período Compacto */}
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-4 print:hidden">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ajustar Período:</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => establecerRango('mes')} className="px-3 py-1.5 bg-slate-50 rounded-lg text-[8px] font-black uppercase hover:bg-red-50 hover:text-red-600 transition-all border border-slate-100 italic">Mes Actual</button>
                    <button onClick={() => establecerRango('año')} className="px-3 py-1.5 bg-slate-50 rounded-lg text-[8px] font-black uppercase hover:bg-red-50 hover:text-red-600 transition-all border border-slate-100 italic">Año Completo</button>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="bg-slate-50 border-none rounded-lg p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-red-500" />
                    <span className="text-gray-300 font-bold">A</span>
                    <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="bg-slate-50 border-none rounded-lg p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-red-500" />
                </div>
            </div>

            {/* Renderizado de Tablas */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">

                {/* 1. VENTAS POR MES (Matriz Clientes x Meses) */}
                {seccionReporte === 'ventas-mes' && (
                    <div className="overflow-x-auto">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-slate-900 text-white">
                            <div>
                                <h3 className="text-lg font-black tracking-tighter uppercase">Ventas por Mes (Detallado)</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Consolidado mensual por cliente</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase text-red-500 tracking-widest">Total Gran Acumulado</p>
                                <p className="text-2xl font-black">{formatMXN(matrizMensual.granTotal)}</p>
                            </div>
                        </div>
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200">
                                    <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200 sticky left-0 bg-slate-50 z-10">Cuenta / Cliente</th>
                                    {matrizMensual.mesesColumnas.map(m => (
                                        <th key={m} className="py-4 px-4 text-center text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">{matrizMensual.mesesNombres[m]}</th>
                                    ))}
                                    <th className="py-4 px-6 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest">Total Cliente</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {matrizMensual.filas.map((f, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="py-4 px-6 border-r border-gray-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                            <span className="text-[10px] font-black text-slate-900 uppercase truncate block max-w-[150px]">{f.nombre}</span>
                                        </td>
                                        {matrizMensual.mesesColumnas.map(m => (
                                            <td key={m} className="py-4 px-4 text-center text-[10px] font-bold text-slate-500 border-r border-gray-100">
                                                {f.importes[m] ? formatMXN(f.importes[m]) : MISSING_DATA_CHAR}
                                            </td>
                                        ))}
                                        <td className="py-4 px-6 text-right text-[10px] font-black text-slate-900 bg-slate-50/20">{formatMXN(f.total)}</td>
                                    </tr>
                                ))}
                                {/* Fila de Totales Columnas */}
                                <tr className="bg-slate-900 text-white font-black">
                                    <td className="py-4 px-6 uppercase text-[9px] tracking-widest border-r border-slate-800 sticky left-0 bg-slate-900 z-10">Total Mensual</td>
                                    {matrizMensual.mesesColumnas.map(m => (
                                        <td key={m} className="py-4 px-4 text-center text-[10px] border-r border-slate-800">{formatMXN(matrizMensual.totalesPorMes[m])}</td>
                                    ))}
                                    <td className="py-4 px-6 text-right text-[11px] text-red-500">{formatMXN(matrizMensual.granTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 2. VENTAS POR CANAL (Matriz Canales x Plazas) */}
                {seccionReporte === 'ventas-canal' && (
                    <div className="overflow-x-auto sm:overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-slate-900 text-white">
                            <div>
                                <h3 className="text-lg font-black tracking-tighter uppercase">Análisis por Canal y Señal</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Distribución territorial de inversión</p>
                            </div>
                            <Tv className="text-red-500" size={30} />
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200">
                                    <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200 sticky left-0 bg-slate-50 z-10">Canal / Producto</th>
                                    {matrizCanales.plazas.map(p => (
                                        <th key={p} className="py-4 px-6 text-center text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">{p}</th>
                                    ))}
                                    <th className="py-4 px-6 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest">Inversión Canal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {matrizCanales.filas.map((f, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="py-4 px-6 border-r border-gray-100 sticky left-0 bg-white z-10">
                                            <span className="text-[10px] font-black text-slate-900 uppercase">{f.canal}</span>
                                        </td>
                                        {matrizCanales.plazas.map(p => (
                                            <td key={p} className="py-4 px-6 text-center text-[10px] font-bold text-slate-500 border-r border-gray-100">
                                                {f.importes[p] ? formatMXN(f.importes[p]) : MISSING_DATA_CHAR}
                                            </td>
                                        ))}
                                        <td className="py-4 px-6 text-right text-[10px] font-black text-red-600 bg-slate-50/20">{formatMXN(f.total)}</td>
                                    </tr>
                                ))}
                                {/* Totales por Plaza */}
                                <tr className="bg-slate-900 text-white font-black">
                                    <td className="py-4 px-6 uppercase text-[9px] tracking-widest border-r border-slate-800 sticky left-0 bg-slate-900 z-10">Total Ciudad</td>
                                    {matrizCanales.plazas.map(p => (
                                        <td key={p} className="py-4 px-6 text-center text-[10px] border-r border-slate-800">{formatMXN(matrizCanales.totalesPorPlaza[p])}</td>
                                    ))}
                                    <td className="py-4 px-6 text-right text-[11px] text-red-500">{formatMXN(matrizCanales.granTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 3. VENTAS POR CIUDAD (Matriz Clientes x Plazas) */}
                {seccionReporte === 'ventas-ciudad' && (
                    <div className="overflow-x-auto sm:overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-slate-900 text-white">
                            <div>
                                <h3 className="text-lg font-black tracking-tighter uppercase">Matriz Territorial de Clientes</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Consolidado de inversión por plaza</p>
                            </div>
                            <Globe className="text-red-500" size={30} />
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200">
                                    <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200 sticky left-0 bg-slate-50 z-10">Cuenta / Empresa</th>
                                    {matrizCiudad.plazas.map(p => (
                                        <th key={p} className="py-4 px-6 text-center text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">{p}</th>
                                    ))}
                                    <th className="py-4 px-6 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest">Consolidado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {matrizCiudad.filas.map((f, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="py-4 px-6 border-r border-gray-100 sticky left-0 bg-white z-10">
                                            <span className="text-[10px] font-black text-slate-900 uppercase block truncate max-w-[120px]">{f.nombre}</span>
                                        </td>
                                        {matrizCiudad.plazas.map(p => (
                                            <td key={p} className="py-4 px-6 text-center text-[10px] font-bold text-slate-500 border-r border-gray-100">
                                                {f.importes[p] ? formatMXN(f.importes[p]) : MISSING_DATA_CHAR}
                                            </td>
                                        ))}
                                        <td className="py-4 px-6 text-right text-[10px] font-black text-slate-900 bg-slate-50/20">{formatMXN(f.total)}</td>
                                    </tr>
                                ))}
                                {/* Totales por Plaza */}
                                <tr className="bg-slate-900 text-white font-black">
                                    <td className="py-4 px-6 uppercase text-[9px] tracking-widest border-r border-slate-800 sticky left-0 bg-slate-900 z-10">Total Ciudad</td>
                                    {matrizCiudad.plazas.map(p => (
                                        <td key={p} className="py-4 px-6 text-center text-[10px] border-r border-slate-800">{formatMXN(matrizCiudad.totalesPorPlaza[p])}</td>
                                    ))}
                                    <td className="py-4 px-6 text-right text-[11px] text-red-500">{formatMXN(matrizCiudad.granTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 5. CONTROL DE CIERRES (Listado de Contratos y MC) */}
                {seccionReporte === 'control-cierres' && (
                    <div className="overflow-x-auto">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-slate-900 text-white">
                            <div>
                                <h3 className="text-lg font-black tracking-tighter uppercase">Control Administrativo de Cierres</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Folios, Contratos y Master Contracts</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase text-red-500 tracking-widest">Cierres en Periodo</p>
                                <p className="text-2xl font-black">{ganadas.length}</p>
                            </div>
                        </div>
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200">
                                    <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">Fecha Cierre</th>
                                    <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">Cliente / Empresa</th>
                                    <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">Folio Cotz</th>
                                    <th className="py-4 px-6 text-[9px] font-black text-emerald-600 uppercase tracking-widest border-r border-gray-200">No. Contrato</th>
                                    <th className="py-4 px-6 text-[9px] font-black text-blue-600 uppercase tracking-widest border-r border-gray-200">Master Contract</th>
                                    <th className="py-4 px-6 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest">Inversión Neta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ganadas.sort((a, b) => new Date(b.fecha_cierre_real) - new Date(a.fecha_cierre_real)).map((q, i) => {
                                    const cliente = (clientes || []).find(c => String(c.id) === String(q.cliente_id));
                                    return (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="py-4 px-6 text-[10px] font-bold text-gray-400 border-r border-gray-100">
                                                {new Date(q.fecha_cierre_real || q.created_at).toLocaleDateString('es-MX')}
                                            </td>
                                            <td className="py-4 px-6 border-r border-gray-100 font-black text-[10px] text-slate-900 uppercase">
                                                {cliente?.nombre_empresa || 'S/N'}
                                            </td>
                                            <td className="py-4 px-6 border-r border-gray-100 text-[10px] font-bold text-red-500 uppercase tracking-tighter">
                                                {q.folio || q.id}
                                            </td>
                                            <td className="py-4 px-6 border-r border-gray-100 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${q.numero_contrato ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                                                    {q.numero_contrato || 'FALTA'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 border-r border-gray-100 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${q.mc_id ? 'bg-blue-50 text-blue-600' : 'text-gray-300'}`}>
                                                    {q.mc_id ? 'VINCULADO' : 'ÚNICA'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right text-[10px] font-black text-slate-900">
                                                {formatMXN(q.subtotalGeneral || q.total / 1.16)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {ganadas.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-[10px] font-black text-gray-300 uppercase italic tracking-widest">Sin ventas ganadas en este periodo</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {seccionReporte === 'resumen-clientes' && (
                    <div className="overflow-x-auto sm:overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-slate-900 text-white">
                            <div>
                                <h3 className="text-lg font-black tracking-tighter uppercase">Pipeline de Ventas y Efectividad</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Estado actual de propuestas por cuenta</p>
                            </div>
                            <Layout className="text-red-500" size={30} />
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Cuenta</th>
                                    <th className="py-4 px-6 text-center text-[9px] font-black text-blue-500 uppercase tracking-widest">Abiertas</th>
                                    <th className="py-4 px-6 text-center text-[9px] font-black text-emerald-500 uppercase tracking-widest">Ganadas</th>
                                    <th className="py-4 px-6 text-center text-[9px] font-black text-red-500 uppercase tracking-widest">Perdidas</th>
                                    <th className="py-4 px-6 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest">Venta Acumulada</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(clientes || []).map(c => {
                                    const cCotz = (cotizaciones || []).filter(q => String(q.cliente_id) === String(c.id));
                                    const abiertas = cCotz.filter(q => q.estatus === 'borrador' || q.estatus === 'enviada').length;
                                    const cGanadas = cCotz.filter(q => q.estatus === 'ganada').length;
                                    const perdidas = cCotz.filter(q => q.estatus === 'perdida').length;
                                    const monto = cCotz.filter(q => q.estatus === 'ganada').reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);

                                    if (abiertas === 0 && cGanadas === 0 && perdidas === 0) return null;

                                    return (
                                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6 sticky left-0 bg-white z-10">
                                                <p className="text-[10px] font-black text-slate-900 uppercase">{c.nombre_empresa}</p>
                                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest italic">{c.plaza}</p>
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-[10px] text-blue-600">{abiertas}</td>
                                            <td className="py-4 px-6 text-center font-bold text-[10px] text-emerald-600">{cGanadas}</td>
                                            <td className="py-4 px-6 text-center font-bold text-[10px] text-red-600">{perdidas}</td>
                                            <td className="py-4 px-6 text-right text-[10px] font-black text-slate-900">{formatMXN(monto)}</td>
                                        </tr>
                                    );
                                }).filter(Boolean)}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Disclaimer para impresión */}
            <div className="hidden print:flex flex-col border-t-2 border-slate-900 pt-8 mt-12 bg-white">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Reporte Ejecutivo de Televisión Local</p>
                        <p className="text-[8px] text-gray-400 font-bold mt-1 uppercase">Corte de Ventas Ganadas - {seccionReporte.replace('-', ' ').toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-900">Periodo: {fechaInicio} / {fechaFin}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-12 pt-12">
                    <div className="text-center w-48">
                        <div className="border-b border-slate-900 mb-2"></div>
                        <p className="text-[8px] font-black uppercase text-slate-400">Revisado Por</p>
                    </div>
                    <div className="text-center w-48">
                        <div className="border-b border-slate-900 mb-2"></div>
                        <p className="text-[8px] font-black uppercase text-slate-400">Autorizado Por</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
