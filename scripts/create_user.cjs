const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lvzwbfeyoxpewxplujms.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2endiZmV5b3hwZXd4cGx1am1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg1NDE1MSwiZXhwIjoyMDgyNDMwMTUxfQ.ctlGGc2ffS-Y7gyZASShyNEydAdaYcgA-w5CNthUd2Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createUser() {
    const email = 'admin@televisa.com';
    const password = 'Televisa2025!'; // Puedes cambiarla después

    console.log(`👤 Creando usuario: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ El usuario ya existe.');
        } else {
            console.error('❌ Error al crear usuario:', error);
        }
    } else {
        console.log('✅ Usuario creado con éxito.');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
    }
}

createUser();
