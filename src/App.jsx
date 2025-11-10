import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Importamos los íconos necesarios
import { Search, DollarSign, Calendar, TrendingUp, FileText, Plus, X, RefreshCw, AlertCircle, Download, Eye, Save, List, Printer, Settings, Trash2 } from 'lucide-react'; // Añadimos Trash2

// Renombramos el componente principal a 'App'
const App = () => {
  // URLs de Google Sheets (SIN CAMBIOS)
  const SHEETS_URLS = {
    // NOTA: Asumimos que esta hoja 'productos' ahora incluye una columna llamada 'plaza'
    productos: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=0&single=true&output=csv',
    clientes: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=247261297&single=true&output=csv',
    condiciones: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=575442327&single=true&output=csv',
    descuentos: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=796931390&single=true&output=csv',
    vix: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=45434253&single=true&output=csv',
    // CORRECCIÓN DE URL: Se asume que el ID de la hoja raíz es el mismo para todas.
    config: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=1490714540&single=true&output=csv'
  };
  
  // URL de la API de ESCRITURA (ACTUALIZADA con la nueva liga proporcionada)
  const SHEET_WRITER_API = 'https://script.google.com/macros/s/AKfycbwbvuqYM8Q3QhIkEL20i_amAI1fAWy_REF7dpCQs9UM7zeGyrXLVFHnrwT1rmZsQ9oVnA/exec'; 


  // ESTADOS PRINCIPALES (SIN CAMBIOS)
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [condicionesCliente, setCondicionesCliente] = useState([]);
  const [descuentosVolumen, setDescuentosVolumen] = useState([]);
  const [paquetesVIX, setPaquetesVIX] = useState([]);
  const [configuracion, setConfiguracion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [duracionDias, setDuracionDias] = useState('30');
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [cotizacion, setCotizacion] = useState(null);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [paqueteVIX, setPaqueteVIX] = useState('');
  
  // ***** NUEVO ESTADO PARA FILTRO DE PLAZA *****
  const [plazaSeleccionada, setPlazaSeleccionada] = useState(''); 
  
  // Nuevos estados
  const [historialCotizaciones, setHistorialCotizaciones] = useState([]);
  const [cotizacionesComparar, setCotizacionesComparar] = useState([]);
  const [vistaActual, setVistaActual] = useState('cotizador'); 
  const [mensajeAdmin, setMensajeAdmin] = useState({ tipo: '', texto: '' }); 


  // Función de formato de moneda (MXN) - SIN CAMBIOS
  const formatMXN = (value) => {
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    });
  };
  
  // FUNCIÓN DE CONEXIÓN REAL a Google Apps Script
  const guardarEnSheets = useCallback(async (datos, hoja) => {
    setMensajeAdmin({ tipo: 'cargando', texto: `Enviando datos a la hoja '${hoja}'...` });
    
    // Convertimos los datos a un objeto FormData para enviarlos como POST al Apps Script
    const formData = new FormData();
    formData.append('sheet', hoja);
    formData.append('data', JSON.stringify(datos));

    try {
      const response = await fetch(SHEET_WRITER_API, {
        method: 'POST',
        body: formData,
      });

      // Si hay un error de red (Failed to fetch), el catch lo maneja. Si el error es HTTP (404, 500), lo manejamos aquí.
      if (!response.ok) {
        // Intentamos leer la respuesta de error del script si existe
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Response: ${errorText}`);
      }
      
      // Intentamos parsear la respuesta JSON
      let result;
      try {
        result = await response.json();
      } catch (e) {
         // A veces, el Apps Script devuelve HTML de redirección o un error de texto simple.
         throw new Error("Respuesta no válida del Apps Script (no es JSON). Verifica el Despliegue.");
      }
      
      if (result.status === 'success') {
        setMensajeAdmin({ tipo: 'exito', texto: result.message + ` Recargando datos...` });
        // Recargar todos los datos para ver los cambios aplicados (crucial)
        await cargarDatos(); 
        setMensajeAdmin({ tipo: 'exito', texto: `Operación exitosa en ${hoja}.` });
        return true; 
      } else {
        setMensajeAdmin({ tipo: 'error', texto: `Error en Apps Script: ${result.message}` });
        return false;
      }
      
    } catch (error) {
      // Capturamos el error de red (Failed to fetch) y otros errores HTTP/JSON
      console.error('Error al enviar datos:', error);
      
      let mensajeError = error.message.includes("Failed to fetch") 
          ? `Fallo de conexión. ¿Es correcta la URL de Apps Script y su Despliegue (Acceso: Cualquiera)?`
          : `Error al procesar: ${error.message}`;
          
      setMensajeAdmin({ tipo: 'error', texto: mensajeError });
      return false;
    } finally {
      setTimeout(() => setMensajeAdmin({ tipo: '', texto: '' }), 5000);
    }
  }, [SHEET_WRITER_API, clientes.length]); 
  
  // LÓGICA DE CARGA DE DATOS
  const parseCSV = (csv) => {
    try {
      const lines = csv.trim().split('\n');
      if (lines.length < 2) return [];
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      return lines.slice(1).map(line => {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim().replace(/"/g, ''));
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim().replace(/"/g, ''));
        
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      }).filter(row => Object.values(row).some(val => val !== ''));
    } catch (err) {
      console.error('Error parseando CSV:', err);
      return [];
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    
    try {
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

      const [prodCSV, clientesCSV, condicionesCSV, descuentosCSV, vixCSV, configCSV] = await Promise.all([
        fetchWithRetry(SHEETS_URLS.productos),
        fetchWithRetry(SHEETS_URLS.clientes),
        fetchWithRetry(SHEETS_URLS.condiciones),
        fetchWithRetry(SHEETS_URLS.descuentos),
        fetchWithRetry(SHEETS_URLS.vix),
        fetchWithRetry(SHEETS_URLS.config)
      ]);

      const prodData = parseCSV(prodCSV).map(p => ({
        id: p.producto_id, canal: p.canal, tipo: p.tipo_producto, duracion: p.duracion,
        horario: p.horario, costoBase: parseFloat(p.costo_base) || 0, categoria: p.categoria,
        disponible: p.disponible === 'SI' || p.disponible === 'si' || p.disponible === 'Si',
        // ***** CAMBIO: AÑADIR PLAZA DEL PRODUCTO *****
        plaza: p.plaza || 'GLOBAL' 
      })).filter(p => p.id && p.costoBase > 0);

      const clientesData = parseCSV(clientesCSV).map(c => ({
        id: c.cliente_id, nombre: c.nombre_cliente, tipoAcuerdo: c.tipo_acuerdo,
        segmento: c.segmento, plaza: c.plaza, activo: c.activo === 'SI' || c.activo === 'si' || c.activo === 'Si'
      })).filter(c => c.id && c.activo);
      
      // ... (El resto de la carga de datos se mantiene)

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

      setProductos(prodData);
      setClientes(clientesData);
      setCondicionesCliente(condicionesData);
      setDescuentosVolumen(descuentosData);
      setConfiguracion(configData);
      setPaquetesVIX(vixData);
      setUltimaActualizacion(new Date());
      setCargando(false);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('No se pudo cargar los datos. Verifica que las hojas de Google Sheets estén publicadas como CSV.');
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);
  
  // Se mantienen el resto de funciones de lógica (calcularPrecioUnitario, etc.)
  const calcularPrecioUnitario = (productoId, clienteId) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return 0;

    const condicion = condicionesCliente.find(
      c => c.clienteId === clienteId && c.productoId === productoId
    );

    if (condicion) {
      if (condicion.tipoAjuste === 'FIJO') {
        return condicion.costoFijo;
      } else if (condicion.tipoAjuste === 'FACTOR') {
        return producto.costoBase * condicion.factorDescuento;
      }
    }

    return producto.costoBase;
  };

  const aplicarDescuentoVolumen = (categoria, cantidad) => {
    const descuento = descuentosVolumen.find(
      d => d.categoria === categoria && cantidad >= d.minimo && cantidad <= d.maximo
    );
    return descuento ? descuento.descuento : 0;
  };

  const agregarProducto = (productoId) => {
    if (!productosSeleccionados.find(p => p.id === productoId)) {
      setProductosSeleccionados([...productosSeleccionados, { id: productoId, cantidad: 1 }]);
    }
  };

  const calcularSubtotalActual = (productosList = productosSeleccionados) => {
    if (!clienteSeleccionado) return 0;

    const subtotalTV = productosList.reduce((sum, ps) => {
      const producto = productos.find(p => p.id === ps.id);
      if (!producto) return sum;

      const precioBase = calcularPrecioUnitario(ps.id, clienteSeleccionado);
      const descVolumen = aplicarDescuentoVolumen(producto.categoria, ps.cantidad);
      const precioConDescuento = precioBase * (1 - descVolumen);
      const subtotalItem = precioConDescuento * ps.cantidad;

      return sum + subtotalItem;
    }, 0);

    const paqueteVIXSeleccionado = paquetesVIX.find(p => p.id === paqueteVIX);
    const costoVIX = paqueteVIXSeleccionado ? paqueteVIXSeleccionado.inversion : 0;
    
    const subtotalGeneral = subtotalTV + costoVIX;
    
    return subtotalGeneral;
  };

  const actualizarCantidad = (productoId, cantidad) => {
    const newProductos = productosSeleccionados.map(p =>
      p.id === productoId ? { ...p, cantidad: parseInt(cantidad) || 0 } : p
    );
    setProductosSeleccionados(newProductos);
  };

  const eliminarProducto = (productoId) => {
    setProductosSeleccionados(productosSeleccionados.filter(p => p.id !== productoId));
  };

  const generarCotizacion = () => {
    if (!clienteSeleccionado || (productosSeleccionados.length === 0 && !paqueteVIX)) { // Acepta VIX solo
      console.error('Selecciona un cliente y al menos un producto o paquete VIX');
      return;
    }
    // ********* LOGICA DE GENERACIÓN DE COTIZACIÓN (SIN CAMBIOS) *********
    const items = productosSeleccionados.map(ps => {
      const producto = productos.find(p => p.id === ps.id);
      const precioBase = calcularPrecioUnitario(ps.id, clienteSeleccionado);
      const descVolumen = aplicarDescuentoVolumen(producto.categoria, ps.cantidad);
      const precioConDescuento = precioBase * (1 - descVolumen);
      const subtotal = precioConDescuento * ps.cantidad;

      return {
        producto, cantidad: ps.cantidad, precioBase, descuentoVolumen: descVolumen * 100,
        precioUnitario: precioConDescuento, subtotal
      };
    });

    const subtotalTV = items.reduce((sum, item) => sum + item.subtotal, 0);
    const paqueteVIXSeleccionado = paquetesVIX.find(p => p.id === paqueteVIX);
    const costoVIX = paqueteVIXSeleccionado ? paqueteVIXSeleccionado.inversion : 0;
    const subtotalGeneral = subtotalTV + costoVIX;
    const iva = subtotalGeneral * (configuracion.iva_porcentaje || 0.16);
    const total = subtotalGeneral + iva;

    const diasCampana = parseInt(duracionDias) || 30;
    const distribucion = items.map(item => {
      const totalUnidades = item.cantidad;
      const totalSemanas = Math.floor(diasCampana / 7);
      
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
      
      const finalSum = distribucionSemanal.reduce((a, b) => a + b, 0);
      if (finalSum < totalUnidades) {
        distribucionSemanal[0] += (totalUnidades - finalSum);
      } else if (finalSum > totalUnidades) {
        distribucionSemanal[0] -= (finalSum - totalUnidades);
      }
      

      return {
        producto: item.producto, totalUnidades, diasCampana,
        distribucionSemanal: distribucionSemanal.filter(u => u >= 0),
        unidadesPorDia: (totalUnidades / diasCampana).toFixed(2), 
      };
    });

    const nuevaCotizacion = {
      id: `COT-${Date.now()}`, fecha: new Date(), cliente: clientes.find(c => c.id === clienteSeleccionado),
      items, subtotalTV, paqueteVIX: paqueteVIXSeleccionado, costoVIX, subtotalGeneral, iva, total,
      diasCampana, distribucion, presupuestoDisponible: presupuesto ? parseFloat(presupuesto) : null
    };

    setCotizacion(nuevaCotizacion);
    // ********* FIN LOGICA DE GENERACIÓN DE COTIZACIÓN *********
  };

  // ********* CAMBIO 1: FUNCIÓN DE LIMPIEZA DE COTIZACIÓN *********
  const iniciarNuevaCotizacion = () => {
    // Esta función mantiene los datos cargados, pero limpia la cotización activa
    setClienteSeleccionado('');
    setPresupuesto('');
    setDuracionDias('30');
    setProductosSeleccionados([]);
    setCotizacion(null);
    setBusquedaProducto('');
    setPlazaSeleccionada(''); // Reiniciar la selección de plaza al iniciar nueva cotización
    setPaqueteVIX('');
    setMensajeAdmin({ tipo: 'exito', texto: 'Cotización limpiada. Lista para empezar una nueva.' });
    setTimeout(() => setMensajeAdmin({ tipo: '', texto: '' }), 5000);
  };
  // ********* FIN CAMBIO 1 *********

  const guardarCotizacion = () => {
    if (!cotizacion) return;
    const nuevasCotz = [...historialCotizaciones, cotizacion];
    setHistorialCotizaciones(nuevasCotz);
    console.log('Cotización guardada en el historial.');
  };

  const agregarAComparador = (cotz) => {
    if (cotizacionesComparar.find(c => c.id === cotz.id)) return;
    if (cotizacionesComparar.length >= 3) return;
    setCotizacionesComparar([...cotizacionesComparar, cotz]);
    setVistaActual('comparador');
  };

  const sugerirDistribucion = () => {
    if (!clienteSeleccionado || !presupuesto) return;
    const presupuestoNum = parseFloat(presupuesto); 
    const presupuestoSinIVA = presupuestoNum;
    const productosContenido = productos.filter(p => p.categoria === 'CONTENIDO' && p.disponible);
    
    const productosOrdenados = productosContenido
      .map(p => ({
        ...p,
        costoEfectivo: calcularPrecioUnitario(p.id, clienteSeleccionado)
      }))
      .sort((a, b) => b.costoEfectivo - a.costoEfectivo);

    const mejorProducto = productosOrdenados.find(p => p.costoEfectivo <= presupuestoSinIVA);
    
    if (mejorProducto) {
      const cantidadMaxima = Math.floor(presupuestoSinIVA / mejorProducto.costoEfectivo);
      setProductosSeleccionados([{ id: mejorProducto.id, cantidad: cantidadMaxima }]);
      setTimeout(generarCotizacion, 100);
    } 
  };
  
  const verReporteCotizacion = (cotz) => {
    // Esta función abre la ventana y permite imprimir el PDF desde el navegador
    const totalUnidadesGeneral = cotz.distribucion.reduce((acc, dist) => acc + dist.totalUnidades, 0);
    const totalSemanas = cotz.distribucion[0]?.distribucionSemanal.length || 0;
    
    // Generar encabezados de semana dinámicamente
    const weeklyHeaders = Array.from({ length: totalSemanas }, (_, i) => `<th class="px-2 py-1 text-center text-xs font-semibold text-red-800 uppercase">S${i + 1}</th>`).join('');

    // Generar filas de distribución semanal
    const distribucionRows = cotz.distribucion.map(dist => {
      const weeklyCells = dist.distribucionSemanal.map(units => 
        `<td class="px-2 py-1 text-center text-xs">${units}</td>` // Tamaño de fuente más pequeño
      ).join('');

      const item = cotz.items.find(i => i.producto.id === dist.producto.id);
      const totalInversionProducto = item ? item.subtotal : 0;

      return `
        <tr>
          <td class="px-2 py-1 text-xs text-gray-800">${dist.producto.tipo} (${dist.producto.canal}) - ${dist.producto.horario} | Plaza: ${dist.producto.plaza}</td>
          <td class="px-2 py-1 text-center text-xs font-semibold">${dist.totalUnidades}</td>
          ${weeklyCells}
          <td class="px-2 py-1 text-right text-xs font-bold text-red-700">${formatMXN(totalInversionProducto)}</td>
        </tr>
      `;
    }).join('');
    
    // Calcular totales por semana para el pie de tabla
    const totalPorSemana = Array.from({ length: totalSemanas }).map((_, weekIndex) => 
        cotz.distribucion.reduce((sum, dist) => sum + (dist.distribucionSemanal[weekIndex] || 0), 0)
    );
    const totalSemanalCells = totalPorSemana.map(total => `<td class="px-2 py-1 text-center">${total}</td>`).join('');
    
    // Función de simulación de correo
    const sendEmailSimulation = () => {
        alert('SIMULACIÓN: El reporte PDF ha sido enviado al correo del cliente. (Requiere configuración de Apps Script).');
    };

    const contenidoHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Presupuesto TVSA - ${cotz.cliente.nombre}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* Aplicar las fuentes seleccionadas */
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700&family=Poppins:wght@400;600&display=swap');
          
          body { font-family: 'Poppins', sans-serif; }
          h1, h2, h3, h4 { font-family: 'Manrope', sans-serif; }
          
          @media print {
            /* Ajuste para impresión en una sola hoja A4/Letter */
            @page { 
              size: A4 landscape; /* Usar formato horizontal para tablas grandes */
              margin: 0.8cm; /* Margen reducido */
            }
            body { 
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
              padding: 0 !important; 
              margin: 0 !important;
              /* Fuerza el color de fondo para la impresión */
              background-color: #ffffff !important; 
              font-size: 10pt; /* Fuente base ligeramente más pequeña para el cuerpo */
            }
            .max-w-6xl { 
              max-width: 100% !important; 
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important; /* Elimina sombras en la impresión */
            }
            /* Clases de títulos más pequeños para el reporte */
            .text-2xl-report { font-size: 1.5rem; } /* 2xl -> 1.5xl */
            .text-xl-report { font-size: 1.25rem; } /* xl -> lg */
            .text-lg-report { font-size: 1.1rem; } /* lg -> base */
            
            .print-hidden { display: none; }
          }
        </style>
      </head>
      <body class="p-8 bg-gray-100 font-sans">
        <div class="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
          <div class="flex justify-between items-start border-b pb-4 mb-6">
            <h1 class="text-2xl-report font-bold text-red-700">ORDEN DE PAUTA - TVSA</h1>
            <div class="text-right text-sm">
              <p class="text-gray-600">Cliente: ${cotz.cliente.nombre}</p>
              <p class="text-gray-600">Campaña: ${cotz.diasCampana} DÍAS</p>
              <p class="text-gray-600">Fecha: ${cotz.fecha.toLocaleDateString()}</p>
            </div>
          </div>
          
          <!-- Botones de Acción en el Reporte (Visible solo en pantalla, oculto al imprimir) -->
          <div class="flex flex-col sm:flex-row justify-end gap-3 mb-4 print-hidden">
             <button onclick="window.print()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center text-sm font-semibold">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8" rx="1"></rect></svg>
                 Imprimir / Guardar PDF
             </button>
             <button onclick="(${sendEmailSimulation.toString()})()" class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center justify-center text-sm font-semibold">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                 Enviar por Correo
             </button>
          </div>

          <!-- Tabla de Distribución Semanal (Similar a Flowchart) -->
          <h2 class="text-xl-report font-semibold text-gray-800 mb-2">DISTRIBUCIÓN SEMANAL DE PAUTA</h2>
          <div class="overflow-x-auto mb-6 border border-gray-200 rounded-lg">
            <table class="min-w-full text-xs">
              <thead class="bg-gray-200">
                <tr>
                  <th class="px-2 py-1 text-left text-xs font-semibold text-red-800 uppercase">PRODUCTO (MEDIO / PLAZA)</th>
                  <th class="px-2 py-1 text-center text-xs font-semibold text-red-800 uppercase">TOTAL INSERCIONES</th>
                  ${weeklyHeaders}
                  <th class="px-2 py-1 text-right text-xs font-semibold text-red-800 uppercase">TOTAL INVERSIÓN (SIN IVA)</th>
                </tr>
              </thead>
              <tbody>
                ${distribucionRows}
              </tbody>
              <tfoot class="bg-gray-100 font-bold">
                <tr>
                  <td colspan="1" class="px-2 py-1 text-right text-sm">TOTAL DE UNIDADES</td>
                  <td class="px-2 py-1 text-center text-sm">${totalUnidadesGeneral}</td>
                  ${totalSemanalCells}
                  <td class="px-2 py-1 text-right text-sm">${formatMXN(cotz.subtotalGeneral)}</td>
                </tr>
              </tfoot>
            </table>
            <p class="text-xs text-gray-600 p-2">Días de Campaña: ${cotz.diasCampana} días. Las unidades son números enteros que suman el total contratado.</p>
          </div>

          <!-- Resumen Financiero -->
          <div class="grid grid-cols-3 gap-6 text-sm">
            <div class="col-span-2">
              <h2 class="text-xl-report font-semibold text-gray-800 mb-2">DESGLOSE DE PAQUETES</h2>
              
              <!-- ***** CAMBIO: MOSTRAR DETALLE DEL VIX SELECCIONADO AQUÍ ***** -->
              ${cotz.paqueteVIX ? `
                <div class="p-3 bg-gray-200 rounded-lg text-xs flex justify-between items-center">
                    <div>
                        <p class="font-semibold text-gray-800">Paquete VIX Seleccionado: ${cotz.paqueteVIX.nombre}</p>
                        <p class="text-xs text-gray-600">Duración: ${cotz.paqueteVIX.dias} días | Impresiones: ${cotz.paqueteVIX.impresiones.toLocaleString()}</p>
                    </div>
                    <span class="font-bold text-red-700">${formatMXN(cotz.costoVIX)}</span>
                </div>
              ` : '<p class="text-xs text-gray-600">No hay paquetes de inversión fija (VIX) contratados.</p>'}
              <!-- ***** FIN CAMBIO VIX EN REPORTE ***** -->
              
              <div class="mt-4 border p-3 rounded-lg bg-gray-50">
                 <h3 class="text-lg-report font-semibold text-gray-800 mb-1">RESUMEN SIN IMPUESTOS</h3>
                 <div class="flex justify-between text-xs">
                    <span class="text-gray-700">SUBTOTAL (TV + PAQUETES):</span>
                    <span class="font-extrabold text-red-700">${formatMXN(cotz.subtotalGeneral)}</span>
                 </div>
              </div>
            </div>

            <div class="col-span-1 border border-red-200 rounded-lg p-4 bg-red-50">
              <h2 class="text-xl-report font-bold text-red-700 mb-2">CÁLCULO FINAL</h2>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                  <span>Subtotal SIN IVA:</span>
                  <span class="font-semibold">${formatMXN(cotz.subtotalGeneral)}</span>
                </div>
                <div class="flex justify-between">
                  <span>IVA (${((configuracion.iva_porcentaje || 0.16) * 100).toFixed(0)}%):</span>
                  <span class="font-semibold">${formatMXN(cotz.iva)}</span>
                </div>
                <div class="flex justify-between text-base font-extrabold text-red-800 border-t-2 border-red-700 pt-1 mt-1">
                  <span>TOTAL (CON IVA):</span>
                  <span>${formatMXN(cotz.total)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- PUNTO 1: Footer del reporte modificado -->
          <p class="text-xs text-gray-500 mt-6 text-center">
            Este presupuesto es una proyección de pauta promedio. Creado por Roger Montejo Plaza Merida
          </p>
        </div>
        <script>
            // Función para asegurar que el script de simulación de correo esté disponible
            function sendEmailSimulation() {
                alert('SIMULACIÓN: El reporte PDF ha sido enviado al correo del cliente. (Requiere configuración de Apps Script).');
            }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1000,height=800'); 
    if (printWindow) {
      printWindow.document.write(contenidoHTML);
      printWindow.document.close();
    } else {
      console.error("El navegador bloqueó la apertura de la ventana emergente.");
    }
  };
  
  const mostrarPresupuestoEImprimir = () => {
    if (!cotizacion) return;
    verReporteCotizacion(cotizacion); 
  };
  // ----------------------------------------------------
  
  // FUNCIÓN AUXILIAR: Muestra si un producto ya está seleccionado en la cotización activa
  const isProductSelected = (productId) => {
    return productosSeleccionados.some(p => p.id === productId);
  };

  // ***** CAMBIO: FILTRADO POR PLAZA Y BÚSQUEDA *****
  const productosFiltrados = useMemo(() => {
    return productos.filter(p =>
      p.disponible && 
      !isProductSelected(p.id) && 
      (plazaSeleccionada === '' || p.plaza === plazaSeleccionada) && // Filtro por Plaza
      (
        p.canal.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.tipo.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.horario.toLowerCase().includes(busquedaProducto.toLowerCase())
      )
    );
  }, [productos, busquedaProducto, productosSeleccionados, plazaSeleccionada]); 
  
  // Función para obtener una lista única de plazas disponibles
  const plazasDisponibles = useMemo(() => {
    const plazas = productos.map(p => p.plaza).filter(Boolean);
    return [...new Set(plazas)].sort();
  }, [productos]);


  const subtotalActual = calcularSubtotalActual(); 
  const presupuestoNum = presupuesto ? parseFloat(presupuesto) : 0;
  const saldoDisponible = presupuestoNum - subtotalActual;
  const saldoColor = saldoDisponible >= 0 ? 'text-green-600' : 'text-red-600';

  
  // --- SUB-COMPONENTS DE ADMINISTRACIÓN (AISLADOS) ---

  const PanelMensaje = ({ tipo, texto }) => {
      if (!texto) return null;
      // Lógica de colores y íconos para el mensaje de estado (USANDO NUEVOS COLORES)
      let bgColor, textColor, icon;
      
      switch (tipo) {
          case 'exito':
              bgColor = 'bg-green-100 border-green-400';
              textColor = 'text-green-800';
              icon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg>;
              break;
          case 'error':
              bgColor = 'bg-red-100 border-red-400';
              textColor = 'text-red-800';
              icon = <X size={20} />;
              break;
          case 'cargando':
              bgColor = 'bg-gray-200 border-gray-400'; // Usamos gris para carga/info
              textColor = 'text-gray-800';
              icon = <RefreshCw className="animate-spin" size={20} />;
              break;
          default:
              return null;
      }

      return (
          <div className={`p-4 mb-6 border rounded-lg flex items-center gap-3 ${bgColor} ${textColor}`}>
              {icon}
              <p className="font-medium text-sm">{texto}</p>
          </div>
      );
  };
  
  // Formulario 1: Registro de Nuevos Clientes (Aislado para evitar re-render)
  const FormularioNuevoCliente = React.memo(({ onSave, setMensaje }) => {
      const [clienteData, setClienteData] = useState({ 
          nombre: '', 
          segmento: 'PYME', 
          tipoAcuerdo: 'SIN_ACUERDO', 
          plaza: 'MERIDA', 
          activo: 'SI',
          notas: '' 
      });
      
      const handleClienteChange = (e) => {
          const { name, value } = e.target;
          setClienteData(prev => ({ ...prev, [name]: value }));
      };

      const handleSubmit = async () => {
          if (!clienteData.nombre || !clienteData.segmento) {
              setMensaje({ tipo: 'error', texto: 'El nombre y segmento del cliente son obligatorios.' });
              return;
          }
          
          // Mapeo de datos para el script: usamos nombres de headers de la hoja de cálculo
          const datosCliente = {
              cliente_id: '', // Dejamos vacío, el script lo genera.
              nombre_cliente: clienteData.nombre,
              tipo_acuerdo: clienteData.tipoAcuerdo,
              segmento: clienteData.segmento,
              plaza: clienteData.plaza,
              activo: clienteData.activo,
              tarifa: '', // Campo extra de la hoja, enviado como vacío.
              fecha_alta: '', // Dejamos vacío, el script lo genera.
              notas: clienteData.notas || '' 
          };

          const exito = await onSave(datosCliente, 'clientes');
          if (exito) {
              // Resetear formulario
              setClienteData({ 
                  nombre: '', 
                  segmento: 'PYME', 
                  tipoAcuerdo: 'SIN_ACUERDO', 
                  plaza: 'MERIDA', 
                  activo: 'SI',
                  notas: ''
              });
          }
      };
      
      return (
          <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">1. Registrar Nuevo Cliente</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
                      <input
                          type="text"
                          name="nombre"
                          value={clienteData.nombre}
                          onChange={handleClienteChange}
                          placeholder="Ej: Agencia Digital S.A. de C.V."
                          className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Segmento</label>
                      <select
                          name="segmento"
                          value={clienteData.segmento}
                          onChange={handleClienteChange}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                          {['PYME', 'CORPORATIVO', 'GOBIERNO', 'OTROS'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Acuerdo</label>
                      <select
                          name="tipoAcuerdo"
                          value={clienteData.tipoAcuerdo}
                          onChange={handleClienteChange}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                          {['SIN_ACUERDO', 'ACUERDO_ANUAL', 'PRECIO_FIJO'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plaza</label>
                      <select
                          name="plaza"
                          value={clienteData.plaza}
                          onChange={handleClienteChange}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                          {['MERIDA', 'CANCUN', 'CAMPECHE', 'CDMX'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                  </div>
              </div>
              <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                      name="notas"
                      value={clienteData.notas}
                      onChange={handleClienteChange}
                      placeholder="Notas del cliente o detalles del acuerdo."
                      rows="2"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                  ></textarea>
              </div>
              <button
                  onClick={handleSubmit}
                  className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center"
              >
                  <Save className="mr-2" size={18} />
                  Registrar Cliente
              </button>
          </div>
      );
  });

  // Formulario 2: Asignación de Condiciones (Aislado para evitar re-render)
  const FormularioCondiciones = React.memo(({ clientes, productos, condicionesCliente, onSave, setMensaje, formatMXN }) => {
      
      const [clienteIdSeleccionado, setClienteIdSeleccionado] = useState('');
      const [busquedaProductoAdmin, setBusquedaProductoAdmin] = useState('');
      
      // Estado para los productos que el usuario ha seleccionado para asignarles una condición
      const [productosParaCondicion, setProductosParaCondicion] = useState([]); 

      // Hook para resetear los productos para condición si cambia el cliente seleccionado o si se actualizan los clientes.
      useEffect(() => {
          // Si el cliente cambia o si los clientes se recargan (ej: se añade uno nuevo)
          setProductosParaCondicion([]); 
      }, [clienteIdSeleccionado, clientes]);


      // Función para actualizar el factor o el costo fijo de un producto en el estado local
      const handleCondicionChange = (productId, name, value) => {
          setProductosParaCondicion(prev => prev.map(p => {
              if (p.id === productId) {
                  // Determina si el campo cambiado es Factor o Fijo
                  const isFactor = name === 'factor';
                  return {
                      ...p,
                      factor: isFactor ? value : p.factor,
                      costoFijo: !isFactor ? value : p.costoFijo,
                      // Establecer el tipo de ajuste basado en el último campo llenado
                      tipoAjuste: isFactor ? 'FACTOR' : 'FIJO'
                  };
              }
              return p;
          }));
      };

      // Función para añadir un producto a la lista de asignación
      const agregarProductoParaCondicion = (producto) => {
          if (!productosParaCondicion.find(p => p.id === producto.id)) {
              // Buscar si ya tiene una condición preexistente
              const condicionExistente = condicionesCliente.find(c => c.clienteId === clienteIdSeleccionado && c.productoId === producto.id);
              
              setProductosParaCondicion(prev => [
                  ...prev, 
                  { 
                      ...producto, 
                      // Si existe, prellenar los campos con los valores de la hoja de cálculo
                      factor: condicionExistente?.factorDescuento || '', 
                      costoFijo: condicionExistente?.costoFijo || '', 
                      tipoAjuste: condicionExistente?.tipoAjuste || 'FACTOR' 
                  }
              ]);
          }
      };

      // Función para eliminar un producto de la lista de asignación
      const eliminarProductoParaCondicion = (productId) => {
          setProductosParaCondicion(prev => prev.filter(p => p.id !== productId));
      };


      const handleSubmitCondiciones = async () => {
          if (!clienteIdSeleccionado || productosParaCondicion.length === 0) {
              setMensaje({ tipo: 'error', texto: 'Selecciona un cliente y al menos un producto para guardar.' });
              return;
          }

          let hayError = false;
          let condicionesEnviadas = [];

          // Procesar y validar cada producto antes de simular el envío
          productosParaCondicion.forEach(p => {
              const valorFactor = parseFloat(p.factor);
              const valorFijo = parseFloat(p.costoFijo);
              let tipoAjuste = '';
              let valor = '';
              
              // Lógica de determinación del ajuste:
              if (valorFactor > 0 && (isNaN(valorFijo) || valorFijo === '')) {
                  // Solo factor válido
                  tipoAjuste = 'FACTOR';
                  valor = valorFactor;
              } else if (valorFijo > 0 && (isNaN(valorFactor) || valorFactor === '')) {
                  // Solo costo fijo válido
                  tipoAjuste = 'FIJO';
                  valor = valorFijo;
              } else if (valorFactor > 0 && valorFijo > 0) {
                   // Ambos llenos, usar el último que se llenó (p.tipoAjuste lo define)
                   tipoAjuste = p.tipoAjuste;
                   valor = tipoAjuste === 'FACTOR' ? valorFactor : valorFijo;
              } else {
                  // Ninguno de los campos llenos
                  hayError = true; 
                  setMensaje({ tipo: 'error', texto: `El producto ${p.tipo} requiere Factor o Precio Fijo.` });
                  return; 
              }
              
              if (hayError) return;

              // Mapeo de datos para el script: usando nombres de headers de la hoja
              condicionesEnviadas.push({
                  cliente_id: clienteIdSeleccionado,
                  producto_id: p.id,
                  tipo_ajuste: tipoAjuste,
                  factor_descuento: tipoAjuste === 'FACTOR' ? valor : '',
                  costo_fijo: tipoAjuste === 'FIJO' ? valor : '',
                  // CAMPOS DE VIGENCIA Y NOTAS: Se envían vacíos para que el script los genere o los rellene.
                  vigencia_inicio: '', 
                  vigencia_fin: '',
                  notas: ''
              });
          });
          
          if (hayError) return;
          
          // Enviar todas las condiciones en un array
          // CORRECCIÓN DE NOMBRE DE HOJA: SE CAMBIA 'condiciones' A 'condiciones_cliente'
          const exito = await onSave(condicionesEnviadas, 'condiciones_cliente');

          if (exito) {
              // Limpiar productos seleccionados después de guardar
              setProductosParaCondicion([]);
              // Ya se recargaron los datos globales en guardarEnSheets
          }
      };

      // Productos Disponibles: Filtrado por búsqueda
      const productosDisponiblesFiltrados = useMemo(() => productos.filter(p =>
          p.disponible && 
          !productosParaCondicion.some(ap => ap.id === p.id) && // Excluir ya seleccionados
          (
              p.canal.toLowerCase().includes(busquedaProductoAdmin.toLowerCase()) ||
              p.tipo.toLowerCase().includes(busquedaProductoAdmin.toLowerCase()) ||
              p.horario.toLowerCase().includes(busquedaProductoAdmin.toLowerCase())
          )
      ), [productos, busquedaProductoAdmin, productosParaCondicion]);


      return (
          <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">2. Asignar Condiciones por Producto</h3>

              {/* SELECCIÓN DE CLIENTE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
                      <select
                          name="clienteId"
                          value={clienteIdSeleccionado}
                          onChange={(e) => setClienteIdSeleccionado(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                          <option value="">Seleccionar Cliente</option>
                          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                  </div>
              </div>
              
              {/* INTERFAZ DE BÚSQUEDA Y SELECCIÓN (Estilo Cotizador Principal) */}
              {clienteIdSeleccionado && (
                  <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Buscar y Añadir Productos</h4>
                      <input
                          type="text"
                          value={busquedaProductoAdmin}
                          onChange={(e) => setBusquedaProductoAdmin(e.target.value)}
                          placeholder="Buscar Canal, Tipo o Horario..."
                          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                      />

                      <div className="max-h-64 overflow-y-auto space-y-2 border p-3 rounded-lg bg-gray-50">
                          {productosDisponiblesFiltrados.length === 0 ? (
                              <p className="text-sm text-gray-500 p-2">
                                  No se encontraron productos disponibles o ya están seleccionados.
                              </p>
                          ) : (
                              productosDisponiblesFiltrados.map(p => (
                                  <div
                                      key={p.id}
                                      className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white hover:bg-red-50"
                                  >
                                      <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-gray-800 truncate">
                                              {p.canal} - {p.tipo}
                                          </p>
                                          <div className="text-xs text-gray-600 flex gap-1 items-start">
                                              <span className="flex-shrink-0">{p.duracion}</span> | 
                                              <span className="flex-shrink-0">{p.horario}</span> | 
                                              <span className="flex-shrink-0">Plaza: {p.plaza}</span> {/* AÑADIDO: PLAZA en disponible */}
                                          </div>
                                      </div>
                                      <button
                                          onClick={() => agregarProductoParaCondicion(p)}
                                          className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 flex items-center flex-shrink-0"
                                      >
                                          <Plus size={16} />
                                      </button>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              )}
              
              {/* LISTA DE PRODUCTOS SELECCIONADOS PARA ASIGNACIÓN */}
              {productosParaCondicion.length > 0 && (
                  <div className="mt-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-3">Condiciones a Asignar ({productosParaCondicion.length})</h4>
                      
                      <div className="space-y-4">
                          {productosParaCondicion.map(p => (
                              <div key={p.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                                  {/* Encabezado del Producto */}
                                  <div className="flex justify-between items-start mb-3">
                                      <div className="flex-1 min-w-0">
                                          <p className="font-bold text-red-800 truncate">
                                              {p.canal} - {p.tipo}
                                          </p>
                                          <div className="text-xs text-gray-600 flex gap-1 items-start">
                                              <span className="flex-shrink-0">{p.duracion}</span> | 
                                              <span className="flex-shrink-0">{p.horario}</span> | 
                                              <span className="flex-shrink-0">Plaza: {p.plaza}</span> {/* AÑADIDO: PLAZA en asignados */}
                                          </div>
                                      </div>
                                      <button
                                          onClick={() => eliminarProductoParaCondicion(p.id)}
                                          className="text-red-600 hover:text-red-800 flex-shrink-0"
                                      >
                                          <X size={20} />
                                      </button>
                                  </div>

                                  {/* CAMPOS DE CONDICIÓN */}
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                              % Descuento
                                          </label>
                                          <input
                                              type="number"
                                              name="factor"
                                              value={p.factor}
                                              onChange={(e) => handleCondicionChange(p.id, 'factor', e.target.value)}
                                              placeholder="0.80"
                                              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                              step="0.01"
                                              min="0"
                                              max="1"
                                          />
                                          <p className="text-xs text-gray-500 mt-1">
                                              * Factor = 1 - Dcto. Ej: 0.80 = 20% Dcto.
                                          </p>
                                          {p.tipoAjuste === 'FACTOR' && <span className="text-xs text-green-600 font-semibold mt-1 block">Ajuste activo</span>}
                                      </div>
                                      <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Precio Fijo (MXN sin IVA)
                                          </label>
                                          <input
                                              type="number"
                                              name="costoFijo"
                                              value={p.costoFijo}
                                              onChange={(e) => handleCondicionChange(p.id, 'costoFijo', e.target.value)}
                                              placeholder={formatMXN(0).replace('$', '')}
                                              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                              min="1"
                                          />
                                          {p.tipoAjuste === 'FIJO' && <span className="text-xs text-green-600 font-semibold mt-1 block">Ajuste activo</span>}
                                      </div>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-3">
                                      * Al guardar, solo se usará el campo que contiene un valor válido. Si ambos están llenos, se usa el último modificado.
                                  </p>
                              </div>
                          ))}
                      </div>

                      <button
                          onClick={handleSubmitCondiciones}
                          className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center"
                          disabled={!clienteIdSeleccionado}
                      >
                          <Save className="mr-2" size={18} />
                          Guardar Condiciones
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                          * Este proceso de guardado insertará las filas en Google Sheets.
                      </p>
                  </div>
              )}
          </div>
      );
  });
  
  
  // VISTA: Administración (Utiliza los componentes aislados)
  if (vistaActual === 'administracion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center"><Settings className="mr-3 text-red-700" size={30} /> Panel de Administración</h1>
              <button
                onClick={() => setVistaActual('cotizador')}
                className="w-full md:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Volver al Cotizador
              </button>
            </div>
          </div>
          
          <PanelMensaje tipo={mensajeAdmin.tipo} texto={mensajeAdmin.texto} />

          <div className="space-y-6">
              {/* LLAMADA A COMPONENTES AISLADOS */}
              <FormularioNuevoCliente onSave={guardarEnSheets} setMensaje={setMensajeAdmin} />
              <FormularioCondiciones 
                  clientes={clientes} 
                  productos={productos} 
                  condicionesCliente={condicionesCliente}
                  onSave={guardarEnSheets} 
                  setMensaje={setMensajeAdmin}
                  formatMXN={formatMXN} // Pasamos la función de formato
              />
          </div>
          
        </div>
      </div>
    );
  }


  // VISTA: Lista de Precios por Cliente
  if (vistaActual === 'lista-precios') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"> 
              <h1 className="text-3xl font-bold text-gray-800">Lista de Precios por Cliente</h1>
              <button
                onClick={() => setVistaActual('cotizador')}
                className="w-full md:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700" 
              >
                Volver al Cotizador
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Cliente</label>
            <select
              value={clienteSeleccionado}
              onChange={(e) => setClienteSeleccionado(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {clienteSeleccionado && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Lista de Precios: {clientes.find(c => c.id === clienteSeleccionado)?.nombre}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Canal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Plaza</th> {/* AÑADIDO */}
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duración</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Horario</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Precio Lista</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Tu Precio</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Ahorro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productos.filter(p => p.disponible).map(p => {
                      const precioCliente = calcularPrecioUnitario(p.id, clienteSeleccionado);
                      const ahorro = p.costoBase - precioCliente;
                      const porcentajeAhorro = (ahorro / p.costoBase) * 100;
                      
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{p.canal}</td>
                          <td className="px-4 py-3 text-sm text-gray-800">{p.tipo}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.plaza}</td> {/* PLAZA AÑADIDA */}
                          <td className="px-4 py-3 text-sm text-gray-600">{p.duracion}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.horario}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">
                            {formatMXN(p.costoBase)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                            {formatMXN(precioCliente)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {ahorro > 0 ? (
                              <span className="text-green-600 font-semibold">
                                -{porcentajeAhorro.toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => {
                    // LLAMADA AL NUEVO REPORTE DE LISTA DE PRECIOS
                    alert('SIMULACIÓN: Generar PDF del reporte de Lista de Precios. (Requiere implementación de reporte HTML)');
                }}
                className="w-full md:w-auto mt-4 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center" 
              >
                <Download className="mr-2" size={18} />
                Exportar Lista (PDF)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // VISTA: Comparador
  if (vistaActual === 'comparador') {
     return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"> 
              <h1 className="text-3xl font-bold text-gray-800">Comparador de Cotizaciones</h1>
              <button
                onClick={() => setVistaActual('cotizador')}
                className="w-full md:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700" 
              >
                Volver al Cotizador
              </button>
            </div>
          </div>

          {cotizacionesComparar.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Eye size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">No hay cotizaciones para comparar</p>
              <p className="text-sm text-gray-500">Genera cotizaciones y agrégalas al comparador</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cotizacionesComparar.map((cotz, idx) => (
                <div key={cotz.id} className="bg-white rounded-lg shadow-lg p-6">
                  {/* Encabezado y botón de eliminar (sin cambios) */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Opción {idx + 1}</h3>
                    <button
                      onClick={() => setCotizacionesComparar(cotizacionesComparar.filter(c => c.id !== cotz.id))}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {/* CUERPO DE LA COMPARACIÓN (AJUSTADO PARA MOSTRAR DETALLE) */}
                  <div className="space-y-2 mb-4 p-3 border rounded-lg bg-gray-100">
                    <p className="text-sm text-gray-600 font-semibold">Cliente: <span className="text-gray-800">{cotz.cliente.nombre}</span></p>
                    <p className="text-sm text-gray-600 font-semibold">Duración: <span className="text-gray-800">{cotz.diasCampana} días</span></p>
                    
                    {/* DESGLOSE SIMPLIFICADO DE PRODUCTOS */}
                    <div className="border-t pt-2 mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Productos:</p>
                        <div className="max-h-24 overflow-y-auto space-y-0.5">
                            {cotz.items.map((item, i) => (
                                <p key={i} className="text-xs text-gray-600">
                                    {item.cantidad}x {item.producto.tipo} ({item.producto.plaza}) 
                                </p>
                            ))}
                            {/* ***** VIX EN COMPARADOR ***** */}
                            {cotz.paqueteVIX && (
                                <p className="text-xs text-red-700 font-semibold mt-1">
                                    ✓ Paquete VIX: {cotz.paqueteVIX.nombre}
                                </p>
                            )}
                            {/* ***** FIN VIX EN COMPARADOR ***** */}
                        </div>
                    </div>
                  </div>
                  
                  {/* TOTALES FINALES */}
                  <div className="pt-3 border-t border-gray-300">
                      <p className="text-sm text-gray-600">Subtotal (SIN IVA)</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatMXN(cotz.subtotalGeneral)}
                      </p>
                  </div>
                  
                  {/* BOTÓN VER REPORTE */}
                  <button
                    onClick={() => verReporteCotizacion(cotz)}
                    className="w-full mt-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center text-sm font-semibold" 
                  >
                    <Printer className="mr-2" size={16} />
                    Ver Reporte
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // VISTA: Historial
  if (vistaActual === 'historial') {
     return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"> 
              <h1 className="text-3xl font-bold text-gray-800">Historial de Cotizaciones</h1>
              <button
                onClick={() => setVistaActual('cotizador')}
                className="w-full md:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700" 
              >
                Volver al Cotizador
              </button>
            </div>
          </div>

          {historialCotizaciones.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">No hay cotizaciones guardadas</p>
              <p className="text-sm text-gray-500">Las cotizaciones que guardes aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historialCotizaciones.map(cotz => (
                <div key={cotz.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Título y Cliente (CORRECCIÓN: MOSTRAR NOMBRE DEL CLIENTE) */}
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">Cliente: {cotz.cliente.nombre}</h3>
                        <span className="text-sm text-gray-500">
                          {cotz.fecha.toLocaleDateString()} - {cotz.fecha.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {/* Desglose resumido de productos y totales */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4"> 
                        <div><p className="text-sm text-gray-600">Productos</p><p className="font-semibold text-gray-800">{cotz.items.length}</p></div>
                        {/* ***** VIX EN HISTORIAL ***** */}
                        <div>
                            <p className="text-sm text-gray-600">Paquete VIX</p>
                            <p className={`font-semibold ${cotz.paqueteVIX ? 'text-red-600' : 'text-gray-400'}`}>
                                {cotz.paqueteVIX ? cotz.paqueteVIX.nombre : 'Ninguno'}
                            </p>
                        </div>
                        {/* ***** FIN VIX EN HISTORIAL ***** */}
                        <div><p className="text-sm text-gray-600">Subtotal (SIN IVA)</p><p className="font-semibold text-gray-800">{formatMXN(cotz.subtotalGeneral)}</p></div>
                        <div><p className="text-sm text-gray-600">Total (CON IVA)</p><p className="text-xl font-bold text-red-600">{formatMXN(cotz.total)}</p></div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2"> 
                      <button
                        onClick={() => { setCotizacion(cotz); setVistaActual('cotizador'); }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => verReporteCotizacion(cotz)} // LLAMADA AL REPORTE
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                      >
                        Reporte
                      </button>
                      <button
                        onClick={() => agregarAComparador(cotz)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                      >
                        Comparar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // VISTA PRINCIPAL: Cotizador
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-4"> 
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Sistema de Cotizaciones</h1>
              <p className="text-gray-600 mt-1">TVSA Sureste 2025</p>
            </div>
            {/* GRUPO DE BOTONES DE ACCIÓN PRINCIPAL */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2"> 
              <button
                onClick={() => setVistaActual('lista-precios')}
                className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center" 
              >
                <List className="mr-2" size={18} />
                Lista Precios
              </button>
              <button
                onClick={() => setVistaActual('historial')}
                className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center" 
              >
                <FileText className="mr-2" size={18} />
                Historial ({historialCotizaciones.length})
              </button>
              <button
                onClick={() => setVistaActual('comparador')}
                className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center" 
              >
                <Eye className="mr-2" size={18} />
                Comparar ({cotizacionesComparar.length})
              </button>
              <button
                onClick={() => setVistaActual('administracion')} 
                className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center" 
              >
                <Settings className="mr-2" size={18} />
                Admin
              </button>
              <button
                onClick={iniciarNuevaCotizacion} // CAMBIO 1: Botón para limpiar
                className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center" 
              >
                <RefreshCw size={16} className="mr-2" />
                Nueva Cotización
              </button>
            </div>
          </div>
          {ultimaActualizacion && (
            <p className="text-xs text-gray-600">
              Última actualización: {ultimaActualizacion.toLocaleTimeString()} | 
              Productos: {productos.length} | Clientes: {clientes.length}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de configuración */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Search className="mr-2 text-red-700" size={20} />
                Cliente
              </h2>
              <select
                value={clienteSeleccionado}
                onChange={(e) => setClienteSeleccionado(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.segmento})
                  </option>
                ))}
              </select>
              {clienteSeleccionado && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-700">Tipo de acuerdo:</p>
                  <p className="font-semibold text-red-700">
                    {clientes.find(c => c.id === clienteSeleccionado)?.tipoAcuerdo.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-red-700" size={20} />
                Parámetros
              </h2>
              <div className="space-y-4">
                {/* ***** SELECTOR DE PLAZA ***** */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Plaza
                  </label>
                  <select
                      value={plazaSeleccionada}
                      onChange={(e) => setPlazaSeleccionada(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                      <option value="">Todas las Plazas</option>
                      {plazasDisponibles.map(plaza => (
                          <option key={plaza} value={plaza}>{plaza}</option>
                      ))}
                  </select>
                </div>
                {/* ***** FIN SELECTOR ***** */}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presupuesto Total (SIN IVA)
                  </label>
                  <input
                    type="number"
                    value={presupuesto}
                    onChange={(e) => setPresupuesto(e.target.value)}
                    placeholder="Ej: 50000"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (días)
                  </label>
                  <input
                    type="number"
                    value={duracionDias}
                    onChange={(e) => setDuracionDias(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                {/* ***** SELECTOR DE PAQUETE VIX ***** */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paquete VIX (Opcional)
                  </label>
                  <div className="flex gap-2">
                      <select
                          value={paqueteVIX}
                          onChange={(e) => setPaqueteVIX(e.target.value)}
                          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      >
                          <option value="">Sin paquete VIX</option>
                          {paquetesVIX.map(p => (
                              <option key={p.id} value={p.id}>
                                  {p.nombre} - {formatMXN(p.inversion)}
                              </option>
                          ))}
                      </select>
                      {paqueteVIX && (
                          <button
                              onClick={() => setPaqueteVIX('')}
                              className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 flex items-center justify-center flex-shrink-0"
                              title="Quitar Paquete VIX"
                          >
                              <Trash2 size={18} />
                          </button>
                      )}
                  </div>
                  {paqueteVIX && paquetesVIX.find(p => p.id === paqueteVIX) && (
                    <p className="text-xs text-gray-600 mt-1">
                        {paquetesVIX.find(p => p.id === paqueteVIX)?.impresiones.toLocaleString()} impresiones | {paquetesVIX.find(p => p.id === paqueteVIX)?.dias} días
                    </p>
                  )}
                </div>
                {/* ***** FIN SELECTOR VIX ***** */}
              </div>
              <button
                onClick={sugerirDistribucion}
                className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center"
              >
                <TrendingUp className="mr-2" size={18} />
                Sugerir Distribución
              </button>
            </div>
            
          </div>

          {/* Panel de productos y cotización (Ajustado para 2/3 del ancho) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Productos Disponibles</h2>
              <input
                type="text"
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                placeholder={`Buscar en ${plazaSeleccionada || 'todas las plazas'} por canal, tipo o horario...`}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500"
              />
              <div className="max-h-96 overflow-y-auto space-y-2">
                {productosFiltrados.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {p.canal} - {p.tipo} {p.duracion}
                      </p>
                      <p className="text-sm text-gray-600">
                        {p.horario} | **Plaza: {p.plaza}** | {p.categoria}
                      </p>
                      {clienteSeleccionado && (
                        <p className="text-sm text-green-600 font-semibold mt-1">
                          Tu precio: {formatMXN(calcularPrecioUnitario(p.id, clienteSeleccionado))}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => agregarProducto(p.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:bg-gray-400"
                      disabled={!clienteSeleccionado}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {productosSeleccionados.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* --- MUEVE EL PRESUPUESTO CERCA DE LOS PRODUCTOS (Punto 2) --- */}
                <div className="md:col-span-1">
                  {presupuestoNum > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-red-500 h-full">
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                         <DollarSign className="mr-2 text-red-500" size={20} />
                         Presupuesto Actual
                      </h3>
                      <div className="space-y-1">
                         <div className="flex justify-between text-sm text-gray-600">
                            <span>Presupuesto Base (SIN IVA):</span>
                            <span className="font-semibold">{formatMXN(presupuestoNum)}</span>
                         </div>
                         <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal Cotizado (SIN IVA):</span>
                            <span className="font-semibold text-red-700">-{formatMXN(subtotalActual)}</span>
                         </div>
                         <div className={`flex justify-between text-lg font-bold border-t pt-2 ${saldoColor}`}>
                            <span>SALDO DISPONIBLE:</span>
                            <span>{formatMXN(saldoDisponible)}</span>
                         </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- PANEL DE PRODUCTOS SELECCIONADOS --- */}
                <div className="bg-white rounded-lg shadow-lg p-6 md:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Productos en Cotización</h2>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {/* Lista de Productos de TV */}
                    {productosSeleccionados.map(ps => {
                      const producto = productos.find(p => p.id === ps.id);
                      return (
                        <div key={ps.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {producto.canal} - {producto.tipo} {producto.duracion}
                            </p>
                            <p className="text-sm text-gray-600">Plaza: {producto.plaza} | {producto.horario}</p>
                          </div>
                          <input
                            type="number"
                            value={ps.cantidad}
                            onChange={(e) => actualizarCantidad(ps.id, e.target.value)}
                            className="w-20 p-2 border border-gray-300 rounded text-center"
                            min="1"
                          />
                          <button
                            onClick={() => eliminarProducto(ps.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* ***** VIX EN LISTA DE COTIZACIÓN ***** */}
                    {paqueteVIX && paquetesVIX.find(p => p.id === paqueteVIX) && (
                        <div key="vix-paquete" className="flex items-center gap-4 p-3 border border-red-400 rounded-lg bg-red-50">
                            <div className="flex-1">
                                <p className="font-bold text-red-800">
                                    Paquete VIX: {paquetesVIX.find(p => p.id === paqueteVIX)?.nombre}
                                </p>
                                <p className="text-sm text-gray-700">
                                    {formatMXN(paquetesVIX.find(p => p.id === paqueteVIX)?.inversion)} (Costo Fijo)
                                </p>
                            </div>
                            <button
                                onClick={() => setPaqueteVIX('')}
                                className="text-red-600 hover:text-red-800"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}
                    {/* ***** FIN VIX EN LISTA ***** */}
                  </div>
                  <button
                    onClick={generarCotizacion}
                    className="w-full mt-4 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center justify-center"
                  >
                    <FileText className="mr-2" size={18} />
                    Generar Cotización
                  </button>
                </div>
              </div>
            )}

            {/* ***** RESUMEN DE COTIZACIÓN VISIBLE INMEDIATAMENTE ***** */}
            {cotizacion && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2"> 
                  <h2 className="text-2xl font-bold text-gray-800">Cotización Generada</h2>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"> 
                    <button
                      onClick={iniciarNuevaCotizacion}
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 flex items-center justify-center"
                    >
                      <RefreshCw className="mr-2" size={18} />
                      Nueva Cotización
                    </button>
                    <button
                      onClick={guardarCotizacion}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center"
                    >
                      <Save className="mr-2" size={16} />
                      Guardar
                    </button>
                    <button
                      onClick={() => agregarAComparador(cotizacion)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Eye className="mr-2" size={16} />
                      Comparar
                    </button>
                  </div>
                </div>
                
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="text-xl font-bold text-red-700">{cotizacion.cliente.nombre}</p>
                  <p className="text-sm text-gray-600">{cotizacion.cliente.segmento}</p>
                </div>
                
                {/* --- PANEL DE DISTRIBUCIÓN --- */}
                <div className="mb-6 border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-3 flex items-center">
                    <Calendar className="mr-2 text-red-600" size={18} />
                    PROYECCIÓN DE DISTRIBUCIÓN DE PAUTA ({cotizacion.diasCampana} días)
                  </h3>
                  <p className="text-sm text-red-700 mb-4">
                    Distribución de frecuencias contratadas en números enteros por semana.
                  </p>
                  <div className="space-y-3">
                    {cotizacion.distribucion.map((dist, idx) => (
                      <div key={idx} className="p-3 border-l-4 border-red-400 bg-white shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-2 items-center"> 
                        <div className="col-span-2 sm:col-span-2">
                          <p className="font-semibold text-gray-800">{dist.producto.tipo} ({dist.producto.canal})</p>
                          <p className="text-xs text-gray-600">Plaza: {dist.producto.plaza} | {dist.producto.horario}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Unidades</p>
                          <p className="font-bold text-gray-800">{dist.totalUnidades}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Pauta/Día</p>
                          <p className="font-bold text-green-600">{dist.unidadesPorDia}</p>
                        </div>
                         {/* Muestra la distribución semanal en el resumen principal (solo la primera semana como ejemplo) */}
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-xs text-gray-600">Semana 1 (Ent)</p>
                          <p className="font-bold text-green-600">{dist.distribucionSemanal[0] || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* --- FIN PANEL --- */}

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Desglose de Productos (SIN IVA)</h3>
                  <div className="space-y-2">
                    {cotizacion.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {item.producto.canal} - {item.producto.tipo} {item.producto.duracion}
                            </p>
                            <p className="text-sm text-gray-600">Plaza: {item.producto.plaza} | {item.producto.horario}</p>
                          </div>
                          <p className="font-bold text-gray-800">
                            {formatMXN(item.subtotal)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm"> 
                          <div>
                            <p className="text-gray-600">Cantidad</p>
                            <p className="font-semibold">{item.cantidad}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Precio Unit. (SIN IVA)</p>
                            <p className="font-semibold">{formatMXN(item.precioUnitario)}</p>
                          </div>
                          {item.descuentoVolumen > 0 && (
                            <div>
                              <p className="text-gray-600">Desc. Volumen</p>
                              <p className="font-semibold text-green-600">{item.descuentoVolumen}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* ***** VIX EN DESGLOSE ***** */}
                    {cotizacion.paqueteVIX && (
                        <div className="p-3 bg-red-100 rounded-lg border border-red-200">
                             <div className="flex justify-between items-center mb-1">
                                <p className="font-bold text-red-800">Paquete VIX: {cotizacion.paqueteVIX.nombre}</p>
                                <p className="font-bold text-red-800">{formatMXN(cotizacion.costoVIX)}</p>
                             </div>
                             <p className="text-xs text-gray-600">Costo Fijo por {cotizacion.paqueteVIX.dias} días ({cotizacion.paqueteVIX.impresiones.toLocaleString()} impresiones)</p>
                        </div>
                    )}
                    {/* ***** FIN VIX EN DESGLOSE ***** */}
                  </div>
                </div>

                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal TV:</span>
                      <span className="font-semibold">{formatMXN(cotizacion.subtotalTV)}</span>
                    </div>
                    {/* ***** VIX DETAIL IN RESUME ***** */}
                    {cotizacion.paqueteVIX && (
                      <div className="flex justify-between text-gray-700 border-t pt-1">
                        <span>{cotizacion.paqueteVIX.nombre} (SIN IVA):</span>
                        <span className="font-semibold">{formatMXN(cotizacion.costoVIX)}</span>
                      </div>
                    )}
                    {/* ***** END VIX DETAIL ***** */}
                    <div className="flex justify-between text-gray-700">
                      <span>IVA ({((configuracion.iva_porcentaje || 0.16) * 100).toFixed(0)}%):</span>
                      <span className="font-semibold">{formatMXN(cotizacion.iva)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-red-700 pt-2 border-t border-gray-300">
                      <span>TOTAL (CON IVA):</span>
                      <span>{formatMXN(cotizacion.total)}</span>
                    </div>
                  </div>
                  
                  {/* Presupuesto Disponible se mantiene */}

                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3"> 
                  <button
                    onClick={iniciarNuevaCotizacion}
                    className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500 flex items-center justify-center"
                  >
                    <RefreshCw className="mr-2" size={18} />
                    Nueva Cotización
                  </button>
                  <button
                    onClick={guardarCotizacion}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center"
                    >
                    <Save className="mr-2" size={16} />
                    Guardar
                  </button>
                  <button
                    onClick={mostrarPresupuestoEImprimir} // ESTO AHORA LLAMA A VER REPORTE
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center" 
                  >
                    <Printer className="mr-2" size={18} />
                    Ver Reporte
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;