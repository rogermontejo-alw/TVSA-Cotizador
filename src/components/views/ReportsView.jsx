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
    Briefcase,
    DollarSign
} from 'lucide-react';
import { formatMXN } from '../../utils/formatters';

const MISSING_DATA_CHAR = '-';

const ReportsView = ({ clientes = [], cotizaciones = [], cobranza = [], masterContracts = [], contratosEjecucion = [] }) => {
    const [seccionReporte, setSeccionReporte] = useState('ventas-mes');
    const [subCorte, setSubCorte] = useState('pipeline'); // 'pipeline' o 'ejecucion'

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

    // 📊 Datos para Reportes (Basados en el subCorte)
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

    const datosFinancierosTotal = useMemo(() => {
        if (subCorte === 'pipeline') {
            return ganadas.map(q => ({
                id: q.id,
                cliente_id: q.cliente_id,
                fecha: q.fecha_cierre_real || q.created_at,
                monto: parseFloat(q.subtotalGeneral || q.total / 1.16) || 0,
                folio_referencia: q.folio,
                mc_id: q.mc_id,
                tipo: 'Pipeline',
                original: q
            }));
        } else {
            return (contratosEjecucion || []).filter(ce => {
                const fechaE = new Date(ce.fecha_inicio_pauta);
                const start = new Date(fechaInicio);
                const end = new Date(fechaFin);
                end.setHours(23, 59, 59, 999);
                return fechaE >= start && fechaE <= end;
            }).map(ce => ({
                id: ce.id,
                cliente_id: ce.master_contracts?.cliente_id || ce.cotizaciones?.cliente_id,
                fecha: ce.fecha_inicio_pauta,
                monto: parseFloat(ce.monto_ejecucion) || 0,
                folio_referencia: ce.numero_contrato,
                mc_id: ce.mc_id,
                tipo: 'Ejecución',
                original: ce
            }));
        }
    }, [ganadas, contratosEjecucion, subCorte, fechaInicio, fechaFin]);

    // 1. REPORTE: Ventas por Mes (Corte Mensual Matrix: Clientes x Meses)
    const matrizMensual = useMemo(() => {
        const mesesNombres = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const clienteMap = {}; // { clienteId: { mes: monto } }
        const mesesVisibles = new Set();
        const totalesPorMes = {};

        datosFinancierosTotal.forEach(item => {
            const cliente = (clientes || []).find(c => String(c.id) === String(item.cliente_id));
            const fechaItem = new Date(item.fecha);
            const mesIdx = fechaItem.getMonth();
            const cId = item.cliente_id;
            const monto = item.monto;

            mesesVisibles.add(mesIdx);
            if (!clienteMap[cId]) {
                clienteMap[cId] = { nombre: cliente?.nombre_empresa || 'S/N', importes: {} };
            }
            clienteMap[cId].importes[mesIdx] = (clienteMap[cId].importes[mesIdx] || 0) + monto;
            totalesPorMes[mesIdx] = (totalesPorMes[mesIdx] || 0) + monto;
        });

        const mesesColumnas = Array.from(mesesVisibles).sort((a, b) => a - b);
        const filas = Object.values(clienteMap).map(c => ({
            nombre: c.nombre,
            importes: c.importes,
            total: Object.values(c.importes).reduce((a, b) => a + b, 0)
        })).sort((a, b) => b.total - a.total);

        const granTotal = Object.values(totalesPorMes).reduce((a, b) => a + b, 0);

        return { mesesColumnas, mesesNombres, filas, totalesPorMes, granTotal };
    }, [datosFinancierosTotal, clientes]);

    // 2. REPORTE: Ventas por Canal (Matriz)
    const matrizCanales = useMemo(() => {
        const canalesMap = {}; // { canal: { plaza: monto } }
        const plazasSet = new Set();
        const totalesPorPlaza = {};

        datosFinancierosTotal.forEach(item => {
            const cliente = (clientes || []).find(c => String(c.id) === String(item.cliente_id));
            const pPlaza = cliente?.plaza || 'Mérida';
            plazasSet.add(pPlaza);

            // Intentar obtener la cotización original para el desglose
            let q = null;
            if (subCorte === 'pipeline') {
                q = (cotizaciones || []).find(c => c.id === item.id);
            } else {
                const ce = (contratosEjecucion || []).find(e => e.id === item.id);
                q = (cotizaciones || []).find(c => c.id === ce?.cotizacion_id);
            }

            if (q) {
                // 1. Pauta tradicional
                (q.items || []).forEach(i => {
                    const canal = i.producto?.canal || 'Otros';
                    if (!canalesMap[canal]) canalesMap[canal] = {};
                    const montoItem = (i.subtotal || 0);
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
            } else {
                // Fallback si no hay cotización vinculada (ej: facturas manuales en el futuro?)
                const canal = 'Sin Clasificar';
                if (!canalesMap[canal]) canalesMap[canal] = {};
                canalesMap[canal][pPlaza] = (canalesMap[canal][pPlaza] || 0) + item.monto;
                totalesPorPlaza[pPlaza] = (totalesPorPlaza[pPlaza] || 0) + item.monto;
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
    }, [datosFinancierosTotal, clientes, cotizaciones, contratosEjecucion, subCorte]);

    // 3. REPORTE: Ventas por Ciudad (Matriz)
    const matrizCiudad = useMemo(() => {
        const clienteMap = {}; // { clienteId: { plaza: monto } }
        const plazasSet = new Set();
        const totalesPorPlaza = {};

        datosFinancierosTotal.forEach(item => {
            const cliente = (clientes || []).find(c => String(c.id) === String(item.cliente_id));
            const plaza = cliente?.plaza || 'Mérida';
            const cId = item.cliente_id;
            const monto = item.monto;

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
    }, [datosFinancierosTotal, clientes]);

    const getReportData = (id) => {
        let headers = [];
        let rows = [];
        let title = "";

        if (id === 'ventas-mes') {
            title = "VENTAS POR MES (MATRIZ POR CLIENTE)";
            headers = ['Cliente', ...matrizMensual.mesesColumnas.map(m => matrizMensual.mesesNombres[m]), 'Total'];
            rows = matrizMensual.filas.map(f => [
                f.nombre,
                ...matrizMensual.mesesColumnas.map(m => f.importes[m] || 0),
                f.total
            ]);
            rows.push(['TOTAL MENSUAL', ...matrizMensual.mesesColumnas.map(m => matrizMensual.totalesPorMes[m] || 0), matrizMensual.granTotal]);
        } else if (id === 'ventas-canal') {
            title = "VENTAS POR CANAL / PRODUCTO";
            headers = ['Canal/Producto', ...matrizCanales.plazas, 'Total Canal'];
            rows = matrizCanales.filas.map(f => [
                f.canal,
                ...matrizCanales.plazas.map(p => f.importes[p] || 0),
                f.total
            ]);
            rows.push(['TOTAL CIUDAD', ...matrizCanales.plazas.map(p => matrizCanales.totalesPorPlaza[p] || 0), matrizCanales.granTotal]);
        } else if (id === 'ventas-ciudad') {
            title = "VENTAS POR CIUDAD (MATRIZ TERRITORIAL)";
            headers = ['Cliente', ...matrizCiudad.plazas, 'Total Cliente'];
            rows = matrizCiudad.filas.map(f => [
                f.nombre,
                ...matrizCiudad.plazas.map(p => f.importes[p] || 0),
                f.total
            ]);
            rows.push(['TOTAL CIUDAD', ...matrizCiudad.plazas.map(p => matrizCiudad.totalesPorPlaza[p] || 0), matrizCiudad.granTotal]);
        } else if (id === 'control-cierres') {
            title = subCorte === 'pipeline' ? "CONTROL ADMINISTRATIVO DE CIERRES (COMMERCIAL)" : "CONTROL ADMINISTRATIVO DE EJECUCIONES (FINANCIAL)";
            headers = ['Fecha Ref', 'Cliente', 'Folio Cotz', 'Nº Contrato', 'M. Contract', 'Factura', 'Monto'];
            rows = datosFinancierosTotal.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(item => {
                const cliente = (clientes || []).find(c => String(c.id) === String(item.cliente_id));
                const q = subCorte === 'pipeline' ? item.original : (cotizaciones || []).find(c => c.id === item.original?.cotizacion_id);
                const ce = subCorte === 'ejecucion' ? item.original : (contratosEjecucion || []).find(e => e.cotizacion_id === item.id);
                const registroCobranza = (cobranza || []).find(cob => (q && String(cob.cotizacion_id) === String(q.id)) || (ce && String(cob.contrato_ejecucion_id) === String(ce.id)));
                const mc = (masterContracts || []).find(m => String(m.id) === String(item.mc_id) || (q && String(m.id) === String(q.mc_id)));

                const numContrato = ce?.numero_contrato || q?.numero_contrato;

                return [
                    new Date(item.fecha).toLocaleDateString('es-MX'),
                    cliente?.nombre_empresa || 'S/N',
                    q?.folio || '-',
                    numContrato || 'FALTA',
                    mc ? (mc.numero_mc || mc.numero_contrato || 'VINCULADO') : 'FALTA',
                    registroCobranza?.numero_factura || 'FALTA',
                    item.monto
                ];
            });
        } else if (id === 'resumen-clientes') {
            title = "PIPELINE Y EFECTIVIDAD POR CUENTA ($)";
            headers = ['Cuenta', 'Plaza', 'Valor Abiertas', 'Valor Ganadas', 'Valor Perdidas', 'Venta Acumulada'];
            rows = (clientes || []).map(c => {
                const cCotz = (cotizaciones || []).filter(q => String(q.cliente_id) === String(c.id));

                const valAbiertas = cCotz.filter(q => q.estatus === 'borrador' || q.estatus === 'enviada')
                    .reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);

                const valGanadas = cCotz.filter(q => q.estatus === 'ganada')
                    .reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);

                const valPerdidas = cCotz.filter(q => q.estatus === 'perdida')
                    .reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);

                if (valAbiertas === 0 && valGanadas === 0 && valPerdidas === 0) return null;

                return [c.nombre_empresa, c.plaza, valAbiertas, valGanadas, valPerdidas, valGanadas];
            }).filter(Boolean);
        } else if (id === 'cobranza-periodo') {
            title = "REPORTE DE COBRANZA Y FACTURACIÓN";
            headers = ['F. Programada', 'Cliente', 'Factura', 'Monto', 'Estado', 'F. Pago Real', 'Notas'];
            rows = (cobranza || []).filter(c => {
                const fecha = new Date(c.fecha_programada_cobro || c.created_at);
                const start = new Date(fechaInicio);
                const end = new Date(fechaFin);
                end.setHours(23, 59, 59, 999);
                return fecha >= start && fecha <= end;
            }).sort((a, b) => new Date(a.fecha_programada_cobro) - new Date(b.fecha_programada_cobro)).map(c => [
                c.fecha_programada_cobro ? new Date(c.fecha_programada_cobro).toLocaleDateString('es-MX') : '-',
                c.cotizaciones?.clientes?.nombre_empresa || 'S/N',
                c.numero_factura || 'PENDIENTE',
                parseFloat(c.monto_facturado) || 0,
                c.estatus_pago?.toUpperCase() || 'PENDIENTE',
                c.fecha_cobro_real ? new Date(c.fecha_cobro_real).toLocaleDateString('es-MX') : '-',
                c.notas || '-'
            ]);
        }

        return { title, headers, rows };
    };

    const handleExportExcel = (mode = 'current') => {
        const reportIds = mode === 'all'
            ? ['ventas-mes', 'ventas-canal', 'ventas-ciudad', 'control-cierres', 'resumen-clientes', 'cobranza-periodo']
            : [seccionReporte];

        const template = `
            <?xml version="1.0"?>
            <?mso-application progid="Excel.Sheet"?>
            <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
             xmlns:o="urn:schemas-microsoft-com:office:office"
             xmlns:x="urn:schemas-microsoft-com:office:excel"
             xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
             xmlns:html="http://www.w3.org/TR/REC-html40">
             <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
              <Author>Televisa MID Cotizador</Author>
              <Created>${new Date().toISOString()}</Created>
             </DocumentProperties>
             <Styles>
              <Style ss:ID="Default" ss:Name="Normal">
               <Alignment ss:Vertical="Bottom"/>
               <Borders/>
               <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
               <Interior/>
               <NumberFormat/>
               <Protection/>
              </Style>
              <Style ss:ID="Header">
               <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#FFFFFF" ss:Bold="1"/>
               <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
              </Style>
              <Style ss:ID="Title">
               <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="14" ss:Color="#DC2626" ss:Bold="1"/>
              </Style>
              <Style ss:ID="Currency">
               <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
              </Style>
             </Styles>
             {SHEETS}
            </Workbook>`;

        let sheetsXml = "";

        reportIds.forEach(id => {
            const { title, headers, rows } = getReportData(id);
            const sheetName = id === 'ventas-mes' ? 'Mensual' :
                id === 'ventas-canal' ? 'Canal' :
                    id === 'ventas-ciudad' ? 'Ciudad' :
                        id === 'control-cierres' ? 'Cierres' :
                            id === 'cobranza-periodo' ? 'Cobranza' : 'Pipeline';

            let rowXml = "";

            // Title and Metadata
            rowXml += `<Row><Cell ss:StyleID="Title"><Data ss:Type="String">${title}</Data></Cell></Row>`;
            rowXml += `<Row><Cell><Data ss:Type="String">Periodo: ${fechaInicio} al ${fechaFin}</Data></Cell></Row>`;
            rowXml += `<Row><Cell><Data ss:Type="String">Generado: ${new Date().toLocaleString()}</Data></Cell></Row>`;
            rowXml += `<Row></Row>`;

            // Headers
            rowXml += `<Row>`;
            headers.forEach(h => {
                rowXml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`;
            });
            rowXml += `</Row>`;

            // Data Rows
            rows.forEach(row => {
                rowXml += `<Row>`;
                row.forEach((cell, cellIdx) => {
                    const header = headers[cellIdx];
                    // Identificamos columnas que NO deben ser moneda aunque sean números
                    const isTextCol = ["Orden", "Factura", "Folio", "Folio Cotz", "Master Contract"].includes(header);

                    const isNum = !isNaN(cell) && typeof cell !== 'boolean' && cell !== '' && !isTextCol;
                    const type = isNum ? 'Number' : 'String';
                    const style = isNum ? ' ss:StyleID="Currency"' : '';

                    // Limpieza de caracteres especiales para XML
                    const cleanVal = String(cell)
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;');

                    rowXml += `<Cell${style}><Data ss:Type="${type}">${isNum ? cell : cleanVal}</Data></Cell>`;
                });
                rowXml += `</Row>`;
            });

            sheetsXml += `
                <Worksheet ss:Name="${sheetName}">
                 <Table>
                  ${rowXml}
                 </Table>
                </Worksheet>`;
        });

        const finalXml = template.replace("{SHEETS}", sheetsXml);
        const filename = mode === 'all'
            ? `Reporte_Consolidado_${fechaInicio}_al_${fechaFin}.xls`
            : `Reporte_${seccionReporte}_${fechaInicio}_al_${fechaFin}.xls`;

        const blob = new Blob([finalXml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.click();
    };

    return (
        <div className="space-y-6 animate-premium-fade pb-20 px-4 print:p-0">
            {/* NEXUS INTELLIGENCE HUB - REPORTS HEADER */}
            <div className="bg-enterprise-950 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group print:hidden">
                <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-brand-orange/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-brand-orange/5 blur-3xl rounded-full" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-orange shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <BarChart3 size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-3">
                                Analytics <span className="text-brand-orange">Nexus</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                                <span>Matrices de Impacto de Medios</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="text-brand-orange/80">Datos Sincronizados: {new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleExportExcel('current')}
                            className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white hover:text-enterprise-950 transition-all group/btn"
                            title="Exportar Vista Actual"
                        >
                            <Download size={20} className="group-hover/btn:translate-y-0.5 transition-transform" />
                        </button>
                        <button
                            onClick={() => handleExportExcel('all')}
                            className="w-12 h-12 bg-white/5 border border-white/10 text-brand-orange rounded-xl flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all group/btn"
                            title="Exportar Matriz Global"
                        >
                            <Globe size={20} className="group-hover/btn:rotate-180 transition-transform duration-700" />
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-8 py-3.5 bg-brand-orange text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-brand-orange/90 transition-all shadow-xl shadow-brand-orange/20 active:scale-95"
                        >
                            <Printer size={16} strokeWidth={2.5} />
                            Imprimir Reporte
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard Navigation Matrix */}
            <div className="flex flex-col gap-4 print:hidden">
                <div className="flex flex-wrap gap-2 bg-enterprise-950 p-2 rounded-[2rem] shadow-premium border border-white/5">
                    {[
                        { id: 'ventas-mes', label: 'Matriz Regional', icon: Calendar },
                        { id: 'ventas-canal', label: 'Densidad por Canal', icon: Tv },
                        { id: 'ventas-ciudad', label: 'Hubs Regionales', icon: Globe },
                        { id: 'control-cierres', label: 'Log de Operaciones', icon: Briefcase },
                        { id: 'resumen-clientes', label: 'Valuación Pipeline', icon: FileText },
                        { id: 'cobranza-periodo', label: 'Recuperación / Cobro', icon: DollarSign },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSeccionReporte(tab.id)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-[1.2rem] text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300
                                ${seccionReporte === tab.id
                                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20'
                                    : 'text-white/40 hover:text-white'}`}
                        >
                            <tab.icon size={14} className={seccionReporte === tab.id ? 'text-white' : 'text-brand-orange'} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {['ventas-mes', 'ventas-canal', 'ventas-ciudad', 'control-cierres'].includes(seccionReporte) && (
                    <div className="flex gap-2 p-1 bg-enterprise-100 rounded-xl w-fit self-center">
                        <button
                            onClick={() => setSubCorte('pipeline')}
                            className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${subCorte === 'pipeline' ? 'bg-enterprise-950 text-white shadow-lg' : 'text-enterprise-400'}`}
                        >
                            Log Comercial (Won)
                        </button>
                        <button
                            onClick={() => setSubCorte('ejecucion')}
                            className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${subCorte === 'ejecucion' ? 'bg-brand-orange text-white shadow-lg' : 'text-enterprise-400'}`}
                        >
                            Log Financiero (Pauta)
                        </button>
                    </div>
                )}
            </div>

            {/* Selector de Período Compacto */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4 print:hidden">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Ajustar Período:</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => establecerRango('mes')} className="flex-1 md:flex-none px-3 py-1.5 bg-slate-50 rounded-lg text-[7px] sm:text-[8px] font-black uppercase hover:bg-black hover:text-white transition-all border border-slate-100">Mes Actual</button>
                    <button onClick={() => establecerRango('año')} className="flex-1 md:flex-none px-3 py-1.5 bg-slate-50 rounded-lg text-[7px] sm:text-[8px] font-black uppercase hover:bg-black hover:text-white transition-all border border-slate-100">Año Completo</button>
                </div>
                <div className="flex items-center gap-2 md:ml-auto">
                    <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-lg p-1.5 text-[9px] sm:text-[10px] font-bold focus:ring-1 focus:ring-brand-orange min-w-0" />
                    <span className="text-gray-300 font-bold text-[10px]">A</span>
                    <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-lg p-1.5 text-[9px] sm:text-[10px] font-bold focus:ring-1 focus:ring-brand-orange min-w-0" />
                </div>
            </div>

            {/* Renderizado de Tablas */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">

                {/* 1. VENTAS POR MES (Matriz Clientes x Meses) */}
                {seccionReporte === 'ventas-mes' && (
                    <>
                        <div className="p-5 sm:p-8 border-b border-enterprise-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-enterprise-950 text-white">
                            <div>
                                <h3 className="text-base sm:text-lg font-black tracking-tighter uppercase italic italic-brand">Ventas por Mes (Detallado)</h3>
                                <p className="text-[8px] sm:text-[9px] font-bold text-enterprise-400 uppercase tracking-widest mt-0.5">Consolidado mensual por cliente</p>
                            </div>
                            <div className="w-full sm:w-auto text-left sm:text-right">
                                <p className="text-[8px] sm:text-[9px] font-black uppercase text-brand-orange tracking-widest leading-none mb-1">Total Gran Acumulado</p>
                                <p className="text-xl sm:text-2xl font-black">{formatMXN(matrizMensual.granTotal)}</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-200">
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200 sm:sticky sm:left-0 bg-slate-50 z-10">Cuenta / Cliente</th>
                                        {matrizMensual.mesesColumnas.map(m => (
                                            <th key={m} className="py-4 px-4 text-center text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">{matrizMensual.mesesNombres[m]}</th>
                                        ))}
                                        <th className="py-4 px-6 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest">Total Cliente</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {matrizMensual.filas.map((f, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="py-3 px-4 sm:py-4 sm:px-6 border-r border-gray-100 sm:sticky sm:left-0 bg-white group-hover:bg-slate-50 z-10">
                                                <span className="text-[9px] sm:text-[10px] font-black text-slate-900 uppercase truncate block max-w-[120px] sm:max-w-[150px]">{f.nombre}</span>
                                            </td>
                                            {matrizMensual.mesesColumnas.map(m => (
                                                <td key={m} className="py-3 px-3 sm:py-4 sm:px-4 text-center text-[9px] sm:text-[10px] font-bold text-slate-500 border-r border-gray-100">
                                                    {f.importes[m] ? formatMXN(f.importes[m], 0) : MISSING_DATA_CHAR}
                                                </td>
                                            ))}
                                            <td className="py-3 px-4 sm:py-4 sm:px-6 text-right text-[9px] sm:text-[10px] font-black text-slate-900 bg-slate-50/20">{formatMXN(f.total, 0)}</td>
                                        </tr>
                                    ))}
                                    {/* Fila de Totales Columnas */}
                                    <tr className="bg-[#111111] text-white font-black">
                                        <td className="py-3 px-4 sm:py-4 sm:px-6 uppercase text-[8px] sm:text-[9px] tracking-widest border-r border-[#222222] sm:sticky sm:left-0 bg-[#111111] z-10">Total Mensual</td>
                                        {matrizMensual.mesesColumnas.map(m => (
                                            <td key={m} className="py-3 px-3 sm:py-4 sm:px-4 text-center text-[9px] sm:text-[10px] border-r border-slate-800">{formatMXN(matrizMensual.totalesPorMes[m], 0)}</td>
                                        ))}
                                        <td className="py-3 px-4 sm:py-4 sm:px-6 text-right text-[10px] sm:text-[11px] text-brand-orange">{formatMXN(matrizMensual.granTotal, 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* 2. VENTAS POR CANAL (Matriz Canales x Plazas) */}
                {seccionReporte === 'ventas-canal' && (
                    <>
                        <div className="p-6 md:p-8 border-b border-enterprise-700 flex justify-between items-center bg-enterprise-950 text-white">
                            <div>
                                <h3 className="text-lg font-black tracking-tighter uppercase italic italic-brand">Análisis por Canal</h3>
                                <p className="text-[9px] font-bold text-enterprise-400 uppercase tracking-widest mt-0.5 italic">Distribución territorial de inversión</p>
                            </div>
                            <Tv className="text-brand-orange flex-shrink-0" size={30} />
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-200">
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200 sm:sticky sm:left-0 bg-slate-50 z-10">Canal / Producto</th>
                                        {matrizCanales.plazas.map(p => (
                                            <th key={p} className="py-4 px-6 text-center text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">{p}</th>
                                        ))}
                                        <th className="py-4 px-6 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest">Inversión Canal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {matrizCanales.filas.map((f, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="py-4 px-6 border-r border-gray-100 sm:sticky sm:left-0 bg-white z-10">
                                                <span className="text-[10px] font-black text-slate-900 uppercase">{f.canal}</span>
                                            </td>
                                            {matrizCanales.plazas.map(p => (
                                                <td key={p} className="py-4 px-6 text-center text-[10px] font-bold text-slate-500 border-r border-gray-100">
                                                    {f.importes[p] ? formatMXN(f.importes[p]) : MISSING_DATA_CHAR}
                                                </td>
                                            ))}
                                            <td className="py-4 px-6 text-right text-[10px] font-black text-brand-orange bg-slate-50/20">{formatMXN(f.total)}</td>
                                        </tr>
                                    ))}
                                    {/* Totales por Plaza */}
                                    <tr className="bg-slate-900 text-white font-black">
                                        <td className="py-4 px-6 uppercase text-[9px] tracking-widest border-r border-slate-800 sm:sticky sm:left-0 bg-slate-900 z-10">Total Ciudad</td>
                                        {matrizCanales.plazas.map(p => (
                                            <td key={p} className="py-4 px-6 text-center text-[10px] border-r border-slate-800">{formatMXN(matrizCanales.totalesPorPlaza[p])}</td>
                                        ))}
                                        <td className="py-4 px-6 text-right text-[11px] text-brand-orange">{formatMXN(matrizCanales.granTotal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* 3. VENTAS POR CIUDAD (Matriz Clientes x Plazas) */}
                {seccionReporte === 'ventas-ciudad' && (
                    <>
                        <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-slate-900 text-white">
                            <div>
                                <h3 className="text-lg font-black tracking-tighter uppercase">Matriz Territorial</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Consolidado por plaza</p>
                            </div>
                            <Globe className="text-brand-orange flex-shrink-0" size={30} />
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[500px] md:min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-200">
                                        <th className="py-4 px-3 sm:px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200 sm:sticky sm:left-0 bg-slate-50 z-10">Cuenta / Empresa</th>
                                        {matrizCiudad.plazas.map(p => (
                                            <th key={p} className="py-4 px-3 sm:px-6 text-center text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">{p}</th>
                                        ))}
                                        <th className="py-4 px-3 sm:px-6 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest">Consolidado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {matrizCiudad.filas.map((f, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="py-4 px-3 sm:px-6 border-r border-gray-100 sm:sticky sm:left-0 bg-white z-10">
                                                <span className="text-[10px] font-black text-slate-900 uppercase block truncate max-w-[100px] sm:max-w-[120px]">{f.nombre}</span>
                                            </td>
                                            {matrizCiudad.plazas.map(p => (
                                                <td key={p} className="py-4 px-3 sm:px-6 text-center text-[10px] font-bold text-slate-500 border-r border-gray-100">
                                                    {f.importes[p] ? formatMXN(f.importes[p]) : MISSING_DATA_CHAR}
                                                </td>
                                            ))}
                                            <td className="py-4 px-3 sm:px-6 text-right text-[10px] font-black text-slate-900 bg-slate-50/20">{formatMXN(f.total)}</td>
                                        </tr>
                                    ))}
                                    {/* Totales por Plaza */}
                                    <tr className="bg-slate-900 text-white font-black">
                                        <td className="py-4 px-3 sm:px-6 uppercase text-[9px] tracking-widest border-r border-slate-800 sm:sticky sm:left-0 bg-slate-900 z-10">Total Ciudad</td>
                                        {matrizCiudad.plazas.map(p => (
                                            <td key={p} className="py-4 px-3 sm:px-6 text-center text-[10px] border-r border-slate-800">{formatMXN(matrizCiudad.totalesPorPlaza[p])}</td>
                                        ))}
                                        <td className="py-4 px-3 sm:px-6 text-right text-[11px] text-brand-orange">{formatMXN(matrizCiudad.granTotal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* 5. CONTROL DE CIERRES (Listado de Contratos y MC) */}
                {seccionReporte === 'control-cierres' && (
                    <>
                        <div className="p-6 md:p-8 border-b border-enterprise-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-enterprise-950 text-white">
                            <div>
                                <h3 className="text-lg font-black tracking-tighter uppercase italic italic-brand">
                                    {subCorte === 'pipeline' ? 'Control Administrativo de Cierres' : 'Control Administrativo de Ejecuciones'}
                                </h3>
                                <p className="text-[9px] font-bold text-enterprise-400 uppercase tracking-widest mt-0.5 italic">Folios, Contratos y Master Contracts</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase text-brand-orange tracking-widest">
                                    {subCorte === 'pipeline' ? 'Cierres en Periodo' : 'Contratos en Periodo'}
                                </p>
                                <p className="text-2xl font-black">{datosFinancierosTotal.length}</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-200">
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">Fecha {subCorte === 'pipeline' ? 'Cierre' : 'Pauta'}</th>
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">Cliente / Empresa</th>
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200">Folio Cotz</th>
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-500 uppercase tracking-widest border-r border-gray-200">Master Contract</th>
                                        <th className="py-4 px-6 text-[9px] font-black text-emerald-600 uppercase tracking-widest border-r border-gray-200">Orden / Contrato</th>
                                        <th className="py-4 px-6 text-[9px] font-black text-blue-600 uppercase tracking-widest border-r border-gray-200">Factura</th>
                                        <th className="py-4 px-6 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest">Inversión Neta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {datosFinancierosTotal.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map((item, i) => {
                                        const cliente = (clientes || []).find(c => String(c.id) === String(item.cliente_id));

                                        // Extraer datos originales para detalles
                                        const q = subCorte === 'pipeline' ? item.original : (cotizaciones || []).find(c => c.id === item.original?.cotizacion_id);
                                        const ce = subCorte === 'ejecucion' ? item.original : (contratosEjecucion || []).find(e => e.cotizacion_id === item.id);

                                        const regCob = (cobranza || []).find(cob =>
                                            (q && String(cob.cotizacion_id) === String(q.id)) ||
                                            (ce && String(cob.contrato_ejecucion_id) === String(ce.id))
                                        );

                                        const mc = (masterContracts || []).find(m =>
                                            String(m.id) === String(item.mc_id) ||
                                            (q && String(m.id) === String(q.mc_id)) ||
                                            (ce && String(m.id) === String(ce.mc_id))
                                        );

                                        return (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="py-4 px-6 text-[10px] font-bold text-gray-400 border-r border-gray-100">
                                                    {new Date(item.fecha).toLocaleDateString('es-MX')}
                                                </td>
                                                <td className="py-4 px-6 border-r border-gray-100 font-black text-[10px] text-slate-900 uppercase">
                                                    {cliente?.nombre_empresa || 'S/N'}
                                                </td>
                                                <td className="py-4 px-6 border-r border-gray-100 text-[10px] font-bold text-brand-orange uppercase tracking-tighter">
                                                    {q?.folio || '-'}
                                                </td>
                                                <td className="py-4 px-6 border-r border-gray-100 text-center">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${mc ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-400'}`}>
                                                        {mc ? (mc.numero_mc || mc.numero_contrato || 'VINCULADO') : 'FALTA'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 border-r border-gray-100 text-center">
                                                    {(() => {
                                                        const numContrato = ce?.numero_contrato || q?.numero_contrato;
                                                        return (
                                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${numContrato ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                                                                {numContrato || 'FALTA'}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="py-4 px-6 border-r border-gray-100 text-center">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${regCob?.numero_factura ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-400'}`}>
                                                        {regCob?.numero_factura || 'FALTA'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right text-[10px] font-black text-slate-900">
                                                    {formatMXN(item.monto)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {datosFinancierosTotal.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="py-20 text-center text-[10px] font-black text-gray-300 uppercase italic tracking-widest">Sin registros en este periodo</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
                {seccionReporte === 'resumen-clientes' && (
                    <div>
                        <div className="p-8 border-b border-enterprise-700 flex justify-between items-center bg-enterprise-950 text-white">
                            <div>
                                <h3 className="text-lg font-black tracking-tighter uppercase italic italic-brand">Pipeline de Ventas y Efectividad</h3>
                                <p className="text-[9px] font-bold text-enterprise-400 uppercase tracking-widest mt-0.5 italic">Estado actual de propuestas por cuenta</p>
                            </div>
                            <Layout className="text-brand-orange" size={30} />
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[700px]">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Cuenta</th>
                                        <th className="py-4 px-6 text-center text-[9px] font-black text-blue-500 uppercase tracking-widest">Valor Abiertas</th>
                                        <th className="py-4 px-6 text-center text-[9px] font-black text-emerald-500 uppercase tracking-widest">Valor Ganadas</th>
                                        <th className="py-4 px-6 text-center text-[9px] font-black text-brand-orange uppercase tracking-widest">Valor Perdidas</th>
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
                                                <td className="py-4 px-6 text-center font-bold text-[10px] text-blue-600">
                                                    {formatMXN(cCotz.filter(q => q.estatus === 'borrador' || q.estatus === 'enviada').reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0))}
                                                </td>
                                                <td className="py-4 px-6 text-center font-bold text-[10px] text-emerald-600">
                                                    {formatMXN(cCotz.filter(q => q.estatus === 'ganada').reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0))}
                                                </td>
                                                <td className="py-4 px-6 text-center font-bold text-[10px] text-brand-orange">
                                                    {formatMXN(cCotz.filter(q => q.estatus === 'perdida').reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0))}
                                                </td>
                                                <td className="py-4 px-6 text-right text-[10px] font-black text-slate-900">{formatMXN(monto)}</td>
                                            </tr>
                                        );
                                    }).filter(Boolean)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. REPORTE DE COBRANZA */}
                {seccionReporte === 'cobranza-periodo' && (
                    <>
                        {(() => {
                            const filtrados = (cobranza || []).filter(c => {
                                const fecha = new Date(c.fecha_programada_cobro || c.created_at);
                                const start = new Date(fechaInicio);
                                const end = new Date(fechaFin);
                                end.setHours(23, 59, 59, 999);
                                return fecha >= start && fecha <= end;
                            });
                            const totalFacturado = filtrados.reduce((acc, c) => acc + (parseFloat(c.monto_facturado) || 0), 0);
                            const totalCobrado = filtrados.filter(c => c.estatus_pago === 'cobrado').reduce((acc, c) => acc + (parseFloat(c.monto_facturado) || 0), 0);
                            const pendiente = totalFacturado - totalCobrado;

                            return (
                                <>
                                    <div className="p-5 sm:p-8 border-b border-gray-50 bg-slate-900 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="bg-emerald-500/10 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-emerald-500/20 flex-shrink-0">
                                                <DollarSign className="text-emerald-500" size={window.innerWidth < 640 ? 24 : 32} />
                                            </div>
                                            <div>
                                                <h3 className="text-base sm:text-xl font-black uppercase tracking-tighter leading-tight">Facturación y Cobranza</h3>
                                                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Corte periódico de ingresos</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full lg:w-auto mt-4 lg:mt-0">
                                            <div className="text-left md:text-right border-l-2 md:border-l-0 border-white/10 pl-3 md:pl-0">
                                                <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5 italic">Facturación Emitida</p>
                                                <p className="text-base md:text-xl font-black">{formatMXN(filtrados.filter(c => c.numero_factura).reduce((acc, c) => acc + (parseFloat(c.monto_facturado) || 0), 0), 0)}</p>
                                            </div>
                                            <div className="text-left md:text-right border-l-2 md:border-l-0 border-blue-500/30 pl-3 md:pl-0">
                                                <p className="text-[7px] md:text-[8px] font-black text-blue-500 uppercase tracking-widest mb-0.5 italic">Pendiente Factura</p>
                                                <p className="text-base md:text-xl font-black text-blue-400">{formatMXN(filtrados.filter(c => !c.numero_factura).reduce((acc, c) => acc + (parseFloat(c.monto_facturado) || 0), 0), 0)}</p>
                                            </div>
                                            <div className="text-left md:text-right border-l-2 md:border-l-0 border-emerald-500/30 pl-3 md:pl-0">
                                                <p className="text-[7px] md:text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-0.5 italic">Total Cobrado</p>
                                                <p className="text-base md:text-xl font-black text-emerald-500">{formatMXN(totalCobrado, 0)}</p>
                                            </div>
                                            <div className="text-left md:text-right border-l-2 md:border-l-0 border-brand-orange/30 pl-3 md:pl-0">
                                                <p className="text-[7px] md:text-[8px] font-black text-brand-orange uppercase tracking-widest mb-0.5 italic">Por Recuperar</p>
                                                <p className="text-base md:text-xl font-black text-brand-orange">{formatMXN(totalFacturado - totalCobrado, 0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                                    <th className="px-8 py-5">F. Programada</th>
                                                    <th className="px-8 py-5">Cliente</th>
                                                    <th className="px-8 py-5">Factura</th>
                                                    <th className="px-8 py-5 text-right">Importe</th>
                                                    <th className="px-8 py-5 text-center">Estatus</th>
                                                    <th className="px-8 py-5 text-center">Fecha Cobro</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {filtrados.sort((a, b) => new Date(a.fecha_programada_cobro) - new Date(b.fecha_programada_cobro)).map((c, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-8 py-5 text-[11px] font-bold text-slate-500">
                                                            {c.fecha_programada_cobro ? new Date(c.fecha_programada_cobro).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <p className="text-xs font-black text-slate-900 uppercase">{c.cotizaciones?.clientes?.nombre_empresa || 'S/N'}</p>
                                                            <p className="text-[9px] font-bold text-brand-orange uppercase tracking-tight">Folio Q: {c.cotizaciones?.folio || 'S/N'}</p>
                                                        </td>
                                                        <td className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {c.numero_factura || 'PENDIENTE'}
                                                        </td>
                                                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                                                            {formatMXN(c.monto_facturado)}
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest
                                                                ${c.estatus_pago === 'cobrado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                                    c.estatus_pago === 'vencido' ? 'bg-red-50 text-brand-orange border border-red-100' :
                                                                        'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                                {c.estatus_pago}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase italic">
                                                            {c.fecha_cobro_real ? new Date(c.fecha_cobro_real).toLocaleDateString() : 'Pendiente'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filtrados.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="py-24 text-center">
                                                            <p className="text-xs font-black text-slate-300 uppercase italic tracking-widest">Sin registros de cobranza en este periodo</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            );
                        })()}
                    </>
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
