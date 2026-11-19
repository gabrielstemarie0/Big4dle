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
  let W = 0, H = 0, dpr = 1;
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = cf.width = W * dpr; cv.height = cf.height = H * dpr; }
  size(); addEventListener("resize", size);

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const line = (a, b, c, d) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); };
  const disc = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };

  /* ---------- the four balls, drawn like the logo ---------- */
  function ballImpl(kind, x, y, r, a) {
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
      const rx = r * 1.3, ry = r * .8;
      ctx.fillStyle = "#9a5528"; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineCap = "round"; ctx.lineWidth = r * .16;
      line(-rx * .55, -ry * .62, -rx * .55, ry * .62); line(rx * .55, -ry * .62, rx * .55, ry * .62);
      ctx.lineWidth = r * .1; line(-rx * .3, 0, rx * .3, 0);
      for (let i = -1; i <= 1; i++) line(i * rx * .17, -ry * .22, i * rx * .17, ry * .22);
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
  let TM = { j: "#4aa3ff", p: "#1b3a66", h: "#4aa3ff" }, OP = { j: "#e6e9ef", p: "#666", h: "#e6e9ef" };
  let phase = "none", kind = "basketball", balls = [], sport = "", finaleAt = 0, last = 0, running = false, frozen = null, watching = false;

  function spawn() {
    balls = [];
    const R = Math.min(34, Math.max(24, W / 16));
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * 6.283, sp = 110 + Math.random() * 90;
      balls.push({ x: R + Math.random() * (W - 2 * R), y: R + Math.random() * (H - 2 * R), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: R * (.85 + Math.random() * .3), a: Math.random() * 6, spin: (Math.random() - .5) * 3, pop: 0 });
    }
  }
  const lum = c => { const v = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
  const lift = c => { if (lum(c) > .1) return c; const v = [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * .6 + 255 * .4)); return "#" + v.map(x => x.toString(16).padStart(2, "0")).join(""); };
const dist = (a, c) => Math.hypot(...[1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16) - parseInt(c.slice(i, i + 2), 16)));
  function update(n, over, s, team, rival) {
    if (team) {
      TM = { j: lift(team.c1), p: lift(team.c2 === team.c1 ? team.c3 : team.c2), h: lift(team.c3 === team.c1 ? team.c2 : team.c3) };
      if (rival) OP = { j: lift(rival.c1), p: lift(rival.c2 === rival.c1 ? rival.c3 : rival.c2), h: lift(rival.c3 === rival.c1 ? rival.c2 : rival.c3) };
      else OP = lum(team.c1) > .55 ? { j: "#2f3545", p: "#20242f", h: "#2f3545" } : { j: "#e6e9ef", p: "#7a808c", h: "#e6e9ef" };
      // if both teams wear nearly the same colour, the rival switches to its second colour so they can be told apart
      if (rival && dist(TM.j, OP.j) < 110) { const alt = [rival.c2, rival.c3, "#f4f4f4"].map(lift).find(c => dist(TM.j, c) >= 110); OP = { j: alt, p: OP.p, h: OP.h }; }
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

  /* ---------- people ---------- */
  function personImpl(x, y, h, o) {
    const d = o.d || 1, lw = h * .12 * (o.fat || 1), leg = h * .46, tor = h * .34, arm = h * .3, lean = o.lean || 0;
    const hx = x, hy = y - leg, sx = hx + Math.sin(lean) * tor * d, sy = hy - Math.cos(lean) * tor;
    const P = (bx, by, ang, len) => [bx + Math.sin(ang) * len * d, by + Math.cos(ang) * len];
    const k1 = P(hx, hy, o.l1 || 0, leg), k2 = P(hx, hy, o.l2 || 0, leg);
    const a1 = o.a1 == null ? .25 : o.a1, a2 = o.a2 == null ? .25 : o.a2;
    const h1 = P(sx, sy, a1, arm), h2 = P(sx, sy, a2, arm);
    if (!o.dry) {
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(x, o.floor == null ? y : o.floor, h * .24, h * .045, 0, 0, 7); ctx.fill();
      ctx.lineCap = "round"; ctx.lineWidth = lw; ctx.strokeStyle = o.pants || "#39405a";
      line(hx, hy, k1[0], k1[1]); line(hx, hy, k2[0], k2[1]);
      ctx.strokeStyle = o.col; ctx.lineWidth = lw * 1.75; line(hx, hy, sx, sy);
      ctx.lineWidth = lw * .8; line(sx, sy, h2[0], h2[1]); line(sx, sy, h1[0], h1[1]);
      ctx.fillStyle = o.skin || "#e0b088"; disc(sx + Math.sin(lean) * h * .1 * d, sy - Math.cos(lean) * h * .1 - h * .02, h * .085);
      if (o.helmet) { ctx.fillStyle = o.helmet; ctx.beginPath(); ctx.arc(sx + Math.sin(lean) * h * .1 * d, sy - Math.cos(lean) * h * .1 - h * .03, h * .095, Math.PI, 0); ctx.fill(); }
    }
    return { h1, h2, s: [sx, sy], k1, k2 };
  }
  const person = (x, y, h, o) => o.dry ? personImpl(x, y, h, o) : onFront(() => personImpl(x, y, h, o));
  const run = (t, f = 11) => ({ l1: Math.sin(t * f) * .9, l2: -Math.sin(t * f) * .9, a1: .25 - Math.sin(t * f) * .9, a2: .25 + Math.sin(t * f) * .9 });

  /* ---------- scene helpers ---------- */
  let sc = { S: 1, ox: 0, oy: 0 };
  const setT = () => { const m = [dpr * sc.S, 0, 0, dpr * sc.S, dpr * sc.ox, dpr * sc.oy]; ctx.setTransform(...m); fx.setTransform(...m); };
  function backdrop(top, bottom, ground, gy) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ground; ctx.fillRect(0, sc.oy + gy * sc.S, W, H);
    setT();
  }
  function banner(...a) { onFront(() => bannerImpl(...a)); }
  function bannerImpl(t, at, big, small, col) {
    const u = seg(t, at, at + .35); if (!u) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // confetti
    const cols = ["#f28c28", "#fff", "#2e7d5b", "#e0b520", "#d62839", "#4aa3ff"], dt = t - at;
    for (let i = 0; i < 70; i++) {
      const x = ((i * 137.5) % 100) / 100 * W + Math.sin(dt * 2 + i) * 14, y2 = ((dt * (90 + (i % 7) * 26) + i * 53) % (H + 40)) - 20;
      ctx.fillStyle = cols[i % 6]; ctx.save(); ctx.translate(x, y2); ctx.rotate(dt * 3 + i); ctx.fillRect(-4, -2, 8, 4); ctx.restore();
    }
    setT();
  }

  /* ---------- scene 1: football, hail mary touchdown ---------- */
  function football(t) {
    const gy = 470, fy = gy + 40;
    backdrop("#050912", "#10233a", "#1b5e34", gy);
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3;
    for (let x = -1400; x < 2400; x += 90) line(x, gy, x - 36, gy + 120);
    ctx.fillStyle = "rgba(160,30,50,.55)"; ctx.fillRect(830, gy, 1500, 140);
    ctx.strokeStyle = "#f2c230"; ctx.lineWidth = 7; ctx.lineCap = "round"; // goalposts
    line(985, fy - 5, 985, fy - 150); line(985, fy - 150, 985, fy - 150); line(930, fy - 150, 1040, fy - 150); line(930, fy - 150, 930, fy - 290); line(1040, fy - 150, 1040, fy - 290);
    // players
    const qbx = 200 - 30 * seg(t, 0, 1.2), cock = ease(seg(t, 1.2, 1.6));
    const qb = { col: TM.j, helmet: TM.h, pants: TM.p, a1: t < 1.2 ? 1 : lerp(-.6, 2.7, cock), a2: t < 1.2 ? 1 : lerp(.3, 1.2, cock), lean: t < 1.2 ? 0 : lerp(-.12, .2, cock) };
    if (t < 1.2) Object.assign(qb, { l1: -Math.sin(t * 9) * .4, l2: Math.sin(t * 9) * .4 });
    const qp = person(qbx, fy, 170, qb);
    const rx = lerp(480, 850, ease(seg(t, .3, 4.4) * .5 + seg(t, .3, 4.4) * .5)) + 20 * seg(t, 4.9, 5.8);
    const jumpR = 62 * Math.sin(Math.PI * seg(t, 4.0, 4.9)), rrun = t < 4.0 || (t > 4.9 && t < 5.8);
    const hold = t < 3.9 ? 0 : t < 4.9 ? 2.9 : t < 5.5 ? .6 : 2.8;
    const rec = { col: TM.j, helmet: TM.h, pants: TM.p, a1: t < 3.7 ? run(t).a1 : hold, a2: t < 3.7 ? run(t).a2 : hold, l1: rrun ? run(t).l1 : jumpR > 5 ? .8 : 0, l2: rrun ? run(t).l2 : jumpR > 5 ? -.5 : 0 };
    const recDraw = (dry) => person(rx, fy - jumpR, 170, Object.assign({ floor: fy, dry }, rec));
    for (const [x0, x1, delay, c] of [[380, 805, 4.15, "#d62839"], [640, 912, 4.3, "#b3202f"]]) {
      const dx = lerp(x0, x1, ease(seg(t, .3, 4.5))), jj = 50 * Math.sin(Math.PI * seg(t, delay, delay + .8));
      const r2 = run(t, 11.5), up = t > delay - .2 && t < delay + .9;
      person(dx, fy - jj, 170, { col: OP.j, helmet: OP.h, pants: OP.p, floor: fy, d: 1, l1: t < 4.5 ? r2.l1 : 0, l2: t < 4.5 ? r2.l2 : 0, a1: up ? 2.6 : (t > 4.9 ? .2 : r2.a1), a2: up ? 2.3 : (t > 4.9 ? .2 : r2.a2) });
    }
    recDraw(false);
    // ball
    let bx, by, ba = t * 14;
    const rp = recDraw(true);
    if (t < 1.6) { bx = qp.h1[0]; by = qp.h1[1]; ba = -.3; }
    else if (t < 4.6) {
      const u = seg(t, 1.6, 4.6), e = person(rx, fy - 62 * Math.sin(Math.PI * seg(4.6, 4.0, 4.9)), 170, Object.assign({ floor: fy, dry: true }, rec, { a1: 2.9, a2: 2.9 })).h1;
      bx = lerp(qp.h1[0] + 12, e[0], u); by = lerp(qp.h1[1], e[1], u) - 4 * 240 * u * (1 - u); ba = t * 12;
    } else { bx = rp.h1[0]; by = rp.h1[1]; ba = -.5; }
    fball("football", bx, by, 15, ba);
    banner(t, 5.0, "TOUCHDOWN!", "Hail Mary caught in the end zone", "#f2c230");
  }

  /* ---------- scene 2: basketball, half-court buzzer beater ---------- */
  function basketball(t) {
    const gy = 470, fy = gy + 40, rimY = fy - 262, rimX = 850;
    backdrop("#0d0618", "#2a1740", "#8a5a2b", gy);
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 4; line(130, gy, 100, gy + 120); line(-1400, gy, 2400, gy);
    ctx.beginPath(); ctx.ellipse(130, gy + 60, 60, 38, 0, 0, 7); ctx.stroke();
    // hoop
    const swish = 3.7, buzz = t >= 1.5;
    ctx.strokeStyle = "#555"; ctx.lineWidth = 12; line(965, fy, 965, rimY - 90); line(965, rimY - 55, 905, rimY - 55);
    ctx.fillStyle = "#e9eef5"; ctx.fillRect(898, rimY - 105, 12, 125);
    if (buzz) { ctx.fillStyle = `rgba(255,40,40,${.55 + .45 * Math.sin(t * 18)})`; ctx.fillRect(891, rimY - 112, 5, 139); ctx.fillRect(912, rimY - 112, 5, 139); ctx.fillRect(891, rimY - 112, 26, 5); }
    ctx.strokeStyle = "#ff5a1f"; ctx.lineWidth = 6; ctx.lineCap = "round"; line(rimX - 28, rimY, 898, rimY);
    const sw = t > swish ? Math.sin((t - swish) * 18) * 7 * Math.exp(-(t - swish) * 3) : 0;
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2;
    for (let i = 0; i <= 5; i++) { const x0 = rimX - 26 + i * 10.4, x1 = rimX - 16 + i * 6.4; line(x0, rimY, x1 + sw, rimY + 56); }
    line(rimX - 22 + sw * .4, rimY + 18, rimX + 20 + sw * .4, rimY + 18); line(rimX - 18 + sw * .8, rimY + 36, rimX + 14 + sw * .8, rimY + 36);
    // shot clock
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,.8)"; ctx.fillRect(425, 28, 150, 56);
    ctx.font = "700 36px ui-monospace,Menlo,monospace"; ctx.textAlign = "center"; ctx.fillStyle = buzz ? (Math.sin(t * 18) > 0 ? "#ff4040" : "#a02020") : "#ff9a3c";
    ctx.fillText(`0:0${Math.max(0, 3 - t * 2).toFixed(1)}`, 500, 68); ctx.restore();
    // players
    const celeb = t > swish;
    for (const [x, c] of [[430, "#4aa3ff"], [560, "#4aa3ff"]]) {
      const j = celeb ? 28 * Math.abs(Math.sin((t - swish) * 6 + x)) : 0;
      person(x, fy - j, 170, { col: TM.j, pants: TM.p, floor: fy, a1: celeb ? 2.8 : .25, a2: celeb ? 2.7 : .25 });
    }
    const jump = 24 * Math.sin(Math.PI * seg(t, 1.15, 1.75));
    const shoot = ease(seg(t, 1.0, 1.5)), arms = t < 1 ? .9 : lerp(.9, 2.8, shoot);
    const sh = { col: TM.j, pants: TM.p, floor: fy, a1: t < 3.7 ? arms : 2.8, a2: t < 3.7 ? arms - .2 : 2.8, lean: t < 1 ? 0 : -.08, l1: t > 1.2 && t < 1.8 ? .3 : 0 };
    if (celeb) { Object.assign(sh); }
    const sp = person(100, fy - (celeb ? 28 * Math.abs(Math.sin((t - swish) * 6)) : jump), 170, sh);
    // ball
    let bx, by;
    if (t < 1.5) {
      if (t < 1.0) { bx = 128; by = fy - 18 - 95 * Math.abs(Math.sin(t * 5.2)); } else { bx = sp.h1[0]; by = sp.h1[1]; }
    } else if (t < swish) {
      const u = seg(t, 1.5, swish), x0 = sp.h1[0], y0 = sp.h1[1] - 2;
      bx = lerp(x0, rimX, u); by = lerp(y0, rimY + 4, u) - 4 * 300 * u * (1 - u);
    } else {
      const s = t - swish; bx = rimX - 8 * Math.min(1, s * 2) - Math.max(0, s - .6) * 90; by = rimY + 4 + 700 * s * s;
      const floor = fy - 17;
      if (by > floor) { const b = s - Math.sqrt((floor - rimY - 4) / 700); by = floor - 95 * Math.abs(Math.sin(b * 5.5)) * Math.exp(-b * 1.6); }
    }
    fball("basketball", bx, by, 17, t * 6);
    banner(t, 3.9, "BUZZER BEATER!", "Half-court shot to win it", "#ff9a3c");
  }

  /* ---------- scene 3: hockey, shootout winner ---------- */
  function hockey(t) {
    const gy = 470, fy = gy + 40;
    backdrop("#06101c", "#10263d", "#c4dcea", gy);
    ctx.fillStyle = "#e9eef2"; ctx.fillRect(-1400, gy - 70, 3800, 70); ctx.fillStyle = "#2a62a8"; ctx.fillRect(-1400, gy - 70, 3800, 8);
    ctx.strokeStyle = "rgba(210,40,60,.6)"; ctx.lineWidth = 5; line(440, gy, 410, gy + 120);
    ctx.strokeStyle = "rgba(180,200,215,.6)"; ctx.lineWidth = 3; ctx.lineCap = "round"; for (let i = 0; i < 4; i++) line(-100 + i * 260 - t * 0, fy + 40 - i * 8, 80 + i * 260, fy + 36 - i * 8);
    // goal (net on the right)
    const hit = t > 3.4, rip = hit ? Math.sin((t - 3.4) * 20) * 5 * Math.exp(-(t - 3.4) * 3) : 0;
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) { const yy = fy - 118 + i * 14; line(850, yy, 905 + rip, yy + 4); }
    for (let i = 0; i <= 5; i++) line(850 + i * 11, fy - 118, 905 + i * 5 + rip, fy - 8);
    ctx.strokeStyle = "#d62839"; ctx.lineWidth = 8; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(850, fy); ctx.lineTo(850, fy - 120); ctx.lineTo(905, fy - 112); ctx.stroke();
    if (hit) { ctx.fillStyle = `rgba(255,50,50,${.5 + .5 * Math.sin(t * 20)})`; ctx.save(); ctx.shadowColor = "#ff2020"; ctx.shadowBlur = 40; disc(880, fy - 160, 17); ctx.restore(); }
    // goalie
    const gk = ease(seg(t, 3.05, 3.7)), shiftx = -14 * ease(seg(t, 2.3, 2.9)) * (1 - gk);
    fx.save(); fx.translate(815 + shiftx - 34 * gk, fy); fx.rotate(-1.35 * gk);
    person(0, 0, 165, { col: OP.j, pants: OP.p, fat: 1.5, helmet: OP.h, d: 1, l1: .45, l2: -.45, a1: lerp(1.0, 2.2, gk), a2: lerp(1.2, .1, gk), lean: .15, floor: 0 });
    fx.restore();
    // shooter + puck
    const sx = lerp(-120, 560, ease(seg(t, 0, 3.0) * .7 + seg(t, 0, 3.0) * .3)) + 50 * seg(t, 3.4, 4.6), glide = t < 3.0 || t > 3.4;
    const st = Math.sin(t * 7) * .55;
    const arm = t < 3.0 ? .55 : t < 3.3 ? lerp(.55, 1.4, seg(t, 3.0, 3.3)) : 2.8;
    const sp = person(sx, fy, 170, { col: TM.j, pants: TM.p, helmet: TM.h, floor: fy, lean: .2, l1: st, l2: -st, a1: t > 3.4 ? 2.8 : arm, a2: t > 3.4 ? 2.8 : arm + .15 });
    const dangle = Math.sin(t * 5) * 28 * (1 - seg(t, 2.6, 3.0));
    const pk = [sx + 62 + dangle, fy - 9];
    if (t < 3.4) onFront(() => { ctx.strokeStyle = "#7a5a2e"; ctx.lineWidth = 6; line(sp.h1[0], sp.h1[1], pk[0] - 10, fy - 4); ctx.lineWidth = 9; line(pk[0] - 10, fy - 4, pk[0] - 26, fy - 3); });
    let bx, by;
    if (t < 3.0) { bx = pk[0]; by = pk[1]; }
    else if (t < 3.4) { const u = seg(t, 3.0, 3.4); bx = lerp(pk[0], 884, u); by = lerp(pk[1], fy - 100, u * u) - 40 * u * (1 - u); }
    else { const s = seg(t, 3.4, 4.0); bx = lerp(884, 897, s); by = lerp(fy - 100, fy - 20, s * s); }
    fball("puck", bx, by, 11, 0);
    // teammates pile in
    for (const [d, x1, c] of [[0, 470, "#4aa3ff"], [.25, 400, "#4aa3ff"]]) {
      const x = lerp(-150, x1, ease(seg(t, 3.7 + d, 5.6))), moving = t > 3.7 + d && t < 5.6, cc = Math.sin(t * 8) * .5;
      person(x, fy - (t > 5.6 ? 18 * Math.abs(Math.sin((t - 5.6) * 6)) : 0), 170, { col: TM.j, pants: TM.p, helmet: TM.h, floor: fy, l1: moving ? cc : 0, l2: moving ? -cc : 0, a1: t > 3.7 + d ? 2.8 : .25, a2: t > 3.7 + d ? 2.8 : .25 });
    }
    banner(t, 3.6, "SHOOTOUT WINNER!", "Top corner, game over", "#6fc3ff");
  }

  /* ---------- scene 4: baseball, walk-off home run ---------- */
  function baseball(t) {
    const gy = 470, fy = gy + 40;
    backdrop("#050a18", "#102844", "#1c5a2e", gy);
    ctx.fillStyle = "#0d3524"; ctx.fillRect(930, gy - 120, 1500, 125); ctx.fillStyle = "#f2c230"; ctx.fillRect(930, gy - 124, 1500, 6);
    ctx.fillStyle = "#6b4a2b"; ctx.beginPath(); ctx.ellipse(640, fy + 4, 120, 18, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#f2f2f2"; ctx.fillRect(612, fy - 2, 56, 7);
    ctx.fillStyle = "#6b4a2b"; ctx.beginPath(); ctx.ellipse(250, fy + 8, 120, 20, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(225, fy + 4); ctx.lineTo(275, fy + 4); ctx.lineTo(268, fy + 14); ctx.lineTo(232, fy + 14); ctx.closePath(); ctx.fill();
    // pitcher
    const w = t < .3 ? 0 : t < .6 ? seg(t, .3, .6) * 2.8 : lerp(2.8, 1.1, seg(t, .6, .9));
    const pt = { col: OP.j, pants: OP.p, helmet: OP.h, d: -1, floor: fy, a1: t > .9 ? lerp(1.1, .25, seg(t, .9, 1.2)) : w, a2: .3, l1: t > .3 && t < .75 ? -1.0 : 0, l2: 0 };
    const pp = person(640, fy, 170, pt);
    // batter
    const swing = ease(seg(t, 1.15, 1.55)), follow = ease(seg(t, 1.55, 1.95)), phi = t < 1.15 ? -.35 : t < 1.55 ? lerp(-.35, 1.4, swing) : lerp(1.4, 2.7, follow);
    const aa = t < 1.15 ? .9 : t < 1.55 ? lerp(.9, 1.3, swing) : lerp(1.3, 2.3, follow);
    const bxp = 190 + 130 * ease(seg(t, 2.0, 3.2));
    const bat = person(bxp, fy, 170, { col: TM.j, helmet: TM.h, pants: TM.p, a1: aa, a2: aa - .1, l1: t > 2.0 && t < 3.2 ? Math.sin(t * 9) * .6 : t > 1.3 ? .3 : 0, l2: t > 2.0 && t < 3.2 ? -Math.sin(t * 9) * .6 : 0, lean: t > 3.0 ? 0 : -.05 });
    const tip = (h, p) => [h[0] + Math.sin(p) * 95, h[1] - Math.cos(p) * 95];
    if (t < 2.1) onFront(() => { const bt = tip(bat.h1, phi); ctx.strokeStyle = "#c9a26b"; ctx.lineWidth = 8; ctx.lineCap = "round"; line(bat.h1[0], bat.h1[1], bt[0], bt[1]); });
    else onFront(() => { ctx.save(); ctx.translate(bat.h1[0] + 40 * seg(t, 2.1, 2.5), fy - 6 - 40 * Math.sin(Math.PI * seg(t, 2.1, 2.5))); ctx.rotate(seg(t, 2.1, 2.5) * 2.2); ctx.strokeStyle = "#c9a26b"; ctx.lineWidth = 8; ctx.lineCap = "round"; line(0, 0, 70, 0); ctx.restore(); });
    // runner scoring from third, then the mob
    const rx = lerp(560, 250, ease(seg(t, 1.7, 3.2)));
    const rr = run(t, 12), rrun = t > 1.7 && t < 3.2;
    person(rx, fy + 20 - (t > 3.3 ? 24 * Math.abs(Math.sin((t - 3.3) * 6)) : 0), 170, { col: TM.j, helmet: TM.h, pants: TM.p, d: -1, floor: fy + 20, l1: rrun ? rr.l1 : 0, l2: rrun ? rr.l2 : 0, a1: t > 3.2 ? 2.8 : rrun ? rr.a1 : .25, a2: t > 3.2 ? 2.8 : rrun ? rr.a2 : .25 });
    for (const [d, x1] of [[0, 175], [.2, 140], [.4, 105]]) {
      const x = lerp(-150, x1, ease(seg(t, 3.4 + d, 4.6 + d))), mv = t > 3.4 + d && t < 4.6 + d, c = run(t, 12);
      person(x, fy + 10 - (t > 4.6 + d ? 22 * Math.abs(Math.sin((t - 4.6) * 6 + d * 9)) : 0), 170, { col: TM.j, helmet: TM.h, pants: TM.p, floor: fy + 10, l1: mv ? c.l1 : 0, l2: mv ? c.l2 : 0, a1: t > 4.4 ? 2.8 : mv ? c.a1 : .25, a2: t > 4.4 ? 2.7 : mv ? c.a2 : .25 });
    }
    // ball: pitch, then home run
    const contact = tip(person(bxp, fy, 170, { a1: 1.3, a2: 1.2, dry: true, lean: -.05 }).h1, 1.4);
    let bx, by, ba = t * 10;
    if (t < .9) { bx = pp.h1[0]; by = pp.h1[1]; }
    else if (t < 1.55) { const u = seg(t, .9, 1.55), s0 = [610, fy - 165]; bx = lerp(s0[0], contact[0], u); by = lerp(s0[1], contact[1], u * u * .3 + u * .7); }
    else { const u = seg(t, 1.55, 4.6); bx = lerp(contact[0], 1130, u); by = lerp(contact[1], fy - 110, u) - 4 * 430 * u * (1 - u); }
    fball("baseball", bx, by, 11, ba);
    banner(t, 3.3, "WALK-OFF HOMER!", "Bottom of the ninth, ball game", "#ff6b5e");
  }

  const SCENES = { football, basketball, hockey, baseball };
  const LOOP = { football: 10.5, basketball: 9.5, hockey: 9.5, baseball: 10 };
  const STILL = { football: 6.2, basketball: 5.2, hockey: 5.0, baseball: 5.0 };

  /* ---------- main loop ---------- */
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, cf.width, cf.height);
    if (phase === "balls") {
      const k = reduce ? .25 : 1;
      for (const b of balls) {
        b.x += b.vx * dt * k; b.y += b.vy * dt * k; b.a += b.spin * dt * k;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } else if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); } else if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy); }
        const age = (now - b.pop) / 420, s = age < 1 ? 1 + .7 * Math.sin(Math.PI * age) : 1;
        ctx.globalAlpha = .95; ball(kind, b.x, b.y, b.r * s, b.a + (age < 1 ? age * 6 : 0)); ctx.globalAlpha = 1;
      }
    } else if (phase === "finale") {
      const f = SCENES[sport], L = LOOP[sport];
      const S = Math.min(W / 700, H / 600); sc = { S, ox: W / 2 - 500 * S, oy: H / 2 - 300 * S };
      const t = frozen != null ? frozen : reduce ? STILL[sport] : ((now - finaleAt) / 1000) % L;
      ctx.save(); fx.save(); f(t); fx.restore(); ctx.restore(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (watching) { ctx.font = "600 14px -apple-system,Segoe UI,Roboto,sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText("Tap anywhere to go back", W / 2, H - 22); }
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
