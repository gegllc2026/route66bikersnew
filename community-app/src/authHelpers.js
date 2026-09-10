import { supabase } from "./supabaseClient";

// Loads a signed-in user's app-facing profile (name, handle, role) out of
// the `profiles` table, which the Supabase trigger populates at signup.
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, handle, role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return { id: userId, name: data.name, handle: data.handle, role: data.role };
}

// The Authorization header the API routes require on writes (starting a
// stream, ending one, requesting a host token). Returns {} if there's no
// active session, which the API treats as "sign in required".
export async function authHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}
