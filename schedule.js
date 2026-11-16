// Daily team schedule. Every team gets one turn, in a random order, before any team repeats.
// When everyone has had a turn, a fresh random order starts. The order depends only on the date, so every player gets the same team.
// Days before SCHEME_START keep the old picker, so nobody's saved progress changes when this went live.
const SCHEME_START = "2026-11-18";

const schHash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const schRng = seed => () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const schDays = d => { const [y, m, day] = d.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, day) / 86400000); };

// All team names for an edition, in a fixed (alphabetical) order so the schedule never depends on list order.
const schNames = edition => Object.values(TEAMS).flatMap(s => s[edition].map(t => t.name)).sort();

// One cycle: every team exactly once, shuffled with a seed made from the edition and cycle number.
function schCycle(edition, cycle) {
  const a = schNames(edition), r = schRng(schHash(`big4dle-cycle:${edition}:${cycle}`));
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  // Never start a new cycle with the team that just finished the last one.
  if (cycle > 0) { const prev = schCycle(edition, cycle - 1); if (a[0] === prev[prev.length - 1]) [a[0], a[1]] = [a[1], a[0]]; }
  return a;
}

// Today's team name for an edition, or null for days that still use the old picker.
function dailyTeamName(edition, dateStr) {
  if (dateStr < SCHEME_START) return null;
  const n = schNames(edition).length, day = schDays(dateStr) - schDays(SCHEME_START);
  return schCycle(edition, Math.floor(day / n))[day % n];
}
