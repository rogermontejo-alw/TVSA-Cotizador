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

serve(async (req) => {
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

    // 1. Obtener todos los perfiles
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

      const d = new Date();
      const ahora = new Date(d.toLocaleString("en-US", { timeZone: "America/Merida" }));
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
      const countContratos = (contratosMes || []).length;

      const clientesAgrupados = (contratosMes || []).reduce((acc: Record<string, number>, c: any) => {
        const nombre = c.cotizaciones?.clientes?.nombre_empresa || 'Cliente S/N';
        acc[nombre] = (acc[nombre] || 0) + (Number(c.monto_ejecucion) || 0);
        return acc;
      }, {});

      const clientesListHtml = Object.entries(clientesAgrupados)
        .map(([nombre, monto]) => `<div style="font-size: 10px; color: #ff4d00; font-weight: 700; margin-bottom: 2px;">${nombre.toUpperCase()} ($${Number(monto).toLocaleString('es-MX', { maximumFractionDigits: 0 })})</div>`)
        .join('');

      // --- B. AGENDA DE LA SEMANA (TAREAS) ---
      const inicioSemana = new Date(ahora);
      inicioSemana.setHours(0, 0, 0, 0);
      const finSemana = new Date(ahora);
      finSemana.setDate(ahora.getDate() + 7);
      finSemana.setHours(23, 59, 59, 999);

      const { data: reminders } = await supabaseClient
        .from('interacciones_cliente')
        .select('id, comentario, fecha_recordatorio, tipo, cliente:clientes(nombre_empresa)')
        .eq('usuario_id', perfil.id)
        .gte('fecha_recordatorio', inicioSemana.toISOString())
        .lte('fecha_recordatorio', finSemana.toISOString())
        .order('fecha_recordatorio', { ascending: true });

      const hoyStr = ahora.toISOString().split('T')[0];
      const agendaHtml = (reminders || []).length > 0 ? (reminders as Reminder[]).map((r) => {
        const f = new Date(r.fecha_recordatorio);
        const isHoy = r.fecha_recordatorio.startsWith(hoyStr);
        const dateLabel = isHoy ? "HOY" : f.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' });
        const timeLabel = f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

        return `
          <div style="padding: 15px; margin-bottom: 10px; background: ${isHoy ? '#fff5f0' : '#f9f9f9'}; border-radius: 12px; border-left: 4px solid ${isHoy ? '#ff4d00' : '#0c0c0c'};">
              <div style="font-size: 9px; font-weight: 900; color: ${isHoy ? '#ff4d00' : '#999'}; text-transform: uppercase;">${dateLabel} • ${timeLabel} | ${r.tipo}</div>
              <p style="font-size: 11px; font-weight: 900; color: #0c0c0c; margin: 5px 0 0; text-transform: uppercase;">${r.cliente?.nombre_empresa}</p>
              <p style="font-size: 10px; color: #666; margin: 3px 0 0;">${r.comentario}</p>
          </div>
        `;
      }).join('') : '<p style="font-size: 11px; color: #999; text-align: center; padding: 10px;">Sin compromisos para esta semana.</p>';

      // --- C. NEXUS SENTINEL (CLIENTES ABANDONADOS > 21 DÍAS) ---
      const { data: todosClientes } = await supabaseClient
        .from('clientes')
        .select('id, nombre_empresa, interacciones_cliente (created_at)')
        .eq('estatus', 'activo');

      const abandonados = (todosClientes || [])
        .map(c => {
          const ultima = (c.interacciones_cliente as any[])?.reduce((max, i) => {
            const date = new Date(i.created_at);
            return date > max ? date : max;
          }, new Date(0));
          const diasInactivo = Math.floor((ahora.getTime() - (ultima?.getTime() || 0)) / (1000 * 60 * 60 * 24));
          return { ...c, diasInactivo };
        })
        .filter(c => c.diasInactivo > 21)
        .sort((a, b) => b.diasInactivo - a.diasInactivo)
        .slice(0, 5);

      const abandonadosHtml = abandonados.length > 0 ? abandonados.map(c => `
        <div style="padding: 12px; margin-bottom: 8px; background: #fff1f1; border-radius: 10px; border-left: 3px solid #dc2626;">
          <div style="font-size: 10px; font-weight: 900; color: #dc2626; margin-bottom: 2px;">${c.nombre_empresa.toUpperCase()}</div>
          <div style="font-size: 9px; color: #991b1b; font-weight: 700;">${c.diasInactivo} DÍAS SIN GESTIÓN</div>
        </div>
      `).join('') : '<p style="font-size: 10px; color: #059669; font-weight: 700; text-align: center;">✓ Cartera activa y bajo control</p>';

      // --- D. CONSTRUCCIÓN HTML ---
      const frase = [
        "El cierre no es el final, es el inicio de una relación rentable.",
        "Tu persistencia es el diferencial entre una cotización y un contrato.",
        "En el mundo de los medios, la oportunidad tiene fecha de expiración."
      ][ahora.getDay() % 3];

      const emailHtml = `
      <!DOCTYPE html><html><body style="margin:0;padding:20px;background-color:#f4f4f4;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background-color:#fff;border-radius:24px;overflow:hidden;border:1px solid #eee;">
          <div style="background-color:#0c0c0c;padding:30px;color:white;text-align:center;">
            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#ff4d00;margin-bottom:10px;">Nexus Intelligence briefing</div>
            <h1 style="margin:0;font-size:24px;font-weight:900;text-transform:uppercase;font-style:italic;">BRIEFING <span style="color:#ff4d00;">OPERATIVO</span></h1>
            <p style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:10px;">${ahora.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <div style="padding:30px;">
            <!-- VENTAS -->
            <div style="background:#0c0c0c;border-radius:20px;padding:25px;margin-bottom:30px;text-align:center;">
              <p style="font-size:9px;font-weight:900;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:5px;">CIERRES ${nombreMes}</p>
              <h2 style="font-size:36px;font-weight:900;color:white;margin:0;">$${totalMensual.toLocaleString('es-MX')}</h2>
              <div style="height:3px;background:rgba(255,255,255,0.1);margin:15px 0;"><div style="width:${Math.min((totalMensual / 1500000) * 100, 100)}%;height:100%;background:#ff4d00;"></div></div>
              ${clientesListHtml}
            </div>
            <!-- SENTINEL -->
            <h3 style="font-size:11px;font-weight:900;text-transform:uppercase;color:#dc2626;border-bottom:2px solid #dc2626;padding-bottom:5px;margin-bottom:15px;">🚨 Nexus Sentinel: Cartera en Riesgo</h3>
            ${abandonadosHtml}
            <div style="margin-top:30px;"></div>
            <!-- AGENDA -->
            <h3 style="font-size:11px;font-weight:900;text-transform:uppercase;color:#0c0c0c;border-bottom:2px solid #ff4d00;padding-bottom:5px;margin-bottom:15px;">📅 Hoja de Ruta de la Semana</h3>
            ${agendaHtml}
            <!-- FRASE -->
            <div style="margin-top:30px;padding:20px;background:#fff8f5;border-left:4px solid #ff4d00;border-radius:10px;font-style:italic;font-size:12px;color:#0c0c0c;font-weight:900;">
              "${frase}"
            </div>
            <div style="margin-top:30px;text-align:center;"><a href="https://rogermontejo-alw.github.io/TVSA-Cotizador" style="display:inline-block;padding:15px 30px;background:#0c0c0c;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;">Ir al Sistema Nexus</a></div>
          </div>
        </div>
      </body></html>`;

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
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
