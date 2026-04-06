import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find validated posts whose scheduled time has passed
    const now = new Date().toISOString();
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id")
      .eq("statut", "valide")
      .not("heure_publication", "is", null)
      .lte("heure_publication", now);

    if (error) throw error;

    if (posts && posts.length > 0) {
      const ids = posts.map((p: any) => p.id);
      const { error: updateError } = await supabase
        .from("posts")
        .update({ statut: "poste" })
        .in("id", ids);

      if (updateError) throw updateError;

      console.log(`Auto-posted ${ids.length} post(s)`);
    }

    return new Response(JSON.stringify({ updated: posts?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
