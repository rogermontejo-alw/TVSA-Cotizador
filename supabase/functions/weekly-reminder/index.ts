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

    // 1. Obtener todos los perfiles que tengan correo (o el del usuario principal)
    const { data: perfiles } = await supabaseClient
      .from('perfiles')
      .select('*');

    if (!perfiles || perfiles.length === 0) {
      return new Response(JSON.stringify({ message: "No profiles found" }), { status: 200 });
    }

    const results = [];

    for (const perfil of perfiles) {
      // Si el perfil no tiene email, intentamos usar el del usuario (esto depende de si clonaste email a perfiles)
      // En este caso, el usuario nos confirmó que IT bloquea el de Televisa, así que forzamos Hotmail para pruebas.
      let targetEmail = perfil.email || "roger_montejo@hotmail.com";
      if (targetEmail.includes("televisa")) {
        targetEmail = "roger_montejo@hotmail.com";
      }

      // 2. Obtener tareas de los próximos 7 días para ESTE usuario
      const d = new Date();
      const ahora = new Date(d.toLocaleString("en-US", { timeZone: "America/Merida" }));

      const inicioSemana = new Date(ahora);
      inicioSemana.setHours(0, 0, 0, 0);

      const finSemana = new Date(ahora);
      finSemana.setDate(ahora.getDate() + 7);
      finSemana.setHours(23, 59, 59, 999);

      // 3. Obtener Ventas Cerredas (Contratos de este mes)
      const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const ultimoDiaMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
      ultimoDiaMes.setHours(23, 59, 59, 999);

      // Consulta de contratos del mes
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

      const totalMensual = (contratosMes || []).reduce((acc, c) => acc + (Number(c.monto_ejecucion) || 0), 0);
      const countContratos = (contratosMes || []).length;

      // Agrupar clientes por monto para el correo
      const clientesAgrupados = (contratosMes || []).reduce((acc: Record<string, number>, c: any) => {
        const nombre = c.cotizaciones?.clientes?.nombre_empresa || 'Cliente S/N';
        acc[nombre] = (acc[nombre] || 0) + (Number(c.monto_ejecucion) || 0);
        return acc;
      }, {});

      const clientesListHtml = Object.entries(clientesAgrupados)
        .map(([nombre, monto]: [string, any]) => `<div style="font-size: 10px; color: #ff4d00; font-weight: 700; margin-bottom: 2px;">${nombre.toUpperCase()} ($${monto.toLocaleString('es-MX', { maximumFractionDigits: 0 })})</div>`)
        .join('');

      const { data: reminders } = await supabaseClient
        .from('interacciones_cliente')
        .select('id, comentario, fecha_recordatorio, tipo, cliente:clientes(nombre_empresa)')
        .eq('usuario_id', perfil.id)
        .gte('fecha_recordatorio', inicioSemana.toISOString())
        .lte('fecha_recordatorio', finSemana.toISOString())
        .order('fecha_recordatorio', { ascending: true });

      // No omitimos si no hay recordatorios, queremos enviar el resumen de ventas de todos modos
      // if (!reminders || reminders.length === 0) continue; 

      // 4. Formatear Agenda
      const hoyStr = ahora.toISOString().split('T')[0];
      const agendaHtml = (reminders || []).length > 0 ? reminders.map((r: Reminder) => {
        const f = new Date(r.fecha_recordatorio);
        const isHoy = r.fecha_recordatorio.startsWith(hoyStr);
        const dateLabel = isHoy ? "HOY" : f.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' });
        const timeLabel = f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

        return `
                <div style="padding: 15px; margin-bottom: 10px; background: ${isHoy ? '#fff5f0' : '#f9f9f9'}; border-radius: 12px; border-left: 4px solid ${isHoy ? '#ff4d00' : '#0c0c0c'};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                        <span style="font-size: 9px; font-weight: 900; color: ${isHoy ? '#ff4d00' : '#999'}; text-transform: uppercase; letter-spacing: 1px;">${dateLabel} • ${timeLabel}</span>
                        <span style="font-size: 8px; font-weight: 900; padding: 2px 6px; background: white; border-radius: 4px; border: 1px solid #eee; text-transform: uppercase;">${r.tipo}</span>
                    </div>
                    <p style="font-size: 11px; font-weight: 900; color: #0c0c0c; margin: 0; text-transform: uppercase;">${r.cliente?.nombre_empresa}</p>
                    <p style="font-size: 10px; color: #666; margin: 5px 0 0; line-height: 1.4;">${r.comentario}</p>
                </div>
                `;
      }).join('') : '<p style="font-size: 11px; color: #999; text-align: center; padding: 20px;">Sin compromisos agendados para esta semana.</p>';

      // 5. Frase Motivacional
      const frases = [
        "El cierre no es el final, es el inicio de una relación rentable.",
        "Tu persistencia es el diferencial entre una cotización y un contrato.",
        "En el mundo de los medios, la oportunidad tiene fecha de expiración."
      ];
      const frase = frases[ahora.getDay() % frases.length];

      const nombreMes = ahora.toLocaleDateString('es-MX', { month: 'long' }).toUpperCase();

      // 6. Construir Email Premium
      const emailHtml = `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 20px; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; shadow: 0 20px 50px rgba(0,0,0,0.1); border: 1px solid #eee;">
                    <div style="background-color: #0c0c0c; padding: 40px; color: white; text-align: center; position: relative;">
                        <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; color: #ff4d00; margin-bottom: 15px;">Intelligence Briefing</div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; font-style: italic;">NEXUS <span style="color: #ff4d00;">BRIEFING</span></h1>
                        <p style="color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px;">${ahora.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>

                    <div style="padding: 40px;">
                        <!-- SECCIÓN DE VENTAS -->
                        <div style="background: #0c0c0c; border-radius: 24px; padding: 30px; margin-bottom: 40px; text-align: center;">
                            <p style="font-size: 9px; font-weight: 900; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 3px; margin-bottom: 10px;">CIERRES DEL MES (${nombreMes})</p>
                            <h2 style="font-size: 42px; font-weight: 900; color: white; margin: 0; letter-spacing: -2px;">$${totalMensual.toLocaleString('es-MX')}</h2>
                            <p style="font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.5); margin-top: 5px;">${countContratos} CONTRATOS FORMALIZADOS</p>
                            
                            <div style="height: 3px; background: rgba(255,255,255,0.1); border-radius: 10px; margin: 20px 0; overflow: hidden;">
                                <div style="width: ${Math.min((totalMensual / 1500000) * 100, 100)}%; height: 100%; background: #ff4d00;"></div>
                            </div>
                            
                            <div style="margin-top: 15px;">
                                ${countContratos > 0 ? clientesListHtml : '<p style="font-size: 10px; color: #444;">Sin contratos registrados</p>'}
                            </div>
                        </div>

                        <div style="margin-bottom: 30px;">
                            <h2 style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #0c0c0c; border-bottom: 2px solid #ff4d00; padding-bottom: 8px; display: inline-block;">Hoja de Ruta de la Semana</h2>
                            <p style="font-size: 11px; color: #999; margin-top: 8px; font-weight: 500;">Tienes ${reminders?.length || 0} compromisos detectados en el Pipeline.</p>
                        </div>

                        ${agendaHtml}

                        <div style="margin-top: 40px; padding: 25px; background: #fff8f5; border-left: 4px solid #ff4d00; border-radius: 12px;">
                            <div style="font-size: 9px; font-weight: 900; color: #ff4d00; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Mindset Corporativo</div>
                            <p style="font-size: 13px; font-weight: 900; color: #0c0c0c; font-style: italic; margin: 0; line-height: 1.4;">"${frase}"</p>
                        </div>

                        <div style="margin-top: 40px; text-align: center;">
                            <a href="https://rogermontejo-alw.github.io/TVSA-Cotizador" style="display: inline-block; padding: 18px 36px; background-color: #0c0c0c; color: white; text-decoration: none; border-radius: 16px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Abrir Comando Nexus</a>
                        </div>
                    </div>

                    <div style="background-color: #f9f9f9; padding: 30px; text-align: center; color: #999; font-size: 10px; font-weight: 700; border-top: 1px solid #eee;">
                        TELEVISAUNIVISION MID • SISTEMA DE GESTIÓN ESTRATÉGICA<br/>
                        <span style="color: #ccc; font-weight: 400; font-size: 9px; margin-top: 5px; display: block;">Este reporte es confidencial y para uso exclusivo del ejecutivo asignado.</span>
                    </div>
                </div>
            </body>
            </html>
            `

      // 7. Enviar vía Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Nexus Intelligence <onboarding@resend.dev>",
          to: [targetEmail],
          subject: `📊 Nexus Briefing: Agenda de ${perfil.nombre_completo || 'Ejecutivo'}`,
          html: emailHtml,
        }),
      });


      if (res.ok) {
        results.push({ email: targetEmail, status: "sent" });
      } else {
        const err = await res.json();
        results.push({ email: targetEmail, status: "error", detail: err });
      }
    }

    return new Response(
      JSON.stringify({ message: "Process completed", stats: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
