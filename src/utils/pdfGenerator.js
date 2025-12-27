import { formatMXN } from './formatters';

export const generatePDF = (cotz, configuracion) => {
  const totalUnidadesGeneral = cotz.distribucion.reduce((acc, dist) => acc + dist.totalUnidades, 0);
  const totalSemanas = cotz.distribucion[0]?.distribucionSemanal.length || 0;

  const weeklyHeaders = Array.from({ length: totalSemanas }, (_, i) =>
    `<th class="header-cell">S${i + 1}</th>`
  ).join('');

  const distribucionRows = cotz.distribucion.map(dist => {
    const weeklyCells = dist.distribucionSemanal.map(units =>
      `<td class="data-cell text-center font-bold text-[9px]">${units || 0}</td>`
    ).join('');

    const item = cotz.items.find(i => i.producto.id === dist.producto.id);
    const precioUnitario = item ? item.precioUnitario : 0;
    const totalInversionProducto = item ? item.subtotal : 0;

    return `
      <tr>
        <td class="data-cell">
          <div class="product-info">
            <span class="product-title text-[10px]">${dist.producto.tipo}</span>
            <span class="product-subtitle text-[8px]">${dist.producto.canal} | ${dist.producto.plaza} | ${dist.producto.horario}</span>
          </div>
        </td>
        <td class="data-cell text-center font-bold text-[10px]">${dist.totalUnidades}</td>
        <td class="data-cell text-right text-[9px] font-semibold">${formatMXN(precioUnitario)}</td>
        ${weeklyCells}
        <td class="data-cell text-right font-bold text-red-700 text-[10px]">${formatMXN(totalInversionProducto)}</td>
      </tr>
    `;
  }).join('');

  const totalPorSemana = Array.from({ length: totalSemanas }).map((_, weekIndex) =>
    cotz.distribucion.reduce((sum, dist) => sum + (dist.distribucionSemanal[weekIndex] || 0), 0)
  );
  const totalSemanalCells = totalPorSemana.map(total => `<td class="footer-cell text-center text-[9px]">${total}</td>`).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Propuesta Comercial - ${cotz.cliente.nombre}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        @page {
          size: letter;
          margin: 15mm;
        }
        :root {
          --tvsa-red: #cc0000;
          --tvsa-dark: #1a1a1a;
        }
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: #f4f4f4;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .order-container {
          width: 215.9mm;
          min-height: 279.4mm;
          margin: 0 auto;
          background: white;
          padding: 10mm;
          box-shadow: 0 0 40px rgba(0,0,0,0.1);
          box-sizing: border-box;
          position: relative;
        }
        .header {
          border-bottom: 3px solid var(--tvsa-red);
          padding-bottom: 15px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo-text {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 24px;
          color: var(--tvsa-red);
          letter-spacing: -1px;
        }
        .logo-univision {
          color: #333;
        }
        .doc-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 11px;
          background: var(--tvsa-dark);
          color: white;
          padding: 3px 10px;
          border-radius: 3px;
        }
        .client-info-box {
          background: #f9f9f9;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
          display: grid;
          grid-template-cols: 2fr 1fr;
          gap: 15px;
        }
        .label {
          font-size: 9px;
          font-weight: 800;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 1px;
        }
        .value {
          font-weight: 700;
          color: var(--tvsa-dark);
          font-size: 14px;
        }
        .pauta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .header-cell {
          background: #f0f0f0;
          color: #666;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 8px 4px;
          border: 1px solid #ddd;
        }
        .data-cell {
          padding: 8px 6px;
          border: 1px solid #eee;
          font-size: 10px;
        }
        .footer-cell {
          background: #eee;
          font-weight: 800;
          font-size: 10px;
          padding: 8px 4px;
        }
        .product-title {
          font-weight: 800;
          color: var(--tvsa-dark);
          display: block;
        }
        .product-subtitle {
          font-size: 8px;
          color: #777;
          display: block;
        }
        .summary-grid {
          display: grid;
          grid-template-cols: 1.2fr 0.8fr;
          gap: 30px;
          margin-top: 10px;
        }
        .total-box {
          background: var(--tvsa-red);
          color: white;
          border-radius: 10px;
          padding: 15px;
          text-align: right;
        }
        .total-label {
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          opacity: 0.8;
        }
        .total-value {
          font-size: 24px;
          font-weight: 900;
          font-family: 'Montserrat', sans-serif;
        }
        .signature-area {
          margin-top: 50px;
          display: grid;
          grid-template-cols: 1fr 1fr;
          gap: 80px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          padding-top: 8px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        @media print {
          body { background: white; padding: 0; }
          .order-container { box-shadow: none; padding: 10mm; margin: 0; width: 100%; height: auto; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print p-4 flex justify-center gap-4 bg-gray-800">
        <button onclick="window.print()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Imprimir / Descargar PDF
        </button>
        <button onclick="window.close()" class="bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-6 rounded-full shadow-lg transition-all">
          Cerrar Vista
        </button>
      </div>

      <div class="order-container">
        <div class="header">
          <div class="logo-text">televisa<span class="logo-univision">univision</span></div>
          <div class="doc-title">Propuesta Comercial de Pauta</div>
        </div>

        <div class="client-info-box">
          <div>
            <div class="label">Razon Social / Cliente</div>
            <div class="value">${cotz.cliente.nombre}</div>
            <div class="label" style="margin-top:10px">ID de Propuesta</div>
            <div class="value" style="font-size: 11px uppercase">${cotz.id}</div>
          </div>
          <div style="text-align: right">
            <div class="label">Fecha de Emisión</div>
            <div class="value">${new Date().toLocaleDateString('es-MX')}</div>
            <div class="label" style="margin-top:10px">Vigencia</div>
            <div class="value" style="font-size: 11px uppercase">${cotz.diasCampana} Días de Campaña</div>
          </div>
        </div>

        <h3 class="font-black uppercase text-[10px] mb-3 tracking-widest text-gray-400">Distribución Semanal y Frecuencias</h3>
        
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
              <td class="footer-cell text-right" style="padding-right: 15px">Resumen de Unidades</td>
              <td class="footer-cell text-center">${totalUnidadesGeneral}</td>
              <td class="footer-cell"></td>
              ${totalPorSemana.map(total => `<td class="footer-cell text-center text-[9px]">${total}</td>`).join('')}
              <td class="footer-cell text-right font-black">${formatMXN(cotz.subtotalTV)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="summary-grid">
          <div>
            ${cotz.paqueteVIX ? `
              <div style="border: 1px solid #eee; border-radius: 8px; padding: 12px; margin-bottom: 15px; position: relative;">
                <div class="label" style="color: var(--tvsa-red)">Servicios Digitales Adicionales</div>
                <div class="flex justify-between items-start">
                  <div>
                    <div class="value" style="font-size: 12px">${cotz.paqueteVIX.nombre}</div>
                    <div style="font-size: 8px; color: #666; margin-top: 3px">
                      ${cotz.paqueteVIX.impresiones.toLocaleString()} Impresiones | ${cotz.paqueteVIX.dias} Días de Campaña
                    </div>
                  </div>
                  <div class="font-black text-[13px] text-gray-800">${formatMXN(cotz.costoVIX)}</div>
                </div>
              </div>
            ` : ''}
            <div style="font-size: 9px; color: #888; line-height: 1.4; background: #fafafa; padding: 10px; border-radius: 6px;">
              <strong>Términos y Condiciones:</strong><br>
              Esta propuesta comercial está sujeta a disponibilidad de espacios. Los importes expresados no incluyen el Impuesto al Valor Agregado (IVA). Las tarifas presentadas son netas y aplican según la vigencia especificada. Propuesta de carácter informativo no constituye una factura definitiva.
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs font-bold border-b pb-1">
              <span class="text-gray-400 uppercase text-[9px]">Subtotal Neto</span>
              <span>${formatMXN(cotz.subtotalGeneral)}</span>
            </div>
            <div class="flex justify-between items-center text-xs font-bold border-b pb-1">
              <span class="text-gray-400 uppercase text-[9px]">IVA (${((configuracion.iva_porcentaje || 0.16) * 100).toFixed(0)}%)</span>
              <span>${formatMXN(cotz.iva)}</span>
            </div>
            
            <div class="total-box mt-4">
              <div class="total-label">Inversión Final + IVA</div>
              <div class="total-value">${formatMXN(cotz.total)}</div>
            </div>
          </div>
        </div>

        <div class="signature-area">
          <div style="flex: 1;">
            <div style="height: 60px;"></div>
            <div class="signature-line">Por Televisa Univisión (MID)</div>
          </div>
          <div style="flex: 1;">
            <div style="height: 60px;"></div>
            <div class="signature-line">Conformidad del Cliente</div>
          </div>
        </div>

        <div style="position: absolute; bottom: 8mm; left: 0; right: 0; text-align: center; font-size: 8px; color: #bbb; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
          Televisa Mid - Proyección de Pauta Publicitaria 2025
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
