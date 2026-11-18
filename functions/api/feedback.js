// POST /api/feedback  - stores a feedback message in the private D1 database (binding: DB).
// No names or emails are collected. A hashed, non-reversible IP fingerprint is stored only to rate-limit spam.
const KINDS = ["wrong", "bug", "idea", "other"];
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const clip = (v, n) => (v == null ? null : String(v).slice(0, n));

async function fingerprint(ip) {
  const data = new TextEncoder().encode("big4dle-feedback:" + ip);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "Something went wrong. Please try again." }, 400); }
  if (body && body.website) return json({ ok: true });                       // hidden trap field: bots fill it, people don't
  const message = clip(String((body && body.message) || "").trim(), 1000);
  if (!message || message.length < 3) return json({ ok: false, error: "Please write a little more." }, 400);
  const kind = KINDS.includes(body.kind) ? body.kind : "other";

  const ipHash = await fingerprint(request.headers.get("CF-Connecting-IP") || "unknown");
  const perIp = await env.DB.prepare("SELECT COUNT(*) AS n FROM feedback WHERE ip_hash = ? AND created_at > datetime('now','-1 hour')").bind(ipHash).first();
  if (perIp && perIp.n >= 5) return json({ ok: false, error: "Thanks, you've sent a few already. Please try again later." }, 429);
  const perDay = await env.DB.prepare("SELECT COUNT(*) AS n FROM feedback WHERE created_at > datetime('now','-1 day')").first();
  if (perDay && perDay.n >= 300) return json({ ok: false, error: "Feedback is busy right now. Please try again later." }, 429);

  await env.DB.prepare("INSERT INTO feedback (kind, message, team, edition, mode, day, guesses, ua, viewport, ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(kind, message, clip(body.team, 80), clip(body.edition, 12), clip(body.mode, 12), clip(body.day, 12),
      Number.isFinite(body.guesses) ? Math.max(0, Math.min(9, body.guesses | 0)) : null,
      clip(request.headers.get("User-Agent"), 200), clip(body.viewport, 16), ipHash).run();
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: "POST only" }, 405);   // any other method
