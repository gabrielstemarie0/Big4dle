(() => {
  const SPORTS = Object.keys(TEAMS);
  // All-time mode is locked for now. To unlock it, set this to false (everything else is already built).
  const ALLTIME_LOCKED = true;
  const MAX = 5;
  const $ = id => document.getElementById(id);

  // Seeded PRNG so everyone gets the same team on a given day (the reveal order is random per player).
  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  // Tiny ball icons shown next to each guess (the sport of the team guessed).
  const BALLS = {
    football: '<svg class="ball" viewBox="-10 -10 20 20" aria-hidden="true"><g transform="rotate(-35)"><ellipse rx="9.4" ry="6" fill="#9a5528" stroke="#1a1a1a" stroke-width=".9"/><path d="M-5 -4V4M5 -4V4" stroke="#fff" stroke-width="1.3"/><path d="M-2.4 0H2.4M-1.4 -1.6V1.6M0 -1.6V1.6M1.4 -1.6V1.6" stroke="#fff" stroke-width=".9"/></g></svg>',
    baseball: '<svg class="ball" viewBox="-10 -10 20 20" aria-hidden="true"><circle r="8.5" fill="#fff" stroke="#1a1a1a" stroke-width=".9"/><path d="M-4.9 -6.8Q-.4 0 -4.9 6.8M4.9 -6.8Q.4 0 4.9 6.8" fill="none" stroke="#d62839" stroke-width="1.5" stroke-linecap="round"/></svg>',
    basketball: '<svg class="ball" viewBox="-10 -10 20 20" aria-hidden="true"><circle r="8.5" fill="#f28c28" stroke="#1a1a1a" stroke-width=".9"/><path d="M-8.5 0H8.5M0 -8.5V8.5M-6.1 -6.1Q-1.7 0 -6.1 6.1M6.1 -6.1Q1.7 0 6.1 6.1" fill="none" stroke="#1a1a1a" stroke-width="1.1"/></svg>',
    hockey: '<svg class="ball" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M-8 -1.5V2.5A8 4 0 0 0 8 2.5V-1.5Z" fill="#1d1d1d" stroke="#9a9a9a" stroke-width=".9"/><ellipse cy="-1.5" rx="8" ry="4" fill="#4a4a4a" stroke="#9a9a9a" stroke-width=".9"/></svg>'
  };

  // ---- Hint board: four boxes, top-left to bottom-right. One more box opens after every guess.
  //      1 team song (play button) · 2 fan base · 3 mascot · 4 home jersey colours
  // Song hint follows Apple's preview-clip rules: the 30-second preview is streamed exactly as Apple returns it
  // (no trimming, looping, editing, downloading or caching), with the title/artist and a "Listen on Apple Music" link.
  const STEPS = ["Team song", "Fan base", "Mascot", "Home jersey colors"];
  const audio = new Audio(); audio.preload = "none"; audio.loop = false;
  const progress = () => { const d = audio.duration; return d && isFinite(d) ? audio.currentTime / d * 100 : audio.currentTime / 30 * 100; };
  let boxes = [], hintTeam = null, tried = false;
  const ALIAS = { Patriots: ["pats"], Buccaneers: ["bucs", "bucco"], Dolphins: ["phins", "phinsiders"], "49ers": ["niners", "niner"], Jaguars: ["jags"], Cardinals: ["cards"],
    Seahawks: ["hawks"], "Red Sox": ["sox"], "White Sox": ["sox"], "Blue Jays": ["jays"], Diamondbacks: ["dbacks", "d-backs"], Athletics: ["a's"], Canadiens: ["habs"],
    Penguins: ["pens"], Capitals: ["caps"], Hurricanes: ["canes", "caniacs"], Avalanche: ["avs"], Predators: ["preds", "smashville"], Mavericks: ["mavs"],
    Timberwolves: ["wolves", "twolves", "t-wolves"], Islanders: ["isles"], Senators: ["sens"], Lightning: ["bolts"], Coyotes: ["yotes"], Nationals: ["nats"],
    Bruins: ["b's"], Warriors: ["dub"], Raiders: ["raider"], Commanders: ["washington"], Knicks: ["knick"], Sixers: ["sixers"], "76ers": ["sixers"], Hornets: ["hornets"] };
  const GENERIC = new Set(["new", "los", "san", "bay", "city", "state", "north", "south", "west", "east", "the", "of"]);

  // Blank out words that would give the team away ("Steelers Nation" -> "████████ Nation").
  function maskFor(team) {
    const parts = `${team.city} ${team.name.slice(team.city.length)}`.replace(/\(.*?\)/g, " ").toLowerCase().split(/[^a-z0-9']+/).filter(w => w.length >= 3 && !GENERIC.has(w));
    const nick = team.name.slice(team.city.length).trim();
    const stems = new Set(parts.map(w => w.replace(/s$/, "")).filter(w => w.length >= 3).concat((ALIAS[nick] || []).map(w => w.replace(/s$/, ""))));
    return text => text.replace(/[A-Za-z0-9'’]+(?:-[A-Za-z0-9]+)*/g, w => {
      const lw = w.toLowerCase();
      for (const s of stems) if (lw.startsWith(s)) return w.replace(/[A-Za-z0-9]/g, "█");
      return w;
    });
  }

  const escHTML = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Blanked-out words (█) are drawn as a soft gray bar, not as bright text blocks.
  const redacted = text => escHTML(text).replace(/█+/g, run => `<span class="redact" style="width:${Math.min(run.length, 6) * .55}em"></span>`);

  async function lookupPreview(title, artist) {
    try {
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(title + " " + artist)}&media=music&entity=song&limit=10`);
      const hit = (await r.json()).results.find(x => x.previewUrl);
      return hit ? { previewUrl: hit.previewUrl, trackViewUrl: hit.trackViewUrl || null } : null;
    } catch { return null; }
  }

  function songFallback(face, why) {
    const h = HINTS[hintTeam.name], mask = maskFor(hintTeam);
    face.innerHTML = `<div class="cap">Team song</div><div class="val">${redacted(mask(h.s[0]))}</div><div class="sub">${redacted(mask(h.s[1]))}${why ? " · clip unavailable" : ""}</div>`;
  }

  // final = the revealed back of the card: same play button, with the real song under it (audio keeps playing if it already was).
  function buildSong(face, final = false) {
    const h = HINTS[hintTeam.name];
    if (!final) { audio.pause(); audio.removeAttribute("src"); tried = false; if (h && h.u) audio.src = h.u; }
    else if (!audio.getAttribute("src") && h && h.u) { audio.src = h.u; tried = false; }
    // Title + artist sit under the play button. Words that would give the team away are blanked out until the round ends,
    // and so is the Apple Music link (its page would show the real title).
    const mask = maskFor(hintTeam), t = final ? escHTML(h.s[0]) : redacted(mask(h.s[0])), ar = final ? escHTML(h.s[1]) : redacted(mask(h.s[1]));
    const giveaway = mask(h.s[0]) !== h.s[0] || mask(h.s[1]) !== h.s[1];
    const href = h.a ? escHTML(h.a) : "";
    const am = (final || !giveaway) ? `<div class="am"><a class="am-text" href="${href}" target="_blank" rel="noopener"${href ? "" : " hidden"}>Listen on Apple Music</a><a class="am-badge" href="${href}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"${href ? "" : " hidden"}><img src="apple-music-badge.svg" alt="" height="24"></a></div>` : "";
    const under = `<div class="val song">${t}</div><div class="sub artist">${ar}</div>${am}`;
    face.innerHTML = `<div class="cap">Team song</div><button class="play small" type="button" aria-label="Play the team song"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="track" cx="32" cy="32" r="29"/><circle class="prog" cx="32" cy="32" r="29" pathLength="100"/><path class="i-play" d="M25 19L47 32L25 45Z"/><path class="i-pause" d="M24 20H30V44H24ZM34 20H40V44H34Z"/></svg></button>${under}`;
    const btn = face.querySelector(".play");
    if (final) { btn.classList.toggle("playing", !audio.paused); btn.style.setProperty("--p", audio.currentTime ? progress().toFixed(1) : 0); }
    // Missing track link? Ask the iTunes search (same search the preview comes from) and use its trackViewUrl.
    const setLinks = u => face.querySelectorAll(".am a").forEach(el => { el.href = u; el.hidden = false; });
    if (!h.a && (final || !giveaway)) lookupPreview(h.s[0], h.s[1]).then(r => { if (r && r.trackViewUrl) setLinks(r.trackViewUrl); });
    const recover = async () => {
      if (!tried && h) { tried = true; const r = await lookupPreview(h.s[0], h.s[1]); if (r) { audio.src = r.previewUrl; if (r.trackViewUrl) setLinks(r.trackViewUrl); try { await audio.play(); return; } catch {} } }
      if (final) face.querySelector(".artist").textContent = `${h.s[1]} · clip unavailable`; else songFallback(face, true);
    };
    btn.onclick = async () => {
      if (!audio.paused) { audio.pause(); return; }
      if (!audio.getAttribute("src")) return recover();
      try { await audio.play(); } catch { recover(); }
    };
    audio.onplay = () => btn.classList.add("playing");
    audio.onpause = () => btn.classList.remove("playing");
    audio.onended = () => { btn.classList.remove("playing"); btn.style.setProperty("--p", 0); };
    audio.ontimeupdate = () => btn.style.setProperty("--p", progress().toFixed(1));
    audio.onerror = () => { if (audio.getAttribute("src")) recover(); };
  }

  function buildHints(team) {
    hintTeam = team;
    const host = $("hints"); host.innerHTML = ""; boxes = [];
    for (let i = 0; i < 4; i++) {
      const d = document.createElement("div"); d.className = "hint locked"; d.dataset.step = i;
      d.innerHTML = '<div class="flipper"><div class="face front"></div><div class="face back"></div></div>';
      host.append(d); boxes.push(d);
    }
  }

  // Front of a card: the hint as the player earns it (team names blanked out).
  function fillBox(i) {
    const face = boxes[i].querySelector(".front"), h = HINTS[hintTeam.name] || {}, mask = maskFor(hintTeam);
    if (i === 0) buildSong(face);
    else if (i === 3) {
      const [a, b, c] = [hintTeam.c1, hintTeam.c2, hintTeam.c3];
      face.innerHTML = `<div class="bands"><i style="background:${a};flex:5"></i><i style="background:${b};flex:3"></i><i style="background:${c};flex:2"></i></div><div class="cap chip">Home jersey colors</div>`;
    } else {
      const v = i === 1 ? h.f : h.m;
      face.innerHTML = `<div class="cap">${STEPS[i]}</div>` + (v ? `<div class="val">${redacted(mask(v))}</div>` : `<div class="val none">${i === 1 ? "No known fan base name" : "No official mascot"}</div>`);
    }
  }

  // Back of a card: the real answer, nothing blanked out.
  function fillBack(i) {
    const face = boxes[i].querySelector(".back"), h = HINTS[hintTeam.name] || {};
    if (i === 0) buildSong(face, true);
    else if (i === 3) {
      const [a, b, c] = [hintTeam.c1, hintTeam.c2, hintTeam.c3];
      face.innerHTML = `<div class="bands"><i style="background:${a};flex:5"></i><i style="background:${b};flex:3"></i><i style="background:${c};flex:2"></i></div><div class="namepill">${escHTML(hintTeam.name)}</div>`;
    } else {
      const v = i === 1 ? h.f : h.m;
      face.innerHTML = `<div class="cap">${STEPS[i]}</div>` + (v ? `<div class="val">${escHTML(v)}</div>` : `<div class="val none">${i === 1 ? "No known fan base name" : "No official mascot"}</div>`);
    }
  }

  // Cover art for the four locked cards (song, fans, mascot, colors): coloured tile, chunky 3D-style icon, label.
  const paw = (x, y, r, s) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 -3 C-9 -3 -12 6 -10 11 C-8 15 -3 13 0 13 C3 13 8 15 10 11 C12 6 9 -3 0 -3Z" fill="url(#cvp)"/><ellipse cx="-11" cy="-7" rx="3.6" ry="4.6" transform="rotate(-25 -11 -7)" fill="url(#cvp)"/><ellipse cx="-4" cy="-13" rx="3.6" ry="4.8" transform="rotate(-8 -4 -13)" fill="url(#cvp)"/><ellipse cx="4.5" cy="-13" rx="3.6" ry="4.8" transform="rotate(8 4.5 -13)" fill="url(#cvp)"/><ellipse cx="11.5" cy="-7" rx="3.6" ry="4.6" transform="rotate(25 11.5 -7)" fill="url(#cvp)"/></g>`;
  const COVERS = [
    { label: "Song", bg: "#a9621c", fg: "#b3a597", svg: `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="cvn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d73b4"/><stop offset="1" stop-color="#3a3560"/></linearGradient></defs><path d="M24 11 L51 5 V17 L24 23Z" fill="url(#cvn)"/><rect x="22" y="12" width="5.5" height="36" rx="2.7" fill="url(#cvn)"/><rect x="46" y="6" width="5.5" height="36" rx="2.7" fill="url(#cvn)"/><ellipse cx="16.5" cy="48" rx="10" ry="8" transform="rotate(-18 16.5 48)" fill="url(#cvn)"/><ellipse cx="40.5" cy="42" rx="10" ry="8" transform="rotate(-18 40.5 42)" fill="url(#cvn)"/><ellipse cx="13" cy="45" rx="3.5" ry="2" transform="rotate(-30 13 45)" fill="#fff" opacity=".28"/><ellipse cx="37" cy="39" rx="3.5" ry="2" transform="rotate(-30 37 39)" fill="#fff" opacity=".28"/><path d="M24 11 L51 5 V9 L24 15Z" fill="#fff" opacity=".18"/></svg>` },
    { label: "Fans", bg: "#adaba6", fg: "#575652", svg: `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="cvm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3a64a"/><stop offset="1" stop-color="#a8651f"/></linearGradient><linearGradient id="cvm2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0bd6a"/><stop offset="1" stop-color="#c58733"/></linearGradient></defs><g transform="rotate(-24 32 32)"><path d="M17 25 L48 11 V51 L17 39Z" fill="url(#cvm)"/><path d="M17 25 L48 11 V20 L17 31Z" fill="#fff" opacity=".18"/><ellipse cx="48" cy="31" rx="6" ry="20" fill="url(#cvm2)" stroke="#8c5518" stroke-width="2"/><ellipse cx="48" cy="31" rx="2.6" ry="14" fill="#7a4a14" opacity=".55"/><rect x="8" y="25" width="11" height="14" rx="4" fill="#c4802a"/><path d="M20 38 L30 41 L27 55 Q26 58 22 57 Q19 56 20 53Z" fill="#b8691c"/></g></svg>` },
    { label: "Mascot", bg: "#6c3c1c", fg: "#b9a999", svg: `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="cvp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a3c5d"/><stop offset="1" stop-color="#2a2236"/></linearGradient></defs>${paw(21, 24, -14, .9)}${paw(43, 44, 14, 1)}</svg>` },
    { label: "Colors", bg: "#1d1d1d", fg: "#a3a3a3", svg: `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="cvc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0a395"/><stop offset="1" stop-color="#b0746a"/></linearGradient></defs><path d="M32 7 C16 7 6 18 6 31 C6 45 18 57 30 57 C37 57 38 51 35 47 C32 43 35 39 40 39 H47 C55 39 59 33 59 27 C59 15 47 7 32 7Z" fill="url(#cvc)"/><path d="M32 7 C16 7 6 18 6 31 C6 33 7 35 7 36 C9 24 19 13 32 13 C44 13 53 18 57 26 C55 14 45 7 32 7Z" fill="#fff" opacity=".2"/><circle cx="47" cy="27" r="4.4" fill="#0f0f0f"/><circle cx="20" cy="24" r="4.3" fill="#c2336d"/><circle cx="31" cy="17" r="4.3" fill="#9a4ad8"/><circle cx="17" cy="36" r="4.3" fill="#1f9ca2"/><circle cx="26" cy="46" r="4.3" fill="#3b7fd9"/></svg>` }
  ];
  const coverHTML = i => { const c = COVERS[i]; return `<div class="cover" style="background:${c.bg};color:${c.fg}">${c.svg}<b>${c.label}</b></div>`; };

  function renderHints() {
    if (over) return;                                         // the finished board is handled by revealAll()
    const open = Math.min(4, guesses.length);                 // nothing is open until the first guess
    boxes.forEach((box, i) => {
      const face = box.querySelector(".front");
      if (i < open && box.classList.contains("locked")) { box.classList.remove("locked"); box.classList.add("open"); fillBox(i); }
      else if (i >= open && !box.classList.contains("locked")) { box.classList.add("locked"); box.classList.remove("open"); }
      if (i >= open && face.dataset.cover !== "1") { face.innerHTML = coverHTML(i); face.dataset.cover = "1"; }
      else if (i < open) delete face.dataset.cover;
    });
  }

  // End of the game: every card flips over (top-left to bottom-right) to show the real answer.
  function revealAll(animate) {
    boxes.forEach((box, i) => {
      const flipper = box.querySelector(".flipper");
      fillBack(i);
      flipper.style.transition = animate ? "" : "none";
      flipper.style.transitionDelay = animate ? `${i * 0.5}s` : "0s";
      requestAnimationFrame(() => requestAnimationFrame(() => flipper.classList.add("flipped")));
    });
  }

  let forcedSport = null, edition = "current", mode = "daily", sport, pool, answer, guesses, over, won, key, dayShown = null;

  function setup(m) {
    mode = m;
    const seed = m === "daily" ? today() : String(Math.random()) + Date.now();
    const r = rng(hash("big4dle:" + edition + ":" + seed));
    sport = SPORTS[Math.floor(r() * SPORTS.length)];
    if (m === "practice" && forcedSport) { sport = forcedSport; forcedSport = null; }   // ?practice&sport=hockey (first round only)
    pool = SPORTS.flatMap(s => TEAMS[s][edition]);
    const sp = pool.filter(t => t.sport === sport);
    answer = sp[Math.floor(r() * sp.length)].name;
    key = "b4-day-" + edition + "-" + seed;
    dayShown = m === "daily" ? seed : null;
    const saved = m === "daily" ? store.get(key, null) : null;
    if (m === "daily") {
      // Every team gets a turn before any repeats (see schedule.js). A saved game keeps its own answer.
      const scheduled = dailyTeamName(edition, seed);
      if (saved && saved.answer) answer = saved.answer; else if (scheduled) answer = scheduled;
      sport = pool.find(t => t.name === answer).sport;
    }
    guesses = saved ? saved.guesses : [];
    if (mode === "daily") store.set(key, { guesses, answer });
    over = false; won = false;
    $("mode-btn").textContent = m === "daily" ? "Daily" : "Practice";
    buildHints(pool.find(t => t.name === answer));
    $("end").hidden = true;
    $("guess").value = "";
    render(); updateButton();
    if (guesses.length && (guesses.includes(answer) || guesses.length >= MAX)) finish(true);
  }

  // Tell the animated background what the game looks like right now (also called by bg.js when it loads, which is after this file).
  function syncBg() {
    if (!window.Bg || !pool) return;
    const tm = pool.find(t => t.name === answer), rv = typeof RIVALS !== "undefined" && RIVALS[answer];
    Bg.update(guesses.length, over, sport, tm, rv && TEAMS[tm.sport].alltime.find(t => t.name === rv), won);
  }
  window.__b4sync = syncBg;

  function render() {
    renderHints();
    const ol = $("guesses"); ol.innerHTML = "";
    const target = pool.find(t => t.name === answer);
    guesses.forEach(name => {
      const t = pool.find(x => x.name === name), li = document.createElement("li");
      // right team: the whole row turns green. right sport (wrong team): only the ball is highlighted yellow.
      li.className = name === answer ? "ok" : t.sport === sport ? "close" : "";
      const n = document.createElement("span"); n.className = "name"; n.textContent = name;
      const right = document.createElement("span"); right.className = "right";
      right.innerHTML = `<span class="ballwrap">${BALLS[t.sport]}</span>`;
      const km = document.createElement("span"); km.className = "km";
      km.textContent = `${kmBetween(t.loc, target.loc).toLocaleString("en-US")} km`;
      right.append(km); li.append(n, right); ol.append(li);
    });
    $("status").textContent = over ? "" : `Guess ${guesses.length + 1} of ${MAX}`;
    $("submit").disabled = $("guess").disabled = over;
    syncBg();
  }

  function finish(restore) {
    over = true; won = guesses.includes(answer);
    render();
    $("status").textContent = "";
    $("end-title").textContent = won ? `Got it in ${guesses.length}!` : "Out of guesses";
    const squares = guesses.map(g => g === answer ? "🟩" : pool.find(t => t.name === g).sport === sport ? "🟨" : "⬛").join("") + "⬜".repeat(Math.max(0, MAX - guesses.length));
    $("share-text").textContent = `Big4dle${edition === "alltime" ? " All-Time" : ""}${mode === "daily" ? " " + today() : ""} ${won ? guesses.length : "X"}/${MAX}\n${squares}\nthedailystation.com/big4dle`;
    revealAll(!restore);
    $("end").hidden = false;
    if (mode === "daily" && !restore) recordStats();
    showStats();
  }

  function recordStats() {
    const s = store.get("b4-stats-" + edition, { played: 0, wins: 0, streak: 0, last: "", dist: [0, 0, 0, 0, 0, 0] });
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yest = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
    s.played++;
    if (won) { s.wins++; s.dist[guesses.length - 1]++; s.streak = s.last === yest || s.streak === 0 ? s.streak + 1 : 1; } else s.streak = 0;
    s.last = today();
    store.set("b4-stats-" + edition, s);
  }

  function showStats() {
    const s = store.get("b4-stats-" + edition, { played: 0, wins: 0, streak: 0 });
    $("streak").textContent = s.streak;
    $("stats").textContent = `Played ${s.played} · Won ${s.played ? Math.round(100 * s.wins / s.played) : 0}% · Streak ${s.streak}`;
  }

  // Autocomplete: every team, so nothing about the sport is given away
  const candidates = () => pool.map(t => t.name);
  let matches = [], sel = -1;
  // Picking a suggestion only fills the search box (see choose below); nothing is submitted.
  function options() {
    const q = $("guess").value.trim().toLowerCase();
    matches = q ? candidates().filter(n => n.toLowerCase().includes(q) && !guesses.includes(n)) : [];
    
    sel = matches.length ? 0 : -1;
    const ul = $("options"); ul.innerHTML = "";
    matches.forEach((c, i) => { const li = document.createElement("li"); li.textContent = c; li.setAttribute("role", "option"); if (i === sel) li.className = "on"; li.onmousedown = e => { e.preventDefault(); choose(c); }; ul.append(li); });
    ul.hidden = !matches.length;
  }
  function move(d) { if (!matches.length) return; sel = (sel + d + matches.length) % matches.length; [...$("options").children].forEach((li, i) => li.className = i === sel ? "on" : ""); }

  function submit(code) {
    if (over || !code || guesses.includes(code)) return;
    guesses.push(code);
    if (mode === "daily") store.set(key, { guesses, answer });
    $("guess").value = ""; options();
    if (code === answer || guesses.length >= MAX) finish(false); else render();
  }

  $("guess").addEventListener("input", () => { options(); updateButton(); });
  $("guess").addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Escape") $("options").hidden = true;
  });
  $("guess").addEventListener("blur", () => setTimeout(() => $("options").hidden = true, 100));
  // A guess is only ever sent when the box holds a full team name and the player presses Guess / Enter.
  const exactMatch = () => { const q = $("guess").value.trim().toLowerCase(); return candidates().find(n => n.toLowerCase() === q && !guesses.includes(n)) || null; };
  function updateButton() { $("submit").classList.toggle("soft", !exactMatch()); }
  function choose(name) { $("guess").value = name; matches = []; sel = -1; $("options").hidden = true; updateButton(); }
  let noticeTimer;
  function notice(msg) {
    $("status").textContent = msg; $("status").classList.add("warn");
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { $("status").classList.remove("warn"); $("status").textContent = over ? "" : `Guess ${guesses.length + 1} of ${MAX}`; }, 2200);
  }
  $("form").addEventListener("submit", e => {
    e.preventDefault();
    const exact = exactMatch();
    if (exact) { submit(exact); updateButton(); return; }
    // Not a full team name yet: never guess on the player's behalf.
    if (matches.length && sel >= 0) { choose(matches[sel]); notice("Press Guess to confirm"); return; }   // Enter on a highlighted suggestion fills the box; press Enter/Guess again to submit
    notice($("guess").value.trim() ? "Pick a team from the list" : "Type a team first");
  });
  $("copy").onclick = async () => { try { await navigator.clipboard.writeText($("share-text").textContent); $("copy").textContent = "Copied!"; } catch { $("copy").textContent = "Copy failed"; } setTimeout(() => $("copy").textContent = "Copy result", 1500); };
  $("practice").onclick = () => setup("practice");
  $("mode-btn").onclick = () => setup(mode === "daily" ? "practice" : "daily");

  function setEdition(e, m = "daily") {
    if (ALLTIME_LOCKED && e === "alltime") e = "current";
    edition = e;
    $("tab-current").setAttribute("aria-selected", e === "current");
    $("tab-alltime").setAttribute("aria-selected", e === "alltime");
    setup(m);
  }
  $("help-btn").onclick = () => $("help").showModal();
  $("tab-current").onclick = () => setEdition("current");
  if (ALLTIME_LOCKED) {
    const tab = $("tab-alltime");
    tab.classList.add("locked"); tab.setAttribute("aria-disabled", "true"); tab.title = "Locked for now";
    tab.innerHTML = 'All-time <span aria-hidden="true">🔒</span>';
    tab.onclick = () => notice("All-time is locked for now");
  } else $("tab-alltime").onclick = () => setEdition("alltime");
  // Feedback: sent to /api/feedback, which stores it privately for the site owner.
  const fbDlg = $("feedback"), fbStatus = $("fb-status");
  $("fb-open").onclick = () => { fbStatus.textContent = ""; fbStatus.className = "fb-status"; $("fb-send").disabled = false; fbDlg.showModal(); };
  $("fb-cancel").onclick = () => fbDlg.close();
  $("fb-form").addEventListener("submit", async e => {
    e.preventDefault();
    const message = $("fb-msg").value.trim();
    if (message.length < 3) { fbStatus.textContent = "Please write a little more."; fbStatus.className = "fb-status err"; return; }
    $("fb-send").disabled = true; fbStatus.className = "fb-status"; fbStatus.textContent = "Sending...";
    try {
      const res = await fetch("api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        kind: $("fb-kind").value, message, website: $("fb-hp").value,
        team: answer, edition, mode, day: dayShown || today(), guesses: guesses.length, viewport: `${innerWidth}x${innerHeight}`
      }) });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) { fbStatus.className = "fb-status ok"; fbStatus.textContent = "Thanks, sent!"; $("fb-msg").value = ""; setTimeout(() => { if (fbDlg.open) fbDlg.close(); }, 1400); }
      else { fbStatus.className = "fb-status err"; fbStatus.textContent = out.error || "Couldn't send. Please try again."; $("fb-send").disabled = false; }
    } catch { fbStatus.className = "fb-status err"; fbStatus.textContent = "Couldn't send. Check your connection and try again."; $("fb-send").disabled = false; }
  });

  // New day: if the date changes while the page is open (past midnight, or coming back to the tab), load the new puzzle.
  function checkNewDay() {
    if (mode === "daily" && dayShown && today() !== dayShown) { setup("daily"); notice("New day, new puzzle!"); }
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkNewDay(); });
  window.addEventListener("focus", checkNewDay);
  setInterval(checkNewDay, 30000);

  // Links: ?practice opens a fresh random practice round; add &edition=alltime for the all-time pool.
  const q = new URLSearchParams(location.search);
  forcedSport = SPORTS.includes(q.get("sport")) ? q.get("sport") : null;
  setEdition(q.get("edition") === "alltime" ? "alltime" : "current", q.has("practice") ? "practice" : "daily");
  // Preview links: ?practice&sport=hockey&demo=win (or lose) plays that round through so the ending can be viewed. Practice only; nothing is saved.
  if (mode === "practice" && (q.get("demo") === "win" || q.get("demo") === "lose")) {
    if (q.get("demo") === "win") submit(answer);
    else pool.filter(t => t.name !== answer).slice(5, 10).forEach(t => submit(t.name));
  }
})();
