// /api/agora-token
//
// Generates a short-lived Agora RTC token so the browser never needs to know
// your App Certificate. Requires two environment variables to be set on the
// Vercel project (Settings -> Environment Variables):
//   AGORA_APP_ID           - same App ID already used on the front end
//   AGORA_APP_CERTIFICATE  - from Agora Console -> your project -> Certificate
//
// Request:  GET /api/agora-token?channel=<name>&uid=<number>&role=host|audience
// Response: { token, appId, channel, uid }
import { RtcTokenBuilder, RtcRole } from "agora-token";

const TOKEN_LIFETIME_SECONDS = 3600; // 1 hour

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { channel, uid, role } = req.query;

  if (!channel) {
    res.status(400).json({ error: "channel is required" });
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
  const rtcRole = role === "audience" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

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
