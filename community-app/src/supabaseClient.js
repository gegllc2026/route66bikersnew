// Browser-side Supabase client. Uses the anon/public key (safe to ship to
// the browser — it's the service_role key that must never appear here) and
// requires two Vite env vars set wherever this app is built:
//   VITE_SUPABASE_URL       - same project URL as the API's SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY  - Project Settings -> API -> anon public key
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
