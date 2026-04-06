import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create admin user
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@personagenius.sn",
    password: "Admin2026!",
    email_confirm: true,
    user_metadata: { nom: "Admin", prenom: "Persona Genius" },
  });

  if (userError && !userError.message.includes("already")) {
    return new Response(JSON.stringify({ error: userError.message }), { status: 400 });
  }

  if (userData?.user) {
    // Insert admin role
    await supabaseAdmin.from("user_roles").upsert({
      user_id: userData.user.id,
      role: "admin",
    }, { onConflict: "user_id,role" });
  }

  return new Response(JSON.stringify({ success: true, message: "Admin seeded" }), {
    headers: { "Content-Type": "application/json" },
  });
});
