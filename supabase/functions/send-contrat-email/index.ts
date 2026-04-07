import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email, prenom, nom, formule_name, submission_id, app_url } = await req.json();
    if (!email || !submission_id) {
      return new Response(JSON.stringify({ error: 'email and submission_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contratUrl = `${app_url || 'https://pg-nu-virid.vercel.app'}/contrat/${submission_id}`;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — skipping email');
      return new Response(JSON.stringify({ success: true, warning: 'email not sent (no API key)', contratUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faff;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="display:flex">
      <div style="width:30%;height:6px;background:#8FC500"></div>
      <div style="width:70%;height:6px;background:#03045E"></div>
    </div>
    <div style="padding:40px 40px 32px">
      <div style="margin-bottom:28px">
        <span style="font-size:22px;font-weight:900;color:#03045E;letter-spacing:2px">PERSONA </span>
        <span style="font-size:22px;font-weight:900;color:#8FC500;letter-spacing:2px">GENIUS</span>
        <p style="font-size:11px;color:#8FC500;margin:4px 0 0;letter-spacing:1px">Personal Branding · LinkedIn</p>
      </div>
      <h2 style="color:#03045E;font-size:20px;margin:0 0 8px">Bonjour ${prenom || nom || 'cher(e) client(e)'} 👋</h2>
      <p style="color:#4A5578;font-size:14px;line-height:1.6;margin:0 0 20px">
        Votre demande d'accompagnement pour la formule <strong>${formule_name || 'Persona Genius'}</strong> a été examinée.<br>
        Votre contrat de prestation est prêt à être signé.
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${contratUrl}" style="display:inline-block;background:#8FC500;color:#03045E;font-weight:700;font-size:15px;padding:16px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.5px">
          Signer mon contrat →
        </a>
      </div>
      <p style="color:#9CA3AF;font-size:12px;text-align:center">
        Ou copiez ce lien : <a href="${contratUrl}" style="color:#0077B6">${contratUrl}</a>
      </p>
      <p style="color:#6B7280;font-size:13px;margin-top:24px">
        Le contrat doit être signé pour finaliser votre accompagnement.
        Une fois signé, vous recevrez vos identifiants de connexion.
      </p>
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
        subject: `Votre contrat Persona Genius est prêt — ${formule_name || ''}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) throw new Error(await res.text());

    return new Response(JSON.stringify({ success: true, contratUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
