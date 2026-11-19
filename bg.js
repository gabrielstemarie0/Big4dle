/* Big4dle animated background.
   0 guesses: plain black. Guess 1: basketballs bounce around like a DVD logo. Guess 2: they turn into baseballs,
   guess 3: footballs, guess 4: hockey pucks. When the game ends (solved or out of guesses) the background plays
   the answer sport's winning play on a loop: hail mary TD, half-court buzzer beater, shootout winner, walk-off homer. */
(function () {
  "use strict";
  const cv = document.createElement("canvas");
  cv.id = "bg"; cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const cf = document.createElement("canvas");
  cf.id = "bgf"; cf.setAttribute("aria-hidden", "true");
  document.body.append(cf);
  let ctx = cv.getContext("2d");
  const fx = cf.getContext("2d");    // players, ball and banner are drawn here, in front of the page
  const onFront = fn => { const s = ctx; ctx = fx; try { return fn(); } finally { ctx = s; } };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, CH = 0, dpr = 1;
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; CH = innerHeight; cv.width = cf.width = W * dpr; cv.height = cf.height = CH * dpr; }
  size(); addEventListener("resize", size);

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const line = (a, b, c, d) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); };
  const disc = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };

  /* ---------- the four balls, drawn like the logo ---------- */
  function ballImpl(kind, x, y, r, a, ph) {
    ctx.save(); ctx.translate(x, y);
    if (kind === "puck") {
      const ry = r * .5;
      ctx.fillStyle = "#101010"; ctx.beginPath(); ctx.ellipse(0, r * .22, r, ry, 0, 0, 7); ctx.fill();
      ctx.fillRect(-r, -r * .05, r * 2, r * .27);
      ctx.fillStyle = "#101010"; ctx.beginPath(); ctx.ellipse(0, r * .22, r, ry, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = "#3b3b3b"; ctx.beginPath(); ctx.ellipse(0, -r * .05, r, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "#8a8a8a"; ctx.lineWidth = Math.max(1, r * .07); ctx.beginPath(); ctx.ellipse(0, -r * .05, r, ry, 0, 0, 7); ctx.stroke();
      ctx.restore(); return;
    }
    ctx.rotate(a);
    if (kind === "football") {
      const rx = r * 1.4, ry = r * .8;
      const lemon = () => { ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.bezierCurveTo(-rx * .55, -ry * 1.45, rx * .55, -ry * 1.45, rx, 0); ctx.bezierCurveTo(rx * .55, ry * 1.45, -rx * .55, ry * 1.45, -rx, 0); ctx.closePath(); };
      lemon(); ctx.fillStyle = "#8a4a22"; ctx.fill();
      ctx.save(); lemon(); ctx.clip();
      ctx.strokeStyle = "#fff"; ctx.lineCap = "butt"; ctx.lineWidth = r * .14; line(-rx * .62, -ry * 1.1, -rx * .62, ry * 1.1); line(rx * .62, -ry * 1.1, rx * .62, ry * 1.1);
      const ps = Math.sin(ph || 0), pc = Math.cos(ph || 0);   // spiral: laces roll around the long axis
      if (ph == null || pc > -.15) { ctx.strokeStyle = "#f4f1e8"; ctx.lineCap = "round"; ctx.lineWidth = r * .1 * Math.max(.35, pc); const yo = ps * ry * .75; line(-rx * .3, yo, rx * .3, yo); for (let i = -2; i <= 2; i++) line(i * rx * .13, yo - ry * .2 * Math.max(.35, pc), i * rx * .13, yo + ry * .2 * Math.max(.35, pc)); }
      ctx.restore();
    } else if (kind === "baseball") {
      ctx.fillStyle = "#f7f4ec"; disc(0, 0, r);
      ctx.strokeStyle = "#d62839"; ctx.lineCap = "round"; ctx.lineWidth = r * .09;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * r * .55, -r * .8); ctx.quadraticCurveTo(s * r * .05, 0, s * r * .55, r * .8); ctx.stroke();
        for (let i = -3; i <= 3; i++) { const yy = i * r * .22, xx = s * (r * .26 + (1 - Math.abs(i) / 3.4) * 0 + Math.abs(i) * r * .06 + r * .05); line(xx - s * r * .1, yy - r * .05, xx + s * r * .1, yy + r * .05); }
      }
    } else { // basketball
      ctx.fillStyle = "#f28c28"; disc(0, 0, r);
      ctx.strokeStyle = "#2b1a0a"; ctx.lineCap = "round"; ctx.lineWidth = r * .09;
      line(-r, 0, r, 0); line(0, -r, 0, r);
      ctx.beginPath(); ctx.moveTo(-r * .72, -r * .72); ctx.quadraticCurveTo(-r * .2, 0, -r * .72, r * .72);
      ctx.moveTo(r * .72, -r * .72); ctx.quadraticCurveTo(r * .2, 0, r * .72, r * .72); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    }
    ctx.restore();
  }

  const ball = (...a) => ballImpl(...a);
  const fball = (...a) => onFront(() => ballImpl(...a));

  /* ---------- state ---------- */
  const KINDS = ["basketball", "baseball", "football", "puck"];
  let TM, OP, TMX = { ez: "#7a1f2b", trim: "#f4f4f4", nick: "" };
  let phase = "none", kind = "basketball", balls = [], sport = "", finaleAt = 0, last = 0, running = false, frozen = null, watching = false;

  function spawn() {
    balls = [];
    const R = Math.min(34, Math.max(24, W / 16));
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * 6.283, sp = 110 + Math.random() * 90;
      balls.push({ x: R + Math.random() * (W - 2 * R), y: R + Math.random() * (CH - 2 * R), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: R * (.85 + Math.random() * .3), a: Math.random() * 6, spin: (Math.random() - .5) * 3, pop: 0 });
    }
  }
  const lum = c => { const v = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
  const lift = c => { if (lum(c) > .16) return c; const v = [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * .7 + 255 * .3)); return "#" + v.map(x => x.toString(16).padStart(2, "0")).join(""); };
const dist = (a, c) => Math.hypot(...[1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16) - parseInt(c.slice(i, i + 2), 16)));
  function update(n, over, s, team, rival) {
    if (team) {
      TM = kitFor(team);
      const r0 = rival ? { c1: rival.c1, c2: rival.c2, c3: rival.c3 } : { c1: "#2f3545", c2: "#9aa3b5", c3: "#d9dde3" };
      let rc = r0;
      if (dist(rc.c1, team.c1) < 85) rc = { c1: r0.c2, c2: r0.c1, c3: r0.c3 };                    // too close to the home jersey: try their second colour
      if (dist(rc.c1, team.c1) < 85) rc = { c1: "#f2f2f2", c2: r0.c1, c3: r0.c2 };               // still too close: away whites, rival colours as trim
      OP = kitFor(rc);
      TMX = { ez: ez(team), trim: lum(ez(team)) > .45 ? "#17181c" : "#f4f4f4", nick: (team.name.slice(team.city.length).trim() || team.name).toUpperCase() };
    }
    if (over) { if (phase !== "finale" || sport !== s) { phase = "finale"; sport = s; finaleAt = performance.now(); } }
    else if (n === 0) { phase = "none"; watch(false); }
    else {
      const k = KINDS[Math.min(n, 4) - 1];
      if (phase !== "balls") { phase = "balls"; kind = k; spawn(); balls.forEach(b => b.pop = performance.now()); }
      else if (k !== kind) { kind = k; balls.forEach(b => b.pop = performance.now()); }
    }
    document.body.classList.toggle("finale", phase === "finale");
    start();
  }
  function start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }

  /* ---------- uniforms: jersey, contrasting pants, helmet, trim and number from the team's three colours ---------- */
  function kitFor(c) {
    const j = lift(c.c1), pal = [lift(c.c2), lift(c.c3)];
    let t = dist(j, pal[1]) > dist(j, pal[0]) ? pal[1] : pal[0];
    if (dist(j, t) < 90) t = lum(j) > .5 ? "#17181c" : "#f2f2f2";
    const pn = pal.find(x => x !== t && dist(x, j) >= 90) || t;
    return { j, t, pn, num: lum(j) > .5 ? "#101214" : "#ffffff" };
  }

  TM = kitFor({ c1: "#4aa3ff", c2: "#1b3a66", c3: "#ffffff" }); OP = kitFor({ c1: "#e6e9ef", c2: "#6b7384", c3: "#2f3545" });

  /* ---------- people (two-piece legs and arms, per-sport headgear) ---------- */
  function personImpl(x, y, h, o) {
    const d = o.d || 1, th = h * .235, sh = h * .235, tor = h * .34, ua = h * .15, fa = h * .15, lw = h * .1 * (o.fat || 1);
    const lean = o.lean || 0, hy = y - (th + sh) * .96 + (o.bob || 0) + (o.crouch || 0), hx = x;
    const sx = hx + Math.sin(lean) * d * tor, sy = hy - Math.cos(lean) * tor;
    const A = (bx, by, ang, len) => [bx + Math.sin(ang) * d * len, by + Math.cos(ang) * len];
    const l1 = o.l1 || 0, l2 = o.l2 || 0, k1 = o.k1 || 0, k2 = o.k2 || 0;
    const kn1 = A(hx, hy, l1, th), kn2 = A(hx, hy, l2, th), ft1 = A(kn1[0], kn1[1], l1 - k1, sh), ft2 = A(kn2[0], kn2[1], l2 - k2, sh);
    const a1 = o.a1 == null ? .25 : o.a1, a2 = o.a2 == null ? .25 : o.a2, e1 = o.e1 == null ? .25 : o.e1, e2 = o.e2 == null ? .25 : o.e2;
    const el1 = A(sx, sy, a1, ua), el2 = A(sx, sy, a2, ua), h1 = A(el1[0], el1[1], a1 + e1, fa), h2 = A(el2[0], el2[1], a2 + e2, fa);
    const hd = [sx + Math.sin(lean) * d * h * .11, sy - Math.cos(lean) * h * .11];
    const out = { h1, h2, s: [sx, sy], k1: ft1, k2: ft2, head: hd };
    if (o.dry) return out;
    const skin = o.skin || "#d9a97f", pants = o.pants || "#39405a", shin = o.shin || pants, col = o.col || "#888";
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.fillStyle = "rgba(0,0,0,.32)"; ctx.beginPath(); ctx.ellipse(x, o.floor == null ? y : o.floor, h * .26, h * .045, 0, 0, 7); ctx.fill();
    ctx.shadowColor = "rgba(255,255,255,.45)"; ctx.shadowBlur = 5;   // soft rim light so dark kits stay readable against the night sky
    const leg = (kn, ft, front) => {
      if (o.short) { ctx.strokeStyle = skin; ctx.lineWidth = lw * .92; line(hx, hy, kn[0], kn[1]); ctx.strokeStyle = pants; ctx.lineWidth = lw * 1.25; line(hx, hy, lerp(hx, kn[0], .58), lerp(hy, kn[1], .58)); }
      else { ctx.strokeStyle = pants; ctx.lineWidth = lw * 1.05; line(hx, hy, kn[0], kn[1]); }
      ctx.strokeStyle = o.shortLeg ? skin : shin; ctx.lineWidth = lw * .92; line(kn[0], kn[1], ft[0], ft[1]);
      ctx.strokeStyle = o.shoe || "#14151a"; ctx.lineWidth = lw * .8; line(ft[0], ft[1], ft[0] + d * h * .07, ft[1] + h * .005);
      if (o.skate) { ctx.strokeStyle = "#cfd6de"; ctx.lineWidth = 2; line(ft[0] - d * h * .06, ft[1] + h * .04, ft[0] + d * h * .15, ft[1] + h * .04); }
    };
    const arm = (el, hn, front) => {
      ctx.strokeStyle = col; ctx.lineWidth = lw * .86; line(sx, sy, el[0], el[1]);
      ctx.strokeStyle = o.long ? col : skin; ctx.lineWidth = lw * .74; line(el[0], el[1], hn[0], hn[1]);
      if (o.trim) { ctx.strokeStyle = o.trim; ctx.lineWidth = lw * .9; const m = [lerp(sx, el[0], .62), lerp(sy, el[1], .62)]; line(m[0], m[1], lerp(m[0], el[0], .3), lerp(m[1], el[1], .3)); }
      ctx.fillStyle = o.glove || skin; disc(hn[0], hn[1], lw * .5);
    };
    leg(kn2, ft2); arm(el2, h2);
    ctx.strokeStyle = col; ctx.lineWidth = lw * (o.pads ? 2.35 : 1.95); line(hx, hy - h * .02, sx, sy);
    if (o.trim) { ctx.strokeStyle = o.trim; ctx.lineWidth = lw * .5; const m = [lerp(hx, sx, .08), lerp(hy, sy, .08)]; line(m[0] - d * lw * .5, m[1], m[0] + d * lw * .5, m[1]); }
    if (o.n) { ctx.fillStyle = o.num || "#fff"; ctx.font = `800 ${h * .1}px -apple-system,Segoe UI,Arial,sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(o.n, lerp(hx, sx, .55), lerp(hy, sy, .5)); }
    leg(kn1, ft1); arm(el1, h1);
    const r = h * .085, cx = hd[0], cy = hd[1];
    if (o.hat === "fb") {
      ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(cx + d * r * .6, cy + r * .3, r * .5, r * .55, 0, 0, 7); ctx.fill();
      ctx.fillStyle = o.helmet; ctx.beginPath(); ctx.arc(cx + d * r * .05, cy - r * .05, r * 1.22, 0, 7); ctx.fill();
      ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(cx + d * r * .78, cy + r * .32, r * .42, r * .5, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = o.trim || "#fff"; ctx.lineWidth = r * .3; ctx.beginPath(); ctx.arc(cx + d * r * .05, cy - r * .05, r * .85, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
      ctx.fillStyle = o.helmet; ctx.beginPath(); ctx.arc(cx - d * r * .1, cy + r * .45, r * .55, 0, 7); ctx.fill();
      ctx.strokeStyle = "#c9ced6"; ctx.lineWidth = Math.max(1.3, r * .13);
      ctx.beginPath(); ctx.moveTo(cx + d * r * .55, cy - r * .55); ctx.bezierCurveTo(cx + d * r * 1.65, cy - r * .4, cx + d * r * 1.6, cy + r * .95, cx + d * r * .55, cy + r * 1.0); ctx.stroke();
      line(cx + d * r * .85, cy - r * .02, cx + d * r * 1.5, cy + r * .02); line(cx + d * r * .8, cy + r * .42, cx + d * r * 1.52, cy + r * .48); line(cx + d * r * .62, cy + r * .78, cx + d * r * 1.3, cy + r * .76);
    } else if (o.hat === "hk" || o.hat === "gk") {
      ctx.fillStyle = skin; disc(cx, cy, r);
      ctx.fillStyle = o.helmet; ctx.beginPath(); ctx.arc(cx, cy - r * .05, r * 1.18, 0, 7); ctx.fill();
      if (o.hat === "hk") { ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(cx + d * r * .62, cy + r * .3, r * .45, r * .5, 0, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(190,225,255,.45)"; ctx.fillRect(Math.min(cx + d * r * .15, cx + d * r * 1.25), cy - r * .2, r * 1.1, r * .75); }
      else { ctx.fillStyle = "#f2f4f7"; ctx.beginPath(); ctx.ellipse(cx + d * r * .35, cy + r * .1, r * 1.1, r * 1.3, 0, 0, 7); ctx.fill(); ctx.strokeStyle = o.helmet; ctx.lineWidth = r * .22; ctx.beginPath(); ctx.arc(cx, cy - r * .05, r * .95, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.strokeStyle = "#4a4f59"; ctx.lineWidth = 1.4; for (let i = -2; i <= 2; i++) line(cx + d * r * 1.05, cy + i * r * .32, cx + d * r * 1.38, cy + i * r * .32 + r * .05); line(cx + d * r * 1.05, cy - r * .7, cx + d * r * 1.05, cy + r * .9); }
    } else if (o.hat === "bat") {
      ctx.fillStyle = skin; disc(cx, cy, r);
      ctx.fillStyle = o.helmet; ctx.beginPath(); ctx.arc(cx, cy - r * .1, r * 1.12, Math.PI * .95, Math.PI * 2.05); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(cx + d * r * .15, cy + r * .25, r * .42, r * .55, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = o.helmet; ctx.lineWidth = r * .3; line(cx + d * r * .7, cy - r * .2, cx + d * r * 1.6, cy - r * .05);
    } else if (o.hat === "cap") {
      ctx.fillStyle = skin; disc(cx, cy, r);
      ctx.fillStyle = o.helmet; ctx.beginPath(); ctx.arc(cx, cy - r * .1, r * 1.1, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = o.trim || o.helmet; ctx.lineWidth = r * .3; line(cx + d * r * .6, cy - r * .1, cx + d * r * 1.55, cy + r * .02);
    } else {
      ctx.fillStyle = skin; disc(cx, cy, r);
      ctx.fillStyle = o.hair || "#2a1c14"; ctx.beginPath(); ctx.arc(cx - d * r * .05, cy - r * .12, r * 1.03, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    }
    ctx.restore();
    return out;
  }
  const person = (x, y, h, o) => o.dry ? personImpl(x, y, h, o) : onFront(() => personImpl(x, y, h, o));
  const H = 172;
  // run cycle: thigh swing, knee bend while the leg recovers, bent elbows, bob
  const run = (t, f = 11, amp = 1) => { const p = t * f, s = Math.sin(p), c = Math.cos(p); return { l1: s * .95 * amp, l2: -s * .95 * amp, k1: Math.max(0, c) * 1.25 * amp + .1, k2: Math.max(0, -c) * 1.25 * amp + .1, a1: -s * .85 * amp + .1, a2: s * .85 * amp + .1, e1: 1.05, e2: 1.05, bob: -Math.abs(c) * H * .018 * amp, lean: .14 * amp }; };
  const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  // draw the cast back-to-front so people in nearer lanes overlap those further away
  let cast = [];
  const add = (fy, fn) => cast.push([fy, fn]);
  const flush = () => { cast.sort((p, q) => p[0] - q[0]).forEach(c => c[1]()); cast = []; };

  /* ---------- scene helpers ---------- */
  let sc = { S: 1, cx: 500, oy: 0 };
  const setT = () => { const m = [dpr * sc.S, 0, 0, dpr * sc.S, dpr * (W / 2 - sc.cx * sc.S), dpr * sc.oy]; ctx.setTransform(...m); fx.setTransform(...m); };
  const look = cx => { sc.cx = cx; setT(); };
  const vis = () => [sc.cx - W / sc.S / 2 - 40, sc.cx + W / sc.S / 2 + 40];
  function backdrop(top, bottom, ground, gy) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H_()); g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H_());
    ctx.fillStyle = ground; ctx.fillRect(0, sc.oy + gy * sc.S, W, H_());
    setT();
  }
  const H_ = () => CH;
  // stadium crowd with camera flashes
  function crowd(y0, y1, t, tint) {
    const [x0, x1] = vis(), pal = ["#3b4358", "#59405a", "#2f5a6b", "#6b5a2f", "#5a2f3a", "#3f6b4a", "#52576b"];
    ctx.fillStyle = "rgba(6,8,14,.9)"; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let r = 0, y = y0 + 8; y < y1 - 4; r++, y += 14) for (let x = Math.floor(x0 / 14) * 14 + (r % 2) * 7; x < x1; x += 14) {
      const k = hash(x * .37 + r * 17.3); ctx.fillStyle = k < .22 && tint ? tint : pal[Math.floor(k * 7) % 7]; disc(x, y, 4.6);
      ctx.fillStyle = "#c79a74"; disc(x, y - 6, 2.8);
    }
    for (let i = 0; i < 16; i++) { const k = hash(i * 9.7 + Math.floor(t * 7) * 3.1); if (k > .55) { const fx2 = x0 + hash(i * 3.3 + Math.floor(t * 7)) * (x1 - x0), fy2 = y0 + 10 + hash(i * 5.1 + 2) * (y1 - y0 - 20); const g = ctx.createRadialGradient(fx2, fy2, 0, fx2, fy2, 14); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(fx2 - 14, fy2 - 14, 28, 28); } }
  }
  function lightGlow(xs, y, r) { for (const x of xs) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, "rgba(255,250,225,.16)"); g.addColorStop(1, "rgba(255,250,225,0)"); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); } }
  function banner(...a) { onFront(() => bannerImpl(...a)); }
  function bannerImpl(t, at) {
    const u = seg(t, at, at + .35); if (!u) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = ["#f28c28", "#fff", "#2e7d5b", "#e0b520", "#d62839", "#4aa3ff"], dt = t - at;
    for (let i = 0; i < 70; i++) {
      const x = ((i * 137.5) % 100) / 100 * W + Math.sin(dt * 2 + i) * 14, y2 = ((dt * (90 + (i % 7) * 26) + i * 53) % (CH + 40)) - 20;
      ctx.fillStyle = cols[i % 6]; ctx.save(); ctx.translate(x, y2); ctx.rotate(dt * 3 + i); ctx.fillRect(-4, -2, 8, 4); ctx.restore();
    }
    setT();
  }
  const ez = c => { const base = lum(c.c1) > .8 ? c.c2 : c.c1, v = [1, 3, 5].map(i => Math.round(parseInt(base.slice(i, i + 2), 16) * .88)); return "#" + v.map(x => x.toString(16).padStart(2, "0")).join(""); };
  const arcPos = (a, b, u, peak) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - 4 * peak * u * (1 - u)];

  /* ---------- scene 1: football, hail mary touchdown ---------- */
  function football(t) {
    const gy = 462, dep = 112, GL = 1260, EZ = 160, LOS = 430, F = TMX;
    const cam = lerp(500, 1120, ease(seg(t, 1.45, 4.2))) + lerp(0, -40, seg(t, 5.2, 6));
    look(cam); backdrop("#04070e", "#0c1a2c", "#124226", gy);
    lightGlow([cam - 300, cam + 280], gy - 190, 190);
    crowd(gy - 105, gy - 2, t, F.ez);
    ctx.fillStyle = "#1f6d3a"; ctx.fillRect(-2000, gy, 5200, dep);
    for (let x = GL - 80 * 40, i = 0; x < GL + 400; x += 80, i++) if (i % 2) { ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fillRect(x, gy, 80, dep); }
    ctx.fillStyle = F.ez; ctx.fillRect(GL, gy, EZ, dep);
    ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 3;
    for (let x = GL - 80; x > -1800; x -= 80) { ctx.lineWidth = ((GL - x) / 80) % 2 === 0 ? 3 : 2; line(x, gy, x, gy + dep); }
    for (let x = GL - 80; x > -1800; x -= 16) if (((GL - x) / 16) % 5) { ctx.lineWidth = 1.5; line(x, gy + 28, x, gy + 36); line(x, gy + dep - 36, x, gy + dep - 28); }
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; line(GL, gy, GL, gy + dep); line(GL + EZ, gy, GL + EZ, gy + dep); line(-2000, gy + 1, 3200, gy + 1); line(-2000, gy + dep - 1, 3200, gy + dep - 1);
    ctx.save(); ctx.translate(GL + EZ / 2 + 8, gy + dep / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = F.trim; ctx.globalAlpha = .85; ctx.font = "800 34px -apple-system,Segoe UI,Arial,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(F.nick, 0, 0); ctx.restore();
    ctx.strokeStyle = "#f2c230"; ctx.lineWidth = 7; ctx.lineCap = "round"; const pb = GL + EZ + 6, pf = gy + dep / 2 + 6;
    line(pb, pf, pb, pf - 215); line(pb - 55, pf - 215, pb + 55, pf - 215); line(pb - 55, pf - 215, pb - 55, pf - 370); line(pb + 55, pf - 215, pb + 55, pf - 370);
    // line of scrimmage
    ctx.strokeStyle = "rgba(60,120,255,.7)"; ctx.lineWidth = 3; line(LOS, gy, LOS, gy + dep);
    const T = TM, O = OP, kit = (k, o) => Object.assign({ col: k.j, pants: k.pn, trim: k.t, num: k.num, hat: "fb", helmet: k.j, pads: 1, long: 1 }, o);
    // --- quarterback: drops back, throws at 1.65, gets hit just after
    const qx0 = 392 - 56 * ease(seg(t, 0, 1.15)), hit = seg(t, 1.85, 2.5), qy = gy + 62;
    const cock = seg(t, 1.12, 1.55), thr = ease(seg(t, 1.55, 1.75));
    const qb = kit(T, { n: "9", a1: t < 1.12 ? 1.0 : lerp(lerp(1.0, -.75, ease(cock)), 2.55, thr), e1: t < 1.12 ? 1.2 : lerp(1.2, .6, thr), a2: t < 1.12 ? 1.0 : lerp(.9, 1.35, thr), e2: 1.1, lean: t < 1.12 ? .08 : lerp(-.1, .28, thr), l1: t < 1.15 ? -Math.sin(t * 10) * .35 : .25, l2: t < 1.15 ? Math.sin(t * 10) * .35 : -.2, k1: .2, k2: .35 });
    const qd = personImpl(qx0, qy, H, Object.assign({ dry: true }, qb));
    add(qy, () => { if (hit > 0) { fx.save(); fx.translate(qx0, qy); fx.rotate(-1.45 * ease(hit)); fx.translate(-qx0, -qy); } person(qx0, qy, H, qb); if (hit > 0) fx.restore(); });
    // --- offensive line holds, defensive line pushes; the edge rusher breaks through
    [[LOS - 18, gy + 26], [LOS - 10, gy + 60], [LOS - 18, gy + 94]].forEach(([x, y], i) => add(y, () => person(x + Math.sin(t * 12 + i) * 2.5, y, H, kit(T, { n: String(70 + i * 3), lean: .5, a1: 1.35, a2: 1.25, e1: .3, e2: .3, l1: .55, l2: -.5, k1: .5, k2: .5, crouch: 8 }))));
    [[LOS + 22, gy + 26], [LOS + 26, gy + 60]].forEach(([x, y], i) => add(y, () => person(x + Math.sin(t * 12 + i * 2) * 2.5 + (t > 2.6 ? 12 * seg(t, 2.6, 3.2) : 0), y, H, kit(O, { n: String(90 + i * 4), d: -1, lean: t > 2.6 ? .1 : .5, a1: t > 2.6 ? .3 : 1.35, a2: t > 2.6 ? .3 : 1.25, e1: .3, e2: .3, l1: .55, l2: -.5, k1: .5, k2: .5, crouch: t > 2.6 ? 0 : 8 }))));
    const ex = t < .45 ? LOS + 20 : lerp(LOS + 20, qx0 + 38, ease(seg(t, .45, 1.8))) + (t > 1.9 ? -12 * seg(t, 1.9, 2.4) : 0), ey = gy + 100;
    add(ey, () => person(ex, ey, H, kit(O, Object.assign({ n: "55", d: -1 }, t < 1.85 ? Object.assign(run(t, 12), { lean: .3 + .3 * seg(t, 1.2, 1.8) }) : { lean: .85, a1: 1.7, a2: 1.6, e1: .1, e2: .1, l1: .5, l2: -.3, k1: .6, k2: .4, crouch: 10 * seg(t, 1.85, 2.3) }))));
    // --- receiver beats the cornerback, who started in front of him
    const sm = u => u * u * (3 - 2 * u), prog = u => .35 * sm(u) + .65 * u;
    const wx = lerp(440, 1330, prog(seg(t, .15, 4.3))) + 32 * seg(t, 4.85, 5.7), juke = 15 * Math.sin(Math.PI * seg(t, .55, 1.6)), wy = gy + 40 + juke;
    const jump = 58 * Math.sin(Math.PI * seg(t, 3.95, 4.8)), running = t < 3.9 || (t > 4.8 && t < 5.7);
    const rc = run(t, 12.5, 1.05), up = t >= 3.9 && t < 4.85;
    const wr = kit(T, { n: "11", l1: running ? rc.l1 : (jump > 4 ? .9 : .1), l2: running ? rc.l2 : (jump > 4 ? -.4 : -.05), k1: running ? rc.k1 : (jump > 4 ? .3 : .2), k2: running ? rc.k2 : (jump > 4 ? 1.2 : .2), a1: up ? 2.85 : t > 4.85 ? (t > 5.5 ? 2.9 : .5) : rc.a1, a2: up ? 2.75 : t > 4.85 ? (t > 5.5 ? 2.7 : .4) : rc.a2, e1: up ? .05 : t > 4.85 ? (t > 5.5 ? .05 : 1.7) : rc.e1, e2: up ? .05 : t > 4.85 ? (t > 5.5 ? .05 : 1.5) : rc.e2, lean: up ? -.05 : rc.lean, bob: running ? rc.bob : 0 });
    const wd = (tt, dd) => personImpl(wx, wy, H, Object.assign({ dry: true }, wr));
    add(wy, () => person(wx, wy - jump, H, wr));
    const cbp = prog(seg(t, .3, 4.4)), cbx = lerp(495, 1275, cbp), cby = gy + 46, turned = t > 1.3, cr = run(t, 11.5);
    add(cby, () => person(cbx, cby - 40 * Math.sin(Math.PI * seg(t, 4.1, 4.9)), H, kit(O, Object.assign({ n: "24", d: turned ? 1 : -1 }, t < .3 ? { lean: .05, crouch: 8, l1: .3, l2: -.3, k1: .4, k2: .4, a1: .6, a2: .6, e1: .5, e2: .5 } : t < 1.3 ? Object.assign({}, cr, { l1: -cr.l1 * .5, l2: -cr.l2 * .5, lean: -.05 }) : t < 4.1 ? Object.assign({}, cr, { lean: .2 }) : { l1: .3, l2: -.2, k1: .5, k2: .5, a1: 2.3, a2: 2.0, e1: .1, e2: .1 }))));
    const sx2 = lerp(900, 1250, ease(seg(t, 1.8, 4.6))), sy2 = gy + 84, sj = 45 * Math.sin(Math.PI * seg(t, 4.35, 5.05));
    add(sy2, () => person(sx2, sy2 - sj, H, kit(O, Object.assign({ n: "31", d: 1 }, t < 4.35 ? Object.assign(run(t, 12), { lean: .2 }) : { a1: 2.5, a2: 2.4, e1: .1, e2: .1, k1: .5, k2: .5, l1: .5, l2: -.3 }))));
    const rx = GL + 34, ry = gy + 102, sig = seg(t, 5.0, 5.4);
    add(ry, () => person(rx, ry, H, { col: "#eceff3", pants: "#1b1b1f", trim: "#1b1b1f", shin: "#1b1b1f", hat: "cap", helmet: "#1b1b1f", d: -1, a1: lerp(.25, 2.9, ease(sig)), a2: lerp(.25, 2.9, ease(sig)), e1: .05, e2: .05, l1: t > 3 ? .1 : 0 }));
    flush();
    // ball: spiral through the air
    const R = [qd.h1[0] + 8, qd.h1[1] - 10], Cp = (() => { const wp = personImpl(wx, wy - 58 * Math.sin(Math.PI * seg(4.35, 3.95, 4.8)), H, Object.assign({ dry: true }, wr, { a1: 2.85, a2: 2.75, e1: .05, e2: .05, bob: 0 })); return [1330 + 4 + 0, wp.h1[1]]; })();
    let bx, by, ba = 0;
    const rcv = personImpl(wx, wy - jump, H, Object.assign({ dry: true }, wr));
    if (t < 1.65) { bx = qd.h1[0] + 4; by = qd.h1[1]; ba = -.35; }
    else if (t < 4.35) { const u = seg(t, 1.65, 4.35), p0 = arcPos(R, Cp, u, 300), p1 = arcPos(R, Cp, Math.min(1, u + .01), 300); bx = p0[0]; by = p0[1]; ba = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); }
    else { bx = rcv.h1[0] + 4; by = rcv.h1[1] - 4; ba = t > 5.5 ? -1.1 : -.4; }
    fball("football", bx, by, 13.5, ba, t * 34);
    banner(t, 5.0);
  }

  /* ---------- scene 2: basketball, half-court buzzer beater ---------- */
  function basketball(t) {
    const gy = 458, dep = 124, hx = 1060, fyH = gy + 62, rimY = fyH - 262, rimX = hx - 36, F = TMX;
    const cam = lerp(430, 830, ease(seg(t, 1.5, 2.9))) + lerp(0, -380, ease(seg(t, 4.1, 5.3)));
    look(cam); backdrop("#0b0614", "#1f1233", "#8a5a2b", gy);
    crowd(gy - 150, gy - 2, t, F.ez);
    lightGlow([cam - 200, cam + 240], gy - 210, 170);
    ctx.fillStyle = "#a36a30"; ctx.fillRect(-2200, gy, 5600, dep);
    for (let x = -2200, i = 0; x < 3400; x += 60, i++) if (i % 2) { ctx.fillStyle = "rgba(0,0,0,.06)"; ctx.fillRect(x, gy, 60, dep); }
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 4; ctx.lineCap = "round";
    line(330, gy, 330, gy + dep); line(-2200, gy + 1, 3400, gy + 1); line(-2200, gy + dep - 1, 3400, gy + dep - 1); line(hx + 10, gy, hx + 10, gy + dep);
    ctx.fillStyle = F.ez; ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(330, gy + dep / 2, 78, 40, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.ellipse(330, gy + dep / 2, 78, 40, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = F.ez; ctx.globalAlpha = .6; ctx.fillRect(hx - 200, gy + 32, 210, dep - 64); ctx.globalAlpha = 1; ctx.strokeRect(hx - 200, gy + 32, 210, dep - 64);
    ctx.beginPath(); ctx.ellipse(hx - 200, gy + dep / 2, 36, 28, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(hx + 10, gy + dep / 2, 300, dep / 2 - 8, 0, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.fillStyle = F.trim; ctx.globalAlpha = .9; ctx.font = "800 26px -apple-system,Segoe UI,Arial,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(F.nick, 330, gy + dep / 2); ctx.globalAlpha = 1;
    // stanchion, backboard, rim, net
    const buzz = t >= 1.7, swish = 3.9;
    ctx.strokeStyle = "#4a4f5a"; ctx.lineWidth = 14; ctx.lineCap = "round"; line(hx + 70, fyH + 8, hx + 70, rimY - 70); line(hx + 70, rimY - 70, hx + 4, rimY - 60);
    ctx.fillStyle = "#e9eef5"; ctx.fillRect(hx - 6, rimY - 108, 12, 128);
    if (buzz) { ctx.fillStyle = `rgba(255,40,40,${.5 + .5 * Math.sin(t * 18)})`; ctx.fillRect(hx - 12, rimY - 114, 4, 140); ctx.fillRect(hx + 8, rimY - 114, 4, 140); ctx.fillRect(hx - 12, rimY - 114, 24, 4); }
    ctx.strokeStyle = "#ff5a1f"; ctx.lineWidth = 6; line(rimX - 14, rimY, hx - 6, rimY);
    const sw = t > swish ? Math.sin((t - swish) * 18) * 7 * Math.exp(-(t - swish) * 3) : 0;
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2;
    for (let i = 0; i <= 5; i++) line(rimX - 12 + i * 8.6, rimY, rimX - 6 + i * 6 + sw, rimY + 58);
    line(rimX - 9 + sw * .4, rimY + 20, rimX + 28 + sw * .4, rimY + 20); line(rimX - 5 + sw * .8, rimY + 40, rimX + 22 + sw * .8, rimY + 40);
    ctx.fillStyle = "rgba(0,0,0,.82)"; ctx.fillRect(hx - 150, rimY - 190, 150, 56);
    ctx.font = "700 36px ui-monospace,Menlo,monospace"; ctx.textAlign = "center"; ctx.fillStyle = buzz ? (Math.sin(t * 18) > 0 ? "#ff4040" : "#a02020") : "#ff9a3c";
    ctx.fillText(`0:0${Math.max(0, 3 - t * 3 / 1.7).toFixed(1)}`, hx - 75, rimY - 150);
    // --- players
    const T = TM, O = OP, kit = (k, o) => Object.assign({ col: k.j, pants: k.j, trim: k.t, num: k.num, short: 1, shortLeg: 1, shoe: k.t, n: "", glove: null }, o);
    const sm = u => u * u * (3 - 2 * u);
    const sx = lerp(200, 330, sm(seg(t, 0, 1.25))), sy = gy + 60, cel = t > swish;
    const dr = run(t, 9, .75), dribbling = t < 1.15, gather = ease(seg(t, 1.1, 1.65)), leap = 28 * Math.sin(Math.PI * seg(t, 1.35, 2.05));
    const shooter = kit(T, { n: "7", hat: null, l1: dribbling ? dr.l1 : (leap > 2 ? .35 : 0), l2: dribbling ? dr.l2 : (leap > 2 ? -.2 : 0), k1: dribbling ? dr.k1 : (leap > 2 ? .6 : .3 * (1 - gather)), k2: dribbling ? dr.k2 : (leap > 2 ? .9 : .3 * (1 - gather)), a1: dribbling ? .55 : lerp(.8, t > 1.7 ? 2.7 : 2.1, gather), a2: dribbling ? .2 : lerp(.8, t > 1.7 ? 2.55 : 1.9, gather), e1: dribbling ? .9 : lerp(1.4, .1, gather), e2: dribbling ? .3 : lerp(1.2, .1, gather), lean: dribbling ? .22 : lerp(.1, -.1, gather), bob: dribbling ? dr.bob : 0, crouch: dribbling ? 0 : 14 * (1 - gather) });
    const shy = sy - (cel ? 28 * Math.abs(Math.sin((t - swish) * 6)) : leap), sd = personImpl(sx, shy, H, Object.assign({ dry: true }, shooter, cel ? { a1: 2.8, a2: 2.7, e1: .05, e2: .05 } : {}));
    add(sy, () => person(sx, shy, H, Object.assign({}, shooter, cel ? { a1: 2.8, a2: 2.7, e1: .05, e2: .05, l1: .1, l2: -.1, k1: .3, k2: .3, crouch: 0 } : {})));
    // defender starts in front of the shooter and is left behind by the crossover, then contests too late
    const dx = lerp(300, 380, sm(seg(t, .15, 1.6))) - 6 * Math.sin(Math.PI * seg(t, .75, 1.2)), dy = gy + 58, dj = 38 * Math.sin(Math.PI * seg(t, 1.5, 2.15));
    const stumble = t > .75 && t < 1.3, dd = run(t, 8.5, .6);
    add(dy + 2, () => person(dx, dy - dj, H, kit(O, { n: "3", d: t < 1.0 ? -1 : 1, l1: dj > 4 ? .3 : (t < 1.0 ? .4 : dd.l1), l2: dj > 4 ? -.2 : (t < 1.0 ? -.4 : dd.l2), k1: dj > 4 ? .6 : .5, k2: dj > 4 ? .8 : .5, a1: dj > 4 ? 2.9 : (t < 1.0 ? 1.3 : dd.a1), a2: dj > 4 ? 2.4 : (t < 1.0 ? -.5 : dd.a2), e1: .15, e2: .4, lean: stumble ? -.28 : .12, crouch: t < 1.0 ? 12 : 0 })));
    const h2x = lerp(430, 392, seg(t, .4, 1.6));
    add(gy + 96, () => person(h2x, gy + 96 - 30 * Math.sin(Math.PI * seg(t, 1.65, 2.2)), H, kit(O, { n: "21", d: -1, a1: t > 1.6 ? 2.7 : 1.1, a2: t > 1.6 ? 2.4 : 1.0, e1: .1, e2: .1, l1: .3, l2: -.3, k1: .5, k2: .5, crouch: t > 1.6 ? 0 : 10 })));
    [[150, gy + 30, 0], [230, gy + 100, .25]].forEach(([x0, y, dl]) => { const j = cel ? 30 * Math.abs(Math.sin((t - swish - dl) * 6)) : 0, mv = seg(t, swish + .2, swish + 1.4), x = lerp(x0, 355 - dl * 60, ease(mv)); add(y, () => person(x, y - j, H, kit(T, { n: String(10 + Math.round(dl * 8)), a1: cel ? 2.8 : .25, a2: cel ? 2.7 : .25, e1: cel ? .05 : .2, e2: cel ? .05 : .2, l1: mv > 0 && mv < 1 ? Math.sin(t * 12) * .8 : 0, l2: mv > 0 && mv < 1 ? -Math.sin(t * 12) * .8 : 0, k1: mv > 0 && mv < 1 ? .8 : .1, k2: mv > 0 && mv < 1 ? .8 : .1 }))); });
    flush();
    // ball: dribble, release, high arc with backspin, swish and bounce
    let bx, by, br = -t * 7;
    if (t < 1.1) { bx = sx + 26; by = fyH + 2 - 100 * Math.abs(Math.sin(t * 5.4)) - 14; }
    else if (t < 1.7) { bx = sd.h1[0]; by = sd.h1[1] - 6; }
    else if (t < swish) { const u = seg(t, 1.7, swish); const p = arcPos([sd.h1[0], sd.h1[1] - 8], [rimX + 12, rimY + 4], u, 250); bx = p[0]; by = p[1]; }
    else { const s = t - swish, fl = fyH - 17; bx = rimX + 12 - Math.max(0, s - .55) * 90; by = rimY + 4 + 720 * s * s; if (by > fl) { const b = s - Math.sqrt((fl - rimY - 4) / 720); by = fl - 90 * Math.abs(Math.sin(b * 5.5)) * Math.exp(-b * 1.6); } }
    fball("basketball", bx, by, 15, br);
    banner(t, 4.0);
  }

  /* ---------- scene 3: hockey, shootout winner ---------- */
  function hockey(t) {
    const gy = 466, dep = 112, GL = 1040, F = TMX, fyG = gy + 58;
    const cam = lerp(560, 800, ease(seg(t, .3, 2.5)));
    look(cam); backdrop("#060d18", "#102239", "#bcd8e8", gy);
    crowd(gy - 150, gy - 74, t, F.ez);
    ctx.fillStyle = "#cfdce6"; ctx.fillRect(-2000, gy - 74, 5200, 74);
    ctx.fillStyle = F.ez; ctx.fillRect(-2000, gy - 30, 5200, 12); ctx.fillStyle = "rgba(190,225,255,.18)"; ctx.fillRect(-2000, gy - 150, 5200, 76);
    ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 3; for (let x = -2000; x < 3200; x += 120) line(x, gy - 150, x, gy);
    ctx.fillStyle = "#bcd8e8"; ctx.fillRect(-2000, gy, 5200, dep);
    // bench: team on the left, the rival on the right, watching over the boards
    const T = TM, O = OP, kit = (k, o) => Object.assign({ col: k.j, pants: k.pn, shin: k.pn, trim: k.t, num: k.num, hat: "hk", helmet: k.j, long: 1, skate: 1, shoe: "#14151a" }, o);
    // ice markings, lined up with the goal line
    ctx.lineCap = "butt"; ctx.fillStyle = "rgba(210,40,60,.85)"; ctx.fillRect(GL - 2, gy, 4, dep);
    ctx.fillStyle = "rgba(40,90,200,.35)"; ctx.fillRect(GL - 85, gy + 6, 85, dep - 12); ctx.strokeStyle = "rgba(40,90,200,.9)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(GL, gy + dep / 2, 85, dep / 2 - 8, 0, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = "rgba(210,40,60,.8)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(640, gy + dep / 2, 90, 44, 0, 0, 7); ctx.stroke(); ctx.fillStyle = "rgba(210,40,60,.9)"; disc(640, gy + dep / 2, 5);
    ctx.fillStyle = "rgba(40,90,200,.7)"; ctx.fillRect(250, gy, 8, dep);
    // net
    const goal = t > 2.95, rip = goal ? Math.sin((t - 2.95) * 20) * 5 * Math.exp(-(t - 2.95) * 3) : 0, ny = gy + dep / 2 + 6;
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.6;
    for (let i = 0; i <= 8; i++) { const yy = ny - 122 + i * 15; line(GL, yy, GL + 58 + rip, yy + 5); }
    for (let i = 0; i <= 6; i++) line(GL + i * 9, ny - 122, GL + 14 + i * 7.5 + rip, ny - 6);
    ctx.strokeStyle = "#d62839"; ctx.lineWidth = 8; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(GL, ny); ctx.lineTo(GL, ny - 124); ctx.lineTo(GL + 58, ny - 116); ctx.stroke();
    if (goal) { ctx.save(); ctx.fillStyle = `rgba(255,50,50,${.55 + .45 * Math.sin(t * 20)})`; ctx.shadowColor = "#ff2020"; ctx.shadowBlur = 40; disc(GL + 30, ny - 160, 16); ctx.restore(); }
    // snow spray where the shooter stops
    const stopT = 2.9;
    if (t > stopT && t < stopT + .8) for (let i = 0; i < 24; i++) { const a = seg(t, stopT, stopT + .8), px = 975 + hash(i) * 70 * a + 20, py = fyG + 30 + 10 - hash(i + 9) * 50 * Math.sin(a * 3), r2 = 3 * (1 - a); ctx.fillStyle = `rgba(255,255,255,${.9 * (1 - a)})`; disc(px, py, r2 + 1); }
    // goalie (rival): comes out to challenge, pokes, sprawls
    const ch = ease(seg(t, .5, 1.8)), gx = lerp(GL - 28, GL - 118, ch), sprawl = ease(seg(t, 2.2, 2.75)), gy2 = gy + 50;
    add(gy2, () => { const gk = kit(O, { n: "31", hat: "gk", pants: O.pn, fat: 1.45, d: 1, helmet: O.t, trim: O.t, glove: "#d9dde3", a1: lerp(1.05, 1.9, sprawl), a2: lerp(1.2, .3, sprawl), e1: .4, e2: .2, l1: .55, l2: -.5, k1: .6, k2: .6, lean: .2 + .15 * ch, crouch: 16 }); fx.save(); fx.translate(gx - 30 * sprawl, gy2); fx.rotate(-1.35 * sprawl); fx.translate(-gx, -gy2); person(gx, gy2, 162, gk); fx.restore(); });
    // shooter (team): skates in, shows the puck, goes around the goalie on the near side, lifts it in
    const sx = lerp(300, 1005, ease(seg(t, 0, 2.7)) * .55 + seg(t, 0, 2.7) * .45), lane = fyG + 20 + 34 * Math.sin(Math.PI * seg(t, 1.5, 2.8)) * .8 + 12 * seg(t, 1.5, 2.8);
    const sr = run(t, 7, .55), glide = t < 2.6, shootArm = seg(t, 2.55, 2.85);
    const sh = kit(T, { n: "8", lean: .32, l1: glide ? sr.l1 : .3, l2: glide ? sr.l2 : -.3, k1: glide ? sr.k1 : .5, k2: glide ? sr.k2 : .5, a1: lerp(.7, 1.0, shootArm) + (t > 3 ? 2.0 : 0), a2: lerp(.95, .5, shootArm) + (t > 3 ? 2.0 : 0), e1: t > 3 ? .05 : .6, e2: t > 3 ? .05 : .7, bob: glide ? sr.bob * .6 : 0 });
    const sd = personImpl(sx, lane, H, Object.assign({ dry: true }, sh));
    add(lane, () => { person(sx, lane, H, sh); onFront(() => { if (t < 3) { ctx.strokeStyle = "#7a5a2e"; ctx.lineWidth = 6; const pk = [sx + 70 + Math.sin(t * 5) * 26 * (1 - seg(t, 2.1, 2.6)), lane - 4]; line(sd.h1[0], sd.h1[1], pk[0] - 12, lane - 2); ctx.lineWidth = 9; line(pk[0] - 12, lane - 2, pk[0] - 30, lane - 1); } else { ctx.strokeStyle = "#7a5a2e"; ctx.lineWidth = 6; line(sd.h1[0], sd.h1[1], sd.h1[0] + 70, sd.h1[1] - 60); } }); });
    // teammates storm the ice after the goal
    [[0, 760], [.2, 700], [.4, 660]].forEach(([dl, x1], i) => { if (t < 3.2 + dl) return; const mv = seg(t, 3.2 + dl, 4.7), x = lerp(520 + i * 40, x1 + 190, ease(mv)), y = gy + 24 + i * 30, hop = t > 4.7 ? 16 * Math.abs(Math.sin((t - 4.7) * 6 + i)) : 0, rr = run(t, 7, .7); add(y, () => person(x, y - hop, H, kit(T, { n: String(14 + i * 5), a1: 2.85, a2: 2.7, e1: .05, e2: .05, l1: mv > 0 && mv < 1 ? rr.l1 : 0, l2: mv > 0 && mv < 1 ? rr.l2 : 0, k1: mv > 0 && mv < 1 ? rr.k1 : .1, k2: mv > 0 && mv < 1 ? rr.k2 : .1, lean: .15 }))); });
    flush();
    // puck
    let bx, by;
    if (t < 2.6) { bx = sd.h1[0] + 28 + 70 - 70 * 0 - 28 + Math.sin(t * 5) * 26 * (1 - seg(t, 2.1, 2.6)) + 44 - 44; bx = sx + 58 + Math.sin(t * 5) * 26 * (1 - seg(t, 2.1, 2.6)); by = lane - 6; }
    else if (t < 2.95) { const u = seg(t, 2.6, 2.95), p = arcPos([sx + 58, lane - 6], [GL + 36, ny - 100], u, 46); bx = p[0]; by = p[1]; }
    else { const s = seg(t, 2.95, 3.6); bx = lerp(GL + 36, GL + 52, s); by = lerp(ny - 100, ny - 12, s * s); }
    fball("puck", bx, by, 11, 0);
    banner(t, 3.1);
  }

  /* ---------- scene 4: baseball, walk-off home run ---------- */
  function baseball(t) {
    const gy = 458, dep = 126, PLATE = 250, FENCE = 1110, F = TMX;
    const cam = t < 1.7 ? 400 : t < 3.3 ? lerp(400, 930, ease(seg(t, 1.7, 3.1))) : lerp(930, 410, ease(seg(t, 4.3, 5.2)));
    look(cam); backdrop("#050a18", "#0e2744", "#14502a", gy);
    crowd(gy - 190, gy - 100, t, F.ez);
    lightGlow([cam - 260, cam + 300], gy - 230, 200);
    ctx.fillStyle = "#17602f"; ctx.fillRect(-2000, gy, 5200, dep);
    for (let x = -2000, i = 0; x < 3200; x += 70, i++) if (i % 2) { ctx.fillStyle = "rgba(255,255,255,.045)"; ctx.fillRect(x, gy, 70, dep); }
    ctx.fillStyle = "#8c6a45"; ctx.beginPath(); ctx.ellipse(PLATE + 40, gy + dep * .58, 190, dep * .52, 0, 0, 7); ctx.fill(); ctx.fillRect(PLATE, gy + dep * .45, 400, 26);
    ctx.fillStyle = "#6e5236"; ctx.beginPath(); ctx.ellipse(640, gy + dep * .6, 54, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#f4f4f4"; ctx.fillRect(626, gy + dep * .58, 28, 4);
    ctx.fillStyle = "#8c6a45"; ctx.fillRect(FENCE - 90, gy, 90, dep);
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 3; line(PLATE - 60, gy + dep - 2, FENCE, gy + dep - 2);
    ctx.fillStyle = "#f4f4f4"; ctx.beginPath(); ctx.moveTo(PLATE - 14, gy + dep * .58); ctx.lineTo(PLATE + 14, gy + dep * .58); ctx.lineTo(PLATE + 10, gy + dep * .58 + 9); ctx.lineTo(PLATE - 10, gy + dep * .58 + 9); ctx.closePath(); ctx.fill();
    // outfield wall in the home team's colour, foul pole, advertising band
    ctx.fillStyle = F.ez; ctx.fillRect(FENCE, gy - 112, 1600, 118); ctx.fillStyle = "#f2c230"; ctx.fillRect(FENCE, gy - 116, 1600, 6); ctx.fillStyle = "rgba(255,255,255,.25)"; for (let x = FENCE + 40; x < FENCE + 1600; x += 160) ctx.fillRect(x, gy - 80, 90, 18);
    ctx.fillStyle = "#f2c230"; ctx.fillRect(FENCE + 220, gy - 330, 7, 214);
    // fans catch up behind the wall once the ball goes over
    // players
    const T = TM, O = OP, kit = (k, o) => Object.assign({ col: k.j, pants: "#e6e9ee", shin: k.t, trim: k.t, num: k.num, hat: "cap", helmet: k.j, long: 0, shoe: "#14151a" }, o);
    const pitchT = .95, hitT = 1.6, sm = u => u * u * (3 - 2 * u);
    // pitcher (rival)
    const w = t < .3 ? 0 : t < .62 ? seg(t, .3, .62) * 2.8 : lerp(2.8, 1.1, seg(t, .62, pitchT));
    const pit = kit(O, { n: "44", d: -1, a1: t > pitchT ? lerp(1.1, .3, seg(t, pitchT, pitchT + .3)) : w, a2: .4, e1: .3, e2: .3, l1: t > .3 && t < .8 ? -1.0 : .1, k1: t > .3 && t < .8 ? 1.2 : .2, lean: t > .8 && t < 1.3 ? .35 : 0, pants: O.pn });
    const pd = personImpl(640, gy + dep * .6, H, Object.assign({ dry: true }, pit, { a1: 1.5, e1: .2 }));
    add(gy + dep * .6, () => person(640, gy + dep * .6, H, Object.assign({}, pit, t > 1.9 ? { a1: 2.6, a2: 2.5, e1: 1.2, e2: 1.2 } : {})));
    // catcher (rival) and umpire behind the plate
    add(gy + dep * .6 + 1, () => person(PLATE - 56, gy + dep * .6 + 1, 150, kit(O, { n: "12", d: 1, crouch: 38, l1: 1.25, l2: .9, k1: 1.6, k2: 1.5, a1: 1.1, a2: .9, e1: .4, e2: .4, lean: .1, glove: "#6b4a2b", hat: "bat", helmet: "#1b1c22", pants: O.pn })));
    add(gy + dep * .6 + 3, () => person(PLATE - 108, gy + dep * .6 + 3, 158, { col: "#23252b", pants: "#6f7480", shin: "#6f7480", trim: "#23252b", hat: "cap", helmet: "#17181c", d: 1, crouch: 20, l1: .7, l2: .5, k1: .9, k2: .8, a1: .5, a2: .4, e1: .4, e2: .4, lean: .12 }));
    // batter (team)
    const swing = ease(seg(t, 1.12, 1.52)), follow = ease(seg(t, 1.52, 1.95)), phi = t < 1.12 ? -.35 : t < 1.52 ? lerp(-.35, 1.4, swing) : lerp(1.4, 2.7, follow), aa = t < 1.12 ? .9 : t < 1.52 ? lerp(.9, 1.3, swing) : lerp(1.3, 2.4, follow);
    const bxp = PLATE - 4 + 40 * ease(seg(t, 2.0, 3.3)), byp = gy + dep * .6 + 2, jog = run(t, 8, .6), jogging = t > 2.0 && t < 3.3;
    const bt = kit(T, { n: "27", hat: "bat", helmet: T.j, a1: aa, a2: aa - .15, e1: .6, e2: .6, l1: jogging ? jog.l1 : (t > 1.3 ? .4 : .15), l2: jogging ? jog.l2 : -.1, k1: jogging ? jog.k1 : .3, k2: jogging ? jog.k2 : .3, lean: -.04 + (t > 1.5 && t < 2.0 ? .08 : 0), crouch: t < 1.1 ? 8 : 0 });
    const bd = personImpl(bxp, byp, H, Object.assign({ dry: true }, bt));
    add(byp, () => { person(bxp, byp, H, bt); onFront(() => { ctx.lineCap = "round"; const tip = (hh, p) => [hh[0] + Math.sin(p) * 96, hh[1] - Math.cos(p) * 96]; if (t < 2.15) { const tp = tip(bd.h1, phi); ctx.strokeStyle = "#caa46c"; ctx.lineWidth = 8; line(bd.h1[0], bd.h1[1], tp[0], tp[1]); } else { const u = seg(t, 2.15, 2.6); ctx.save(); ctx.translate(bd.h1[0] + 40 * u, byp - 8 - 38 * Math.sin(Math.PI * u)); ctx.rotate(u * 2.4); ctx.strokeStyle = "#caa46c"; ctx.lineWidth = 8; line(0, 0, 76, 0); ctx.restore(); } }); });
    // runner from third scores, then the dugout empties
    const rx = t < 1.7 ? 420 : lerp(420, PLATE + 36, ease(seg(t, 1.7, 3.2))), ry = gy + dep - 14, rr = run(t, 11, .95), running = t > 1.7 && t < 3.2;
    add(ry, () => person(rx, ry - (t > 3.3 ? 24 * Math.abs(Math.sin((t - 3.3) * 6)) : 0), H, kit(T, { n: "5", d: -1, hat: "bat", helmet: T.j, l1: running ? rr.l1 : 0, l2: running ? rr.l2 : 0, k1: running ? rr.k1 : .1, k2: running ? rr.k2 : .1, a1: t > 3.2 ? 2.85 : running ? rr.a1 : .25, a2: t > 3.2 ? 2.7 : running ? rr.a2 : .25, e1: t > 3.2 ? .05 : running ? rr.e1 : .2, e2: t > 3.2 ? .05 : running ? rr.e2 : .2, lean: running ? .2 : 0 })));
    [[0, 175, gy + dep * .15], [.2, 140, gy + dep * .4], [.4, 110, gy + dep * .92]].forEach(([dl, x1, y], i) => { const mv = seg(t, 3.4 + dl, 4.7 + dl), x = lerp(-120, x1 + 110, ease(mv)), hop = t > 4.7 + dl ? 22 * Math.abs(Math.sin((t - 4.7) * 6 + i * 2)) : 0, c = run(t, 11, .9); add(y, () => person(x, y - hop, H, kit(T, { n: String(30 + i * 7), hat: "cap", l1: mv > 0 && mv < 1 ? c.l1 : 0, l2: mv > 0 && mv < 1 ? c.l2 : 0, k1: mv > 0 && mv < 1 ? c.k1 : .1, k2: mv > 0 && mv < 1 ? c.k2 : .1, a1: t > 4.4 ? 2.85 : mv > 0 && mv < 1 ? c.a1 : .25, a2: t > 4.4 ? 2.7 : mv > 0 && mv < 1 ? c.a2 : .25, e1: t > 4.4 ? .05 : .3, e2: t > 4.4 ? .05 : .3, lean: .1 }))); });
    // the batter trots home last
    const hx2 = lerp(780, PLATE + 60, ease(seg(t, 4.6, 6.2))), hy2 = gy + dep * .66, hr = run(t, 8, .6), hm = t > 4.6 && t < 6.2;
    if (t > 4.6) add(hy2, () => person(hx2, hy2, H, kit(T, { n: "27", hat: "bat", helmet: T.j, d: -1, l1: hm ? hr.l1 : 0, l2: hm ? hr.l2 : 0, k1: hm ? hr.k1 : .1, k2: hm ? hr.k2 : .1, a1: 2.8, a2: 2.7, e1: .05, e2: .05, lean: .05 })));
    // right fielder (rival) runs back to the wall and leaps, but the ball is already over
    const ox = lerp(980, FENCE - 24, ease(seg(t, 1.9, 3.45))), oy = gy + dep * .55, oj = 60 * Math.sin(Math.PI * seg(t, 3.4, 4.1)), orun = run(t, 12, .95);
    add(oy, () => person(ox, oy - oj, H, kit(O, { n: "9", d: 1, l1: t > 1.9 && t < 3.4 ? orun.l1 : (oj > 4 ? .6 : 0), l2: t > 1.9 && t < 3.4 ? orun.l2 : (oj > 4 ? -.2 : 0), k1: t > 1.9 && t < 3.4 ? orun.k1 : .3, k2: t > 1.9 && t < 3.4 ? orun.k2 : .3, a1: t > 3.35 ? 2.95 : orun.a1, a2: t > 3.35 ? 2.7 : orun.a2, e1: t > 3.35 ? .05 : .6, e2: t > 3.35 ? .05 : .6, lean: t > 3.35 ? -.1 : .12, glove: "#6b4a2b", pants: O.pn })));
    flush();
    // ball
    const cont = (() => { const p = personImpl(bxp, byp, H, Object.assign({ dry: true }, bt, { a1: 1.3, a2: 1.15 })); return [p.h1[0] + Math.sin(1.4) * 96, p.h1[1] - Math.cos(1.4) * 96]; })();
    let bx, by, ba = t * 12;
    if (t < pitchT) { bx = pd.h1[0] - 6; by = pd.h1[1]; }
    else if (t < hitT) { const u = seg(t, pitchT, hitT), s0 = [pd.h1[0] - 20, pd.h1[1] - 12]; bx = lerp(s0[0], cont[0], u); by = lerp(s0[1], cont[1], u * u * .3 + u * .7); }
    else { const u = seg(t, hitT, 4.6), p = arcPos(cont, [FENCE + 190, gy - 190], u, 470); bx = p[0]; by = p[1]; }
    fball("baseball", bx, by, 10.5, ba);
    // fireworks over the stadium
    if (t > 3.9) for (let k = 0; k < 3; k++) { const a = (t - 3.9 - k * .45) / 1.5; if (a > 0 && a < 1) { const cx0 = FENCE + 120 + k * 160, cy0 = gy - 330 - k * 25; for (let i = 0; i < 22; i++) { const an = i / 22 * 6.283, rr2 = a * 90; ctx.fillStyle = ["#ffd24a", "#ff5a5a", "#6fc3ff"][k]; ctx.globalAlpha = 1 - a; disc(cx0 + Math.cos(an) * rr2, cy0 + Math.sin(an) * rr2 + a * a * 30, 2.6); } ctx.globalAlpha = 1; } }
    banner(t, 3.9);
  }

  const SCENES = { football, basketball, hockey, baseball };
  const LOOP = { football: 11, basketball: 10, hockey: 9.5, baseball: 11.5 };
  const STILL = { football: 6.0, basketball: 5.2, hockey: 4.2, baseball: 5.4 };

  /* ---------- main loop ---------- */
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, CH);
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, cf.width, cf.height);
    if (phase === "balls") {
      const k = reduce ? .25 : 1;
      for (const b of balls) {
        b.x += b.vx * dt * k; b.y += b.vy * dt * k; b.a += b.spin * dt * k;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } else if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); } else if (b.y > CH - b.r) { b.y = CH - b.r; b.vy = -Math.abs(b.vy); }
        const age = (now - b.pop) / 420, s = age < 1 ? 1 + .7 * Math.sin(Math.PI * age) : 1;
        ctx.globalAlpha = .95; ball(kind, b.x, b.y, b.r * s, b.a + (age < 1 ? age * 6 : 0)); ctx.globalAlpha = 1;
      }
    } else if (phase === "finale") {
      const f = SCENES[sport], L = LOOP[sport];
      const S = Math.min(W / 520, CH / 600); sc = { S, cx: 500, oy: CH / 2 - 300 * S };
      const t = frozen != null ? frozen : reduce ? STILL[sport] : ((now - finaleAt) / 1000) % L;
      ctx.save(); fx.save(); f(t); fx.restore(); ctx.restore(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (watching) { ctx.font = "600 14px -apple-system,Segoe UI,Roboto,sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText("Tap anywhere to go back", W / 2, CH - 22); }
    }
    if (phase === "none" || (phase === "finale" && (reduce || frozen != null))) { running = false; return; }
    requestAnimationFrame(frame);
  }

  /* ---------- "watch" mode: hides the page so the play fills the screen ---------- */
  function watch(on) { watching = on; document.body.classList.toggle("watch", on); if (on) start(); }
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "btn ghost"; btn.id = "watch"; btn.textContent = "Watch the winning play";
  btn.addEventListener("click", e => { e.stopPropagation(); watch(true); });
  const row = document.querySelector("#end .row"); if (row) row.prepend(btn);
  document.addEventListener("click", () => { if (watching) watch(false); });
  document.addEventListener("keydown", e => { if (watching && e.key === "Escape") watch(false); });

  window.Bg = { update, freeze(s, t) { phase = "finale"; sport = s; frozen = t; document.body.classList.add("finale"); start(); }, unfreeze() { frozen = null; } };
})();
