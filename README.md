📄 Documentación: Sistema de Cotizaciones TVSA Sureste

Este documento detalla la estructura y el funcionamiento del Sistema de Cotizaciones implementado en React y estilizado con Tailwind CSS (vía CDN), que consume datos de precios, clientes y condiciones directamente desde Google Sheets.

1. Arquitectura de Datos (Google Sheets)

La aplicación es un cliente de datos. No almacena información localmente (a excepción del historial de sesión) y depende de los siguientes enlaces públicos de Google Sheets para su funcionamiento:

Hoja de Cálculo (GID)

Propósito de los Datos

gid=0 (productos)

Catálogo base de todos los productos de TV (costo base, canal, duración, etc.).

gid=247261297 (clientes)

Listado de clientes activos y su segmento/tipo de acuerdo.

gid=575442327 (condiciones)

Reglas de ajuste de precio por cliente y por producto (descuento por factor o costo fijo).

gid=796931390 (descuentos)

Reglas de descuento por volumen aplicables a categorías de productos.

gid=45434253 (vix)

Paquetes de inversión fijos (ej: VIX) y su costo asociado.

gid=1490714540 (config)

Parámetros globales, como el porcentaje de IVA.

Importante: Para que la aplicación funcione, todas estas hojas deben estar Publicadas en la Web como archivos CSV y las URLs en src/App.jsx deben ser correctas.

2. Flujo de Carga y Errores

Inicio: Al cargar la aplicación, el estado cargando es true.

Carga de Datos: Se ejecuta la función cargarDatos() que realiza un Promise.all para obtener todos los archivos CSV de Google Sheets simultáneamente.

Manejo de Errores:

Si la carga de cualquier archivo falla (ej: la hoja no está publicada o la URL es incorrecta), se activa la Pantalla de Error, que explica la causa y ofrece un botón para reintentar.

Si la carga es exitosa, se actualizan los estados (productos, clientes, etc.) y cargando se establece en false, mostrando el Cotizador Principal.

Actualización: El botón "Actualizar" recarga todos los datos desde cero.

3. Funcionalidades Clave

A. Cálculo de Precio Unitario (Base y Condicionado)

El precio unitario de un producto para un cliente específico se calcula en la función calcularPrecioUnitario(productoId, clienteId) siguiendo esta jerarquía:

Busca si existe una condición específica para ese clienteId y productoId en la hoja condiciones.

Si existe una condición:

Aplica el Costo Fijo si tipoAjuste es 'FIJO'.

Aplica el Factor de Descuento si tipoAjuste es 'FACTOR'.

Si no existe una condición específica, utiliza el costoBase del producto.

B. Descuentos por Volumen

La función aplicarDescuentoVolumen() busca en la hoja descuentos si la cantidad total de un producto cae dentro de un rango (minimo y maximo) asociado a su categoria. Si aplica, el precio unitario se ajusta antes de calcular el subtotal.

C. Generación de Cotización (generarCotizacion)

Esta función procesa todos los productos seleccionados, aplica las reglas de precio y calcula los totales:

Cálculos: Precio Base → Descuento por Condición → Descuento por Volumen → Subtotal de TV.

VIX: Añade el costo fijo del paquete VIX seleccionado (si aplica).

Total: Calcula el Subtotal General (TV + VIX) y le suma el IVA (usando configuracion.iva_porcentaje).

D. Distribución Inteligente de Pauta (Reporte de Proyección)

Esta funcionalidad proyecta la distribución de la pauta basándose en el total de unidades contratadas y la duración de la campaña (en días) ingresada por el usuario.

Cálculo: Se calcula la pauta promedio diaria y la pauta promedio semanal para cada producto.

Reporte: Los resultados se muestran en el panel "Proyección de Distribución de Pauta" del resumen de la cotización, ofreciendo al ejecutivo una visualización clara del ritmo de emisión de la campaña (similar al formato de tabla de flujo).

E. Sugerencia de Distribución

La función sugerirDistribucion (basada en el presupuesto y el cliente seleccionado) realiza una sugerencia de productos de categoría 'CONTENIDO' que maximizan el uso del presupuesto disponible.

4. Estilos y Entorno

Estilos: Se utiliza Tailwind CSS para el diseño (bg-indigo-600, shadow-lg, etc.).

Entorno de Desarrollo: El entorno se ejecuta con Vite y React.

Aviso del CDN: La advertencia en la consola sobre el CDN (cdn.tailwindcss.com) es normal en desarrollo, ya que este método no está optimizado para producción. Para entornos de producción, se recomienda instalar Tailwind como un plugin de PostCSS (como se intentó inicialmente).