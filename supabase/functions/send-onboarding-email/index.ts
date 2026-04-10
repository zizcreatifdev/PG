const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { client_email, client_nom, onboarding_link, is_correction } = await req.json();

    if (!client_email || !onboarding_link) {
      return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY manquante');
      return new Response(JSON.stringify({ success: true, warning: 'Email non envoyé (clé manquante)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const subject = is_correction
      ? `Mise à jour de votre fiche — Persona Genius`
      : `Complétez votre fiche Persona Genius`;

    const intro = is_correction
      ? `Votre équipe Persona Genius souhaite mettre à jour votre fiche. Merci de compléter à nouveau le formulaire en cliquant sur le bouton ci-dessous.`
      : `Bienvenue ! Nous sommes ravis de vous accompagner dans votre personal branding LinkedIn. Pour démarrer, merci de remplir votre fiche client.`;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F3F2EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2EF;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#03045E;padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Persona Genius</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Personal Branding LinkedIn</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#03045E;">Bonjour ${client_nom} 👋</p>
          <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">${intro}</p>
          ${is_correction ? `<div style="background:#FAEEDA;border-left:3px solid #D97706;padding:12px 16px;border-radius:4px;margin-bottom:20px;"><p style="margin:0;font-size:13px;color:#D97706;font-weight:600;">Demande de correction</p><p style="margin:4px 0 0;font-size:13px;color:#7A5228;">Vos informations seront mises à jour avec les nouvelles données que vous fournirez.</p></div>` : ''}
          <p style="margin:0 0 16px;font-size:14px;color:#666;">Ce lien est valable 7 jours :</p>
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="${onboarding_link}" style="display:inline-block;background:#8FC500;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:8px;">
              ${is_correction ? 'Mettre à jour ma fiche →' : 'Remplir ma fiche →'}
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:12px;color:#999;">Si vous avez des questions, répondez directement à cet email.</p>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:11px;color:#aaa;text-align:center;">Persona Genius · Personal Branding LinkedIn · Ce message vous a été envoyé car vous avez été invité à rejoindre Persona Genius.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Persona Genius <onboarding@resend.dev>',
        to: [client_email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ success: false, error: 'Erreur envoi email' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
