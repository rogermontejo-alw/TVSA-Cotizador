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
            <span class="product-subtitle" style="font-size: 6.5px; display: block;">${dist.producto.canal} | ${dist.producto.plaza} | ${dist.producto.duracion || '--'} | ${dist.producto.horario}</span>
          </div>
        </td>
        <td class="data-cell text-center font-bold" style="font-size: 8.5px; padding: 4px 2px;">${dist.totalUnidades}</td>
        <td class="data-cell text-right" style="font-size: 7.5px; padding: 4px 6px;">${formatMXN(precioUnitario)}</td>
        ${weeklyCells}
        <td class="data-cell text-right font-bold" style="font-size: 8.5px; padding: 4px 6px; color: #FF5900;">${formatMXN(totalInversionProducto)}</td>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Orden de Pauta - ${cotz.cliente.nombre_empresa || cotz.cliente.nombre || 'Cliente'}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        @page {
          size: letter;
          margin: 15mm 15mm 20mm 15mm;
        }
        :root {
          --brand-orange: #FF5900;
          --brand-magenta: #C83378;
          --enterprise-dark: #111111;
        }
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: #f0f2f5;
          color: #333;
          margin: 0;
          padding: 100px 0 40px 0;
          -webkit-print-color-adjust: exact;
        }
        .no-print-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: rgba(17, 17, 17, 0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          z-index: 9999;
          border-bottom: 2px solid var(--brand-orange);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .btn-premium {
          height: 40px;
          padding: 0 25px;
          border-radius: 12px;
          font-weight: 900;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-orange {
          background: var(--brand-orange);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 89, 0, 0.3);
        }
        .btn-orange:hover {
          background: #e65000;
          transform: translateY(-2px);
        }
        .btn-outline {
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.1);
          border-color: white;
        }
        * {
          box-sizing: border-box;
        }
        .order-container {
          width: 215.9mm;
          min-height: 279.4mm;
          background: white;
          padding: 20mm !important;
          position: relative;
          box-shadow: 0 0 50px rgba(0,0,0,0.1);
          margin: 40px auto !important;
          display: block;
        }
        @media print {
          .order-container {
            width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          body {
            padding: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        .header {
          border-bottom: 2px solid var(--brand-orange);
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-img {
          height: 38px;
          width: 38px;
          object-fit: contain;
        }
        .logo-text {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 18px;
          color: var(--enterprise-dark);
          letter-spacing: -1px;
          text-transform: uppercase;
        }
        .doc-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 9px;
          background: var(--enterprise-dark);
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          letter-spacing: 1px;
        }
        .client-info-box {
          background: #f9f9f9;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 25px;
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
          color: var(--enterprise-dark);
          font-size: 11px;
        }
        .pauta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          table-layout: auto;
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
          margin-top: 15px;
          gap: 8px;
          width: 100%;
          page-break-inside: avoid;
        }
        .vix-box {
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 12px 15px;
          width: 220px;
          text-align: right;
          background: #fdfdfd;
        }
        .totals-column {
          width: 220px;
          text-align: right;
        }
        .total-box {
          background: linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-magenta) 100%);
          color: white;
          border-radius: 6px;
          padding: 12px 15px;
          display: inline-block;
          text-align: right;
          width: 100%;
          box-sizing: border-box;
          box-shadow: 0 4px 12px rgba(255,89,0,0.15);
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
          page-break-inside: avoid;
        }
        .signature-area {
          margin-top: 50px;
          margin-bottom: 25px;
          display: flex;
          justify-content: center;
          width: 100%;
          gap: 60px;
          page-break-inside: avoid;
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
          color: var(--enterprise-dark);
        }
        .page-footer {
          position: fixed;
          bottom: -10mm;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 7.5px;
          color: #999;
          font-weight: 700;
          text-transform: uppercase;
          width: 100%;
          border-top: 1px solid #eee;
          padding-top: 10px;
          background: white;
        }
        
        @media print {
          body { 
            background: white; 
            padding: 0;
            margin: 0;
          }
          .order-container { 
            box-shadow: none; 
            margin: 0; 
            border: none; 
            min-height: auto;
            width: 100%;
          }
          .no-print { display: none !important; }
          
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr { page-break-inside: avoid; }
          
          /* Page Numbering */
          .page-number:after {
            content: "Página " counter(page);
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar no-print">
        <button onclick="window.print()" class="btn-premium btn-orange">
          Imprimir / Descargar PDF
        </button>
        <button onclick="window.close()" class="btn-premium btn-outline">
          Cerrar Vista
        </button>
      </div>

      <div class="order-container">
        <div class="header" style="margin-bottom: 12px;">
          <div class="brand-section">
            <img src="${window.location.origin}/logo-tvsa.png" class="logo-img" />
            <div class="logo-text" style="font-size: 16px;">televisa<span style="color:var(--brand-orange)">univision</span> <span style="font-weight:400; font-size: 10px; margin-left: 5px; color: #999;">MID</span></div>
          </div>
          <div class="doc-title" style="font-size: 8px;">Propuesta Comercial de Pauta</div>
        </div>

        <div class="client-info-box" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; border: 1px solid #eee; background: #fafafa; margin-bottom: 15px;">
          <div style="grid-column: span 3; border-right: 1px solid #eee; padding-right: 10px;">
            <div class="label" style="font-size: 6.5px; margin-bottom: 2px;">Razon Social / Cliente</div>
            <div class="value" style="font-size: 14px; line-height: 1.1; margin-bottom: 6px;">${cotz.cliente.nombre_empresa || cotz.cliente.nombre || 'Cliente'}</div>
            <div class="label" style="font-size: 6.5px; display: inline-block; margin-right: 5px;">ID DE PROPUESTA:</div>
            <span style="font-size: 8px; font-weight: 600; color: #666; font-family: monospace;">${cotz.folio || cotz.id}</span>
          </div>
          <div style="grid-column: span 1; text-align: right; display: flex; flex-direction: column; justify-content: center;">
            <div style="margin-bottom: 6px;">
              <div class="label" style="font-size: 6.5px;">Fecha de Emisión</div>
              <div class="value" style="font-size: 9px;">${now.toLocaleDateString('es-MX')}</div>
            </div>
            <div>
              <div class="label" style="font-size: 6.5px;">Vigencia Plan</div>
              <div class="value" style="font-size: 9px; color: var(--brand-orange);">${cotz.diasCampana || 30} Días de Campaña</div>
            </div>
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

        <div class="summary-section" style="flex-direction: row; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
          <div class="disclaimer-text" style="max-width: 380px; margin: 0; text-align: left;">
            <div style="font-weight: 800; font-size: 8.5px; color: #444; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Nota Importante:</div>
            Propuesta sujeta a disponibilidad de espacios. Precios de lista vigentes según contrato. Esta proyección no incluye cargos por producción u otros servicios no especificados.
          </div>

          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
            ${cotz.paqueteVIX ? `
              <div class="vix-box">
                <div class="label" style="color: var(--brand-magenta)">Inversión Digital</div>
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
        </div>

        <div class="signature-area">
          <div class="signature-block">
            <div style="font-size: 10px; font-weight: 900; color: #111; margin-bottom: 2px;">${perfil?.nombre_completo || 'Asesor Comercial'}</div>
            <div style="font-size: 7.5px; font-weight: 700; color: var(--brand-orange); text-transform: uppercase; margin-bottom: 4px;">${perfil?.cargo || 'Ejecutivo de Ventas'}</div>
            <div style="font-size: 8px; color: #666; margin-bottom: 5px;">${perfil?.telefono || 'Televisa Univisión MID'}</div>
            <div class="signature-line">Por Televisa Univisión</div>
          </div>
          <div class="signature-block">
            <div style="height: 15px;"></div>
            <div class="signature-line">Nombre y Firma Aceptación Cliente</div>
          </div>
        </div>

        <div class="page-footer">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 40px;">
            <div>Generado el: ${fechaImpresion}</div>
            <div class="page-number"></div>
          </div>
          <div style="margin-top: 5px;">TELEVISA UNIVISIÓN MID - PROPUESTA PUBLICITARIA 2025</div>
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
