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

  // GET: validate token and return post data
  if (req.method === 'GET') {
    const token = url.searchParams.get('token');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token manquant' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: tokenData, error: tokenErr } = await supabaseAdmin
      .from('post_validation_tokens')
      .select('id, post_id, used, expires_at')
      .eq('token', token)
      .single();

    if (tokenErr || !tokenData) {
      return new Response(JSON.stringify({ valid: false, reason: 'Lien invalide ou expiré' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (tokenData.used) {
      return new Response(JSON.stringify({ valid: false, reason: 'Ce lien a déjà été utilisé' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, reason: 'Ce lien a expiré' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch post + client info
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('id, contenu, date_planifiee, statut, format, media_url, sondage_question, sondage_options, client_id, clients(nom, photo_url, titre_professionnel)')
      .eq('id', tokenData.post_id)
      .single();

    if (!post) {
      return new Response(JSON.stringify({ valid: false, reason: 'Post introuvable' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ valid: true, post, token_id: tokenData.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // POST: perform action on post
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { token, action, commentaire } = body;

      if (!token || !action) {
        return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Validate token
      const { data: tokenData, error: tokenErr } = await supabaseAdmin
        .from('post_validation_tokens')
        .select('id, post_id, used, expires_at')
        .eq('token', token)
        .single();

      if (tokenErr || !tokenData || tokenData.used || new Date(tokenData.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Lien invalide ou expiré' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const postId = tokenData.post_id;

      // Get post for notification context
      const { data: post } = await supabaseAdmin
        .from('posts')
        .select('contenu, client_id, clients(nom)')
        .eq('id', postId)
        .single();

      const clientName = (post?.clients as any)?.nom || 'Le client';
      const postPreview = (post?.contenu || '').slice(0, 60);

      let notifTitle = '';
      let notifMessage = '';

      if (action === 'validate') {
        // ✅ Valider → statut = valide
        await supabaseAdmin
          .from('posts')
          .update({ statut: 'valide', date_validation: new Date().toISOString() } as any)
          .eq('id', postId);
        await supabaseAdmin.from('post_validation_tokens').update({ used: true }).eq('id', tokenData.id);
        notifTitle = `✅ ${clientName} a validé un post`;
        notifMessage = `"${postPreview}…" a été validé et peut être publié.`;
      } else if (action === 'request_modification') {
        // ✏️ Demander modification → statut = modifie + commentaire_client
        if (!commentaire || !commentaire.trim()) {
          return new Response(JSON.stringify({ error: 'Commentaire requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        await supabaseAdmin
          .from('posts')
          .update({ statut: 'modifie', commentaire_client: commentaire.trim() } as any)
          .eq('id', postId);
        await supabaseAdmin.from('post_validation_tokens').update({ used: true }).eq('id', tokenData.id);
        notifTitle = `✏️ ${clientName} demande une modification`;
        notifMessage = `Demande : "${commentaire.trim().slice(0, 80)}…"`;
      } else if (action === 'refuse') {
        // ❌ Refuser → statut = brouillon
        await supabaseAdmin.from('posts').update({ statut: 'brouillon' }).eq('id', postId);
        await supabaseAdmin.from('post_validation_tokens').update({ used: true }).eq('id', tokenData.id);
        notifTitle = `❌ ${clientName} a refusé un post`;
        notifMessage = `Le post "${postPreview}…" a été refusé et repassé en brouillon.`;
      } else {
        return new Response(JSON.stringify({ error: 'Action invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Notify all admins + staff
      const { data: adminStaffRoles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'staff']);

      if (adminStaffRoles && notifTitle) {
        const notifications = adminStaffRoles.map((r: any) => ({
          user_id: r.user_id,
          title: notifTitle,
          message: notifMessage,
        }));
        await supabaseAdmin.from('notifications').insert(notifications);
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
