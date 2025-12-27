import { formatMXN } from './formatters';

export const generatePDF = (cotz, configuracion) => {
    const totalUnidadesGeneral = cotz.distribucion.reduce((acc, dist) => acc + dist.totalUnidades, 0);
    const totalSemanas = cotz.distribucion[0]?.distribucionSemanal.length || 0;

    const weeklyHeaders = Array.from({ length: totalSemanas }, (_, i) =>
        `<th class="header-cell">S${i + 1}</th>`
    ).join('');

    const distribucionRows = cotz.distribucion.map(dist => {
        const weeklyCells = dist.distribucionSemanal.map(units =>
            `<td class="data-cell text-center font-bold">${units || 0}</td>`
        ).join('');

        const item = cotz.items.find(i => i.producto.id === dist.producto.id);
        const totalInversionProducto = item ? item.subtotal : 0;

        return `
      <tr>
        <td class="data-cell">
          <div class="product-info">
            <span class="product-title">${dist.producto.tipo}</span>
            <span class="product-subtitle">${dist.producto.canal} | ${dist.producto.plaza} | ${dist.producto.horario}</span>
          </div>
        </td>
        <td class="data-cell text-center font-bold">${dist.totalUnidades}</td>
        ${weeklyCells}
        <td class="data-cell text-right font-bold text-red-700">${formatMXN(totalInversionProducto)}</td>
      </tr>
    `;
    }).join('');

    const totalPorSemana = Array.from({ length: totalSemanas }).map((_, weekIndex) =>
        cotz.distribucion.reduce((sum, dist) => sum + (dist.distribucionSemanal[weekIndex] || 0), 0)
    );
    const totalSemanalCells = totalPorSemana.map(total => `<td class="footer-cell text-center">${total}</td>`).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Orden de Pauta - ${cotz.cliente.nombre}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        :root {
          --tvsa-red: #cc0000;
          --tvsa-dark: #1a1a1a;
        }
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: #f4f4f4;
          color: #333;
        }
        .order-container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 40px rgba(0,0,0,0.1);
          padding: 40px;
          min-height: 100vh;
        }
        .header {
          border-bottom: 4px solid var(--tvsa-red);
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo-text {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 28px;
          color: var(--tvsa-red);
          letter-spacing: -1px;
        }
        .doc-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 14px;
          background: var(--tvsa-dark);
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
        }
        .client-info-box {
          background: #f9f9f9;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          display: grid;
          grid-template-cols: 2fr 1fr;
          gap: 20px;
        }
        .label {
          font-size: 10px;
          font-weight: 800;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .value {
          font-weight: 700;
          color: var(--tvsa-dark);
          font-size: 16px;
        }
        .pauta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .header-cell {
          background: #f0f0f0;
          color: #666;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 10px 5px;
          border: 1px solid #ddd;
        }
        .data-cell {
          padding: 10px 8px;
          border: 1px solid #eee;
          font-size: 11px;
        }
        .footer-cell {
          background: #eee;
          font-weight: 800;
          font-size: 11px;
          padding: 10px 5px;
        }
        .product-title {
          font-weight: 800;
          color: var(--tvsa-dark);
          display: block;
        }
        .product-subtitle {
          font-size: 9px;
          color: #777;
          display: block;
        }
        .summary-grid {
          display: grid;
          grid-template-cols: 1fr 1fr;
          gap: 40px;
        }
        .total-box {
          background: var(--tvsa-red);
          color: white;
          border-radius: 12px;
          padding: 20px;
          text-align: right;
        }
        .total-label {
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          opacity: 0.8;
        }
        .total-value {
          font-size: 28px;
          font-weight: 900;
          font-family: 'Montserrat', sans-serif;
        }
        .signature-area {
          margin-top: 60px;
          display: grid;
          grid-template-cols: 1fr 1fr;
          gap: 100px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          padding-top: 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        @media print {
          body { background: white; padding: 0; }
          .order-container { box-shadow: none; padding: 0; }
          .no-print { display: none; }
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
            <div class="value">${cotz.cliente.nombre}</div>
            <div class="label" style="margin-top:10px">ID de Propuesta</div>
            <div class="value" style="font-size: 12px">${cotz.id}</div>
          </div>
          <div style="text-align: right">
            <div class="label">Fecha de Emisión</div>
            <div class="value">${new Date().toLocaleDateString('es-MX')}</div>
            <div class="label" style="margin-top:10px">Vigencia</div>
            <div class="value" style="font-size: 12px">${cotz.diasCampana} Días de Campaña</div>
          </div>
        </div>

        <h3 class="font-black uppercase text-[12px] mb-4 tracking-widest text-gray-400">Distribución Semanal y Frecuencias</h3>
        
        <table class="pauta-table">
          <thead>
            <tr>
              <th class="header-cell" style="text-align: left">Producto y Especificaciones</th>
              <th class="header-cell">Total</th>
              ${weeklyHeaders}
              <th class="header-cell" style="text-align: right">Inversion Net-Net</th>
            </tr>
          </thead>
          <tbody>
            ${distribucionRows}
          </tbody>
          <tfoot>
            <tr>
              <td class="footer-cell text-right" style="padding-right: 15px">Resumen de Unidades</td>
              <td class="footer-cell text-center">${totalUnidadesGeneral}</td>
              ${totalSemanalCells}
              <td class="footer-cell text-right">${formatMXN(cotz.subtotalTV)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="summary-grid">
          <div>
            ${cotz.paqueteVIX ? `
              <div style="border: 2px solid #eee; border-radius: 12px; padding: 15px; margin-bottom: 20px">
                <div class="label" style="color: var(--tvsa-red)">Servicios Digitales Adicionales</div>
                <div class="value" style="font-size: 14px">${cotz.paqueteVIX.nombre}</div>
                <div style="font-size: 10px; color: #666; margin-top: 5px">
                  ${cotz.paqueteVIX.impresiones.toLocaleString()} Impresiones | ${cotz.paqueteVIX.dias} Días de Campaña
                </div>
                <div class="font-bold text-sm mt-2">${formatMXN(cotz.costoVIX)}</div>
              </div>
            ` : ''}
            <div style="font-size: 10px; color: #888; line-height: 1.4">
              <strong>Términos y Condiciones:</strong><br>
              Esta propuesta está sujeta a disponibilidad de espacios al momento de la confirmación. Los precios no incluyen IVA. Liquidación conforme a contrato anual vigente. Propuesta generada automáticamente por el sistema de cotización MID.
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between items-center text-sm font-bold border-b pb-2">
              <span class="text-gray-400 uppercase text-[10px]">Subtotal Propuesta</span>
              <span>${formatMXN(cotz.subtotalGeneral)}</span>
            </div>
            <div class="flex justify-between items-center text-sm font-bold border-b pb-2">
              <span class="text-gray-400 uppercase text-[10px]">IVA (${((configuracion.iva_porcentaje || 0.16) * 100).toFixed(0)}%)</span>
              <span>${formatMXN(cotz.iva)}</span>
            </div>
            
            <div class="total-box">
              <div class="total-label">Inversión Total con IVA</div>
              <div class="total-value">${formatMXN(cotz.total)}</div>
            </div>
          </div>
        </div>

        <div class="signature-area">
          <div class="signature-line">Por Televisa Univisión (MID)</div>
          <div class="signature-line">Conformidad del Cliente</div>
        </div>

        <div style="text-align: center; margin-top: 40px; font-size: 9px; color: #bbb; font-weight: 700; text-transform: uppercase;">
          Televisa Mid - Proyección de Pauta Publicitaria
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
