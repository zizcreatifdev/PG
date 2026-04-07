import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { submission_id } = await req.json();
    if (!submission_id) {
      return new Response(JSON.stringify({ error: 'submission_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Load submission
    const { data: sub, error: subErr } = await supabaseAdmin
      .from('prospect_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (subErr || !sub) {
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (sub.status === 'converti') {
      return new Response(JSON.stringify({ error: 'Already converted' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate temporary password
    const tempPassword = generatePassword();

    // Create Supabase Auth user
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: sub.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        prenom: sub.prenom,
        nom: sub.nom,
      },
    });

    if (authErr) {
      // User might already exist
      if (!authErr.message.includes('already registered')) {
        return new Response(JSON.stringify({ error: authErr.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const userId = authData?.user?.id;

    // Create client record
    const { data: client, error: clientErr } = await supabaseAdmin.from('clients').insert({
      nom: `${sub.prenom} ${sub.nom}`.trim(),
      email: sub.email,
      titre_professionnel: sub.profession || null,
      linkedin_url: sub.linkedin_url || null,
      whatsapp: sub.whatsapp || null,
      telephone: sub.whatsapp || null,
      formule: sub.formule_name?.toLowerCase().split(' ')[0] || 'essentiel',
      statut: 'actif',
      user_id: userId || null,
    }).select('id').single();

    if (clientErr) {
      return new Response(JSON.stringify({ error: clientErr.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Assign client role
    if (userId) {
      await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: 'client' });
    }

    // Update submission
    await supabaseAdmin.from('prospect_submissions')
      .update({ status: 'converti', client_id: client.id })
      .eq('id', submission_id);

    // Send welcome email if RESEND_API_KEY is set
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY && sub.email) {
      const appUrl = Deno.env.get('APP_URL') || 'https://pg-nu-virid.vercel.app';
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
    <div style="padding:40px">
      <div style="margin-bottom:28px">
        <span style="font-size:22px;font-weight:900;color:#03045E;letter-spacing:2px">PERSONA </span>
        <span style="font-size:22px;font-weight:900;color:#8FC500;letter-spacing:2px">GENIUS</span>
      </div>
      <h2 style="color:#03045E;font-size:20px;margin:0 0 16px">Bienvenue ${sub.prenom} ! 🎉</h2>
      <p style="color:#4A5578;font-size:14px;line-height:1.6;margin:0 0 24px">
        Votre espace client Persona Genius est prêt. Voici vos identifiants de connexion :
      </p>
      <div style="background:#EEF1F8;border-radius:8px;padding:20px;margin:0 0 24px">
        <p style="margin:0 0 8px;font-size:13px;color:#6B7280">Email</p>
        <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#03045E">${sub.email}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6B7280">Mot de passe temporaire</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#03045E;font-family:monospace;letter-spacing:2px">${tempPassword}</p>
      </div>
      <p style="color:#DC2626;font-size:13px;margin:0 0 24px">⚠️ Pensez à changer votre mot de passe après votre première connexion.</p>
      <div style="text-align:center">
        <a href="${appUrl}/login" style="display:inline-block;background:#8FC500;color:#03045E;font-weight:700;font-size:15px;padding:16px 36px;border-radius:12px;text-decoration:none">
          Accéder à mon espace →
        </a>
      </div>
    </div>
    <div style="background:#03045E;padding:16px 40px">
      <span style="color:white;font-weight:700;font-size:13px">Persona Genius</span>
    </div>
  </div>
</body>
</html>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Persona Genius <noreply@personagenius.com>',
          to: [sub.email],
          subject: `Bienvenue chez Persona Genius — Vos identifiants`,
          html: htmlBody,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, client_id: client.id, temp_password: tempPassword }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
