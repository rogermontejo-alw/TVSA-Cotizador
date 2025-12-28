/**
 * Utilidades de formato y procesamiento de datos
 */

/**
 * Formatea un número como moneda MXN
 * @param {number} value - El valor a formatear
 * @returns {string} - Valor formateado como $0,000.00
 */
export const formatMXN = (value, decimals = 2) => {
  if (value === undefined || value === null) return decimals > 0 ? '$0.00' : '$0';
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Parsea un string CSV a un array de objetos
 * @param {string} csv - El contenido del CSV
 * @returns {Array<Object>} - Array de objetos representando las filas
 */
export const parseCSV = (csv) => {
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
