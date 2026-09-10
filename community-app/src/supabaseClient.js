// Browser-side Supabase client. Uses the anon/public key (safe to ship to
// the browser — it's the service_role key that must never appear here) and
// requires two Vite env vars set wherever this app is built:
//   VITE_SUPABASE_URL       - same project URL as the API's SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY  - Project Settings -> API -> anon public key
//
// IMPORTANT: these must be prefixed VITE_ specifically. Vercel's Supabase
// integration auto-creates SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL etc, but
// Vite only exposes VITE_-prefixed vars to the browser bundle — anything
// else is invisible to import.meta.env here, even if it shows up in the
// Vercel dashboard. You need to add VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY yourself (copy the values from the integration's
// SUPABASE_URL / SUPABASE_ANON_KEY), then redeploy.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

// A missing/blank URL used to throw here and take down the entire app
// before React could render anything (a blank screen with no clue why).
// Falling back to a placeholder keeps the client constructable; App.jsx
// checks supabaseConfigured and shows a real error screen instead.
export const supabase = createClient(
  url || "https://placeholder.invalid",
  anonKey || "placeholder"
);
