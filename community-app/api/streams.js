// /api/streams
//
// Tracks who is *currently* broadcasting, backed by a Redis database so the
// "Live now" list is real instead of sample data. Requires a Redis database
// connected to this Vercel project (Storage tab -> Marketplace Database
// Providers -> Redis -> Create -> Connect Project). That injects the env vars
// this file reads below.
//
// A host's entry expires automatically after TTL_SECONDS unless the client
// sends a heartbeat, so a stream disappears from the list soon after someone
// closes the tab without cleanly ending their stream.
//
//   GET    /api/streams              -> { streams: [{ channel, title, hostName, startedAt }] }
//   POST   /api/streams   (start/heartbeat, body: { channel, title, hostName })
//   DELETE /api/streams   (end,             body: { channel })
import { Redis } from "@upstash/redis";

const TTL_SECONDS = 25;

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  const redis = getRedis();
  if (!redis) {
    res.status(500).json({
      error:
        "No Redis database is connected to this project yet. Connect one from the Vercel Storage tab, then redeploy.",
    });
    return;
  }

  if (req.method === "GET") {
    const channels = (await redis.smembers("live:index")) || [];
    const entries = await Promise.all(channels.map((ch) => redis.get(`live:${ch}`)));

    const streams = [];
    const stale = [];
    channels.forEach((ch, i) => {
      if (entries[i]) streams.push({ channel: ch, ...entries[i] });
      else stale.push(ch);
    });
    if (stale.length) await redis.srem("live:index", ...stale);

    res.status(200).json({ streams });
    return;
  }

  if (req.method === "POST") {
    const { channel, title, hostName } = req.body || {};
    if (!channel) {
      res.status(400).json({ error: "channel is required" });
      return;
    }
    await redis.set(
      `live:${channel}`,
      { title: title || "Live now", hostName: hostName || channel, startedAt: Date.now() },
      { ex: TTL_SECONDS }
    );
    await redis.sadd("live:index", channel);
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "DELETE") {
    const { channel } = req.body || {};
    if (!channel) {
      res.status(400).json({ error: "channel is required" });
      return;
    }
    await redis.del(`live:${channel}`);
    await redis.srem("live:index", channel);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
