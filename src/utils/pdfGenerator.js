import { formatMXN } from './formatters';

export const generatePDF = (cotz, configuracion, perfil = {}) => {
  const totalUnidadesGeneral = cotz.distribucion.reduce((acc, dist) => acc + dist.totalUnidades, 0);
  const totalSemanas = cotz.distribucion[0]?.distribucionSemanal.length || 0;
  const now = new Date();
  const fechaImpresion = now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const weeklyHeaders = Array.from({ length: totalSemanas }, (_, i) =>
    `<th class="header-cell">S${i + 1}</th>`
  ).join('');

  const distribucionRows = cotz.distribucion.map(dist => {
    const weeklyCells = dist.distribucionSemanal.map(units =>
      `<td class="data-cell text-center" style="font-size: 8px; padding: 4px 2px;">${units || 0}</td>`
    ).join('');

    const item = cotz.items.find(i => i.producto.id === dist.producto.id);
    const precioUnitario = item ? item.precioUnitario : 0;
    const totalInversionProducto = item ? item.subtotal : 0;

    return `
      <tr>
        <td class="data-cell" style="padding: 4px 6px;">
          <div class="product-info">
            <span class="product-title" style="font-size: 8.5px; font-weight: 800;">${dist.producto.tipo}</span>
            <span class="product-subtitle" style="font-size: 6.5px; display: block;">${dist.producto.canal} | ${dist.producto.plaza} | ${dist.producto.horario}</span>
          </div>
        </td>
        <td class="data-cell text-center font-bold" style="font-size: 8.5px; padding: 4px 2px;">${dist.totalUnidades}</td>
        <td class="data-cell text-right" style="font-size: 7.5px; padding: 4px 6px;">${formatMXN(precioUnitario)}</td>
        ${weeklyCells}
        <td class="data-cell text-right font-bold text-red-700" style="font-size: 8.5px; padding: 4px 6px;">${formatMXN(totalInversionProducto)}</td>
      </tr>
    `;
  }).join('');

  const totalPorSemana = Array.from({ length: totalSemanas }).map((_, weekIndex) =>
    cotz.distribucion.reduce((sum, dist) => sum + (dist.distribucionSemanal[weekIndex] || 0), 0)
  );

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Orden de Pauta - ${cotz.cliente.nombre_empresa || cotz.cliente.nombre || 'Cliente'}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        @page {
          size: letter;
          margin: 0;
        }
        :root {
          --tvsa-red: #cc0000;
          --tvsa-dark: #1a1a1a;
        }
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: #eee;
          color: #333;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
        }
        .order-container {
          width: 215.9mm;
          margin: 0 auto;
          background: white;
          padding: 5mm 15mm;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }
        .header {
          border-bottom: 2px solid var(--tvsa-red);
          padding-bottom: 6px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo-text {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 20px;
          color: var(--tvsa-red);
          letter-spacing: -1px;
        }
        .doc-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 9px;
          background: var(--tvsa-dark);
          color: white;
          padding: 2px 8px;
          border-radius: 2px;
        }
        .client-info-box {
          background: #f9f9f9;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 25px; /* Más aire para bajar el detalle */
          display: grid;
          grid-template-cols: 2fr 1fr;
          gap: 10px;
        }
        .label {
          font-size: 7px;
          font-weight: 800;
          color: #999;
          text-transform: uppercase;
        }
        .value {
          font-weight: 700;
          color: var(--tvsa-dark);
          font-size: 11px;
        }
        .pauta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .header-cell {
          background: #f0f0f0;
          color: #666;
          font-size: 7.5px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 6px 3px;
          border: 1px solid #ddd;
        }
        .data-cell {
          padding: 6px 4px;
          border: 1px solid #eee;
          font-size: 8.5px;
        }
        .footer-cell {
          background: #eee;
          font-weight: 800;
          font-size: 8.5px;
          padding: 6px 4px;
        }
        .summary-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-top: 15px; /* Más aire antes de los totales */
          gap: 8px;
          width: 100%;
        }
        .vix-box {
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 12px 15px; /* Más aire al VIX */
          width: 220px;
          text-align: right;
          background: #fdfdfd;
        }
        .totals-column {
          width: 220px;
          text-align: right;
        }
        .total-box {
          background: var(--tvsa-red);
          color: white;
          border-radius: 4px;
          padding: 10px 15px;
          display: inline-block;
          text-align: right;
          width: 100%;
          box-sizing: border-box;
          box-shadow: 0 2px 4px rgba(204,0,0,0.1);
        }
        .total-label {
          font-weight: 800;
          font-size: 9px;
          text-transform: uppercase;
        }
        .total-value {
          font-size: 19px;
          font-weight: 900;
          font-family: 'Montserrat', sans-serif;
        }
        .iva-disclaimer {
          font-size: 9px;
          font-weight: 900;
          color: #333;
          margin-top: 2px;
          text-transform: uppercase;
          padding-right: 5px;
        }
        .disclaimer-text {
          font-size: 7px; 
          color: #888; 
          line-height: 1.3; 
          margin-top: 10px; 
          max-width: 60%;
        }
        .signature-area {
          margin-top: 110px; /* Aumentado para bajar las firmas y pie de página */
          margin-bottom: 25px;
          display: flex;
          justify-content: center;
          width: 100%;
          gap: 60px;
        }
        .signature-block {
          flex: 1;
          max-width: 250px;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 6px;
          text-align: center;
          background: #fcfcfc;
        }
        .signature-line {
          border-top: 1.5px solid #333;
          margin-top: 45px;
          padding-top: 8px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--tvsa-dark);
        }
        .page-footer {
          text-align: center;
          font-size: 7.5px;
          color: #999;
          font-weight: 700;
          text-transform: uppercase;
          width: 100%;
          border-top: 1px solid #eee;
          padding-top: 10px;
          margin-bottom: 5mm;
        }
        
        @media print {
          body { background: white; }
          .order-container { box-shadow: none; margin: 0; border: none; min-height: auto; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print p-4 flex justify-center gap-4 bg-gray-800">
        <button onclick="window.print()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all">
          Imprimir / Descargar PDF
        </button>
        <button onclick="window.close()" class="bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-6 rounded-full shadow-lg transition-all">
          Cerrar Vista
        </button>
      </div>

      <div class="order-container">
        <div class="header">
          <div class="logo-text">televisa<span style="color:#333">univision</span></div>
          <div class="doc-title">Propuesta Comercial de Pauta</div>
        </div>

        <div class="client-info-box">
          <div>
            <div class="label">Razon Social / Cliente</div>
            <div class="value" style="font-size: 13px;">${cotz.cliente.nombre_empresa || cotz.cliente.nombre || 'Cliente'}</div>
            <div class="label" style="margin-top:8px">ID de Propuesta</div>
            <div class="value" style="font-size: 9px">${cotz.id}</div>
          </div>
          <div style="text-align: right">
            <div class="label">Fecha de Emisión</div>
            <div class="value" style="font-size: 9px">${now.toLocaleDateString('es-MX')}</div>
            <div class="label" style="margin-top:8px">Vigencia</div>
            <div class="value" style="font-size: 9px">${cotz.diasCampana} Días de Campaña</div>
          </div>
        </div>

        <h3 style="font-size: 8px; font-weight: 900; text-transform: uppercase; color: #777; margin-bottom: 8px; letter-spacing: 1px;">Distribución Semanal y Frecuencias</h3>
        
        <table class="pauta-table">
          <thead>
            <tr>
              <th class="header-cell" style="text-align: left">Producto y Especificaciones</th>
              <th class="header-cell">Total</th>
              <th class="header-cell">Unitario</th>
              ${weeklyHeaders}
              <th class="header-cell" style="text-align: right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${distribucionRows}
          </tbody>
          <tfoot>
            <tr>
              <td class="footer-cell text-right" style="padding-right: 15px; font-size: 8px;">Unidades Totales</td>
              <td class="footer-cell text-center" style="font-size: 9px;">${totalUnidadesGeneral}</td>
              <td class="footer-cell"></td>
              ${totalPorSemana.map(total => `<td class="footer-cell text-center" style="font-size: 9px;">${total}</td>`).join('')}
              <td class="footer-cell text-right" style="font-weight: 900; color: var(--tvsa-red); font-size: 9px;">${formatMXN(cotz.subtotalTV)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="summary-section">
          ${cotz.paqueteVIX ? `
            <div class="vix-box">
              <div class="label" style="color: var(--tvsa-red)">Inversión Digital</div>
              <div style="font-weight: 900; font-size: 13px; color: #111;">${formatMXN(cotz.costoVIX)}</div>
              <div style="font-size: 8px; color: #555; margin-top: 3px">
                ${cotz.paqueteVIX.nombre} | ${(cotz.paqueteVIX.impresiones || 0).toLocaleString()} Impresiones
              </div>
            </div>
          ` : ''}

          <div class="totals-column">
            <div class="total-box">
              <div class="total-label" style="font-size: 9px;">Inversión Final</div>
              <div class="total-value">${formatMXN(cotz.subtotalGeneral)}</div>
            </div>
            <div class="iva-disclaimer">MÁS IVA</div>
          </div>
        </div>

        <div class="disclaimer-text">
           Propuesta sujeta a disponibilidad de espacios. Precios de lista vigentes según contrato. Esta proyección no incluye cargos por producción u otros servicios no especificados.
        </div>

        <div class="signature-area">
          <div class="signature-block">
            <div style="font-size: 10px; font-weight: 900; color: #111; margin-bottom: 2px;">${perfil?.nombre_completo || 'Asesor Comercial'}</div>
            <div style="font-size: 8px; color: #666; margin-bottom: 5px;">${perfil?.telefono || 'Televisa Univisión MID'}</div>
            <div class="signature-line">Por Televisa Univisión</div>
          </div>
          <div class="signature-block">
            <div style="height: 15px;"></div>
            <div class="signature-line">Nombre y Firma Aceptación Cliente</div>
          </div>
        </div>

        <div class="page-footer">
          Generado el: ${fechaImpresion} | TELEVISA UNIVISIÓN MID - PROPUESTA PUBLICITARIA 2025
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=1100,height=850');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert("El navegador bloqueó la apertura de la propuesta. Por favor permite las ventanas emergentes.");
  }
};
