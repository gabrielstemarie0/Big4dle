(() => {
  const SPORTS = Object.keys(TEAMS);
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
  const CLIP_SECONDS = 15;   // how much of each song can be played
  const STEPS = ["Team song", "Fan base", "Mascot", "Home jersey colors"];
  const audio = new Audio(); audio.preload = "none";
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
      return hit ? hit.previewUrl : null;
    } catch { return null; }
  }

  function songFallback(box, why) {
    const h = HINTS[hintTeam.name], mask = maskFor(hintTeam);
    box.innerHTML = `<div class="cap">Team song</div><div class="val">${redacted(mask(h.s[0]))}</div><div class="sub">${redacted(mask(h.s[1]))}${why ? " · clip unavailable" : ""}</div>`;
  }

  function buildSong(box) {
    const h = HINTS[hintTeam.name];
    audio.pause(); audio.removeAttribute("src"); tried = false;
    if (h && h.u) audio.src = h.u;
    box.innerHTML = `<div class="cap">Team song</div><button class="play" type="button" aria-label="Play the team song"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="track" cx="32" cy="32" r="29"/><circle class="prog" cx="32" cy="32" r="29" pathLength="100"/><path class="i-play" d="M25 19L47 32L25 45Z"/><path class="i-pause" d="M24 20H30V44H24ZM34 20H40V44H34Z"/></svg></button><div class="sub">15-second clip</div>`;
    const btn = box.querySelector(".play");
    const recover = async () => {
      if (!tried && h) { tried = true; const u = await lookupPreview(h.s[0], h.s[1]); if (u) { audio.src = u; try { await audio.play(); return; } catch {} } }
      songFallback(box, true);
    };
    btn.onclick = async () => {
      if (!audio.paused) { audio.pause(); return; }
      if (!audio.getAttribute("src")) return recover();
      try { await audio.play(); } catch { recover(); }
    };
    audio.onplay = () => btn.classList.add("playing");
    audio.onpause = audio.onended = () => btn.classList.remove("playing");
    audio.ontimeupdate = () => {
      // Only the first 15 seconds of the preview are ever played.
      if (audio.currentTime >= CLIP_SECONDS) { audio.pause(); audio.currentTime = 0; btn.style.setProperty("--p", 0); return; }
      btn.style.setProperty("--p", (audio.currentTime / CLIP_SECONDS * 100).toFixed(1));
    };
    audio.onerror = () => { if (audio.getAttribute("src")) recover(); };
  }

  function buildHints(team) {
    hintTeam = team;
    const host = $("hints"); host.innerHTML = ""; boxes = [];
    for (let i = 0; i < 4; i++) { const d = document.createElement("div"); d.className = "hint locked"; d.dataset.step = i; host.append(d); boxes.push(d); }
  }

  function fillBox(i) {
    const box = boxes[i], h = HINTS[hintTeam.name] || {}, mask = maskFor(hintTeam);
    if (i === 0) buildSong(box);
    else if (i === 3) {
      const [a, b, c] = [hintTeam.c1, hintTeam.c2, hintTeam.c3];
      box.innerHTML = `<div class="bands"><i style="background:${a};flex:5"></i><i style="background:${b};flex:3"></i><i style="background:${c};flex:2"></i></div><div class="cap chip">Home jersey colors</div>`;
    } else {
      const v = i === 1 ? h.f : h.m;
      box.innerHTML = `<div class="cap">${STEPS[i]}</div>` + (v ? `<div class="val">${redacted(mask(v))}</div>` : `<div class="val none">${i === 1 ? "No known fan base name" : "No official mascot"}</div>`);
    }
  }

  function renderHints() {
    const open = over ? 4 : Math.min(4, guesses.length);   // nothing is open until the first guess
    boxes.forEach((box, i) => {
      if (i < open && box.classList.contains("locked")) { box.classList.remove("locked"); box.classList.add("open"); fillBox(i); }
      else if (i >= open && !box.classList.contains("locked")) { box.classList.add("locked"); box.classList.remove("open"); box.innerHTML = ""; }
      if (i >= open) box.textContent = i + 1;
    });
  }

  let edition = "current", mode = "daily", sport, pool, answer, guesses, over, won, key;

  function setup(m) {
    mode = m;
    const seed = m === "daily" ? today() : String(Math.random()) + Date.now();
    const r = rng(hash("big4dle:" + edition + ":" + seed));
    sport = SPORTS[Math.floor(r() * SPORTS.length)];
    pool = SPORTS.flatMap(s => TEAMS[s][edition]);
    const sp = pool.filter(t => t.sport === sport);
    answer = sp[Math.floor(r() * sp.length)].name;
    key = "b4-day-" + edition + "-" + seed;
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
  }

  function finish(restore) {
    over = true; won = guesses.includes(answer);
    render();
    $("status").textContent = "";
    $("end-title").textContent = won ? `Got it in ${guesses.length}! It's ${answer}.` : `It was ${answer}.`;
    const squares = guesses.map(g => g === answer ? "🟩" : pool.find(t => t.name === g).sport === sport ? "🟨" : "⬛").join("") + "⬜".repeat(Math.max(0, MAX - guesses.length));
    $("share-text").textContent = `Big4dle${edition === "alltime" ? " All-Time" : ""}${mode === "daily" ? " " + today() : ""} ${won ? guesses.length : "X"}/${MAX}\n${squares}`;
    const h = HINTS[answer];
    $("end-detail").textContent = h ? `Song: ${h.s[0]} (${h.s[1]}) · Fans: ${h.f || "none known"} · Mascot: ${h.m || "none"}` : "";
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
    edition = e;
    $("tab-current").setAttribute("aria-selected", e === "current");
    $("tab-alltime").setAttribute("aria-selected", e === "alltime");
    setup(m);
  }
  $("help-btn").onclick = () => $("help").showModal();
  $("tab-current").onclick = () => setEdition("current");
  $("tab-alltime").onclick = () => setEdition("alltime");
  // Links: ?practice opens a fresh random practice round; add &edition=alltime for the all-time pool.
  const q = new URLSearchParams(location.search);
  setEdition(q.get("edition") === "alltime" ? "alltime" : "current", q.has("practice") ? "practice" : "daily");
})();
