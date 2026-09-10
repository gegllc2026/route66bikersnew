// /api/streams
//
// Tracks who is *currently* broadcasting, backed by a Supabase (Postgres)
// table so the "Live now" list is real instead of sample data.
//
// GET is public (anyone browsing can see who's live). POST (start/heartbeat)
// and DELETE (end) require a signed-in caller via:
//   Authorization: Bearer <access_token>
// POST additionally requires the caller's profile role to be "biker" — this,
// together with the same check in api/agora-token.js, is what actually
// enforces "only bikers can go live" (server-side, not just a hidden button).
// Both POST and DELETE also confirm the caller owns the channel (host_id
// matches their account), so one rider can't end or hijack another's stream.
//
// A host's row is considered stale after TTL_SECONDS with no heartbeat, so a
// stream disappears from the list soon after someone closes the tab without
// cleanly ending their stream. There's no native TTL in Postgres, so GET
// deletes anything past that age before returning the list.
//
//   GET    /api/streams              -> { streams: [{ channel, title, hostName, startedAt }] }
//   POST   /api/streams   (start/heartbeat, body: { channel, title, hostName })
//   DELETE /api/streams   (end,             body: { channel })
import { createClient } from "@supabase/supabase-js";
import { getAuthedProfile } from "./_lib/authHelpers.js";

const TTL_SECONDS = 25;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  const supabase = getSupabase();
  if (!supabase) {
    res.status(500).json({
      error:
        "Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in this project's Vercel environment variables, then redeploy.",
    });
    return;
  }

  if (req.method === "GET") {
    const cutoffIso = new Date(Date.now() - TTL_SECONDS * 1000).toISOString();

    // Sweep stale rows first so the list only ever reflects active streams.
    await supabase.from("live_streams").delete().lt("updated_at", cutoffIso);

    const { data, error } = await supabase
      .from("live_streams")
      .select("channel, title, host_name, started_at")
      .order("started_at", { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const streams = (data || []).map((row) => ({
      channel: row.channel,
      title: row.title,
      hostName: row.host_name,
      startedAt: new Date(row.started_at).getTime(),
    }));

    res.status(200).json({ streams });
    return;
  }

  if (req.method === "POST") {
    const { channel, title, hostName } = req.body || {};
    if (!channel) {
      res.status(400).json({ error: "channel is required" });
      return;
    }

    const profile = await getAuthedProfile(req);
    if (!profile) {
      res.status(401).json({ error: "Sign in required." });
      return;
    }
    if (profile.role !== "biker") {
      res.status(403).json({ error: "Only biker accounts can go live." });
      return;
    }

    // If the channel is already live under someone else's account, don't
    // let this request steal or overwrite it.
    const { data: existing } = await supabase
      .from("live_streams")
      .select("host_id")
      .eq("channel", channel)
      .maybeSingle();
    if (existing && existing.host_id && existing.host_id !== profile.id) {
      res.status(403).json({ error: "That channel is already live under another account." });
      return;
    }

    const nowIso = new Date().toISOString();

    // Upsert: on the very first heartbeat this sets started_at; on later
    // heartbeats for the same channel, started_at is left alone (see the
    // schema's trigger) and only updated_at (freshness) moves forward.
    const { error } = await supabase.from("live_streams").upsert(
      {
        channel,
        title: title || "Live now",
        host_name: hostName || channel,
        host_id: profile.id,
        started_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "channel" }
    );

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "DELETE") {
    const { channel } = req.body || {};
    if (!channel) {
      res.status(400).json({ error: "channel is required" });
      return;
    }

    const profile = await getAuthedProfile(req);
    if (!profile) {
      res.status(401).json({ error: "Sign in required." });
      return;
    }

    const { data: existing } = await supabase
      .from("live_streams")
      .select("host_id")
      .eq("channel", channel)
      .maybeSingle();
    if (existing && existing.host_id && existing.host_id !== profile.id) {
      res.status(403).json({ error: "You can only end your own stream." });
      return;
    }

    const { error } = await supabase.from("live_streams").delete().eq("channel", channel);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
