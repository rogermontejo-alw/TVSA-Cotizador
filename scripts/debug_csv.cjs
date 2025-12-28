const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lvzwbfeyoxpewxplujms.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2endiZmV5b3hwZXd4cGx1am1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg1NDE1MSwiZXhwIjoyMDgyNDMwMTUxfQ.ctlGGc2ffS-Y7gyZASShyNEydAdaYcgA-w5CNthUd2Q';

const SHEETS_URLS = {
    clientes: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTvlCjD5HIr3h9k_F04VM_lGwC1L1zQElQWA3KMLQHbVmWxbekdUnN9_HdWbmutJZByC6sFby9UBY2/pub?gid=247261297&single=true&output=csv',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function parseCSV(url) {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('Headers detectados:', headers);
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, i) => { obj[header] = values[i]; });
        return obj;
    }).filter(obj => Object.values(obj).some(v => v !== ''));
}

async function debug() {
    const raw = await parseCSV(SHEETS_URLS.clientes);
    console.log('Primer cliente raw:', raw[0]);
}

debug();
