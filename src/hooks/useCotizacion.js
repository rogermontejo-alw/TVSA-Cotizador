import { useState, useCallback, useMemo } from 'react';

export const useCotizacion = (data = {}) => {
    const {
        productos = [],
        condicionesCliente = [],
        descuentosVolumen = [],
        paquetesVIX = [],
        configuracion = {},
        clientes = []
    } = data;

    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [presupuesto, setPresupuesto] = useState('');
    const [duracionDias, setDuracionDias] = useState('30');
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    const [cotizacionResult, setCotizacionResult] = useState(null);
    const [paqueteVIX, setPaqueteVIX] = useState('');
    const [plazaSeleccionada, setPlazaSeleccionada] = useState('');
    const [historial, setHistorial] = useState([]);
    const [comparar, setComparar] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editingFolio, setEditingFolio] = useState(null);

    const calcularPrecioUnitario = useCallback((productoId, clienteId) => {
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return 0;

        const condicion = condicionesCliente.find(
            c => String(c.clienteId) === String(clienteId) && String(c.productoId) === String(productoId)
        );

        if (condicion) {
            if (condicion.tipoAjuste === 'FIJO') {
                return parseFloat(condicion.costoFijo);
            } else if (condicion.tipoAjuste === 'FACTOR') {
                return producto.costoBase * parseFloat(condicion.factorDescuento);
            }
        }

        return producto.costoBase;
    }, [productos, condicionesCliente]);

    const aplicarDescuentoVolumen = useCallback((categoria, cantidad) => {
        const descuento = descuentosVolumen.find(
            d => d.categoria === categoria && cantidad >= d.minimo && cantidad <= d.maximo
        );
        return descuento ? descuento.descuento : 0;
    }, [descuentosVolumen]);

    const { subtotalTVActual, subtotalVIXActual } = useMemo(() => {
        const tv = productosSeleccionados.reduce((sum, ps) => {
            const precio = calcularPrecioUnitario(ps.id, clienteSeleccionado);
            return sum + (precio * ps.cantidad);
        }, 0);

        const vixPkg = paquetesVIX.find(p => p.id === paqueteVIX);
        const vix = vixPkg ? vixPkg.inversion : 0;

        return { subtotalTVActual: tv, subtotalVIXActual: vix };
    }, [productosSeleccionados, paqueteVIX, paquetesVIX, clienteSeleccionado, calcularPrecioUnitario]);

    const subtotalActual = subtotalTVActual + subtotalVIXActual;

    const sugerirDistribucion = useCallback(() => {
        if (!presupuesto || !clienteSeleccionado) return;

        const pres = parseFloat(presupuesto);
        const productosFiltrados = productos.filter(p =>
            p.disponible && (plazaSeleccionada === '' || p.plaza === plazaSeleccionada)
        );

        if (productosFiltrados.length === 0) return;

        setProductosSeleccionados([]);

        let presupuestoRestante = pres;
        const nuevosSeleccionados = [];
        const limiteProductos = 3;
        const pool = productosFiltrados.slice(0, limiteProductos);

        pool.forEach(p => {
            const precio = calcularPrecioUnitario(p.id, clienteSeleccionado);
            if (precio > 0) {
                const cantidadSugerida = Math.floor((pres / pool.length) / precio);
                if (cantidadSugerida > 0) {
                    nuevosSeleccionados.push({ id: p.id, cantidad: cantidadSugerida });
                }
            }
        });

        setProductosSeleccionados(nuevosSeleccionados);
    }, [presupuesto, clienteSeleccionado, productos, plazaSeleccionada, calcularPrecioUnitario]);

    const generarCotizacion = useCallback(() => {
        if (!clienteSeleccionado || (productosSeleccionados.length === 0 && !paqueteVIX)) {
            return;
        }

        const items = productosSeleccionados.map(ps => {
            const producto = productos.find(p => p.id === ps.id);
            if (!producto) return null;

            const precioBase = calcularPrecioUnitario(ps.id, clienteSeleccionado);
            const descVolumen = aplicarDescuentoVolumen(producto.categoria, ps.cantidad);
            const precioConDescuento = precioBase * (1 - descVolumen);
            const subtotal = precioConDescuento * ps.cantidad;

            return {
                producto,
                cantidad: ps.cantidad,
                precioBase,
                descuentoVolumen: descVolumen * 100,
                precioUnitario: precioConDescuento,
                subtotal
            };
        }).filter(Boolean);

        const subtotalTV = items.reduce((sum, item) => sum + item.subtotal, 0);
        const paqueteVIXSeleccionado = paquetesVIX.find(p => p.id === paqueteVIX);
        const costoVIX = paqueteVIXSeleccionado ? paqueteVIXSeleccionado.inversion : 0;
        const subtotalGeneral = subtotalTV + costoVIX;
        const iva = subtotalGeneral * (configuracion.iva_porcentaje || 0.16);
        const total = subtotalGeneral + iva;

        const diasCampana = parseInt(duracionDias) || 30;
        const distribucion = items.map(item => {
            const totalUnidades = item.cantidad;
            const totalSemanas = Math.max(1, Math.floor(diasCampana / 7));

            let distribucionSemanal = [];
            let unidadesPorSemanaBase = Math.floor(totalUnidades / totalSemanas);
            let unidadesRestantes = totalUnidades % totalSemanas;

            for (let i = 0; i < totalSemanas; i++) {
                let unidadesSemana = unidadesPorSemanaBase;
                if (unidadesRestantes > 0) {
                    unidadesSemana += 1;
                    unidadesRestantes -= 1;
                }
                distribucionSemanal.push(unidadesSemana);
            }

            return {
                producto: item.producto,
                totalUnidades,
                diasCampana,
                distribucionSemanal: distribucionSemanal.filter(u => u >= 0),
                unidadesPorDia: (totalUnidades / diasCampana).toFixed(2),
            };
        });

        const nuevaCotizacion = {
            id: editingId || `COT-${Date.now()}`,
            folio: editingFolio,
            fecha: new Date(),
            cliente: clientes.find(c => c.id === clienteSeleccionado),
            items,
            subtotalTV,
            paqueteVIX: paqueteVIXSeleccionado,
            costoVIX,
            subtotalGeneral,
            presupuestoBase: parseFloat(presupuesto) || 0,
            iva,
            total,
            diasCampana,
            distribucion,
            presupuestoBase: presupuesto ? parseFloat(presupuesto) : null
        };

        setCotizacionResult(nuevaCotizacion);
    }, [clienteSeleccionado, productosSeleccionados, paqueteVIX, productos, calcularPrecioUnitario, aplicarDescuentoVolumen, paquetesVIX, configuracion, duracionDias, presupuesto, clientes]);

    const iniciarNuevaCotizacion = () => {
        setClienteSeleccionado('');
        setPresupuesto('');
        setDuracionDias('30');
        setProductosSeleccionados([]);
        setCotizacionResult(null);
        setPlazaSeleccionada('');
        setPaqueteVIX('');
        setEditingId(null);
        setEditingFolio(null);
    };

    const cargarCotizacionEdicion = useCallback((cotz) => {
        if (!cotz) return;
        setEditingId(cotz.id);
        setEditingFolio(cotz.folio);
        setClienteSeleccionado(cotz.cliente_id || cotz.cliente?.id || '');
        setPresupuesto(cotz.presupuestoBase || cotz.monto_total || '');
        setDuracionDias(String(cotz.diasCampana || 30));
        setPlazaSeleccionada(cotz.plazaSeleccionada || '');
        setPaqueteVIX(cotz.paquete_vix_id || cotz.paqueteVIX?.id || '');

        // Cargar productos
        const items = cotz.items || cotz.json_detalles?.items || [];
        setProductosSeleccionados(items.map(it => ({
            id: it.producto.id,
            cantidad: it.cantidad
        })));

        // Opcional: mostrar directamente el resultado o volver al editor
        // Por ahora, solo cargamos los datos y limpiamos el resultado para que el usuario pueda editar
        setCotizacionResult(null);
    }, []);

    const agregarProducto = (productoId) => {
        if (!productosSeleccionados.find(p => p.id === productoId)) {
            setProductosSeleccionados([...productosSeleccionados, { id: productoId, cantidad: 0 }]);
        }
    };

    const eliminarProducto = (productoId) => {
        setProductosSeleccionados(productosSeleccionados.filter(p => p.id !== productoId));
    };

    const actualizarCantidad = (productoId, cantidad) => {
        const newCantidad = cantidad === '' ? 0 : (parseInt(cantidad) || 0);
        if (newCantidad < 0) {
            eliminarProducto(productoId);
            return;
        }
        setProductosSeleccionados(productosSeleccionados.map(p =>
            p.id === productoId ? { ...p, cantidad: newCantidad } : p
        ));
    };

    return {
        clienteSeleccionado, setClienteSeleccionado,
        presupuesto, setPresupuesto,
        duracionDias, setDuracionDias,
        productosSeleccionados, setProductosSeleccionados,
        cotizacionResult, setCotizacionResult,
        paqueteVIX, setPaqueteVIX,
        plazaSeleccionada, setPlazaSeleccionada,
        historial, setHistorial,
        comparar, setComparar,
        subtotalActual,
        subtotalTVActual,
        subtotalVIXActual,
        generarCotizacion, iniciarNuevaCotizacion, cargarCotizacionEdicion,
        agregarProducto, eliminarProducto, actualizarCantidad,
        calcularPrecioUnitario, sugerirDistribucion,
        editingId, editingFolio
    };
};
