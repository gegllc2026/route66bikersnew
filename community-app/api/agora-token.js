// /api/agora-token
//
// Generates a short-lived Agora RTC token so the browser never needs to know
// your App Certificate. Requires two environment variables on the Vercel
// project (Settings -> Environment Variables):
//   AGORA_APP_ID           - same App ID already used on the front end
//   AGORA_APP_CERTIFICATE  - from Agora Console -> your project -> Certificate
//
// Every request must include the caller's Supabase session token:
//   Authorization: Bearer <access_token>
// Host tokens (role=host, i.e. going live) are only issued to accounts whose
// profile role is "biker" — this is the actual enforcement point for
// "only bikers can go live"; the UI hiding the button is just a courtesy.
// Audience tokens (role=audience) are issued to any signed-in account.
//
// Request:  GET /api/agora-token?channel=<name>&uid=<number>&role=host|audience
// Response: { token, appId, channel, uid }
import { RtcTokenBuilder, RtcRole } from "agora-token";
import { getAuthedProfile } from "./_lib/authHelpers.js";

const TOKEN_LIFETIME_SECONDS = 3600; // 1 hour

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { channel, uid, role } = req.query;

  if (!channel) {
    res.status(400).json({ error: "channel is required" });
    return;
  }

  const profile = await getAuthedProfile(req);
  if (!profile) {
    res.status(401).json({ error: "Sign in required." });
    return;
  }

  const wantsHost = role !== "audience";
  if (wantsHost && profile.role !== "biker") {
    res.status(403).json({ error: "Only biker accounts can go live." });
    return;
  }

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    res.status(500).json({
      error:
        "Agora credentials are not configured on the server. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in this project's Vercel environment variables, then redeploy.",
    });
    return;
  }

  const numericUid = Number(uid) || 0;
  const rtcRole = wantsHost ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channel,
    numericUid,
    rtcRole,
    TOKEN_LIFETIME_SECONDS,
    TOKEN_LIFETIME_SECONDS
  );

  res.status(200).json({ token, appId, channel, uid: numericUid });
}
