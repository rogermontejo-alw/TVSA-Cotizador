import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useDatabase = (session) => {
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
        perfil: null,
        perfiles: [],
        contratosEjecucion: [],
        interacciones: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mensajeAdmin, setMensajeAdmin] = useState({ tipo: '', texto: '' });

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        try {
            // Ejecutar consultas con manejo de errores individual para evitar fallos en cascada
            const results = await Promise.all([
                supabase.from('productos').select('*').eq('activo', true),
                supabase.from('clientes').select('*').order('nombre_empresa'),
                supabase.from('paquetes_vix').select('*'),
                supabase.from('configuracion').select('*'),
                supabase.from('master_contracts').select('*, clientes(nombre_empresa)'),
                supabase.from('condiciones_cliente').select('*'),
                supabase.from('cotizaciones').select('*').order('created_at', { ascending: false }),
                supabase.from('descuentos_volumen').select('*'),
                supabase.from('cobranza').select('*, contratos_ejecucion(numero_contrato), cotizaciones(folio, monto_total, numero_contrato, cliente_id, mc_id, clientes(nombre_empresa))'),
                supabase.from('metas_comerciales').select('*').order('anio', { ascending: false }).order('mes', { ascending: false }),
                supabase.from('perfiles').select('*'),
                supabase.from('contratos_ejecucion').select('*, cotizaciones(folio, monto_total, cliente_id), master_contracts(numero_mc, cliente_id)'),
                supabase.from('interacciones_cliente').select('*').order('created_at', { ascending: false }),
                supabase.auth.getUser().then(async ({ data: { user } }) => {
                    if (!user) return { data: null };
                    const { data: profile } = await supabase.from('perfiles').select('*').eq('id', user.id).maybeSingle();
                    return { data: profile ? { ...profile, email: user.email } : { id: user.id, email: user.email, nombre_completo: 'Usuario Actual' } };
                })
            ]);

            const [
                { data: productos, error: errProd },
                { data: clientes, error: errCli },
                { data: paquetesVix },
                { data: configuracionRaw },
                { data: masterContracts },
                { data: condiciones },
                { data: historial, error: errHist },
                { data: descuentos },
                { data: cobranza },
                { data: metas },
                { data: perfiles },
                { data: contratosEjecucion },
                { data: interacciones },
                resPerfil
            ] = results;

            if (errProd || errCli || errHist) {
                console.error("⚠️ Algunos datos fallaron al cargar:", { errProd, errCli, errHist });
            }

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
                contratosEjecucion: contratosEjecucion || [],
                condicionesCliente: (condiciones || []).map(c => ({
                    ...c,
                    clienteId: c.cliente_id,
                    productoId: c.producto_id,
                    tipoAjuste: c.tipo_ajuste,
                    factorDescuento: c.factor_descuento,
                    costoFijo: c.costo_fijo
                })),
                historial: (historial || []).map(h => {
                    const clienteData = (clientes || []).find(c => String(c.id) === String(h.cliente_id));
                    return {
                        ...h,
                        fecha: new Date(h.created_at),
                        cliente: clienteData || { nombre_empresa: 'Cargando...', id: h.cliente_id },
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
                    };
                }),
                descuentosVolumen: descuentos || [],
                metasComerciales: metas || [],
                cobranza: cobranza || [],
                perfil: resPerfil?.data,
                perfiles: (() => {
                    const list = perfiles || [];
                    const currentUser = resPerfil?.data;
                    if (currentUser && !list.find(u => u.id === currentUser.id)) {
                        return [...list, currentUser];
                    }
                    return list;
                })(),
                configuracion: configObj,
                interacciones: interacciones || []
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

    const guardarRegistro = async (tabla, payload, onConflict = 'id') => {
        setMensajeAdmin({ tipo: 'cargando', texto: 'Guardando datos...' });
        const cleanObject = (obj) => Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );

        try {
            let resData, error;
            if (Array.isArray(payload)) {
                const cleanedPayload = payload.map(item => cleanObject(item));
                const result = await supabase.from(tabla).upsert(cleanedPayload, { onConflict }).select();
                resData = result.data;
                error = result.error;
            } else {
                const cleanedData = cleanObject(payload);
                // Si hay ID, intentamos un UPDATE parcial que es más seguro para campos NOT NULL
                if (cleanedData[onConflict]) {
                    const { data: updateData, error: updateError } = await supabase
                        .from(tabla)
                        .update(cleanedData)
                        .eq(onConflict, cleanedData[onConflict])
                        .select();

                    if (updateError) {
                        // Si falla el update (puede ser RLS o error de esquema), probamos upsert como fallback
                        const result = await supabase.from(tabla).upsert(cleanedData, { onConflict }).select();
                        resData = result.data;
                        error = result.error;
                    } else if (!updateData || updateData.length === 0) {
                        // Si no hubo error pero no se actualizó nada (registro no existe, ej. Perfiles nuevos)
                        const result = await supabase.from(tabla).upsert(cleanedData, { onConflict }).select();
                        resData = result.data;
                        error = result.error;
                    } else {
                        resData = updateData;
                        error = updateError;
                    }
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

    const limpiarTabla = async (tabla) => {
        setMensajeAdmin({ tipo: 'cargando', texto: `Limpiando tabla ${tabla}...` });
        try {
            const { error } = await supabase.from(tabla).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            setMensajeAdmin({ tipo: 'exito', texto: `Tabla ${tabla} vaciada correctamente.` });
            cargarDatos();
            return true;
        } catch (err) {
            console.error(`Error limpiando tabla ${tabla}:`, err);
            setMensajeAdmin({ tipo: 'error', texto: `Error: ${err.message}` });
            return false;
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos, session]);

    return {
        ...data,
        loading,
        error,
        mensajeAdmin,
        setMensajeAdmin,
        cargarDatos,
        guardarRegistro,
        eliminarRegistro,
        limpiarTabla
    };
};
