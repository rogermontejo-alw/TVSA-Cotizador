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
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // 📅 Periodo
    const hoy = new Date();
    const [fechaInicio, setFechaInicio] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]);
    const [ignorarPeriodo, setIgnorarPeriodo] = useState(false);

    const establecerRango = (tipo) => {
        const d = new Date();
        setIgnorarPeriodo(false);
        if (tipo === 'mes') {
            setFechaInicio(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
            setFechaFin(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
        } else if (tipo === 'año') {
            setFechaInicio(new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]);
            setFechaFin(new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0]);
        } else if (tipo === 'todo') {
            setIgnorarPeriodo(true);
        }
    };

    // 📊 Datos para Reportes (Basados en el subCorte)
    const ganadas = useMemo(() => {
        return (cotizaciones || []).filter(q => {
            if (q.estatus !== 'ganada') return false;
            if (ignorarPeriodo) return true;
            const fechaQ = new Date(q.fecha_cierre_real || q.created_at || q.fecha);
            const start = new Date(fechaInicio);
            const end = new Date(fechaFin);
            end.setHours(23, 59, 59, 999);
            return fechaQ >= start && fechaQ <= end;
        });
    }, [cotizaciones, fechaInicio, fechaFin, ignorarPeriodo]);

    // 🚩 Ventas Ganadas que aún no tienen un Contrato de Ejecución (En Limbo)
    const ganadasSinContrato = useMemo(() => {
        return (cotizaciones || []).filter(q => {
            if (q.estatus !== 'ganada') return false;
            // Solo nos interesan las que NO tienen contrato vinculado
            return !(contratosEjecucion || []).some(ce => String(ce.id_cotizacion || ce.cotizacion_id) === String(q.id));
        });
    }, [cotizaciones, contratosEjecucion]);

    const totalPorFormalizar = useMemo(() => {
        return ganadasSinContrato.reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);
    }, [ganadasSinContrato]);

    // 📊 Datos Base para Reportes de Ventas (Fijos a Ejecución para consistencia en Matrices)
    const datosVentasBase = useMemo(() => {
        return (contratosEjecucion || []).filter(ce => {
            if (ignorarPeriodo) return true;
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
    }, [contratosEjecucion, fechaInicio, fechaFin, ignorarPeriodo]);

    // 📊 Datos para el Reporte de Convenios (Permite toggle entre Pipeline/Ejecución si fuera necesario, 
    // pero actualmente usa masterContracts directamente en getReportData)
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
            return datosVentasBase;
        }
    }, [ganadas, datosVentasBase, subCorte]);

    // 1. REPORTE: Ventas por Mes (Corte Mensual Matrix: Clientes x Meses)
    const matrizMensual = useMemo(() => {
        const mesesNombres = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const clienteMap = {}; // { clienteId: { mes: monto } }
        const mesesVisibles = new Set();
        const totalesPorMes = {};

        datosVentasBase.forEach(item => {
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
    }, [datosVentasBase, clientes]);

    // 2. REPORTE: Ventas por Canal (Matriz: Canales x Ciudades)
    const matrizCanales = useMemo(() => {
        const canalesMap = {}; // { canal: { plaza: monto } }
        const plazasSet = new Set();
        const totalesPorPlaza = {};

        datosVentasBase.forEach(item => {
            // En reportes de canal SIEMPRE usamos la perspectiva de Ejecución (Contratos) para ser precisos
            const ce = (contratosEjecucion || []).find(e => e.id === item.id);
            const q = (cotizaciones || []).find(c => c.id === ce?.cotizacion_id);

            if (q) {
                // 1. Pauta tradicional
                (q.items || []).forEach(i => {
                    const canal = i.producto?.canal || 'Otros';
                    const plazaItem = i.producto?.plaza || 'Mérida';

                    plazasSet.add(plazaItem);
                    if (!canalesMap[canal]) canalesMap[canal] = {};

                    const montoItem = (i.subtotal || 0);
                    canalesMap[canal][plazaItem] = (canalesMap[canal][plazaItem] || 0) + montoItem;
                    totalesPorPlaza[plazaItem] = (totalesPorPlaza[plazaItem] || 0) + montoItem;
                });

                // 2. VIX
                const costoVIX = parseFloat(q.costoVIX || (q.paqueteVIX?.inversion) || 0);
                if (costoVIX > 0) {
                    const canalVIX = 'VIX';
                    const plazaVIX = q.clientes?.plaza || 'Nacional';
                    plazasSet.add(plazaVIX);
                    if (!canalesMap[canalVIX]) canalesMap[canalVIX] = {};
                    canalesMap[canalVIX][plazaVIX] = (canalesMap[canalVIX][plazaVIX] || 0) + costoVIX;
                    totalesPorPlaza[plazaVIX] = (totalesPorPlaza[plazaVIX] || 0) + costoVIX;
                }
            } else {
                const canal = 'Sin Clasificar';
                const dummyPlaza = 'Mérida';
                plazasSet.add(dummyPlaza);
                if (!canalesMap[canal]) canalesMap[canal] = {};
                canalesMap[canal][dummyPlaza] = (canalesMap[canal][dummyPlaza] || 0) + item.monto;
                totalesPorPlaza[dummyPlaza] = (totalesPorPlaza[dummyPlaza] || 0) + item.monto;
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
    }, [datosVentasBase, clientes, cotizaciones, contratosEjecucion]);

    // 3. REPORTE: Ventas por Ciudad (Matriz: Clientes x Ciudades)
    const matrizCiudad = useMemo(() => {
        const clienteMap = {}; // { clienteId: { plaza: monto } }
        const plazasSet = new Set();
        const totalesPorPlaza = {};

        datosVentasBase.forEach(item => {
            const cliente = (clientes || []).find(c => String(c.id) === String(item.cliente_id));
            const cId = item.cliente_id;
            const clienteNombre = cliente?.nombre_empresa || 'S/N';

            if (!clienteMap[cId]) {
                clienteMap[cId] = { nombre: clienteNombre, importes: {} };
            }

            // SIEMPRE perspectiva de Ejecutoría (Contratos)
            const ce = (contratosEjecucion || []).find(e => e.id === item.id);
            const q = (cotizaciones || []).find(c => c.id === ce?.cotizacion_id);

            if (q) {
                // 1. Pauta tradicional
                (q.items || []).forEach(i => {
                    const plazaItem = i.producto?.plaza || 'Mérida';
                    const montoItem = (i.subtotal || 0);

                    plazasSet.add(plazaItem);
                    clienteMap[cId].importes[plazaItem] = (clienteMap[cId].importes[plazaItem] || 0) + montoItem;
                    totalesPorPlaza[plazaItem] = (totalesPorPlaza[plazaItem] || 0) + montoItem;
                });

                // 2. VIX
                const costoVIX = parseFloat(q.costoVIX || (q.paqueteVIX?.inversion) || 0);
                if (costoVIX > 0) {
                    const plazaVIX = q.clientes?.plaza || 'Nacional';
                    plazasSet.add(plazaVIX);
                    clienteMap[cId].importes[plazaVIX] = (clienteMap[cId].importes[plazaVIX] || 0) + costoVIX;
                    totalesPorPlaza[plazaVIX] = (totalesPorPlaza[plazaVIX] || 0) + costoVIX;
                }
            } else {
                const plazaFallback = cliente?.plaza || 'Mérida';
                plazasSet.add(plazaFallback);
                clienteMap[cId].importes[plazaFallback] = (clienteMap[cId].importes[plazaFallback] || 0) + item.monto;
                totalesPorPlaza[plazaFallback] = (totalesPorPlaza[plazaFallback] || 0) + item.monto;
            }
        });

        const plazas = Array.from(plazasSet).sort();
        const filas = Object.values(clienteMap).map(c => ({
            nombre: c.nombre,
            importes: c.importes,
            total: Object.values(c.importes).reduce((a, b) => a + b, 0)
        })).sort((a, b) => b.total - a.total);

        const granTotal = Object.values(totalesPorPlaza).reduce((a, b) => a + b, 0);

        return { plazas, filas, totalesPorPlaza, granTotal };
    }, [datosVentasBase, clientes, cotizaciones, contratosEjecucion]);

    const getReportData = (id, forcedCorte = null) => {
        const activeCorte = forcedCorte || subCorte;
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
            if (activeCorte === 'pipeline') {
                title = "SALDOS POR CONVENIO (CPS)";
                headers = ['CPS (Convenio)', 'Cliente', 'Bolsa Original (Convenio)', 'Monto Contratado', 'Saldo Disponible', 'Monto Facturado', 'Cobranza Real'];

                const mcSummaries = (masterContracts || []).map(mc => {
                    const ecs = (contratosEjecucion || []).filter(ce => String(ce.mc_id) === String(mc.id));
                    const montoEjecutado = ecs.reduce((acc, ce) => acc + (parseFloat(ce.monto_ejecucion) || 0), 0);
                    const facturas = (cobranza || []).filter(cob => ecs.some(ce => String(ce.id) === String(cob.contrato_ejecucion_id)));
                    const montoFacturado = facturas.reduce((acc, fac) => acc + (parseFloat(fac.monto_facturado) || 0), 0);
                    const montoCobrado = facturas.filter(f => f.estatus_pago === 'cobrado').reduce((acc, fac) => acc + (parseFloat(fac.monto_facturado) || 0), 0);
                    const cliente = (clientes || []).find(c => String(c.id) === String(mc.cliente_id));
                    const aprobado = parseFloat(mc.monto_aprobado) || 0;
                    const disponible = aprobado - montoEjecutado;

                    return {
                        numero_mc: mc.numero_mc || 'REF',
                        cliente: cliente?.nombre_empresa || 'S/N',
                        aprobado,
                        ejecutado: montoEjecutado,
                        disponible,
                        facturado: montoFacturado,
                        cobranza: montoCobrado
                    };
                }).filter(s => s.aprobado > 0 || s.ejecutado > 0);

                const dataRows = mcSummaries.map(s => [
                    s.numero_mc,
                    s.cliente,
                    s.aprobado,
                    s.ejecutado,
                    s.disponible,
                    s.facturado,
                    s.cobranza
                ]);

                const totalAprobado = mcSummaries.reduce((acc, s) => acc + s.aprobado, 0);
                const totalEjecutado = mcSummaries.reduce((acc, s) => acc + s.ejecutado, 0);
                const totalDisponible = mcSummaries.reduce((acc, s) => acc + s.disponible, 0);
                const totalFacturado = mcSummaries.reduce((acc, s) => acc + s.facturado, 0);
                const totalCobranza = mcSummaries.reduce((acc, s) => acc + s.cobranza, 0);

                rows = [
                    ...dataRows,
                    ['TOTAL CONSOLIDADO', '', totalAprobado, totalEjecutado, totalDisponible, totalFacturado, totalCobranza]
                ];
            } else {
                title = "LIBRO MAYOR DE CONVENIOS";
                headers = ['Fecha', 'Concepto', 'Folio Cotz', 'Cliente', 'Ref. Master', 'Ref. Contrato', 'Factura', 'Monto'];

                const eventRows = [];
                let totalGeneralMonto = 0;
                const processedCEs = new Set();

                (masterContracts || []).sort((a, b) => b.monto_aprobado - a.monto_aprobado).forEach(mc => {
                    const ecs = (contratosEjecucion || []).filter(ce => String(ce.mc_id) === String(mc.id));
                    const cliente = (clientes || []).find(c => String(c.id) === String(mc.cliente_id));

                    if (ecs.length > 0) {
                        eventRows.push([
                            new Date(mc.fecha_inicio || mc.created_at).toLocaleDateString('es-MX'),
                            `CONVENIO: ${mc.numero_mc || 'REF'}`,
                            '-',
                            cliente?.nombre_empresa || 'S/N',
                            mc.numero_mc || 'REF',
                            '-',
                            '-',
                            parseFloat(mc.monto_aprobado) || 0
                        ]);

                        ecs.sort((a, b) => new Date(a.fecha_inicio_pauta) - new Date(b.fecha_inicio_pauta)).forEach(ce => {
                            processedCEs.add(ce.id);
                            const montoCE = parseFloat(ce.monto_ejecucion) || 0;
                            totalGeneralMonto += montoCE;
                            const q = (cotizaciones || []).find(quote => String(quote.id) === String(ce.cotizacion_id));

                            eventRows.push([
                                new Date(ce.fecha_inicio_pauta).toLocaleDateString('es-MX'),
                                `  [CONTRATO]`,
                                q?.folio || '-',
                                cliente?.nombre_empresa || 'S/N',
                                mc.numero_mc || '-',
                                ce.numero_contrato || '-',
                                '-',
                                montoCE
                            ]);

                            const facturas = (cobranza || []).filter(cob => String(cob.contrato_ejecucion_id) === String(ce.id));
                            facturas.sort((a, b) => new Date(a.fecha_programada_cobro) - new Date(b.fecha_programada_cobro)).forEach(fac => {
                                eventRows.push([
                                    fac.fecha_programada_cobro ? new Date(fac.fecha_programada_cobro).toLocaleDateString('es-MX') : '-',
                                    `    >> FACTURA`,
                                    q?.folio || '-',
                                    cliente?.nombre_empresa || 'S/N',
                                    mc.numero_mc || '-',
                                    ce.numero_contrato || '-',
                                    fac.numero_factura || 'PENDIENTE',
                                    parseFloat(fac.monto_facturado) || 0
                                ]);
                            });
                        });
                        eventRows.push(['', '', '', '', '', '', '', '']);
                    }
                });

                const directCEs = (contratosEjecucion || []).filter(ce => !ce.mc_id && !processedCEs.has(ce.id));
                if (directCEs.length > 0) {
                    eventRows.push(['-', 'VENTAS DIRECTAS', '-', '-', '-', '-', '-', '-']);
                    directCEs.forEach(ce => {
                        const cliente = (clientes || []).find(c => String(c.id) === String(ce.cliente_id));
                        const montoCE = parseFloat(ce.monto_ejecucion) || 0;
                        totalGeneralMonto += montoCE;
                        const q = (cotizaciones || []).find(quote => String(quote.id) === String(ce.cotizacion_id));

                        eventRows.push([
                            new Date(ce.fecha_inicio_pauta).toLocaleDateString('es-MX'),
                            `[DIRECTO]`,
                            q?.folio || '-',
                            cliente?.nombre_empresa || 'S/N',
                            '-',
                            ce.numero_contrato || '-',
                            '-',
                            montoCE
                        ]);

                        const facturas = (cobranza || []).filter(cob => String(cob.contrato_ejecucion_id) === String(ce.id));
                        facturas.forEach(fac => {
                            eventRows.push([
                                fac.fecha_programada_cobro ? new Date(fac.fecha_programada_cobro).toLocaleDateString('es-MX') : '-',
                                `  >> FACTURA`,
                                q?.folio || '-',
                                cliente?.nombre_empresa || 'S/N',
                                '-',
                                ce.numero_contrato || '-',
                                fac.numero_factura || 'PENDIENTE',
                                parseFloat(fac.monto_facturado) || 0
                            ]);
                        });
                    });
                }

                rows = [
                    ['DETALLE CRONOLÓGICO DE OPERACIONES', '', '', '', '', '', '', ''],
                    ['Fecha', 'Concepto', 'Folio Cotz', 'Cliente', 'Ref. Master', 'Ref. Contrato', 'Factura', 'Monto Transacción'],
                    ...eventRows,
                    ['TOTAL GENERAL EJECUTADO', '', '', '', '', '', '', totalGeneralMonto]
                ];
            }
        } else if (id === 'resumen-clientes') {
        } else if (id === 'resumen-clientes') {
            title = "PIPELINE Y EFECTIVIDAD POR CUENTA ($)";
            headers = ['Cuenta', 'Valor Abiertas', 'Valor Ganadas', 'Valor Perdidas', 'Venta Acumulada'];

            let totalAbiertas = 0;
            let totalGanadas = 0;
            let totalPerdidas = 0;
            let totalAcumulada = 0;

            const dataRows = (clientes || []).map(c => {
                const cCotz = (cotizaciones || []).filter(q => String(q.cliente_id) === String(c.id));
                const valAbiertas = cCotz.filter(q => q.estatus === 'borrador' || q.estatus === 'enviada').reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);
                const valGanadas = cCotz.filter(q => q.estatus === 'ganada').reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);
                const valPerdidas = cCotz.filter(q => q.estatus === 'perdida').reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);

                if (valAbiertas === 0 && valGanadas === 0 && valPerdidas === 0) return null;

                totalAbiertas += valAbiertas;
                totalGanadas += valGanadas;
                totalPerdidas += valPerdidas;
                totalAcumulada += valGanadas;

                return [c.nombre_empresa, valAbiertas, valGanadas, valPerdidas, valGanadas];
            }).filter(Boolean);

            rows = [
                ...dataRows,
                ['TOTAL GENERAL', totalAbiertas, totalGanadas, totalPerdidas, totalAcumulada]
            ];
        } else if (id === 'cobranza-periodo') {
            title = "REPORTE DE COBRANZA Y FACTURACIÓN";
            headers = ['F. Programada', 'Cliente', 'Factura', 'Monto', 'Estado', 'F. Pago Real', 'Notas'];

            let totalFacturado = 0;
            let totalCobrado = 0;

            const dataRows = (cobranza || []).filter(c => {
                const fecha = new Date(c.fecha_programada_cobro || c.created_at);
                const start = new Date(fechaInicio);
                const end = new Date(fechaFin);
                end.setHours(23, 59, 59, 999);
                return fecha >= start && fecha <= end;
            }).sort((a, b) => new Date(a.fecha_programada_cobro) - new Date(b.fecha_programada_cobro)).map(c => {
                const monto = parseFloat(c.monto_facturado) || 0;
                totalFacturado += monto;
                if (c.estatus_pago === 'cobrado') totalCobrado += monto;

                return [
                    c.fecha_programada_cobro ? new Date(c.fecha_programada_cobro).toLocaleDateString('es-MX') : '-',
                    c.cotizaciones?.clientes?.nombre_empresa || 'S/N',
                    c.numero_factura || 'PENDIENTE',
                    monto,
                    c.estatus_pago?.toUpperCase() || 'PENDIENTE',
                    c.fecha_cobro_real ? new Date(c.fecha_cobro_real).toLocaleDateString('es-MX') : '-',
                    c.notas || '-'
                ];
            });

            rows = [
                ...dataRows,
                ['TOTAL COBRANZA', '', '', totalFacturado, '', '', '']
            ];
        }

        return { title, headers, rows };
    };

    const handleExportExcel = (mode = 'current') => {
        // Definición de reportes a exportar
        let reportConfigs = [];

        if (mode === 'all') {
            reportConfigs = [
                { id: 'ventas-mes', name: 'Mensual' },
                { id: 'ventas-canal', name: 'Canal' },
                { id: 'ventas-ciudad', name: 'Territorial' },
                { id: 'control-cierres', sub: 'pipeline', name: 'Saldos Convenio' },
                { id: 'control-cierres', sub: 'ejecucion', name: 'Libro Mayor' },
                { id: 'resumen-clientes', name: 'Clientes' },
                { id: 'cobranza-periodo', name: 'Cobranza' }
            ];
        } else {
            if (seccionReporte === 'control-cierres') {
                reportConfigs = [
                    { id: 'control-cierres', sub: 'pipeline', name: 'Saldos Convenio' },
                    { id: 'control-cierres', sub: 'ejecucion', name: 'Libro Mayor' }
                ];
            } else {
                const namesMap = {
                    'ventas-mes': 'Mensual',
                    'ventas-canal': 'Canal',
                    'ventas-ciudad': 'Territorial',
                    'resumen-clientes': 'Clientes',
                    'cobranza-periodo': 'Cobranza'
                };
                reportConfigs = [{ id: seccionReporte, name: namesMap[seccionReporte] || 'Reporte' }];
            }
        }

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
               <Alignment ss:Vertical="Center"/>
               <Borders/>
               <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
               <Interior/>
               <NumberFormat/>
               <Protection/>
              </Style>
              <Style ss:ID="Header">
               <Alignment ss:Vertical="Center"/>
               <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#FFFFFF" ss:Bold="1"/>
               <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
              </Style>
              <Style ss:ID="Title">
               <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="14" ss:Color="#DC2626" ss:Bold="1"/>
              </Style>
              <Style ss:ID="Currency">
               <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
              </Style>
              <Style ss:ID="TotalCurrency">
               <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#FFFFFF" ss:Bold="1"/>
               <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
               <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
              </Style>
              <Style ss:ID="SummaryHeader">
               <Alignment ss:Vertical="Center"/>
               <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#0F172A" ss:Bold="1"/>
               <Interior ss:Color="#CBD5E1" ss:Pattern="Solid"/>
               <Borders>
                <Bottom ss:LineStyle="Continuous" ss:Weight="1"/>
               </Borders>
              </Style>
              <Style ss:ID="SectionTitle">
                <Alignment ss:Vertical="Center"/>
                <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#0F172A" ss:Bold="1"/>
                <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
              </Style>
             </Styles>
             {SHEETS}
            </Workbook>`;

        let sheetsXml = "";

        reportConfigs.forEach(config => {
            const { title, headers, rows } = getReportData(config.id, config.sub);
            const sheetName = config.name;

            let rowXml = "";

            // Title and Metadata
            rowXml += `<Row ss:Height="22"><Cell ss:StyleID="Title"><Data ss:Type="String">${title}</Data></Cell></Row>`;
            rowXml += `<Row ss:Height="22"><Cell><Data ss:Type="String">Periodo: ${fechaInicio} al ${fechaFin}</Data></Cell></Row>`;
            rowXml += `<Row ss:Height="22"><Cell><Data ss:Type="String">Generado: ${new Date().toLocaleString()}</Data></Cell></Row>`;
            rowXml += `<Row ss:Height="22"></Row>`;

            // Headers
            rowXml += `<Row ss:Height="22">`;
            headers.forEach(h => {
                rowXml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`;
            });
            rowXml += `</Row>`;

            // Data Rows
            rows.forEach(row => {
                const isTotalRow = String(row[0]).startsWith('TOTAL');
                const isSectionTitle = String(row[0]).includes('RESUMEN EJECUTIVO') || String(row[0]).includes('DETALLE CRONOLÓGICO');
                const isTableSubHeader = String(row[0]) === 'Master Contract' || (String(row[1]) === 'Concepto' && String(row[2]) === 'Folio Cotz');
                const isGroupHeader = String(row[1]).includes('CONVENIO') || String(row[1]).includes('VENTAS DIRECTAS');

                rowXml += `<Row ss:Height="${isSectionTitle ? '25' : '22'}">`;
                row.forEach((cell, cellIdx) => {
                    const header = headers[cellIdx];
                    const isTextCol = !header?.includes('Total') && ["Orden", "Factura", "Folio", "Ref.", "Contrato", "Folio Cotz", "Master Contract", "Cuenta", "Plaza", "Orden / Contrato", "Estado", "F. Pago Real", "F. Programada", "Cliente", "Canal"].some(tc => header?.includes(tc));

                    const isNum = !isNaN(cell) && typeof cell !== 'boolean' && cell !== '' && !isTextCol;
                    const type = isNum ? 'Number' : 'String';

                    let styleID = "";
                    if (isSectionTitle) {
                        styleID = ' ss:StyleID="SectionTitle"';
                    } else if (isTableSubHeader) {
                        styleID = ' ss:StyleID="SummaryHeader"';
                    } else if (isTotalRow) {
                        styleID = isNum ? ' ss:StyleID="TotalCurrency"' : ' ss:StyleID="Header"';
                    } else if (isGroupHeader) {
                        styleID = isNum ? ' ss:StyleID="Currency"' : ' ss:StyleID="SectionTitle"';
                    } else if (isNum) {
                        styleID = ' ss:StyleID="Currency"';
                    }

                    const cleanVal = String(cell || '')
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;');

                    rowXml += `<Cell${styleID}><Data ss:Type="${type}">${isNum ? cell : cleanVal}</Data></Cell>`;
                });
                rowXml += `</Row>`;
            });

            // Column Width definitions
            let colWidthsXml = "";
            headers.forEach((h, hIdx) => {
                let width = 100; // Default width
                if (h.includes('Concepto')) width = 220;
                else if (h.includes('Cliente') || h.includes('Cuenta') || h.includes('Empresa')) width = 250;
                else if (h.includes('Canal') || h.includes('Notas')) width = 180;
                else if (h.includes('Total') || h.includes('Monto') || h.includes('Transacción') || h.includes('Inversión')) width = 120;
                else if (h.includes('Ref.')) width = 130;
                else if (h.includes('Fecha') || h.includes('F. ')) width = 80;
                else if (h.includes('Folio') || h.includes('Factura') || h.includes('Contrato')) width = 110;

                colWidthsXml += `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`;
            });

            sheetsXml += `
                <Worksheet ss:Name="${sheetName}">
                 <Table>
                  ${colWidthsXml}
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
                        { id: 'control-cierres', label: 'Control de Convenios', icon: Briefcase },
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

                {seccionReporte === 'control-cierres' && (
                    <div className="flex bg-enterprise-900 border border-white/10 rounded-xl overflow-hidden self-center ml-auto h-14">
                        <button
                            onClick={() => setSubCorte('pipeline')}
                            className={`w-40 h-full px-4 text-[10px] font-black uppercase tracking-widest transition-all leading-tight whitespace-normal text-center flex items-center justify-center ${subCorte === 'pipeline' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Saldos por Convenio
                        </button>
                        <button
                            onClick={() => setSubCorte('ejecucion')}
                            className={`w-40 h-full px-4 text-[10px] font-black uppercase tracking-widest transition-all leading-tight whitespace-normal text-center flex items-center justify-center ${subCorte === 'ejecucion' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Libro Mayor
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
                    <button onClick={() => establecerRango('mes')} className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-[7px] sm:text-[8px] font-black uppercase transition-all border ${!ignorarPeriodo && fechaInicio.includes('-' + (hoy.getMonth() + 1).toString().padStart(2, '0')) ? 'bg-enterprise-950 text-white' : 'bg-slate-50 text-slate-600 hover:bg-black hover:text-white border-slate-100'}`}>Mes Actual</button>
                    <button onClick={() => establecerRango('año')} className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-[7px] sm:text-[8px] font-black uppercase transition-all border ${!ignorarPeriodo && fechaInicio.endsWith('-01-01') ? 'bg-enterprise-950 text-white' : 'bg-slate-50 text-slate-600 hover:bg-black hover:text-white border-slate-100'}`}>Año Completo</button>
                    <button onClick={() => establecerRango('todo')} className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-[7px] sm:text-[8px] font-black uppercase transition-all border ${ignorarPeriodo ? 'bg-brand-orange text-white border-brand-orange' : 'bg-slate-50 text-slate-600 hover:bg-brand-orange hover:text-white border-slate-100'}`}>Historial Completo</button>
                </div>
                <div className={`flex items-center gap-2 md:ml-auto transition-opacity ${ignorarPeriodo ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <input type="date" value={fechaInicio} onChange={(e) => { setFechaInicio(e.target.value); setIgnorarPeriodo(false); }} className="flex-1 bg-slate-50 border-none rounded-lg p-1.5 text-[9px] sm:text-[10px] font-bold focus:ring-1 focus:ring-brand-orange min-w-0" />
                    <span className="text-gray-300 font-bold text-[10px]">A</span>
                    <input type="date" value={fechaFin} onChange={(e) => { setFechaFin(e.target.value); setIgnorarPeriodo(false); }} className="flex-1 bg-slate-50 border-none rounded-lg p-1.5 text-[9px] sm:text-[10px] font-bold focus:ring-1 focus:ring-brand-orange min-w-0" />
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
                                    {subCorte === 'pipeline' ? 'Saldos por Convenio (CPS)' : 'Libro Mayor de Convenios'}
                                </h3>
                                <p className="text-[9px] font-bold text-enterprise-400 uppercase tracking-widest mt-0.5 italic flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></div>
                                    Trazabilidad y Control Documental
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right border-r border-slate-700 pr-4">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Convenios</p>
                                    <p className="text-xl font-black text-white">
                                        {formatMXN(masterContracts.reduce((acc, m) => acc + (parseFloat(m.monto_aprobado) || 0), 0))}
                                    </p>
                                </div>
                                <div className="text-right border-r border-slate-700 pr-4">
                                    <p className="text-[9px] font-black uppercase text-brand-orange tracking-widest">Contratos</p>
                                    <p className="text-xl font-black text-brand-orange">
                                        {formatMXN(contratosEjecucion.reduce((acc, c) => acc + (parseFloat(c.monto_ejecucion) || 0), 0))}
                                    </p>
                                </div>
                                <div className="text-right border-r border-slate-700 pr-4">
                                    <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Facturación</p>
                                    <p className="text-xl font-black text-blue-400">
                                        {formatMXN(cobranza.reduce((acc, f) => acc + (parseFloat(f.monto_facturado) || 0), 0))}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase text-amber-400 tracking-widest">Por Formalizar</p>
                                    <p className="text-xl font-black text-amber-400">
                                        {formatMXN(totalPorFormalizar)}
                                    </p>
                                </div>
                            </div>
                        </div>





                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-200">
                                        {(() => {
                                            const { headers } = getReportData('control-cierres');
                                            return headers.map((h, idx) => (
                                                <th key={idx} className={`py-4 px-6 text-[9px] font-black text-slate-900 uppercase tracking-widest border-r border-gray-200 ${idx === headers.length - 1 ? 'text-right' : ''}`}>
                                                    {h}
                                                </th>
                                            ));
                                        })()}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(() => {
                                        const { rows } = getReportData('control-cierres');
                                        // En modo Libro Mayor (ejecucion), filtramos para mostrar solo el log
                                        const eventRowsStart = rows.findIndex(r => r[0] === 'DETALLE CRONOLÓGICO DE OPERACIONES');
                                        const UI_ROWS = subCorte === 'pipeline' ? rows : rows.slice(eventRowsStart + 2);

                                        return UI_ROWS.map((row, i) => {
                                            const isTotal = String(row[0]).startsWith('TOTAL');
                                            const isGroupHeader = String(row[1]).includes('CONVENIO') || String(row[1]).includes('DIRECTAS');
                                            const isSubLine = String(row[1]).includes('  [');
                                            const isSubSubLine = String(row[1]).includes('    >>');
                                            const isEmpty = row[0] === '' && row[1] === '';

                                            // En modo Estatus Convenio (pipeline), no ocultamos nada
                                            const mcKey = row[0]; // CPS
                                            const ecKey = row[5];

                                            if (subCorte === 'ejecucion' && !isTotal && !isGroupHeader) {
                                                const masterRef = row[4];
                                                if (masterRef !== '-' && !expandedRows[masterRef]) return null;
                                                if (isSubSubLine && ecKey !== '-' && !expandedRows[`${masterRef}-${ecKey}`]) return null;
                                            }

                                            if (isEmpty) return <tr key={i} className="h-4 bg-slate-50/10"></tr>;

                                            let rowClass = "hover:bg-slate-50/50 transition-colors";
                                            if (isTotal) rowClass = "bg-[#0f172a] text-white font-black sticky bottom-0 z-20";
                                            if (isGroupHeader && subCorte === 'ejecucion') rowClass = "bg-slate-100/80 font-black cursor-pointer group select-none";
                                            if (isSubLine && subCorte === 'ejecucion') rowClass = "bg-white cursor-pointer hover:bg-emerald-50/50 transition-colors select-none";

                                            return (
                                                <tr key={i} className={rowClass} onClick={() => {
                                                    if (subCorte === 'ejecucion') {
                                                        if (isGroupHeader) toggleRow(row[4]);
                                                        if (isSubLine) toggleRow(`${row[4]}-${ecKey}`);
                                                    }
                                                }}>
                                                    {row.map((cell, cellIdx) => {
                                                        const isMonto = (subCorte === 'pipeline' && cellIdx >= 2) || (subCorte === 'ejecucion' && cellIdx === 7);
                                                        const displayVal = (typeof cell === 'number') ? formatMXN(cell) : (cell || '-');

                                                        let cellStyle = "py-3 px-6 text-[10px] border-r border-gray-100";
                                                        let contentStyle = "";

                                                        if (isTotal) cellStyle = "py-4 px-6 text-[11px] border-r border-slate-700";
                                                        if (isMonto) contentStyle = "text-right block w-full font-black";

                                                        if (subCorte === 'ejecucion') {
                                                            if (isGroupHeader && cellIdx === 1) contentStyle += " flex items-center gap-2";
                                                            if (isSubLine && cellIdx === 1) contentStyle += " pl-6 flex items-center gap-2 text-slate-700 font-bold underline decoration-emerald-200 decoration-2";
                                                            if (isSubSubLine && cellIdx === 1) contentStyle += " pl-12 text-slate-400 italic";
                                                        }

                                                        if (subCorte === 'pipeline' && !isTotal) {
                                                            if (cellIdx === 4) contentStyle += " text-emerald-600 font-black"; // Disponible
                                                            if (cellIdx === 6) contentStyle += " text-blue-600 font-black";    // Cobranza
                                                        }

                                                        if (subCorte === 'ejecucion' && !isTotal) {
                                                            if (cellIdx === 4) contentStyle += " bg-brand-orange/5 text-brand-orange px-2 py-0.5 rounded font-black";
                                                            if (cellIdx === 5) contentStyle += " text-emerald-600 font-black";
                                                            if (cellIdx === 6) contentStyle += " text-blue-600 font-black";
                                                        }

                                                        return (
                                                            <td key={cellIdx} className={cellStyle}>
                                                                <span className={contentStyle}>
                                                                    {subCorte === 'ejecucion' && isGroupHeader && cellIdx === 1 && <ChevronDown size={14} className={`text-brand-orange transition-transform duration-300 ${expandedRows[row[4]] ? '' : '-rotate-90'}`} />}
                                                                    {subCorte === 'ejecucion' && isSubLine && cellIdx === 1 && <ChevronDown size={12} className={`text-emerald-500 transition-transform duration-300 ${expandedRows[`${row[4]}-${ecKey}`] ? '' : '-rotate-90'}`} />}
                                                                    {displayVal}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        });
                                    })()}

                                    {datosFinancierosTotal.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="py-20 text-center text-[10px] font-black text-gray-300 uppercase italic tracking-widest">Sin registros en este periodo</td>
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
                                    {(() => {
                                        let tAbiertas = 0;
                                        let tGanadas = 0;
                                        let tPerdidas = 0;
                                        let tAcumulada = 0;

                                        const rows = (clientes || []).map(c => {
                                            const cCotz = (cotizaciones || []).filter(q => String(q.cliente_id) === String(c.id));
                                            const valAbiertas = cCotz.filter(q => q.estatus === 'borrador' || q.estatus === 'enviada').reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);
                                            const valGanadas = cCotz.filter(q => q.estatus === 'ganada').reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);
                                            const valPerdidas = cCotz.filter(q => q.estatus === 'perdida').reduce((acc, q) => acc + (parseFloat(q.subtotalGeneral || q.total / 1.16) || 0), 0);

                                            if (valAbiertas === 0 && valGanadas === 0 && valPerdidas === 0) return null;

                                            tAbiertas += valAbiertas;
                                            tGanadas += valGanadas;
                                            tPerdidas += valPerdidas;
                                            tAcumulada += valGanadas;

                                            return (
                                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6 sticky left-0 bg-white z-10">
                                                        <p className="text-[10px] font-black text-slate-900 uppercase">{c.nombre_empresa}</p>
                                                        <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest italic">{c.plaza}</p>
                                                    </td>
                                                    <td className="py-4 px-6 text-center font-bold text-[10px] text-blue-600">
                                                        {formatMXN(valAbiertas)}
                                                    </td>
                                                    <td className="py-4 px-6 text-center font-bold text-[10px] text-emerald-600">
                                                        {formatMXN(valGanadas)}
                                                    </td>
                                                    <td className="py-4 px-6 text-center font-bold text-[10px] text-brand-orange">
                                                        {formatMXN(valPerdidas)}
                                                    </td>
                                                    <td className="py-4 px-6 text-right text-[10px] font-black text-slate-900">{formatMXN(valGanadas)}</td>
                                                </tr>
                                            );
                                        }).filter(Boolean);

                                        return (
                                            <>
                                                {rows}
                                                <tr className="bg-slate-900 text-white font-black">
                                                    <td className="py-4 px-6 sticky left-0 bg-slate-900 z-10 text-[9px] uppercase tracking-widest italic">TOTAL GENERAL</td>
                                                    <td className="py-4 px-6 text-center text-[10px]">{formatMXN(tAbiertas)}</td>
                                                    <td className="py-4 px-6 text-center text-[10px]">{formatMXN(tGanadas)}</td>
                                                    <td className="py-4 px-6 text-center text-[10px]">{formatMXN(tPerdidas)}</td>
                                                    <td className="py-4 px-6 text-right text-[10px]">{formatMXN(tAcumulada)}</td>
                                                </tr>
                                            </>
                                        );
                                    })()}
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
