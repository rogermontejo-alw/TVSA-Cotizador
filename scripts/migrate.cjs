const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lvzwbfeyoxpewxplujms.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2endiZmV5b3hwZXd4cGx1am1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg1NDE1MSwiZXhwIjoyMDgyNDMwMTUxfQ.ctlGGc2ffS-Y7gyZASShyNEydAdaYcgA-w5CNthUd2Q';

const SHEETS_URLS = {
    productos: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=0&single=true&output=csv',
    clientes: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=247261297&single=true&output=csv',
    condiciones: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=575442327&single=true&output=csv',
    vix: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=45434253&single=true&output=csv',
    config: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=1490714540&single=true&output=csv'
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function parseCSV(url) {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, i) => { obj[header] = values[i]; });
        return obj;
    }).filter(obj => Object.values(obj).some(v => v !== ''));
}

async function migrate() {
    console.log('🚀 Migración simplificada para evitar errores de esquema...');

    try {
        // 1. Clientes (Solo columnas básicas)
        console.log('--- Migrando Clientes ---');
        const rawClientes = await parseCSV(SHEETS_URLS.clientes);
        const uniqueClientesMap = new Map();
        rawClientes.forEach(c => {
            const nombre = c.nombre_cliente || c.nombre || c.cliente || 'Sin Nombre';
            if (!uniqueClientesMap.has(nombre) && nombre !== 'Sin Nombre') {
                uniqueClientesMap.set(nombre, {
                    codigo_sheet: c.cliente_id,
                    nombre_empresa: nombre,
                    nombre_contacto: c.contacto || '',
                    email: c.email || '',
                    telefono: c.telefono || '',
                    tipo: 'cliente',
                    estatus: 'activo'
                });
            }
        });

        const clientesPayload = Array.from(uniqueClientesMap.values()).map(({ codigo_sheet, ...rest }) => rest);
        const { error: errCl } = await supabase.from('clientes').upsert(clientesPayload, { onConflict: 'nombre_empresa' });
        if (errCl) console.error('Error Clientes:', errCl.message);

        const { data: dbClientes } = await supabase.from('clientes').select('id, nombre_empresa');
        const clientMap = new Map();
        dbClientes.forEach(c => clientMap.set(c.nombre_empresa, c.id));
        const clientIdMap = new Map();
        Array.from(uniqueClientesMap.values()).forEach(c => {
            const uuid = clientMap.get(c.nombre_empresa);
            if (uuid) clientIdMap.set(c.codigo_sheet, uuid);
        });

        // 2. Productos
        console.log('--- Migrando Productos ---');
        const rawProductos = await parseCSV(SHEETS_URLS.productos);
        const prodEntries = [];
        const uniqueProdMap = new Map();
        rawProductos.forEach(p => {
            const tipoFinal = `${p.tipo_producto}${p.duracion ? ' ' + p.duracion : ''}`;
            const key = `${p.canal}-${p.plaza}-${tipoFinal}-${p.horario}`;
            if (!uniqueProdMap.has(key)) {
                uniqueProdMap.set(key, true);
                prodEntries.push({
                    codigo_sheet: p.producto_id,
                    canal: p.canal || '',
                    plaza: p.plaza || '',
                    tipo: tipoFinal,
                    horario: p.horario || '',
                    costo_base: parseFloat(p.costo_base || 0),
                    activo: true
                });
            }
        });
        const productsToUpsert = prodEntries.map(({ codigo_sheet, ...rest }) => rest);
        await supabase.from('productos').upsert(productsToUpsert, { onConflict: 'canal,plaza,tipo,horario' });

        const { data: dbProds } = await supabase.from('productos').select('*');
        const combinedKeyToId = new Map();
        dbProds.forEach(p => {
            const key = `${p.canal}-${p.plaza}-${p.tipo}-${p.horario}`;
            combinedKeyToId.set(key, p.id);
        });
        const prodIdMap = new Map();
        prodEntries.forEach(entry => {
            const key = `${entry.canal}-${entry.plaza}-${entry.tipo}-${entry.horario}`;
            const uuid = combinedKeyToId.get(key);
            if (uuid) prodIdMap.set(entry.codigo_sheet, uuid);
        });

        // 3. Condiciones
        console.log('--- Migrando Condiciones ---');
        const rawCondiciones = await parseCSV(SHEETS_URLS.condiciones);
        const condicionesPayload = rawCondiciones.map(c => {
            const clienteId = clientIdMap.get(c.cliente_id);
            const productoId = prodIdMap.get(c.producto_id);
            if (clienteId && productoId) {
                return {
                    cliente_id: clienteId,
                    producto_id: productoId,
                    tipo_ajuste: c.tipo_ajuste,
                    factor_descuento: parseFloat(c.factor_descuento) || null,
                    costo_fijo: parseFloat(c.costo_fijo) || null
                };
            }
            return null;
        }).filter(Boolean);
        if (condicionesPayload.length > 0) {
            await supabase.from('condiciones_cliente').upsert(condicionesPayload, { onConflict: 'cliente_id,producto_id' });
        }

        console.log('🏁 Migración Finalizada (Core)');
    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

migrate();
