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
                supabase.from('cotizaciones').select('*').order('created_at', { ascending: false }),
                supabase.from('descuentos_volumen').select('*').then(r => r.error ? { data: [] } : r),
                supabase.from('cobranza').select('*, cotizaciones(folio, monto_total, clientes(nombre_empresa))'),
                supabase.from('metas_comerciales').select('*').order('anio', { ascending: false }).order('mes', { ascending: false }).then(r => {
                    if (r.error) console.warn("Error cargando metas:", r.error);
                    return r;
                }),
                supabase.auth.getUser().then(async ({ data: { user } }) => {
                    if (!user) return { data: null };
                    return supabase.from('perfiles').select('*').eq('id', user.id).single();
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
                historial: historial || [],
                descuentosVolumen: descuentos || [],
                metasComerciales: metas || [],
                cobranza: cobranza || [],
                perfil: perfil
            }));

            console.log("📊 Datos cargados:", {
                clientes: clientes?.length,
                cotizaciones: historial?.length,
                metas: metas?.length
            });

        } catch (err) {
            console.error('Error al cargar base de datos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Placeholder para guardar (PRÓXIMO PASO: Implementar lógica completa de guardado en Supabase)
    const guardarRegistro = async (tabla, payload) => {
        setMensajeAdmin({ tipo: 'cargando', texto: 'Guardando datos...' });

        const { id, ...dataRest } = payload;
        const isUpdate = !!id && id !== '';

        // Limpiar campos vacíos para no sobreescribir con basura
        const cleanData = Object.fromEntries(
            Object.entries(dataRest).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );

        try {
            let result;
            if (isUpdate) {
                result = await supabase.from(tabla).update(cleanData).eq('id', id).select();
            } else {
                result = await supabase.from(tabla).insert(cleanData).select();
            }

            const { data, error } = result;

            if (error) {
                console.error(`Error en ${isUpdate ? 'UPDATE' : 'INSERT'} (${tabla}):`, error);
                const errorStr = `${error.message}${error.details ? ' - ' + error.details : ''}${error.hint ? ' - ' + error.hint : ''}`;
                throw new Error(errorStr);
            }

            setMensajeAdmin({ tipo: 'exito', texto: '¡Guardado correctamente!' });
            cargarDatos();
            return data;
        } catch (err) {
            console.error('Error en persistencia:', err);
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
