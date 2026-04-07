import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email, nom, message } = await req.json();
    if (!email || !message) {
      return new Response(JSON.stringify({ error: 'email and message required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — skipping email send');
      return new Response(JSON.stringify({ success: true, warning: 'email not sent (no API key)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faff;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#03045E;padding:0 0 0 0;display:flex">
      <div style="width:30%;height:6px;background:#8FC500"></div>
      <div style="width:70%;height:6px;background:#03045E"></div>
    </div>
    <div style="padding:40px 40px 32px">
      <div style="margin-bottom:24px">
        <span style="font-size:22px;font-weight:900;color:#03045E;letter-spacing:2px">PERSONA </span>
        <span style="font-size:22px;font-weight:900;color:#8FC500;letter-spacing:2px">GENIUS</span>
        <p style="font-size:11px;color:#8FC500;margin:4px 0 0;letter-spacing:1px">Personal Branding · LinkedIn</p>
      </div>
      <h2 style="color:#03045E;font-size:18px;margin:0 0 20px">Rappel de paiement</h2>
      <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="color:#DC2626;font-size:13px;margin:0 0 8px;font-weight:600">⚠️ Paiement en retard</p>
        <p style="color:#333;font-size:14px;margin:0;white-space:pre-line">${message}</p>
      </div>
      <p style="color:#6B7280;font-size:13px">Pour toute question, répondez à cet email ou contactez-nous sur WhatsApp.</p>
    </div>
    <div style="background:#03045E;padding:16px 40px;display:flex;justify-content:space-between;align-items:center">
      <span style="color:white;font-weight:700;font-size:13px">Persona Genius</span>
      <span style="color:#8FC500;font-size:12px">hello@personagenius.com</span>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Persona Genius <noreply@personagenius.com>',
        to: [email],
        subject: `Rappel de paiement — Persona Genius`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
