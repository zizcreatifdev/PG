const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client_email, client_nom, validation_link, post_preview } = await req.json();

    if (!client_email || !validation_link) {
      return new Response(JSON.stringify({ error: 'Paramètres manquants' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      // Log but don't fail — email is best-effort
      console.warn('RESEND_API_KEY non configurée, email non envoyé');
      return new Response(JSON.stringify({ success: true, warning: 'Email non envoyé (clé manquante)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const previewText = post_preview ? `<p style="color:#444;font-size:14px;line-height:1.6;background:#f5f5f5;border-left:3px solid #0077B6;padding:12px 16px;border-radius:4px;margin:16px 0;">${post_preview}…</p>` : '';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F3F2EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2EF;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#03045E;padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">PersonaGenius</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Personal Branding LinkedIn</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#03045E;">Bonjour ${client_nom} 👋</p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
            Votre équipe PersonaGenius a préparé un nouveau post LinkedIn pour vous.<br>
            Veuillez le consulter et nous faire part de votre validation.
          </p>
          ${previewText}
          <p style="margin:24px 0 8px;font-size:14px;color:#666;">Cliquez sur le bouton ci-dessous pour voir le post et donner votre réponse :</p>
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="${validation_link}" style="display:inline-block;background:#0077B6;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:8px;">
              Voir et valider mon post →
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:12px;color:#999;">Ce lien est valable 7 jours. Si vous avez des questions, répondez directement à cet email.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:11px;color:#aaa;text-align:center;">PersonaGenius · Personal Branding LinkedIn · Ce message vous a été envoyé car vous êtes client PersonaGenius.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Persona Genius <onboarding@resend.dev>',
        to: [client_email],
        subject: 'Votre post LinkedIn est prêt à valider',
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ success: false, error: 'Erreur envoi email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
