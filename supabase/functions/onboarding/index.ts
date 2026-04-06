import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);

  // GET: validate token
  if (req.method === 'GET') {
    const token = url.searchParams.get('token');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token manquant' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data, error } = await supabaseAdmin
      .from('onboarding_tokens')
      .select('id, token, client_id, expires_at, used')
      .eq('token', token)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ valid: false, reason: 'Token invalide' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (data.used) {
      return new Response(JSON.stringify({ valid: false, reason: 'Ce lien a déjà été utilisé' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (new Date(data.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, reason: 'Ce lien a expiré. Veuillez contacter votre gestionnaire Persona Genius pour obtenir un nouveau lien.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch existing client data for pre-fill
    let existingClient = null;
    if (data.client_id) {
      const { data: cd } = await supabaseAdmin
        .from('clients')
        .select('nom, email, telephone, whatsapp, linkedin_url, titre_professionnel, secteur_activite, biographie, piliers_contenu, ton_voix, style_ecriture, sujets_a_eviter, objectifs_linkedin')
        .eq('id', data.client_id)
        .single();
      existingClient = cd;
    }

    return new Response(JSON.stringify({ valid: true, client_id: data.client_id, client: existingClient }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // POST: submit onboarding
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { token, from_landing, nom, titre_professionnel, secteur_activite, email, telephone, whatsapp, linkedin_url, photo_url, objectifs_linkedin, piliers_contenu, ton_voix, style_ecriture, sujets_a_eviter, biographie, formule } = body;

      if (!nom || !email) {
        return new Response(JSON.stringify({ error: 'Champs requis manquants' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Landing page flow (no token required)
      if (from_landing) {
        const { data: newClient, error: insertErr } = await supabaseAdmin.from('clients').insert({
          nom,
          titre_professionnel: titre_professionnel || null,
          secteur_activite: secteur_activite || null,
          email: email || null,
          telephone: telephone || null,
          whatsapp: whatsapp || null,
          linkedin_url: linkedin_url || null,
          photo_url: photo_url || null,
          objectifs_linkedin: objectifs_linkedin || null,
          piliers_contenu: piliers_contenu || null,
          ton_voix: ton_voix || null,
          sujets_a_eviter: sujets_a_eviter || null,
          biographie: biographie || null,
          formule: formule || 'essentiel',
          statut: 'actif',
        }).select('id').single();

        if (insertErr || !newClient) {
          return new Response(JSON.stringify({ error: 'Erreur création client' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Notify admins
        const { data: adminRoles } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin');
        if (adminRoles && adminRoles.length > 0) {
          const notifications = adminRoles.map((r: any) => ({
            user_id: r.user_id,
            title: 'Nouvelle inscription landing page',
            message: `${nom} s'est inscrit via la landing page (formule: ${formule || 'essentiel'}).`,
          }));
          await supabaseAdmin.from('notifications').insert(notifications);
        }

        return new Response(JSON.stringify({ success: true, client_id: newClient.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Token-based onboarding flow
      if (!token) {
        return new Response(JSON.stringify({ error: 'Token manquant' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: tokenData, error: tokenErr } = await supabaseAdmin
        .from('onboarding_tokens')
        .select('id, client_id, expires_at, used')
        .eq('token', token)
        .single();

      if (tokenErr || !tokenData) {
        return new Response(JSON.stringify({ error: 'Token invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (tokenData.used) {
        return new Response(JSON.stringify({ error: 'Ce lien a déjà été utilisé' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Ce lien a expiré' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      let clientId = tokenData.client_id;

      if (clientId) {
        await supabaseAdmin.from('clients').update({
          nom, titre_professionnel: titre_professionnel || null, secteur_activite: secteur_activite || null,
          email: email || null, telephone: telephone || null, whatsapp: whatsapp || null,
          linkedin_url: linkedin_url || null, photo_url: photo_url || null,
          objectifs_linkedin: objectifs_linkedin || null, piliers_contenu: piliers_contenu || null,
          ton_voix: ton_voix || null, style_ecriture: style_ecriture || null,
          sujets_a_eviter: sujets_a_eviter || null, biographie: biographie || null,
        }).eq('id', clientId);
      } else {
        const { data: newClient, error: insertErr } = await supabaseAdmin.from('clients').insert({
          nom, titre_professionnel: titre_professionnel || null, secteur_activite: secteur_activite || null,
          email: email || null, telephone: telephone || null, whatsapp: whatsapp || null,
          linkedin_url: linkedin_url || null, photo_url: photo_url || null,
          objectifs_linkedin: objectifs_linkedin || null, piliers_contenu: piliers_contenu || null,
          ton_voix: ton_voix || null, sujets_a_eviter: sujets_a_eviter || null, biographie: biographie || null,
          statut: 'actif',
        }).select('id').single();

        if (insertErr || !newClient) {
          return new Response(JSON.stringify({ error: 'Erreur création client' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        clientId = newClient.id;
      }

      await supabaseAdmin.from('onboarding_tokens').update({ used: true }).eq('id', tokenData.id);

      const { data: adminRoles } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin');
      if (adminRoles && adminRoles.length > 0) {
        const notifications = adminRoles.map((r: any) => ({
          user_id: r.user_id,
          title: 'Nouveau prospect inscrit',
          message: `${nom} a complété son formulaire d'onboarding.`,
        }));
        await supabaseAdmin.from('notifications').insert(notifications);
      }

      return new Response(JSON.stringify({ success: true, client_id: clientId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
