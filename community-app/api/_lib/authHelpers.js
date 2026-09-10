// Shared by api/agora-token.js and api/streams.js. Not a route itself —
// the leading underscore on this folder keeps Vercel from building it as
// one, and it has no default export, so it's just an importable module.
//
// Verifies the bearer token the front end sends (the caller's Supabase
// session access token) and looks up their role from `profiles`. This is
// what actually enforces "only bikers can go live" — the UI hiding the
// button is just a courtesy; a request straight to the API is checked here.
import { createClient } from "@supabase/supabase-js";

let cachedAdmin = null;

function getAdminClient() {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cachedAdmin = createClient(url, key, { auth: { persistSession: false } });
  return cachedAdmin;
}

// Returns { id, role } for a valid, signed-in caller, or null if the
// request has no valid session (missing/expired/garbage token, or the
// Supabase admin client isn't configured).
export async function getAuthedProfile(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const admin = getAdminClient();
  if (!admin) return null;

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (profileError || !profile) return null;

  return { id: userData.user.id, role: profile.role };
}
