import { useState, useEffect, useCallback } from 'react';
import { parseCSV } from '../utils/formatters';

const SHEETS_URLS = {
    productos: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=0&single=true&output=csv',
    clientes: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=247261297&single=true&output=csv',
    condiciones: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=575442327&single=true&output=csv',
    descuentos: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=796931390&single=true&output=csv',
    vix: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=45434253&single=true&output=csv',
    config: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=1490714540&single=true&output=csv'
};

const SHEET_WRITER_API = 'https://script.google.com/macros/s/AKfycbydM1i-1p3JYWCVsuZaqX-XMeWtChctw97vQnV8yQIAgg1JcLIo1tVGvCVEThiFpFIpYw/exec';

export const useSheetsData = () => {
    const [data, setData] = useState({
        productos: [],
        clientes: [],
        condicionesCliente: [],
        descuentosVolumen: [],
        paquetesVIX: [],
        configuracion: {},
        historial: [],
        ultimaActualizacion: null
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mensajeAdmin, setMensajeAdmin] = useState({ tipo: '', texto: '' });

    const fetchWithRetry = async (url, retries = 2) => {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.text();
            } catch (err) {
                if (i === retries - 1) throw err;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    };

    const cargarHistorial = useCallback(async () => {
        try {
            // Añadir timestamp para evitar caché de Google
            const response = await fetch(`${SHEET_WRITER_API}?action=read&sheet=Cotizaciones&t=${Date.now()}`);
            if (!response.ok) return [];

            const result = await response.json();
            console.log("App -> Raw Historial:", result);

            // Manejar tanto {status: 'success', data: []} como [] directo
            const rawRows = Array.isArray(result) ? result : (result.data || []);

            return rawRows.map(row => {
                if (!row || typeof row !== 'object') return null;
                const normalized = {};
                Object.keys(row).forEach(k => {
                    normalized[k.toLowerCase().trim()] = row[k];
                });
                return normalized;
            }).filter(Boolean);

        } catch (err) {
            console.error('App -> Error crítico cargando historial:', err);
            return [];
        }
    }, []);

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [prodCSV, clientesCSV, condicionesCSV, descuentosCSV, vixCSV, configCSV, historialData] = await Promise.all([
                fetchWithRetry(SHEETS_URLS.productos),
                fetchWithRetry(SHEETS_URLS.clientes),
                fetchWithRetry(SHEETS_URLS.condiciones),
                fetchWithRetry(SHEETS_URLS.descuentos),
                fetchWithRetry(SHEETS_URLS.vix),
                fetchWithRetry(SHEETS_URLS.config),
                cargarHistorial()
            ]);

            const prodData = parseCSV(prodCSV).map(p => ({
                id: p.producto_id, canal: p.canal, tipo: p.tipo_producto, duracion: p.duracion,
                horario: p.horario, costoBase: parseFloat(p.costo_base) || 0, categoria: p.categoria,
                disponible: p.disponible?.toLowerCase() === 'si',
                plaza: p.plaza || 'GLOBAL'
            })).filter(p => p.id && p.costoBase > 0);

            const clientesData = parseCSV(clientesCSV).map(c => ({
                id: c.cliente_id, nombre: c.nombre_cliente, tipoAcuerdo: c.tipo_acuerdo,
                segmento: c.segmento, plaza: c.plaza, activo: c.activo?.toLowerCase() === 'si'
            })).filter(c => c.id && c.activo);

            const condicionesData = parseCSV(condicionesCSV).map(c => ({
                clienteId: c.cliente_id, productoId: c.producto_id, tipoAjuste: c.tipo_ajuste,
                factorDescuento: parseFloat(c.factor_descuento) || null, costoFijo: parseFloat(c.costo_fijo) || null
            })).filter(c => c.clienteId && c.productoId);

            const descuentosData = parseCSV(descuentosCSV).map(d => ({
                categoria: d.categoria_producto, minimo: parseInt(d.cantidad_minima) || 0,
                maximo: parseInt(d.cantidad_maxima) || 999999, descuento: parseFloat(d.descuento_adicional) || 0
            })).filter(d => d.categoria);

            const vixData = parseCSV(vixCSV).map(v => ({
                id: v.paquete_id, nombre: v.nombre_paquete, inversion: parseFloat(v.inversion_fija) || 0,
                dias: parseInt(v.duracion_dias) || 0, impresiones: parseInt(v.total_impresiones) || 0
            })).filter(v => v.id);

            const configData = {};
            parseCSV(configCSV).forEach(c => {
                const valor = c.tipo === 'NUMERO' ? parseFloat(c.valor) : c.valor;
                configData[c.parametro] = valor;
            });

            setData({
                productos: prodData,
                clientes: clientesData,
                condicionesCliente: condicionesData,
                descuentosVolumen: descuentosData,
                paquetesVIX: vixData,
                configuracion: configData,
                historial: historialData,
                ultimaActualizacion: new Date()
            });
            setLoading(false);

        } catch (err) {
            console.error('Error cargando datos:', err);
            setError('No se pudo cargar los datos. Verifica que las hojas de Google Sheets estén publicadas como CSV.');
            setLoading(false);
        }
    }, [cargarHistorial]);

    const guardarEnSheets = useCallback(async (datos, hoja) => {
        setMensajeAdmin({ tipo: 'cargando', texto: `Sincronizando con Google Sheets...` });

        const params = new URLSearchParams();
        params.append('sheet', hoja);
        params.append('data', JSON.stringify(datos));

        try {
            const response = await fetch(SHEET_WRITER_API, {
                method: 'POST',
                body: params,
                mode: 'cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                redirect: 'follow'
            });

            if (!response.ok) throw new Error(`Status ${response.status}`);

            const text = await response.text();
            const result = JSON.parse(text);

            if (result.status === 'success') {
                setMensajeAdmin({ tipo: 'exito', texto: '✅ Guardado correctamente en la nube.' });
                // Limpiar mensaje de éxito solo tras 10s
                setTimeout(() => setMensajeAdmin(m => m.tipo === 'exito' ? { tipo: '', texto: '' } : m), 10000);
                cargarDatos();
                return true;
            } else {
                throw new Error(result.message || 'Error en script');
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            setMensajeAdmin({
                tipo: 'error',
                texto: `Fallo al guardar: ${error.message}. Revisa si tu script es la versión más reciente.`
            });
            return false;
        }
    }, [cargarDatos]);

    const eliminarRegistro = useCallback(async (hoja, columnaId, valorId) => {
        setMensajeAdmin({ tipo: 'cargando', texto: `Eliminando de ${hoja}...` });

        const params = new URLSearchParams();
        params.append('colId', columnaId);
        params.append('valId', valorId);

        const url = `${SHEET_WRITER_API}?action=delete&sheet=${hoja}&t=${Date.now()}`;
        console.log("App -> Solicitando borrado:", url);

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: params,
                mode: 'cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                redirect: 'follow'
            });

            if (!response.ok) throw new Error("Error de red (" + response.status + ")");

            const text = await response.text();
            console.log("App -> Respuesta Servidor:", text);

            const result = JSON.parse(text);

            if (result.status === 'success') {
                // Actualización local inmediata para evitar el lag de caché de Google CSV
                setData(prev => {
                    const newData = { ...prev };
                    if (hoja === 'clientes') {
                        newData.clientes = prev.clientes.filter(c => c.id.toString() !== valorId.toString());
                    } else if (hoja === 'Cotizaciones') {
                        newData.historial = prev.historial.filter(h => h.id.toString() !== valorId.toString() && h.id_cotizacion !== valorId);
                    }
                    return newData;
                });

                setMensajeAdmin({ tipo: 'exito', texto: `✅ Borrado exitoso: ${result.message}` });
                setTimeout(() => setMensajeAdmin(m => m.tipo === 'exito' ? { tipo: '', texto: '' } : m), 8000);

                // Intentamos recargar de todos modos por si acaso, pero la UI ya está limpia
                cargarDatos();
                return true;
            } else {
                throw new Error(result.message || "Error desconocido");
            }
        } catch (error) {
            console.error('App -> Error Borrado:', error);
            setMensajeAdmin({
                tipo: 'error',
                texto: `❌ Error al borrar: ${error.message}`
            });
            return false;
        }
    }, [cargarDatos]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    return { ...data, loading, error, mensajeAdmin, setMensajeAdmin, cargarDatos, guardarEnSheets, eliminarRegistro };
};
