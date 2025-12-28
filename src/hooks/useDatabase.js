import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useDatabase = () => {
    const [data, setData] = useState({
        productos: [],
        clientes: [],
        condicionesCliente: [],
        paquetesVIX: [],
        configuracion: {},
        historial: [],
        masterContracts: [],
        descuentosVolumen: [],
        metasComerciales: [],
        perfil: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mensajeAdmin, setMensajeAdmin] = useState({ tipo: '', texto: '' });

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        try {
            const [
                { data: productos },
                { data: clientes },
                { data: paquetesVix },
                { data: configuracionRaw },
                { data: masterContracts },
                { data: condiciones },
                { data: historial },
                { data: descuentos },
                { data: cobranza },
                { data: metas },
                resPerfil
            ] = await Promise.all([
                supabase.from('productos').select('*').eq('activo', true),
                supabase.from('clientes').select('*').order('nombre_empresa'),
                supabase.from('paquetes_vix').select('*'),
                supabase.from('configuracion').select('*'),
                supabase.from('master_contracts').select('*, clientes(nombre_empresa)'),
                supabase.from('condiciones_cliente').select('*'),
                supabase.from('cotizaciones').select('*').order('created_at', { ascending: false }).then(r => {
                    if (r.error) console.error("❌ Error cargando cotizaciones:", r.error);
                    return r;
                }),
                supabase.from('descuentos_volumen').select('*').then(r => r.error ? { data: [] } : r),
                supabase.from('cobranza').select('*, cotizaciones(folio, monto_total, clientes(nombre_empresa))'),
                supabase.from('metas_comerciales').select('*').order('anio', { ascending: false }).order('mes', { ascending: false }).then(r => {
                    if (r.error) console.warn("Error cargando metas:", r.error);
                    return r;
                }),
                supabase.auth.getUser().then(async ({ data: { user } }) => {
                    if (!user) return { data: null };
                    return supabase.from('perfiles').select('*').eq('id', user.id).maybeSingle();
                })
            ]);

            const perfil = resPerfil?.data || null;

            // Formatear configuración de array a objeto
            const configObj = {};
            configuracionRaw?.forEach(c => {
                configObj[c.parametro] = c.tipo === 'NUMERO' ? parseFloat(c.valor) : c.valor;
            });

            setData(prev => ({
                ...prev,
                productos: (productos || []).map(p => ({
                    ...p,
                    disponible: p.activo,
                    costoBase: parseFloat(p.costo_base)
                })),
                clientes: clientes || [],
                paquetesVIX: paquetesVix || [],
                configuracion: configObj,
                masterContracts: masterContracts || [],
                condicionesCliente: (condiciones || []).map(c => ({
                    ...c,
                    clienteId: c.cliente_id,
                    productoId: c.producto_id,
                    tipoAjuste: c.tipo_ajuste,
                    factorDescuento: c.factor_descuento,
                    costoFijo: c.costo_fijo
                })),
                historial: (historial || []).map(h => ({
                    ...h,
                    fecha: new Date(h.created_at),
                    cliente: (clientes || []).find(c => String(c.id) === String(h.cliente_id)) || { nombre_empresa: 'Cargando...', id: h.cliente_id },
                    items: h.json_detalles?.items || [],
                    distribucion: h.json_detalles?.distribucion || [],
                    paqueteVIX: h.json_detalles?.paqueteVIX || (h.paquete_vix ? { nombre: 'VIX' } : null),
                    costoVIX: h.json_detalles?.costoVIX || 0,
                    presupuestoBase: h.json_detalles?.presupuestoBase || h.monto_total,
                    subtotalTV: h.json_detalles?.subtotalTV || h.json_detalles?.subtotal_tv || h.monto_total,
                    total: h.monto_total,
                    subtotalGeneral: h.json_detalles?.subtotalGeneral ||
                        ((h.json_detalles?.subtotal_tv || 0) + (h.json_detalles?.costo_vix || 0)) ||
                        (h.monto_total / 1.16)
                })),
                descuentosVolumen: descuentos || [],
                metasComerciales: metas || [],
                cobranza: cobranza || [],
                perfil: perfil
            }));

            console.log("📊 Datos cargados:", {
                clientes: clientes?.length,
                cotizaciones: historial?.length,
                metas: metas?.length,
                timestamp: new Date().toLocaleTimeString()
            });

            if (!historial || historial.length === 0) {
                console.warn("⚠️ Advertencia: No se recuperaron cotizaciones de la base de datos.");
            }

        } catch (err) {
            console.error('Error al cargar base de datos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Placeholder para guardar (PRÓXIMO PASO: Implementar lógica completa de guardado en Supabase)
    /**
     * Guarda uno o varios registros en una tabla.
     * @param {string} tabla - Nombre de la tabla
     * @param {Object|Object[]} payload - Datos a guardar
     * @param {string} onConflict - (Opcional) Columnas para manejar conflictos en upsert (ej: 'id' o 'parametro')
     */
    const guardarRegistro = async (tabla, payload, onConflict = 'id') => {
        setMensajeAdmin({ tipo: 'cargando', texto: 'Guardando datos...' });

        // Función interna para limpiar objetos de campos vacíos/nulos
        const cleanObject = (obj) => Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );

        try {
            let resData, error;

            if (Array.isArray(payload)) {
                // Limpiar cada objeto del arreglo
                const cleanedPayload = payload.map(item => cleanObject(item));
                const result = await supabase.from(tabla).upsert(cleanedPayload, { onConflict }).select();
                resData = result.data;
                error = result.error;
            } else {
                const { id, ...dataRest } = payload;
                const cleanedData = cleanObject(dataRest);

                if (id && id !== '') {
                    const result = await supabase.from(tabla).update(cleanedData).eq('id', id).select();
                    resData = result.data;
                    error = result.error;
                } else {
                    const result = await supabase.from(tabla).insert(cleanedData).select();
                    resData = result.data;
                    error = result.error;
                }
            }

            if (error) {
                console.error(`Error en persistencia (${tabla}):`, error);
                throw new Error(`${error.message} (${error.code})`);
            }

            setMensajeAdmin({ tipo: 'exito', texto: '¡Guardado correctamente!' });
            cargarDatos();
            return resData;
        } catch (err) {
            console.error('Error detallado en persistencia:', err);
            setMensajeAdmin({ tipo: 'error', texto: `Error: ${err.message}` });
            return null;
        }
    };

    const eliminarRegistro = async (tabla, columnaId, valorId) => {
        setMensajeAdmin({ tipo: 'cargando', texto: 'Eliminando registro...' });
        try {
            const { error } = await supabase.from(tabla).delete().eq(columnaId, valorId);
            if (error) throw error;

            setMensajeAdmin({ tipo: 'exito', texto: 'Registro eliminado.' });
            cargarDatos();
            return true;
        } catch (err) {
            setMensajeAdmin({ tipo: 'error', texto: `Error: ${err.message}` });
            return false;
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    return {
        ...data,
        loading,
        error,
        mensajeAdmin,
        setMensajeAdmin,
        cargarDatos,
        guardarRegistro,
        eliminarRegistro
    };
};
