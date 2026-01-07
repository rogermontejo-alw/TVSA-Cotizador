import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Reminder {
  id: string;
  comentario: string;
  fecha_recordatorio: string;
  tipo: string;
  cliente: { nombre_empresa: string };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY no configurada");

    const d = new Date();
    const ahora = new Date(d.toLocaleString("en-US", { timeZone: "America/Merida" }));
    const diaSemana = ahora.getDay(); // 0: Domingo, 6: Sábado

    // 1. Validar que sea Lunes a Viernes
    if (diaSemana === 0 || diaSemana === 6) {
      return new Response(JSON.stringify({ message: "Omitiendo envío: Fin de semana" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 2. Obtener todos los perfiles
    const { data: perfiles } = await supabaseClient
      .from('perfiles')
      .select('*');

    if (!perfiles || perfiles.length === 0) {
      return new Response(JSON.stringify({ message: "No profiles found" }), { status: 200 });
    }

    const results = [];

    for (const perfil of perfiles) {
      // Forzar Hotmail si es Televisa para evitar bloqueos de IT
      let targetEmail = perfil.email || "roger_montejo@hotmail.com";
      if (targetEmail.includes("televisa")) {
        targetEmail = "roger_montejo@hotmail.com";
      }

      const nombreMes = ahora.toLocaleDateString('es-MX', { month: 'long' }).toUpperCase();

      // --- A. VENTAS DEL MES (CONTRATOS) ---
      const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const ultimoDiaMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
      ultimoDiaMes.setHours(23, 59, 59, 999);

      const { data: contratosMes } = await supabaseClient
        .from('contratos_ejecucion')
        .select(`
          monto_ejecucion,
          fecha_inicio_pauta,
          cotizaciones (
            cliente_id,
            clientes (nombre_empresa)
          )
        `)
        .gte('fecha_inicio_pauta', primerDiaMes.toISOString().split('T')[0])
        .lte('fecha_inicio_pauta', ultimoDiaMes.toISOString().split('T')[0]);

      const totalMensual = (contratosMes || []).reduce((acc: number, c: any) => acc + (Number(c.monto_ejecucion) || 0), 0);
      const goal = 1500000;
      const percentGoal = Math.min((totalMensual / goal) * 100, 100);

      // --- TABLA DE CIERRES LIMPIA ---
      const clientesAgrupados = (contratosMes || []).reduce((acc: Record<string, number>, c: any) => {
        const nombre = c.cotizaciones?.clientes?.nombre_empresa || 'Cliente S/N';
        acc[nombre] = (acc[nombre] || 0) + (Number(c.monto_ejecucion) || 0);
        return acc;
      }, {});

      const clientesTableHtml = Object.entries(clientesAgrupados).length > 0 ? `
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 15px; border-collapse: collapse;">
          <thead>
            <tr>
              <th align="left" style="font-size: 9px; color: #64748b; text-transform: uppercase; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Socio Comercial</th>
              <th align="right" style="font-size: 9px; color: #64748b; text-transform: uppercase; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Inversión s/IVA</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(clientesAgrupados)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([nombre, monto]) => `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 700; color: #0f172a;">${nombre.toUpperCase()}</td>
                  <td align="right" style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 800; color: #ff4d00;">$${Number(monto).toLocaleString('es-MX')}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      ` : '<p style="text-align: center; color: #94a3b8; font-size: 11px; padding: 20px;">No se registran cierres en el periodo actual.</p>';

      // --- B. AGENDA DE LA SEMANA (TAREAS) ---
      const hoyInicio = new Date(ahora);
      hoyInicio.setHours(0, 0, 0, 0);
      const hoyFin = new Date(ahora);
      hoyFin.setHours(23, 59, 59, 999);

      const { data: remindersAll } = await supabaseClient
        .from('interacciones_cliente')
        .select('id, comentario, fecha_recordatorio, tipo, completado, cliente:clientes(nombre_empresa)')
        .eq('usuario_id', perfil.id)
        .eq('completado', false)
        .not('fecha_recordatorio', 'is', null)
        .in('tipo', ['Seguimiento', 'Llamada', 'Visita', 'WhatsApp', 'Correo', 'Sinergia'])
        .order('fecha_recordatorio', { ascending: true });

      const reminders = (remindersAll || []) as Reminder[];

      const agendaHoyHtml = reminders.length > 0 ? reminders.map(r => {
        const f = new Date(r.fecha_recordatorio);
        const isOverdue = f < ahora && (ahora.toDateString() !== f.toDateString());
        const dateStr = f.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
        const time = f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

        return `
          <div style="padding: 12px; background: #ffffff; border: 1px solid ${isOverdue ? '#fecdd3' : '#e2e8f0'}; border-radius: 12px; margin-bottom: 8px; ${isOverdue ? 'background: #fffbfa;' : ''}">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 8px; font-weight: 900; color: ${isOverdue ? '#be123c' : '#ff4d00'}; text-transform: uppercase;">
                ${isOverdue ? '⚠️ VENCIDO • ' : ''}${r.tipo} • ${dateStr} @ ${time}
              </span>
            </div>
            <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 2px;">${r.cliente?.nombre_empresa}</div>
            <div style="font-size: 10px; color: #64748b; font-style: italic;">"${r.comentario}"</div>
          </div>
        `;
      }).join('') : '<div style="text-align: center; padding: 15px; border: 1px dashed #e2e8f0; border-radius: 12px; color: #94a3b8; font-size: 10px; font-weight: 700;">Sin pendientes registrados</div>';

      // --- NEXUS SENTINEL (CORRECCIÓN 20455 DÍAS) ---
      const { data: todosClientes } = await supabaseClient
        .from('clientes')
        .select('id, nombre_empresa, interacciones_cliente (created_at)')
        .eq('estatus', 'activo');

      const abandonados = (todosClientes || [])
        .map((c: any) => {
          const interacciones = (c.interacciones_cliente as { created_at: string }[]) || [];
          const fechaCreacion = new Date(c.created_at || ahora);
          const edadCuentaDias = Math.floor((ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));

          if (interacciones.length === 0) {
            if (edadCuentaDias < 7) return { ...c, label: 'NUEVA CUENTA • ACTIVA', priority: 0 };
            return { ...c, label: 'SIN GESTIÓN REGISTRADA', priority: 1 };
          }

          const ultima = interacciones.reduce((max: Date, i: any) => {
            const date = new Date(i.created_at);
            return date > max ? date : max;
          }, new Date(0));

          const diasInactivo = Math.floor((ahora.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24));

          // Nueva lógica de prioridades
          let priority = 0;
          let label = '';

          if (edadCuentaDias < 7 && diasInactivo > edadCuentaDias) {
            label = 'NUEVA CUENTA • ACTIVA';
            priority = 0;
          } else if (diasInactivo > 21) {
            label = `${diasInactivo} DÍAS: ABANDONO`;
            priority = 3;
          } else if (diasInactivo > 15) {
            label = `${diasInactivo} DÍAS: RIESGO`;
            priority = 2;
          } else if (diasInactivo > 7) {
            label = `${diasInactivo} DÍAS: SEGUIMIENTO`;
            priority = 1;
          } else {
            label = 'ACTIVO';
            priority = 0;
          }

          return { ...c, diasInactivo, label, priority };
        })
        .filter((c: any) => c.priority >= 2) // Solo mostrar Riesgo y Abandono en el email
        .sort((a: any, b: any) => b.priority - a.priority || (b.diasInactivo || 0) - (a.diasInactivo || 0))
        .slice(0, 4);

      const abandonadosHtml = abandonados.length > 0 ? abandonados.map(c => `
        <div style="padding: 10px; background: ${c.priority === 3 ? '#fff1f2' : '#f8fafc'}; border: 1px solid ${c.priority === 3 ? '#fecdd3' : '#e2e8f0'}; border-radius: 10px; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; font-weight: 800; color: ${c.priority === 3 ? '#be123c' : '#334155'}; text-transform: uppercase;">${c.nombre_empresa}</span>
            <span style="font-size: 8px; font-weight: 900; color: ${c.priority === 3 ? '#be123c' : '#64748b'};">${c.label}</span>
          </div>
        </div>
      `).join('') : '<p style="text-align: center; color: #10b981; font-size: 9px; font-weight: 900; padding: 10px;">CARTERA BAJO CONTROL TOTAL ✓</p>';

      // --- D. CONSTRUCCIÓN HTML PREMIUM ---
      const frase = [
        "El éxito comercial no es un acto, es un hábito de seguimiento implacable.",
        "Tu valor no reside en lo que vendes, sino en el problema que resuelves.",
        "El ‘No’ es solo el inicio de la negociación profesional.",
        "La disciplina de tu CRM determina la libertad de tus resultados.",
        "No busques ventas, busca relaciones que generen pautas recurrentes."
      ][ahora.getDay() % 5];

      const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:10px; background-color:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                
                <!-- HEADER CLARO -->
                <tr>
                  <td style="padding: 40px; background: #ffffff; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 12px;">Nexus Intelligence Suite</div>
                    <h1 style="margin:0; font-size: 28px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px;">
                      BRIEFING <span style="color: #ff4d00;">OPERATIVO</span>
                    </h1>
                    <div style="margin-top: 8px; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">
                      ${ahora.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  </td>
                </tr>

                <!-- CUERPO -->
                <tr>
                  <td style="padding: 30px;">
                    
                    <!-- RESUMEN FINANCIERO -->
                    <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                      <div style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Inversión Acumulada (${nombreMes})</div>
                      <div style="font-size: 42px; font-weight: 900; color: #0f172a; margin-bottom: 15px;">$${totalMensual.toLocaleString('es-MX')}</div>
                      
                      <div style="height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden;">
                        <div style="width: ${percentGoal}%; height: 100%; background: #ff4d00;"></div>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">
                        <span>Avance Meta</span>
                        <span>${percentGoal.toFixed(1)}%</span>
                      </div>

                      ${clientesTableHtml}
                    </div>

                    <!-- ACCIONES DEL DÍA -->
                    <div style="margin-bottom: 25px;">
                      <h3 style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #ff4d00; padding-bottom: 5px; margin-bottom: 15px;">
                        📌 PENDIENTES Y VENCIDOS
                      </h3>
                      ${agendaHoyHtml}
                    </div>

                    <!-- NEXUS SENTINEL -->
                    <div style="margin-bottom: 25px;">
                      <h3 style="font-size: 11px; font-weight: 900; color: #be123c; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #be123c; padding-bottom: 5px; margin-bottom: 15px;">
                        🚨 NEXUS SENTINEL: RE-CONTACTO
                      </h3>
                      ${abandonadosHtml}
                    </div>

                    <!-- FOOTER CTA -->
                    <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #f1f5f9;">
                      <a href="https://tvsa-cotizador.vercel.app/" style="display: inline-block; padding: 16px 35px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
                        Gestionar Mi Cartera
                      </a>
                    </div>

                  </td>
                </tr>

                <!-- COPY -->
                <tr>
                  <td style="padding: 20px; background: #f8fafc; text-align: center; font-size: 8px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                    Televisa Univision MID • Ecosistema Nexus © 2026
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`;

      // 7. ENVIAR
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Nexus Intelligence <onboarding@resend.dev>",
          to: [targetEmail],
          subject: `📊 Nexus Briefing: ${perfil.nombre_completo || 'Ejecutivo'}`,
          html: emailHtml,
        }),
      });

      results.push({ email: targetEmail, status: res.ok ? "sent" : "error" });
    }

    return new Response(JSON.stringify({ message: "Completed", stats: results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
