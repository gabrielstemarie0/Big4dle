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
    // soft top-left light and bottom-right shade, so every ball reads as a solid object on black
    const shade = (R, strength = 1) => { ctx.save(); ctx.rotate(-(a || 0)); const g = ctx.createRadialGradient(-R * .4, -R * .45, R * .05, 0, 0, R * 1.15); g.addColorStop(0, `rgba(255,255,255,${.4 * strength})`); g.addColorStop(.45, "rgba(255,255,255,0)"); g.addColorStop(1, `rgba(0,0,0,${.45 * strength})`); ctx.fillStyle = g; ctx.fillRect(-R * 1.6, -R * 1.6, R * 3.2, R * 3.2); ctx.restore(); };
    if (kind === "puck") {
      const ry = r * .52, th = r * .55, cyT = -th / 2, cyB = th / 2;   // top face centre / bottom face centre
      // thick cylinder wall, lit from the left, with a lighter lower edge so it never vanishes on black
      const wall = ctx.createLinearGradient(-r, 0, r, 0); wall.addColorStop(0, "#6a6a6e"); wall.addColorStop(.35, "#3a3a3e"); wall.addColorStop(.75, "#1c1c1f"); wall.addColorStop(1, "#2b2b2f");
      ctx.fillStyle = wall; ctx.beginPath(); ctx.moveTo(-r, cyT); ctx.lineTo(-r, cyB); ctx.ellipse(0, cyB, r, ry, 0, Math.PI, 0, true); ctx.lineTo(r, cyT); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(190,190,200,.55)"; ctx.lineWidth = Math.max(1, r * .07); ctx.beginPath(); ctx.ellipse(0, cyB, r, ry, 0, .12, Math.PI - .12); ctx.stroke();
      // top face: domed grey with a glossy highlight, bevelled rim and a printed ring
      const top = ctx.createRadialGradient(-r * .35, cyT - ry * .35, r * .05, 0, cyT, r * 1.05); top.addColorStop(0, "#8a8a90"); top.addColorStop(.5, "#505055"); top.addColorStop(1, "#2a2a2e");
      ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(0, cyT, r, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = Math.max(1, r * .06); ctx.beginPath(); ctx.ellipse(0, cyT, r * .72, ry * .72, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.beginPath(); ctx.ellipse(0, cyT + r * .03, r * .72, ry * .72, 0, .2, Math.PI - .2); ctx.stroke();
      const rim = ctx.createLinearGradient(-r, cyT - ry, r, cyT + ry); rim.addColorStop(0, "#e4e4ea"); rim.addColorStop(.5, "#8c8c92"); rim.addColorStop(1, "#4c4c52");
      ctx.strokeStyle = rim; ctx.lineWidth = Math.max(1.2, r * .09); ctx.beginPath(); ctx.ellipse(0, cyT, r, ry, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.ellipse(-r * .38, cyT - ry * .42, r * .26, ry * .12, -.35, 0, 7); ctx.fill();
      ctx.restore(); return;
    }
    ctx.rotate(a);
    if (kind === "football") {
      const rx = r * 1.4, ry = r * .8;
      const lemon = () => { ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.bezierCurveTo(-rx * .55, -ry * 1.45, rx * .55, -ry * 1.45, rx, 0); ctx.bezierCurveTo(rx * .55, ry * 1.45, -rx * .55, ry * 1.45, -rx, 0); ctx.closePath(); };
      lemon(); ctx.fillStyle = "#9a5428"; ctx.fill();
      ctx.save(); lemon(); ctx.clip();
      ctx.strokeStyle = "#fff"; ctx.lineCap = "butt"; ctx.lineWidth = r * .14; line(-rx * .62, -ry * 1.1, -rx * .62, ry * 1.1); line(rx * .62, -ry * 1.1, rx * .62, ry * 1.1);
      const ps = Math.sin(ph || 0), pc = Math.cos(ph || 0);   // spiral: laces roll around the long axis
      if (ph == null || pc > -.15) { ctx.strokeStyle = "#f4f1e8"; ctx.lineCap = "round"; ctx.lineWidth = r * .1 * Math.max(.35, pc); const yo = ps * ry * .75; line(-rx * .3, yo, rx * .3, yo); for (let i = -2; i <= 2; i++) line(i * rx * .13, yo - ry * .2 * Math.max(.35, pc), i * rx * .13, yo + ry * .2 * Math.max(.35, pc)); }
      shade(rx, .55);
      ctx.restore();
      lemon(); ctx.strokeStyle = "rgba(255,225,190,.35)"; ctx.lineWidth = Math.max(1, r * .06); ctx.stroke();
    } else if (kind === "baseball") {
      ctx.fillStyle = "#f7f4ec"; disc(0, 0, r);
      ctx.strokeStyle = "#d62839"; ctx.lineCap = "round"; ctx.lineWidth = r * .09;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * r * .55, -r * .8); ctx.quadraticCurveTo(s * r * .05, 0, s * r * .55, r * .8); ctx.stroke();
        for (let i = -3; i <= 3; i++) { const yy = i * r * .22, xx = s * (r * .26 + (1 - Math.abs(i) / 3.4) * 0 + Math.abs(i) * r * .06 + r * .05); line(xx - s * r * .1, yy - r * .05, xx + s * r * .1, yy + r * .05); }
      }
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip(); shade(r, .9); ctx.restore();
      ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = Math.max(1, r * .05); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    } else { // basketball
      ctx.fillStyle = "#f28c28"; disc(0, 0, r);
      ctx.strokeStyle = "#2b1a0a"; ctx.lineCap = "round"; ctx.lineWidth = r * .09;
      line(-r, 0, r, 0); line(0, -r, 0, r);
      ctx.beginPath(); ctx.moveTo(-r * .72, -r * .72); ctx.quadraticCurveTo(-r * .2, 0, -r * .72, r * .72);
      ctx.moveTo(r * .72, -r * .72); ctx.quadraticCurveTo(r * .2, 0, r * .72, r * .72); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip(); shade(r, 1); ctx.restore();
    }
    ctx.restore();
  }

  const ball = (...a) => ballImpl(...a);
  const fball = (...a) => onFront(() => ballImpl(...a));

  /* ---------- state ---------- */
  const KINDS = ["basketball", "baseball", "football", "puck"];
  let WIN = true, TM, OP, TMX = { ez: "#7a1f2b", trim: "#f4f4f4", nick: "" };
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
  function update(n, over, s, team, rival, won) {
    const prevWin = WIN; WIN = won !== false;
    if (team) {
      TM = kitFor(team);
      const r0 = rival ? { c1: rival.c1, c2: rival.c2, c3: rival.c3 } : { c1: "#2f3545", c2: "#9aa3b5", c3: "#d9dde3" };
      let rc = r0;
      if (dist(rc.c1, team.c1) < 85) rc = { c1: r0.c2, c2: r0.c1, c3: r0.c3 };                    // too close to the home jersey: try their second colour
      if (dist(rc.c1, team.c1) < 85) rc = { c1: "#f2f2f2", c2: r0.c1, c3: r0.c2 };               // still too close: away whites, rival colours as trim
      OP = kitFor(rc);
      TMX = { ez: ez(team), trim: lum(ez(team)) > .45 ? "#17181c" : "#f4f4f4", nick: (team.name.slice(team.city.length).trim() || team.name).toUpperCase() };
    }
    if (over) { if (phase !== "finale" || sport !== s || prevWin !== WIN) { phase = "finale"; sport = s; finaleAt = performance.now(); } }
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
    const d = o.d || 1, th = h * .235, sh = h * .235, tor = h * .34, ua = h * .19, fa = h * .17, lw = h * .1 * (o.fat || 1);
    const lean = o.lean || 0, hy = y - (th + sh) * .96 + (o.bob || 0) + (o.crouch || 0), hx = x;
    const sx = hx + Math.sin(lean) * d * tor, sy = hy - Math.cos(lean) * tor;
    const A = (bx, by, ang, len) => [bx + Math.sin(ang) * d * len, by + Math.cos(ang) * len];
    const l1 = o.l1 || 0, l2 = o.l2 || 0, k1 = o.k1 || 0, k2 = o.k2 || 0;
    const kn1 = A(hx, hy, l1, th), kn2 = A(hx, hy, l2, th), ft1 = A(kn1[0], kn1[1], l1 - k1, sh), ft2 = A(kn2[0], kn2[1], l2 - k2, sh);
    let a1 = o.a1 == null ? .25 : o.a1, a2 = o.a2 == null ? .25 : o.a2, e1 = o.e1 == null ? .25 : o.e1, e2 = o.e2 == null ? .25 : o.e2;
    // two-bone arm IK: o.t1 / o.t2 are points the hands should grip (the bat, the stick); the elbow sits below the line
    const ik = (tg, up) => {
      const dx = tg[0] - sx, dy = tg[1] - sy, dd = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(ua - fa) + 1), ua + fa - 1), base = Math.atan2(dy, dx);
      const al = Math.acos(Math.max(-1, Math.min(1, (ua * ua + dd * dd - fa * fa) / (2 * ua * dd))));
      const c = [base - al, base + al].map(th => [sx + Math.cos(th) * ua, sy + Math.sin(th) * ua, th]);
      const el = (up ? c[0][1] < c[1][1] : c[0][1] > c[1][1]) ? c[0] : c[1], hx2 = sx + Math.cos(base) * dd, hy2 = sy + Math.sin(base) * dd;
      const au = Math.atan2(Math.cos(el[2]) * d, Math.sin(el[2])), af = Math.atan2((hx2 - el[0]) * d, hy2 - el[1]);
      return [au, af - au];
    };
    if (o.t1) { const r = ik(o.t1, o.up1); a1 = r[0]; e1 = r[1]; }
    if (o.t2) { const r = ik(o.t2, o.up2); a2 = r[0]; e2 = r[1]; }
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
    const gy = 462, dep = 112, GL = 1260, EZ = 160, LOS = 430, F = TMX, W_ = WIN;
    const cam = lerp(500, 1120, ease(seg(t, 1.45, 4.2))) + (W_ ? lerp(0, -40, seg(t, 5.2, 6)) : -230 * ease(seg(t, 4.8, 6.6)));
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
    const wx = lerp(440, 1330, prog(seg(t, .15, 4.3))) + (W_ ? 32 : 4) * seg(t, 4.85, 5.7), juke = 15 * Math.sin(Math.PI * seg(t, .55, 1.6)), wy = gy + 40 + juke;
    const jump = 58 * Math.sin(Math.PI * seg(t, 3.95, 4.8)), running = t < 3.9 || (W_ && t > 4.8 && t < 5.7);
    const rc = run(t, 12.5, 1.05), up = t >= 3.9 && t < 4.85;
    const wr = kit(T, { n: "11", l1: running ? rc.l1 : (jump > 4 ? .9 : .1), l2: running ? rc.l2 : (jump > 4 ? -.4 : -.05), k1: running ? rc.k1 : (jump > 4 ? .3 : .2), k2: running ? rc.k2 : (jump > 4 ? 1.2 : .2), a1: up ? 2.85 : t > 4.85 ? (W_ ? (t > 5.5 ? 2.9 : .5) : 2.6) : rc.a1, a2: up ? 2.75 : t > 4.85 ? (W_ ? (t > 5.5 ? 2.7 : .4) : 2.5) : rc.a2, e1: up ? .05 : t > 4.85 ? (W_ ? (t > 5.5 ? .05 : 1.7) : 1.9) : rc.e1, e2: up ? .05 : t > 4.85 ? (W_ ? (t > 5.5 ? .05 : 1.5) : 1.8) : rc.e2, lean: up ? -.05 : rc.lean, bob: running ? rc.bob : 0 });
    const wd = (tt, dd) => personImpl(wx, wy, H, Object.assign({ dry: true }, wr));
    add(wy, () => person(wx, wy - jump, H, wr));
    const cbp = prog(seg(t, .3, 4.4)), cbx = lerp(495, 1275, cbp), cby = gy + 46, turned = t > 1.3, cr = run(t, 11.5);
    add(cby, () => person(cbx, cby - 40 * Math.sin(Math.PI * seg(t, 4.1, 4.9)), H, kit(O, Object.assign({ n: "24", d: turned ? 1 : -1 }, t < .3 ? { lean: .05, crouch: 8, l1: .3, l2: -.3, k1: .4, k2: .4, a1: .6, a2: .6, e1: .5, e2: .5 } : t < 1.3 ? Object.assign({}, cr, { l1: -cr.l1 * .5, l2: -cr.l2 * .5, lean: -.05 }) : t < 4.1 ? Object.assign({}, cr, { lean: .2 }) : { l1: .3, l2: -.2, k1: .5, k2: .5, a1: 2.3, a2: 2.0, e1: .1, e2: .1 }))));
    const tI = 4.3, ixx = 1195;
    const sx2 = W_ ? lerp(900, 1250, ease(seg(t, 1.8, 4.6))) : (t < 4.8 ? lerp(900, ixx, ease(seg(t, 1.8, tI))) : ixx - 210 * ease(seg(t, 4.8, 6.6))), sy2 = gy + 84, sj = W_ ? 45 * Math.sin(Math.PI * seg(t, 4.35, 5.05)) : 58 * Math.sin(Math.PI * seg(t, 3.85, 4.75));
    const sRun = run(t, 12.5, 1.05), sPose = W_ ? (t < 4.35 ? Object.assign(run(t, 12), { lean: .2 }) : { a1: 2.5, a2: 2.4, e1: .1, e2: .1, k1: .5, k2: .5, l1: .5, l2: -.3 })
      : t < 3.85 ? Object.assign(run(t, 12), { lean: .2 }) : t < 4.78 ? { a1: 2.9, a2: 2.8, e1: .05, e2: .05, k1: .5, k2: .8, l1: .6, l2: -.2 } : Object.assign({}, sRun, { a1: .55, e1: 1.75, lean: .18 });
    add(sy2, () => person(sx2, sy2 - sj, H, kit(O, Object.assign({ n: "31", d: (W_ || t < 4.78) ? 1 : -1 }, sPose))));
    const rx = GL + 34, ry = gy + 102, sig = W_ ? seg(t, 5.0, 5.4) : 0;
    add(ry, () => person(rx, ry, H, { col: "#eceff3", pants: "#1b1b1f", trim: "#1b1b1f", shin: "#1b1b1f", hat: "cap", helmet: "#1b1b1f", d: -1, a1: lerp(.25, 2.9, ease(sig)), a2: lerp(.25, 2.9, ease(sig)), e1: .05, e2: .05, l1: t > 3 ? .1 : 0 }));
    flush();
    // ball: spiral through the air
    const R = [qd.h1[0] + 8, qd.h1[1] - 10], Cp = (() => { const wp = personImpl(wx, wy - 58 * Math.sin(Math.PI * seg(4.35, 3.95, 4.8)), H, Object.assign({ dry: true }, wr, { a1: 2.85, a2: 2.75, e1: .05, e2: .05, bob: 0 })); return [1330 + 4 + 0, wp.h1[1]]; })();
    let bx, by, ba = 0;
    const rcv = personImpl(wx, wy - jump, H, Object.assign({ dry: true }, wr));
    // lost round: the safety jumps the route and intercepts the pass, then runs it back
    const sdry = (tt, jj) => personImpl(tt < 4.78 ? ixx : sx2, sy2 - jj, H, { dry: true, d: tt < 4.78 ? 1 : -1, a1: 2.9, a2: 2.8, e1: .05, e2: .05, k1: .5, k2: .8, l1: .6, l2: -.2 }).h1;
    const Ipt = (() => { const h = sdry(4.3, 58 * Math.sin(Math.PI * seg(4.3, 3.85, 4.75))); return [h[0] + 2, h[1] - 4]; })();
    if (t < 1.65) { bx = qd.h1[0] + 4; by = qd.h1[1]; ba = -.35; }
    else if (W_ && t < 4.35) { const u = seg(t, 1.65, 4.35), p0 = arcPos(R, Cp, u, 300), p1 = arcPos(R, Cp, Math.min(1, u + .01), 300); bx = p0[0]; by = p0[1]; ba = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); }
    else if (!W_ && t < 4.3) { const u = seg(t, 1.65, 4.3), p0 = arcPos(R, Ipt, u, 280), p1 = arcPos(R, Ipt, Math.min(1, u + .01), 280); bx = p0[0]; by = p0[1]; ba = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); }
    else if (!W_) { const h = personImpl(sx2, sy2 - sj, H, Object.assign({ dry: true }, sPose, { d: t < 4.78 ? 1 : -1 })).h1; bx = h[0] + (t < 4.78 ? 2 : -2); by = h[1] - 3; ba = -.3; }
    else { bx = rcv.h1[0] + 4; by = rcv.h1[1] - 4; ba = t > 5.5 ? -1.1 : -.4; }
    fball("football", bx, by, 13.5, ba, t * 34);
    if (W_) banner(t, 5.0);
  }

  /* ---------- scene 2: basketball, half-court buzzer beater ---------- */
  function basketball(t) {
    const gy = 458, dep = 124, hx = 1060, fyH = gy + 62, rimY = fyH - 262, rimX = hx - 36, F = TMX, W_ = WIN;
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
    onFront(() => {   // the hoop, net and clock sit on the front layer so the game board never hides them
    ctx.strokeStyle = "#4a4f5a"; ctx.lineWidth = 14; ctx.lineCap = "round"; line(hx + 70, fyH + 8, hx + 70, rimY - 70); line(hx + 70, rimY - 70, hx + 4, rimY - 60);
    ctx.fillStyle = "#e9eef5"; ctx.fillRect(hx - 6, rimY - 108, 12, 128);
    if (buzz) { ctx.fillStyle = `rgba(255,40,40,${.5 + .5 * Math.sin(t * 18)})`; ctx.fillRect(hx - 12, rimY - 114, 4, 140); ctx.fillRect(hx + 8, rimY - 114, 4, 140); ctx.fillRect(hx - 12, rimY - 114, 24, 4); }
    const rs = (!W_ && t > swish) ? Math.sin((t - swish) * 38) * 3 * Math.exp(-(t - swish) * 5) : 0;
    ctx.strokeStyle = "#ff5a1f"; ctx.lineWidth = 6; line(rimX - 14, rimY + rs, hx - 6, rimY + rs);
    const sw = W_ && t > swish ? Math.sin((t - swish) * 18) * 7 * Math.exp(-(t - swish) * 3) : 0;
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2;
    for (let i = 0; i <= 5; i++) line(rimX - 12 + i * 8.6, rimY, rimX - 6 + i * 6 + sw, rimY + 58);
    line(rimX - 9 + sw * .4, rimY + 20, rimX + 28 + sw * .4, rimY + 20); line(rimX - 5 + sw * .8, rimY + 40, rimX + 22 + sw * .8, rimY + 40);
    ctx.fillStyle = "rgba(0,0,0,.82)"; ctx.fillRect(hx - 150, rimY - 190, 150, 56);
    ctx.font = "700 36px ui-monospace,Menlo,monospace"; ctx.textAlign = "center"; ctx.fillStyle = buzz ? (Math.sin(t * 18) > 0 ? "#ff4040" : "#a02020") : "#ff9a3c";
    ctx.fillText(`0:0${Math.max(0, 3 - t * 3 / 1.7).toFixed(1)}`, hx - 75, rimY - 150);
    });
    // --- players
    const T = TM, O = OP, kit = (k, o) => Object.assign({ col: k.j, pants: k.j, trim: k.t, num: k.num, short: 1, shortLeg: 1, shoe: k.t, n: "", glove: null }, o);
    const sm = u => u * u * (3 - 2 * u);
    const sx = lerp(200, 330, sm(seg(t, 0, 1.25))), sy = gy + 60, cel = t > swish && W_, sad = t > swish && !W_;
    const CHEER = { a1: 2.85, a2: 2.7, e1: .05, e2: .05, l1: .1, l2: -.1, k1: .3, k2: .3, lean: 0, crouch: 0, d: 1 };
    const dr = run(t, 9, .75), dribbling = t < 1.15, gather = ease(seg(t, 1.1, 1.65)), leap = 28 * Math.sin(Math.PI * seg(t, 1.35, 2.05));
    const shooter = kit(T, { n: "7", hat: null, l1: dribbling ? dr.l1 : (leap > 2 ? .35 : 0), l2: dribbling ? dr.l2 : (leap > 2 ? -.2 : 0), k1: dribbling ? dr.k1 : (leap > 2 ? .6 : .3 * (1 - gather)), k2: dribbling ? dr.k2 : (leap > 2 ? .9 : .3 * (1 - gather)), a1: dribbling ? .55 : lerp(.8, t > 1.7 ? 2.7 : 2.1, gather), a2: dribbling ? .2 : lerp(.8, t > 1.7 ? 2.55 : 1.9, gather), e1: dribbling ? .9 : lerp(1.4, .1, gather), e2: dribbling ? .3 : lerp(1.2, .1, gather), lean: dribbling ? .22 : lerp(.1, -.1, gather), bob: dribbling ? dr.bob : 0, crouch: dribbling ? 0 : 14 * (1 - gather) });
    const shy = sy - (cel ? 28 * Math.abs(Math.sin((t - swish) * 6)) : leap), sd = personImpl(sx, shy, H, Object.assign({ dry: true }, shooter, cel ? { a1: 2.8, a2: 2.7, e1: .05, e2: .05 } : sad ? { a1: 2.45, a2: 2.35, e1: 1.8, e2: 1.7 } : {}));
    add(sy, () => person(sx, shy, H, Object.assign({}, shooter, cel ? { a1: 2.8, a2: 2.7, e1: .05, e2: .05, l1: .1, l2: -.1, k1: .3, k2: .3, crouch: 0 } : sad ? { a1: 2.45, a2: 2.35, e1: 1.8, e2: 1.7, l1: .1, l2: -.1, k1: .4, k2: .4, crouch: 10, lean: .18 } : {})));
    // defender starts in front of the shooter and is left behind by the crossover, then contests too late
    const dx = lerp(300, 380, sm(seg(t, .15, 1.6))) - 6 * Math.sin(Math.PI * seg(t, .75, 1.2)), dy = gy + 58, dj = 38 * Math.sin(Math.PI * seg(t, 1.5, 2.15));
    const stumble = t > .75 && t < 1.3, dd = run(t, 8.5, .6);
    add(dy + 2, () => person(dx, dy - dj - (sad ? 26 * Math.abs(Math.sin((t - swish) * 6)) : 0), H, kit(O, Object.assign({ n: "3", d: t < 1.0 ? -1 : 1, l1: dj > 4 ? .3 : (t < 1.0 ? .4 : dd.l1), l2: dj > 4 ? -.2 : (t < 1.0 ? -.4 : dd.l2), k1: dj > 4 ? .6 : .5, k2: dj > 4 ? .8 : .5, a1: dj > 4 ? 2.9 : (t < 1.0 ? 1.3 : dd.a1), a2: dj > 4 ? 2.4 : (t < 1.0 ? -.5 : dd.a2), e1: .15, e2: .4, lean: stumble ? -.28 : .12, crouch: t < 1.0 ? 12 : 0 }, sad ? CHEER : {}))));
    const h2x = lerp(430, 392, seg(t, .4, 1.6));
    add(gy + 96, () => person(h2x, gy + 96 - 30 * Math.sin(Math.PI * seg(t, 1.65, 2.2)) - (sad ? 26 * Math.abs(Math.sin((t - swish) * 6 + 1)) : 0), H, kit(O, Object.assign({ n: "21", d: -1, a1: t > 1.6 ? 2.7 : 1.1, a2: t > 1.6 ? 2.4 : 1.0, e1: .1, e2: .1, l1: .3, l2: -.3, k1: .5, k2: .5, crouch: t > 1.6 ? 0 : 10 }, sad ? CHEER : {}))));
    [[150, gy + 30, 0], [230, gy + 100, .25]].forEach(([x0, y, dl]) => { const j = cel ? 30 * Math.abs(Math.sin((t - swish - dl) * 6)) : 0, mv = W_ ? seg(t, swish + .2, swish + 1.4) : 0, x = lerp(x0, 355 - dl * 60, ease(mv)); add(y, () => person(x, y - j, H, kit(T, { n: String(10 + Math.round(dl * 8)), a1: sad ? 2.4 : cel ? 2.8 : .25, a2: sad ? 2.3 : cel ? 2.7 : .25, e1: sad ? 1.8 : cel ? .05 : .2, e2: sad ? 1.7 : cel ? .05 : .2, l1: mv > 0 && mv < 1 ? Math.sin(t * 12) * .8 : 0, l2: mv > 0 && mv < 1 ? -Math.sin(t * 12) * .8 : 0, k1: mv > 0 && mv < 1 ? .8 : .1, k2: mv > 0 && mv < 1 ? .8 : .1 }))); });
    flush();
    // ball: dribble, release, high arc with backspin, swish and bounce
    let bx, by, br = -t * 7;
    if (t < 1.1) { bx = sx + 26; by = fyH + 2 - 100 * Math.abs(Math.sin(t * 5.4)) - 14; }
    else if (t < 1.7) { bx = sd.h1[0]; by = sd.h1[1] - 6; }
    else if (t < swish) { const u = seg(t, 1.7, swish); const p = arcPos([sd.h1[0], sd.h1[1] - 8], W_ ? [rimX + 12, rimY + 4] : [rimX - 10, rimY - 8], u, 250); bx = p[0]; by = p[1]; }
    else if (!W_) { const s = t - swish, fl = fyH - 17, x0 = rimX - 10, y0 = rimY - 8, sf = (230 + Math.sqrt(230 * 230 + 4 * 560 * (fl - y0))) / 1120; bx = x0 - 70 * Math.min(s, sf) - 26 * Math.max(0, s - sf); by = y0 - 230 * s + 560 * s * s; if (s > sf) { const b = s - sf; by = fl - 62 * Math.abs(Math.sin(b * 6)) * Math.exp(-b * 1.8); } }
    else { const s = t - swish, fl = fyH - 17; bx = rimX + 12 - Math.max(0, s - .55) * 90; by = rimY + 4 + 720 * s * s; if (by > fl) { const b = s - Math.sqrt((fl - rimY - 4) / 720); by = fl - 90 * Math.abs(Math.sin(b * 5.5)) * Math.exp(-b * 1.6); } }
    fball("basketball", bx, by, 15, br);
    if (W_) banner(t, 4.0);
  }

  /* ---------- scene 3: hockey, shootout winner ---------- */
  function hockey(t) {
    const gy = 466, dep = 112, GL = 1040, F = TMX, W_ = WIN, mix = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
    const cam = lerp(560, 810, ease(seg(t, .3, 2.5)));
    look(cam); backdrop("#060d18", "#102239", "#bcd8e8", gy);
    crowd(gy - 150, gy - 74, t, F.ez);
    ctx.fillStyle = "#cfdce6"; ctx.fillRect(-2000, gy - 74, 5200, 74);
    ctx.fillStyle = F.ez; ctx.fillRect(-2000, gy - 30, 5200, 12); ctx.fillStyle = "rgba(190,225,255,.18)"; ctx.fillRect(-2000, gy - 150, 5200, 76);
    ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 3; for (let x = -2000; x < 3200; x += 120) line(x, gy - 150, x, gy);
    ctx.fillStyle = "#bcd8e8"; ctx.fillRect(-2000, gy, 5200, dep);
    const T = TM, O = OP, kit = (k, o) => Object.assign({ col: k.j, pants: k.pn, shin: k.pn, trim: k.t, num: k.num, hat: "hk", helmet: k.j, long: 1, skate: 1, shoe: "#14151a" }, o);
    // ice markings, lined up with the goal line
    ctx.lineCap = "butt"; ctx.fillStyle = "rgba(210,40,60,.85)"; ctx.fillRect(GL - 2, gy, 4, dep);
    ctx.fillStyle = "rgba(40,90,200,.35)"; ctx.fillRect(GL - 85, gy + 6, 85, dep - 12); ctx.strokeStyle = "rgba(40,90,200,.9)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(GL, gy + dep / 2, 85, dep / 2 - 8, 0, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = "rgba(210,40,60,.8)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(640, gy + dep / 2, 90, 44, 0, 0, 7); ctx.stroke(); ctx.fillStyle = "rgba(210,40,60,.9)"; disc(640, gy + dep / 2, 5);
    ctx.fillStyle = "rgba(40,90,200,.7)"; ctx.fillRect(250, gy, 8, dep);
    // --- the goal, drawn at an angle so its open mouth (between the near and far post) faces the shooter
    const ny = gy + 62, goal = W_ && t > 2.98, rip = goal ? Math.sin((t - 2.98) * 20) * 5 * Math.exp(-(t - 2.98) * 3) : 0;
    const M1 = [GL, ny], M2 = [GL, ny - 118], M3 = [GL + 26, ny - 134], M4 = [GL + 26, ny - 22], B1 = [GL + 56 + rip, ny - 2], B2 = [GL + 56 + rip, ny - 106], B3 = [GL + 82 + rip, ny - 124], B4 = [GL + 82 + rip, ny - 22];
    const mesh = (P, Q, R, S2, n, m) => { for (let i = 0; i <= n; i++) { const p = mix(P, Q, i / n), q = mix(S2, R, i / n); line(p[0], p[1], q[0], q[1]); } for (let j = 0; j <= m; j++) { const p = mix(P, S2, j / m), q = mix(Q, R, j / m); line(p[0], p[1], q[0], q[1]); } };
    ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(255,255,255,.32)"; mesh(B1, B2, B3, B4, 7, 6); mesh(M4, M3, B3, B4, 6, 4); mesh(M2, M3, B3, B2, 6, 4);
    ctx.strokeStyle = "#d62839"; ctx.lineWidth = 7; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(M4[0], M4[1]); ctx.lineTo(M3[0], M3[1]); ctx.lineTo(M2[0], M2[1]); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(214,40,57,.8)"; ctx.beginPath(); ctx.moveTo(B1[0], B1[1]); ctx.lineTo(B4[0], B4[1]); ctx.moveTo(B2[0], B2[1]); ctx.lineTo(B3[0], B3[1]); ctx.moveTo(M2[0], M2[1]); ctx.lineTo(B2[0], B2[1]); ctx.moveTo(M3[0], M3[1]); ctx.lineTo(B3[0], B3[1]); ctx.moveTo(M1[0], M1[1]); ctx.lineTo(B1[0], B1[1]); ctx.moveTo(M4[0], M4[1]); ctx.lineTo(B4[0], B4[1]); ctx.stroke();
    if (goal) { ctx.save(); ctx.fillStyle = `rgba(255,50,50,${.55 + .45 * Math.sin(t * 20)})`; ctx.shadowColor = "#ff2020"; ctx.shadowBlur = 40; disc(GL + 36, ny - 168, 16); ctx.restore(); }
    // --- shooter (team): carries the puck in, winds up, strikes and follows through
    const SXE = W_ ? 945 : 868, sxAt = tt => lerp(300, SXE, ease(seg(tt, 0, 2.6))) + 26 * ease(seg(tt, 2.7, 3.6));
    const sx = sxAt(t), lane = gy + 74 + (W_ ? 12 * Math.sin(Math.PI * seg(t, 1.7, 2.7)) : 0), iceY = lane - 3;
    const px0 = sx + 62 + Math.sin(t * 5) * 24 * (1 - seg(t, 2.1, 2.45));
    const carryB = [px0 - 8, iceY], carryG = [sx + 14, lane - 118], backB = [px0 - 70, iceY - 30], backG = [sx - 10, lane - 150], hitB = [px0 - 4, iceY], hitG = [sx + 22, lane - 112], folB = [px0 + 60, iceY - 52], folG = [sx + 40, lane - 124];
    let B, Gt, lean;
    if (t < 2.42) { B = carryB; Gt = carryG; lean = .32; }
    else if (t < 2.60) { const u = ease(seg(t, 2.42, 2.60)); B = mix(carryB, backB, u); Gt = mix(carryG, backG, u); lean = lerp(.32, .12, u); }
    else if (t < 2.68) { const u = seg(t, 2.60, 2.68); B = [lerp(backB[0], hitB[0], u), lerp(backB[1], hitB[1], u * u)]; Gt = mix(backG, hitG, u); lean = lerp(.12, .4, u); }
    else { const u = ease(seg(t, 2.68, 3.05)); B = mix(hitB, folB, u); Gt = mix(hitG, folG, u); lean = lerp(.4, .28, u); }
    const Gb = mix(Gt, B, .34), stickOn = t < 3.15, glide = t < 2.45, sr = run(t, 7, .55);
    const post = !W_ ? { a1: 2.5, a2: 2.4, e1: 1.7, e2: 1.6, lean: .22 } : { a1: 2.85, a2: 2.7, e1: .05, e2: .05, lean: .12 };
    const sh = kit(T, Object.assign({ n: "8", lean, l1: glide ? sr.l1 : .3, l2: glide ? sr.l2 : -.3, k1: glide ? sr.k1 : .5, k2: glide ? sr.k2 : .5, bob: glide ? sr.bob * .6 : 0 }, stickOn ? { t1: Gt, t2: Gb } : post));
    const shd = personImpl(sx, lane, H, Object.assign({ dry: true }, sh));
    add(lane, () => {
      person(sx, lane, H, sh);
      onFront(() => {
        ctx.lineCap = "round"; ctx.strokeStyle = "#7a5a2e"; ctx.lineWidth = 5;
        if (stickOn) { const tx = Gt[0] + (Gt[0] - B[0]) * .16, ty = Gt[1] + (Gt[1] - B[1]) * .16; line(B[0], B[1], tx, ty); ctx.lineWidth = 8; line(B[0] - 3, B[1] + 1, B[0] + 20, B[1] + 2); }
        else if (W_) { ctx.lineWidth = 5; line(shd.h1[0] - 12, shd.h1[1] + 34, shd.h1[0] + 30, shd.h1[1] - 78); }
        else { ctx.lineWidth = 5; line(shd.h1[0], shd.h1[1], shd.h1[0] + 62, iceY - 2); ctx.lineWidth = 8; line(shd.h1[0] + 56, iceY - 2, shd.h1[0] + 78, iceY - 1); }
      });
    });
    // --- goalie (rival): faces the shooter, comes out to challenge; either dives and is beaten, or makes the save
    const gyL = gy + 50, ch = ease(seg(t, .5, 1.8)), sprawl = W_ ? ease(seg(t, 2.2, 2.75)) : 0;
    const gxB = W_ ? lerp(GL - 36, 890, ch) : lerp(GL - 36, GL - 30, ch);
    const gOpt = W_ ? { a1: lerp(1.15, 2.0, sprawl), a2: lerp(1.0, .6, sprawl), e1: .35, e2: .3 } : { a1: t < 2.45 ? 1.15 : t < 3.3 ? 2.15 : 2.85, a2: t < 3.3 ? 1.0 : 2.8, e1: t < 3.3 ? .35 : .05, e2: t < 3.3 ? .3 : .05 };
    const gk = kit(O, Object.assign({ n: "31", hat: "gk", d: -1, fat: 1.45, helmet: O.t, trim: O.t, glove: "#d9dde3", pants: O.pn, l1: .65, l2: -.5, k1: .55, k2: .55, lean: .18 + .12 * ch, crouch: W_ ? 16 : (t > 3.3 ? 0 : 16) }, gOpt));
    const gl = personImpl(gxB, gyL, 162, Object.assign({ dry: true }, gk, { a1: 2.15, e1: .35, crouch: 16 })).h1;
    add(gyL, () => { fx.save(); fx.translate(gxB - 38 * sprawl, gyL); fx.rotate(-1.35 * sprawl); fx.translate(-gxB, -gyL); person(gxB, gyL, 162, gk); fx.restore(); });
    // --- the shooter's team storms the ice after a goal; the goalie's team does after a save
    const rushers = W_ ? [[0, 905, gy + 32, T], [.2, 868, gy + 62, T], [.4, 830, gy + 96, T]] : [[0, 968, gy + 30, O], [.2, 936, gy + 70, O], [.4, 904, gy + 98, O]];
    rushers.forEach(([dl, x1, y, K], i) => { const t0 = W_ ? 3.2 : 3.35; if (t < t0 + dl) return; const mv = seg(t, t0 + dl, t0 + 1.6), x = lerp(520 + i * 40, x1, ease(mv)), hop = t > t0 + 1.6 ? 14 * Math.abs(Math.sin((t - t0 - 1.6) * 6 + i)) : 0, rr = run(t, 7, .7); add(y, () => person(x, y - hop, H, kit(K, { n: String(14 + i * 5), a1: 2.85, a2: 2.7, e1: .05, e2: .05, l1: mv > 0 && mv < 1 ? rr.l1 : 0, l2: mv > 0 && mv < 1 ? rr.l2 : 0, k1: mv > 0 && mv < 1 ? rr.k1 : .1, k2: mv > 0 && mv < 1 ? rr.k2 : .1, lean: .15 }))); });
    // snow spray where the shooter stops
    if (t > 3.0 && t < 3.8) for (let i = 0; i < 22; i++) { const a = seg(t, 3.0, 3.8), px = sx + 20 + hash(i) * 60 * a, py = lane - hash(i + 9) * 40 * Math.sin(a * 3), r2 = 3 * (1 - a); ctx.fillStyle = `rgba(255,255,255,${.9 * (1 - a)})`; disc(px, py, r2 + 1); }
    flush();
    // --- puck
    const sStart = [sxAt(2.68) + 62, (gy + 74 + (W_ ? 12 * Math.sin(Math.PI * seg(2.68, 1.7, 2.7)) : 0)) - 6], Tn = [GL + 10, ny - 108], tHit = 2.8;
    let bx, by;
    if (t < 2.68) { bx = px0; by = iceY - 3; }
    else if (W_ && t < 2.98) { const p = arcPos(sStart, Tn, seg(t, 2.68, 2.98), 34); bx = p[0]; by = p[1]; }
    else if (W_) { const s2 = seg(t, 2.98, 3.6); bx = lerp(Tn[0], GL + 58, s2); by = lerp(Tn[1], ny - 12, s2 * s2); }
    else if (t < tHit) { const p = arcPos(sStart, gl, seg(t, 2.68, tHit), 22); bx = p[0]; by = p[1]; }
    else { const s2 = t - tHit; bx = gl[0] - 60 * Math.min(s2, .9); by = Math.min(iceY - 3, gl[1] - 36 * s2 + 520 * s2 * s2); }
    fball("puck", bx, by, 11, 0);
    // near side of the net and the near post are drawn last, so the puck passes behind them
    onFront(() => { ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(255,255,255,.4)"; mesh(M1, M2, B2, B1, 6, 7); ctx.strokeStyle = "#d62839"; ctx.lineWidth = 8; ctx.lineCap = "round"; line(M1[0], M1[1], M2[0], M2[1]); });
    if (W_) banner(t, 3.1);
  }

  /* ---------- scene 4: baseball, walk-off home run ---------- */
  function baseball(t) {
    const gy = 458, dep = 126, PLATE = 250, FENCE = 1110, F = TMX, W_ = WIN;
    const cam = !W_ ? 400 : t < 1.7 ? 400 : t < 3.3 ? lerp(400, 930, ease(seg(t, 1.7, 3.1))) : lerp(930, 410, ease(seg(t, 4.3, 5.2)));
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
    const pitchT = .95, s0 = W_ ? 1.12 : .98, tC = s0 + .4, arrive = W_ ? tC : 1.73, byG = gy + dep * .6, mix = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
    // --- pitcher (rival)
    const w = t < .3 ? 0 : t < .62 ? seg(t, .3, .62) * 2.8 : lerp(2.8, 1.1, seg(t, .62, pitchT));
    const pit = kit(O, { n: "44", d: -1, a1: t > pitchT ? lerp(1.1, .3, seg(t, pitchT, pitchT + .3)) : w, a2: .4, e1: .3, e2: .3, l1: t > .3 && t < .8 ? -1.0 : .1, k1: t > .3 && t < .8 ? 1.2 : .2, lean: t > .8 && t < 1.3 ? .35 : 0, pants: O.pn });
    const pd = personImpl(640, byG, H, Object.assign({ dry: true }, pit, { a1: 1.5, e1: .2 }));
    const pcel = !W_ && t > 1.95, pjump = pcel ? 16 * Math.abs(Math.sin((t - 1.95) * 7)) : 0;
    add(byG, () => person(640, byG - pjump, H, Object.assign({}, pit, pcel ? { a1: 2.8, a2: 2.7, e1: .05, e2: .05, l1: .1, k1: .2, lean: 0 } : t > 1.9 ? { a1: 2.6, a2: 2.5, e1: 1.2, e2: 1.2 } : {})));
    // --- catcher and umpire behind the plate
    const cOpt = kit(O, { n: "12", d: 1, crouch: 38, l1: 1.25, l2: .9, k1: 1.6, k2: 1.5, a1: 1.1, a2: .9, e1: .4, e2: .4, lean: .1, glove: "#6b4a2b", hat: "bat", helmet: "#1b1c22", pants: O.pn });
    const cg = personImpl(PLATE - 56, byG + 1, 150, Object.assign({ dry: true }, cOpt)).h1;
    add(byG + 1, () => person(PLATE - 56, byG + 1, 150, !W_ && t > 1.85 ? Object.assign({}, cOpt, { crouch: 14, l1: .5, l2: .3, k1: .7, k2: .6, a1: 2.0, e1: .3, lean: -.05 }) : cOpt));
    add(byG + 3, () => person(PLATE - 108, byG + 3, 158, { col: "#23252b", pants: "#6f7480", shin: "#6f7480", trim: "#23252b", hat: "cap", helmet: "#17181c", d: 1, crouch: 20, l1: .7, l2: .5, k1: .9, k2: .8, a1: !W_ && t > 1.85 ? 2.85 : .5, a2: .4, e1: !W_ && t > 1.85 ? .05 : .4, e2: .4, lean: .12 }));
    // --- batter (team): hands lead, the bat head lags and whips through, then the bat wraps up over the shoulder
    const bxp = PLATE - 4 + (W_ ? 40 * ease(seg(t, 2.0, 3.3)) : 0), byp = byG + 2;
    const swingPose = (tt) => {
      const u = clamp((tt - s0) / .4, 0, 1), f = ease(clamp((tt - tC) / .45, 0, 1));
      let G, phi, lean;
      if (tt < s0 - .12) { G = [bxp + 8, byp - 150]; phi = -.55; lean = .0; }
      else if (tt < s0) { const k = ease((tt - (s0 - .12)) / .12); G = [lerp(bxp + 8, bxp - 8, k), lerp(byp - 150, byp - 154, k)]; phi = lerp(-.55, -.75, k); lean = lerp(0, -.1, k); }
      else if (tt < tC) { G = [lerp(bxp - 8, bxp + 60, ease(u)), lerp(byp - 154, byp - 112, Math.pow(u, .8))]; phi = -.75 + 2.25 * Math.pow(u, 2.4); lean = lerp(-.1, .28, ease(u)); }
      else { G = [lerp(bxp + 60, bxp + 16, f), lerp(byp - 112, byp - 166, f)]; phi = lerp(1.5, -.9, f); lean = lerp(.28, .1, f); }
      return { G, phi, lean };
    };
    const sp = swingPose(Math.min(t, tC + .45)), ikOn = t < tC + .5, jog = run(t, 8, .6), jogging = W_ && t > 2.0 && t < 3.3;
    const bOpt = kit(T, Object.assign({ n: "27", hat: "bat", helmet: T.j, l1: jogging ? jog.l1 : (t > s0 - .12 && t < tC + .2 ? .5 : .15), l2: jogging ? jog.l2 : -.2, k1: jogging ? jog.k1 : (t > s0 - .12 ? .5 : .3), k2: jogging ? jog.k2 : .3, crouch: t < s0 ? 10 : 0 },
      ikOn ? { t1: sp.G, t2: [sp.G[0] - 5, sp.G[1] + 7], lean: sp.lean } : (W_ ? { a1: .6, a2: .5, e1: .6, e2: .6, lean: .08 } : { a1: 2.5, a2: 2.4, e1: 1.8, e2: 1.7, lean: .2 })));
    const tipOf = (G, phi) => [G[0] + Math.sin(phi) * 96, G[1] - Math.cos(phi) * 96];
    const tDrop = W_ ? 2.15 : 2.35, spEnd = swingPose(tC + .45);
    add(byp, () => { person(bxp, byp, H, bOpt); onFront(() => { ctx.lineCap = "round"; const drawBat = (G, phi) => { const tp = tipOf(G, phi), kn = [G[0] - Math.sin(phi) * 14, G[1] + Math.cos(phi) * 14]; ctx.strokeStyle = "#caa46c"; ctx.lineWidth = 6; line(kn[0], kn[1], tp[0], tp[1]); ctx.lineWidth = 10; line(lerp(G[0], tp[0], .55), lerp(G[1], tp[1], .55), tp[0], tp[1]); }; if (t < tDrop) drawBat(sp.G, sp.phi); else { const u = seg(t, tDrop, tDrop + .45); ctx.save(); ctx.translate(spEnd.G[0] + 32 * u, Math.min(byp - 8, spEnd.G[1] + 150 * u * u)); ctx.rotate(u * 2.2); ctx.strokeStyle = "#caa46c"; ctx.lineWidth = 8; line(-6, 0, 80, 0); ctx.restore(); } }); });
    // --- runner from third: scores on a home run, freezes on a strikeout
    const rx = !W_ || t < 1.7 ? 420 : lerp(420, PLATE + 36, ease(seg(t, 1.7, 3.2))), ry = gy + dep - 14, rr = run(t, 11, .95), running = W_ && t > 1.7 && t < 3.2, up3 = W_ ? t > 3.2 : t > 1.9;
    add(ry, () => person(rx, ry - (W_ && t > 3.3 ? 24 * Math.abs(Math.sin((t - 3.3) * 6)) : 0), H, kit(T, { n: "5", d: -1, hat: "bat", helmet: T.j, l1: running ? rr.l1 : 0, l2: running ? rr.l2 : 0, k1: running ? rr.k1 : .1, k2: running ? rr.k2 : .1, a1: up3 ? (W_ ? 2.85 : 2.5) : running ? rr.a1 : .25, a2: up3 ? (W_ ? 2.7 : 2.4) : running ? rr.a2 : .25, e1: up3 ? (W_ ? .05 : 1.8) : running ? rr.e1 : .2, e2: up3 ? (W_ ? .05 : 1.7) : running ? rr.e2 : .2, lean: running ? .2 : 0 })));
    // --- win only: dugout empties, the batter trots home, the right fielder chases the ball to the wall
    [[0, 175, gy + dep * .15], [.2, 140, gy + dep * .4], [.4, 110, gy + dep * .92]].forEach(([dl, x1, y], i) => { if (!W_) return; const mv = seg(t, 3.4 + dl, 4.7 + dl), x = lerp(-120, x1 + 110, ease(mv)), hop = t > 4.7 + dl ? 22 * Math.abs(Math.sin((t - 4.7) * 6 + i * 2)) : 0, c = run(t, 11, .9); add(y, () => person(x, y - hop, H, kit(T, { n: String(30 + i * 7), hat: "cap", l1: mv > 0 && mv < 1 ? c.l1 : 0, l2: mv > 0 && mv < 1 ? c.l2 : 0, k1: mv > 0 && mv < 1 ? c.k1 : .1, k2: mv > 0 && mv < 1 ? c.k2 : .1, a1: t > 4.4 ? 2.85 : mv > 0 && mv < 1 ? c.a1 : .25, a2: t > 4.4 ? 2.7 : mv > 0 && mv < 1 ? c.a2 : .25, e1: t > 4.4 ? .05 : .3, e2: t > 4.4 ? .05 : .3, lean: .1 }))); });
    const hx2 = lerp(780, PLATE + 60, ease(seg(t, 4.6, 6.2))), hy2 = gy + dep * .66, hr = run(t, 8, .6), hm = t > 4.6 && t < 6.2;
    if (W_ && t > 4.6) add(hy2, () => person(hx2, hy2, H, kit(T, { n: "27", hat: "bat", helmet: T.j, d: -1, l1: hm ? hr.l1 : 0, l2: hm ? hr.l2 : 0, k1: hm ? hr.k1 : .1, k2: hm ? hr.k2 : .1, a1: 2.8, a2: 2.7, e1: .05, e2: .05, lean: .05 })));
    const ox = lerp(980, FENCE - 24, ease(seg(t, 1.9, 3.45))), oy = gy + dep * .55, oj = 60 * Math.sin(Math.PI * seg(t, 3.4, 4.1)), orun = run(t, 12, .95);
    if (W_) add(oy, () => person(ox, oy - oj, H, kit(O, { n: "9", d: 1, l1: t > 1.9 && t < 3.4 ? orun.l1 : (oj > 4 ? .6 : 0), l2: t > 1.9 && t < 3.4 ? orun.l2 : (oj > 4 ? -.2 : 0), k1: t > 1.9 && t < 3.4 ? orun.k1 : .3, k2: t > 1.9 && t < 3.4 ? orun.k2 : .3, a1: t > 3.35 ? 2.95 : orun.a1, a2: t > 3.35 ? 2.7 : orun.a2, e1: t > 3.35 ? .05 : .6, e2: t > 3.35 ? .05 : .6, lean: t > 3.35 ? -.1 : .12, glove: "#6b4a2b", pants: O.pn })));
    flush();
    // --- ball: pitch, then either the home run or the pitch that beats the bat and lands in the catcher's mitt
    const cont = tipOf(swingPose(tC).G, 1.5);
    let bx, by, ba = t * 12;
    const S0 = [pd.h1[0] - 20, pd.h1[1] - 12];
    if (t < pitchT) { bx = pd.h1[0] - 6; by = pd.h1[1]; }
    else if (W_ && t < tC) { const u = seg(t, pitchT, tC); bx = lerp(S0[0], cont[0], u); by = lerp(S0[1], cont[1], u * u * .3 + u * .7); }
    else if (W_) { const u = seg(t, tC, 4.6), p = arcPos(cont, [FENCE + 190, gy - 190], u, 470); bx = p[0]; by = p[1]; }
    else if (t < arrive) { const f = seg(t, pitchT, arrive); bx = lerp(S0[0], cg[0], f); by = S0[1] + (cg[1] - S0[1]) * Math.pow(f, .45); }
    else { bx = cg[0] + 3; by = cg[1] - 2; ba = 0; }
    fball("baseball", bx, by, 10.5, ba);
    if (W_ && t > 3.9) for (let k = 0; k < 3; k++) { const a = (t - 3.9 - k * .45) / 1.5; if (a > 0 && a < 1) { const cx0 = FENCE + 120 + k * 160, cy0 = gy - 330 - k * 25; for (let i = 0; i < 22; i++) { const an = i / 22 * 6.283, rr2 = a * 90; ctx.fillStyle = ["#ffd24a", "#ff5a5a", "#6fc3ff"][k]; ctx.globalAlpha = 1 - a; disc(cx0 + Math.cos(an) * rr2, cy0 + Math.sin(an) * rr2 + a * a * 30, 2.6); } ctx.globalAlpha = 1; } }
    if (W_) banner(t, 3.9);
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

  window.Bg = { _draw(c, list) { const prev = ctx; ctx = c; try { list.forEach(a => ballImpl(...a)); } finally { ctx = prev; } }, update, freeze(s, t) { phase = "finale"; sport = s; frozen = t; document.body.classList.add("finale"); start(); }, unfreeze() { frozen = null; } };
  if (window.__b4sync) window.__b4sync();   // game.js loads first: catch up with a round that is already in progress or finished
})();
