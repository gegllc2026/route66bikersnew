import { useState, useEffect, useRef } from "react";
import {
  Home,
  Radio,
  User,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Edit2,
  Check,
  Send,
  Video,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  MapPin,
} from "lucide-react";
import logo from "./assets/logo.png";

// ---------------------------------------------------------------------------
// Route 66 Bikers — design tokens
// Palette pulled from the club patch: deep highway-night navy, steel blue,
// route-marker orange. Oswald (condensed, signage-like) for display type,
// Inter for anything that needs to be read at length.
// ---------------------------------------------------------------------------
const c = {
  bg: "#0B1420",
  surface: "#111D2C",
  surfaceAlt: "#182838",
  border: "#26384A",
  text: "#F1EEE6",
  muted: "#87A0B0",
  steel: "#5C9DC3",
  orange: "#E0812E",
  orangeDim: "#8C5426",
};

const display = { fontFamily: "'Oswald', sans-serif" };
const body = { fontFamily: "'Inter', sans-serif" };

const initialPosts = [
  {
    id: 1,
    name: "Dutch Vance",
    handle: "@dutch_rides",
    time: "2h",
    text: "Finally sorted the carb rebuild on the Panhead. She idles smooth as county blacktop now.",
    likes: 42,
    comments: 6,
    liked: false,
  },
  {
    id: 2,
    name: "Sadie Cross",
    handle: "@sadiecross",
    time: "4h",
    text: "Saturday's ride to Cadillac Ranch is a go. Kickstands up 8am sharp at the Texaco on old 40.",
    likes: 31,
    comments: 9,
    liked: false,
  },
  {
    id: 3,
    name: "Reyes \"Big R\"",
    handle: "@bigr_66",
    time: "7h",
    text: "Ten years wrenching at this shop and the club still shows up for every open house. Appreciate every one of you.",
    likes: 96,
    comments: 14,
    liked: false,
  },
];

// Fetches a short-lived join token from /api/agora-token so the browser
// never needs to hold the App Certificate. Throws if the server rejects it
// (e.g. AGORA_APP_ID / AGORA_APP_CERTIFICATE aren't set yet).
async function fetchAgoraToken(channel, uid, role) {
  const res = await fetch(`/api/agora-token?channel=${encodeURIComponent(channel)}&uid=${uid}&role=${role}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Couldn't get a token from the server");
  return data;
}

function randomUid() {
  return Math.floor(Math.random() * 1e8) + 1;
}

function Avatar({ name, size = 40 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      style={{
        width: size,
        height: size,
        background: c.surfaceAlt,
        border: `1px solid ${c.border}`,
        color: c.text,
        ...display,
      }}
      className="rounded-full flex items-center justify-center text-sm shrink-0"
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auth: Sign up / Log in
// This screen manages its own form state and hands a `{ name, handle }`
// object up to App on success. There's no backend wired in yet — swap
// handleSubmit for a real call (or an Agora auth block) when you connect one.
// ---------------------------------------------------------------------------
function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup && !name.trim()) {
      setError("Tell us what to call you.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Email and password are both required.");
      return;
    }
    setError("");
    const displayName = isSignup ? name.trim() : email.split("@")[0];
    onAuthed({
      name: displayName || "Rider",
      handle: "@" + (displayName || "rider").toLowerCase().replace(/[^a-z0-9]/g, ""),
    });
  };

  return (
    <div className="flex flex-col p-6" style={{ minHeight: 640 }}>
      <div className="flex flex-col items-center mt-4 mb-8">
        <img
          src={logo}
          alt="Route 66 Bikers"
          style={{ width: 108, height: 108 }}
          className="rounded-full"
        />
        <div style={{ color: c.text, ...display }} className="text-2xl font-semibold mt-4 tracking-wide">
          Route 66 Bikers
        </div>
        <div style={{ color: c.muted, ...body }} className="text-sm mt-1">
          Posts, live streams, and the open road.
        </div>
      </div>

      <div className="flex rounded-full p-1 mb-6" style={{ background: c.surfaceAlt }}>
        {[
          ["login", "Log in"],
          ["signup", "Sign up"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setMode(key);
              setError("");
            }}
            style={{
              background: mode === key ? c.orange : "transparent",
              color: mode === key ? "#1a1105" : c.muted,
              ...display,
            }}
            className="flex-1 py-2 rounded-full text-sm font-medium transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isSignup && (
          <label className="flex flex-col gap-1.5">
            <span style={{ color: c.muted, ...body }} className="text-xs">
              Rider name
            </span>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ background: c.surfaceAlt, border: `1px solid ${c.border}` }}
            >
              <User size={16} style={{ color: c.muted }} />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dutch Vance"
                style={{ background: "transparent", color: c.text, ...body }}
                className="flex-1 outline-none text-sm"
              />
            </div>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span style={{ color: c.muted, ...body }} className="text-xs">
            Email
          </span>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: c.surfaceAlt, border: `1px solid ${c.border}` }}
          >
            <Mail size={16} style={{ color: c.muted }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@route66.com"
              style={{ background: "transparent", color: c.text, ...body }}
              className="flex-1 outline-none text-sm"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span style={{ color: c.muted, ...body }} className="text-xs">
            Password
          </span>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: c.surfaceAlt, border: `1px solid ${c.border}` }}
          >
            <Lock size={16} style={{ color: c.muted }} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ background: "transparent", color: c.text, ...body }}
              className="flex-1 outline-none text-sm"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? (
                <EyeOff size={16} style={{ color: c.muted }} />
              ) : (
                <Eye size={16} style={{ color: c.muted }} />
              )}
            </button>
          </div>
        </label>

        {error && (
          <div style={{ color: c.orange, ...body }} className="text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{ background: c.orange, color: "#1a1105", ...display }}
          className="w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mt-2"
        >
          {isSignup ? <UserPlus size={16} /> : <LogIn size={16} />}
          {isSignup ? "Create account" : "Log in"}
        </button>
      </form>

      <div style={{ color: c.muted, ...body }} className="text-xs text-center mt-6 leading-relaxed">
        {isSignup ? "Already riding with us?" : "New to the club?"}{" "}
        <button
          onClick={() => {
            setMode(isSignup ? "login" : "signup");
            setError("");
          }}
          style={{ color: c.steel }}
          className="font-medium"
        >
          {isSignup ? "Log in" : "Sign up"}
        </button>
      </div>
    </div>
  );
}

function Feed({ user }) {
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState("");

  const toggleLike = (id) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
    );
  };

  const submitPost = () => {
    if (!draft.trim()) return;
    setPosts((prev) => [
      { id: Date.now(), name: user.name, handle: user.handle, time: "now", text: draft.trim(), likes: 0, comments: 0, liked: false },
      ...prev,
    ]);
    setDraft("");
  };

  return (
    <div className="flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: c.border }}>
        <div className="flex gap-3">
          <Avatar name={user.name} />
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share something with the club"
              style={{ background: "transparent", color: c.text, ...body }}
              className="w-full resize-none outline-none text-[15px]"
              rows={2}
            />
            <div className="flex justify-end">
              <button
                onClick={submitPost}
                style={{ background: draft.trim() ? c.orange : c.surfaceAlt, color: draft.trim() ? "#1a1105" : c.muted, ...display }}
                className="text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {posts.map((post) => (
        <div key={post.id} className="p-4 border-b flex gap-3" style={{ borderColor: c.border }}>
          <Avatar name={post.name} />
          <div className="flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span style={{ color: c.text, ...display }} className="text-sm font-medium">{post.name}</span>
              <span style={{ color: c.muted }} className="text-xs">{post.handle} · {post.time}</span>
            </div>
            <p style={{ color: c.text, ...body }} className="text-[15px] mt-1 leading-relaxed">{post.text}</p>
            <div className="flex items-center gap-5 mt-3">
              <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 text-xs" style={{ color: post.liked ? c.orange : c.muted }}>
                <Heart size={15} fill={post.liked ? c.orange : "none"} /> {post.likes}
              </button>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: c.muted }}>
                <MessageCircle size={15} /> {post.comments}
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: c.muted }}>
                <Share2 size={15} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live: real Agora RTC broadcasting.
// AGORA_APP_ID comes from your Agora App Builder project config. There's no
// App Certificate set on that project, so this runs in "testing mode" — no
// token is required to join a channel. That's fine for development, but
// anyone with the App ID can join any channel by name. Add a token server
// (Agora has a guide + sample Node server) before real users rely on this.
//
// Discovery: the "Live now" list below is still sample data, since knowing
// who is *currently* broadcasting requires a backend (a database row or
// Agora RTM presence) that this front-end alone can't provide. The "Join a
// stream" box lets you jump straight into a real channel by name so you can
// test host + viewer together (e.g. two browser tabs/devices).
// ---------------------------------------------------------------------------
const AGORA_APP_ID = "64162831df204bbe837f04db8b0f0ca7";

function Live({ user }) {
  const [mode, setMode] = useState("browse"); // "browse" | "hosting" | "watching"
  const [streamTitle, setStreamTitle] = useState("");
  const [channelInput, setChannelInput] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [liveList, setLiveList] = useState([]);
  const [messages, setMessages] = useState([
    { id: 1, name: "kickstands_kenny", text: "let's ride" },
    { id: 2, name: "sadiecross", text: "see you at the ranch" },
  ]);
  const [chatDraft, setChatDraft] = useState("");

  const clientRef = useRef(null);
  const localTracksRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const scrollRef = useRef(null);
  const heartbeatRef = useRef(null);

  const myChannel = (user.handle.replace("@", "") || "rider").toLowerCase();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // While browsing, poll the presence backend for who's actually live.
  useEffect(() => {
    if (mode !== "browse") return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/streams");
        const data = await res.json();
        if (!cancelled) setLiveList(data.streams || []);
      } catch {
        // Presence backend may not be connected yet — fail quietly, list stays empty.
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, [mode]);

  // Always leave the channel, release the camera/mic, and stop the heartbeat
  // when this screen unmounts (e.g. the person switches tabs).
  useEffect(() => () => { clearInterval(heartbeatRef.current); cleanup(); }, []);

  const getClient = async () => {
    if (!clientRef.current) {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      clientRef.current = { AgoraRTC, client: AgoraRTC.createClient({ mode: "live", codec: "vp8" }) };
    }
    return clientRef.current;
  };

  const cleanup = async () => {
    localTracksRef.current?.forEach((t) => { t.stop(); t.close(); });
    localTracksRef.current = null;
    if (clientRef.current?.client) {
      clientRef.current.client.removeAllListeners();
      await clientRef.current.client.leave().catch(() => {});
    }
  };

  const announcePresence = () => {
    fetch("/api/streams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: myChannel,
        title: streamTitle.trim() || `${user.name}'s ride`,
        hostName: user.name,
      }),
    }).catch(() => {});
  };

  const goLive = async () => {
    setStatusMsg("Connecting…");
    try {
      const { client } = await getClient();
      await client.setClientRole("host");
      const { AgoraRTC } = clientRef.current;

      const uid = randomUid();
      const { token } = await fetchAgoraToken(myChannel, uid, "host");

      const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = [micTrack, camTrack];

      client.on("user-joined", () => setViewerCount((v) => v + 1));
      client.on("user-left", () => setViewerCount((v) => Math.max(0, v - 1)));

      await client.join(AGORA_APP_ID, myChannel, token, uid);
      await client.publish(localTracksRef.current);
      camTrack.play(localVideoRef.current);

      announcePresence();
      heartbeatRef.current = setInterval(announcePresence, 15000);

      setMode("hosting");
      setStatusMsg("");
    } catch (err) {
      setStatusMsg("Couldn't go live — " + err.message);
    }
  };

  const endLive = async () => {
    clearInterval(heartbeatRef.current);
    fetch("/api/streams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: myChannel }),
    }).catch(() => {});
    await cleanup();
    setViewerCount(0);
    setMode("browse");
  };

  const joinStream = async (channelName) => {
    const name = channelName.trim().toLowerCase();
    if (!name) return;
    setStatusMsg("Connecting…");
    try {
      const { client } = await getClient();
      await client.setClientRole("audience");

      const uid = randomUid();
      const { token } = await fetchAgoraToken(name, uid, "audience");

      client.on("user-published", async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === "video") remoteUser.videoTrack?.play(remoteVideoRef.current);
        if (mediaType === "audio") remoteUser.audioTrack?.play();
      });

      await client.join(AGORA_APP_ID, name, token, uid);
      setMode("watching");
      setStatusMsg("");
    } catch (err) {
      setStatusMsg("Couldn't join — " + err.message);
    }
  };

  const leaveStream = async () => {
    await cleanup();
    setMode("browse");
  };

  const sendChat = () => {
    if (!chatDraft.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), name: user.handle.replace("@", ""), text: chatDraft.trim() }]);
    setChatDraft("");
  };

  if (mode === "hosting" || mode === "watching") {
    const isHost = mode === "hosting";
    return (
      <div className="flex flex-col h-full">
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ background: c.bg, height: 200 }}
        >
          <div
            ref={isHost ? localVideoRef : remoteVideoRef}
            className="absolute inset-0"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
            <span style={{ background: c.orange, color: "#1a1105", ...display }} className="text-xs font-semibold px-2 py-1 rounded">Live</span>
            {isHost && (
              <span style={{ background: "rgba(0,0,0,0.5)", color: c.text }} className="text-xs px-2 py-1 rounded flex items-center gap-1">
                <Users size={12} /> {viewerCount}
              </span>
            )}
          </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="text-sm" style={{ color: c.text, ...body }}>
              <span style={{ color: c.steel }} className="font-medium">{m.name}</span>{"  "}{m.text}
            </div>
          ))}
        </div>
        <div className="p-3 border-t flex gap-2" style={{ borderColor: c.border }}>
          <input
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Say something"
            style={{ background: c.surfaceAlt, color: c.text, ...body }}
            className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
          />
          <button onClick={sendChat} style={{ color: c.steel }}><Send size={18} /></button>
        </div>
        <div className="p-3">
          <button
            onClick={isHost ? endLive : leaveStream}
            style={{ background: c.surfaceAlt, color: c.orange, ...display }}
            className="w-full py-2.5 rounded-full text-sm font-medium"
          >
            {isHost ? "End stream" : "Leave stream"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <input
        value={streamTitle}
        onChange={(e) => setStreamTitle(e.target.value)}
        placeholder="What's this stream about?"
        style={{ background: c.surfaceAlt, color: c.text, ...body }}
        className="w-full rounded-full px-4 py-2 text-sm outline-none mb-2"
      />
      <button
        onClick={goLive}
        style={{ background: c.orange, ...display }}
        className="w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mb-3"
      >
        <Radio size={16} style={{ color: "#1a1105" }} />
        <span style={{ color: "#1a1105" }}>Go live</span>
      </button>

      <div className="flex gap-2 mb-2">
        <input
          value={channelInput}
          onChange={(e) => setChannelInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && joinStream(channelInput)}
          placeholder="Join a stream by rider handle"
          style={{ background: c.surfaceAlt, color: c.text, ...body }}
          className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
        />
        <button
          onClick={() => joinStream(channelInput)}
          style={{ background: c.surfaceAlt, color: c.steel, ...display }}
          className="px-4 py-2 rounded-full text-sm font-medium"
        >
          Join
        </button>
      </div>
      {statusMsg && (
        <div style={{ color: c.muted, ...body }} className="text-xs mb-4">{statusMsg}</div>
      )}

      <div style={{ color: c.text, ...display }} className="text-sm font-medium mb-3 mt-4">Live now</div>
      {liveList.length === 0 ? (
        <div
          style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.muted, ...body }}
          className="text-sm p-4 rounded-xl text-center"
        >
          No one's riding live right now. Be the first.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {liveList.map((s) => (
            <button
              key={s.channel}
              onClick={() => joinStream(s.channel)}
              className="flex items-center gap-3 p-3 rounded-xl text-left"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="relative w-20 h-14 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.surfaceAlt }}>
                <Video size={18} style={{ color: c.muted }} />
                <span style={{ background: c.orange, color: "#1a1105" }} className="absolute top-1 left-1 text-[10px] px-1.5 rounded font-medium">Live</span>
              </div>
              <div className="flex-1">
                <div style={{ color: c.text, ...display }} className="text-sm font-medium">{s.title}</div>
                <div style={{ color: c.muted }} className="text-xs mt-0.5">{s.hostName}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Profile({ user, onSignOut }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState("Riding Route 66 end to end, one state line at a time. Wrench on weekends.");
  const [draftName, setDraftName] = useState(name);
  const [draftBio, setDraftBio] = useState(bio);

  const save = () => {
    setName(draftName);
    setBio(draftBio);
    setEditing(false);
  };
  const cancel = () => {
    setDraftName(name);
    setDraftBio(bio);
    setEditing(false);
  };

  return (
    <div className="p-5">
      <div className="flex items-start justify-between">
        <Avatar name={name} size={64} />
        <button onClick={() => (editing ? save() : setEditing(true))} style={{ color: c.steel }} className="text-xs flex items-center gap-1">
          {editing ? (<><Check size={14} /> Save</>) : (<><Edit2 size={14} /> Edit</>)}
        </button>
      </div>
      {editing ? (
        <div className="mt-4 flex flex-col gap-2">
          <input value={draftName} onChange={(e) => setDraftName(e.target.value)} style={{ background: c.surfaceAlt, color: c.text, ...display }} className="rounded-lg px-3 py-2 text-base outline-none" />
          <textarea value={draftBio} onChange={(e) => setDraftBio(e.target.value)} style={{ background: c.surfaceAlt, color: c.text, ...body }} className="rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={3} />
          <button onClick={cancel} style={{ color: c.muted }} className="text-xs self-start mt-1">Cancel</button>
        </div>
      ) : (
        <div className="mt-4">
          <div style={{ color: c.text, ...display }} className="text-lg font-semibold">{name}</div>
          <div style={{ color: c.muted, ...body }} className="text-xs mt-0.5">{user.handle}</div>
          <p style={{ color: c.muted, ...body }} className="text-sm mt-2 leading-relaxed">{bio}</p>
        </div>
      )}
      <div className="flex gap-6 mt-5 pb-5 border-b" style={{ borderColor: c.border }}>
        {[["Rides logged", 24], ["Followers", 812], ["Following", 96]].map(([label, val]) => (
          <div key={label}>
            <div style={{ color: c.text, ...display }} className="text-base font-semibold">{val}</div>
            <div style={{ color: c.muted }} className="text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div style={{ color: c.text, ...display }} className="text-sm font-medium mb-3">Recent activity</div>
        <div className="flex flex-col gap-3">
          {initialPosts.slice(0, 2).map((p) => (
            <div key={p.id} className="text-sm p-3 rounded-lg" style={{ background: c.surface, color: c.muted, border: `1px solid ${c.border}` }}>
              {p.text}
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onSignOut}
        style={{ color: c.muted, ...display }}
        className="w-full mt-6 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2"
      >
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("feed");
  const titles = { feed: "Community", live: "Live", profile: "Profile" };

  const frame = (
    <div style={{ background: c.bg, ...body }} className="w-full max-w-md mx-auto flex flex-col rounded-2xl overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        textarea::placeholder, input::placeholder { color: ${c.muted}; }
      `}</style>

      {!user ? (
        <AuthScreen onAuthed={setUser} />
      ) : (
        <>
          <div className="px-4 py-4 border-b flex items-center gap-2 justify-between" style={{ borderColor: c.border }}>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Route 66 Bikers" style={{ width: 28, height: 28 }} className="rounded-full" />
              <span style={{ color: c.text, ...display }} className="text-lg font-semibold">{titles[tab]}</span>
            </div>
            {tab === "feed" && <Users size={18} style={{ color: c.muted }} />}
            {tab === "live" && <MapPin size={18} style={{ color: c.muted }} />}
          </div>
          <div className="flex-1 overflow-y-auto" style={{ height: 560 }}>
            {tab === "feed" && <Feed user={user} />}
            {tab === "live" && <Live user={user} />}
            {tab === "profile" && <Profile user={user} onSignOut={() => setUser(null)} />}
          </div>
          <div className="flex border-t" style={{ borderColor: c.border, background: c.surface }}>
            {[["feed", Home], ["live", Radio], ["profile", User]].map(([key, Icon]) => (
              <button key={key} onClick={() => setTab(key)} className="flex-1 py-3 flex items-center justify-center">
                <Icon size={20} style={{ color: tab === key ? c.orange : c.muted }} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return frame;
}
