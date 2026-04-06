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
      return new Response(JSON.stringify({ valid: false, reason: 'Lien invalide' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (tokenData.used) {
      return new Response(JSON.stringify({ valid: false, reason: 'Ce lien a déjà été utilisé' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, reason: 'Ce lien a expiré (7 jours)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      const { token, action, contenu, comment } = body;

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

      const clientName = (post?.clients as any)?.nom || 'Client';
      const postPreview = (post?.contenu || '').slice(0, 50);

      if (action === 'approve') {
        await supabaseAdmin.from('posts').update({ statut: 'approuve' }).eq('id', postId);
        // Mark token as used
        await supabaseAdmin.from('post_validation_tokens').update({ used: true }).eq('id', tokenData.id);
      } else if (action === 'modify' && contenu) {
        await supabaseAdmin.from('posts').update({ statut: 'modifie', contenu }).eq('id', postId);
        await supabaseAdmin.from('post_validation_tokens').update({ used: true }).eq('id', tokenData.id);
      } else if (action === 'comment' && comment) {
        // Don't mark as used for comments — allow further actions
      } else {
        return new Response(JSON.stringify({ error: 'Action invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Notify all admins
      const { data: adminRoles } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin');
      if (adminRoles) {
        const title = action === 'approve' ? 'Post approuvé par le client'
          : action === 'modify' ? 'Post modifié par le client'
          : 'Commentaire sur un post';
        const message = action === 'comment'
          ? `${clientName} a commenté : "${comment}" sur le post "${postPreview}..."`
          : `${clientName} a ${action === 'approve' ? 'approuvé' : 'modifié'} le post "${postPreview}..."`;

        const notifications = adminRoles.map((r: any) => ({
          user_id: r.user_id,
          title,
          message,
        }));
        await supabaseAdmin.from('notifications').insert(notifications);
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
