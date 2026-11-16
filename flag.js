// Draws the flag of a team's captain's country, repainted in the team's colors (flat, filling the whole board).
// The real flag layout is kept (cross, stripes, stars, maple leaf, ...); the colors are the team's.
function lum(hex) { const n = parseInt(hex.slice(1), 16); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(n >> 16) + .7152 * f(n >> 8 & 255) + .0722 * f(n & 255); }

// Flag-space (u, v in 0..1) -> picture space. The flag is flat and fills the whole 300x200 picture.
const FX = 0, FY = 0, FW = 300, FH = 200, S = 1.45;
const map = (u, v) => [FX + u * FW, FY + v * FH];
const U = px => px * S / FW, V = px => px * S / FH;      // shape sizes in pixels (scaled to the picture) -> flag-space

// Polygon in flag-space (edges can be subdivided with n).
function poly(pts, fill, n = 1, stroke) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [a, b] = [pts[i], pts[(i + 1) % pts.length]];
    for (let s = 0; s < n; s++) { const t = s / n; out.push(map(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t).map(x => x.toFixed(1)).join(",")); }
  }
  const st = stroke ? `fill="none" stroke="${stroke[0]}" stroke-width="${stroke[1]}" stroke-linejoin="round"` : `fill="${fill}" stroke="${fill}" stroke-width=".6" stroke-linejoin="round"`;
  return `<polygon points="${out.join(" ")}" ${st}/>`;
}
const box = (u0, v0, u1, v1, fill) => poly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], fill);
const disc = (cu, cv, R, fill, n = 36) => poly(Array.from({ length: n }, (_, i) => [cu + U(R * Math.cos(2 * Math.PI * i / n)), cv + V(R * Math.sin(2 * Math.PI * i / n))]), fill, 1);
const star = (cu, cv, R, fill, pts = 5, rot = -90) => poly(Array.from({ length: pts * 2 }, (_, i) => { const r = i % 2 ? R * (pts === 5 ? .382 : .45) : R, a = (rot + 180 * i / pts) * Math.PI / 180; return [cu + U(r * Math.cos(a)), cv + V(r * Math.sin(a))]; }), fill, 1);
const hbands = (cols, ratios) => { let v = 0, s = ratios.reduce((a, b) => a + b, 0), o = ""; cols.forEach((c, i) => { const h = ratios[i] / s; o += box(0, v, 1, v + h, c); v += h; }); return o; };
const vbands = (cols, ratios) => { let u = 0, s = ratios.reduce((a, b) => a + b, 0), o = ""; cols.forEach((c, i) => { const w = ratios[i] / s; o += box(u, 0, u + w, 1, c); u += w; }); return o; };
const nordic = (field, cross, inner, cu = .36, w = 20, wi = 8) => box(0, 0, 1, 1, field) + box(0, .5 - V(w / 2), 1, .5 + V(w / 2), cross) + box(cu - U(w / 2), 0, cu + U(w / 2), 1, cross) +
  (inner ? box(0, .5 - V(wi / 2), 1, .5 + V(wi / 2), inner) + box(cu - U(wi / 2), 0, cu + U(wi / 2), 1, inner) : "");
// Canadian maple leaf: the official outline (37 points, unit coordinates, y down).
const LEAF = [[0.045,1.0],[0.022,0.572],[0.077,0.523],[0.504,0.598],[0.446,0.439],[0.456,0.403],[0.923,0.025],[0.818,-0.024],[0.801,-0.064],[0.893,-0.347],[0.624,-0.29],[0.588,-0.309],[0.536,-0.432],[0.326,-0.206],[0.271,-0.235],[0.372,-0.757],[0.21,-0.663],[0.165,-0.676],[0.0,-1.0],[-0.165,-0.676],[-0.21,-0.663],[-0.372,-0.757],[-0.271,-0.235],[-0.326,-0.206],[-0.536,-0.432],[-0.588,-0.309],[-0.624,-0.29],[-0.893,-0.347],[-0.801,-0.064],[-0.818,-0.024],[-0.923,0.025],[-0.456,0.403],[-0.446,0.439],[-0.504,0.598],[-0.077,0.523],[-0.022,0.572],[-0.045,1.0]];
const leaf = (cu, cv, R, fill) => poly(LEAF.map(([x, y]) => [cu + U(x * R), cv + V(y * R)]), fill);

// Each flag: (A, B, C) = the team's primary, secondary and accent colors, assigned to the flag's colors in order.
const FLAGS = {
  us: (A, B, C) => { let o = ""; for (let i = 0; i < 13; i++) o += box(0, i / 13, 1, (i + 1) / 13, i % 2 ? C : A); o += box(0, 0, .42, 7 / 13, B);
    for (let r = 0; r < 9; r++) for (let c = 0; c < (r % 2 ? 5 : 6); c++) o += star(.42 * ((r % 2 ? 2 * c + 2 : 2 * c + 1) / 12), (r + .5) / 9 * (7 / 13), 2.6, C, 5); return o; },
  ca: (A, B, C) => box(0, 0, .25, 1, A) + box(.25, 0, .75, 1, C) + box(.75, 0, 1, 1, A) + leaf(.5, .5, 50, A),
  se: (A, B) => nordic(A, B, null, .34, 22),
  fi: (A, B, C) => nordic(C, A, null, .36, 22),
  no: (A, B, C) => nordic(A, C, B, .34, 24, 11),
  ru: (A, B, C) => hbands([A, B, C], [1, 1, 1]),
  cz: (A, B, C) => box(0, 0, 1, .5, A) + box(0, .5, 1, 1, B) + poly([[0, 0], [.5, .5], [0, 1]], C),
  ch: (A, B, C) => box(0, 0, 1, 1, A) + box(.5 - U(12), .5 - V(40), .5 + U(12), .5 + V(40), C) + box(.5 - U(40), .5 - V(12), .5 + U(40), .5 + V(12), C),
  de: (A, B, C) => hbands([A, B, C], [1, 1, 1]),
  fr: (A, B, C) => vbands([A, B, C], [1, 1, 1]),
  rs: (A, B, C) => hbands([A, B, C], [1, 1, 1]) + poly([[.2, .22], [.34, .22], [.34, .5], [.27, .62], [.2, .5]], A) + poly([[.23, .27], [.31, .27], [.31, .47], [.27, .54], [.23, .47]], C),
  gr: (A, B, C) => { let o = ""; for (let i = 0; i < 9; i++) o += box(0, i / 9, 1, (i + 1) / 9, i % 2 ? C : A); const w = 5 / 9 * FH / FW; o += box(0, 0, w, 5 / 9, A) + box(w / 2 - U(7), 0, w / 2 + U(7), 5 / 9, C) + box(0, 5 / 18 - V(7), w, 5 / 18 + V(7), C); return o; },
  si: (A, B, C) => hbands([C, B, A], [1, 1, 1]) + poly([[.1, .1], [.26, .1], [.26, .42], [.18, .55], [.1, .42]], B) + poly([[.12, .14], [.24, .14], [.24, .4], [.18, .5], [.12, .4]], C) + poly([[.13, .38], [.18, .24], [.23, .38]], A),
  cm: (A, B, C) => vbands([A, B, C], [1, 1, 1]) + star(.5, .5, 17, C),
  au: (A, B, C) => box(0, 0, 1, 1, A) + box(0, 0, .5, .5, A) +
    poly([[0, 0], [.07, 0], [.5, .5 - V(1)], [.5, .5], [.43, .5], [0, .05]], C, 14) + poly([[.5, 0], [.43, 0], [0, .5 - V(1)], [0, .5], [.07, .5], [.5, .05]], C, 14) +
    box(.25 - U(9), 0, .25 + U(9), .5, C) + box(0, .25 - V(9), .5, .25 + V(9), C) + box(.25 - U(5), 0, .25 + U(5), .5, B) + box(0, .25 - V(5), .5, .25 + V(5), B) +
    star(.25, .78, 19, C, 7) + star(.76, .15, 8, C, 7) + star(.64, .42, 8, C, 7) + star(.86, .4, 8, C, 7) + star(.76, .7, 8, C, 7),
  tr: (A, B, C) => box(0, 0, 1, 1, A) + disc(.36, .5, 34, C) + disc(.415, .5, 27, A) + star(.58, .5, 17, C, 5, -90),
  il: (A, B, C) => box(0, 0, 1, 1, C) + box(0, .09, 1, .24, A) + box(0, .76, 1, .91, A) +
    poly([[.5, .5 - V(34)], [.5 + U(29), .5 + V(17)], [.5 - U(29), .5 + V(17)]], "", 1, [A, 3]) + poly([[.5, .5 + V(34)], [.5 + U(29), .5 - V(17)], [.5 - U(29), .5 - V(17)]], "", 1, [A, 3]),
  lt: (A, B, C) => hbands([A, B, C], [1, 1, 1]),
  do: (A, B, C) => box(0, 0, .5, .5, A) + box(.5, 0, 1, .5, B) + box(0, .5, .5, 1, B) + box(.5, .5, 1, 1, A) + box(.5 - U(9), 0, .5 + U(9), 1, C) + box(0, .5 - V(9), 1, .5 + V(9), C),
  ve: (A, B, C) => { let o = hbands([A, B, C], [1, 1, 1]); for (let i = 0; i < 8; i++) { const a = (205 + i * 130 / 7) * Math.PI / 180; o += star(.5 + U(36 * Math.cos(a)), .66 + V(36 * Math.sin(a)), 5, A); } return o; },
  cu: (A, B, C) => { let o = ""; for (let i = 0; i < 5; i++) o += box(0, i / 5, 1, (i + 1) / 5, i % 2 ? C : A); return o + poly([[0, 0], [.4, .5], [0, 1]], B) + star(.13, .5, 16, C); },
  jp: (A, B, C) => box(0, 0, 1, 1, C) + disc(.5, .5, 36, A),
  pr: (A, B, C) => { let o = ""; for (let i = 0; i < 5; i++) o += box(0, i / 5, 1, (i + 1) / 5, i % 2 ? C : B); return o + poly([[0, 0], [.4, .5], [0, 1]], A) + star(.13, .5, 16, C); }
};

function flagSVG(t) {
  const { c1, c2, c3 } = t;
  const art = (FLAGS[t.cap && t.cap.country] || FLAGS.de)(c1, c2, c3);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" preserveAspectRatio="none" role="img" aria-label="Mystery flag in a team's colors">` +
    `<rect width="300" height="200" fill="${c1}"/>${art}</svg>`;
}
